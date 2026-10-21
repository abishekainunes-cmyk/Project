const DEFAULT_UPSTREAM = "https://nunes-social-post-machine-nte3uoaxh-instruasia-6728.vercel.app";

function upstreamBase() {
  return String(process.env.NUNES_UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
}

async function forward(request, ctx) {
  const { path = [] } = await ctx.params;
  const incoming = new URL(request.url);
  const target = new URL(`/api/${path.join("/")}`, upstreamBase());
  incoming.searchParams.forEach((value, key) => target.searchParams.append(key, value));

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", request.headers.get("accept") || "application/json");
  headers.set("x-nunes-local-proxy", "1");
  headers.set("x-vercel-protection-bypass", "9K5SmSGho74xFcCthfEwcDSaqvMV5oEr");

  const init = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual"
  };
  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(target, init);
    const outHeaders = new Headers();
    const type = response.headers.get("content-type");
    if (type) outHeaders.set("content-type", type);
    outHeaders.set("cache-control", "no-store");
    const body = await response.arrayBuffer();
    return new Response(body, { status: response.status, headers: outHeaders });
  } catch (error) {
    console.error("[NUNES LOCAL PROXY]", target.toString(), error);
    return Response.json({
      ok: false,
      error: "The local UI could not reach the current NUNES production API.",
      detail: String(error?.message || error)
    }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
