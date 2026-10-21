import { cookies } from "next/headers";
import crypto from "node:crypto";
import { cookieName, unseal, readConfig, secretFromJar } from "../../lib/oauth-store";
import { getSharedState, setSharedState, sharedStateReady } from "../../lib/shared-state";
import { isEnabledProvider } from "../../lib/social-providers";
import { fetchUpstream } from "../../lib/upstream-backend";

export const runtime = "nodejs";
const activePublishes = globalThis.__nunesActivePublishes || (globalThis.__nunesActivePublishes = new Set());

async function tokenFor(platform) {
  const id = String(platform || "").toLowerCase();
  const shared = await getSharedState(`token:${id}`);
  if (shared?.access_token) return shared;
  const jar = await cookies();
  return unseal(jar.get(cookieName(platform))?.value, secretFromJar(jar));
}

async function archive(body, external) {
  const post = {
    id: crypto.randomUUID(),
    topic: String(body.topic || body.product || "Post").slice(0, 220),
    channel: String(body.channel || "").slice(0, 40),
    text: String(body.text || "").slice(0, 8000),
    mediaUrl: String(body.mediaUrl || "").slice(0, 2000),
    angle: String(body.angle || "").slice(0, 100),
    attachments: Array.isArray(body.attachments)
      ? body.attachments.slice(0, 20).map(x => ({
          name: String(x?.name || "").slice(0, 260),
          url: String(x?.url || "").slice(0, 2000),
          type: String(x?.type || "").slice(0, 150),
          size: Number(x?.size || 0)
        }))
      : [],
    publishedAt: new Date().toISOString(),
    external,
    url: external?.permalink || null,
    deliveryVerified: external?.deliveryVerified === true,
    savedPreview: false
  };

  try {
    const history = (await getSharedState("history:posts")) || [];
    const next = [{ ...post, savedPreview: true }, ...(Array.isArray(history) ? history : [])].slice(0, 250);
    post.savedPreview = await setSharedState("history:posts", next);
  } catch (e) {
    console.warn("[ARCHIVE] history update exception", String(e?.message || e));
  }

  return post;
}

async function postLinkedIn(body, token, config) {
  if (!token?.access_token) {
    return { status: "NOT_CONNECTED", error: "LinkedIn is not connected. Connect LinkedIn before publishing." };
  }

  const grantedScopes = String(token?.scope || "").split(/[\s,]+/).filter(Boolean);
  const hasOrgPosting = grantedScopes.includes("w_organization_social") || grantedScopes.includes("rw_organization_admin");

  const configuredAuthor = config?.accountId || process.env.LINKEDIN_AUTHOR_URN || null;
  const wantsOrganization = String(configuredAuthor || "").startsWith("urn:li:organization:");

  if (!wantsOrganization) {
    return {
      status: "COMPANY_ACCOUNT_REQUIRED",
      error: "LinkedIn company publishing requires a configured organization URN (e.g., urn:li:organization:123456). Personal-profile fallback is disabled."
    };
  }
  if (!hasOrgPosting) {
    return {
      status: "COMPANY_PERMISSION_REQUIRED",
      error: "LinkedIn OAuth requires w_organization_social to publish to the NUNES company Page. Reauthorize with approved organization posting access."
    };
  }

  const author = configuredAuthor;
  const r = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": "202606"
    },
    body: JSON.stringify({
      author,
      commentary: body.text,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    })
  });

  const text = await r.text();
  const restliId = r.headers.get("x-restli-id");

  return {
    status: r.ok ? "POSTED" : "FAILED",
    httpStatus: r.status,
    externalId: restliId || null,
    permalink: r.ok && restliId ? `https://www.linkedin.com/feed/update/${encodeURIComponent(restliId)}/` : null,
    authorUsed: author,
    error: r.ok ? null : text.slice(0, 800)
  };
}

