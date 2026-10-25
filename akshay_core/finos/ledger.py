"""Deterministic Double-Entry Accounting Engine for Akshay FinOS.

Security and Integrity Guarantees:
1. Zero LLM Arithmetic: All balances and sums are computed directly in SQL using integer cents.
2. Invariant Enforcement: Sum of Debits MUST equal Sum of Credits for every transaction.
3. 100% Parameterized Queries: Prevents SQL injection attacks unconditionally.
4. ACID Transactions: Atomicity guaranteed with SQLite BEGIN IMMEDIATE transactions.
"""

from __future__ import annotations
import os
import sqlite3
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any

from akshay_core.security.validator import validate_identifier, sanitize_text, SecurityValidationError
from akshay_core.security.audit_logger import get_audit_logger
from akshay_core.finos.models import (
    AccountType,
    TransactionCreate,
    MultiSplitTransactionCreate,
    AccountResponse,
    SpendingCategorySummary,
)


class LedgerIntegrityError(Exception):
    """Raised when double-entry accounting balance invariants are violated."""
    pass


class FinOSLedger:
    """Secure, deterministic, double-entry financial ledger."""

    def __init__(self, db_path: str | Path = ":memory:"):
        """Initializes the ledger database.
        
        Args:
            db_path: Path to the SQLite database file, or ':memory:' for transient storage.
        """
        self.db_path = str(db_path)
        if self.db_path != ":memory:":
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
            
        self.audit = get_audit_logger()
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA foreign_keys = ON;")
        self._init_database()

    def _get_connection(self) -> sqlite3.Connection:
        """Returns the configured SQLite connection with foreign keys and strict typing enabled."""
        return self._conn

    def _init_database(self) -> None:
        """Sets up tables with strict relational integrity."""
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    account_type TEXT NOT NULL CHECK(account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
                    currency TEXT NOT NULL DEFAULT 'INR',
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    description TEXT NOT NULL,
                    category TEXT,
                    note TEXT,
                    source TEXT NOT NULL DEFAULT 'manual',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS splits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
                    account_id INTEGER NOT NULL REFERENCES accounts(id),
                    amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
                    is_debit INTEGER NOT NULL CHECK(is_debit IN (0, 1))
                );

                CREATE INDEX IF NOT EXISTS idx_splits_account ON splits(account_id);
                CREATE INDEX IF NOT EXISTS idx_splits_tx ON splits(transaction_id);
                CREATE INDEX IF NOT EXISTS idx_transactions_time ON transactions(timestamp);
            """)
            conn.commit()

    @staticmethod
    def _decimal_to_cents(amount: Decimal) -> int:
        """Safely converts Decimal currency to integer cents to eliminate floating-point drift."""
        return int((amount * 100).to_integral_value())

    @staticmethod
    def _cents_to_decimal(cents: int) -> Decimal:
        """Converts integer cents back to Decimal currency."""
        return Decimal(cents) / Decimal(100)

    def create_account(
        self,
        name: str,
        account_type: AccountType,
        currency: str = "INR",
    ) -> int:
        """Registers a new account in the chart of accounts.
        
        Args:
            name: Hierarchical account identifier (e.g. 'Assets:Bank:HDFC').
            account_type: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE.
            currency: ISO-4217 currency code.
            
        Returns:
            The account id.
            
        Raises:
            SecurityValidationError: If the account identifier is invalid.
        """
        valid_name = validate_identifier(name, field_name="account_name")
        valid_currency = validate_identifier(currency.upper(), field_name="currency")
        
        now_iso = datetime.now(timezone.utc).isoformat()
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO accounts (name, account_type, currency, created_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET is_active = 1
                RETURNING id;
                """,
                (valid_name, account_type.value, valid_currency, now_iso),
            )
            row = cursor.fetchone()
            conn.commit()
            account_id = row[0]

        self.audit.log_event(
            event_type="FIN_ACCOUNT_CREATED",
            severity="INFO",
            action=f"Account created: {valid_name}",
            details={"account_id": account_id, "type": account_type.value, "currency": valid_currency},
        )
        return account_id

    def get_or_create_account(self, name: str, default_type: AccountType) -> int:
        """Convenience method to retrieve account ID or create it if missing."""
        valid_name = validate_identifier(name, field_name="account_name")
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM accounts WHERE name = ?;", (valid_name,))
            row = cursor.fetchone()
            if row:
                return row[0]
                
        return self.create_account(valid_name, default_type)

    def record_transaction(self, tx: TransactionCreate) -> int:
        """Records a standard 2-legged balanced double-entry transaction.
        
        Args:
            tx: Transaction creation payload.
            
        Returns:
            The created transaction ID.
        """
        clean_desc = sanitize_text(tx.description, max_length=255, field_name="description")
        clean_cat = sanitize_text(tx.category, max_length=64, field_name="category") if tx.category else None
        clean_note = sanitize_text(tx.note, max_length=500, field_name="note") if tx.note else None
        
        amount_cents = self._decimal_to_cents(tx.amount)
        if amount_cents <= 0:
            raise LedgerIntegrityError("Transaction amount must be strictly greater than 0")

        # Resolve accounts
        debit_acc_id = self.get_or_create_account(
            tx.debit_account,
            AccountType.EXPENSE if "Expense" in tx.debit_account else AccountType.ASSET
        )
        credit_acc_id = self.get_or_create_account(
            tx.credit_account,
            AccountType.REVENUE if "Revenue" in tx.credit_account else AccountType.ASSET
        )

        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE TRANSACTION;")
            try:
                # 1. Insert header
                cursor.execute(
                    """
                    INSERT INTO transactions (timestamp, description, category, note, source, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    RETURNING id;
                    """,
                    (now_iso, clean_desc, clean_cat, clean_note, tx.source, now_iso),
                )
                tx_id = cursor.fetchone()[0]

                # 2. Insert Debit Split
                cursor.execute(
                    """
                    INSERT INTO splits (transaction_id, account_id, amount_cents, is_debit)
                    VALUES (?, ?, ?, 1);
                    """,
                    (tx_id, debit_acc_id, amount_cents),
                )

                # 3. Insert Credit Split
                cursor.execute(
                    """
                    INSERT INTO splits (transaction_id, account_id, amount_cents, is_debit)
                    VALUES (?, ?, ?, 0);
                    """,
                    (tx_id, credit_acc_id, amount_cents),
                )

                conn.commit()
            except Exception as e:
                conn.rollback()
                self.audit.log_event(
                    event_type="FIN_TX_FAILED",
                    severity="ERROR",
                    action=f"Transaction failed: {clean_desc}",
                    details={"error": str(e)},
                    success=False,
                )
                raise

        self.audit.log_event(
            event_type="FIN_TX_RECORDED",
            severity="INFO",
            action=f"Transaction recorded: {clean_desc} ({tx.amount} {tx.currency})",
            details={
                "tx_id": tx_id,
                "amount": str(tx.amount),
                "debit": tx.debit_account,
                "credit": tx.credit_account,
                "category": clean_cat,
            },
        )
        return tx_id

    def record_multi_split_transaction(self, tx: MultiSplitTransactionCreate) -> int:
        """Records a multi-split transaction ensuring Debits == Credits."""
        clean_desc = sanitize_text(tx.description, max_length=255, field_name="description")
        clean_note = sanitize_text(tx.note, max_length=500, field_name="note") if tx.note else None
        
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Verify split balance in cents
        total_debit_cents = 0
        total_credit_cents = 0
        split_records = []

        for split in tx.splits:
            acc_id = self.get_or_create_account(
                split.account_name,
                AccountType.EXPENSE if split.is_debit else AccountType.ASSET
            )
            cents = self._decimal_to_cents(split.amount)
            if split.is_debit:
                total_debit_cents += cents
            else:
                total_credit_cents += cents
            split_records.append((acc_id, cents, 1 if split.is_debit else 0))

        if total_debit_cents != total_credit_cents:
            raise LedgerIntegrityError(
                f"Multi-split transaction is unbalanced: Debits ({total_debit_cents}c) != Credits ({total_credit_cents}c)"
            )

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("BEGIN IMMEDIATE TRANSACTION;")
            try:
                cursor.execute(
                    """
                    INSERT INTO transactions (timestamp, description, category, note, source, created_at)
                    VALUES (?, ?, ?, ?, 'multi-split', ?)
                    RETURNING id;
                    """,
                    (now_iso, clean_desc, "Multi-Split", clean_note, now_iso),
                )
                tx_id = cursor.fetchone()[0]

                for acc_id, cents, is_debit in split_records:
                    cursor.execute(
                        """
                        INSERT INTO splits (transaction_id, account_id, amount_cents, is_debit)
                        VALUES (?, ?, ?, ?);
                        """,
                        (tx_id, acc_id, cents, is_debit),
                    )

                conn.commit()
            except Exception as e:
                conn.rollback()
                raise

        return tx_id

    def get_account_balance(self, account_name: str) -> Decimal:
        """Calculates deterministic balance for an account according to normal balance rules:
        - ASSET / EXPENSE normal balance: Debits - Credits
        - LIABILITY / EQUITY / REVENUE normal balance: Credits - Debits
        """
        valid_name = validate_identifier(account_name, field_name="account_name")
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT 
                    a.account_type,
                    COALESCE(SUM(CASE WHEN s.is_debit = 1 THEN s.amount_cents ELSE 0 END), 0) AS total_debits,
                    COALESCE(SUM(CASE WHEN s.is_debit = 0 THEN s.amount_cents ELSE 0 END), 0) AS total_credits
                FROM accounts a
                LEFT JOIN splits s ON a.id = s.account_id
                WHERE a.name = ?
                GROUP BY a.id, a.account_type;
                """,
                (valid_name,),
            )
            row = cursor.fetchone()
            if not row:
                raise SecurityValidationError(f"Account '{valid_name}' does not exist")

            acc_type = row["account_type"]
            debits = row["total_debits"]
            credits = row["total_credits"]

            if acc_type in ("ASSET", "EXPENSE"):
                balance_cents = debits - credits
            else:
                balance_cents = credits - debits

            return self._cents_to_decimal(balance_cents)

    def get_net_worth(self) -> Decimal:
        """Calculates Net Worth = Total Assets - Total Liabilities."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT 
                    a.account_type,
                    COALESCE(SUM(CASE WHEN s.is_debit = 1 THEN s.amount_cents ELSE 0 END), 0) AS debits,
                    COALESCE(SUM(CASE WHEN s.is_debit = 0 THEN s.amount_cents ELSE 0 END), 0) AS credits
                FROM accounts a
                LEFT JOIN splits s ON a.id = s.account_id
                WHERE a.account_type IN ('ASSET', 'LIABILITY')
                GROUP BY a.account_type;
                """
            )
            rows = cursor.fetchall()

            total_assets = 0
            total_liabilities = 0
            for r in rows:
                if r["account_type"] == "ASSET":
                    total_assets = r["debits"] - r["credits"]
                elif r["account_type"] == "LIABILITY":
                    total_liabilities = r["credits"] - r["debits"]

            net_cents = total_assets - total_liabilities
            return self._cents_to_decimal(net_cents)

    def get_spending_by_category(self) -> List[SpendingCategorySummary]:
        """Returns deterministic aggregated expenses grouped by category."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT 
                    COALESCE(t.category, 'Uncategorized') AS category,
                    SUM(s.amount_cents) AS total_cents,
                    COUNT(DISTINCT t.id) AS tx_count
                FROM transactions t
                JOIN splits s ON t.id = s.transaction_id
                JOIN accounts a ON s.account_id = a.id
                WHERE a.account_type = 'EXPENSE' AND s.is_debit = 1
                GROUP BY category
                ORDER BY total_cents DESC;
                """
            )
            rows = cursor.fetchall()
            return [
                SpendingCategorySummary(
                    category=r["category"],
                    total_spent=self._cents_to_decimal(r["total_cents"]),
                    transaction_count=r["tx_count"],
                    currency="INR",
                )
                for r in rows
            ]

    def verify_global_invariants(self) -> bool:
        """Global sanity check verifying that sum of all debits across the database equals sum of all credits."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT 
                    COALESCE(SUM(CASE WHEN is_debit = 1 THEN amount_cents ELSE 0 END), 0) AS total_debits,
                    COALESCE(SUM(CASE WHEN is_debit = 0 THEN amount_cents ELSE 0 END), 0) AS total_credits
                FROM splits;
                """
            )
            row = cursor.fetchone()
            total_debits = row["total_debits"]
            total_credits = row["total_credits"]
            
            if total_debits != total_credits:
                raise LedgerIntegrityError(
                    f"CRITICAL LEDGER CORRUPTION: Global debits ({total_debits}) != Global credits ({total_credits})"
                )
            return True
