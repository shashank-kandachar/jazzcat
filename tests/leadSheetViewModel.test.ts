import test from "node:test";
import assert from "node:assert/strict";
import { createPlainTextChartViewModel } from "../src/ui/chartViewModel.ts";
import { createLeadSheetMeasures } from "../src/ui/leadSheetViewModel.ts";

test("repeated full-bar harmony renders as repeat symbols", () => {
  const model = createPlainTextChartViewModel("| Cmaj7 | Cmaj7 | Cmaj7 | Cmaj7 |");
  const measures = createLeadSheetMeasures(model.bars);

  assert.deepEqual(
    measures.map((measure) => [measure.display_kind, measure.display_symbols, measure.marker]),
    [
      ["chords", ["C△7"], null],
      ["repeat-previous-bar", [], "%"],
      ["repeat-previous-bar", [], "%"],
      ["repeat-previous-bar", [], "%"]
    ]
  );
});

test("held slash and percent input remain musically meaningful", () => {
  const model = createPlainTextChartViewModel("| Dm7 | / | % | G7 |");
  const measures = createLeadSheetMeasures(model.bars);

  assert.deepEqual(
    measures.map((measure) => measure.marker),
    [null, "/", "%", null]
  );
});

test("multi-chord bars stay inside one musical measure", () => {
  const model = createPlainTextChartViewModel("| Dm7 G7 | Cmaj7 |");
  const measures = createLeadSheetMeasures(model.bars);

  assert.equal(measures.length, 2);
  assert.deepEqual(measures[0].display_symbols, ["D-7", "G7"]);
  assert.equal(measures[0].chord_count, 2);
  assert.equal(model.regions[0].start_bar, 1);
  assert.equal(model.regions[0].end_bar, 2);
});
