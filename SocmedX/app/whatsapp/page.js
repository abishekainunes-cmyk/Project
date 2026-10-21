"use client";

import { useEffect, useMemo, useState } from "react";

function maskPhone(v) {
  const s = String(v || "").trim();
  if (!s) return "Phone number hidden";
  const digits = s.replace(/\D/g, "");
  if (digits.length < 5) return s;
  return s.replace(digits, digits.slice(0, 2) + " ••••• " + digits.slice(-5));
}

export default function WhatsAppHub() {
  const [numbers, setNumbers] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setNotice("");
    try {
      const [nr, hr] = await Promise.all([
        fetch("/api/whatsapp/numbers", { cache: "no-store" }),
        fetch("/api/whatsapp/status", { cache: "no-store" })
      ]);
      const [nj, hj] = await Promise.all([nr.json(), hr.json()]);
      if (!nr.ok || !nj.ok) throw new Error(nj.error || "Unable to load WhatsApp numbers.");
      if (!hr.ok || !hj.ok) throw new Error(hj.error || "Unable to load WhatsApp history.");
      setNumbers(nj.numbers || []);
      setHistory(hj.history || []);
      setSelected(prev => prev.filter(id => (nj.numbers || []).some(n => n.id === id)));
    } catch (e) {
      setNotice(e.message || "Unable to load WhatsApp Hub.");
    }
  }

  useEffect(() => {
    refresh();
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("add") === "1") {
      setShowAdd(true);
    }
  }, []);

  const connectedCount = useMemo(() => numbers.filter(n => n.connected && n.enabled !== false).length, [numbers]);

  async function addNumber(e) {
    e.preventDefault();
    setBusy(true);
    setNotice("Validating and saving WhatsApp number...");
    try {
      const r = await fetch("/api/whatsapp/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add", label, displayPhone, phoneNumberId, wabaId, accessToken
        })
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Unable to save WhatsApp number.");
      setLabel("");
      setDisplayPhone("");
      setPhoneNumberId("");
      setWabaId("");
      setAccessToken("");
      setShowAdd(false);
      setNotice("WhatsApp number saved in shared encrypted storage.");
      await refresh();
    } catch (e) {
      setNotice(e.message || "Unable to save WhatsApp number.");
    } finally {
      setBusy(false);
    }
  }

  async function removeNumber(id) {
    if (!confirm("Remove this WhatsApp number from NUNES Social Command Center?")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/whatsapp/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", id })
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Unable to remove number.");
      await refresh();
    } catch (e) {
      setNotice(e.message || "Unable to remove number.");
    } finally {
      setBusy(false);
    }
  }

  async function saveStatus(action) {
    setBusy(true);
    setNotice("");
    try {
      const r = await fetch("/api/whatsapp/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action, text, mediaUrl, numberIds: selected, scheduledFor
        })
      });
      const j = await r.json();
      if (!r.ok) {
        setNotice(j.error || "WhatsApp status action could not be completed.");
        if (j.entry) setHistory(prev => [j.entry, ...prev]);
        return;
      }
      setHistory(prev => [j.entry, ...prev]);
      setNotice(
        action === "schedule"
          ? "Schedule saved as a manual-publish reminder. Note: WhatsApp Business Platform API does not provide direct Status publishing."
          : "Status draft saved."
      );
    } catch (e) {
      setNotice(e.message || "WhatsApp status action failed.");
    } finally {
      setBusy(false);
    }
  }

  function toggleAll() {
    const ids = numbers.filter(n => n.connected && n.enabled !== false).map(n => n.id);
    setSelected(selected.length === ids.length ? [] : ids);
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brandRow">
          <div className="brandMark">N</div>
          <div><strong>NUNES</strong><span>Command Center</span></div>
        </div>
        <div className="sideLabel">NAVIGATION</div>
        <nav>
          <a className="sideNavBtn" href="/?tab=Dashboard"><span>⌂</span>Dashboard</a>
          <a className="sideNavBtn" href="/?tab=Social+Accounts"><span>◎</span>Social Accounts</a>
          <a className="sideNavBtn active" href="/whatsapp"><span>WA</span>WhatsApp Hub</a>
        </nav>
        <div className="sidebarFoot">
          <a className="textLink" href="/">← Back to Command Center</a>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <span className="crumb">NUNES / WHATSAPP BUSINESS</span>
            <h1>WhatsApp Hub</h1>
          </div>
          <div className="topActions">
            <button className="primary" onClick={() => setShowAdd(true)}>＋ Add WhatsApp Number</button>
            <a className="ghost" href="/">Exit Hub</a>
          </div>
        </header>

        <main className="content">
          <div className="sectionIntro">
            <div>
              <span className="eyebrow">MULTI-NUMBER WORKFLOWS</span>
              <h2>Manage Business WhatsApp Numbers</h2>
              <p>Supports Nunes Main, Sales, Service, and technical inquiry lines with independent routing.</p>
            </div>
            <span className="statusPill ok">{connectedCount} Connected</span>
          </div>

          {notice && <div className="alert"><strong>Status:</strong> {notice}<button onClick={() => setNotice("")}>×</button></div>}

          <section className="waNumberGrid">
            {numbers.length ? (
              numbers.map((n, index) => (
                <article className="channelCard" key={n.id}>
                  <div className="channelIcon c-whatsapp">WA</div>
                  <div className="channelMain">
                    <div className="channelTitle">
                      <strong>{n.label || `NUNES WHATSAPP ${index + 1}`}</strong>
                      <span className={`statusPill ${n.connected ? "ok" : "warn"}`}>
                        {n.connected ? "Connected" : "Action required"}
                      </span>
                    </div>
                    <p>{maskPhone(n.displayPhone)}</p>
                    <small>ID: {n.phoneNumberId || "—"}</small>
                  </div>
                  <div className="cardBtnGroup">
                    <button
                      className={selected.includes(n.id) ? "primary" : "secondary"}
                      onClick={() => setSelected(s => s.includes(n.id) ? s.filter(x => x !== n.id) : [...s, n.id])}
                    >
                      {selected.includes(n.id) ? "Selected ✓" : "Select"}
                    </button>
                    <button className="ghost danger" onClick={() => removeNumber(n.id)} disabled={busy}>Remove</button>
                  </div>
                </article>
              ))
            ) : (
              <div className="emptyState">
                <strong>No WhatsApp Numbers Connected</strong>
                <span>Add your Meta WhatsApp Business number using Phone Number ID and System User token.</span>
              </div>
            )}
          </section>

          {showAdd && (
            <section className="panel">
              <div className="panelHead">
                <div>
                  <span className="eyebrow">AUTHENTICATION</span>
                  <h3>Add WhatsApp Business Number</h3>
                  <p>Credentials are validated directly against Meta Graph API and stored in shared encrypted storage.</p>
                </div>
                <button className="ghost" onClick={() => setShowAdd(false)}>Close</button>
              </div>
              <form onSubmit={addNumber} className="composeForm">
                <label>
                  Business Line / Department
                  <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. NUNES SALES or NUNES SERVICE" required />
                </label>
                <label>
                  Display Phone Number
                  <input value={displayPhone} onChange={e => setDisplayPhone(e.target.value)} placeholder="+91 98300 00000" />
                </label>
                <div className="twoCols">
                  <label>
                    WhatsApp Phone Number ID
                    <input value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} placeholder="e.g. 1398853319976762" required />
                  </label>
                  <label>
                    WhatsApp Business Account ID (WABA)
                    <input value={wabaId} onChange={e => setWabaId(e.target.value)} placeholder="e.g. 3603262783168599" />
                  </label>
                </div>
                <label>
                  System User / Permanent Token (Optional if Meta connection active)
                  <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="Stored encrypted; never displayed" />
                </label>
                <button className="primary" disabled={busy}>{busy ? "Validating..." : "Validate & Save Number"}</button>
              </form>
            </section>
          )}

          <section className="composerGrid">
            <article className="panel composeForm">
              <div className="panelHead">
                <div>
                  <span className="eyebrow">STATUS WORKFLOW</span>
                  <h3>Create Status Update / Broadcast Draft</h3>
                </div>
                <button className="textLink" onClick={toggleAll}>Select All</button>
              </div>

              <div className="platformSelect">
                {numbers.map(n => (
                  <button
                    key={n.id}
                    className={selected.includes(n.id) ? "selected" : ""}
                    disabled={!n.connected}
                    onClick={() => setSelected(s => s.includes(n.id) ? s.filter(x => x !== n.id) : [...s, n.id])}
                  >
                    <span>WA</span>
                    <strong>{n.label}</strong>
                    <small>{n.connected ? "Ready" : "Offline"}</small>
                  </button>
                ))}
              </div>

              <label>
                Status Text / Caption
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write status text..." />
              </label>

              <label>
                Public Image / Video URL
                <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://..." />
              </label>

              <label>
                Schedule Reminder Date & Time
                <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
              </label>

              <div className="heroButtons">
                <button className="secondary" onClick={() => saveStatus("save")} disabled={busy}>Save Draft</button>
                <button className="secondary" onClick={() => saveStatus("schedule")} disabled={busy || !scheduledFor}>Schedule Reminder</button>
                <button className="primary" onClick={() => saveStatus("publish")} disabled={busy}>Publish Workflow</button>
              </div>

              <div className="alert note">
                <strong>API Architecture Note:</strong>
                <span>Meta's official WhatsApp Business Cloud API supports transactional & marketing messaging, but does not provide a direct Status (Story) publishing endpoint. NUNES uses an automated Status Draft & Reminder queue to ensure zero fake posting.</span>
              </div>
            </article>

            <article className="panel">
              <div className="panelHead">
                <div>
                  <span className="eyebrow">PREVIEW</span>
                  <h3>Status Preview ({selected.length} lines selected)</h3>
                </div>
              </div>
              <div className="phonePreview">
                <div className="phoneHeader">NUNES WhatsApp Status</div>
                {mediaUrl ? (
                  <img src={mediaUrl} alt="Preview" className="previewImg" />
                ) : (
                  <div className="previewPlaceholder">No media selected</div>
                )}
                <div className="phoneText">{text || "Your approved status update text will render here."}</div>
              </div>
            </article>
          </section>

          <section className="panel">
            <div className="panelHead">
              <div>
                <span className="eyebrow">ACTIVITY</span>
                <h3>WhatsApp Draft & Reminder History</h3>
              </div>
              <b>{history.length}</b>
            </div>
            <div className="historyTable">
              <div className="historyHeader">
                <span>Status</span>
                <span>Content</span>
                <span>Numbers</span>
                <span>Created</span>
              </div>
              {history.map(h => (
                <div className="historyRow" key={h.id}>
                  <strong>{h.status || "DRAFT"}</strong>
                  <span>{h.text || "Media status update"}</span>
                  <small>{h.numberIds?.length || 0} number(s)</small>
                  <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {!history.length && <div className="emptyState"><strong>No status history</strong><span>Saved drafts and reminder workflows will appear here.</span></div>}
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}
