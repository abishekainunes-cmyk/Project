import { getSharedState, setSharedState } from "./shared-state";

const GRAPH = "https://graph.facebook.com/v24.0";

async function graphJson(path, accessToken, fields = "") {
  const url = new URL(`${GRAPH}/${path}`);
  if (fields) url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", accessToken);
  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json().catch(e => ({ parseError: String(e?.message || e) }));
    return { res, json };
  } catch (e) {
    return { res: { ok: false, status: 500 }, json: { error: { message: String(e?.message || e) } } };
  }
}

async function validateCandidateId(igId, pageToken, userToken) {
  if (!igId) return null;
  // Try with pageToken first
  if (pageToken) {
    const lookup = await graphJson(
      encodeURIComponent(String(igId)),
      pageToken,
      "id,username,account_type,name,profile_picture_url"
    );
    if (lookup.res.ok && lookup.json?.id && lookup.json?.username) {
      return lookup.json;
    }
  }
  // Fallback to userToken
  if (userToken && userToken !== pageToken) {
    const lookup = await graphJson(
      encodeURIComponent(String(igId)),
      userToken,
      "id,username,account_type,name,profile_picture_url"
    );
    if (lookup.res.ok && lookup.json?.id && lookup.json?.username) {
      return lookup.json;
    }
  }
  return null;
}

export async function ensureInstagramConnection(igConfig = {}, fbToken = null) {
  const token = fbToken || (await getSharedState("token:facebook"));
  const userToken = token?.access_token;
  const configuredPageId = String(igConfig?.secondaryId || "1398853319976762").trim();

  if (!userToken) {
    return { connected: false, reason: "meta-token-missing", detail: "Facebook/Meta connection token is missing." };
  }

  try {
    // Step 1: Discover Facebook Pages
    const pagesLookup = await graphJson(
      "me/accounts",
      userToken,
      "id,name,access_token,tasks,instagram_business_account,connected_instagram_account"
    );

    if (!pagesLookup.res.ok) {
      const detail = pagesLookup.json?.error?.message || `HTTP ${pagesLookup.res.status}`;
      console.warn("[INSTAGRAM DISCOVERY] /me/accounts failed", detail);
      return { connected: false, reason: "page-discovery-failed", detail };
    }

    const pages = Array.isArray(pagesLookup.json?.data) ? pagesLookup.json.data : [];
    if (!pages.length) {
      return {
        connected: false,
        reason: "facebook-page-not-found",
        detail: "Meta returned no accessible Facebook Pages for this login."
      };
    }

    // Prioritize Nunes Instrumentation Page (by ID 1398853319976762 or name)
    const sortedPages = [...pages].sort((a, b) => {
      const aMatch = String(a.id) === configuredPageId || /nunes/i.test(a.name || "");
      const bMatch = String(b.id) === configuredPageId || /nunes/i.test(b.name || "");
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });

    let selectedPage = null;
    let validatedIg = null;
    let candidateSource = "";

    for (const page of sortedPages) {
      const pageToken = page.access_token || userToken;

      // Candidate 1: instagram_business_account from /me/accounts
      let igId = String(page?.instagram_business_account?.id || "").trim();

      // Candidate 2: Query page directly with Page Token for fresh instagram_business_account
      if (!igId && page?.id && pageToken) {
        const directPage = await graphJson(
          encodeURIComponent(String(page.id)),
          pageToken,
          "id,name,access_token,instagram_business_account,connected_instagram_account"
        );
        if (directPage.res.ok && directPage.json?.instagram_business_account?.id) {
          igId = String(directPage.json.instagram_business_account.id).trim();
        } else if (directPage.json?.connected_instagram_account?.id) {
          igId = String(directPage.json.connected_instagram_account.id).trim();
        }
      }

      // Candidate 3: Stored configuration accountId if available
      const configuredIgId = String(igConfig?.accountId || "").trim();
      const candidates = [igId, configuredIgId, "17841422933669789"].filter(Boolean);

      for (const candidateId of candidates) {
        const verified = await validateCandidateId(candidateId, pageToken, userToken);
        if (verified && verified.id && verified.username) {
          selectedPage = page;
          validatedIg = verified;
          candidateSource = candidateId === igId ? "instagram_business_account" : "stored-account-id";
          break;
        }
      }

      if (validatedIg) break;
    }

    if (!validatedIg || !selectedPage) {
      return {
        connected: false,
        reason: "instagram-not-linked-to-page",
        detail: "No accessible Facebook Page returned a verified Instagram Professional account with Graph API validation."
      };
    }

    const now = Date.now();
    const effectivePageToken = selectedPage.access_token || userToken;

    const tokenPayload = {
      ...token,
      platform: "Instagram",
      access_token: effectivePageToken,
      instagram_user_id: String(validatedIg.id),
      username: validatedIg.username || "",
      account_type: validatedIg.account_type || "BUSINESS",
      linkedFrom: candidateSource,
      facebook_page_id: String(selectedPage.id),
      facebook_page_name: selectedPage.name || "Nunes Instrumentation",
      verified: true,
      validatedAt: now,
      updatedAt: now
    };

    const configPayload = {
      ...igConfig,
      platform: "instagram",
      accountId: String(validatedIg.id),
      secondaryId: String(selectedPage.id),
      name: validatedIg.username || "",
      accountType: validatedIg.account_type || "BUSINESS",
      profilePictureUrl: validatedIg.profile_picture_url || "",
      facebookPageName: selectedPage.name || "Nunes Instrumentation",
      verified: true,
      connectionStatus: "connected",
      validatedAt: now,
      updatedAt: now,
      savedAt: now
    };

    await Promise.all([
      setSharedState("token:instagram", tokenPayload),
      setSharedState("config:instagram", configPayload)
    ]);

    return {
      connected: true,
      userId: String(validatedIg.id),
      name: validatedIg.username || "",
      accountType: validatedIg.account_type || "BUSINESS",
      pageId: String(selectedPage.id),
      pageName: selectedPage.name || "",
      tokenSource: "facebook-page-token",
      verified: true
    };
  } catch (e) {
    const detail = String(e?.message || e);
    console.error("[INSTAGRAM CONNECT] exception during verification", detail);
    return { connected: false, reason: "instagram-validation-exception", detail };
  }
}

export async function repairInstagramFromStoredMeta() {
  const [igConfig, fbToken] = await Promise.all([
    getSharedState("config:instagram"),
    getSharedState("token:facebook")
  ]);
  return ensureInstagramConnection(igConfig || {}, fbToken || null);
}
