import test from "node:test";
import assert from "node:assert/strict";
import { parseChord, normaliseChord } from "../src/index.ts";

test("normalises common jazz chord spellings", () => {
  assert.equal(normaliseChord("C-7"), "Cm7");
  assert.equal(normaliseChord("Cmin7"), "Cm7");
  assert.equal(normaliseChord("C∆7"), "Cmaj7");
  assert.equal(normaliseChord("C^7"), "Cmaj7");
  assert.equal(normaliseChord("C7b9"), "C7(b9)");
  assert.equal(normaliseChord("C7b13"), "C7(b13)");
  assert.equal(normaliseChord("Cø7"), "Cm7b5");
  assert.equal(normaliseChord("C-7b5"), "Cm7b5");
  assert.equal(normaliseChord("Cdim7"), "Cdim7");
  assert.equal(normaliseChord("C/G"), "C/G");
});

test("returns the internal chord model", () => {
  assert.deepEqual(parseChord("D7b9"), {
    raw: "D7b9",
    root: "D",
    quality: "7",
    extensions: ["b9"],
    bass: null,
    symbol: "D7(b9)"
  });
});
