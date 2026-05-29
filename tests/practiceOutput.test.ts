import test from "node:test";
import assert from "node:assert/strict";
import { analyseProgression } from "../src/index.ts";

test("semantic colour roles are labels, not hard-coded colour values", () => {
  const result = analyseProgression(["Dm7", "G7", "Cmaj7"]);
  assert.equal(result.regions[0].colour_role, "major-key-region");
  assert.doesNotMatch(result.regions[0].colour_role, /^#|rgb|hsl/i);
});

test("practice-ready JSON is produced for ii-V spans", () => {
  const result = analyseProgression(["Dm7", "G7", "Cmaj7"]);
  assert.equal(result.practice_objects.length, 1);
  assert.equal(result.practice_objects[0].think_v, "G7");
  assert.equal(result.practice_objects[0].resolve_to, "Cmaj7");
  assert.ok(result.practice_objects[0].inside_scale.includes("G"));
});
