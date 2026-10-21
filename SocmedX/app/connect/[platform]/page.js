"use client";

import { use, useEffect, useState } from "react";

export default function PlatformConnectPage({ params }) {
  const { platform } = use(params);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/integrations/status", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      setStatus(j?.integrations?.[platform] || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [platform]);
  const connected = Boolean(status?.connected);

  return (
    <main className="standalonePage">
      <section className="standaloneCard">
        <span className="eyebrow">CHANNEL INTEGRATION</span>
        <h1>{connected ? `${platform} is Connected` : `Connect ${platform}`}</h1>
        <p>
          Authorize Nunes Instrumentation social publishing via official OAuth 2.0.
        </p>
        <div className={connected ? "statusBanner success" : "statusBanner warn"}>
          <strong>{connected ? "CONNECTED" : loading ? "CHECKING…" : "LOGIN REQUIRED"}</strong>
          <span>{connected ? "Publishing ready and verified" : `Connect your ${platform} account securely.`}</span>
        </div>
        <div className="standaloneActions">
          <a className="primaryButton" href={`/api/oauth/${platform.toLowerCase()}/start`}>
            {connected ? `Re-authorize ${platform}` : `Authorize ${platform}`}
          </a>
          <button className="secondaryButton" onClick={refresh}>Refresh Status</button>
          <a className="textButton" href="/?tab=Social+Accounts">← Back to Command Center</a>
        </div>
      </section>
    </main>
  );
}