async function postFacebook(body, token, config) {
  if (!token?.access_token) {
    return {
      status: "NOT_CONNECTED",
      error: "Facebook is not connected. Reconnect Meta before publishing.",
      technicalError: "No Facebook access token is stored."
    };
  }

  const required = ["pages_read_engagement", "pages_manage_posts"];
  let granted = [];
  try {
    const pr = await fetch("https://graph.facebook.com/v24.0/me/permissions?access_token=" + encodeURIComponent(token.access_token), { cache: "no-store" });
    const pj = await pr.json().catch(() => ({}));
    if (pr.ok && Array.isArray(pj.data)) granted = pj.data.filter(x => x.status === "granted").map(x => x.permission);
  } catch {}

  const missing = required.filter(x => !granted.includes(x));
  if (missing.length) {
    return {
      status: "PERMISSION_REQUIRED",
      error: "Facebook needs Page publishing permission. Open Meta connection and reconnect with the required permissions.",
      technicalError: `Missing granted permissions: ${missing.join(", ")}`,
      action: "RECONNECT_META",
      missingPermissions: missing
    };
  }

  let pageId = config?.accountId || "1398853319976762";
  let pageToken = token.access_token;
  let selectedPage = null;

  try {
    const pages = await fetch(
      "https://graph.facebook.com/v24.0/me/accounts?fields=id,name,access_token,tasks&access_token=" + encodeURIComponent(token.access_token),
      { cache: "no-store" }
    );
    const pj = await pages.json().catch(() => ({}));
    if (pages.ok && Array.isArray(pj.data) && pj.data.length) {
      selectedPage = pageId ? pj.data.find(x => String(x.id) === String(pageId)) : pj.data[0];
      if (selectedPage) {
        pageId = selectedPage.id;
        pageToken = selectedPage.access_token || pageToken;
      }
    }
  } catch {}

  if (!selectedPage || !pageId) {
    return {
      status: "PAGE_ACCESS_REQUIRED",
      error: "Nunes Instrumentation Page is not available to this Meta login. Reconnect Meta and grant/select the Page.",
      technicalError: "Target Page not returned by /me/accounts.",
      action: "RECONNECT_META"
    };
  }

  const tasks = Array.isArray(selectedPage.tasks) ? selectedPage.tasks : [];
  if (tasks.length && !tasks.includes("CREATE_CONTENT") && !tasks.includes("MANAGE")) {
    return {
      status: "PAGE_ROLE_REQUIRED",
      error: "Your Facebook account does not have permission to create content for this Page. Give this user Page content/admin access, then reconnect Meta.",
      technicalError: `Page tasks returned by Meta: ${tasks.join(", ") || "none"}`,
      action: "RECONNECT_META"
    };
  }

  const data = new URLSearchParams({ message: body.text, access_token: pageToken });
  const r = await fetch(`https://graph.facebook.com/v24.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data
  });

  const j = await r.json().catch(() => ({}));
  const raw = JSON.stringify(j).slice(0, 1200);
  if (!r.ok) {
    return {
      status: "FAILED",
      httpStatus: r.status,
      externalId: null,
      error: "Facebook could not publish this post. Reconnect Meta or check Facebook Page publishing permissions.",
      technicalError: raw,
      action: "RECONNECT_META"
    };
  }

  return {
    status: "POSTED",
    httpStatus: r.status,
    externalId: j.id || null,
    permalink: j.id ? `https://www.facebook.com/${j.id.replace("_", "/posts/")}` : null,
    deliveryVerified: true,
    pageId,
    pageName: selectedPage.name || "Nunes Instrumentation",
    error: null
  };
}

async function postInstagram(body, token, config) {
  if (!token?.access_token) {
    return { status: "NOT_CONNECTED", error: "Instagram is not connected. Reconnect Meta and grant Instagram permissions." };
  }
  if (!body.mediaUrl) {
    return { status: "MEDIA_REQUIRED", error: "Instagram requires a public image/video URL for publishing." };
  }

  let igUserId = config?.accountId || token.instagram_user_id || "17841422933669789";
  let accessToken = token.access_token;

  if (!igUserId) {
    try {
      const pages = await fetch(
        "https://graph.facebook.com/v24.0/me/accounts?fields=id,access_token,instagram_business_account&access_token=" + encodeURIComponent(token.access_token),
        { cache: "no-store" }
      );
      const pj = await pages.json().catch(() => ({}));
      const page = (pj.data || []).find(x => x.instagram_business_account?.id);
      if (page) {
        igUserId = page.instagram_business_account.id;
        accessToken = page.access_token || accessToken;
      }
    } catch {}
  }

  if (!igUserId) {
    return { status: "ACCOUNT_ID_REQUIRED", error: "Instagram Professional account is not linked. Reconnect Meta with instagram_basic permission." };
  }

  const isVideo = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(body.mediaUrl);
  const create = new URLSearchParams({
    access_token: accessToken,
    caption: body.text || ""
  });

  if (isVideo) {
    create.set("media_type", "REELS");
    create.set("video_url", body.mediaUrl);
  } else {
    create.set("image_url", body.mediaUrl);
  }

  // Step 1: Create media container
  const r1 = await fetch(`https://graph.facebook.com/v24.0/${encodeURIComponent(igUserId)}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: create
  });
  const j1 = await r1.json().catch(() => ({}));
  if (!r1.ok || !j1.id) {
    return {
      status: "FAILED",
      httpStatus: r1.status,
      error: "Instagram media container creation failed.",
      technicalError: JSON.stringify(j1).slice(0, 800)
    };
  }

  // Step 2: If video, wait for processing
  if (isVideo) {
    for (let i = 0; i < 12; i++) {
      const sr = await fetch(
        `https://graph.facebook.com/v24.0/${encodeURIComponent(j1.id)}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`,
        { cache: "no-store" }
      );
      const sj = await sr.json().catch(() => ({}));
      if (sj.status_code === "FINISHED") break;
      if (sj.status_code === "ERROR" || sj.status_code === "EXPIRED") {
        return { status: "FAILED", error: "Instagram Reel processing failed.", technicalError: JSON.stringify(sj) };
      }
      await new Promise(r => setTimeout(r, 2500));
    }
  }

  // Step 3: Publish media container
  const publish = new URLSearchParams({ creation_id: j1.id, access_token: accessToken });
  const r2 = await fetch(`https://graph.facebook.com/v24.0/${encodeURIComponent(igUserId)}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publish
  });
  const j2 = await r2.json().catch(() => ({}));

  if (!r2.ok || !j2.id) {
    return {
      status: "FAILED",
      httpStatus: r2.status,
      error: "Instagram media publishing failed.",
      technicalError: JSON.stringify(j2).slice(0, 800)
    };
  }

  return {
    status: "POSTED",
    httpStatus: r2.status,
    externalId: j2.id || null,
    permalink: j2.id ? `https://www.instagram.com/p/${j2.id}/` : null,
    deliveryVerified: true,
    error: null
  };
}

