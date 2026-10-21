import crypto from "node:crypto";
import { setSharedState } from "../../lib/shared-state";
import { fetchUpstream } from "../../lib/upstream-backend";

export const runtime = "nodejs";

const DEFAULT_UPSTREAM = "https://nunes-social-post-machine-mu.vercel.app";

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "No file supplied" }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ ok: false, error: "File exceeds 25 MB limit for social upload" }, { status: 413 });
    }

    // Determine public base URL
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "nunes-social-post-machine-mu.vercel.app";
    const baseUrl = (process.env.PUBLIC_APP_URL || `${proto}://${host}`).replace(/\/$/, "");

    // If external upload service is explicitly configured
    if (process.env.SOCIAL_UPLOAD_API_URL && process.env.SOCIAL_STATE_SHARED_SECRET) {
      try {
        const out = new FormData();
        out.set("file", file, file.name);

        const r = await fetch(process.env.SOCIAL_UPLOAD_API_URL, {
          method: "POST",
          headers: { "x-nunes-secret": process.env.SOCIAL_STATE_SHARED_SECRET },
          body: out,
          cache: "no-store"
        });

        const data = await r.json().catch(() => ({}));
        if (r.ok && data.ok) {
          return Response.json(data);
        }
      } catch (e) {
        console.warn("[EXTERNAL UPLOAD FAILED, FALLING BACK TO SHARED MEDIA STREAM]", String(e?.message || e));
      }
    }

    // Built-in High-Availability Media Storage via Shared Encrypted State
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileId = crypto.randomUUID();
    const mediaItem = {
      id: fileId,
      name: file.name,
      mimeType: file.type || "image/jpeg",
      size: file.size,
      base64: buffer.toString("base64"),
      uploadedAt: new Date().toISOString()
    };

    await setSharedState(`media:${fileId}`, mediaItem);

    const publicUrl = `${baseUrl}/api/media/${fileId}`;

    return Response.json({
      ok: true,
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: publicUrl
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || "Upload failed") }, { status: 500 });
  }
}
