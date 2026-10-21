import { getSharedState, setSharedState } from "../../../lib/shared-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySecret(request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // If no secret configured in environment, allow call (or dev environment)

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.replace(/^Bearer\s+/i, "") === expected) return true;

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret === expected) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === expected) return true;

  return false;
}

export async function GET(request) {
  return handleCron(request);
}

export async function POST(request) {
  return handleCron(request);
}

async function handleCron(request) {
  if (!verifySecret(request)) {
    return Response.json({ ok: false, error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
  }

  // Idempotency lock to prevent duplicate runs
  const lockKey = "lock:cron:social-publish";
  const existingLock = await getSharedState(lockKey);
  const now = Date.now();

  if (existingLock && now - Number(existingLock.timestamp || 0) < 180_000) {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "Previous cron run lock is active. Skipping duplicate execution.",
      lockedAt: new Date(existingLock.timestamp).toISOString()
    });
  }

  // Set lock
  await setSharedState(lockKey, { timestamp: now, runner: "vercel-cron" });

  try {
    const rawSchedules = (await getSharedState("automation:schedules")) || [];
    const schedules = Array.isArray(rawSchedules) ? rawSchedules : [];

    const dueItems = schedules.filter(item => {
      if (item.enabled === false) return false;
      if (item.status !== "SCHEDULED") return false;
      const scheduledMs = Date.parse(item.scheduledAt || "");
      return !Number.isNaN(scheduledMs) && scheduledMs <= now;
    });

    if (!dueItems.length) {
      await setSharedState(lockKey, null);
      return Response.json({
        ok: true,
        message: "No scheduled posts due for publication.",
        dueCount: 0,
        totalSchedules: schedules.length
      });
    }

    const results = [];
    const updatedSchedules = [...schedules];

    for (const item of dueItems) {
      const index = updatedSchedules.findIndex(s => s.id === item.id);
      if (index === -1) continue;

      updatedSchedules[index] = { ...updatedSchedules[index], status: "PROCESSING", updated_at: new Date().toISOString() };
      await setSharedState("automation:schedules", updatedSchedules);

      // Execute publishing via internal publish logic
      let publishResult = null;
      try {
        const platform = item.platform || "Instagram";
        const publishUrl = new URL("/api/publish", request.url);
        const res = await fetch(publishUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: item.topic || "Scheduled Post",
            channel: platform,
            text: item.content || item.caption || "",
            mediaUrl: item.mediaUrl || "",
            idempotencyKey: `cron:${item.id}:${Date.now()}`
          })
        });

        const json = await res.json().catch(() => ({}));
        publishResult = json;
      } catch (err) {
        publishResult = { ok: false, error: String(err?.message || err) };
      }

      const isSuccess = Boolean(publishResult?.ok && publishResult?.external?.status === "POSTED");
      const postTimestamp = new Date().toISOString();

      if (isSuccess) {
        updatedSchedules[index] = {
          ...updatedSchedules[index],
          status: "POSTED",
          published_at: postTimestamp,
          updated_at: postTimestamp,
          external_post_id: publishResult.external?.externalId || publishResult.post?.id || null,
          external_url: publishResult.external?.permalink || publishResult.post?.url || null,
          last_error: null
        };
        results.push({ id: item.id, platform: item.platform, status: "POSTED", externalId: publishResult.external?.externalId });
      } else {
        const retries = (item.retry_count || 0) + 1;
        const errDetail = publishResult?.external?.error || publishResult?.error || "Unknown provider failure";
        const finalFailed = retries >= 3;

        updatedSchedules[index] = {
          ...updatedSchedules[index],
          status: finalFailed ? "FAILED" : "SCHEDULED",
          retry_count: retries,
          last_error: errDetail,
          updated_at: postTimestamp
        };
        results.push({ id: item.id, platform: item.platform, status: finalFailed ? "FAILED" : "RETRY_QUEUED", error: errDetail });
      }

      await setSharedState("automation:schedules", updatedSchedules);
    }

    // Release lock
    await setSharedState(lockKey, null);

    return Response.json({
      ok: true,
      processed: dueItems.length,
      results
    });
  } catch (e) {
    // Release lock on exception
    await setSharedState(lockKey, null);
    console.error("[CRON WORKER] exception", String(e?.message || e));
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
