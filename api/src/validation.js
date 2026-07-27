import {
  BUILD_VERSION_MAX_LENGTH,
  DIFFICULTIES,
  INITIALS_PATTERN,
  SCORE_CONFIG,
} from "./config.js";

export function isValidDifficulty(difficulty) {
  return DIFFICULTIES.includes(difficulty);
}

export function normalizeInitials(value) {
  return typeof value === "string" ? value.toUpperCase() : "";
}

export function isValidInitials(value) {
  return INITIALS_PATTERN.test(normalizeInitials(value));
}

export function isValidBuildVersion(value) {
  return typeof value === "string" && value.length > 0 && value.length <= BUILD_VERSION_MAX_LENGTH;
}

export function calculateScore(distanceMetres, sugarcaneCount, fullSpeedScore) {
  return Math.floor(distanceMetres + sugarcaneCount * SCORE_CONFIG.sugarcaneValue + fullSpeedScore);
}

export function highestTierForSugarcane(sugarcaneCount) {
  if (sugarcaneCount >= 30) {
    return 4;
  }

  if (sugarcaneCount >= 20) {
    return 3;
  }

  if (sugarcaneCount >= 10) {
    return 2;
  }

  return 1;
}

export function isFiniteNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

export function maxPlausibleDistance(runDurationSeconds) {
  return runDurationSeconds * (SCORE_CONFIG.maxSpeedKmh / 3.6) * SCORE_CONFIG.distanceToleranceMultiplier + SCORE_CONFIG.distanceToleranceMetres;
}

export function maxPlausibleSugarcane(runDurationSeconds) {
  return Math.ceil(runDurationSeconds * SCORE_CONFIG.sugarcanePerSecondLimit) + SCORE_CONFIG.sugarcaneTolerance;
}

export function validateFinishedRunMetrics(payload, run, nowSeconds) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, status: 400, error: "invalid_json" };
  }

  if (typeof payload.runId !== "string" || payload.runId.length === 0) {
    return { ok: false, status: 400, error: "invalid_run_id" };
  }

  if (!isValidDifficulty(payload.difficulty) || payload.difficulty !== run.difficulty) {
    return { ok: false, status: 400, error: "invalid_difficulty" };
  }

  if (!isValidBuildVersion(payload.buildVersion) || payload.buildVersion !== run.build_version) {
    return { ok: false, status: 400, error: "invalid_build_version" };
  }

  if (!isNonNegativeInteger(payload.score)) {
    return { ok: false, status: 400, error: "invalid_score" };
  }

  if (!isFiniteNonNegativeNumber(payload.distanceMetres)) {
    return { ok: false, status: 400, error: "invalid_distance" };
  }

  if (!isNonNegativeInteger(payload.sugarcaneCount)) {
    return { ok: false, status: 400, error: "invalid_sugarcane_count" };
  }

  if (!isFiniteNonNegativeNumber(payload.fullSpeedScore)) {
    return { ok: false, status: 400, error: "invalid_full_speed_score" };
  }

  if (!Number.isInteger(payload.highestTier) || payload.highestTier < 1 || payload.highestTier > 4) {
    return { ok: false, status: 400, error: "invalid_highest_tier" };
  }

  if (!isFiniteNonNegativeNumber(payload.runDurationSeconds)) {
    return { ok: false, status: 400, error: "invalid_duration" };
  }

  if (
    payload.runDurationSeconds < SCORE_CONFIG.minRunDurationSeconds ||
    payload.runDurationSeconds > SCORE_CONFIG.maxRunDurationSeconds
  ) {
    return { ok: false, status: 400, error: "implausible_duration" };
  }

  const serverElapsed = nowSeconds - run.started_at;
  if (payload.runDurationSeconds > serverElapsed + SCORE_CONFIG.serverElapsedToleranceSeconds) {
    return { ok: false, status: 400, error: "implausible_duration" };
  }

  const recalculatedScore = calculateScore(payload.distanceMetres, payload.sugarcaneCount, payload.fullSpeedScore);
  if (Math.abs(payload.score - recalculatedScore) > 1) {
    return { ok: false, status: 400, error: "score_mismatch" };
  }

  if (payload.fullSpeedScore > payload.runDurationSeconds * SCORE_CONFIG.maxFullSpeedPointsPerSecond + SCORE_CONFIG.fullSpeedTolerance) {
    return { ok: false, status: 400, error: "implausible_full_speed_score" };
  }

  if (payload.distanceMetres > maxPlausibleDistance(payload.runDurationSeconds)) {
    return { ok: false, status: 400, error: "implausible_distance" };
  }

  if (payload.sugarcaneCount > maxPlausibleSugarcane(payload.runDurationSeconds)) {
    return { ok: false, status: 400, error: "implausible_sugarcane_count" };
  }

  const expectedHighestTier = highestTierForSugarcane(payload.sugarcaneCount);
  if (payload.highestTier !== expectedHighestTier) {
    return { ok: false, status: 400, error: "highest_tier_mismatch" };
  }

  return {
    ok: true,
    metrics: {
      score: recalculatedScore,
      distanceMetres: payload.distanceMetres,
      sugarcaneCount: payload.sugarcaneCount,
      fullSpeedScore: payload.fullSpeedScore,
      highestTier: payload.highestTier,
      runDurationSeconds: payload.runDurationSeconds,
      buildVersion: payload.buildVersion,
    },
  };
}
