import test from "node:test";
import assert from "node:assert/strict";
import { analyseProgression } from "../src/index.ts";
import { parsePlainTextChart } from "../src/import/index.ts";

test("parses barline-separated chords", () => {
  const parsed = parsePlainTextChart("| Dm7 | G7 | Cmaj7 |");
  assert.deepEqual(
    parsed.bars.map((bar) => bar.chords),
    [["Dm7"], ["G7"], ["Cmaj7"]]
  );
  assert.deepEqual(parsed.chords, ["Dm7", "G7", "Cmaj7"]);
});

test("preserves one or more chords per explicit bar", () => {
  const parsed = parsePlainTextChart("| Dm7 G7 | Cmaj7 |");
  assert.deepEqual(
    parsed.bars.map((bar) => bar.chords),
    [["Dm7", "G7"], ["Cmaj7"]]
  );
});

test("parses comma-separated chord text", () => {
  const parsed = parsePlainTextChart("Dm7, G7, Cmaj7");
  assert.deepEqual(parsed.chords, ["Dm7", "G7", "Cmaj7"]);
});

test("preserves real slash chords", () => {
  const parsed = parsePlainTextChart("| C/E | Fmaj7 | G7sus G7 | Cmaj7 |");
  assert.deepEqual(
    parsed.bars.map((bar) => bar.chords),
    [["C/E"], ["Fmaj7"], ["G7sus", "G7"], ["Cmaj7"]]
  );
});

test("supports slash-separated chord lists without breaking slash chords", () => {
  const parsed = parsePlainTextChart("Dm7 / G7 / Cmaj7 C/E");
  assert.deepEqual(parsed.chords, ["Dm7", "G7", "Cmaj7", "C/E"]);
});

test("returns warnings for unknown tokens", () => {
  const parsed = parsePlainTextChart("| Dm7 | H7 | Gbanana | Cmaj7 |");
  assert.deepEqual(parsed.chords, ["Dm7", "Cmaj7"]);
  assert.ok(parsed.warnings.some((warning) => warning.includes("H7")));
  assert.ok(parsed.warnings.some((warning) => warning.includes("Gbanana")));
});

test("plain-text ii-V-I analyses as C major", () => {
  const parsed = parsePlainTextChart("Dm7 G7 Cmaj7");
  const result = analyseProgression(parsed.chords);
  assert.equal(result.analysis[0].function, "ii-V-I");
  assert.equal(result.analysis[0].local_key, "C major");
});

test("plain-text minor iiø-V-i analyses as G minor", () => {
  const parsed = parsePlainTextChart("Am7b5 D7b9 Gm");
  const result = analyseProgression(parsed.chords);
  assert.equal(result.analysis[0].function, "iiø-V-i");
  assert.equal(result.analysis[0].local_key, "G minor");
});
