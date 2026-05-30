import { parseChord } from "../core/chord/parseChord.ts";
import type { ChartSection, ChordBar, TuneMetadata, TuneStudy } from "../core/tuneStudyTypes.ts";

export type PlainTextBar = ChordBar;

export interface PlainTextChart extends TuneStudy {
  metadata: TuneMetadata;
  sections: ChartSection[];
  bars: PlainTextBar[];
  chords: string[];
  warnings: string[];
}

interface SectionDraft {
  section_id: string;
  label: string;
}

interface ChordChunk {
  raw: string;
  section_id: string | null;
  section_label: string | null;
  explicit_bars: boolean;
}

const SUPPORTED_QUALITIES = new Set([
  "major",
  "maj",
  "maj7",
  "6",
  "m",
  "m6",
  "m7",
  "m7b5",
  "mmaj7",
  "7",
  "7sus",
  "dim7",
  "dim",
  "aug"
]);

const METADATA_KEYS: Record<string, keyof TuneMetadata> = {
  title: "title",
  tune: "title",
  composer: "composer",
  by: "composer",
  key: "declared_key",
  declaredkey: "declared_key",
  form: "form",
  style: "style",
  tempo: "tempo",
  bpm: "tempo"
};

const SECTION_LABELS = new Set([
  "intro",
  "a",
  "b",
  "c",
  "d",
  "bridge",
  "solo",
  "solos",
  "head",
  "verse",
  "chorus",
  "tag",
  "outro",
  "ending"
]);

function emptyMetadata(): TuneMetadata {
  return {
    title: null,
    composer: null,
    declared_key: null,
    form: null,
    style: null,
    tempo: null
  };
}

function normaliseKeyLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function metadataKey(label: string): keyof TuneMetadata | null {
  return METADATA_KEYS[normaliseKeyLabel(label)] ?? null;
}

function isSectionLabel(label: string): boolean {
  const normalised = normaliseKeyLabel(label);
  return SECTION_LABELS.has(normalised) || /^[a-z]$/.test(normalised);
}

function parseTempo(value: string): number | null {
  const match = /\d+/.exec(value);
  if (!match) return null;
  const tempo = Number(match[0]);
  return Number.isInteger(tempo) && tempo >= 30 && tempo <= 320 ? tempo : null;
}

function stripToken(token: string): string {
  return token.trim().replace(/^[|:[\]{}]+|[|:[\]{}]+$/g, "");
}

function splitChordTokens(bar: string): string[] {
  return bar
    .replace(/,/g, " ")
    .replace(/\s+\/\s+/g, " ")
    .split(/\s+/)
    .map(stripToken)
    .filter(Boolean);
}

function splitExplicitBars(input: string): string[] {
  const bracketed = [...input.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim()).filter(Boolean);
  if (bracketed.length > 0) return bracketed;

  if (input.includes("|")) {
    return input
      .split("|")
      .map((bar) => bar.trim())
      .filter(Boolean);
  }

  return [];
}

function normaliseToken(token: string, warnings: string[]): string | null {
  try {
    const chord = parseChord(token);
    if (!SUPPORTED_QUALITIES.has(chord.quality)) {
      warnings.push(`Unparseable chord token skipped: ${token}`);
      return null;
    }
    return chord.symbol;
  } catch {
    warnings.push(`Unparseable chord token skipped: ${token}`);
    return null;
  }
}

function isHeldBar(rawBar: string): boolean {
  return /^(%|\/|[-]+|n\.?c\.?)$/i.test(rawBar.trim());
}

function parseMetadataLine(line: string, metadata: TuneMetadata): boolean {
  const match = /^([A-Za-z][A-Za-z ]{0,24})\s*:\s*(.+)$/.exec(line);
  if (!match) return false;

  const key = metadataKey(match[1]);
  if (!key) return false;

  const value = match[2].trim();
  if (!value) return true;

  if (key === "tempo") {
    metadata.tempo = parseTempo(value);
  } else {
    metadata[key] = value;
  }

  return true;
}

