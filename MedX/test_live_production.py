import requests
import io
import openpyxl
import base64
from pathlib import Path
from pypdf import PdfReader

# Read password from .env.production.local
pwd = ""
env_prod = Path("D:/nunes-catalogue-studio-v2/.env.production.local")
if env_prod.is_file():
    for line in env_prod.read_text(encoding="utf-8").splitlines():
        if line.startswith("NUNES_ADMIN_PASSWORD="):
            pwd = line.split("=", 1)[1].strip().strip('"').strip("'")
            break

headers = {
    "X-Nunes-Key": pwd,
    "Referer": "https://nunes-catalogue-studio-live.vercel.app/",
    "Origin": "https://nunes-catalogue-studio-live.vercel.app",
    "Sec-Fetch-Site": "same-origin"
}
BASE = "https://nunes-catalogue-studio-live.vercel.app"
print(f"Testing Live Production App at: {BASE}")
print(f"Using Admin Key: {pwd[:3]}***{pwd[-3:] if len(pwd) > 6 else ''}")

# 1. GET /
r_home = requests.get(BASE + "/")
print(f"1. GET / -> Status: {r_home.status_code}, Length: {len(r_home.text)}")
assert r_home.status_code == 200

# 2. GET /api/health
r_health = requests.get(BASE + "/api/health")
print(f"2. GET /api/health -> Status: {r_health.status_code}, Provider: {r_health.json().get('ai', {}).get('provider')}")
assert r_health.status_code == 200

# 3. GET /api/config
r_config = requests.get(BASE + "/api/config", headers=headers)
print(f"3. GET /api/config -> Status: {r_config.status_code}, Mode: {r_config.json().get('mode')}")
assert r_config.status_code == 200

# 4. POST /api/catalogue/upload-auto-generate with Excel (.xlsx)
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Specifications"
ws.append(["Parameter", "Specification"])
ws.append(["Product Name", "Digital Multimeter"])
ws.append(["Model", "DM-100"])
ws.append(["Display", "LCD"])
ws.append(["DC Voltage", "0–600 V"])
ws.append(["Power Supply", "Battery"])

buf = io.BytesIO()
wb.save(buf)
xlsx_bytes = buf.getvalue()

r_upload = requests.post(
    BASE + "/api/catalogue/upload-auto-generate",
    headers=headers,
    files={"file": ("Digital_Multimeter.xlsx", io.BytesIO(xlsx_bytes), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    data={"save_drive": "0"}
)
print(f"4. POST /api/catalogue/upload-auto-generate -> Status: {r_upload.status_code}")
assert r_upload.status_code == 200, f"Upload failed: {r_upload.text}"
res_data = r_upload.json()
print(f"   Success: {res_data.get('success')}")
print(f"   Detected Format: {res_data.get('detected_format')}")
print(f"   Product Name: {res_data.get('product_name')}")
print(f"   Source Model: {res_data.get('source_model')}")
print(f"   Catalogue Brand: {res_data.get('catalogue_brand')}")
print(f"   Catalogue Model: {res_data.get('catalogue_model')}")
print(f"   Full PDF bytes: {len(base64.b64decode(res_data.get('full_pdf_b64', '')))}")
print(f"   Mini PDF bytes: {len(base64.b64decode(res_data.get('mini_pdf_b64', '')))}")

full_pdf = base64.b64decode(res_data["full_pdf_b64"])
pdf_reader = PdfReader(io.BytesIO(full_pdf))
assert len(pdf_reader.pages) == 2, f"Expected 2 pages, got {len(pdf_reader.pages)}"
all_pdf_text = pdf_reader.pages[0].extract_text() + " " + pdf_reader.pages[1].extract_text()
assert "PK" not in all_pdf_text, "PK binary found in live PDF!"
assert "[Content_Types]" not in all_pdf_text, "Content_Types XML found in live PDF!"
print(f"   Live Full PDF Page Count: {len(pdf_reader.pages)}")
print("   [OK] NO BINARY / PK CORRUPTION DETECTED IN LIVE PDF!")

# 5. POST /api/export/docx
r_docx = requests.post(BASE + "/api/export/docx", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100",
    "specifications": [{"key": "DC Voltage", "value": "0–600 V"}, {"key": "Display", "value": "LCD"}],
    "description": "High precision commercial multimeter.",
    "features": ["Auto power off", "High resolution LCD"]
})
print(f"5. POST /api/export/docx -> Status: {r_docx.status_code}, Bytes: {len(r_docx.content)}")
assert r_docx.status_code == 200

# 6. POST /api/export/excel
r_excel = requests.post(BASE + "/api/export/excel", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100",
    "specifications": [{"key": "DC Voltage", "value": "0–600 V"}]
})
print(f"6. POST /api/export/excel -> Status: {r_excel.status_code}, Bytes: {len(r_excel.content)}")
assert r_excel.status_code == 200

