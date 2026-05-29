import type { IrealMetadata, ParsedIrealPayload } from "../import/parseIrealMetadata.ts";
import type { HarmonyAnalysis, PracticeObject, SemanticRegion } from "../core/types.ts";
import { analyseProgression } from "../core/harmony/analyseProgression.ts";
import { preferFlatNames } from "../core/harmony/intervals.ts";
import { transposeChart } from "../core/chord/transposeChord.ts";
import type { ManualTuneFixture } from "../fixtures/manualChordFixtures.ts";
import { formatTransposeShift, wrapTransposeShift } from "./transposeControls.ts";

export interface UiChordViewModel {
  bar: number;
  symbol: string;
  root: string;
  quality: string;
  extensions: string[];
  bass: string | null;
  region_id: string | null;
  colour_role: string | null;
}

export interface UiIrealPayloadViewModel {
  raw_url: string;
  raw_decoded_payload: string;
  decoded_payload_prefix: string;
  encoded_chord_body_payload: string | null;
  decoded_chord_body_payload: string | null;
  chord_body_length: number;
  raw_url_present: boolean;
  raw_payload_preserved: boolean;
}

export interface ChartViewModel {
  id: string;
  source_kind: "demo" | "pasted_ireal" | "uploaded_html" | "unknown_ireal";
  title: string;
  composer: string | null;
  declared_key: string | null;
  style: string | null;
  tempo: number | null;
  current_transposition_shift: number;
  current_transposition_label: string;
  expected_regions: string[];
  chords: UiChordViewModel[];
  regions: SemanticRegion[];
  analysis: HarmonyAnalysis[];
  practice_objects: PracticeObject[];
  ireal: UiIrealPayloadViewModel;
  warnings: string[];
}

export interface ChartViewModelOptions {
  transpose?: number;
  parsedIreal?: ParsedIrealPayload | null;
  sourceKind?: ChartViewModel["source_kind"];
  warnings?: string[];
}

export function payloadViewModel(parsedIreal: ParsedIrealPayload | null | undefined): UiIrealPayloadViewModel {
  const decodedBody = parsedIreal?.decoded_chord_body_payload ?? null;
  const rawDecoded = parsedIreal?.raw_decoded_payload ?? "";

  return {
    raw_url: parsedIreal?.raw_url ?? "",
    raw_decoded_payload: rawDecoded,
    decoded_payload_prefix: rawDecoded.slice(0, 260),
    encoded_chord_body_payload: parsedIreal?.encoded_chord_body_payload ?? null,
    decoded_chord_body_payload: decodedBody,
    chord_body_length: decodedBody?.length ?? 0,
    raw_url_present: Boolean(parsedIreal?.raw_url),
    raw_payload_preserved: Boolean(rawDecoded)
  };
}

function regionForBar(regions: SemanticRegion[], bar: number): SemanticRegion | null {
  return regions.find((region) => bar >= region.start_bar && bar <= region.end_bar) ?? null;
}

function metadataKey(metadata: IrealMetadata | undefined, fallback: ManualTuneFixture): string | null {
  return metadata?.declared_key ?? fallback.declared_key ?? null;
}

export function createChartViewModel(fixture: ManualTuneFixture, options: ChartViewModelOptions = {}): ChartViewModel {
  const shift = wrapTransposeShift(options.transpose ?? 0);
  const metadata = options.parsedIreal?.metadata;
  const preferFlats = preferFlatNames(metadataKey(metadata, fixture), fixture.declared_key, ...fixture.chords);
  const shiftedChords = shift === 0 ? fixture.chords : transposeChart(fixture.chords, shift, { preferFlats });
  const analysed = analyseProgression(shiftedChords);

  return {
    id: fixture.slug,
    source_kind: options.sourceKind ?? "demo",
    title: metadata?.title ?? fixture.title,
    composer: metadata?.composer ?? null,
    declared_key: metadata?.declared_key ?? fixture.declared_key,
    style: metadata?.style ?? fixture.style,
    tempo: metadata?.tempo ?? null,
    current_transposition_shift: shift,
    current_transposition_label: formatTransposeShift(shift),
    expected_regions: fixture.expected_regions,
    chords: analysed.chords.map((chord) => {
      const region = regionForBar(analysed.regions, chord.bar);
      return {
        bar: chord.bar,
        symbol: chord.parsed.symbol,
        root: chord.parsed.root,
        quality: chord.parsed.quality,
        extensions: chord.parsed.extensions,
        bass: chord.parsed.bass,
        region_id: region?.region_id ?? null,
        colour_role: region?.colour_role ?? null
      };
    }),
    regions: analysed.regions,
    analysis: analysed.analysis,
    practice_objects: analysed.practice_objects,
    ireal: payloadViewModel(options.parsedIreal),
    warnings: [...(options.warnings ?? []), ...analysed.warnings]
  };
}

export function createUnknownImportViewModel(
  parsedIreal: ParsedIrealPayload,
  sourceKind: "pasted_ireal" | "uploaded_html",
  warnings: string[] = []
): ChartViewModel {
  const metadata = parsedIreal.metadata;
  const warningSet = new Set([
    ...warnings,
    "Chord body preserved, but this chart does not yet have a decoded chord fixture.",
    `Source accepted as ${sourceKind}.`
  ]);

  return {
    id: "unknown-ireal-chart",
    source_kind: "unknown_ireal",
    title: metadata.title ?? "Unknown iReal Chart",
    composer: metadata.composer ?? null,
    declared_key: metadata.declared_key ?? null,
    style: metadata.style ?? null,
    tempo: metadata.tempo ?? null,
    current_transposition_shift: 0,
    current_transposition_label: "0",
    expected_regions: [],
    chords: [],
    regions: [],
    analysis: [],
    practice_objects: [],
    ireal: payloadViewModel(parsedIreal),
    warnings: [...warningSet]
  };
}
