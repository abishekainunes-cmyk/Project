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
from akshay_core.finos.tax_calculator import (
    compare_tax_regimes,
    calculate_financial_runway,
    calculate_sip_compounding,
)
from akshay_core.workflows.medical_emergency import check_drug_interaction, generate_sos_beacon
from akshay_core.workflows.job_bot import JobBotManager, CandidateProfile
from akshay_core.workflows.conversational_solver import solve_user_request
from akshay_core.security.validator import sanitize_text, SecurityValidationError
from akshay_core.security.audit_logger import get_audit_logger

PORT = 8085
HUD_DIR = Path(__file__).resolve().parent

# Persistent local SQLite ledger file in data directory
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "akshay_ledger.db"

ledger_instance = FinOSLedger(db_path=DB_PATH)
job_bot_instance = JobBotManager(db_path=DATA_DIR / "akshay_jobs.db")
from akshay_core.workflows.dad_medical_tracker import DadMedicalTracker
dad_tracker_instance = DadMedicalTracker(db_path=DATA_DIR / "akshay_dad_medical.db")
from akshay_core.finos.investment_manager import get_portfolio_manager
portfolio_instance = get_portfolio_manager(db_path=DATA_DIR / "akshay_investments.db")
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
        print(f"[DEBUG do_GET] path={path}", flush=True)

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

        elif path == "/api/jobs/stream":
            try:
                jobs = job_bot_instance.get_job_stream()
                self._send_json_response({
                    "success": True,
                    "jobs": [j.model_dump() for j in jobs]
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/jobs/profile":
            try:
                prof = job_bot_instance.get_profile()
                self._send_json_response({
                    "success": True,
                    "profile": prof.model_dump()
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/jobs/recommendations":
            try:
                from akshay_core.workflows.cv_tailor import CVTailorEngine
                rec = CVTailorEngine.get_career_recommendations()
                self._send_json_response({"success": True, "recommendations": rec})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/jobs/application-cv":
            try:
                query = urllib.parse.parse_qs(parsed_url.query)
                job_id = query.get("job_id", [""])[0]
                apps = job_bot_instance.get_applications()
                app = next((a for a in apps if a.job_id == job_id), None)
                if app and app.tailored_cv:
                    self._send_json_response({"success": True, "job_id": job_id, "cv_plaintext": app.tailored_cv, "ats_score": app.ats_score, "status": app.status})
                else:
                    tailored = job_bot_instance.tailor_cv_for_job(job_id)
                    self._send_json_response(tailored)
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/jobs/history":
            try:
                apps = job_bot_instance.get_applications()
                self._send_json_response({
                    "success": True,
                    "applications": [a.model_dump() for a in apps]
                })
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/jobs/export-csv":
            try:
                csv_data = job_bot_instance.export_applications_csv()
                payload = csv_data.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/csv; charset=utf-8")
                self.send_header("Content-Disposition", "attachment; filename=\"akshay_job_applications.csv\"")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/dad/dashboard":
            try:
                summary = dad_tracker_instance.get_dashboard_summary()
                self._send_json_response({"success": True, "dashboard": summary})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/dad/medicines":
            try:
                meds = dad_tracker_instance.get_medicines()
                self._send_json_response({"success": True, "medicines": [m.model_dump() for m in meds]})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/dad/appointments":
            try:
                appts = dad_tracker_instance.get_appointments()
                self._send_json_response({"success": True, "appointments": [a.model_dump() for a in appts]})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/dad/appointment/ics":
            try:
                query = urllib.parse.parse_qs(parsed_url.query)
                doc_id = query.get("id", ["DOC-NEURO"])[0]
                ics_data = dad_tracker_instance.generate_appointment_ics(doc_id)
                payload = ics_data.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/calendar; charset=utf-8")
                self.send_header("Content-Disposition", f"attachment; filename=\"dad_{doc_id.lower()}_booking.ics\"")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/portfolio":
            try:
                summary = portfolio_instance.get_portfolio_summary()
                self._send_json_response({"success": True, "portfolio": summary.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/reminders":
            try:
                reminders = portfolio_instance.get_reminders()
                self._send_json_response({"success": True, "reminders": [r.model_dump() for r in reminders]})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/guides":
            try:
                guides = portfolio_instance.get_app_execution_guides()
                self._send_json_response({"success": True, "guides": guides})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/reminder/ics":
            try:
                ics_data = portfolio_instance.generate_reminders_ics()
                payload = ics_data.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/calendar; charset=utf-8")
                self.send_header("Content-Disposition", "attachment; filename=\"investment_sip_reminders.ics\"")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
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

        elif path == "/api/jobs/profile":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                prof = CandidateProfile(**data)
                job_bot_instance.save_profile(prof)
                self._send_json_response({"success": True, "message": "Candidate profile updated"})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/jobs/cover-letter":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                job_id = data.get("job_id")
                jobs = job_bot_instance.get_job_stream()
                target_job = next((j for j in jobs if j.id == job_id), None)
                if not target_job:
                    self._send_json_response({"success": False, "error": f"Job ID {job_id} not found"}, status=404)
                    return
                prof = job_bot_instance.get_profile()
                letter = job_bot_instance.generate_cover_letter(prof, target_job)
                self._send_json_response({"success": True, "cover_letter": letter})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/jobs/apply":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                job_id = data.get("job_id")
                custom_letter = data.get("cover_letter")
                style = data.get("letter_style", "balanced")
                app = job_bot_instance.apply_to_job(job_id, custom_letter, style=style)
                self._send_json_response({"success": True, "application": app.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/jobs/tailor-cv":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                job_id = data.get("job_id")
                tailored = job_bot_instance.tailor_cv_for_job(job_id)
                self._send_json_response(tailored)
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/jobs/auto-apply-batch":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                threshold = int(data.get("min_match_threshold", 70))
                style = data.get("letter_style", "balanced")
                res = job_bot_instance.run_batch_auto_apply(min_match_threshold=threshold, style=style)
                self._send_json_response(res)
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/wealth/runway":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                assets = Decimal(str(data.get("liquid_assets", "81750")))
                burn = Decimal(str(data.get("monthly_burn", "15000")))
                runway = calculate_financial_runway(assets, burn)
                self._send_json_response({"success": True, "runway": runway.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/wealth/sip":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                monthly = Decimal(str(data.get("monthly_investment", "10000")))
                cagr = Decimal(str(data.get("annual_cagr_pct", "12")))
                years = int(data.get("years", 10))
                sip = calculate_sip_compounding(monthly, cagr, years)
                self._send_json_response({"success": True, "sip": sip.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/chat/solve":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)
                query = data.get("query", "")
                result = solve_user_request(query)
                self._send_json_response({"success": True, "result": result})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/dad/medicine/refill":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                med_id = data.get("id")
                qty = int(data.get("qty", 30))
                updated = dad_tracker_instance.refill_medicine(med_id, qty_added=qty)
                self._send_json_response({"success": True, "medicine": updated.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/dad/medicine/add":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                new_med = dad_tracker_instance.add_or_update_medicine(
                    name=data.get("name", "New Medicine"),
                    current_qty=int(data.get("current_qty", 30)),
                    daily_dose=int(data.get("daily_dose", 1)),
                    category=data.get("category", "General"),
                    reorder_lead_days=int(data.get("reorder_lead_days", 12)),
                    prescribed_by=data.get("prescribed_by", ""),
                    notes=data.get("notes", "")
                )
                self._send_json_response({"success": True, "medicine": new_med.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/dad/appointment/visit":
            try:
                import datetime
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                doc_id = data.get("id", "DOC-NEURO")
                visit_date = data.get("visit_date", datetime.date.today().strftime("%Y-%m-%d"))
                updated = dad_tracker_instance.update_appointment_visit(doc_id, visit_date)
                self._send_json_response({"success": True, "appointment": updated.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/dad/prescription/ocr":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                text_snippet = data.get("text")
                image_b64 = data.get("image_b64")
                ocr_result = dad_tracker_instance.process_prescription_ocr(text_snippet=text_snippet, image_b64=image_b64)
                self._send_json_response(ocr_result)
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/prices/refresh":
            try:
                summary = portfolio_instance.refresh_live_prices()
                self._send_json_response({"success": True, "portfolio": summary.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/suggest":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                res = portfolio_instance.scan_and_suggest_investment(
                    savings_amount=data.get("savings_amount"),
                    monthly_income=data.get("monthly_income")
                )
                self._send_json_response({"success": True, "suggestion": res})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/holding/add":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                holding = portfolio_instance.add_holding(
                    category=data.get("category", "STOCK"),
                    symbol=data.get("symbol", ""),
                    name=data.get("name", ""),
                    units=float(data.get("units", 1.0)),
                    buy_price=float(data.get("buy_price", 0.0)),
                    current_price=float(data.get("current_price", data.get("buy_price", 0.0))),
                    notes=data.get("notes", "")
                )
                self._send_json_response({"success": True, "holding": holding.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/holding/delete":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                holding_id = int(data.get("id", 0))
                deleted = portfolio_instance.delete_holding(holding_id)
                self._send_json_response({"success": deleted})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/reminder/create":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                rem = portfolio_instance.create_reminder(
                    title=data.get("title", "Investment Reminder"),
                    amount=float(data.get("amount", 5000.0)),
                    frequency=data.get("frequency", "Monthly"),
                    target_date=data.get("target_date"),
                    target_asset=data.get("target_asset", "Mutual Fund"),
                    alert_time=data.get("alert_time", "09:00 AM")
                )
                self._send_json_response({"success": True, "reminder": rem.model_dump()})
            except Exception as e:
                self._send_json_response({"success": False, "error": str(e)}, status=500)
            return

        elif path == "/api/investments/reminder/delete":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
                data = json.loads(body) if body else {}
                rem_id = int(data.get("id", 0))
                deleted = portfolio_instance.delete_reminder(rem_id)
                self._send_json_response({"success": deleted})
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
