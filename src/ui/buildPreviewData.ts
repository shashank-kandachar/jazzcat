import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyseProgression } from "../core/harmony/analyseProgression.ts";
import { manualTuneFixtures } from "../fixtures/manualChordFixtures.ts";
import { parseIrealHtml } from "../import/parseIrealHtml.ts";

const projectRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

export interface PreviewTune {
  slug: string;
  title: string;
  declared_key: string;
  style: string;
  expected_regions: string[];
  ireal: {
    raw_url_present: boolean;
    raw_payload_preserved: boolean;
    decoded_payload_prefix: string;
    chord_body_length: number;
  };
  chords: Array<{
    bar: number;
    symbol: string;
    root: string;
    quality: string;
    extensions: string[];
    bass: string | null;
  }>;
  regions: ReturnType<typeof analyseProgression>["regions"];
  analysis: ReturnType<typeof analyseProgression>["analysis"];
  practice_objects: ReturnType<typeof analyseProgression>["practice_objects"];
  warnings: string[];
}

export interface PreviewData {
  app: "JazzCat";
  version: "0.1.0";
  tunes: PreviewTune[];
}

export async function buildPreviewData(): Promise<PreviewData> {
  const tunes: PreviewTune[] = [];

  for (const fixture of manualTuneFixtures) {
    const html = await readFile(join(projectRoot, "fixtures", `${fixture.slug}.html`), "utf8");
    const ireal = parseIrealHtml(html);
    const analysed = analyseProgression(fixture.chords);

    tunes.push({
      slug: fixture.slug,
      title: fixture.title,
      declared_key: fixture.declared_key,
      style: fixture.style,
      expected_regions: fixture.expected_regions,
      ireal: {
        raw_url_present: Boolean(ireal.raw_url),
        raw_payload_preserved: Boolean(ireal.raw_decoded_payload),
        decoded_payload_prefix: ireal.raw_decoded_payload.slice(0, 180),
        chord_body_length: ireal.decoded_chord_body_payload?.length ?? 0
      },
      chords: analysed.chords.map((chord) => ({
        bar: chord.bar,
        symbol: chord.parsed.symbol,
        root: chord.parsed.root,
        quality: chord.parsed.quality,
        extensions: chord.parsed.extensions,
        bass: chord.parsed.bass
      })),
      regions: analysed.regions,
      analysis: analysed.analysis,
      practice_objects: analysed.practice_objects,
      warnings: [...ireal.warnings, ...analysed.warnings]
    });
  }

  return {
    app: "JazzCat",
    version: "0.1.0",
    tunes
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
