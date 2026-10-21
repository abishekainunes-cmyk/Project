"use client";

import { useState } from "react";

function fmtDate(v) {
  if (!v) return "Just now";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function LivePostCard({ post, onReuse }) {
  const [expanded, setExpanded] = useState(false);
  const [imgModal, setImgModal] = useState(false);

  const channel = post.channel || "Facebook";
  const isLinkedIn = channel === "LinkedIn";
  const isFacebook = channel === "Facebook";
  const isInstagram = channel === "Instagram";
  const isWhatsApp = channel === "WhatsApp";

  const channelBadgeClass = isLinkedIn ? "badge-linkedin" :
                            isFacebook ? "badge-facebook" :
                            isInstagram ? "badge-instagram" :
                            isWhatsApp ? "badge-whatsapp" : "badge-default";

  const channelIcon = isLinkedIn ? "in" :
                      isFacebook ? "f" :
                      isInstagram ? "◎" :
                      isWhatsApp ? "WA" : "▶";

  const cleanText = post.text || post.topic || "Verified industrial instrumentation post.";
  const showText = expanded || cleanText.length < 220 ? cleanText : `${cleanText.slice(0, 200)}... `;

  return (
    <article className="livePostCard">
      {/* Top Header */}
      <div className="livePostHeader">
        <div className="livePostAccount">
          <div className={`livePostAvatar ${channelBadgeClass}`}>{channelIcon}</div>
          <div>
            <div className="livePostTitleRow">
              <strong>{post.accountName || "Nunes Instrumentation"}</strong>
              <span className="liveBadge">
                <span className="liveDot"></span> LIVE
              </span>
            </div>
            <div className="livePostSubRow">
              <span>{post.accountHandle || "nunesinstrumentation"}</span>
              <span>·</span>
              <span>{fmtDate(post.publishedAt)}</span>
            </div>
          </div>
        </div>

        <div className={`channelPillTag ${channelBadgeClass}`}>
          {channel}
        </div>
      </div>

      {/* Main Image Format View */}
      {post.mediaUrl && (
        <div className="livePostImageContainer" onClick={() => setImgModal(true)} title="Click to view full image">
          <img src={post.mediaUrl} alt={post.topic || "Live post"} className="livePostImage" />
          <div className="livePostImgOverlay">
            <span>NUNES INSTRUMENTATION · VERIFIED LIVE</span>
            <span className="expandIcon">🔍 Expand</span>
          </div>
        </div>
      )}

      {/* Published Caption / Content */}
      <div className="livePostBody">
        <p className="livePostCaption">
          {showText}
          {cleanText.length >= 220 && (
            <button type="button" className="textLink" onClick={() => setExpanded(!expanded)}>
              {expanded ? " See less" : " See more"}
            </button>
          )}
        </p>

        {/* Live Provider Metadata & Verification */}
        <div className="livePostMeta">
          <div className="liveIdBadge">
            <span>ID:</span>
            <code>{String(post.externalId || post.id || "").slice(0, 32)}</code>
          </div>
          <span className="deliveryPill">✓ Delivery Confirmed</span>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="livePostFooter">
        {post.url ? (
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer"
            className="primary livePostActionBtn"
          >
            Open Live on {channel} ↗
          </a>
        ) : (
          <span className="livePostStoredBadge">Verified Live</span>
        )}

        {onReuse && (
          <button
            type="button"
            className="secondary livePostActionBtn"
            onClick={() => onReuse(post)}
            title="Load this post into Composer to edit or republish"
          >
            Reuse Post 📋
          </button>
        )}
      </div>

      {/* Full-Screen Image Modal */}
      {imgModal && post.mediaUrl && (
        <div className="modalOverlay" onClick={() => setImgModal(false)}>
          <div className="modalImageCard" onClick={e => e.stopPropagation()}>
            <div className="modalImageHead">
              <strong>{post.channel} · Live Post Media</strong>
              <button className="ghost" onClick={() => setImgModal(false)}>✕</button>
            </div>
            <img src={post.mediaUrl} alt="Live asset" className="modalFullImage" />
            <div className="modalImageFoot">
              <span>{post.accountName || "Nunes Instrumentation"}</span>
              {post.url && (
                <a href={post.url} target="_blank" rel="noreferrer" className="textLink">
                  View Post on {post.channel} ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
