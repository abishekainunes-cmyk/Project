import { getSharedState } from "../../lib/shared-state";
import { fetchUpstream } from "../../lib/upstream-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v24.0";

const DEFAULT_INDUSTRIAL_BANNERS = {
  Facebook: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
  LinkedIn: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
  Instagram: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80",
  WhatsApp: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80",
  YouTube: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80"
};

async function graphJson(path, accessToken, fields = "") {
  const url = new URL(`${GRAPH}/${path}`);
  if (fields) url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", accessToken);
  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return { res, json };
  } catch (e) {
    return { res: { ok: false, status: 500 }, json: { error: { message: String(e?.message || e) } } };
  }
}

export async function GET() {
  const livePosts = [];
  const seenIds = new Set();

  // 1. Fetch Verified Publishing History from Shared State or Upstream
  let history = [];
  try {
    const localHistory = await getSharedState("history:posts");
    if (Array.isArray(localHistory) && localHistory.length > 0) {
      history = localHistory;
    } else {
      const up = await fetchUpstream("api/publishing-history");
      if (up.ok) {
        const upJson = await up.json().catch(() => ({}));
        if (Array.isArray(upJson.posts)) history = upJson.posts;
      }
    }
  } catch (e) {
    console.warn("[LIVE POSTS] Error fetching history:", String(e?.message || e));
  }

  // 2. Query Meta Graph API for Live Facebook Page Posts if Token Available
  try {
    let fbToken = await getSharedState("token:facebook");
    if (!fbToken?.access_token) {
      const up = await fetchUpstream("api/integrations/status");
      const upJson = await up.json().catch(() => ({}));
      if (upJson.integrations?.Facebook?.connected) {
        // Upstream has live Facebook connection
      }
    }

    if (fbToken?.access_token) {
      const userToken = fbToken.access_token;
      // Get Page Access Token for Nunes Instrumentation
      const pagesRes = await graphJson("me/accounts", userToken, "id,name,access_token");
      if (pagesRes.res.ok && Array.isArray(pagesRes.json?.data)) {
        const page = pagesRes.json.data.find(p => String(p.id) === "1398853319976762" || /nunes/i.test(p.name)) || pagesRes.json.data[0];
        if (page?.access_token) {
          const pageToken = page.access_token;
          const pagePosts = await graphJson(
            `${page.id}/posts`,
            pageToken,
            "id,message,created_time,full_picture,permalink_url,attachments{media,type,url}"
          );

          if (pagePosts.res.ok && Array.isArray(pagePosts.json?.data)) {
            pagePosts.json.data.forEach(fbPost => {
              const postId = fbPost.id;
              seenIds.add(postId);
              const img = fbPost.full_picture || fbPost.attachments?.data?.[0]?.media?.image?.src || DEFAULT_INDUSTRIAL_BANNERS.Facebook;
              livePosts.push({
                id: postId,
                channel: "Facebook",
                accountName: page.name || "Nunes Instrumentation",
                accountHandle: "nunesinstrumentation",
                text: fbPost.message || "Live update from Nunes Instrumentation Facebook Page.",
                topic: fbPost.message?.slice(0, 60) || "Facebook Page Update",
                mediaUrl: img,
                url: fbPost.permalink_url || `https://facebook.com/${postId}`,
                externalId: postId,
                publishedAt: fbPost.created_time || new Date().toISOString(),
                status: "POSTED",
                liveVerified: true,
                source: "meta-graph-live"
              });
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("[LIVE POSTS] Meta Graph live fetch exception:", String(e?.message || e));
  }

  // 3. Process Verified Published Posts from System Records
  if (Array.isArray(history)) {
    const verifiedPosted = history.filter(p => p.external?.status === "POSTED");

    verifiedPosted.forEach(p => {
      const externalId = p.external?.externalId || p.id;
      if (seenIds.has(externalId)) return; // Already loaded from Graph API
      seenIds.add(externalId);

      const channel = p.channel || "Facebook";
      const media = p.mediaUrl || DEFAULT_INDUSTRIAL_BANNERS[channel] || DEFAULT_INDUSTRIAL_BANNERS.Facebook;

      let postUrl = p.url || p.external?.permalink || null;
      if (!postUrl) {
        if (channel === "Facebook" && p.external?.externalId) {
          postUrl = `https://www.facebook.com/${p.external.externalId}`;
        } else if (channel === "LinkedIn" && p.external?.externalId) {
          postUrl = `https://www.linkedin.com/feed/update/${p.external.externalId}`;
        } else if (channel === "Instagram") {
          postUrl = "https://www.instagram.com/nunesinstrumentation/";
        }
      }

      livePosts.push({
        id: p.id,
        channel,
        accountName: channel === "Facebook" ? "Nunes Instrumentation" :
                     channel === "LinkedIn" ? "Nunes Instrumentation Page" :
                     channel === "Instagram" ? "Nunes Instrumentation" :
                     channel === "WhatsApp" ? "Nunes Business Main" : "Nunes Instrumentation",
        accountHandle: channel === "Instagram" ? "@nunesinstrumentation" :
                       channel === "Facebook" ? "nunesinstrumentation" :
                       channel === "LinkedIn" ? "nunes-instrumentation" :
                       channel === "WhatsApp" ? "+91-Official" : "nunes",
        text: p.text || p.topic || "Industrial Instrumentation publication",
        topic: p.topic || "Post",
        mediaUrl: media,
        url: postUrl,
        externalId: p.external?.externalId || p.id,
        publishedAt: p.publishedAt || new Date().toISOString(),
        status: "POSTED",
        liveVerified: true,
        source: "system-audit"
      });
    });
  }

  // Sort descending by publication date
  livePosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return Response.json({
    ok: true,
    count: livePosts.length,
    posts: livePosts
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
