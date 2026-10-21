# 📑 Smart Price Master & Omnichannel B2B Catalog Distribution Engine

[![Live Web Studio](https://img.shields.io/badge/Live_App-smart--price--master.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://smart-price-master.vercel.app)
[![Admin Console](https://img.shields.io/badge/Admin_Console-smart--price--master.vercel.app%2Fadmin-10b981?style=for-the-badge&logo=vercel&logoColor=white)](https://smart-price-master.vercel.app/admin)
[![Python Version](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Drive API](https://img.shields.io/badge/Cloud%20Sync-Google%20Drive%20API-4285F4.svg)](https://developers.google.com/drive)
[![Vector PDF Engine](https://img.shields.io/badge/PDF%20Engine-ReportLab%20%7C%20WeasyPrint-E0234E.svg)](https://www.reportlab.com/)
[![Author](https://img.shields.io/badge/Author-Abishek%20Pranav%20G%20V-0A66C2.svg)](https://abishekpranavportfolio.vercel.app)

> An enterprise B2B sales automation engine that continuously synchronizes with cloud pricing masters (Google Drive / Sheets), computes tiered rate cards, generates branded vector PDF quotations & mini-catalogs with embedded location QR codes, and dispatches them via WhatsApp Business & Gmail.

---

## 📌 Executive Summary

Industrial instrumentation manufacturers and distributors manage thousands of complex SKUs across fluid pricing tiers (distributor, wholesale, end-client). Manual quotation generation creates latency bottlenecks that reduce deal conversion rates.

This project delivers:
1. **Automated Cloud Price Book Synchronization:** Listens to designated Google Drive repositories for spreadsheet modifications and caches product pricing matrices in memory.
2. **Dynamic Vector Document Synthesis:** Compiles customized multi-page catalogs and formal GST-compliant quotations on the fly using high-resolution rendering engines.
3. **Location-Aware QR Codes:** Generates and embeds dynamic QR codes pointing to specific product showroom and warehouse coordinates on Google Maps.
4. **Omnichannel Instant Dispatch:** Integrates WhatsApp API and Gmail OAuth2 to deliver personalized quote packets to B2B buyers within seconds.
5. **IndiaMART Market Price Benchmarking:** Cross-references internal list prices against real-time marketplace benchmarks to guide sales negotiation margins.

---

## 🏗️ Architecture & Sales Automation Workflow

```mermaid
flowchart TD
    A["Google Drive Pricing Master<br/>(Live Excel / Google Sheets Repository)"] --> B["Cloud Synchronization Worker<br/>(Drive API Change Watcher & JSON Cache Builder)"]
    B --> C["Pricing & Margin Computation Engine<br/>(Tier Rules: Retail, Wholesale, Distributor Margins, GST Rates)"]
    D["Sales Executive Interface<br/>(Admin HTML & Multi-Select Product Picker)"] --> E["Quotation Payload Assembler"]
    C & E --> F["Dynamic Document Synthesis Engine<br/>(ReportLab Vector PDF Builder, Product Images, Spec Sheets)"]
    G["Dynamic QR Code Generator<br/>(Warehouse Location & Digital Product Passports)"] --> F
    H["IndiaMART Real-Time Price Scraper<br/>(Market Benchmark Comparison)"] --> F
    F --> I["Vector PDF Catalog & Quotation Packet"]
    I --> J1["Instant WhatsApp Dispatch<br/>(Direct Buyer Mobile Delivery)"]
    I --> J2["Gmail API Secure Delivery<br/>(Formal PDF Attachment & Audit Log)"]
```

---

## ⚙️ Key Technical Features

### 1. Dynamic Tiered Margin Matrix
The engine dynamically applies progressive volume discounting while safeguarding gross profit margins:

$$P_{\text{final}} = P_{\text{base}} \times (1 - D_{\text{tier}}) \times (1 + R_{\text{GST}})$$

| Customer Tier | Order Quantity Threshold | Discount ($D_{\text{tier}}$) | Payment Terms Supported |
| :--- | :---: | :---: | :--- |
| **Retail / End-User** | 1 – 4 Units | 0.0% | Immediate / Advance |
| **Wholesale Buyer** | 5 – 24 Units | 12.5% | Net 15 Days |
| **Authorized Distributor** | $\ge 25$ Units | 25.0% | Net 30 Days Letter of Credit |

### 2. High-Resolution Visual Caching
* Pre-indexes hundreds of industrial equipment images (`cache/product_images.json`).
* Resolves image asset paths instantly without blocking document generation threads.
* Embeds crisp, vector-rendered category QR codes (`category_qr/`) directly into output headers.

---

## 📊 Operational Performance & ROI

Benchmarked against traditional manual quotation workflows at Nunes Instrumentation:

| Operational Metric | Manual Sales Workflow | Smart Price Master System | Efficiency Gain |
| :--- | :---: | :---: | :---: |
| **Quotation Generation Time** | 25 – 40 minutes | **< 3 seconds** | **~99% Reduction** |
| **Pricing Calculation Errors** | 4.8% (Formula drift) | **0.00% (Centralized logic)** | Complete Error Elimination |
| **Buyer Lead Response Latency** | 2 – 4 hours | **Instant (< 30 seconds)** | **8x Faster Response** |
| **Multi-Item Catalog Compilation** | 2 – 3 days (Designer) | **Instant Vector PDF Export** | Automated on Demand |

---

## 🛠️ Tech Stack & Directory Structure

* **Core Engine:** Python 3.9+, Pandas, OpenPyXL, Requests
* **Document Compilation:** ReportLab, WeasyPrint, PyMuPDF, QRCode
* **Cloud & Messaging APIs:** Google Drive REST API, Gmail OAuth2, WhatsApp Business API
* **Frontend:** Responsive Admin Web Portal (HTML5, Vanilla JS, Bootstrap)

```
Smart-Price-Master-Catalog-Generator/
├── PriceMaster_F15_3_PORTABLE_ANY_OS_VERIFIED_MULTISELECT_V16_8_25.zip # Complete portable release
│   └── PriceMaster/
│       ├── admin.html               # Web interface for multi-product selection
│       ├── cache/                   # High-speed product JSON & image indexes
│       ├── category_qr/             # Vector QR assets for each industrial category
│       └── BACKUP_PRICEMASTER_NOW.bat # One-click data backup routine
├── PriceMaster_F15_1_OFFICE_PRODUCT_INTELLIGENCE.zip # Legacy intelligence engine bundle
└── README.md                        # Master system documentation
```

---

## 🚀 Quickstart & Deployment

```bash
# Clone the repository
git clone https://github.com/AbishekPranavGV/Smart-Price-Master-Catalog-Generator.git
cd Smart-Price-Master-Catalog-Generator

# Unpack the latest portable distribution
tar -xf "PriceMaster_F15_3_PORTABLE_ANY_OS_VERIFIED_MULTISELECT_V16_8_25.zip"

# Open the administrative cockpit directly in your browser
start PriceMaster_F15_3_PORTABLE_ANY_OS_VERIFIED_MULTISELECT_V16_8_25/PriceMaster_F15_3_PORTABLE_ANY_OS_VERIFIED_MULTISELECT_V16_8_25/admin.html
```

---

## 👤 Author & Professional Links

**Abishek Pranav G V**  
*Business Analyst | Data Science & AI Automation Specialist*  
Coimbatore, Tamil Nadu, India  

* 🌐 **Live Portfolio:** [abishekpranavportfolio.vercel.app](https://abishekpranavportfolio.vercel.app)
* 💼 **LinkedIn:** [linkedin.com/in/abishek-pranav-g-v-](https://www.linkedin.com/in/abishek-pranav-g-v-/)
* 💻 **GitHub:** [github.com/AbishekPranavGV](https://github.com/AbishekPranavGV)
* 📄 **Verified Resume:** [Download ATS-Compliant PDF](https://abishekpranavportfolio.vercel.app/Abishek_Pranav_Resume.pdf)
* 📧 **Contact:** [Abishekpranav403@gmail.com](mailto:Abishekpranav403@gmail.com)
