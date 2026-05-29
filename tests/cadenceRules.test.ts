import test from "node:test";
import assert from "node:assert/strict";
import { analyseProgression } from "../src/index.ts";

test("detects major ii-V-I", () => {
  const result = analyseProgression(["Dm7", "G7", "Cmaj7"]);
  assert.equal(result.analysis[0].local_key, "C major");
  assert.equal(result.analysis[0].function, "ii-V-I");
});

test("detects minor iiø-V-i", () => {
  const result = analyseProgression(["Am7b5", "D7b9", "Gm"]);
  assert.equal(result.analysis[0].local_key, "G minor");
  assert.equal(result.analysis[0].function, "iiø-V-i");
});

test("detects V-I and V-i", () => {
  assert.equal(analyseProgression(["G7", "Cmaj7"]).analysis[0].function, "V-I");
  assert.equal(analyseProgression(["G7", "Cm"]).analysis[0].function, "V-i");
});

test("detects tritone substitution", () => {
  const result = analyseProgression(["Db7", "Cmaj7"]);
  assert.equal(result.analysis[0].local_key, "C major");
  assert.equal(result.analysis[0].function, "tritone sub for V7 resolving to I");
});

test("detects backdoor ii-V", () => {
  const result = analyseProgression(["Fm7", "Bb7", "Cmaj7"]);
  assert.equal(result.analysis[0].local_key, "C major");
  assert.equal(result.analysis[0].function, "backdoor ii-V to I");
});

test("detects secondary dominant into a temporary minor target", () => {
  const result = analyseProgression(["A7", "Dm7"]);
  assert.equal(result.analysis[0].local_key, "D minor");
  assert.equal(result.analysis[0].function, "secondary dominant");
});
