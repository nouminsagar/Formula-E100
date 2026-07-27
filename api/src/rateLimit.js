const encoder = new TextEncoder();

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function rawClientAddress(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "local-development"
  );
}

export async function clientRateLimitKey(request, env) {
  if (!env.IP_HASH_SALT) {
    throw new Error("IP_HASH_SALT is not configured");
  }

  return sha256Hex(`${env.IP_HASH_SALT}:${rawClientAddress(request)}`);
}

export async function enforceRateLimit(db, request, env, rule, nowSeconds) {
  const key = await clientRateLimitKey(request, env);
  const bucketStart = Math.floor(nowSeconds / rule.windowSeconds) * rule.windowSeconds;
  const row = await db.prepare(`
    SELECT request_count AS requestCount
    FROM rate_limits
    WHERE key = ? AND action = ? AND bucket_start = ?
  `).bind(key, rule.action, bucketStart).first();

  if (row && Number(row.requestCount) >= rule.limit) {
    return { ok: false };
  }

  await db.prepare(`
    INSERT INTO rate_limits (key, action, bucket_start, request_count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(key, action, bucket_start)
    DO UPDATE SET request_count = request_count + 1
  `).bind(key, rule.action, bucketStart).run();

  return { ok: true };
}
