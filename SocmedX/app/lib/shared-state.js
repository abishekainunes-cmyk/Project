import crypto from "crypto";

function getBridgeUrl() {
  return process.env.SOCIAL_STATE_API_URL || process.env.SOCIAL_STATE_BRIDGE_URL || "";
}

function getBridgeSecret() {
  return process.env.SOCIAL_STATE_SHARED_SECRET || process.env.SOCIAL_STATE_BRIDGE_SECRET || "";
}

function sharedReady() {
  return Boolean(getBridgeUrl() && getBridgeSecret());
}

function key() {
  const secret = process.env.SOCIAL_STATE_ENCRYPTION_KEY || getBridgeSecret() || "";
  if (!secret) throw new Error("SOCIAL_STATE_ENCRYPTION_KEY or BRIDGE_SECRET is required");
  return crypto.createHash("sha256").update(secret).digest();
}

function seal(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString("base64url");
}

function unseal(token) {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return JSON.parse(out);
  } catch {
    return null;
  }
}

export async function getSharedState(stateKey) {
  if (!sharedReady()) return null;
  try {
    const url = new URL(getBridgeUrl());
    url.searchParams.set("key", stateKey);
    const r = await fetch(url, {
      headers: { "x-nunes-secret": getBridgeSecret() },
      cache: "no-store"
    });
    if (!r.ok) return null;
    const j = await r.json();
    const blob = j?.payload?.blob;
    if (!blob) return j?.payload || null;
    return unseal(blob);
  } catch (e) {
    console.warn("[SHARED STATE GET] exception for key", stateKey, String(e?.message || e));
    return null;
  }
}

export async function setSharedState(stateKey, value) {
  if (!sharedReady()) return false;
  try {
    const r = await fetch(getBridgeUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nunes-secret": getBridgeSecret()
      },
      body: JSON.stringify({ key: stateKey, payload: { blob: seal(value) } }),
      cache: "no-store"
    });
    return r.ok;
  } catch (e) {
    console.warn("[SHARED STATE SET] exception for key", stateKey, String(e?.message || e));
    return false;
  }
}

export function sharedStateReady() {
  return sharedReady();
}
