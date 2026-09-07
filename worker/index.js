const API_PATHS = new Set([
  "/api/leaderboard",
  "/spacebar-clicker/api/leaderboard",
]);

const ALLOWED_ORIGINS = new Set([
  "https://play.bubblegumgameboy.com",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);

const MAX_BODY_BYTES = 2048;
const MAX_DAMAGE = 1e300;

function cleanName(value) {
  const normalized = String(value ?? "")
    .normalize("NFKC")
    .replace(/[<>\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(normalized).slice(0, 12).join("") || "名無し";
}

function validPlayerId(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers.Vary = "Origin";
  }
  return headers;
}

function json(request, data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

async function readLimitedJson(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new Response(null, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new Response(null, { status: 413 });
  if (!request.body) throw new Response(null, { status: 400 });

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel("request body too large");
        throw new Response(null, { status: 413 });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Response(null, { status: 400 });
  }
}

async function topPlayers(env, currentPlayerId, limit = 10) {
  const result = await env.DB.prepare(
    `SELECT player_id, name, damage, updated_at
       FROM leaderboard
      ORDER BY damage DESC, updated_at ASC
      LIMIT ?1`,
  ).bind(limit).all();

  return result.results.map((row) => ({
    name: cleanName(row.name),
    damage: Number(row.damage) || 0,
    updatedAt: Number(row.updated_at) || 0,
    isMe: Boolean(currentPlayerId && row.player_id === currentPlayerId),
  }));
}

async function handleGet(request, env, url) {
  const requestedLimit = Number.parseInt(url.searchParams.get("limit") || "10", 10);
  const limit = Math.min(50, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 10));
  const playerId = validPlayerId(url.searchParams.get("playerId"))
    ? url.searchParams.get("playerId")
    : "";
  const rows = await topPlayers(env, playerId, limit);
  return json(request, { rows, generatedAt: Date.now() });
}

async function handlePost(request, env) {
  const body = await readLimitedJson(request);
  const playerId = body?.playerId;
  const name = cleanName(body?.name);
  const damage = Number(body?.damage);
  if (!validPlayerId(playerId) || !Number.isFinite(damage) || damage < 0 || damage > MAX_DAMAGE) {
    return json(request, { error: "invalid_submission" }, 400);
  }

  const updatedAt = Date.now();
  await env.DB.prepare(
    `INSERT INTO leaderboard (player_id, name, damage, updated_at)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(player_id) DO UPDATE SET
       name = excluded.name,
       damage = MAX(leaderboard.damage, excluded.damage),
       updated_at = CASE
         WHEN excluded.damage >= leaderboard.damage OR excluded.name <> leaderboard.name
         THEN excluded.updated_at
         ELSE leaderboard.updated_at
       END`,
  ).bind(playerId, name, damage, updatedAt).run();

  return json(request, { ok: true, savedAt: updatedAt });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!API_PATHS.has(url.pathname)) return new Response("Not found", { status: 404 });

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    try {
      if (request.method === "GET") return await handleGet(request, env, url);
      if (request.method === "POST") return await handlePost(request, env);
      return json(request, { error: "method_not_allowed" }, 405);
    } catch (error) {
      if (error instanceof Response) {
        return json(request, { error: `request_${error.status}` }, error.status);
      }
      console.error(JSON.stringify({
        event: "leaderboard_error",
        method: request.method,
        path: url.pathname,
        message: error instanceof Error ? error.message : String(error),
      }));
      return json(request, { error: "internal_error" }, 500);
    }
  },
};
