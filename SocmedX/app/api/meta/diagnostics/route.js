import { getSharedState, sharedStateReady } from "../../../lib/shared-state";
import { fetchUpstream } from "../../../lib/upstream-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [fbCfg, igCfg, waCfg, fbTok, igTok, waTok] = await Promise.all([
    getSharedState("config:facebook"),
    getSharedState("config:instagram"),
    getSharedState("config:whatsapp"),
    getSharedState("token:facebook"),
    getSharedState("token:instagram"),
    getSharedState("token:whatsapp")
  ]);

  if (fbTok?.access_token || fbCfg?.clientId) {
    return Response.json({
      ok: true,
      facebook: {
        configured: Boolean(fbCfg?.clientId && fbCfg?.clientSecret),
        configIdPresent: Boolean(fbCfg?.configId),
        pageIdPresent: Boolean(fbCfg?.accountId),
        tokenPresent: Boolean(fbTok?.access_token),
        pageName: fbCfg?.name || "",
        scopes: fbTok?.scopes || []
      },
      instagram: {
        configured: Boolean(igCfg?.clientId && igCfg?.clientSecret),
        userIdPresent: Boolean(igCfg?.accountId),
        accountId: igCfg?.accountId || "",
        tokenPresent: Boolean(igTok?.access_token),
        username: igCfg?.name || igTok?.username || "",
        verified: Boolean(igCfg?.verified && igTok?.access_token)
      },
      whatsapp: {
        configured: Boolean(waCfg?.clientId && waCfg?.clientSecret),
        wabaIdPresent: Boolean(waCfg?.secondaryId),
        phoneNumberIdPresent: Boolean(waCfg?.accountId),
        tokenPresent: Boolean(waTok?.access_token),
        phone: waCfg?.phone || ""
      }
    });
  }

  // Fallback to verified upstream persistent storage
  try {
    const res = await fetchUpstream("api/meta/diagnostics");
    if (res.ok) {
      const data = await res.json();
      return Response.json(data);
    }
  } catch (e) {
    console.warn("[META DIAGNOSTICS FALLBACK FAILED]", String(e?.message || e));
  }

  return Response.json({
    ok: true,
    facebook: { configured: false, configIdPresent: false, pageIdPresent: false, tokenPresent: false, pageName: "", scopes: [] },
    instagram: { configured: false, userIdPresent: false, accountId: "", tokenPresent: false, username: "", verified: false },
    whatsapp: { configured: false, wabaIdPresent: false, phoneNumberIdPresent: false, tokenPresent: false, phone: "" }
  });
}
