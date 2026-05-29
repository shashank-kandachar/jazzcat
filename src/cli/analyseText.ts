import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { analyseProgression } from "../core/harmony/analyseProgression.ts";
import { buildGuitarTasksForAnalysis } from "../core/harmony/guitarTasks.ts";
import { buildKeyTrainerVersions } from "../core/practice/keyTrainer.ts";
import { buildPracticePack } from "../core/practice/buildPracticePack.ts";
import { parsePlainTextChart } from "../import/parsePlainTextChart.ts";

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) {
    throw new Error("Usage: npm run analyse:text -- <plain-text-chart.txt>");
  }

  const text = await readFile(file, "utf8");
  const parsed = parsePlainTextChart(text);
  const analysed = analyseProgression(parsed.chords);
  const selectedRegion = analysed.regions[0] ?? null;
  const selectedAnalysis = analysed.analysis[0] ?? null;
  const selectedPractice = analysed.practice_objects[0] ?? null;
  const guitarTasks = buildGuitarTasksForAnalysis(selectedAnalysis, selectedRegion);

  const output = {
    app: "JazzCat",
    version: "0.3.0",
    source: {
      type: "plain_text",
      filename: basename(file)
    },
    parsed,
    regions: analysed.regions,
    analysis: analysed.analysis,
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
              title: basename(file),
              declared_key: null,
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
        version: "0.3.0",
        error: message,
        warnings: ["Plain-text CLI failed before analysis completed."]
      },
      null,
      2
    )}\n`
  );
  process.exitCode = 1;
});
