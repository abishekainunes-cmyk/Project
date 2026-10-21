import crypto from "crypto";
import { getSharedState, setSharedState, sharedStateReady } from "../../../lib/shared-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_UPSTREAM = "https://nunes-social-post-machine-mu.vercel.app";

async function history() {
  const h = await getSharedState("whatsapp:status:history");
  return Array.isArray(h) ? h : [];
}

export async function GET() {
  if (!sharedStateReady() && process.env.VERCEL !== "1") {
    try {
      const upstream = (process.env.NUNES_UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
      const res = await fetch(`${upstream}/api/whatsapp/status`, { cache: "no-store" });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch (e) {
      console.warn("[WHATSAPP STATUS PROXY FALLBACK FAILED]", String(e?.message || e));
    }
  }

  try {
    return Response.json({ ok: true, history: (await history()).slice(0, 100) });
  } catch (e) {
    console.error("[WHATSAPP STATUS] history load failed", String(e?.message || e));
    return Response.json({ ok: false, error: "Unable to load WhatsApp status history." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!sharedStateReady() && process.env.VERCEL !== "1") {
    try {
      const upstream = (process.env.NUNES_UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
      const body = await request.text();
      const res = await fetch(`${upstream}/api/whatsapp/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store"
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch (e) {
      console.warn("[WHATSAPP STATUS POST PROXY FALLBACK FAILED]", String(e?.message || e));
    }
  }

  try {
    const body = await request.json();
    const action = String(body.action || "save");
    const selected = Array.isArray(body.numberIds) ? body.numberIds.filter(Boolean) : [];
    const entry = {
      id: crypto.randomUUID(),
      text: String(body.text || "").slice(0, 5000),
      mediaUrl: String(body.mediaUrl || "").slice(0, 2000),
      numberIds: selected,
      scheduledFor: body.scheduledFor ? String(body.scheduledFor) : "",
      createdAt: new Date().toISOString(),
      status: action === "schedule" ? "SCHEDULED_REMINDER" : action === "publish" ? "MANUAL_STATUS_REQUIRED" : "DRAFT"
    };

    if (!entry.text && !entry.mediaUrl) {
      return Response.json({ ok: false, error: "Add status text or media first." }, { status: 400 });
    }
    if (!selected.length) {
      return Response.json({ ok: false, error: "Select at least one WhatsApp number." }, { status: 400 });
    }

    if (action === "publish") {
      entry.error = "Meta's official WhatsApp Cloud API does not provide an automatic Status (Story) publishing endpoint. Use the NUNES Status Draft & Reminder workflow to post to WhatsApp Business.";
    }

    const h = await history();
    await setSharedState("whatsapp:status:history", [entry, ...h].slice(0, 250));

    if (action === "publish") {
      return Response.json({ ok: false, entry, error: entry.error }, { status: 409 });
    }
    return Response.json({ ok: true, entry });
  } catch (e) {
    console.error("[WHATSAPP STATUS] operation failed", String(e?.message || e));
    return Response.json({ ok: false, error: "WhatsApp status operation failed." }, { status: 500 });
  }
}
