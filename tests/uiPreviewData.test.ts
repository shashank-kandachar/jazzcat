import test from "node:test";
import assert from "node:assert/strict";
import { buildPreviewData } from "../src/ui/buildPreviewData.ts";

test("builds preview data for all five benchmark tunes", async () => {
  const data = await buildPreviewData();
  assert.equal(data.app, "JazzCat");
  assert.equal(data.version, "0.4.0");
  assert.equal(data.demo_tunes.length, 5);
  assert.ok(data.demo_tunes.every((tune) => tune.models_by_shift["0"].chords.length > 0));
  assert.ok(data.demo_tunes.every((tune) => tune.models_by_shift["0"].regions.length > 0));
  assert.ok(data.demo_tunes.every((tune) => tune.models_by_shift["0"].ireal.raw_payload_preserved));
  assert.ok(data.demo_tunes.every((tune) => tune.models_by_shift["2"]));
});
