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

    with socketserver.TCPServer(("", PORT), AkshayAPIHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] Gracefully stopping Akshay Gateway.")


if __name__ == "__main__":
    run_server()
