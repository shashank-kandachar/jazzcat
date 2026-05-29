import test from "node:test";
import assert from "node:assert/strict";
import { buildPreviewData } from "../src/ui/buildPreviewData.ts";

test("builds preview data for all five benchmark tunes", async () => {
  const data = await buildPreviewData();
  assert.equal(data.app, "JazzCat");
  assert.equal(data.version, "0.1.0");
  assert.equal(data.tunes.length, 5);
  assert.ok(data.tunes.every((tune) => tune.chords.length > 0));
  assert.ok(data.tunes.every((tune) => tune.regions.length > 0));
  assert.ok(data.tunes.every((tune) => tune.ireal.raw_payload_preserved));
});
