import { getSharedState, setSharedState } from "../../../lib/shared-state";
import { fetchUpstream } from "../../../lib/upstream-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const force = Boolean(body.force);
    const lockKey = "lock:cron:social-publish";

    if (force) {
      await setSharedState(lockKey, null);
    }

    const secret = process.env.CRON_SECRET || "";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "nunes-social-post-machine-mu.vercel.app";
    const origin = `${proto}://${host}`;

    const headers = {
      "Content-Type": "application/json"
    };
    if (secret) {
      headers["Authorization"] = `Bearer ${secret}`;
    }

    // Call the cron route directly
    const cronUrl = `${origin}/api/cron/social-publish`;
    const res = await fetch(cronUrl, {
      method: "POST",
      headers,
      cache: "no-store"
    });

    const data = await res.json().catch(() => ({}));

    // If local without CRON_SECRET or in edge mode, return direct status
    return Response.json({
      ok: true,
      triggered: true,
      response: data,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
