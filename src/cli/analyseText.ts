import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { analyseProgression } from "../core/harmony/analyseProgression.ts";
import { buildGuitarTasksForAnalysis } from "../core/harmony/guitarTasks.ts";
import { buildKeyTrainerVersions } from "../core/practice/keyTrainer.ts";
import { buildPracticePack } from "../core/practice/buildPracticePack.ts";
import { parsePlainTextChart, type PlainTextChart } from "../import/parsePlainTextChart.ts";

function sequenceToBarNumbers(parsed: PlainTextChart): Map<number, number> {
  const sequenceToBar = new Map<number, number>();
  let cursor = 0;
  parsed.bars.forEach((bar) => {
    bar.chords.forEach(() => {
      cursor += 1;
      sequenceToBar.set(cursor, bar.bar);
    });
  });
  return sequenceToBar;
}

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) {
    throw new Error("Usage: npm run analyse:text -- <plain-text-chart.txt>");
  }

  const text = await readFile(file, "utf8");
  const parsed = parsePlainTextChart(text);
  const analysed = analyseProgression(parsed.chords);
  const sequenceToBar = sequenceToBarNumbers(parsed);
  const remappedAnalysis = analysed.analysis.map((item) => ({
    ...item,
    span: {
      start_bar: sequenceToBar.get(item.span.start_bar) ?? item.span.start_bar,
      end_bar: sequenceToBar.get(item.span.end_bar) ?? item.span.end_bar
    }
  }));
  const remappedRegions = analysed.regions.map((region) => ({
    ...region,
    start_bar: sequenceToBar.get(region.start_bar) ?? region.start_bar,
    end_bar: sequenceToBar.get(region.end_bar) ?? region.end_bar
  }));
  const selectedRegion = remappedRegions[0] ?? null;
  const selectedAnalysis = remappedAnalysis[0] ?? null;
  const selectedPractice = analysed.practice_objects[0] ?? null;
  const guitarTasks = buildGuitarTasksForAnalysis(selectedAnalysis, selectedRegion);

  const output = {
    app: "JazzCat",
    version: "0.4.0",
    source: {
      type: "plain_text",
      filename: basename(file),
      title: parsed.metadata.title ?? basename(file),
      declared_key: parsed.metadata.declared_key,
      form: parsed.metadata.form
    },
    parsed,
    regions: remappedRegions,
    analysis: remappedAnalysis,
    practice_objects: analysed.practice_objects,
    guitar_tasks: guitarTasks,
    key_trainer: selectedAnalysis
      ? {
          mode: "cycle_of_fourths",
          versions: buildKeyTrainerVersions(selectedAnalysis.chords, "cycle_of_fourths")
        }
      : null,
    practice_pack:
      selectedRegion && selectedAnalysis
        ? buildPracticePack({
            source: {
              type: "plain_text",
              title: parsed.metadata.title ?? basename(file),
              declared_key: parsed.metadata.declared_key,
              transposition_shift: 0
            },
            region: selectedRegion,
            analysis: selectedAnalysis,
            practiceObject: selectedPractice,
            keyTrainerMode: "cycle_of_fourths",
            guitarTasks
          })
        : null,
    warnings: [...parsed.warnings, ...analysed.warnings]
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stdout.write(
    `${JSON.stringify(
      {
        app: "JazzCat",
        version: "0.4.0",
        error: message,
        warnings: ["Plain-text CLI failed before analysis completed."]
      },
      null,
      2
    )}\n`
  );
  process.exitCode = 1;
});
