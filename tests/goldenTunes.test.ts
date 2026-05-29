import test from "node:test";
import assert from "node:assert/strict";
import { analyseProgression, manualTuneFixtures } from "../src/index.ts";

function localKeysFor(title: string): string[] {
  const fixture = manualTuneFixtures.find((item) => item.title === title);
  assert.ok(fixture, `Missing fixture: ${title}`);
  return analyseProgression(fixture.chords).analysis.map((item) => item.local_key);
}

test("Autumn Leaves identifies expected broad regions", () => {
  const keys = localKeysFor("Autumn Leaves");
  assert.ok(keys.includes("Bb major"));
  assert.ok(keys.includes("G minor"));
  assert.ok(keys.includes("E minor"));
});

test("Tune Up identifies moving ii-V-I chains", () => {
  const keys = localKeysFor("Tune Up");
  assert.ok(keys.includes("D major"));
  assert.ok(keys.includes("C major"));
  assert.ok(keys.includes("Bb major"));
});

test("Blue Bossa identifies minor home and major excursion", () => {
  const keys = localKeysFor("Blue Bossa");
  assert.ok(keys.includes("C minor"));
  assert.ok(keys.includes("Db major"));
});

test("Solar keeps ambiguous material low confidence while finding useful cadences", () => {
  const fixture = manualTuneFixtures.find((item) => item.title === "Solar");
  assert.ok(fixture);
  const result = analyseProgression(fixture.chords);
  assert.ok(result.analysis.some((item) => item.function === "ambiguous-region" && item.confidence === "low"));
  assert.ok(result.analysis.some((item) => item.local_key === "F major"));
});

test("All The Things You Are catches obvious local cadence regions without forcing certainty", () => {
  const fixture = manualTuneFixtures.find((item) => item.title === "All The Things You Are");
  assert.ok(fixture);
  const result = analyseProgression(fixture.chords);
  const keys = result.analysis.map((item) => item.local_key);
  assert.ok(keys.includes("Ab major"));
  assert.ok(keys.includes("C major"));
  assert.ok(keys.includes("Eb major"));
  assert.ok(result.analysis.some((item) => item.confidence !== "high"));
});
