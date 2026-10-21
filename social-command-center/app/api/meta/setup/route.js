import { ensureInstagramConnection } from "../../../lib/meta-instagram";
import { getSharedState, setSharedState, sharedStateReady } from "../../../lib/shared-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_UPSTREAM = "https://nunes-social-post-machine-mu.vercel.app";

export async function GET() {
  if (!sharedStateReady() && process.env.VERCEL !== "1") {
    try {
      const upstream = (process.env.NUNES_UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
      const res = await fetch(`${upstream}/api/meta/setup`, { cache: "no-store" });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch (e) {
      console.warn("[META SETUP PROXY FALLBACK FAILED]", String(e?.message || e));
    }
  }

  let [fb, ig, wa, fbToken, igToken, waToken] = await Promise.all([
    getSharedState("config:facebook"),
    getSharedState("config:instagram"),
    getSharedState("config:whatsapp"),
    getSharedState("token:facebook"),
    getSharedState("token:instagram"),
    getSharedState("token:whatsapp")
  ]);

  let instagramHealth = null;
  if (fbToken?.access_token && !igToken?.access_token) {
    instagramHealth = await ensureInstagramConnection(ig || {}, fbToken);
    if (instagramHealth.connected) {
      [ig, igToken] = await Promise.all([
        getSharedState("config:instagram"),
        getSharedState("token:instagram")
      ]);
    }
  }

  const isInstagramConnected = Boolean(igToken?.access_token && ig?.verified);

  return Response.json({
    ok: true,
    metaConfigured: Boolean(fb?.clientId && fb?.clientSecret),
    facebook: {
      connected: Boolean(fbToken?.access_token),
      pageId: fb?.accountId || "1398853319976762",
      name: fb?.name || "Nunes Instrumentation"
    },
    instagram: {
      connected: isInstagramConnected,
      userId: ig?.accountId || "17841422933669789",
      name: isInstagramConnected ? (ig?.name || igToken?.username || "nunesinstrumentation") : "",
      accountType: ig?.accountType || igToken?.account_type || "BUSINESS",
      health: instagramHealth
    },
    whatsapp: {
      connected: Boolean(waToken?.access_token),
      phoneNumberId: wa?.accountId || "",
      wabaId: wa?.secondaryId || "",
      phone: wa?.phone || ""
    }
  });
}

export async function POST(request) {
  if (!sharedStateReady() && process.env.VERCEL !== "1") {
    try {
      const upstream = (process.env.NUNES_UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
      const body = await request.text();
      const res = await fetch(`${upstream}/api/meta/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store"
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch (e) {
      console.warn("[META SETUP POST PROXY FALLBACK FAILED]", String(e?.message || e));
    }
  }

  try {
    const body = await request.json();
    const clean = (v) => String(v || "").trim().replace(/^["']|["']$/g, "");
    const clientId = clean(body.clientId);
    const clientSecret = clean(body.clientSecret);
    const facebookPageId = String(body.facebookPageId || "1398853319976762").trim();
    const instagramUserId = String(body.instagramUserId || "17841422933669789").trim();
    const wabaId = String(body.wabaId || "3603262783168599").trim();
    const phoneNumberId = String(body.phoneNumberId || facebookPageId).trim();
    const whatsappToken = String(body.whatsappToken || "").trim();
    const configId = String(body.configId || "").trim();

    if (!clientId || !clientSecret) {
      return Response.json({ ok: false, error: "Meta App ID and App Secret are required." }, { status: 400 });
    }

    // Validate App ID + App Secret with Graph API
    try {
      const verifyUrl = new URL("https://graph.facebook.com/oauth/access_token");
      verifyUrl.searchParams.set("client_id", clientId);
      verifyUrl.searchParams.set("client_secret", clientSecret);
      verifyUrl.searchParams.set("grant_type", "client_credentials");
      const vr = await fetch(verifyUrl, { cache: "no-store" });
      const vtext = await vr.text();
      let vjson = {};
      try { vjson = JSON.parse(vtext); } catch {}
      if (!vr.ok || !vjson.access_token) {
        const detail = vjson?.error?.message || vjson?.error_description || "Meta rejected this App ID/App Secret pair.";
        return Response.json({
          ok: false,
          error: `Meta App Secret validation failed: ${detail}`
        }, { status: 400 });
      }
    } catch {
      return Response.json({ ok: false, error: "Could not validate Meta credentials. Please retry." }, { status: 502 });
    }

    const now = Date.now();
    await setSharedState("config:facebook", { platform: "facebook", clientId, clientSecret, accountId: facebookPageId, secondaryId: "", configId, savedAt: now });
    await setSharedState("config:instagram", { platform: "instagram", clientId, clientSecret, accountId: instagramUserId, secondaryId: facebookPageId, configId, savedAt: now });
    await setSharedState("config:whatsapp", { platform: "whatsapp", clientId, clientSecret, accountId: phoneNumberId, secondaryId: wabaId, savedAt: now });

    if (instagramUserId) {
      const fbToken = await getSharedState("token:facebook");
      if (fbToken?.access_token) {
        const igConfig = await getSharedState("config:instagram");
        await ensureInstagramConnection(igConfig, fbToken);
      }
    }

    if (whatsappToken) {
      await setSharedState("token:whatsapp", { platform: "WhatsApp", access_token: whatsappToken, scope: "whatsapp_business_management whatsapp_business_messaging", createdAt: now });
    }

    return Response.json({ ok: true, connectUrl: "/api/oauth/facebook/start" });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || "Unable to save Meta setup") }, { status: 500 });
  }
}
