import type { IrealMetadata, ParsedIrealPayload } from "../import/parseIrealMetadata.ts";
import type { HarmonyAnalysis, PracticeObject, SemanticRegion } from "../core/types.ts";
import type { ChartSection } from "../core/tuneStudyTypes.ts";
import { jazzChordDisplay } from "../core/chordDisplay.ts";
import { analyseProgression } from "../core/harmony/analyseProgression.ts";
import { preferFlatNames } from "../core/harmony/intervals.ts";
import { transposeChart } from "../core/chord/transposeChord.ts";
import type { ManualTuneFixture } from "../fixtures/manualChordFixtures.ts";
import type { PlainTextChart } from "../import/parsePlainTextChart.ts";
import { parsePlainTextChart } from "../import/parsePlainTextChart.ts";
import { formatTransposeShift, wrapTransposeShift } from "./transposeControls.ts";

export interface UiChordViewModel {
  bar: number;
  sequence_index: number;
  symbol: string;
  display_symbol: string;
  root: string;
  quality: string;
  extensions: string[];
  bass: string | null;
  region_id: string | null;
  colour_role: string | null;
}

export interface UiBarViewModel {
  bar: number;
  chords: UiChordViewModel[];
  region_ids: string[];
  colour_role: string | null;
  section_id: string | null;
  section_label: string | null;
  raw: string | null;
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
  source_kind: "demo" | "pasted_ireal" | "uploaded_html" | "unknown_ireal" | "plain_text";
  title: string;
  composer: string | null;
  declared_key: string | null;
  form: string | null;
  style: string | null;
  tempo: number | null;
  current_transposition_shift: number;
  current_transposition_label: string;
  expected_regions: string[];
  sections: ChartSection[];
  bars: UiBarViewModel[];
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

function regionForSequence(regions: SemanticRegion[], sequenceIndex: number): SemanticRegion | null {
  return regions.find((region) => sequenceIndex >= region.start_bar && sequenceIndex <= region.end_bar) ?? null;
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
  const chords = analysed.chords.map((chord) => {
    const region = regionForBar(analysed.regions, chord.bar);
    return {
      bar: chord.bar,
      sequence_index: chord.bar,
      symbol: chord.parsed.symbol,
      display_symbol: jazzChordDisplay(chord.parsed.symbol),
      root: chord.parsed.root,
      quality: chord.parsed.quality,
      extensions: chord.parsed.extensions,
      bass: chord.parsed.bass,
      region_id: region?.region_id ?? null,
      colour_role: region?.colour_role ?? null
    };
  });

  return {
    id: fixture.slug,
    source_kind: options.sourceKind ?? "demo",
    title: metadata?.title ?? fixture.title,
    composer: metadata?.composer ?? null,
    declared_key: metadata?.declared_key ?? fixture.declared_key,
    style: metadata?.style ?? fixture.style,
    form: null,
    tempo: metadata?.tempo ?? null,
    current_transposition_shift: shift,
    current_transposition_label: formatTransposeShift(shift),
    expected_regions: fixture.expected_regions,
    sections: [],
    bars: chords.map((chord) => ({
      bar: chord.bar,
      chords: [chord],
      region_ids: chord.region_id ? [chord.region_id] : [],
      colour_role: chord.colour_role,
      section_id: null,
      section_label: null,
      raw: chord.symbol
    })),
    chords,
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
    form: null,
    style: metadata.style ?? null,
    tempo: metadata.tempo ?? null,
    current_transposition_shift: 0,
    current_transposition_label: "0",
    expected_regions: [],
    sections: [],
    bars: [],
    chords: [],
    regions: [],
    analysis: [],
    practice_objects: [],
    ireal: payloadViewModel(parsedIreal),
    warnings: [...warningSet]
  };
}

function splitShiftedChordsIntoBars(parsedChart: PlainTextChart, shiftedChords: string[]): Array<{ bar: number; chords: string[] }> {
  let cursor = 0;
  return parsedChart.bars.map((bar) => {
    const shifted = shiftedChords.slice(cursor, cursor + bar.chords.length);
    cursor += bar.chords.length;
    return {
      bar: bar.bar,
      chords: shifted
    };
  });
}

function sequenceToBarNumbers(parsedChart: PlainTextChart): Map<number, number> {
  const sequenceToBar = new Map<number, number>();
  let cursor = 0;
  parsedChart.bars.forEach((bar) => {
    bar.chords.forEach(() => {
      cursor += 1;
      sequenceToBar.set(cursor, bar.bar);
    });
  });
  return sequenceToBar;
}

export function createPlainTextChartViewModel(
  input: string,
  options: {
    title?: string;
    declaredKey?: string;
    transpose?: number;
  } = {}
): ChartViewModel {
  const parsed = parsePlainTextChart(input);
  const shift = wrapTransposeShift(options.transpose ?? 0);
  const declaredKey = options.declaredKey?.trim() || parsed.metadata.declared_key;
  const preferFlats = preferFlatNames(declaredKey, ...parsed.chords);
  const shiftedChords = shift === 0 ? parsed.chords : transposeChart(parsed.chords, shift, { preferFlats });
  const shiftedBars = splitShiftedChordsIntoBars(parsed, shiftedChords);
  const analysed = analyseProgression(shiftedChords);
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
  const chords: UiChordViewModel[] = [];

  shiftedBars.forEach((bar) => {
    bar.chords.forEach((symbol) => {
      const sequenceIndex = chords.length + 1;
      const chartChord = analysed.chords[sequenceIndex - 1];
      const region = regionForSequence(analysed.regions, sequenceIndex);
      chords.push({
        bar: bar.bar,
        sequence_index: sequenceIndex,
        symbol: chartChord?.parsed.symbol ?? symbol,
        display_symbol: jazzChordDisplay(chartChord?.parsed.symbol ?? symbol),
        root: chartChord?.parsed.root ?? "",
        quality: chartChord?.parsed.quality ?? "",
        extensions: chartChord?.parsed.extensions ?? [],
        bass: chartChord?.parsed.bass ?? null,
        region_id: region?.region_id ?? null,
        colour_role: region?.colour_role ?? null
      });
    });
  });

  return {
    id: "plain-text-chart",
    source_kind: "plain_text",
    title: options.title?.trim() || parsed.metadata.title || "Untitled Progression",
    composer: parsed.metadata.composer,
    declared_key: declaredKey,
    form: parsed.metadata.form,
    style: parsed.metadata.style ?? "Plain Text",
    tempo: parsed.metadata.tempo,
    current_transposition_shift: shift,
    current_transposition_label: formatTransposeShift(shift),
    expected_regions: [],
    sections: parsed.sections,
    bars: shiftedBars.map((bar) => {
      const barChords = chords.filter((chord) => chord.bar === bar.bar);
      const regionIds = [...new Set(barChords.map((chord) => chord.region_id).filter((id): id is string => Boolean(id)))];
      const sourceBar = parsed.bars.find((item) => item.bar === bar.bar);
      return {
        bar: bar.bar,
        chords: barChords,
        region_ids: regionIds,
        colour_role: barChords.find((chord) => chord.colour_role)?.colour_role ?? null,
        section_id: sourceBar?.section_id ?? null,
        section_label: sourceBar?.section_label ?? null,
        raw: sourceBar?.raw ?? null
      };
    }),
    chords,
    regions: remappedRegions,
    analysis: remappedAnalysis,
    practice_objects: analysed.practice_objects,
    ireal: payloadViewModel(null),
    warnings: [...parsed.warnings, ...analysed.warnings]
  };
}