function readChartChunks(input: string, metadata: TuneMetadata): { chunks: ChordChunk[]; sectionDrafts: SectionDraft[] } {
  const chunks: ChordChunk[] = [];
  const sectionDrafts: SectionDraft[] = [];
  let currentSection: SectionDraft | null = null;

  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  lines.forEach((line) => {
    if (parseMetadataLine(line, metadata)) return;

    let chordText = line;
    const headerMatch = /^([A-Za-z][A-Za-z0-9 ]{0,24})\s*:\s*(.*)$/.exec(line);
    if (headerMatch && isSectionLabel(headerMatch[1])) {
      const label = headerMatch[1].trim();
      currentSection = {
        section_id: `section-${sectionDrafts.length + 1}`,
        label
      };
      sectionDrafts.push(currentSection);
      chordText = headerMatch[2].trim();
      if (!chordText) return;
    }

    if (!chordText) return;

    const explicitBars = splitExplicitBars(chordText);
    if (explicitBars.length > 0) {
      explicitBars.forEach((raw) => {
        chunks.push({
          raw,
          section_id: currentSection?.section_id ?? null,
          section_label: currentSection?.label ?? null,
          explicit_bars: true
        });
      });
      return;
    }

    chunks.push({
      raw: chordText,
      section_id: currentSection?.section_id ?? null,
      section_label: currentSection?.label ?? null,
      explicit_bars: false
    });
  });

  return { chunks, sectionDrafts };
}

function chunksToBars(chunks: ChordChunk[], warnings: string[]): PlainTextBar[] {
  const bars: PlainTextBar[] = [];
  const hasAnyExplicitBars = chunks.some((chunk) => chunk.explicit_bars);
  const splitSingleImplicitChunk = !hasAnyExplicitBars && chunks.length === 1;

  chunks.forEach((chunk) => {
    const rawBars = splitSingleImplicitChunk ? splitChordTokens(chunk.raw) : [chunk.raw];

    rawBars.forEach((rawBar) => {
      if (isHeldBar(rawBar)) {
        bars.push({
          bar: bars.length + 1,
          raw: rawBar,
          chords: [],
          section_id: chunk.section_id,
          section_label: chunk.section_label
        });
        return;
      }

      const parsedTokens = splitChordTokens(rawBar)
        .map((token) => normaliseToken(token, warnings))
        .filter((token): token is string => Boolean(token));

      if (parsedTokens.length === 0) {
        return;
      }

      bars.push({
        bar: bars.length + 1,
        raw: rawBar,
        chords: parsedTokens,
        section_id: chunk.section_id,
        section_label: chunk.section_label
      });
    });
  });

  return bars;
}

function buildSections(sectionDrafts: SectionDraft[], bars: PlainTextBar[]): ChartSection[] {
  return sectionDrafts
    .map((section) => {
      const sectionBars = bars.filter((bar) => bar.section_id === section.section_id);
      if (sectionBars.length === 0) return null;
      return {
        section_id: section.section_id,
        label: section.label,
        start_bar: sectionBars[0].bar,
        end_bar: sectionBars[sectionBars.length - 1].bar
      };
    })
    .filter((section): section is ChartSection => Boolean(section));
}

export function parsePlainTextChart(input: string): PlainTextChart {
  const warnings: string[] = [];
  const metadata = emptyMetadata();
  const { chunks, sectionDrafts } = readChartChunks(input, metadata);

  const bars = chunksToBars(chunks, warnings);
  const chords = bars.flatMap((bar) => bar.chords);
  const sections = buildSections(sectionDrafts, bars);

  if (chunks.length === 0) {
    warnings.push("No chord text found.");
  } else if (chords.length === 0) {
    warnings.push("No parseable chords found.");
  }

  return {
    metadata,
    sections,
    bars,
    chords,
    warnings: [...new Set(warnings)]
  };
}
