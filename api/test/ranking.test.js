import test from "node:test";
import assert from "node:assert/strict";
import {
  passesThreshold,
  pruneEntries,
  publicEntries,
  qualifiesForBoard,
  sortEntries,
} from "../src/leaderboard.js";

function board(size, scoreForIndex = (index) => 10000 - index * 100) {
  return Array.from({ length: size }, (_, index) => ({
    id: index + 1,
    initials: `A${String(index).padStart(2, "0")}`.slice(0, 3),
    score: scoreForIndex(index),
    createdAt: `2026-07-27T00:${String(index).padStart(2, "0")}:00Z`,
  }));
}

test("Easy score 5000 does not qualify", () => {
  assert.equal(passesThreshold("easy", 5000), false);
});

test("Easy score 5001 passes the threshold", () => {
  assert.equal(passesThreshold("easy", 5001), true);
});

test("Hard score 2000 does not qualify", () => {
  assert.equal(passesThreshold("hard", 2000), false);
});

test("Hard score 2001 passes the threshold", () => {
  assert.equal(passesThreshold("hard", 2001), true);
});

test("Realism score 1000 does not qualify", () => {
  assert.equal(passesThreshold("realism", 1000), false);
});

test("Realism score 1001 passes the threshold", () => {
  assert.equal(passesThreshold("realism", 1001), true);
});

test("board with fewer than 25 records accepts a threshold-passing score", () => {
  assert.deepEqual(qualifiesForBoard("realism", 1001, board(24)), { qualifies: true });
});

test("full board rejects a score equal to the 25th score", () => {
  const entries = board(25);
  const cutoff = sortEntries(entries)[24].score;
  assert.deepEqual(qualifiesForBoard("hard", cutoff, entries), {
    qualifies: false,
    reason: "outside_top_25",
  });
});

test("full board accepts a score greater than the 25th score", () => {
  const entries = board(25);
  const cutoff = sortEntries(entries)[24].score;
  assert.deepEqual(qualifiesForBoard("hard", cutoff + 1, entries), { qualifies: true });
});

test("ties preserve the earlier record, then numeric ID", () => {
  const entries = [
    { id: 3, initials: "CCC", score: 7000, createdAt: "2026-07-27T00:00:02Z" },
    { id: 2, initials: "BBB", score: 7000, createdAt: "2026-07-27T00:00:01Z" },
    { id: 1, initials: "AAA", score: 7000, createdAt: "2026-07-27T00:00:01Z" },
  ];
  assert.deepEqual(sortEntries(entries).map((entry) => entry.initials), ["AAA", "BBB", "CCC"]);
});

test("pruning retains exactly the top 25 entries", () => {
  const entries = board(30);
  assert.equal(pruneEntries(entries).length, 25);
  assert.equal(pruneEntries(entries)[24].score, sortEntries(entries)[24].score);
});

test("public entries return no more than top 10 records", () => {
  assert.equal(publicEntries(board(30)).length, 10);
});

test("difficulty boards remain independent in qualification logic", () => {
  const easyBoard = board(25, () => 6000);
  const realismBoard = board(1, () => 1500);

  assert.equal(qualifiesForBoard("easy", 5500, easyBoard).qualifies, false);
  assert.equal(qualifiesForBoard("realism", 1501, realismBoard).qualifies, true);
});
