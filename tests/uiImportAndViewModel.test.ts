import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createChartViewModel, createPlainTextChartViewModel } from "../src/ui/chartViewModel.ts";
import { createImportedChartViewModel, extractBrowserIrealLink, parseBrowserChartInput } from "../src/ui/importController.ts";
import { createPracticeCardForRegion, REGION_ROLE_CLASSES } from "../src/ui/regionViewModel.ts";
import type { ManualTuneFixture } from "../src/fixtures/manualChordFixtures.ts";

test("pasted iReal metadata for Autumn Leaves matches the manual fixture", async () => {
  const html = await readFile(new URL("../fixtures/autumn-leaves.html", import.meta.url), "utf8");
  const link = extractBrowserIrealLink(html);
  assert.ok(link);

  const result = parseBrowserChartInput({ kind: "ireal_link", value: link });
  assert.equal(result.parsed.metadata.title, "Autumn Leaves");
  assert.equal(result.fixture?.slug, "autumn-leaves");

  const model = createImportedChartViewModel({ kind: "ireal_link", value: link });
  assert.equal(model.title, "Autumn Leaves");
  assert.ok(model.chords.length > 0);
  assert.ok(model.regions.some((region) => region.local_key === "Bb major"));
});

test("uploaded iReal HTML for Autumn Leaves matches the manual fixture", async () => {
  const html = await readFile(new URL("../fixtures/autumn-leaves.html", import.meta.url), "utf8");
  const result = parseBrowserChartInput({ kind: "ireal_html", value: html });
  assert.equal(result.parsed.metadata.title, "Autumn Leaves");
  assert.equal(result.fixture?.slug, "autumn-leaves");
});

test("unknown iReal title preserves payload and returns a warning instead of crashing", () => {
  const link = "irealb://Mystery%20Tune=Example%20Composer==Medium%20Swing=C==abc123unknownbody=Jazz=120=0";
  const model = createImportedChartViewModel({ kind: "ireal_link", value: link });

  assert.equal(model.title, "Mystery Tune");
  assert.equal(model.chords.length, 0);
  assert.ok(model.ireal.raw_payload_preserved);
  assert.ok(model.warnings.some((warning) => warning.includes("does not yet have a decoded chord fixture")));
});

test("browser-safe import helpers extract HTML links and accept direct irealb links", async () => {
  const html = await readFile(new URL("../fixtures/blue-bossa.html", import.meta.url), "utf8");
  const extracted = extractBrowserIrealLink(html);
  assert.ok(extracted?.startsWith("irealb://Blue%20Bossa"));

  const direct = "irealb://Blue%20Bossa=Dorham%20Kenny==Bossa%20Nova=C-==body=Jazz=140=0";
  assert.equal(extractBrowserIrealLink(direct), direct);
});

test("transposed UI model shifts Dm7 G7 Cmaj7 up two semitones and keeps ii-V-I analysis", () => {
  const fixture: ManualTuneFixture = {
    slug: "unit-major-two-five",
    title: "Unit Major ii-V-I",
    declared_key: "C major",
    style: "Test",
    chords: ["Dm7", "G7", "Cmaj7"],
    expected_regions: []
  };

  const model = createChartViewModel(fixture, { transpose: 2 });
  assert.deepEqual(
    model.chords.map((chord) => chord.symbol),
    ["Em7", "A7", "Dmaj7"]
  );
  assert.equal(model.analysis[0].function, "ii-V-I");
  assert.equal(model.analysis[0].local_key, "D major");
});

test("region view model keeps semantic role labels as CSS classes", () => {
  const fixture: ManualTuneFixture = {
    slug: "unit-major-two-five",
    title: "Unit Major ii-V-I",
    declared_key: "C major",
    style: "Test",
    chords: ["Dm7", "G7", "Cmaj7"],
    expected_regions: []
  };

  const model = createChartViewModel(fixture);
  assert.ok(model.regions.every((region) => region.colour_role));
  assert.doesNotMatch(JSON.stringify(REGION_ROLE_CLASSES), /#|rgb|hsl/i);
});

test("selected ii-V region produces a practice card", () => {
  const fixture: ManualTuneFixture = {
    slug: "unit-major-two-five",
    title: "Unit Major ii-V-I",
    declared_key: "C major",
    style: "Test",
    chords: ["Dm7", "G7", "Cmaj7"],
    expected_regions: []
  };

  const model = createChartViewModel(fixture);
  const card = createPracticeCardForRegion(model, 0);
  assert.ok(card);
  assert.equal(card.think_v, "G7");
  assert.equal(card.resolve_to, "Cmaj7");
  assert.ok(card.drills.length > 0);
});

test("plain-text UI model preserves bars with multiple chords", () => {
  const model = createPlainTextChartViewModel("| Dm7 G7 | Cmaj7 |", {
    title: "Practice ii-V-I",
    declaredKey: "C major"
  });

  assert.equal(model.source_kind, "plain_text");
  assert.deepEqual(
    model.bars.map((bar) => bar.chords.map((chord) => chord.symbol)),
    [["Dm7", "G7"], ["Cmaj7"]]
  );
  assert.equal(model.analysis[0].function, "ii-V-I");
  assert.equal(model.regions[0].start_bar, 1);
  assert.equal(model.regions[0].end_bar, 2);
});

test("plain-text UI model carries metadata and chart sections", () => {
  const model = createPlainTextChartViewModel(`
Title: Sectioned Study
Composer: Test Writer
Key: F major
Form: AABA
A:
| Gm7 C7 | Fmaj7 |
Bridge:
| Am7 D7 | Gm7 C7 |
`);

  assert.equal(model.title, "Sectioned Study");
  assert.equal(model.composer, "Test Writer");
  assert.equal(model.declared_key, "F major");
  assert.equal(model.form, "AABA");
  assert.deepEqual(
    model.sections.map((section) => [section.label, section.start_bar, section.end_bar]),
    [
      ["A", 1, 2],
      ["Bridge", 3, 4]
    ]
  );
  assert.deepEqual(
    model.bars.map((bar) => bar.section_label),
    ["A", "A", "Bridge", "Bridge"]
  );
});
