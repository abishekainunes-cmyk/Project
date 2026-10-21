"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ENABLED_SOCIAL_PROVIDERS, SOCIAL_PROVIDER_META } from "./lib/social-providers";
import { NUNES_PRODUCT_CATEGORIES, NUNES_CURATED_MEDIA } from "./lib/instrument-catalog";
import { generateIndustrialCopy } from "./lib/copywriter-engine";
import SocialPreviewMockup from "./components/SocialPreviewMockup";
import LivePostCard from "./components/LivePostCard";

const CHANNELS = [
  { id: "linkedin", name: "LinkedIn", icon: "in", purpose: "B2B authority, technical credibility & decision-makers", connect: "/connect/LinkedIn" },
  { id: "facebook", name: "Facebook", icon: "f", purpose: "Customer trust, company updates & Page content", connect: "/connect/Meta" },
  { id: "instagram", name: "Instagram", icon: "◎", purpose: "Visual discovery, reels & product applications", connect: "/connect/Instagram" },
  { id: "youtube", name: "YouTube", icon: "▶", purpose: "Product demos, tutorials & technical education", connect: "/connect/YouTube" },
  { id: "whatsapp", name: "WhatsApp", icon: "WA", purpose: "Business messaging & multi-number workflows", connect: "/whatsapp" }
];

const PUBLISH_CHANNELS = CHANNELS.filter(x => x.name !== "WhatsApp");
const ANGLES = [
  "Auto",
  "Product Spotlight",
  "Calibration & NABL Compliance",
  "Problem / Solution",
  "Cost & Downtime Prevention",
  "How-To Guide",
  "Educational",
  "Quick Tip",
  "Company Update"
];