# 7. POST /api/preview
r_prev = requests.post(BASE + "/api/preview", headers=headers, json={
    "type": "full",
    "product": "Digital Multimeter",
    "model": "DM-100",
    "specifications": [{"key": "DC Voltage", "value": "0–600 V"}],
    "description": "Preview description"
})
print(f"7. POST /api/preview -> Status: {r_prev.status_code}, Bytes: {len(r_prev.content)}")
assert r_prev.status_code == 200

# 8. POST /api/product/research (Fixes: Prepare Product Draft)
print("8. Testing Live POST /api/product/research (Prepare Product Draft)...")
r_research = requests.post(BASE + "/api/product/research", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100"
})
print(f"   Status: {r_research.status_code}, JSON: {r_research.headers.get('Content-Type')}")
assert r_research.status_code == 200, f"Research failed on live: {r_research.text}"
research_data = r_research.json()
print(f"   Found: {research_data.get('found')}")
print(f"   Image Candidates: {len(research_data.get('image_candidates', []))}")
assert "image_candidates" in research_data, "Missing image_candidates in live response"
assert "specifications" in research_data, "Missing specifications in live response"
print("   [OK] Live /api/product/research operational!")

# 9. POST /api/generate (type: mini) (Fixes: Mini PDF 500)
print("9. Testing Live POST /api/generate (type: mini)...")
r_mini = requests.post(BASE + "/api/generate", headers=headers, json={
    "type": "mini",
    "product": "Digital Multimeter",
    "model": "DM-100",
    "image_link": "",
    "related": [
        {"product": "Digital Clamp Meter", "model": "CM-200", "image_link": ""}
    ],
    "keywords": "multimeter, testing, calibration"
})
print(f"   Status: {r_mini.status_code}, Mime: {r_mini.headers.get('Content-Type')}, Bytes: {len(r_mini.content)}")
assert r_mini.status_code == 200, f"Mini generate failed on live: {r_mini.text}"
assert "pdf" in r_mini.headers.get("Content-Type", "").lower()
mini_reader = PdfReader(io.BytesIO(r_mini.content))
print(f"   Live Mini PDF Page Count: {len(mini_reader.pages)}")
assert len(mini_reader.pages) >= 1
print("   [OK] Live Mini PDF generation operational!")

# 10. POST /api/catalogue/full-batch (Fixes: Generate All Source Evidence Full PDFs)
print("10. Testing Live POST /api/catalogue/full-batch...")
r_batch = requests.post(BASE + "/api/catalogue/full-batch", headers=headers, json={
    "products": [
        {
            "product": "Digital Multimeter DM-100",
            "model": "DM-100",
            "image_link": "",
            "source_url": "https://www.example.com/dm100",
            "source": "Public web"
        }
    ]
})
print(f"   Status: {r_batch.status_code}, Mime: {r_batch.headers.get('Content-Type')}, Bytes: {len(r_batch.content)}")
assert r_batch.status_code == 200, f"Full batch failed on live: {r_batch.text}"
assert "zip" in r_batch.headers.get("Content-Type", "").lower()
print(f"   X-Nunes-Batch-Total: {r_batch.headers.get('X-Nunes-Batch-Total')}")
print("   [OK] Live Full Batch ZIP generation operational!")

