import { getSharedState, sharedStateReady } from "../../lib/shared-state";
import { fetchUpstream } from "../../lib/upstream-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const history = await getSharedState("history:posts");
    if (Array.isArray(history) && history.length > 0) {
      return Response.json(
        { ok: true, posts: history.slice(0, 250) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  } catch (e) {
    console.warn("[PUBLISHING HISTORY LOCAL]", String(e?.message || e));
  }

  // Fallback to verified upstream persistent storage
  try {
    const res = await fetchUpstream("api/publishing-history");
    if (res.ok) {
      const data = await res.json();
      return Response.json(data);
    }
  } catch (e) {
    console.warn("[HISTORY PROXY FALLBACK FAILED]", String(e?.message || e));
  }

  return Response.json({ ok: true, posts: [] }, { headers: { "Cache-Control": "no-store" } });
}
