"""Native Backend Gateway for Akshay Personal Assistant & FinOS.

Serves the HUD frontend and provides local REST API endpoints connected
directly to `akshay_core` (FinOS double-entry ledger, security validator, and audit logs).
Requires zero third-party dependencies (built with Python standard library).
"""

from __future__ import annotations
import http.server
import json
import socketserver
import sys
import urllib.parse
from decimal import Decimal
from pathlib import Path

# Add project root to sys.path to import akshay_core
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from akshay_core.finos.ledger import FinOSLedger, LedgerIntegrityError
from akshay_core.finos.models import TransactionCreate, AccountType
from akshay_core.finos.bill_splitter import split_bill_equally, ExpenseParticipant, calculate_optimal_settlements
from akshay_core.finos.sms_parser import parse_bank_sms
from akshay_core.workflows.daily_engine import (
    extract_action_items_from_text,
    prioritize_tasks_eisenhower,
    get_first_aid_guide,
)
from akshay_core.workflows.braindump_engine import process_braindump
from akshay_core.finos.tax_calculator import compare_tax_regimes
from akshay_core.workflows.medical_emergency import check_drug_interaction, generate_sos_beacon
from akshay_core.security.validator import sanitize_text, SecurityValidationError
from akshay_core.security.audit_logger import get_audit_logger

PORT = 8085
HUD_DIR = Path(__file__).resolve().parent

# Persistent local SQLite ledger file in data directory
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "akshay_ledger.db"

ledger_instance = FinOSLedger(db_path=DB_PATH)
audit_logger = get_audit_logger()


class AkshayAPIHandler(http.server.SimpleHTTPRequestHandler):
    """Handles static HUD files and secure local REST API endpoints."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HUD_DIR), **kwargs)

    def _send_json_response(self, data: dict, status: int = 200) -> None:
        payload = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "http://localhost:8085")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == "/api/ledger/summary":
            try:
                assets = ledger_instance.get_or_create_account("Assets:Bank:HDFC", AccountType.ASSET)
                net_worth = ledger_instance.get_net_worth()
                categories = ledger_instance.get_spending_by_category()
                self._send_json_response({
                    "success": True,
                    "net_worth": str(net_worth),
                    "categories": [c.model_dump() for c in categories]
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        # Fallback to static HUD file server
        super().do_GET()

    def do_POST(self) -> None:
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == "/api/ledger/transaction":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)

                tx_create = TransactionCreate(
                    description=data.get("description", "Manual entry"),
                    debit_account=data.get("debit_account", "Expenses:Uncategorized"),
                    credit_account=data.get("credit_account", "Assets:Bank:HDFC"),
                    amount=Decimal(str(data.get("amount", "0"))),
                    currency=data.get("currency", "INR"),
                    category=data.get("category"),
                    note=data.get("note"),
                    source=data.get("source", "hud"),
                )

                tx_id = ledger_instance.record_transaction(tx_create)
                self._send_json_response({
                    "success": True,
                    "tx_id": tx_id,
                    "message": "Transaction recorded into double-entry ledger"
                })
            except (SecurityValidationError, ValueError) as ve:
                self._send_json_response({"success": False, "error": str(ve)}, status=400)
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/daily/action-items":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                raw_text = data.get("text", "")
                items = extract_action_items_from_text(raw_text)
                self._send_json_response({
                    "success": True,
                    "count": len(items),
                    "items": [it.model_dump() for it in items]
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/daily/split-bill":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                total = Decimal(str(data.get("total", "0")))
                payer = data.get("payer", "Self")
                participants = data.get("participants", [payer])
                result = split_bill_equally(total_amount=total, payer=payer, participants=participants)
                self._send_json_response({
                    "success": True,
                    "total_bill": str(result.total_bill),
                    "settlements": [s.model_dump() for s in result.settlements],
                    "balances": {k: str(v) for k, v in result.balances.items()}
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/daily/sms-parse":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                sms = data.get("sms", "")
                parsed = parse_bank_sms(sms)
                self._send_json_response({
                    "success": True,
                    "parsed": parsed.model_dump()
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/daily/first-aid":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                condition = data.get("condition", "")
                guide = get_first_aid_guide(condition)
                if guide:
                    self._send_json_response({"success": True, "guide": guide})
                else:
                    self._send_json_response({"success": False, "error": f"No protocol for '{condition}'"}, status=404)
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/braindump/process":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                text = data.get("text", "")
                artifacts = process_braindump(text)
                self._send_json_response({
                    "success": True,
                    "artifacts": artifacts.model_dump()
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/tax/compare":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                gross = Decimal(str(data.get("annual_gross", "1200000")))
                c80 = Decimal(str(data.get("sec_80c", "150000")))
                d80 = Decimal(str(data.get("sec_80d", "25000")))
                hra = Decimal(str(data.get("hra", "0")))
                res = compare_tax_regimes(annual_gross=gross, sec_80c=c80, sec_80d=d80, hra=hra)
                self._send_json_response({
                    "success": True,
                    "comparison": res.model_dump()
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/medical/drug-interaction":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                drug1 = data.get("drug1", "")
                drug2 = data.get("drug2", "")
                res = check_drug_interaction(drug1, drug2)
                self._send_json_response({
                    "success": True,
                    "interaction": res.model_dump()
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/medical/sos":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                beacon = generate_sos_beacon(
                    user_name=data.get("user_name", "Abishek"),
                    blood_group=data.get("blood_group", "O+ Positive"),
                    lat=data.get("lat"),
                    lon=data.get("lon"),
                )
                self._send_json_response({
                    "success": True,
                    "beacon": beacon.model_dump()
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        self._send_json_response({"error": "Endpoint not found"}, status=404)

    def log_message(self, format, *args):
        # Quiet standard HTTP access logs
        pass


def run_server():
    print("==========================================================")
    print("  AKSHAY: Local Secure Gateway & FinOS Server Active      ")
    print("==========================================================")
    print(f"[*] Ledger Database : {DB_PATH}")
    print(f"[*] Local Web HUD   : http://localhost:{PORT}")
    print(f"[*] Network Access  : http://0.0.0.0:{PORT}")
    print("==========================================================")

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AkshayAPIHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] Gracefully stopping Akshay Gateway.")


if __name__ == "__main__":
    run_server()
