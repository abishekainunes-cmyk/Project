"""
Local end-to-end test suite for the three previously failing workflows:
1. "Prepare Product Draft" -> POST /api/product/research
2. "Generate All Source Evidence Full PDFs" -> POST /api/catalogue/full-batch
3. "Auto-Create All Full + Mini PDFs" -> POST /api/catalogue/full-batch + POST /api/generate (mini) + POST /api/catalogue/instant-cloud
"""
import json
import zipfile
import io
from pypdf import PdfReader
from webapp import app

client = app.test_client()
headers = {"Content-Type": "application/json", "X-Nunes-AI-Request": "1"}

print("=== TEST 1: POST /api/product/research ===")
r = client.post("/api/product/research", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100",
    "listing_url": ""
})
print("Status code:", r.status_code)
assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.data}"
data = r.get_json()
print("Keys returned:", list(data.keys()))
assert "image_candidates" in data, "Missing image_candidates in response"
assert "specifications" in data, "Missing specifications in response"
print("Found flag:", data.get("found"))
print("Candidates count:", len(data.get("image_candidates", [])))
print("PASS: /api/product/research returned valid JSON schema without HTML error.")

print("\n=== TEST 2: POST /api/generate (type: mini) ===")
mini_payload = {
    "type": "mini",
    "product": "Digital Multimeter",
    "model": "DM-100",
    "image_link": "",
    "related": [
        {"product": "Digital Clamp Meter", "model": "CM-200", "image_link": ""},
        {"product": "Insulation Tester", "model": "IT-500", "image_link": ""}
    ],
    "keywords": "multimeter, tester, voltage detector"
}
r_mini = client.post("/api/generate", headers=headers, json=mini_payload)
print("Status code:", r_mini.status_code)
assert r_mini.status_code == 200, f"Expected 200, got {r_mini.status_code}: {r_mini.data}"
assert r_mini.mimetype == "application/pdf", f"Expected PDF mimetype, got {r_mini.mimetype}"
pdf_reader = PdfReader(io.BytesIO(r_mini.data))
print("Mini PDF pages generated:", len(pdf_reader.pages))
assert len(pdf_reader.pages) >= 1, "PDF has no pages"
print("PASS: /api/generate (type: mini) generated valid PDF without 500 error.")

print("\n=== TEST 3: POST /api/catalogue/full-batch ===")
candidates = [
    {
        "product": "Digital Multimeter High Precision",
        "model": "DM-100",
        "image_link": "",
        "source_url": "https://www.example.com/dm100",
        "source": "Public test"
    },
    {
        "product": "Digital Clamp Meter Pro",
        "model": "CM-200",
        "image_link": "",
        "source_url": "https://www.example.com/cm200",
        "source": "Public test"
    }
]
r_batch = client.post("/api/catalogue/full-batch", headers=headers, json={"products": candidates})
print("Status code:", r_batch.status_code)
assert r_batch.status_code == 200, f"Expected 200, got {r_batch.status_code}: {r_batch.data}"
assert r_batch.mimetype == "application/zip", f"Expected ZIP mimetype, got {r_batch.mimetype}"
print("X-Nunes-Batch-Total:", r_batch.headers.get("X-Nunes-Batch-Total"))
print("X-Nunes-Batch-Review-Drafts:", r_batch.headers.get("X-Nunes-Batch-Review-Drafts"))
with zipfile.ZipFile(io.BytesIO(r_batch.data), "r") as zf:
    print("Files in Full Batch ZIP:", zf.namelist())
    assert any(n.endswith(".pdf") for n in zf.namelist()), "No PDFs found in ZIP"
    assert "BATCH_REPORT.csv" in zf.namelist(), "Missing BATCH_REPORT.csv in ZIP"
print("PASS: /api/catalogue/full-batch generated valid ZIP without 404 error.")