function api(path, options = {}) {
  const cleanPath = path.replace(/^\//, "");
  return fetch(`/api/${cleanPath}`, { cache: "no-store", ...options });
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function StatusPill({ state }) {
  const norm = String(state || "").toUpperCase();
  let cls = "status-muted";
  if (norm.includes("CONNECTED") || norm.includes("READY") || norm.includes("POSTED") || norm.includes("APPROVED")) {
    cls = "status-ok";
  } else if (norm.includes("SCHEDULED") || norm.includes("PROCESSING")) {
    cls = "status-info";
  } else if (norm.includes("ACTION") || norm.includes("WAITING") || norm.includes("CONFIGURED") || norm.includes("WARN")) {
    cls = "status-warn";
  } else if (norm.includes("FAIL") || norm.includes("ERROR")) {
    cls = "status-danger";
  }
  return <span className={`statusPill ${cls}`}>{state}</span>;
}

export default function Home() {
  const [tab, setTab] = useState("Dashboard");
  const [mode, setMode] = useState("admin");
  const [connections, setConnections] = useState({});
  const [history, setHistory] = useState([]);
  const [livePosts, setLivePosts] = useState([]);
  const [liveFilter, setLiveFilter] = useState("All");
  const [automation, setAutomation] = useState({ instagramConnected: false, accountName: "", schedules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Create Post Workflow State
  const [topic, setTopic] = useState("");
  const [product, setProduct] = useState("");
  const [specs, setSpecs] = useState("");
  const [applications, setApplications] = useState("");
  const [brief, setBrief] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [angle, setAngle] = useState("Auto");
  const [cta, setCta] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["LinkedIn", "Facebook", "Instagram", "YouTube"]);
  const [activePlatformPreview, setActivePlatformPreview] = useState("LinkedIn");
  const [drafts, setDrafts] = useState({});
  const [scheduleDate, setScheduleDate] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState([]);

  // Worker State
  const [workerRunning, setWorkerRunning] = useState(false);
  const [workerStatus, setWorkerStatus] = useState("");

  // Calendar State
  const [calendarView, setCalendarView] = useState("month");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedPostModal, setSelectedPostModal] = useState(null);
  const [calendarFilter, setCalendarFilter] = useState("All");

  // Tech Mode Diagnostics State
  const [pingingMeta, setPingingMeta] = useState(false);
  const [metaDiagnostics, setMetaDiagnostics] = useState(null);

  // Quick action / Drag & drop
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const runIdRef = useRef(null);

  async function refreshAll() {
    setLoading(true);
    setError("");
    try {
      const [sr, hr, ar, lr] = await Promise.all([
        api("integrations/status"),
        api("publishing-history"),
        api("automation/schedule"),
        api("live-posts")
      ]);
      const [sj, hj, aj, lj] = await Promise.all([
        sr.json().catch(() => ({})),
        hr.json().catch(() => ({})),
        ar.json().catch(() => ({})),
        lr.json().catch(() => ({}))
      ]);

      if (!sr.ok && !sj.ok) throw new Error(sj.error || "Connection status unavailable");
      setConnections(sj.integrations || {});
      if (hj?.posts) setHistory(Array.isArray(hj.posts) ? hj.posts : []);
      if (lj?.posts) setLivePosts(Array.isArray(lj.posts) ? lj.posts : []);
      if (aj?.schedules) {
        setAutomation({
          instagramConnected: Boolean(aj.instagramConnected || sj.integrations?.Instagram?.connected),
          accountName: aj.accountName || sj.integrations?.Instagram?.name || "nunesinstrumentation",
          schedules: Array.isArray(aj.schedules) ? aj.schedules : []
        });
      }
    } catch (e) {
      setError(e?.message || "Unable to reach live Command Center API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const requestedTab = q.get("tab");
      if (requestedTab && ["Dashboard", "Live Feed", "Create Post", "Calendar", "Auto Posting", "Social Accounts", "Results"].includes(requestedTab)) {
        setTab(requestedTab);
      }
    }
  }, []);

  // Filter channels to only enabled ones
  const activeChannels = useMemo(() => {
    return CHANNELS.filter(ch => ENABLED_SOCIAL_PROVIDERS.includes(ch.id));
  }, []);

  // Compute KPI counts from real live data
  const connectedCount = activeChannels.filter(x => connections[x.name]?.connected).length;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const postsToday = history.filter(x => {
    const t = Date.parse(x.publishedAt || 0);
    return t >= startOfToday && x.external?.status === "POSTED";
  }).length;

  const scheduledCount = automation.schedules.filter(x => x.status === "SCHEDULED" && x.enabled !== false).length;
  const pendingApprovalCount = automation.schedules.filter(x => x.status === "WAITING APPROVAL" || x.status === "DRAFT").length;

  const failedCount = history.filter(x => {
    const t = Date.parse(x.publishedAt || 0);
    return (t >= now.getTime() - 7 * 86400000) && (x.external?.status === "FAILED" || x.external?.status === "PERMISSION_REQUIRED");
  }).length;

  const lastPost = history[0] || null;

  const instagram = connections.Instagram || {};
  const facebook = connections.Facebook || {};
  const linkedin = connections.LinkedIn || {};
  const whatsapp = connections.WhatsApp || {};
  const youtube = connections.YouTube || {};

  // Action Center Items
  const actionItems = useMemo(() => {
    const items = [];
    if (!instagram.connected) {
      items.push({
        id: "ig",
        level: "high",
        platform: "Instagram",
        title: "Connect Instagram (@nunesinstrumentation)",
        text: instagram.actionRequired || "Verify Instagram Professional account linked to Nunes Instrumentation Facebook Page.",
        action: () => { window.location.href = "/connect/Instagram"; }
      });
    }
    if (!youtube.connected) {
      items.push({
        id: "yt",
        level: "normal",
        platform: "YouTube",
        title: "Connect YouTube Channel",
        text: youtube.configured ? "Authorize Google OAuth to enable automated video demo publishing." : "Google Developer credentials pending setup.",
        action: () => { window.open("/connect/YouTube", "_blank"); }
      });
    }
    if (failedCount > 0) {
      items.push({
        id: "fail",
        level: "high",
        platform: "Publishing",
        title: `${failedCount} Failed Post Attempt${failedCount === 1 ? "" : "s"}`,
        text: "Review provider response codes and resolve authorization errors in Results.",
        action: () => setTab("Results")
      });
    }
    if (pendingApprovalCount > 0) {
      items.push({
        id: "appr",
        level: "normal",
        platform: "Approval",
        title: `${pendingApprovalCount} Post${pendingApprovalCount === 1 ? "" : "s"} Pending Approval`,
        text: "Review drafts in Content Calendar or Auto Posting queue before publishing.",
        action: () => setTab("Auto Posting")
      });
    }
    return items;
  }, [instagram.connected, instagram.actionRequired, youtube.connected, youtube.configured, failedCount, pendingApprovalCount]);

  // Handle Drag & Drop and Ctrl+V Paste for Media
  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) handleUploadFile(file);
        break;
      }
    }
  }

  async function handleUploadFile(file) {
    if (!file) return;
    setMediaFile(file);
    setUploading(true);
    setNotice("Uploading media...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api("upload", { method: "POST", body: formData });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) {
        setMediaUrl(json.url);
        setNotice(`Media uploaded to secure CDN stream: ${file.name}`);
      } else {
        const objUrl = URL.createObjectURL(file);
        setMediaUrl(objUrl);
        setNotice(`Local media preview ready: ${file.name}`);
      }
    } catch {
      const objUrl = URL.createObjectURL(file);
      setMediaUrl(objUrl);
      setNotice(`Media preview ready: ${file.name}`);
    } finally {
      setUploading(false);
    }
  }

  function applyCatalogPreset(prod) {
    const cleanTopic = prod.name.split("(")[0].trim();
    setProduct(prod.name);
    setTopic(cleanTopic);
    setSpecs(prod.specs);
    setApplications(prod.applications);
    setBrief(`${prod.usp}.\n\nKey Parameters: ${prod.specs}.\n\nApplications: ${prod.applications}.`);
    setTargetAudience("Plant Maintenance Engineers, Quality Assurance Managers & Calibration Specialists");
    setCta("Request official quotation, technical datasheet, and rapid dispatch details from Nunes Instrumentation.");

    const nextDrafts = {};
    selectedPlatforms.forEach(name => {
      nextDrafts[name] = generateIndustrialCopy({
        platform: name,
        topic: cleanTopic,
        product: prod.name,
        specs: prod.specs,
        applications: prod.applications,
        targetAudience: "Plant Maintenance Engineers, Quality Assurance Managers & Calibration Specialists",
        angle,
        cta: "Request official quotation, technical datasheet, and rapid dispatch details from Nunes Instrumentation."
      });
    });
    setDrafts(nextDrafts);
    if (!nextDrafts[activePlatformPreview] && selectedPlatforms.length) {
      setActivePlatformPreview(selectedPlatforms[0]);
    }
    setNotice(`Applied Catalog Preset: ${cleanTopic}. Channel drafts generated!`);
  }

  function selectCuratedMedia(mediaItem) {
    setMediaUrl(mediaItem.url);
    setNotice(`Selected Verified Asset: ${mediaItem.name}`);
  }

  function generateAllDrafts() {
    if (!topic.trim() && !product.trim()) {
      setNotice("Please add a Post Topic or select a Product from Catalog Presets.");
      return;
    }
    const nextDrafts = {};
    selectedPlatforms.forEach(name => {
      nextDrafts[name] = generateIndustrialCopy({
        platform: name,
        topic: topic.trim(),
        product: product.trim(),
        specs: specs.trim(),
        applications: applications.trim(),
        targetAudience: targetAudience.trim(),
        angle,
        cta: cta.trim()
      });
    });
    setDrafts(nextDrafts);
    if (!nextDrafts[activePlatformPreview] && selectedPlatforms.length) {
      setActivePlatformPreview(selectedPlatforms[0]);
    }
    setNotice("Channel-tailored marketing drafts generated. Review live preview below.");
  }

  async function publishNow() {
    if (publishing) return;
    const targets = selectedPlatforms.filter(name => drafts[name]);
    if (!targets.length) {
      setNotice("Generate drafts and select at least one platform before publishing.");
      return;
    }
    setPublishing(true);
    setNotice("Publishing to selected channels...");
    const run = runIdRef.current || crypto.randomUUID();
    runIdRef.current = run;
    const runResults = [];

    for (const platform of targets) {
      try {
        const r = await api("publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic || product || "Post",
            channel: platform,
            text: drafts[platform],
            mediaUrl,
            angle,
            idempotencyKey: `${run}:${platform.toLowerCase()}`
          })
        });
        const j = await r.json().catch(() => ({}));
        runResults.push({
          platform,
          status: j.external?.status || (j.ok ? "POSTED" : "FAILED"),
          error: j.external?.error || j.error || "",
          url: j.post?.url || j.external?.permalink || "",
          id: j.external?.externalId || j.post?.id || ""
        });
      } catch (e) {
        runResults.push({ platform, status: "FAILED", error: e?.message || "Network error" });
      }
    }

    setResults(runResults);
    setPublishing(false);
    setTab("Results");
    await refreshAll();
  }

  async function saveAsSchedule(initialStatus = "SCHEDULED") {
    if (!scheduleDate && initialStatus === "SCHEDULED") {
      setNotice("Please select a scheduled Date and Time.");
      return;
    }
    setPublishing(true);
    setNotice("Saving to production schedule...");

    try {
      for (const platform of selectedPlatforms) {
        const text = drafts[platform] || generateIndustrialCopy({
          platform,
          topic,
          product,
          specs,
          applications,
          targetAudience,
          angle,
          cta
        });
        await api("automation/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            topic: topic || product || "Post",
            caption: text,
            platform,
            mediaUrl,
            scheduledAt: scheduleDate || new Date().toISOString(),
            status: initialStatus
          })
        });
      }
      setNotice(initialStatus === "DRAFT" ? "Draft saved successfully." : "Post scheduled in production queue.");
      setTab("Calendar");
      await refreshAll();
    } catch (e) {
      setNotice("Scheduling failed: " + (e?.message || e));
    } finally {
      setPublishing(false);
    }
  }

  async function updateScheduleItem(action, id, enabled = true) {
    try {
      await api("automation/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, enabled })
      });
      await refreshAll();
    } catch (e) {
      setNotice("Update failed: " + (e?.message || e));
    }
  }

  async function publishScheduleItemNow(item) {
    setNotice(`Publishing scheduled item immediately to ${item.platform}...`);
    try {
      const r = await api("publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: item.topic || "Scheduled Post",
          channel: item.platform,
          text: item.content || item.caption || "",
          mediaUrl: item.mediaUrl || "",
          idempotencyKey: `sched-now:${item.id}:${Date.now()}`
        })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setNotice(`Successfully published to ${item.platform}!`);
        await updateScheduleItem("remove", item.id);
        await refreshAll();
      } else {
        setNotice(`Publishing error: ${j.external?.error || j.error || "Provider error"}`);
      }
    } catch (e) {
      setNotice(`Publishing failed: ${e?.message || e}`);
    }
  }

  async function triggerWorkerNow(force = true) {
    setWorkerRunning(true);
    setWorkerStatus("Triggering server-side auto-post worker...");
    try {
      const res = await api("automation/trigger-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const resp = data.response || {};
        const msg = resp.processed !== undefined
          ? `Worker Finished: ${resp.processed} due post${resp.processed === 1 ? "" : "s"} processed.`
          : (resp.message || "Worker executed successfully.");
        setWorkerStatus(msg);
        setNotice(msg);
        await refreshAll();
      } else {
        setWorkerStatus(`Worker Notice: ${data.error || "Execution completed"}`);
      }
    } catch (e) {
      setWorkerStatus(`Worker Failed: ${e?.message || e}`);
    } finally {
      setWorkerRunning(false);
    }
  }

  function loadPostIntoComposer(post) {
    setTopic(post.topic || "");
    setProduct(post.topic || "");
    setBrief(post.text || "");
    setMediaUrl(post.mediaUrl || "");
    if (post.channel) {
      setSelectedPlatforms([post.channel]);
      setActivePlatformPreview(post.channel);
      setDrafts({ [post.channel]: post.text || "" });
    }
    setTab("Create Post");
    setNotice("Historical post loaded into Composer. Review, edit, and publish or schedule.");
  }

  async function testMetaDiagnostics() {
    setPingingMeta(true);
    try {
      const res = await api("meta/diagnostics");
      const json = await res.json().catch(() => ({}));
      setMetaDiagnostics(json);
      setNotice("Meta Graph API Diagnostics refreshed.");
    } catch (e) {
      setNotice("Meta Diagnostics failed: " + (e?.message || e));
    } finally {
      setPingingMeta(false);
    }
  }

  return (
    <div className="shell" onPaste={handlePaste}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brandRow">
          <div className="brandMark">N</div>
          <div>
            <strong>NUNES</strong>
            <span>Social Command Center</span>
          </div>
        </div>

        <div className="sideLabel">MAIN NAVIGATION</div>
        <nav>
          <button className={tab === "Dashboard" ? "active" : ""} onClick={() => setTab("Dashboard")}>
            <span className="navIcon">⌂</span>Dashboard
          </button>
          <button className={tab === "Live Feed" ? "active" : ""} onClick={() => setTab("Live Feed")}>
            <span className="navIcon">🖼</span>Live Feed
          </button>
          <button className={tab === "Create Post" ? "active" : ""} onClick={() => setTab("Create Post")}>
            <span className="navIcon">＋</span>Create Post
          </button>
          <button className={tab === "Calendar" ? "active" : ""} onClick={() => setTab("Calendar")}>
            <span className="navIcon">📅</span>Content Calendar
          </button>
          <button className={tab === "Auto Posting" ? "active" : ""} onClick={() => setTab("Auto Posting")}>
            <span className="navIcon">⏱</span>Auto Posting
          </button>
          <button className={tab === "Social Accounts" ? "active" : ""} onClick={() => setTab("Social Accounts")}>
            <span className="navIcon">◎</span>Social Accounts
          </button>
          <button className={tab === "Results" ? "active" : ""} onClick={() => setTab("Results")}>
            <span className="navIcon">✓</span>Results & History
          </button>
        </nav>

        <div className="sideLabel">CHANNELS & WORKFLOWS</div>
        <nav>
          <button onClick={() => window.location.href = "/connect/Instagram"}>
            <span className="navIcon">◎</span>Instagram (@nunes)
          </button>
          <button onClick={() => window.open("/connect/Meta", "_blank")}>
            <span className="navIcon">M</span>Meta Business
          </button>
          <button onClick={() => window.open("/whatsapp", "_blank")}>
            <span className="navIcon">WA</span>WhatsApp Hub
          </button>
        </nav>

        <div className="sidebarFoot">
          <div className="profileDot">NI</div>
          <div>
            <strong>Nunes Instrumentation</strong>
            <span>Production V2026.10</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <section className="main">
        {/* Top Header */}
        <header className="topbar">
          <div className="topHeaderLeft">
            <span className="workspaceLabel">WORKSPACE / NUNES INSTRUMENTATION</span>
            <h1 className="headerTitle">{tab}</h1>
          </div>

          <div className="topActions">
            <div className="modeToggle">
              <button
                className={mode === "admin" ? "active" : ""}
                onClick={() => setMode("admin")}
                title="Executive view for owners and management"
              >
                Admin Mode
              </button>
              <button
                className={mode === "tech" ? "active" : ""}
                onClick={() => setMode("tech")}
                title="Technical view with tokens, credentials, and API diagnostics"
              >
                Tech Mode
              </button>
            </div>

            <button className="secondary" onClick={refreshAll} disabled={loading}>
              ↻ Refresh
            </button>
            <button className="primary" onClick={() => setTab("Create Post")}>
              ＋ Quick Create
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="content">
          {error && (
            <div className="alert error">
              <strong>Connection Warning:</strong> {error}
            </div>
          )}
          {notice && (
            <div className="alert">
              <strong>Update:</strong> {notice}
              <button onClick={() => setNotice("")} className="alertClose">×</button>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {tab === "Dashboard" && (
            <>
              {/* Top KPI Cards */}
              <section className="kpis">
                <div className="kpiCard">
                  <span className="kpiLabel">CONNECTED ACCOUNTS</span>
                  <strong className="kpiValue">{loading ? "—" : `${connectedCount} of 5`}</strong>
                  <small className="kpiSub">Live provider validated</small>
                </div>
                <div className="kpiCard">
                  <span className="kpiLabel">POSTS TODAY</span>
                  <strong className="kpiValue">{loading ? "—" : postsToday}</strong>
                  <small className="kpiSub">Published successfully</small>
                </div>
                <div className="kpiCard">
                  <span className="kpiLabel">SCHEDULED</span>
                  <strong className="kpiValue">{loading ? "—" : scheduledCount}</strong>
                  <small className="kpiSub">Queue ready to publish</small>
                </div>
                <div className="kpiCard">
                  <span className="kpiLabel">PENDING APPROVAL</span>
                  <strong className="kpiValue">{loading ? "—" : pendingApprovalCount}</strong>
                  <small className="kpiSub">Waiting management review</small>
                </div>
                <div className="kpiCard">
                  <span className="kpiLabel">FAILED · 7 DAYS</span>
                  <strong className="kpiValue" style={{ color: failedCount > 0 ? "#dc2626" : "inherit" }}>
                    {loading ? "—" : failedCount}
                  </strong>
                  <small className="kpiSub">{failedCount ? "Action required" : "Zero errors reported"}</small>
                </div>
                <div className="kpiCard">
                  <span className="kpiLabel">LAST PUBLISH</span>
                  <strong className="kpiValue" style={{ fontSize: "16px", marginTop: "8px" }}>
                    {lastPost ? fmtDate(lastPost.publishedAt) : "None recorded"}
                  </strong>
                  <small className="kpiSub">{lastPost?.channel || "NUNES Stream"}</small>
                </div>
              </section>

              {/* Account Health Section */}
              <div className="sectionIntro">
                <div>
                  <span className="eyebrow">INTEGRATION HEALTH</span>
                  <h2>Connected Social Accounts</h2>
                  <p>Real-time publishing readiness verified through Meta Graph API, LinkedIn REST API, and Google Services.</p>
                </div>
              </div>

              <section className="channelGrid">
                {activeChannels.map(ch => {
                  const s = connections[ch.name] || {};
                  let stateLabel = "NOT CONNECTED";
                  if (s.connected && s.publishingReady) stateLabel = "PUBLISHING READY";
                  else if (s.connected) stateLabel = "CONNECTED";
                  else if (s.signedIn) stateLabel = "SIGNED IN";
                  else if (s.configured) stateLabel = "ACTION REQUIRED";

                  const accountDisplayName =
                    ch.name === "Facebook" ? (s.health?.pageName || "Nunes Instrumentation") :
                    ch.name === "Instagram" ? (s.name ? `@${s.name}` : "@nunesinstrumentation") :
                    ch.name === "WhatsApp" ? (s.numberCount ? `${s.numberCount} Business Line${s.numberCount === 1 ? "" : "s"}` : "Nunes Main") :
                    ch.name === "LinkedIn" ? (s.connected ? "Nunes Instrumentation Page" : "Not Linked") :
                    (s.connected ? "Connected Channel" : "Not Linked");

                  return (
                    <article className="channelCard" key={ch.name}>
                      <div className={`channelIcon c-${ch.name.toLowerCase()}`}>{ch.icon}</div>
                      <div className="channelMain">
                        <div className="channelTitle">
                          <strong>{ch.name}</strong>
                          <StatusPill state={stateLabel} />
                        </div>
                        <p style={{ fontWeight: 600, color: "#0f172a", margin: "4px 0" }}>{accountDisplayName}</p>
                        <small>{s.actionRequired || ch.purpose}</small>
                        {mode === "tech" && (
                          <div style={{ marginTop: "8px", fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                            Mode: {s.mode || "—"} | Scopes: {s.health?.grantedPermissions?.length || 0} granted
                          </div>
                        )}
                      </div>
                      <button
                        className={s.connected ? "secondary" : "primary"}
                        onClick={() => {
                          if (ch.name === "Instagram") window.location.href = "/connect/Instagram";
                          else if (ch.name === "WhatsApp") window.location.href = "/whatsapp";
                          else window.open(ch.connect, "_blank");
                        }}
                      >
                        {s.connected ? "Manage" : "Connect"}
                      </button>
                    </article>
                  );
                })}
              </section>

              {/* LIVE POSTED FEED IN IMAGE FORMAT */}
              <section className="liveFeedSection">
                <div className="sectionIntro">
                  <div>
                    <span className="eyebrow">LIVE PUBLISHED POSTS FEED</span>
                    <h2>Live Posts Across Connected Accounts</h2>
                    <p>Live image stream displaying the exact verified posts published across your Facebook Page, LinkedIn, and connected channels.</p>
                  </div>
                  <div className="channelFilterPills">
                    {["All", "Facebook", "LinkedIn", "Instagram", "WhatsApp"].map(ch => (
                      <button
                        key={ch}
                        type="button"
                        className={`channelFilterBtn ${liveFilter === ch ? "active" : ""}`}
                        onClick={() => setLiveFilter(ch)}
                      >
                        {ch} {ch === "All" ? `(${livePosts.length})` : `(${livePosts.filter(p => p.channel === ch).length})`}
                      </button>
                    ))}
                  </div>
                </div>

                {livePosts.filter(p => liveFilter === "All" || p.channel === liveFilter).length > 0 ? (
                  <div className="livePostGrid">
                    {livePosts
                      .filter(p => liveFilter === "All" || p.channel === liveFilter)
                      .slice(0, 6)
                      .map(post => (
                        <LivePostCard
                          key={post.id || post.externalId}
                          post={post}
                          onReuse={loadPostIntoComposer}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="emptyState" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "28px" }}>
                    <strong>No live posts recorded yet for {liveFilter}</strong>
                    <span>Published posts from Facebook, LinkedIn, and Instagram will automatically render here in verified image format.</span>
                  </div>
                )}
              </section>

              {/* Action Center & Next Scheduled */}
              <section className="dashboardGrid">
                <article className="panel">
                  <div className="panelHead">
                    <div>
                      <span className="eyebrow">EXECUTIVE ACTIONS</span>
                      <h3>What Needs Attention</h3>
                    </div>
                    <b>{actionItems.length}</b>
                  </div>
                  {actionItems.length ? (
                    <div className="actionList">
                      {actionItems.map(item => (
                        <button key={item.id} onClick={item.action} className={`actionItem ${item.level === "high" ? "high" : ""}`}>
                          <span className="actionBadge">{item.level === "high" ? "!" : "→"}</span>
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.text}</small>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="emptyState">
                      <strong>All Clear & Ready</strong>
                      <span>All active accounts are operating normally. No management action required.</span>
                    </div>
                  )}
                </article>

                <article className="panel">
                  <div className="panelHead">
                    <div>
                      <span className="eyebrow">UPCOMING QUEUE</span>
                      <h3>Scheduled Next</h3>
                    </div>
                    <button className="textLink" onClick={() => setTab("Auto Posting")}>Manage All ({scheduledCount})</button>
                  </div>
                  <div className="scheduleMini">
                    {automation.schedules.filter(x => x.status === "SCHEDULED" && x.enabled !== false).slice(0, 4).map(item => (
                      <div key={item.id} className="scheduleMiniRow">
                        <span className="scheduleIcon">◎</span>
                        <div>
                          <strong>{item.topic || item.caption?.slice(0, 50) || "Scheduled Post"}</strong>
                          <small>{fmtDate(item.scheduledAt)} · {item.platform || "Instagram"}</small>
                        </div>
                      </div>
                    ))}
                    {!scheduledCount && (
                      <div className="emptyState">
                        <strong>No posts scheduled right now</strong>
                        <span>Open Create Post to write and schedule approved content.</span>
                      </div>
                    )}
                  </div>
                </article>
              </section>

              {/* System Health Section */}
              <section className="panel">
                <div className="panelHead">
                  <div>
                    <span className="eyebrow">SYSTEM HEALTH</span>
                    <h3>Infrastructure & Automation Status</h3>
                  </div>
                </div>
                <div className="systemHealthGrid">
                  <div className="healthItem">
                    <span className="healthDot active"></span>
                    <div>
                      <strong>Shared Storage Bridge</strong>
                      <small>AES-256 encrypted multi-device state</small>
                    </div>
                  </div>
                  <div className="healthItem">
                    <span className={`healthDot ${facebook.connected ? "active" : "warn"}`}></span>
                    <div>
                      <strong>Meta Graph API</strong>
                      <small>{facebook.connected ? "Connected & Pages accessible" : "Authorization required"}</small>
                    </div>
                  </div>
                  <div className="healthItem">
                    <span className={`healthDot ${instagram.connected ? "active" : "warn"}`}></span>
                    <div>
                      <strong>Instagram Publishing</strong>
                      <small>{instagram.connected ? "@nunesinstrumentation Ready" : "Validation required"}</small>
                    </div>
                  </div>
                  <div className="healthItem">
                    <span className={`healthDot ${linkedin.connected ? "active" : "warn"}`}></span>
                    <div>
                      <strong>LinkedIn API</strong>
                      <small>{linkedin.connected ? "REST v2 Active" : "Not connected"}</small>
                    </div>
                  </div>
                  <div className="healthItem">
                    <span className="healthDot active"></span>
                    <div>
                      <strong>Cron Worker Engine</strong>
                      <small>Vercel Cron endpoint (/api/cron/social-publish)</small>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Publishing Activity */}
              <section className="panel">
                <div className="panelHead">
                  <div>
                    <span className="eyebrow">AUDIT TRAIL</span>
                    <h3>Recent Publishing Activity</h3>
                  </div>
                  <button className="textLink" onClick={() => setTab("Results")}>Full Results ↗</button>
                </div>
                <div className="historyTable">
                  <div className="historyHeader">
                    <span>Platform</span>
                    <span>Content Topic</span>
                    <span>Status</span>
                    <span>Published Time</span>
                    <span>Action</span>
                  </div>
                  {history.slice(0, 6).map((p, i) => (
                    <div className="historyRow" key={p.id || i}>
                      <strong>{p.channel || p.platform || "—"}</strong>
                      <span>{p.topic || p.text?.slice(0, 75) || "Published post"}</span>
                      <StatusPill state={p.external?.status || "POSTED"} />
                      <span>{fmtDate(p.publishedAt)}</span>
                      <div>
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noreferrer" className="textLink">View Post ↗</a>
                        ) : (
                          <button className="textLink" onClick={() => loadPostIntoComposer(p)}>Reuse 📋</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!history.length && (
                    <div className="emptyState">
                      <strong>No publishing history recorded yet</strong>
                      <span>Published posts will automatically appear in this verified log.</span>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* TAB: LIVE FEED (VISUAL IMAGE STREAM ACROSS CONNECTED CHANNELS) */}
          {tab === "Live Feed" && (
            <>
              <div className="sectionIntro">
                <div>
                  <span className="eyebrow">LIVE PUBLISHED POSTS GALLERY</span>
                  <h2>All Live Posts Across Accounts</h2>
                  <p>Full-resolution visual image stream of verified live content across Facebook, LinkedIn, Instagram, and WhatsApp.</p>
                </div>
                <div className="channelFilterPills">
                  {["All", "Facebook", "LinkedIn", "Instagram", "WhatsApp"].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      className={`channelFilterBtn ${liveFilter === ch ? "active" : ""}`}
                      onClick={() => setLiveFilter(ch)}
                    >
                      {ch} {ch === "All" ? `(${livePosts.length})` : `(${livePosts.filter(p => p.channel === ch).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {livePosts.filter(p => liveFilter === "All" || p.channel === liveFilter).length > 0 ? (
                <div className="livePostGrid">
                  {livePosts
                    .filter(p => liveFilter === "All" || p.channel === liveFilter)
                    .map(post => (
                      <LivePostCard
                        key={post.id || post.externalId}
                        post={post}
                        onReuse={loadPostIntoComposer}
                      />
                    ))}
                </div>
              ) : (
                <div className="emptyState" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "40px" }}>
                  <strong>No live posts found for {liveFilter}</strong>
                  <span>When posts are published through the Command Center or detected on your Facebook Page, they will appear here in verified image format.</span>
                  <button className="primary" style={{ marginTop: "14px" }} onClick={() => setTab("Create Post")}>
                    ＋ Create Post Now
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: CREATE POST (ADVANCED 6-STEP WORKFLOW) */}
          {tab === "Create Post" && (
            <>
              <div className="sectionIntro">
                <div>
                  <span className="eyebrow">POST COMPOSER</span>
                  <h2>Create Once · Native Everywhere</h2>
                  <p>Follow the 6-step workflow to produce tailored B2B, visual, community, and educational versions.</p>
                </div>
                <button className="primary" onClick={generateAllDrafts}>
                  Generate Channel Versions ⚡
                </button>
              </div>

              {/* Industrial Catalog Presets */}
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ⚡ Instant Equipment Catalog Presets:
                </span>
                <div className="catalogPresetRow" style={{ marginTop: "6px" }}>
                  {NUNES_PRODUCT_CATEGORIES.flatMap(cat => cat.products).slice(0, 9).map(prod => (
                    <button
                      key={prod.name}
                      type="button"
                      className={`catalogPill ${product === prod.name ? "active" : ""}`}
                      onClick={() => applyCatalogPreset(prod)}
                    >
                      {prod.name.split("(")[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="composerLayout">
                {/* Left Column: Brief & Media */}
                <div className="composerLeft">
                  {/* STEP 1: BRIEF */}
                  <article className="panel">
                    <div className="panelHead">
                      <div>
                        <span className="stepBadge">STEP 1</span>
                        <h3>Content Brief & Specs</h3>
                      </div>
                    </div>

                    <div className="composeForm">
                      <label>
                        Post Topic / Headline
                        <input
                          value={topic}
                          onChange={e => setTopic(e.target.value)}
                          placeholder="e.g. How to select the right Digital Insulation Tester for industrial plants"
                        />
                      </label>

                      <div className="twoCols">
                        <label>
                          Product or Model
                          <input
                            value={product}
                            onChange={e => setProduct(e.target.value)}
                            placeholder="e.g. 5kV Digital Megohmmeter Series"
                          />
                        </label>
                        <label>
                          Target Audience
                          <input
                            value={targetAudience}
                            onChange={e => setTargetAudience(e.target.value)}
                            placeholder="e.g. Plant Engineers, Quality Managers"
                          />
                        </label>
                      </div>

                      <div className="twoCols">
                        <label>
                          Content Angle
                          <select value={angle} onChange={e => setAngle(e.target.value)}>
                            {ANGLES.map(x => <option key={x} value={x}>{x}</option>)}
                          </select>
                        </label>
                        <label>
                          Call to Action (CTA)
                          <input
                            value={cta}
                            onChange={e => setCta(e.target.value)}
                            placeholder="e.g. Request specification sheet and official pricing"
                          />
                        </label>
                      </div>

                      <label>
                        Technical Parameters & Key Specs
                        <input
                          value={specs}
                          onChange={e => setSpecs(e.target.value)}
                          placeholder="e.g. Range: -1 to 700 bar | Accuracy: ±0.025% F.S. | NABL Traceable"
                        />
                      </label>

                      <label>
                        Application Context & Advantage
                        <textarea
                          rows={3}
                          value={brief}
                          onChange={e => setBrief(e.target.value)}
                          placeholder="Provide specific technical parameters, testing ranges, standards compliance, and practical advantages."
                        />
                      </label>
                    </div>
                  </article>

                  {/* STEP 2: MEDIA UPLOAD (DRAG/DROP, PASTE, & VERIFIED LIBRARY) */}
                  <article className="panel">
                    <div className="panelHead">
                      <div>
                        <span className="stepBadge">STEP 2</span>
                        <h3>Media Asset & Verified Library</h3>
                      </div>
                    </div>

                    <div
                      className={`dropZone ${dragActive ? "dragActive" : ""}`}
                      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files?.[0]) handleUploadFile(e.dataTransfer.files[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept="image/*,video/*,.pdf,.xlsx,.docx"
                        onChange={e => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
                      />
                      <div className="dropZoneIcon">📁</div>
                      <strong>Drag & drop file here, paste with Ctrl+V, or click to upload</strong>
                      <small>Auto-streamed via secure CDN URL for Instagram & Meta Graph compatibility</small>
                    </div>

                    {/* Curated Media Library */}
                    <div style={{ marginTop: "16px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        📷 Or Select from NUNES Verified High-Res Media Library:
                      </span>
                      <div className="curatedMediaGrid">
                        {NUNES_CURATED_MEDIA.map(media => (
                          <div
                            key={media.name}
                            className={`mediaThumbCard ${mediaUrl === media.url ? "selected" : ""}`}
                            onClick={() => selectCuratedMedia(media)}
                            title={media.name}
                          >
                            <img src={media.url} alt={media.name} />
                            <span className="mediaThumbLabel">{media.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: "14px" }}>
                      <label>
                        Public Media URL
                        <input
                          value={mediaUrl}
                          onChange={e => setMediaUrl(e.target.value)}
                          placeholder="https://... (verified public image or video URL)"
                        />
                      </label>
                    </div>

                    {mediaUrl && (
                      <div className="mediaPreviewBox">
                        {/\.(mp4|mov|webm)$/i.test(mediaUrl) ? (
                          <video src={mediaUrl} controls className="previewMediaEl" />
                        ) : (
                          <img src={mediaUrl} alt="Preview" className="previewMediaEl" />
                        )}
                        <button className="ghost danger" onClick={() => { setMediaUrl(""); setMediaFile(null); }}>
                          Remove Media
                        </button>
                      </div>
                    )}
                  </article>

                  {/* STEP 3: PLATFORMS */}
                  <article className="panel">
                    <div className="panelHead">
                      <div>
                        <span className="stepBadge">STEP 3</span>
                        <h3>Target Platforms</h3>
                      </div>
                    </div>

                    <div className="platformSelect">
                      {PUBLISH_CHANNELS.map(ch => {
                        const isConn = connections[ch.name]?.connected;
                        const isSel = selectedPlatforms.includes(ch.name);
                        return (
                          <button
                            key={ch.name}
                            type="button"
                            className={isSel ? "selected" : ""}
                            onClick={() => {
                              setSelectedPlatforms(prev =>
                                prev.includes(ch.name) ? prev.filter(x => x !== ch.name) : [...prev, ch.name]
                              );
                            }}
                          >
                            <span>{ch.icon}</span>
                            <strong>{ch.name}</strong>
                            <small>{isConn ? "Connected" : "Not connected"}</small>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                </div>

                {/* Right Column: Previews & Actions */}
                <div className="composerRight">
                  {/* STEP 4 & 5: PREVIEWS */}
                  <article className="panel">
                    <div className="panelHead">
                      <div>
                        <span className="stepBadge">STEP 4 & 5</span>
                        <h3>Platform Preview & Fine Tuning</h3>
                      </div>
                    </div>

                    <div className="previewTabs">
                      {selectedPlatforms.map(name => (
                        <button
                          key={name}
                          type="button"
                          className={activePlatformPreview === name ? "active" : ""}
                          onClick={() => setActivePlatformPreview(name)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>

                    {selectedPlatforms.length > 0 ? (
                      <div>
                        {/* Live WYSIWYG Feed Mockup */}
                        <SocialPreviewMockup
                          platform={activePlatformPreview}
                          caption={drafts[activePlatformPreview] || ""}
                          mediaUrl={mediaUrl}
                        />

                        {/* Fine Tuning Textarea */}
                        <label style={{ marginTop: "16px" }}>
                          Custom Caption for {activePlatformPreview}
                          <textarea
                            rows={8}
                            value={drafts[activePlatformPreview] || ""}
                            onChange={e => setDrafts({ ...drafts, [activePlatformPreview]: e.target.value })}
                            placeholder={`Click 'Generate Channel Versions' above to create tailored ${activePlatformPreview} copy.`}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="emptyState">
                        <strong>No platforms selected</strong>
                        <span>Select platforms in Step 3 to review previews.</span>
                      </div>
                    )}
                  </article>

                  {/* STEP 6: ACTIONS */}
                  <article className="panel actionPanel">
                    <div className="panelHead">
                      <div>
                        <span className="stepBadge">STEP 6</span>
                        <h3>Publishing Action</h3>
                      </div>
                    </div>

                    <label>
                      Schedule Date & Time (Optional)
                      <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={e => setScheduleDate(e.target.value)}
                      />
                    </label>

                    <div className="actionButtonGroup">
                      <button
                        type="button"
                        className="secondary"
                        disabled={publishing}
                        onClick={() => saveAsSchedule("DRAFT")}
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={publishing}
                        onClick={() => saveAsSchedule("WAITING APPROVAL")}
                      >
                        Request Approval
                      </button>
                      {scheduleDate ? (
                        <button
                          type="button"
                          className="primary"
                          disabled={publishing}
                          onClick={() => saveAsSchedule("SCHEDULED")}
                        >
                          {publishing ? "Scheduling…" : "Schedule Post"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="primary"
                          disabled={publishing}
                          onClick={publishNow}
                        >
                          {publishing ? "Publishing…" : "Publish Now ⚡"}
                        </button>
                      )}
                    </div>
                  </article>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: CONTENT CALENDAR */}
          {tab === "Calendar" && (
            <>
              <div className="sectionIntro">
                <div>
                  <span className="eyebrow">EDITORIAL PLANNING</span>
                  <h2>NUNES Content Calendar</h2>
                  <p>View, manage, and schedule marketing campaigns across LinkedIn, Facebook, Instagram, and YouTube.</p>
                </div>
                <div className="topActions">
                  <div className="modeToggle">
                    <button className={calendarFilter === "All" ? "active" : ""} onClick={() => setCalendarFilter("All")}>All</button>
                    {PUBLISH_CHANNELS.map(ch => (
                      <button key={ch.name} className={calendarFilter === ch.name ? "active" : ""} onClick={() => setCalendarFilter(ch.name)}>
                        {ch.name}
                      </button>
                    ))}
                  </div>
                  <button className="primary" onClick={() => setTab("Create Post")}>＋ New Post</button>
                </div>
              </div>

              <section className="panel">
                <div className="calendarControls">
                  <button className="secondary" onClick={() => {
                    const prev = new Date(calendarDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCalendarDate(prev);
                  }}>← Prev</button>
                  <h3>{calendarDate.toLocaleString("default", { month: "long", year: "numeric" })}</h3>
                  <button className="secondary" onClick={() => {
                    const next = new Date(calendarDate);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarDate(next);
                  }}>Next →</button>
                </div>

                <div className="calendarGrid">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="calendarDayHeader">{day}</div>
                  ))}

                  {/* Render Calendar Days */}
                  {Array.from({ length: 35 }).map((_, idx) => {
                    const dayNum = (idx % 31) + 1;
                    const itemsForDay = automation.schedules.filter(s => {
                      if (calendarFilter !== "All" && s.platform !== calendarFilter) return false;
                      const d = new Date(s.scheduledAt);
                      return d.getDate() === dayNum && d.getMonth() === calendarDate.getMonth();
                    });

                    return (
                      <div
                        key={idx}
                        className="calendarCell"
                        onClick={() => {
                          const targetDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), dayNum, 10, 0);
                          setScheduleDate(targetDate.toISOString().slice(0, 16));
                          setTab("Create Post");
                        }}
                        title="Click to compose post for this day"
                      >
                        <span className="calendarDateNum">{dayNum}</span>
                        <div className="calendarItems">
                          {itemsForDay.map(item => (
                            <div
                              key={item.id}
                              className={`calendarItem ${item.status?.toLowerCase() || ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPostModal(item);
                              }}
                            >
                              <strong>{item.platform || "Instagram"}:</strong> {item.topic || item.caption?.slice(0, 20)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Post Details Modal */}
              {selectedPostModal && (
                <div className="modalOverlay" onClick={() => setSelectedPostModal(null)}>
                  <div className="modalCard" onClick={e => e.stopPropagation()}>
                    <div className="panelHead">
                      <div>
                        <span className="eyebrow">{selectedPostModal.platform} POST</span>
                        <h3>{selectedPostModal.topic || "Post Details"}</h3>
                      </div>
                      <button className="ghost" onClick={() => setSelectedPostModal(null)}>×</button>
                    </div>

                    <div className="modalBody">
                      <div className="accountMeta">
                        <span>Status</span>
                        <strong><StatusPill state={selectedPostModal.status} /></strong>
                        <span>Scheduled For</span>
                        <strong>{fmtDate(selectedPostModal.scheduledAt)}</strong>
                        <span>Platform</span>
                        <strong>{selectedPostModal.platform}</strong>
                      </div>

                      <div style={{ margin: "16px 0" }}>
                        <strong>Caption / Content:</strong>
                        <p style={{ whiteSpace: "pre-wrap", background: "#f8fafc", padding: "12px", borderRadius: "8px", marginTop: "6px" }}>
                          {selectedPostModal.content || selectedPostModal.caption}
                        </p>
                      </div>

                      {selectedPostModal.mediaUrl && (
                        <div>
                          <strong>Media Asset:</strong>
                          <div style={{ marginTop: "6px" }}>
                            <img src={selectedPostModal.mediaUrl} alt="Asset" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "6px" }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="modalFooter">
                      <button
                        className="primary"
                        onClick={() => {
                          publishScheduleItemNow(selectedPostModal);
                          setSelectedPostModal(null);
                        }}
                      >
                        Publish Immediately ⚡
                      </button>
                      {selectedPostModal.status === "WAITING APPROVAL" && (
                        <button
                          className="secondary"
                          onClick={() => {
                            updateScheduleItem("approve", selectedPostModal.id);
                            setSelectedPostModal(null);
                          }}
                        >
                          Approve Post ✓
                        </button>
                      )}
                      <button
                        className="ghost danger"
                        onClick={() => {
                          updateScheduleItem("remove", selectedPostModal.id);
                          setSelectedPostModal(null);
                        }}
                      >
                        Delete
                      </button>
                      <button className="secondary" onClick={() => setSelectedPostModal(null)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 4: AUTO POSTING */}
          {tab === "Auto Posting" && (
            <>
              <div className="sectionIntro">
                <div>
                  <span className="eyebrow">AUTOMATED QUEUE</span>
                  <h2>Auto-Post Scheduling Queue</h2>
                  <p>Server-side scheduled worker publishes approved posts on schedule. Duplicates are blocked atomically.</p>
                </div>
                <button className="ghost" onClick={refreshAll}>↻ Refresh Queue</button>
              </div>

              {/* On-Demand Worker Trigger Banner */}
              <div className="workerTriggerBar">
                <div>
                  <strong>Server-Side Scheduled Publishing Worker Engine</strong>
                  <small>
                    {workerStatus || "Vercel Cron runs daily. Click 'Trigger Worker Now' to process due posts immediately without waiting."}
                  </small>
                </div>
                <button
                  className="workerRunBtn"
                  disabled={workerRunning}
                  onClick={() => triggerWorkerNow(true)}
                >
                  {workerRunning ? "Running Worker..." : "⚡ Trigger Worker Now"}
                </button>
              </div>

              <section className="channelGrid" style={{ gridTemplateColumns: "1fr" }}>
                <article className="channelCard">
                  <div className="channelIcon c-instagram">◎</div>
                  <div className="channelMain">
                    <div className="channelTitle">
                      <strong>Instagram Auto-Pilot Status</strong>
                      <StatusPill state={automation.instagramConnected ? "Publishing Ready" : "Action Required"} />
                    </div>
                    <p>
                      {automation.instagramConnected
                        ? `Connected to @${automation.accountName || "nunesinstrumentation"}. Automatic container publishing enabled.`
                        : "Instagram login or Graph validation required before automated posting can execute."}
                    </p>
                  </div>
                  <button
                    className={automation.instagramConnected ? "secondary" : "primary"}
                    onClick={() => window.location.href = "/connect/Instagram"}
                  >
                    {automation.instagramConnected ? "Manage Account" : "Connect Instagram"}
                  </button>
                </article>
              </section>

              <section className="panel">
                <div className="panelHead">
                  <div>
                    <span className="eyebrow">PRODUCTION QUEUE</span>
                    <h3>{scheduledCount} Active Schedule{scheduledCount === 1 ? "" : "s"}</h3>
                  </div>
                </div>

                <div className="historyTable">
                  <div className="historyHeader">
                    <span>Platform</span>
                    <span>Topic / Content</span>
                    <span>Scheduled Time</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>

                  {automation.schedules.map(item => (
                    <div className="historyRow" key={item.id}>
                      <strong>{item.platform || "Instagram"}</strong>
                      <span>{item.topic || item.caption?.slice(0, 60) || "Scheduled Post"}</span>
                      <span>{fmtDate(item.scheduledAt)}</span>
                      <StatusPill state={item.status || "SCHEDULED"} />
                      <div className="cardBtnGroup">
                        <button
                          className="primary"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => publishScheduleItemNow(item)}
                        >
                          Post Now ⚡
                        </button>
                        <button
                          className="secondary"
                          onClick={() => updateScheduleItem("toggle", item.id, item.enabled === false)}
                        >
                          {item.enabled === false ? "Enable" : "Pause"}
                        </button>
                        <button
                          className="ghost danger"
                          onClick={() => updateScheduleItem("remove", item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {!automation.schedules.length && (
                    <div className="emptyState">
                      <strong>Schedule queue is currently empty</strong>
                      <span>Use Create Post to schedule content for automatic publishing.</span>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* TAB 5: SOCIAL ACCOUNTS */}
          {tab === "Social Accounts" && (
            <>
              <div className="sectionIntro">
                <div>
                  <span className="eyebrow">CHANNELS & CREDENTIALS</span>
                  <h2>Active NUNES Social Accounts</h2>
                  <p>Direct integration for LinkedIn, Facebook, Instagram, YouTube, and WhatsApp.</p>
                </div>
              </div>

              {/* Tech Mode Meta Diagnostics Card */}
              {mode === "tech" && (
                <section className="panel" style={{ background: "#f8fafc", borderColor: "#cbd5e1" }}>
                  <div className="panelHead">
                    <div>
                      <span className="eyebrow">DIAGNOSTICS SUITE</span>
                      <h3>Meta Graph API & WABA Live Inspector</h3>
                    </div>
                    <button
                      className="secondary"
                      onClick={testMetaDiagnostics}
                      disabled={pingingMeta}
                    >
                      {pingingMeta ? "Pinging..." : "⚡ Ping Meta Graph Diagnostics"}
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "12px" }}>
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <strong>Facebook Page</strong>
                      <p style={{ margin: "4px 0", fontSize: "12px", color: "#64748b" }}>
                        ID: 1398853319976762<br />
                        Name: Nunes Instrumentation<br />
                        Status: {facebook.connected ? "Connected" : "Disconnected"}
                      </p>
                    </div>
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <strong>Instagram Professional</strong>
                      <p style={{ margin: "4px 0", fontSize: "12px", color: "#64748b" }}>
                        ID: 17841422933669789<br />
                        Handle: @nunesinstrumentation<br />
                        Status: {instagram.connected ? "Publishing Ready" : "OAuth Grant Required"}
                      </p>
                    </div>
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <strong>WhatsApp WABA</strong>
                      <p style={{ margin: "4px 0", fontSize: "12px", color: "#64748b" }}>
                        WABA: 3603262783168599<br />
                        Phone ID: 1398853319976762<br />
                        Status: {whatsapp.connected ? "Active" : "Disconnected"}
                      </p>
                    </div>
                  </div>
                  {metaDiagnostics && (
                    <details style={{ marginTop: "12px", fontSize: "11px" }}>
                      <summary style={{ cursor: "pointer", color: "#0284c7" }}>View Live Graph Response Payload</summary>
                      <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "10px", borderRadius: "6px", overflowX: "auto", marginTop: "6px" }}>
                        {JSON.stringify(metaDiagnostics, null, 2)}
                      </pre>
                    </details>
                  )}
                </section>
              )}

              <section className="accountsGrid">
                {activeChannels.map(ch => {
                  const s = connections[ch.name] || {};
                  let state = "NOT CONNECTED";
                  if (s.connected && s.publishingReady) state = "PUBLISHING READY";
                  else if (s.connected) state = "CONNECTED";
                  else if (s.configured) state = "ACTION REQUIRED";

                  return (
                    <article className="accountCard" key={ch.name}>
                      <div className={`channelIcon big c-${ch.name.toLowerCase()}`}>{ch.icon}</div>
                      <div>
                        <strong style={{ fontSize: "18px" }}>{ch.name}</strong>
                        <p style={{ margin: "4px 0", color: "#64748b" }}>{ch.purpose}</p>
                      </div>

                      <div style={{ margin: "8px 0" }}>
                        <StatusPill state={state} />
                      </div>

                      <div className="accountMeta">
                        <span>Status</span>
                        <strong>{state}</strong>
                        {ch.name === "Facebook" && (
                          <>
                            <span>Page Name</span>
                            <strong>{s.health?.pageName || "Nunes Instrumentation"}</strong>
                            <span>Page ID</span>
                            <strong>{s.health?.pageId || "1398853319976762"}</strong>
                          </>
                        )}
                        {ch.name === "Instagram" && (
                          <>
                            <span>Account</span>
                            <strong>{s.name ? `@${s.name}` : "@nunesinstrumentation"}</strong>
                            <span>Account ID</span>
                            <strong>{s.accountId || "17841422933669789"}</strong>
                          </>
                        )}
                        {ch.name === "WhatsApp" && (
                          <>
                            <span>Connected Lines</span>
                            <strong>{s.numberCount || 1}</strong>
                            <span>WABA ID</span>
                            <strong>{s.wabaId || "3603262783168599"}</strong>
                          </>
                        )}
                      </div>

                      <button
                        className={s.connected ? "secondary" : "primary"}
                        onClick={() => {
                          if (ch.name === "Instagram") window.location.href = "/connect/Instagram";
                          else if (ch.name === "WhatsApp") window.location.href = "/whatsapp";
                          else window.open(ch.connect, "_blank");
                        }}
                      >
                        {s.connected ? `Manage ${ch.name}` : `Connect ${ch.name}`}
                      </button>

                      {mode === "tech" && (
                        <details style={{ marginTop: "12px", fontSize: "11px", textAlign: "left" }}>
                          <summary style={{ cursor: "pointer", color: "#0284c7" }}>Technical Details</summary>
                          <pre style={{ background: "#f8fafc", padding: "8px", borderRadius: "6px", overflowX: "auto" }}>
                            {JSON.stringify(s, null, 2)}
                          </pre>
                        </details>
                      )}
                    </article>
                  );
                })}
              </section>
            </>
          )}

          {/* TAB 6: RESULTS & HISTORY */}
          {tab === "Results" && (
            <>
              <div className="sectionIntro">
                <div>
                  <span className="eyebrow">VERIFIED AUDIT LOG</span>
                  <h2>Publishing History & Diagnostics</h2>
                  <p>Shows actual provider confirmations and links. Success is reported only after provider verification.</p>
                </div>
                <button className="ghost" onClick={refreshAll}>↻ Refresh Log</button>
              </div>

              {results.length > 0 && (
                <section className="panel">
                  <div className="panelHead">
                    <div>
                      <span className="eyebrow">RECENT RUN</span>
                      <h3>Publishing Response</h3>
                    </div>
                  </div>
                  <div className="resultList">
                    {results.map((r, i) => (
                      <div key={`${r.platform}-${i}`} className="resultRow">
                        <strong>{r.platform}</strong>
                        <StatusPill state={r.status} />
                        <span>{r.status === "POSTED" ? "Published successfully" : (r.error || "Failed")}</span>
                        {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="textLink">Open Post ↗</a>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="panel">
                <div className="panelHead">
                  <div>
                    <span className="eyebrow">HISTORY</span>
                    <h3>NUNES Publishing History ({history.length} records)</h3>
                  </div>
                </div>

                <div className="historyTable">
                  <div className="historyHeader">
                    <span>Platform</span>
                    <span>Content Topic</span>
                    <span>External ID</span>
                    <span>Status</span>
                    <span>Timestamp</span>
                    <span>Action</span>
                  </div>

                  {history.map((p, i) => (
                    <div className="historyRow" key={p.id || i}>
                      <strong>{p.channel || p.platform || "—"}</strong>
                      <span>{p.topic || p.text?.slice(0, 75) || "Published content"}</span>
                      <small style={{ fontFamily: "monospace" }}>{p.external?.externalId || p.id?.slice(0, 8) || "—"}</small>
                      <StatusPill state={p.external?.status || "POSTED"} />
                      <span>{fmtDate(p.publishedAt)}</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer" className="textLink">Open ↗</a>
                        )}
                        <button
                          className="secondary"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => loadPostIntoComposer(p)}
                          title="Load this post into Composer to edit or repurpose"
                        >
                          Reuse 📋
                        </button>
                      </div>
                    </div>
                  ))}

                  {!history.length && (
                    <div className="emptyState">
                      <strong>No publishing history recorded yet</strong>
                      <span>Historical publications will be preserved here.</span>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </section>
    </div>
  );
}
