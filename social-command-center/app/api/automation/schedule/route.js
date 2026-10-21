import crypto from "crypto";
import { getSharedState, setSharedState, sharedStateReady } from "../../../lib/shared-state";
import { fetchUpstream } from "../../../lib/upstream-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rawSchedules, igToken, igConfig] = await Promise.all([
      getSharedState("automation:schedules"),
      getSharedState("token:instagram"),
      getSharedState("config:instagram")
    ]);

    const schedules = Array.isArray(rawSchedules) ? rawSchedules : [];
    const instagramConnected = Boolean(igToken?.access_token && igConfig?.verified);
    const accountName = igConfig?.name || igToken?.username || "";

    if (schedules.length > 0 || instagramConnected) {
      return Response.json({
        ok: true,
        instagramConnected,
        accountName,
        schedules
      });
    }
  } catch (e) {
    console.warn("[SCHEDULE READ LOCAL]", String(e?.message || e));
  }

  // Fallback to verified upstream persistent storage
  try {
    const res = await fetchUpstream("api/automation/schedule");
    if (res.ok) {
      const data = await res.json();
      return Response.json(data);
    }
  } catch (e) {
    console.warn("[SCHEDULE PROXY FALLBACK FAILED]", String(e?.message || e));
  }

  return Response.json({
    ok: true,
    instagramConnected: false,
    accountName: "",
    schedules: []
  });
}

export async function POST(request) {
  if (!sharedStateReady() && process.env.VERCEL !== "1") {
    try {
      const body = await request.text();
      const res = await fetchUpstream("api/automation/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch (e) {
      console.warn("[SCHEDULE POST PROXY FALLBACK FAILED]", String(e?.message || e));
    }
  }

  try {
    const body = await request.json();
    const action = String(body.action || "add").toLowerCase();
    const rawSchedules = (await getSharedState("automation:schedules")) || [];
    let schedules = Array.isArray(rawSchedules) ? rawSchedules : [];
    const now = new Date().toISOString();

    if (action === "add") {
      const caption = String(body.caption || body.content || body.text || "").trim();
      const mediaUrl = String(body.mediaUrl || "").trim();
      const scheduledAt = String(body.scheduledAt || body.scheduledTime || "").trim();
      const platform = String(body.platform || "Instagram").trim();
      const topic = String(body.topic || caption.slice(0, 60) || "Scheduled Post").trim();
      const timezone = String(body.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata");
      const initialStatus = String(body.status || "SCHEDULED").toUpperCase();

      if (!caption && !mediaUrl) {
        return Response.json({ ok: false, error: "Post caption or media URL is required." }, { status: 400 });
      }

      const newItem = {
        id: crypto.randomUUID(),
        topic,
        content: caption,
        caption,
        platform,
        mediaUrl,
        scheduledAt,
        timezone,
        status: initialStatus,
        enabled: true,
        created_at: now,
        updated_at: now,
        published_at: null,
        external_post_id: null,
        last_error: null,
        retry_count: 0
      };

      schedules.unshift(newItem);
      await setSharedState("automation:schedules", schedules);
      return Response.json({ ok: true, schedule: newItem, schedules });
    }

    if (action === "toggle") {
      const id = String(body.id || "");
      const enabled = body.enabled !== false;
      schedules = schedules.map(item => {
        if (item.id === id) {
          const status = enabled ? (item.status === "DRAFT" ? "SCHEDULED" : item.status) : "DRAFT";
          return { ...item, enabled, status, updated_at: now };
        }
        return item;
      });
      await setSharedState("automation:schedules", schedules);
      return Response.json({ ok: true, schedules });
    }

    if (action === "remove") {
      const id = String(body.id || "");
      schedules = schedules.filter(item => item.id !== id);
      await setSharedState("automation:schedules", schedules);
      return Response.json({ ok: true, schedules });
    }

    if (action === "approve") {
      const id = String(body.id || "");
      schedules = schedules.map(item => {
        if (item.id === id) {
          return { ...item, status: "APPROVED", updated_at: now };
        }
        return item;
      });
      await setSharedState("automation:schedules", schedules);
      return Response.json({ ok: true, schedules });
    }

    if (action === "update") {
      const id = String(body.id || "");
      schedules = schedules.map(item => {
        if (item.id === id) {
          return {
            ...item,
            topic: body.topic !== undefined ? String(body.topic) : item.topic,
            content: body.content !== undefined ? String(body.content) : (body.caption !== undefined ? String(body.caption) : item.content),
            caption: body.caption !== undefined ? String(body.caption) : item.caption,
            platform: body.platform !== undefined ? String(body.platform) : item.platform,
            mediaUrl: body.mediaUrl !== undefined ? String(body.mediaUrl) : item.mediaUrl,
            scheduledAt: body.scheduledAt !== undefined ? String(body.scheduledAt) : item.scheduledAt,
            status: body.status !== undefined ? String(body.status).toUpperCase() : item.status,
            updated_at: now
          };
        }
        return item;
      });
      await setSharedState("automation:schedules", schedules);
      return Response.json({ ok: true, schedules });
    }

    return Response.json({ ok: false, error: "Unsupported schedule action." }, { status: 400 });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
