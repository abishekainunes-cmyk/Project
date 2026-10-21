import { getSharedState } from "../../../lib/shared-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id) {
      return new Response("Missing media id", { status: 400 });
    }

    const item = await getSharedState(`media:${id}`);
    if (!item || !item.base64) {
      return new Response("Media asset not found", { status: 404 });
    }

    const buffer = Buffer.from(item.base64, "base64");
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": item.mimeType || "image/jpeg",
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (e) {
    return new Response("Error retrieving media: " + String(e?.message || e), { status: 500 });
  }
}
