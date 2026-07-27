import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateScore,
  highestTierForSugarcane,
  isValidInitials,
  maxPlausibleDistance,
  validateFinishedRunMetrics,
} from "../src/validation.js";

const baseRun = {
  id: "run-1",
  difficulty: "realism",
  started_at: 1000,
  build_version: "beta-x",
};

function validPayload(overrides = {}) {
  return {
    runId: "run-1",
    difficulty: "realism",
    score: 12840,
    distanceMetres: 2540,
    sugarcaneCount: 92,
    fullSpeedScore: 1100,
    highestTier: 4,
    runDurationSeconds: 185,
    buildVersion: "beta-x",
    ...overrides,
  };
}

test("valid initials accept A-Z and numeric values", () => {
  assert.equal(isValidInitials("AAA"), true);
  assert.equal(isValidInitials("RKV"), true);
  assert.equal(isValidInitials("A7X"), true);
  assert.equal(isValidInitials("007"), true);
  assert.equal(isValidInitials("rkv"), true);
});

test("invalid initials are rejected", () => {
  assert.equal(isValidInitials("AB"), false);
  assert.equal(isValidInitials("ABCD"), false);
  assert.equal(isValidInitials("A_B"), false);
  assert.equal(isValidInitials("A A"), false);
  assert.equal(isValidInitials("🙂🙂🙂"), false);
  assert.equal(isValidInitials(""), false);
});

test("score formula is recalculated correctly", () => {
  assert.equal(calculateScore(2540.5, 92, 1100), 12840);
});

test("full-speed score plausibility is enforced", () => {
  const result = validateFinishedRunMetrics(
    validPayload({ score: 16540, fullSpeedScore: 4800, runDurationSeconds: 100 }),
    baseRun,
    1200
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, "implausible_full_speed_score");
});

test("distance plausibility is enforced", () => {
  const result = validateFinishedRunMetrics(
    validPayload({
      score: calculateScore(maxPlausibleDistance(10) + 1, 30, 0),
      distanceMetres: maxPlausibleDistance(10) + 1,
      sugarcaneCount: 30,
      fullSpeedScore: 0,
      runDurationSeconds: 10,
    }),
    baseRun,
    1020
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, "implausible_distance");
});

test("highest tier is derived at sugarcane thresholds", () => {
  assert.equal(highestTierForSugarcane(0), 1);
  assert.equal(highestTierForSugarcane(9), 1);
  assert.equal(highestTierForSugarcane(10), 2);
  assert.equal(highestTierForSugarcane(20), 3);
  assert.equal(highestTierForSugarcane(30), 4);
});

test("claimed highest tier must match sugarcane count", () => {
  const result = validateFinishedRunMetrics(
    validPayload({
      score: calculateScore(1000, 9, 0),
      distanceMetres: 1000,
      sugarcaneCount: 9,
      fullSpeedScore: 0,
      highestTier: 2,
      runDurationSeconds: 30,
    }),
    baseRun,
    1040
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, "highest_tier_mismatch");
});