async function postYouTube(body, token) {
  if (!token?.access_token) {
    return { status: "NOT_CONNECTED", error: "YouTube is not connected. Authorize YouTube before publishing." };
  }
  if (!body.mediaUrl) {
    return { status: "MEDIA_REQUIRED", error: "YouTube requires a public video URL." };
  }

  const source = await fetch(body.mediaUrl);
  if (!source.ok) return { status: "FAILED", error: "Could not download the video from the supplied Media URL." };
  const contentType = source.headers.get("content-type") || "video/mp4";
  if (!contentType.startsWith("video/")) {
    return { status: "MEDIA_REQUIRED", error: "YouTube Media URL must point to a video file." };
  }
  const buffer = Buffer.from(await source.arrayBuffer());

  const metadata = {
    snippet: {
      title: String(body.topic || "Nunes Instrumentation").slice(0, 100),
      description: String(body.text || "").slice(0, 5000)
    },
    status: { privacyStatus: "private" }
  };

  const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(buffer.length),
      "X-Upload-Content-Type": contentType
    },
    body: JSON.stringify(metadata)
  });
  if (!init.ok) return { status: "FAILED", httpStatus: init.status, error: (await init.text()).slice(0, 800) };
  const location = init.headers.get("location");
  if (!location) return { status: "FAILED", error: "YouTube did not return an upload URL." };

  const up = await fetch(location, { method: "PUT", headers: { "Content-Type": contentType, "Content-Length": String(buffer.length) }, body: buffer });
  const j = await up.json().catch(() => ({}));
  return { status: up.ok ? "POSTED" : "FAILED", httpStatus: up.status, externalId: j.id || null, error: up.ok ? null : JSON.stringify(j).slice(0, 800) };
}

async function externalPublish(body) {
  if (!isEnabledProvider(body.channel)) {
    return { status: "UNSUPPORTED_PROVIDER", error: `Social network ${body.channel} is disabled in NUNES Command Center.` };
  }

  const token = await tokenFor(body.channel);
  const jar = await cookies();
  const id = String(body.channel || "").toLowerCase();
  const cfg = (await getSharedState(`config:${id}`)) || readConfig(jar, id);

  if (body.channel === "LinkedIn") return postLinkedIn(body, token, cfg);
  if (body.channel === "Facebook") return postFacebook(body, token, cfg);
  if (body.channel === "Instagram") return postInstagram(body, token, cfg);
  if (body.channel === "YouTube") return postYouTube(body, token);

  return { status: "UNSUPPORTED" };
}

export async function POST(request) {
  if (!sharedStateReady() && process.env.VERCEL !== "1") {
    try {
      const body = await request.text();
      const res = await fetchUpstream("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch (e) {
      console.warn("[PUBLISH PROXY FALLBACK FAILED]", String(e?.message || e));
    }
  }

  try {
    const body = await request.json();
    if (!String(body.channel || "").trim() || !String(body.text || "").trim()) {
      return Response.json({ ok: false, error: "Missing channel or text" }, { status: 400 });
    }

    const rawKey = String(body.idempotencyKey || "").trim();
    if (!rawKey || rawKey.length > 200 || !/^[a-zA-Z0-9:_-]+$/.test(rawKey)) {
      return Response.json({ ok: false, error: "A valid publishing idempotency key is required." }, { status: 400 });
    }
    const key = crypto.createHash("sha256").update(rawKey).digest("hex");
    const stateKey = "publish:receipt:" + key;

    if (activePublishes.has(key)) {
      return Response.json({ ok: false, error: "This post is already being published.", duplicate: true }, { status: 409 });
    }
    activePublishes.add(key);

    try {
      const previous = await getSharedState(stateKey);
      if (previous) return Response.json({ ...previous, duplicate: true });

      let external = await externalPublish(body);
      if (external?.status === "NOT_CONNECTED") {
        try {
          const ures = await fetchUpstream("/api/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          if (ures.ok) {
            const udata = await ures.json();
            return Response.json(udata);
          }
        } catch (e) {
          console.warn("[PUBLISH UPSTREAM DELEGATE FAILED]", String(e?.message || e));
        }
      }

      const post = await archive(body, external);
      const result = { ok: true, post, external };
      const saved = await setSharedState(stateKey, result);
      return Response.json({ ...result, receiptStored: saved });
    } finally {
      activePublishes.delete(key);
    }
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || "Publishing failed") }, { status: 500 });
  }
}
