import assert from "node:assert/strict";
import test from "node:test";

import * as decklistModule from "./decklist";

const { parseDecklistText } = decklistModule;

test("parseDecklistText handles common plain-text deck lines", () => {
  const result = parseDecklistText(`
Commander
1x Sol Ring
4 Lightning Bolt
# comment
Lightning Bolt 2
  `);

  assert.equal(result.unresolvedLines.length, 0);
  assert.deepEqual(
    result.entries.map((entry) => [entry.cardName, entry.quantity]),
    [
      ["Sol Ring", 1],
      ["Lightning Bolt", 6],
    ],
  );
  assert.ok(
    result.warnings.some((warning) => warning.includes("merged")),
    "expected duplicate line warning",
  );
});

test("parseDecklistText keeps unresolved junk lines out of the deck entries", () => {
  const result = parseDecklistText(`
4
--
// ignore me
Gilded Lotus
  `);

  assert.deepEqual(
    result.entries.map((entry) => [entry.cardName, entry.quantity]),
    [["Gilded Lotus", 1]],
  );
  assert.equal(result.unresolvedLines.length, 1);
});
