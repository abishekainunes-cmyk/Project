# NUNES Social Media Command Center 🚀

> **Production-Grade Multi-Channel Social Automation & Orchestration Platform**  
> Engineered for **Nunes Instrumentation** — Industrial Measurement & Testing Solutions.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.8-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Turbopack](https://img.shields.io/badge/Bundler-Turbopack-blueviolet?style=flat-square)](https://turbo.build/pack)
[![Meta Graph API v24.0](https://img.shields.io/badge/Meta_Graph_API-v24.0-0866FF?style=flat-square&logo=meta)](https://developers.facebook.com/)
[![LinkedIn REST v2](https://img.shields.io/badge/LinkedIn_API-REST_v2-0A66C2?style=flat-square&logo=linkedin)](https://learn.microsoft.com/en-us/linkedin/)
[![WhatsApp Business](https://img.shields.io/badge/WhatsApp_Cloud_API-Business-25D366?style=flat-square&logo=whatsapp)](https://developers.facebook.com/docs/whatsapp)
[![Security](https://img.shields.io/badge/Encryption-AES--256--GCM-critical?style=flat-square)](https://nodejs.org/api/crypto.html)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel_Production-black?style=flat-square&logo=vercel)](https://vercel.com/)

---

## 🌐 Live Production Application

- **Live URL**: [https://nunessocialpostmachine-app.vercel.app](https://nunessocialpostmachine-app.vercel.app)
- **Local Development**: `http://localhost:3000`

---

## 📌 Executive Overview

The **NUNES Social Media Command Center** is a full-stack, enterprise-grade social orchestration engine built to automate, schedule, publish, and monitor technical marketing campaigns across 5 primary business channels:
1. **LinkedIn** (B2B Authority & Decision-Makers)
2. **Facebook** (Nunes Instrumentation Verified Page)
3. **Instagram** (@nunesinstrumentation Professional Account)
4. **WhatsApp** (Official WABA Multi-Number Business Messaging)
5. **YouTube** (Technical Demonstrations & Product Overviews)

Built with **Next.js 16 (App Router)** and **Turbopack**, the system features dual operating personas (Executive Admin vs Technical Diagnostics), a live visual post stream rendering published posts in high-definition image format, an industrial engineering copywriter engine, and a resilient AES-256-GCM encrypted persistence bridge.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (SaaS Dashboard)"]
        UI["Command Center Dashboard\n(Admin & Tech Modes)"]
        Composer["6-Step Guided Composer\n(Drag/Drop, Paste, Presets)"]
        Mockup["WYSIWYG Social Mockups\n(LinkedIn, FB, IG, WhatsApp)"]
        LiveFeed["Live Post Visual Feed\n(Full Image Format Gallery)"]
    end

    subgraph Server ["Serverless Next.js 16 Runtime"]
        API_Publish["/api/publish\n(Atomic Idempotency)"]
        API_Cron["/api/cron/social-publish\n(Server-Side Worker)"]
        API_Live["/api/live-posts\n(Feed Aggregation)"]
        API_Media["/api/media/[id]\n(CDN Streaming Stream)"]
        Engine["Industrial Copywriter\n& Equipment Catalog"]
    end

    subgraph Security ["Encrypted State & Persistence"]
        SharedStorage["AES-256-GCM Encrypted Bridge\n(Multi-Node Sync)"]
        VercelLock["Atomic Lock Engine\n(lock:cron:social-publish)"]
    end

    subgraph Providers ["Upstream Social APIs"]
        MetaGraph["Meta Graph API v24.0\n(Pages & Instagram Containers)"]
        LinkedInAPI["LinkedIn REST v2 API\n(w_organization_social)"]
        WhatsAppAPI["WhatsApp Business Cloud API\n(WABA Multi-Number)"]
        YouTubeAPI["Google Services API\n(YouTube Data v3)"]
    end

    UI --> API_Publish
    Composer --> Mockup
    Composer --> Engine
    UI --> API_Live
    UI --> API_Media
    API_Publish --> MetaGraph
    API_Publish --> LinkedInAPI
    API_Publish --> WhatsAppAPI
    API_Publish --> YouTubeAPI
    API_Cron --> API_Publish
    API_Publish --> SharedStorage
    API_Cron --> VercelLock
    API_Live --> MetaGraph
    API_Live --> SharedStorage
```

---

## 🌟 Key Technical Features

### 1. Dual Persona Modes (Admin vs. Tech)
- **Admin Mode (Default)**: Clean executive layout with large, high-contrast typography, high-level KPI cards, and simplified status badges (`CONNECTED`, `PUBLISHING READY`, `ACTION REQUIRED`). Zero exposure of API keys, app secrets, or raw JSON payloads.
- **Tech Mode**: Granular diagnostic suite exposing OAuth token expiry, granted scopes, Facebook Page mapping (`1398853319976762`), Instagram account mapping (`17841422933669789`), and live Meta Graph API ping diagnostic tools.

### 2. Live Posts in Visual Image Format
- Directly queries live provider feeds (Meta Graph API `/posts`) and verified audit history.
- Renders published posts as high-impact **Live Post Cards** in full visual image format.
- Displays exact published text, hashtags, external post IDs, and direct one-click links to the live posts on Facebook and LinkedIn.
- Includes a **"Reuse Post 📋"** shortcut to instantly load historical content back into the composer.

### 3. Industrial Catalog & AI Brand Copywriter
- Pre-loaded with Nunes Instrumentation equipment specs (Digital Pressure Calibrators, Hydraulic Dead Weight Testers, 5kV Megohmmeters, Dry-Block Calibrators, Class 1 Sound Level Meters).
- Tailors content natively per channel:
  - **LinkedIn**: B2B compliance, ISO/IEC 17025 standards, engineering specifications, procurement CTA.
  - **Facebook**: Plant maintenance reliability, workshop support, warranty, and phone inquiry CTA.
  - **Instagram**: High-contrast visual hooks, technical bullet points, and 20+ industrial hashtags.
  - **WhatsApp**: Clean WhatsApp markdown (`*bold*`), concise parameters, and direct one-tap reply prompt.
  - **YouTube**: Video description with timestamps, specs overview, and SEO tags.

### 4. Interactive WYSIWYG Social Media Previews
- Live feed mockups rendered inside the composer:
  - **LinkedIn Card**: Header, follower count, "1st" connection badge, formatted text with expand/collapse, reaction bar (`👍👏❤️`).
  - **Facebook Card**: Verified Page tick, timestamp, responsive full-width media frame, share bar.
  - **Instagram Viewport**: Smartphone feed frame with story ring, like/comment/send icons, and bold handle caption.
  - **WhatsApp Bubble**: Chat interface with incoming/outgoing green bubble, double blue checkmarks (`✓✓`), and reply button.

### 5. Official Instagram Container Publishing & Self-Hosted Media Pipeline
- Complies with official Meta Graph API two-step image publishing:
  1. Creates Instagram Media Container via `POST /{ig-user-id}/media`.
  2. Publishes container via `POST /{ig-user-id}/media_publish`.
- **Self-Hosted CDN Endpoint** (`/api/media/[id]`): Streams uploaded or pasted media files via public HTTP endpoints to ensure 100% Meta Graph API crawler accessibility without external S3 dependencies.

### 6. Serverless Cron Auto-Posting Engine
- Endpoint at `/api/cron/social-publish` protected by `CRON_SECRET`.
- Built-in atomic locking (`lock:cron:social-publish`) prevents duplicate executions across distributed Vercel instances.
- On-demand worker trigger (`/api/automation/trigger-worker`) allows admins to process pending scheduled posts with instant execution receipts.

### 7. Multi-Device AES-256-GCM State Bridge
- Any authorization performed on Machine A is encrypted with AES-256-GCM and stored centrally.
- Opening the Command Center on Machine B automatically detects the same verified live state.
- Integrated with Vercel Deployment Protection bypass authentication.

---

## 📁 Repository Structure

```
├── app/
│   ├── api/
│   │   ├── automation/
│   │   │   ├── schedule/route.js        # Scheduled queue management API
│   │   │   └── trigger-worker/route.js  # On-demand worker execution API
│   │   ├── cron/
│   │   │   └── social-publish/route.js  # Server-side scheduled worker
│   │   ├── integrations/
│   │   │   └── status/route.js          # Live provider health & status API
│   │   ├── live-posts/route.js          # Aggregated live visual post feed API
│   │   ├── media/[id]/route.js          # High-performance media streaming CDN
│   │   ├── meta/
│   │   │   ├── diagnostics/route.js     # Meta Graph live token diagnostics
│   │   │   └── setup/route.js           # Meta configuration setup API
│   │   ├── oauth/
│   │   │   └── [platform]/              # Dynamic OAuth start & callback handlers
│   │   ├── publish/route.js             # Multi-channel atomic publishing engine
│   │   ├── publishing-history/route.js  # Immutable verified audit trail
│   │   ├── upload/route.js              # Media upload & base64 ingestion
│   │   └── whatsapp/                    # WABA numbers and health API
│   ├── components/
│   │   ├── LivePostCard.js              # Visual card rendering live posts in image format
│   │   └── SocialPreviewMockup.js       # Live WYSIWYG feed simulator
│   ├── connect/
│   │   ├── Instagram/page.js            # Direct Instagram OAuth authorization
│   │   └── Meta/page.js                 # Meta Business authorization
│   ├── lib/
│   │   ├── copywriter-engine.js         # Multi-channel industrial copy generation
│   │   ├── instrument-catalog.js        # Nunes product catalog knowledge base
│   │   ├── meta-instagram.js            # Meta Graph discovery & Instagram linking
│   │   ├── oauth-config.js              # OAuth platform endpoints & scopes
│   │   ├── oauth-store.js               # Cookie unseal & config helpers
│   │   ├── shared-state.js              # AES-256-GCM encrypted persistence bridge
│   │   ├── social-providers.js          # Central registry for active channels
│   │   └── upstream-backend.js          # Upstream client with Vercel protection bypass
│   ├── globals.css                      # Modern 2026 SaaS design system & themes
│   ├── layout.js                        # Root metadata & layout
│   └── page.js                          # Core Command Center application
├── public/                              # Static public brand assets
├── .env.example                         # Environment configuration template
├── .gitignore                           # Production exclusions
├── next.config.mjs                      # Next.js configuration
├── package.json                         # Dependencies & npm scripts
├── vercel.json                          # Vercel deployment & daily cron schedule
└── README.md                            # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm, yarn, or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/nunes-social-command-center.git
cd nunes-social-command-center

# Install dependencies
npm install
```

### Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env.local
```
Fill in the credentials for Meta, LinkedIn, WhatsApp, and the shared encryption keys in `.env.local`.

### Running Locally
```bash
# Start Turbopack development server
npm run dev

# Or build and run production server
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deployment to Vercel

```bash
# Deploy to preview
npx vercel

# Deploy directly to production
npx vercel --prod
```

---

## 🔒 Security & Best Practices

- **Zero Secret Leakage**: API credentials, App Secrets, and tokens are stored exclusively on the server side and never exposed in client bundles or HTML markup.
- **Idempotency Safeguards**: Every publish request requires a unique idempotency hash to prevent duplicate submissions over flaky networks.
- **Atomic Locking**: Prevents concurrent execution of the background cron publisher.

---

## 👤 Author & Portfolio Context

Built as a flagship full-stack engineering project demonstrating:
- Real-world integration with enterprise OAuth 2.0 flows (Meta Graph, LinkedIn REST, Google).
- Next.js 16 App Router architecture and serverless worker design.
- Production-grade UI/UX design tailored for non-technical executive management.
- Cryptographic state persistence and distributed cloud architecture.

---

*Licensed under the [MIT License](LICENSE).*
