import {
  BODY_LIMIT_BYTES,
  CLEANUP_CONFIG,
  RATE_LIMITS,
  SCORE_SUBMISSION_WINDOW_SECONDS,
  SERVICE_NAME,
} from "./config.js";
import { isAllowedOrigin, jsonResponse, optionsResponse } from "./cors.js";
import {
  estimatedRankForScore,
  getBoardQualification,
  getPublicLeaderboard,
  pruneStoredLeaderboard,
  rankForStoredScore,
  thresholdForDifficulty,
} from "./leaderboard.js";
import { enforceRateLimit } from "./rateLimit.js";
import {
  isValidBuildVersion,
  isValidDifficulty,
  isValidInitials,
  normalizeInitials,
  validateFinishedRunMetrics,
} from "./validation.js";

const SUPPORTED_ROUTES = new Set([
  "/api/health",
  "/api/leaderboard",
  "/api/runs/start",
  "/api/runs/finish",
  "/api/scores",
]);

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function readJsonBody(request) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > BODY_LIMIT_BYTES) {
    return { ok: false, status: 413, error: "body_too_large" };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).length > BODY_LIMIT_BYTES) {
    return { ok: false, status: 413, error: "body_too_large" };
  }

  try {
    const body = JSON.parse(text || "{}");
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false, status: 400, error: "invalid_json" };
    }
    return { ok: true, body };
  } catch {
    return { ok: false, status: 400, error: "invalid_json" };
  }
}

async function cleanup(db, now) {
  await db.batch([
    db.prepare(`
      DELETE FROM runs
      WHERE submitted = 0
        AND finished_at IS NULL
        AND started_at < ?
    `).bind(now - CLEANUP_CONFIG.unfinishedRunSeconds),
    db.prepare(`
      DELETE FROM runs
      WHERE finished_at IS NOT NULL
        AND finished_at < ?
    `).bind(now - CLEANUP_CONFIG.finishedRunSeconds),
    db.prepare(`
      DELETE FROM rate_limits
      WHERE bucket_start < ?
    `).bind(now - CLEANUP_CONFIG.rateLimitBucketSeconds),
  ]);
}

function methodNotAllowed(request, env) {
  return jsonResponse(request, env, { ok: false, error: "method_not_allowed" }, { status: 405 });
}

function invalid(request, env, status, error) {
  return jsonResponse(request, env, { ok: false, error }, { status });
}

async function handleHealth(request, env) {
  await env.DB.prepare("SELECT 1 AS ok").first();
  return jsonResponse(request, env, {
    ok: true,
    service: SERVICE_NAME,
    database: "connected",
  });
}

async function handleLeaderboard(request, env, url) {
  const difficulty = url.searchParams.get("difficulty");
  if (!isValidDifficulty(difficulty)) {
    return invalid(request, env, 400, "invalid_difficulty");
  }

  const entries = await getPublicLeaderboard(env.DB, difficulty);
  return jsonResponse(request, env, {
    ok: true,
    difficulty,
    threshold: thresholdForDifficulty(difficulty),
    entries,
  }, {
    headers: {
      "Cache-Control": "public, max-age=15",
    },
  });
}

