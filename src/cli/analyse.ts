import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { analyseProgression } from "../core/harmony/analyseProgression.ts";
import { transposeChart, transposeChartToKey } from "../core/chord/transposeChord.ts";
import { findManualFixture } from "../fixtures/manualChordFixtures.ts";
import { extractIrealLink, parseIrealHtml, parseIrealMetadata } from "../import/index.ts";

interface CliOptions {
  input: string;
  transpose?: number;
  toKey?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const args = [...argv];
  const input = args.shift();
  if (!input) {
    throw new Error("Usage: npm run analyse -- <file.html|irealb://...> [--transpose N] [--to-key KEY]");
  }

  const options: CliOptions = { input };
  while (args.length > 0) {
    const arg = args.shift();
    if (arg === "--transpose") {
      options.transpose = Number(args.shift());
    } else if (arg === "--to-key") {
      options.toKey = args.shift();
    }
  }

  return options;
}

async function loadInput(input: string): Promise<{
  source: { type: "ireal_html" | "ireal_link"; filename?: string };
  parsed: ReturnType<typeof parseIrealHtml>;
}> {
  if (input.startsWith("irealb://")) {
    return {
      source: { type: "ireal_link" },
      parsed: { ...parseIrealMetadata(input), warnings: [] }
    };
  }

  const html = await readFile(input, "utf8");
  const parsed = parseIrealHtml(html);
  const directLink = extractIrealLink(html);
  return {
    source: { type: directLink ? "ireal_html" : "ireal_html", filename: basename(input) },
    parsed
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const loaded = await loadInput(options.input);
  const fixture = findManualFixture(loaded.parsed.metadata.title ?? loaded.source.filename);
  const warnings = [...loaded.parsed.warnings];

  if (!fixture) {
    warnings.push("No manual chord-array fixture matched this chart; harmony analysis is empty until the iReal chord body is decoded.");
  }

  let chordSymbols = fixture?.chords ?? [];
  const transposition = {
    applied: false,
    semitones: 0,
    source_key: fixture?.declared_key ?? loaded.parsed.metadata.declared_key,
    target_key: null as string | null
  };

  if (typeof options.transpose === "number" && Number.isFinite(options.transpose)) {
    chordSymbols = transposeChart(chordSymbols, options.transpose);
    transposition.applied = true;
    transposition.semitones = options.transpose;
  }

  if (options.toKey && transposition.source_key) {
    chordSymbols = transposeChartToKey(chordSymbols, transposition.source_key, options.toKey);
    transposition.applied = true;
    transposition.target_key = options.toKey;
  }

  const analysed = analyseProgression(chordSymbols);
  const output = {
    app: "JazzCat",
    version: "0.3.0",
    source: loaded.source,
    metadata: {
      ...loaded.parsed.metadata,
      title: loaded.parsed.metadata.title ?? fixture?.title ?? null,
      declared_key: loaded.parsed.metadata.declared_key ?? fixture?.declared_key ?? null,
      style: loaded.parsed.metadata.style ?? fixture?.style ?? null
    },
    ireal: {
      raw_url: loaded.parsed.raw_url,
      raw_decoded_payload: loaded.parsed.raw_decoded_payload,
      encoded_chord_body_payload: loaded.parsed.encoded_chord_body_payload,
      decoded_chord_body_payload: loaded.parsed.decoded_chord_body_payload
    },
    manual_fixture: {
      used: Boolean(fixture),
      title: fixture?.title ?? null,
      expected_regions: fixture?.expected_regions ?? []
    },
    transposition,
    chords: analysed.chords.map((chord) => ({
      bar: chord.bar,
      raw: chord.raw,
      normalised: chord.parsed.symbol,
      root: chord.parsed.root,
      quality: chord.parsed.quality,
      extensions: chord.parsed.extensions,
      bass: chord.parsed.bass
    })),
    regions: analysed.regions,
    analysis: analysed.analysis,
    practice_objects: analysed.practice_objects,
    warnings: [...warnings, ...analysed.warnings]
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
        warnings: ["CLI failed before analysis completed."]
      },
      null,
      2
    )}\n`
  );
  process.exitCode = 1;
});
