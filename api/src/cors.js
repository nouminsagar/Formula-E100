const CORS_METHODS = "GET, POST, OPTIONS";
const CORS_HEADERS = "Content-Type";

export function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function requestOrigin(request) {
  return request.headers.get("Origin");
}

export function isAllowedOrigin(request, env) {
  const origin = requestOrigin(request);
  return !origin || allowedOrigins(env).includes(origin);
}

export function corsHeadersForRequest(request, env) {
  const origin = requestOrigin(request);
  const headers = {
    Vary: "Origin",
  };

  if (origin && allowedOrigins(env).includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = CORS_METHODS;
    headers["Access-Control-Allow-Headers"] = CORS_HEADERS;
    headers["Access-Control-Max-Age"] = "86400";
  }

  return headers;
}

export function jsonResponse(request, env, body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeadersForRequest(request, env),
      ...(init.headers || {}),
    },
  });
}

export function optionsResponse(request, env) {
  if (!isAllowedOrigin(request, env)) {
    return jsonResponse(request, env, { ok: false, error: "disallowed_origin" }, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeadersForRequest(request, env),
  });
}
