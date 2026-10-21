# NUNES Social Media Command Center — Local Baseline

Version: 2026.10.20-local.1

This ZIP is the new local working baseline for UI/marketing workflow development while the original GitHub account is suspended.

## What this package does

- Professional management-first dashboard.
- Uses the CURRENT production NUNES APIs instead of fake data.
- Shows only LinkedIn, Facebook, Instagram, YouTube and WhatsApp.
- Separates Admin view from Tech diagnostics.
- Platform-specific marketing copy generation.
- Review-before-publish workflow.
- Real publishing calls through the production API.
- Real publishing history from production.
- Instagram auto-post queue using the existing production `/api/automation/schedule` endpoint.
- Direct Instagram connection opens the production OAuth route so Meta's registered callback remains valid.

## Current verified production status when this baseline was created

- LinkedIn: connected.
- Facebook: connected and publishing-ready.
- Instagram: configured with Instagram account ID 17841422933669789 but direct Instagram OAuth token not yet saved.
- WhatsApp: connected (1 number reported by production status API).
- YouTube: not configured.

The UI never treats "configured" as "connected".

## Run on Windows

1. Extract the ZIP to a normal folder, for example:
   `D:\NUNES_SOCIAL_COMMAND_CENTER_LOCAL`
2. Install Node.js 22+ if it is not already installed.
3. Double-click `START_LOCAL_WINDOWS.bat`.
4. The app opens at `http://localhost:3000`.

The first run installs npm packages. Later runs reuse them.

## Instagram connection

The local UI deliberately opens the production Instagram OAuth page:

`https://nunes-social-post-machine-mu.vercel.app/connect/Instagram`

This is required because Meta OAuth redirect URIs are registered against the production domain. After authorization, return to the local dashboard and press Refresh. The local app reads the real production connection status.

For current Instagram Login integrations, Meta uses the Instagram-business scopes such as `instagram_business_basic` and `instagram_business_content_publish`. Keep the production OAuth implementation on those current scopes.

## Auto posting

The Auto Posting screen writes to the current production scheduling endpoint. Scheduling is disabled until the production API reports Instagram as truly connected. It never fabricates success.

## Important architecture note

This package is intentionally a local UI/control-center layer over the existing production backend. That protects the current working encrypted social connections while GitHub access is suspended. Do not point `NUNES_UPSTREAM_URL` back to the same deployment if you later deploy this exact proxy architecture as the production backend; that would create a proxy loop.

For a future full-source migration, first recover/export the original production backend or move the backend to a stable API service, then replace the proxy route with those local API routes.

## Future ZIP rule

Use this ZIP as the baseline. Each future update should be versioned and delivered as a new ZIP so the previous working version remains available for rollback.
