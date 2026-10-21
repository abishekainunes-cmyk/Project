"use client";

import { useEffect, useState } from "react";

export default function MetaConnectPage() {
  const [state, setState] = useState(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [configId, setConfigId] = useState("");
  const [facebookPageId, setFacebookPageId] = useState("1398853319976762");
  const [instagramUserId, setInstagramUserId] = useState("17841422933669789");
  const [wabaId, setWabaId] = useState("3603262783168599");
  const [phoneNumberId, setPhoneNumberId] = useState("1398853319976762");
  const [msg, setMsg] = useState("");
  const [oauthCompleted, setOauthCompleted] = useState(false);
  const [oauthError, setOauthError] = useState("");
  const [oauthDetail, setOauthDetail] = useState("");
  const [viewMode, setViewMode] = useState("admin");
  const [fbHealth, setFbHealth] = useState(null);

  async function refresh() {
    const [r, sr] = await Promise.all([
      fetch("/api/meta/setup", { cache: "no-store" }),
      fetch("/api/integrations/status", { cache: "no-store" })
    ]);
    const j = await r.json().catch(() => ({}));
    const sj = await sr.json().catch(() => ({}));
    setState(j);
    setFbHealth(sj.integrations?.Facebook || null);
    if (j.facebook?.pageId) setFacebookPageId(j.facebook.pageId);
    if (j.instagram?.userId) setInstagramUserId(j.instagram.userId);
    if (j.whatsapp?.wabaId) setWabaId(j.whatsapp.wabaId);
    if (j.whatsapp?.phoneNumberId) setPhoneNumberId(j.whatsapp.phoneNumberId);
  }

  useEffect(() => {
    refresh();
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      setOauthCompleted(q.get("connected") === "1");
      setOauthError(q.get("error") || "");
      setOauthDetail(q.get("detail") || "");
    }
  }, []);

  async function saveAndConnect(e) {
    e.preventDefault();
    setMsg("Saving Meta setup...");
    const r = await fetch("/api/meta/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId, clientSecret, configId, facebookPageId, instagramUserId, wabaId, phoneNumberId
      })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) {
      setMsg(j.error || "Unable to save Meta setup");
      return;
    }
    setClientSecret("");
    setMsg("Saved. Opening Meta authorization...");
    window.location.href = j.connectUrl || "/api/oauth/facebook/start";
  }

  const isConnected = Boolean(fbHealth?.connected || state?.facebook?.connected);

  return (
    <main className="standalonePage">
      <section className="standaloneCard" style={{ maxWidth: "600px" }}>
        <div className="brandMark" style={{ margin: "0 auto 16px" }}>M</div>
        <span className="eyebrow">META BUSINESS SUITE</span>
        <h1>{isConnected ? "Meta Business is Connected" : "Connect Meta Business"}</h1>
        <p>
          Manages Nunes Instrumentation Facebook Page, Instagram Professional account (@nunesinstrumentation), and WhatsApp Business lines.
        </p>

        {oauthCompleted && <div className="statusBanner success"><strong>SUCCESS:</strong> Meta authorization completed successfully.</div>}
        {oauthError && <div className="statusBanner error"><strong>AUTHORIZATION ERROR:</strong> {oauthError} {oauthDetail && <span>· {oauthDetail}</span>}</div>}
        {msg && <div className="statusBanner info"><span>{msg}</span></div>}

        <div className={isConnected ? "statusBanner success" : "statusBanner warn"}>
          <strong>{isConnected ? "CONNECTED" : "SETUP REQUIRED"}</strong>
          <span>{isConnected ? "Facebook Page & Graph API verified" : "Enter Meta App credentials or authorize"}</span>
        </div>

        <div className="modeToggle" style={{ margin: "16px auto" }}>
          <button className={viewMode === "admin" ? "active" : ""} onClick={() => setViewMode("admin")}>Admin View</button>
          <button className={viewMode === "tech" ? "active" : ""} onClick={() => setViewMode("tech")}>Tech View</button>
        </div>

        {viewMode === "admin" ? (
          <div>
            <div className="accountMeta">
              <span>Facebook Page</span>
              <strong>{state?.facebook?.name || "Nunes Instrumentation"}</strong>
              <span>Instagram Account</span>
              <strong>{state?.instagram?.connected ? `@${state.instagram.name}` : "@nunesinstrumentation"}</strong>
              <span>WhatsApp Lines</span>
              <strong>{state?.whatsapp?.connected ? "Connected" : "Configured"}</strong>
            </div>

            <div className="standaloneActions" style={{ marginTop: "24px" }}>
              <a className="primaryButton" href="/api/oauth/facebook/start">
                {isConnected ? "Re-authorize Meta Account" : "Connect with Meta"}
              </a>
              <button className="secondaryButton" onClick={refresh}>Refresh Status</button>
              <a className="textButton" href="/?tab=Social+Accounts">← Back to Command Center</a>
            </div>
          </div>
        ) : (
          <form onSubmit={saveAndConnect} style={{ textAlign: "left", marginTop: "16px" }}>
            <label style={{ display: "block", marginBottom: "12px", fontSize: "13px", fontWeight: "600" }}>
              Meta App ID
              <input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="e.g. 2364127371021221" style={{ width: "100%", padding: "8px 12px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            </label>
            <label style={{ display: "block", marginBottom: "12px", fontSize: "13px", fontWeight: "600" }}>
              Meta App Secret
              <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Stored encrypted" style={{ width: "100%", padding: "8px 12px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            </label>
            <label style={{ display: "block", marginBottom: "12px", fontSize: "13px", fontWeight: "600" }}>
              Meta Login Config ID (Optional)
              <input value={configId} onChange={e => setConfigId(e.target.value)} placeholder="e.g. 1079988644811429" style={{ width: "100%", padding: "8px 12px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            </label>
            <label style={{ display: "block", marginBottom: "12px", fontSize: "13px", fontWeight: "600" }}>
              Facebook Page ID
              <input value={facebookPageId} onChange={e => setFacebookPageId(e.target.value)} style={{ width: "100%", padding: "8px 12px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            </label>
            <label style={{ display: "block", marginBottom: "12px", fontSize: "13px", fontWeight: "600" }}>
              Instagram Professional Account ID
              <input value={instagramUserId} onChange={e => setInstagramUserId(e.target.value)} style={{ width: "100%", padding: "8px 12px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            </label>
            <div className="standaloneActions" style={{ marginTop: "20px" }}>
              <button type="submit" className="primaryButton">Save & Connect</button>
              <a className="secondaryButton" href="/api/oauth/facebook/start">Direct Authorize</a>
              <a className="textButton" href="/?tab=Social+Accounts">← Back</a>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
