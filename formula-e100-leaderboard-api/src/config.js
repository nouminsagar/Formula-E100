export const SERVICE_NAME = "formula-e100-leaderboard";

export const DIFFICULTIES = Object.freeze(["easy", "hard", "realism"]);

export const THRESHOLDS = Object.freeze({
  easy: 5000,
  hard: 2000,
  realism: 1000,
});

export const TOP_STORED_PER_DIFFICULTY = 25;
export const TOP_PUBLIC_PER_DIFFICULTY = 10;

export const BODY_LIMIT_BYTES = 8 * 1024;

export const BUILD_VERSION_MAX_LENGTH = 32;
export const INITIALS_PATTERN = /^[A-Z0-9]{3}$/;

export const SCORE_CONFIG = Object.freeze({
  sugarcaneValue: 100,
  maxFullSpeedPointsPerSecond: 8,
  fullSpeedTolerance: 2,
  maxSpeedKmh: 250,
  distanceToleranceMultiplier: 1.15,
  distanceToleranceMetres: 100,
  sugarcanePerSecondLimit: 10,
  sugarcaneTolerance: 30,
  minRunDurationSeconds: 3,
  maxRunDurationSeconds: 6 * 60 * 60,
  serverElapsedToleranceSeconds: 10,
});

export const RATE_LIMITS = Object.freeze({
  runStart: { action: "run_start", limit: 60, windowSeconds: 60 * 60 },
  runFinish: { action: "run_finish", limit: 30, windowSeconds: 60 * 60 },
  scoreSubmit: { action: "score_submit", limit: 10, windowSeconds: 60 * 60 },
});

export const CLEANUP_CONFIG = Object.freeze({
  unfinishedRunSeconds: 7 * 24 * 60 * 60,
  finishedRunSeconds: 30 * 24 * 60 * 60,
  rateLimitBucketSeconds: 2 * 24 * 60 * 60,
});

export const SCORE_SUBMISSION_WINDOW_SECONDS = 10 * 60;
