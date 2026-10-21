"use client";

import { useEffect, useState } from "react";

export default function InstagramConnectPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);
  const [mode, setMode] = useState("admin");
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/integrations/status", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      setStatus(j?.integrations?.Instagram || null);
    } catch (e) {
      setError("Unable to connect to live status API: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function triggerRecheck() {
    setRechecking(true);
    await refresh();
    setRechecking(false);
  }

  useEffect(() => { refresh(); }, []);
  const connected = Boolean(status?.connected && status?.publishingReady);

  return (
    <main className="standalonePage">
      <section className="standaloneCard">
        <div className="igLogo">◎</div>
        <span className="eyebrow">INSTAGRAM PROFESSIONAL</span>
        <h1>{connected ? "Instagram is Connected" : "Connect Instagram Professional"}</h1>
        <p>
          Nunes Instrumentation uses the official Meta Business Graph API to discover, verify, and publish to the assigned Instagram Professional account (<strong>@nunesinstrumentation</strong>).
        </p>

        {error && <div className="alert error"><strong>Error:</strong> {error}</div>}

        <div className={connected ? "statusBanner success" : "statusBanner warn"}>
          <strong>{connected ? "CONNECTED & PUBLISHING READY" : loading ? "CHECKING STATUS…" : "AUTHORIZATION REQUIRED"}</strong>
          <span>
            {connected
              ? (status?.name ? `@${status.name} · Verified Professional Account` : "@nunesinstrumentation · Verified")
              : (status?.actionRequired || "Log in with Meta and grant Instagram publishing permissions.")}
          </span>
        </div>

        <div className="accountMeta">
          <span>Target Account</span>
          <strong>@nunesinstrumentation</strong>
          <span>Account ID</span>
          <strong>{status?.accountId || "17841422933669789"}</strong>
          <span>Facebook Page</span>
          <strong>{status?.facebookPageName || "Nunes Instrumentation"}</strong>
          <span>Publishing Health</span>
          <strong>{connected ? "Active & Verified" : "Action Required"}</strong>
        </div>

        <div className="modeToggle" style={{ margin: "16px auto" }}>
          <button className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>Admin View</button>
          <button className={mode === "tech" ? "active" : ""} onClick={() => setMode("tech")}>Tech View</button>
        </div>

        {mode === "tech" && (
          <div style={{ textAlign: "left", margin: "12px 0", padding: "12px", background: "#f1f5f9", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace" }}>
            <div><strong>Mode:</strong> {status?.mode || "ready-to-login"}</div>
            <div><strong>Verified:</strong> {String(status?.verified)}</div>
            <div><strong>FB Page ID:</strong> {status?.facebookPageId || "1398853319976762"}</div>
            <div><strong>Action:</strong> {status?.actionRequired || "none"}</div>
            <details style={{ marginTop: "8px" }}>
              <summary>Raw Provider State</summary>
              <pre>{JSON.stringify(status, null, 2)}</pre>
            </details>
          </div>
        )}

        <div className="standaloneActions">
          <a className="primaryButton" href="/api/oauth/facebook/start">
            {connected ? "Re-authorize Meta / Instagram" : "Authorize with Meta"}
          </a>
          <button className="secondaryButton" onClick={triggerRecheck} disabled={rechecking || loading}>
            {rechecking ? "Checking..." : "Recheck Connection"}
          </button>
          <a className="textButton" href="/?tab=Social+Accounts">← Back to Command Center</a>
        </div>
      </section>
    </main>
  );
}
