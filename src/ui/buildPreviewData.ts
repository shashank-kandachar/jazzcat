import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { manualTuneFixtures } from "../fixtures/manualChordFixtures.ts";
import { parseIrealHtml } from "../import/parseIrealHtml.ts";
import { createChartViewModel, type ChartViewModel } from "./chartViewModel.ts";
import { TRANSPOSITION_SHIFTS } from "./transposeControls.ts";

const projectRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

export interface BrowserDemoTuneData {
  slug: string;
  title: string;
  aliases: string[];
  models_by_shift: Record<string, ChartViewModel>;
}

export interface PreviewData {
  app: "JazzCat";
  version: "0.4.0";
  demo_tunes: BrowserDemoTuneData[];
}

function aliasKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export async function buildPreviewData(): Promise<PreviewData> {
  const demoTunes: BrowserDemoTuneData[] = [];

  for (const fixture of manualTuneFixtures) {
    const html = await readFile(join(projectRoot, "fixtures", `${fixture.slug}.html`), "utf8");
    const parsedIreal = parseIrealHtml(html);
    const modelsByShift: Record<string, ChartViewModel> = {};

    for (const shift of TRANSPOSITION_SHIFTS) {
      modelsByShift[String(shift)] = createChartViewModel(fixture, {
        transpose: shift,
        parsedIreal,
        sourceKind: "demo"
      });
    }

    demoTunes.push({
      slug: fixture.slug,
      title: fixture.title,
      aliases: [aliasKey(fixture.slug), aliasKey(fixture.title), aliasKey(parsedIreal.metadata.title ?? fixture.title)],
      models_by_shift: modelsByShift
    });
  }

  return {
    app: "JazzCat",
    version: "0.4.0",
    demo_tunes: demoTunes
  };
}

async function main(): Promise<void> {
  const data = await buildPreviewData();
  const outFile = join(projectRoot, "ui", "preview-data.js");
  await writeFile(outFile, `window.JAZZCAT_PREVIEW_DATA = ${JSON.stringify(data, null, 2)};\n`, "utf8");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
