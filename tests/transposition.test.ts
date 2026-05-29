import test from "node:test";
import assert from "node:assert/strict";
import { analyseProgression, transposeChart, transposeChartToKey } from "../src/index.ts";

test("transposes a major ii-V-I up two semitones", () => {
  assert.deepEqual(transposeChart(["Dm7", "G7", "Cmaj7"], 2), ["Em7", "A7", "Dmaj7"]);
});

test("transposes a minor ii-V-i into Bb minor", () => {
  assert.deepEqual(transposeChartToKey(["Am7b5", "D7b9", "Gm"], "G minor", "Bb minor"), [
    "Cm7b5",
    "F7(b9)",
    "Bbm"
  ]);
});

test("analysis survives transposition", () => {
  const major = analyseProgression(transposeChart(["Dm7", "G7", "Cmaj7"], 2));
  assert.equal(major.analysis[0].function, "ii-V-I");
  assert.equal(major.analysis[0].local_key, "D major");

  const minor = analyseProgression(transposeChartToKey(["Am7b5", "D7b9", "Gm"], "G minor", "Bb minor"));
  assert.equal(minor.analysis[0].function, "iiø-V-i");
  assert.equal(minor.analysis[0].local_key, "Bb minor");
});
