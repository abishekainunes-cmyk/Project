"use client";

import { useState } from "react";

export default function SocialPreviewMockup({ platform, caption, mediaUrl }) {
  const [expanded, setExpanded] = useState(false);

  const cleanText = caption || "No content generated yet. Select a topic or product and click 'Generate Channel Versions'.";
  const displayMedia = mediaUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80";

  // LinkedIn Feed Card
  if (platform === "LinkedIn") {
    return (
      <div className="previewMockup linkedinMockup">
        <div className="mockupHeader">
          <div className="mockupAvatar linkedinAvatar">NI</div>
          <div className="mockupMeta">
            <div className="mockupAuthor">
              <strong>Nunes Instrumentation</strong>
              <span className="badgeBadge">1st</span>
            </div>
            <span className="mockupSub">Industrial Measurement & Testing Equipment • 2,800+ followers</span>
            <span className="mockupTime">Just now • Edited • 🌐</span>
          </div>
          <button className="ghost mockupFollowBtn">＋ Follow</button>
        </div>

        <div className="mockupBody">
          <p className="mockupText">
            {expanded || cleanText.length < 280 ? cleanText : `${cleanText.slice(0, 260)}... `}
            {cleanText.length >= 280 && (
              <span className="seeMoreLink" onClick={() => setExpanded(!expanded)}>
                {expanded ? " see less" : "...see more"}
              </span>
            )}
          </p>
        </div>

        {displayMedia && (
          <div className="mockupMedia">
            <img src={displayMedia} alt="Post asset" />
          </div>
        )}

        <div className="linkedinReactions">
          <div className="reactionIcons">
            <span className="reactDot reactLike">👍</span>
            <span className="reactDot reactClap">👏</span>
            <span className="reactDot reactHeart">❤️</span>
            <span className="reactionCount">64 others</span>
          </div>
          <span className="reactionComments">14 comments • 6 reposts</span>
        </div>

        <div className="mockupActions linkedinActions">
          <button type="button">👍 Like</button>
          <button type="button">💬 Comment</button>
          <button type="button">🔁 Repost</button>
          <button type="button">↗ Send</button>
        </div>
      </div>
    );
  }

  // Facebook Page Feed Card
  if (platform === "Facebook") {
    return (
      <div className="previewMockup facebookMockup">
        <div className="mockupHeader">
          <div className="mockupAvatar facebookAvatar">f</div>
          <div className="mockupMeta">
            <div className="mockupAuthor">
              <strong>Nunes Instrumentation</strong>
              <span className="verifiedTick" title="Verified Page">✓</span>
            </div>
            <span className="mockupTime">Just now · 🌐 Public</span>
          </div>
          <div className="mockupDots">•••</div>
        </div>

        <div className="mockupBody">
          <p className="mockupText">{cleanText}</p>
        </div>

        {displayMedia && (
          <div className="mockupMedia">
            <img src={displayMedia} alt="Post asset" />
          </div>
        )}

        <div className="facebookReactions">
          <span>👍❤️ 92 others</span>
          <span>18 comments · 5 shares</span>
        </div>

        <div className="mockupActions facebookActions">
          <button type="button">👍 Like</button>
          <button type="button">💬 Comment</button>
          <button type="button">↗ Share</button>
        </div>
      </div>
    );
  }

  // Instagram Feed Card
  if (platform === "Instagram") {
    return (
      <div className="previewMockup instagramMockup">
        <div className="mockupHeader">
          <div className="instagramStoryRing">
            <div className="mockupAvatar instagramAvatar">NI</div>
          </div>
          <div className="mockupMeta">
            <strong className="mockupAuthor">nunesinstrumentation</strong>
            <span className="mockupSub">Kolkata, West Bengal, India</span>
          </div>
          <div className="mockupDots">•••</div>
        </div>

        {displayMedia && (
          <div className="mockupMedia instagramMedia">
            <img src={displayMedia} alt="Post asset" />
          </div>
        )}

        <div className="instagramIconBar">
          <div className="leftIcons">
            <span className="igIcon">❤️</span>
            <span className="igIcon">💬</span>
            <span className="igIcon">↗</span>
          </div>
          <span className="igIcon">🔖</span>
        </div>

        <div className="instagramLikes">
          <span>Liked by <strong>plant_engineers_india</strong> and <strong>148 others</strong></span>
        </div>

        <div className="mockupBody instagramCaption">
          <p>
            <strong>nunesinstrumentation</strong>{" "}
            {expanded || cleanText.length < 180 ? cleanText : `${cleanText.slice(0, 160)}... `}
            {cleanText.length >= 180 && (
              <span className="seeMoreLink" onClick={() => setExpanded(!expanded)}>
                {expanded ? " less" : " more"}
              </span>
            )}
          </p>
          <small className="instagramTime">Just now</small>
        </div>
      </div>
    );
  }

  // WhatsApp Message Preview Card
  if (platform === "WhatsApp") {
    return (
      <div className="previewMockup whatsappMockup">
        <div className="whatsappHeader">
          <div className="mockupAvatar whatsappAvatar">WA</div>
          <div className="mockupMeta">
            <strong>Nunes Instrumentation</strong>
            <small style={{ color: "#22c55e" }}>Official Business Account</small>
          </div>
        </div>

        <div className="whatsappChatArea">
          <div className="whatsappBubble">
            {displayMedia && (
              <div className="whatsappBubbleMedia">
                <img src={displayMedia} alt="Chat media" />
              </div>
            )}
            <div className="whatsappBubbleText">
              {cleanText.split("\n").map((line, idx) => (
                <span key={idx}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
            <div className="whatsappMeta">
              <span>10:30 AM</span>
              <span className="blueTicks">✓✓</span>
            </div>
          </div>
        </div>

        <div className="whatsappCtaBar">
          <button type="button" className="whatsappCtaBtn">
            💬 Message on WhatsApp
          </button>
        </div>
      </div>
    );
  }

  // YouTube / Fallback Card
  return (
    <div className="previewMockup youtubeMockup">
      <div className="mockupHeader">
        <div className="mockupAvatar youtubeAvatar">▶</div>
        <div className="mockupMeta">
          <strong>Nunes Instrumentation Channel</strong>
          <span className="mockupSub">Technical Demonstration Video</span>
        </div>
      </div>
      {displayMedia && (
        <div className="mockupMedia">
          <img src={displayMedia} alt="Video thumbnail" />
        </div>
      )}
      <div className="mockupBody">
        <pre className="mockupText youtubeText">{cleanText}</pre>
      </div>
    </div>
  );
}
