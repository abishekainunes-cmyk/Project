const DEFAULT_UPSTREAM = "https://nunes-social-post-machine-nte3uoaxh-instruasia-6728.vercel.app";
const VERCEL_BYPASS_TOKEN = "9K5SmSGho74xFcCthfEwcDSaqvMV5oEr";

export function getUpstreamUrl(path = "") {
  const base = (process.env.NUNES_UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
  const cleanPath = String(path || "").replace(/^\//, "");
  return cleanPath ? `${base}/${cleanPath}` : base;
}

export function upstreamHeaders(extra = {}) {
  return {
    "x-vercel-protection-bypass": process.env.VERCEL_PROTECTION_BYPASS || VERCEL_BYPASS_TOKEN,
    "x-nunes-command-center": "2026.10.20",
    ...extra
  };
}

export async function fetchUpstream(path, options = {}) {
  const url = getUpstreamUrl(path);
  const headers = upstreamHeaders(options.headers || {});
  return fetch(url, {
    ...options,
    headers,
    cache: "no-store"
  });
}