async function handleRunStart(request, env) {
  const now = nowSeconds();
  const rate = await enforceRateLimit(env.DB, request, env, RATE_LIMITS.runStart, now);
  if (!rate.ok) {
    return invalid(request, env, 429, "rate_limited");
  }

  await cleanup(env.DB, now);
  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return invalid(request, env, parsed.status, parsed.error);
  }

  const { difficulty, buildVersion } = parsed.body;
  if (!isValidDifficulty(difficulty)) {
    return invalid(request, env, 400, "invalid_difficulty");
  }

  if (!isValidBuildVersion(buildVersion)) {
    return invalid(request, env, 400, "invalid_build_version");
  }

  const runId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO runs (id, difficulty, started_at, build_version, submitted, qualified)
    VALUES (?, ?, ?, ?, 0, 0)
  `).bind(runId, difficulty, now, buildVersion).run();

  return jsonResponse(request, env, {
    ok: true,
    runId,
    difficulty,
    startedAt: now,
  }, { status: 201 });
}

async function handleRunFinish(request, env) {
  const now = nowSeconds();
  const rate = await enforceRateLimit(env.DB, request, env, RATE_LIMITS.runFinish, now);
  if (!rate.ok) {
    return invalid(request, env, 429, "rate_limited");
  }

  await cleanup(env.DB, now);
  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return invalid(request, env, parsed.status, parsed.error);
  }

  const run = await env.DB.prepare(`
    SELECT *
    FROM runs
    WHERE id = ?
  `).bind(parsed.body.runId || "").first();

  if (!run) {
    return invalid(request, env, 404, "run_not_found");
  }

  if (run.finished_at !== null && run.finished_at !== undefined) {
    return invalid(request, env, 409, "run_already_finished");
  }

  if (run.submitted) {
    return invalid(request, env, 409, "run_already_submitted");
  }

  const validation = validateFinishedRunMetrics(parsed.body, run, now);
  if (!validation.ok) {
    return invalid(request, env, validation.status, validation.error);
  }

  const { metrics } = validation;
  const boardQualification = await getBoardQualification(env.DB, run.difficulty, metrics.score);

  await env.DB.prepare(`
    UPDATE runs
    SET finished_at = ?,
        score = ?,
        distance_metres = ?,
        sugarcane_count = ?,
        full_speed_score = ?,
        highest_tier = ?,
        run_duration_seconds = ?,
        qualified = ?
    WHERE id = ?
  `).bind(
    now,
    metrics.score,
    metrics.distanceMetres,
    metrics.sugarcaneCount,
    metrics.fullSpeedScore,
    metrics.highestTier,
    metrics.runDurationSeconds,
    boardQualification.qualifies ? 1 : 0,
    run.id
  ).run();

  if (!boardQualification.qualifies) {
    return jsonResponse(request, env, {
      ok: true,
      qualifies: false,
      reason: boardQualification.reason,
    });
  }

  const estimatedRank = await estimatedRankForScore(env.DB, run.difficulty, metrics.score);
  return jsonResponse(request, env, {
    ok: true,
    qualifies: true,
    estimatedRank,
    runId: run.id,
    nameEntryRequired: true,
  });
}

async function handleScoreSubmit(request, env) {
  const now = nowSeconds();
  const rate = await enforceRateLimit(env.DB, request, env, RATE_LIMITS.scoreSubmit, now);
  if (!rate.ok) {
    return invalid(request, env, 429, "rate_limited");
  }

  await cleanup(env.DB, now);
  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return invalid(request, env, parsed.status, parsed.error);
  }

  const runId = parsed.body.runId;
  const initials = normalizeInitials(parsed.body.initials);
  if (typeof runId !== "string" || runId.length === 0) {
    return invalid(request, env, 400, "invalid_run_id");
  }

  if (!isValidInitials(initials)) {
    return invalid(request, env, 400, "invalid_initials");
  }

  const run = await env.DB.prepare(`
    SELECT *
    FROM runs
    WHERE id = ?
  `).bind(runId).first();

  if (!run) {
    return invalid(request, env, 404, "run_not_found");
  }

  if (!run.finished_at) {
    return invalid(request, env, 400, "run_not_finished");
  }

  if (!run.qualified) {
    return invalid(request, env, 400, "run_not_qualified");
  }

  if (run.submitted) {
    return invalid(request, env, 409, "run_already_submitted");
  }

  if (now - run.finished_at > SCORE_SUBMISSION_WINDOW_SECONDS) {
    return invalid(request, env, 409, "name_entry_expired");
  }

  const stillQualifies = await getBoardQualification(env.DB, run.difficulty, run.score);
  if (!stillQualifies.qualifies) {
    return jsonResponse(request, env, { ok: false, error: "leaderboard_changed" }, { status: 409 });
  }

  try {
    await env.DB.prepare(`
      INSERT INTO scores (
        run_id, initials, difficulty, score, distance_metres, sugarcane_count,
        full_speed_score, highest_tier, run_duration_seconds, build_version
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      run.id,
      initials,
      run.difficulty,
      run.score,
      run.distance_metres,
      run.sugarcane_count,
      run.full_speed_score,
      run.highest_tier,
      run.run_duration_seconds,
      run.build_version
    ).run();
  } catch (error) {
    console.error("score_insert_failed", error);
    return invalid(request, env, 409, "run_already_submitted");
  }

  await env.DB.prepare(`
    UPDATE runs
    SET submitted = 1
    WHERE id = ?
  `).bind(run.id).run();

  await pruneStoredLeaderboard(env.DB, run.difficulty);

  const scoreRow = await env.DB.prepare(`
    SELECT id, difficulty, score, created_at
    FROM scores
    WHERE run_id = ?
  `).bind(run.id).first();
  const rank = await rankForStoredScore(env.DB, scoreRow);
  const leaderboard = await getPublicLeaderboard(env.DB, run.difficulty);

  return jsonResponse(request, env, {
    ok: true,
    accepted: true,
    rank,
    difficulty: run.difficulty,
    entry: {
      initials,
      score: run.score,
    },
    leaderboard,
  }, { status: 201 });
}

async function route(request, env) {
  const url = new URL(request.url);

  if (!SUPPORTED_ROUTES.has(url.pathname)) {
    return jsonResponse(request, env, { ok: false, error: "not_found" }, { status: 404 });
  }

  if (request.method === "OPTIONS") {
    return optionsResponse(request, env);
  }

  if (!isAllowedOrigin(request, env)) {
    return jsonResponse(request, env, { ok: false, error: "disallowed_origin" }, { status: 403 });
  }

  if (url.pathname === "/api/health") {
    return request.method === "GET" ? handleHealth(request, env) : methodNotAllowed(request, env);
  }

  if (url.pathname === "/api/leaderboard") {
    return request.method === "GET" ? handleLeaderboard(request, env, url) : methodNotAllowed(request, env);
  }

  if (url.pathname === "/api/runs/start") {
    return request.method === "POST" ? handleRunStart(request, env) : methodNotAllowed(request, env);
  }

  if (url.pathname === "/api/runs/finish") {
    return request.method === "POST" ? handleRunFinish(request, env) : methodNotAllowed(request, env);
  }

  if (url.pathname === "/api/scores") {
    return request.method === "POST" ? handleScoreSubmit(request, env) : methodNotAllowed(request, env);
  }

  return jsonResponse(request, env, { ok: false, error: "not_found" }, { status: 404 });
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      console.error("unexpected_worker_error", error);
      return jsonResponse(request, env, { ok: false, error: "internal_error" }, { status: 500 });
    }
  },
};