# 11. POST /api/catalogue/instant-cloud (Fixes: Instant Cloud Catalogue)
print("11. Testing Live POST /api/catalogue/instant-cloud...")
r_cloud = requests.post(BASE + "/api/catalogue/instant-cloud", headers=headers, json={
    "query": "Digital Multimeter",
    "products": [
        {
            "product": "Digital Multimeter High Precision",
            "model": "DM-100",
            "image_link": "",
            "source_url": "https://www.example.com/dm100",
            "source": "Public web"
        }
    ]
})
print(f"   Status: {r_cloud.status_code}, Mime: {r_cloud.headers.get('Content-Type')}, Bytes: {len(r_cloud.content)}")
assert r_cloud.status_code == 200, f"Instant cloud failed on live: {r_cloud.text}"
assert "zip" in r_cloud.headers.get("Content-Type", "").lower()
print(f"   X-Nunes-Cloud-Products: {r_cloud.headers.get('X-Nunes-Cloud-Products')}")
print(f"   X-Nunes-Cloud-Full-Pdfs: {r_cloud.headers.get('X-Nunes-Cloud-Full-Pdfs')}")
print(f"   X-Nunes-Cloud-Mini-Pdfs: {r_cloud.headers.get('X-Nunes-Cloud-Mini-Pdfs')}")
print("   [OK] Live Instant Cloud Bundle generation operational!")

# 12. POST /api/catalogue/enrich (Generate 150-200 Words + 8-10 Key Features)
print("12. Testing Live POST /api/catalogue/enrich...")
r_enrich = requests.post(BASE + "/api/catalogue/enrich", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100",
    "description": "Industrial multimeter",
    "features": "- High accuracy\n- Digital display",
    "specifications": "Voltage: 600V\nAccuracy: 0.5%"
})
print(f"   Status: {r_enrich.status_code}")
assert r_enrich.status_code == 200, f"Enrich failed on live: {r_enrich.text}"
enrich_res = r_enrich.json().get("result", {})
print(f"   Enriched words: {len(enrich_res.get('description', '').split())}")
print(f"   Key features: {len(enrich_res.get('key_features', []))}")
print("   [OK] Live /api/catalogue/enrich operational!")

# 13. POST /api/catalogue/batch/prepare (Start Product List Automation)
print("13. Testing Live POST /api/catalogue/batch/prepare...")
r_prep = requests.post(BASE + "/api/catalogue/batch/prepare", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100"
})
print(f"   Status: {r_prep.status_code}")
assert r_prep.status_code == 200, f"Batch prepare failed on live: {r_prep.text}"
prep_res = r_prep.json()
print(f"   Prepared Product: {prep_res.get('product')}")
print(f"   Specs Count: {prep_res.get('specification_count')}")
print("   [OK] Live /api/catalogue/batch/prepare operational!")

# 14. POST /api/ai/draft (Auto-Fill All Details with AI)
print("14. Testing Live POST /api/ai/draft...")
r_draft = requests.post(BASE + "/api/ai/draft", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100",
    "raw_facts": "Range: 0-600V\nAccuracy: 0.5%\nPower: 9V"
})
print(f"   Status: {r_draft.status_code}")
assert r_draft.status_code == 200, f"AI draft failed on live: {r_draft.text}"
draft_res = r_draft.json().get("draft", {})
print(f"   Draft Product: {draft_res.get('product_name')}")
print(f"   Draft Specs: {len(draft_res.get('specifications', []))}")
print("   [OK] Live /api/ai/draft operational!")

print("=" * 60)
print("ALL LIVE PRODUCTION ENDPOINTS TESTED AND VERIFIED 100% OPERATIONAL!")
print("=" * 60)

