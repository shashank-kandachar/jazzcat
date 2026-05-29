import test from "node:test";
import assert from "node:assert/strict";
import { analyseProgression, buildPracticePack, serialisePracticePack } from "../src/index.ts";

test("selected ii-V-I builds valid jazzcat-practice-pack-v1 JSON", () => {
  const result = analyseProgression(["Dm7", "G7", "Cmaj7"]);
  const pack = buildPracticePack({
    source: {
      type: "plain_text",
      title: "Unit ii-V-I",
      declared_key: "C major",
      transposition_shift: 0
    },
    region: result.regions[0],
    analysis: result.analysis[0],
    practiceObject: result.practice_objects[0],
    keyTrainerMode: "cycle_of_fourths"
  });

  assert.equal(pack.schema, "jazzcat-practice-pack-v1");
  assert.equal(pack.source.type, "plain_text");
  assert.equal(pack.selected_region.local_key, "C major");
  assert.equal(pack.practice_focus.think_v, "G7");
  assert.ok(pack.practice_focus.guitar_tasks.length > 0);
  assert.equal(pack.key_trainer.mode, "cycle_of_fourths");
  assert.equal(pack.key_trainer.versions.length, 4);
});

test("practice pack serialises to valid JSON", () => {
  const result = analyseProgression(["Dm7", "G7", "Cmaj7"]);
  const pack = buildPracticePack({
    source: {
      type: "plain_text",
      title: "Unit ii-V-I",
      declared_key: "C major",
      transposition_shift: 0
    },
    region: result.regions[0],
    analysis: result.analysis[0],
    practiceObject: result.practice_objects[0]
  });

  const parsed = JSON.parse(serialisePracticePack(pack));
  assert.equal(parsed.schema, "jazzcat-practice-pack-v1");
  assert.ok(parsed.source);
  assert.ok(parsed.selected_region);
  assert.ok(parsed.practice_focus);
  assert.ok(parsed.key_trainer);
});
