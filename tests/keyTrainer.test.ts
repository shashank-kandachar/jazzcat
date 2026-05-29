import test from "node:test";
import assert from "node:assert/strict";
import { buildKeyTrainerVersions } from "../src/index.ts";

test("cycle of fourths transposes Dm7 G7 Cmaj7 through four useful keys", () => {
  const versions = buildKeyTrainerVersions(["Dm7", "G7", "Cmaj7"], "cycle_of_fourths");

  assert.deepEqual(
    versions.map((version) => version.chords),
    [
      ["Gm7", "C7", "Fmaj7"],
      ["Cm7", "F7", "Bbmaj7"],
      ["Fm7", "Bb7", "Ebmaj7"],
      ["Bbm7", "Eb7", "Abmaj7"]
    ]
  );
});

test("transposed key trainer versions are re-analysed", () => {
  const versions = buildKeyTrainerVersions(["Dm7", "G7", "Cmaj7"], "up_whole_step");
  assert.equal(versions[0].local_key, "D major");
  assert.equal(versions[0].function, "ii-V-I");
  assert.equal(versions[0].think_v, "A7");
  assert.equal(versions[0].resolve_to, "Dmaj7");
});

test("random mode returns exactly three non-duplicate versions where practical", () => {
  const versions = buildKeyTrainerVersions(["Dm7", "G7", "Cmaj7"], "random_3_keys", {
    randomShifts: [2, 2, 5, -3, 14]
  });
  assert.equal(versions.length, 3);
  assert.equal(new Set(versions.map((version) => version.semitone_shift % 12)).size, 3);
});