print("\n=== TEST 4: POST /api/catalogue/instant-cloud ===")
r_cloud = client.post("/api/catalogue/instant-cloud", headers=headers, json={
    "query": "Digital Multimeter",
    "products": candidates
})
print("Status code:", r_cloud.status_code)
assert r_cloud.status_code == 200, f"Expected 200, got {r_cloud.status_code}: {r_cloud.data}"
assert r_cloud.mimetype == "application/zip", f"Expected ZIP mimetype, got {r_cloud.mimetype}"
print("X-Nunes-Cloud-Products:", r_cloud.headers.get("X-Nunes-Cloud-Products"))
print("X-Nunes-Cloud-Full-Pdfs:", r_cloud.headers.get("X-Nunes-Cloud-Full-Pdfs"))
print("X-Nunes-Cloud-Mini-Pdfs:", r_cloud.headers.get("X-Nunes-Cloud-Mini-Pdfs"))
with zipfile.ZipFile(io.BytesIO(r_cloud.data), "r") as zf:
    print("Files in Cloud ZIP:", zf.namelist())
    assert any("Full_Catalogues" in n for n in zf.namelist()), "Missing Full_Catalogues in Cloud ZIP"
    assert any("Mini_Catalogue" in n for n in zf.namelist()), "Missing Mini_Catalogue in Cloud ZIP"
    assert "BATCH_REPORT.csv" in zf.namelist(), "Missing BATCH_REPORT.csv in Cloud ZIP"
print("PASS: /api/catalogue/instant-cloud generated valid ZIP without 404 error.")

print("\n=== TEST 5: POST /api/catalogue/enrich ===")
r_enrich = client.post("/api/catalogue/enrich", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100",
    "description": "Precision digital multimeter",
    "features": "- Fast response\n- Low drift",
    "specifications": "Accuracy: 0.5%\nVoltage: 600V"
})
print("Status code:", r_enrich.status_code)
assert r_enrich.status_code == 200, f"Expected 200, got {r_enrich.status_code}: {r_enrich.data}"
enrich_data = r_enrich.get_json()
assert "result" in enrich_data, "Missing result in enrich response"
result_obj = enrich_data["result"]
desc_words = len(result_obj.get("description", "").split())
print("Enriched description words:", desc_words)
print("Key features lines:", len(result_obj.get("key_features", [])))
assert 140 <= desc_words <= 220, f"Description word count out of range: {desc_words}"
assert len(result_obj.get("key_features", [])) >= 8, "Expected at least 8 key feature lines"
print("PASS: /api/catalogue/enrich generated valid 150-200 word copy and 8-10 features.")

print("\n=== TEST 6: POST /api/catalogue/batch/prepare ===")
r_prep = client.post("/api/catalogue/batch/prepare", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100"
})
print("Status code:", r_prep.status_code)
assert r_prep.status_code == 200, f"Expected 200, got {r_prep.status_code}: {r_prep.data}"
prep_data = r_prep.get_json()
print("Batch draft product:", prep_data.get("product"))
assert prep_data.get("product") == "Digital Multimeter", "Mismatched product name"
assert "specifications" in prep_data, "Missing specifications in batch draft"
print("PASS: /api/catalogue/batch/prepare prepared product item.")

print("\n=== TEST 7: POST /api/ai/draft ===")
r_draft = client.post("/api/ai/draft", headers=headers, json={
    "product": "Digital Multimeter",
    "model": "DM-100",
    "raw_facts": "Accuracy: 0.5%\nVoltage: 600V\nCurrent: 10A\nDisplay: LCD"
})
print("Status code:", r_draft.status_code)
assert r_draft.status_code == 200, f"Expected 200, got {r_draft.status_code}: {r_draft.data}"
draft_data = r_draft.get_json()
assert "draft" in draft_data, "Missing draft in response"
print("AI draft product:", draft_data["draft"].get("product_name"))
print("AI draft specs:", len(draft_data["draft"].get("specifications", [])))
print("PASS: /api/ai/draft returned draft successfully.")

print("\n=== ALL WORKFLOW ENDPOINTS VERIFIED AND PASSING! ===")

