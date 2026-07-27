import {
  THRESHOLDS,
  TOP_PUBLIC_PER_DIFFICULTY,
  TOP_STORED_PER_DIFFICULTY,
} from "./config.js";

export function thresholdForDifficulty(difficulty) {
  return THRESHOLDS[difficulty];
}

export function passesThreshold(difficulty, score) {
  return score > thresholdForDifficulty(difficulty);
}

export function compareEntries(a, b) {
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  if (a.createdAt !== b.createdAt) {
    return a.createdAt < b.createdAt ? -1 : 1;
  }

  return (a.id || 0) - (b.id || 0);
}

export function sortEntries(entries) {
  return entries.slice().sort(compareEntries);
}

export function pruneEntries(entries, limit = TOP_STORED_PER_DIFFICULTY) {
  return sortEntries(entries).slice(0, limit);
}

export function qualifiesForBoard(difficulty, score, currentEntries) {
  if (!passesThreshold(difficulty, score)) {
    return { qualifies: false, reason: "below_threshold" };
  }

  const sorted = sortEntries(currentEntries);
  if (sorted.length < TOP_STORED_PER_DIFFICULTY) {
    return { qualifies: true };
  }

  const cutoff = sorted[TOP_STORED_PER_DIFFICULTY - 1];
  if (score > cutoff.score) {
    return { qualifies: true };
  }

  return { qualifies: false, reason: "outside_top_25" };
}

export function publicEntries(entries, limit = TOP_PUBLIC_PER_DIFFICULTY) {
  return sortEntries(entries).slice(0, limit).map((entry, index) => ({
    rank: index + 1,
    initials: entry.initials,
    score: entry.score,
    createdAt: entry.createdAt,
  }));
}

export async function getLeaderboardRows(db, difficulty, limit = TOP_PUBLIC_PER_DIFFICULTY) {
  const result = await db.prepare(`
    SELECT id, initials, score, created_at AS createdAt
    FROM scores
    WHERE difficulty = ?
    ORDER BY score DESC, created_at ASC, id ASC
    LIMIT ?
  `).bind(difficulty, limit).all();

  return result.results || [];
}

export async function getPublicLeaderboard(db, difficulty) {
  const rows = await getLeaderboardRows(db, difficulty, TOP_PUBLIC_PER_DIFFICULTY);
  return rows.map((entry, index) => ({
    rank: index + 1,
    initials: entry.initials,
    score: entry.score,
    createdAt: entry.createdAt,
  }));
}

export async function getBoardQualification(db, difficulty, score) {
  if (!passesThreshold(difficulty, score)) {
    return { qualifies: false, reason: "below_threshold" };
  }

  const countRow = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM scores
    WHERE difficulty = ?
  `).bind(difficulty).first();
  const count = countRow ? Number(countRow.count) : 0;

  if (count < TOP_STORED_PER_DIFFICULTY) {
    return { qualifies: true };
  }

  const cutoff = await db.prepare(`
    SELECT score
    FROM scores
    WHERE difficulty = ?
    ORDER BY score DESC, created_at ASC, id ASC
    LIMIT 1 OFFSET ?
  `).bind(difficulty, TOP_STORED_PER_DIFFICULTY - 1).first();

  return score > cutoff.score
    ? { qualifies: true }
    : { qualifies: false, reason: "outside_top_25" };
}

export async function estimatedRankForScore(db, difficulty, score) {
  const row = await db.prepare(`
    SELECT COUNT(*) AS better
    FROM scores
    WHERE difficulty = ? AND score >= ?
  `).bind(difficulty, score).first();

  return Number(row?.better || 0) + 1;
}

export async function rankForStoredScore(db, scoreRow) {
  const row = await db.prepare(`
    SELECT COUNT(*) AS better
    FROM scores
    WHERE difficulty = ?
      AND (
        score > ?
        OR (
          score = ?
          AND (
            created_at < ?
            OR (created_at = ? AND id < ?)
          )
        )
      )
  `).bind(
    scoreRow.difficulty,
    scoreRow.score,
    scoreRow.score,
    scoreRow.created_at,
    scoreRow.created_at,
    scoreRow.id
  ).first();

  return Number(row?.better || 0) + 1;
}

export async function pruneStoredLeaderboard(db, difficulty) {
  await db.prepare(`
    DELETE FROM scores
    WHERE difficulty = ?
      AND id NOT IN (
        SELECT id
        FROM scores
        WHERE difficulty = ?
        ORDER BY score DESC, created_at ASC, id ASC
        LIMIT ?
      )
  `).bind(difficulty, difficulty, TOP_STORED_PER_DIFFICULTY).run();
}
