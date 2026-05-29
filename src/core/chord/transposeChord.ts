import type { ChartChord, ParsedChord } from "../types.ts";
import { noteName, pitchClass, preferFlatNames, transposePitchName } from "../harmony/intervals.ts";
import { formatChord, parseChord } from "./parseChord.ts";

export interface TransposeOptions {
  preferFlats?: boolean;
}

function keyRoot(key: string): string {
  const match = /([A-Ga-g][#b]?)/.exec(key);
  if (!match) {
    throw new Error(`Cannot determine key root from: ${key}`);
  }
  return `${match[1][0].toUpperCase()}${match[1].slice(1)}`;
}

export function transposeParsedChord(chord: ParsedChord, semitones: number, options: TransposeOptions = {}): ParsedChord {
  const preferFlats = options.preferFlats ?? preferFlatNames(chord.root, chord.bass);
  const transposed = {
    raw: chord.raw,
    root: transposePitchName(chord.root, semitones, preferFlats),
    quality: chord.quality,
    extensions: [...chord.extensions],
    bass: chord.bass ? transposePitchName(chord.bass, semitones, preferFlats) : null
  };

  return {
    ...transposed,
    symbol: formatChord(transposed)
  };
}

export function transposeChord(raw: string, semitones: number, options: TransposeOptions = {}): string {
  return transposeParsedChord(parseChord(raw), semitones, options).symbol;
}

export function transposeChart(chords: string[], semitones: number, options: TransposeOptions = {}): string[] {
  return chords.map((chord) => transposeChord(chord, semitones, options));
}

export function transposeChartChords(chords: ChartChord[], semitones: number, options: TransposeOptions = {}): ChartChord[] {
  return chords.map((chord) => ({
    ...chord,
    raw: transposeParsedChord(chord.parsed, semitones, options).symbol,
    parsed: transposeParsedChord(chord.parsed, semitones, options)
  }));
}

export function semitonesBetweenKeys(sourceKey: string, targetKey: string): number {
  return (pitchClass(keyRoot(targetKey)) - pitchClass(keyRoot(sourceKey)) + 12) % 12;
}

export function transposeChartToKey(chords: string[], sourceKey: string, targetKey: string): string[] {
  const semitones = semitonesBetweenKeys(sourceKey, targetKey);
  return transposeChart(chords, semitones, { preferFlats: preferFlatNames(targetKey) });
}

export function transposedKeyName(sourceKey: string, semitones: number, preferFlats = false): string {
  const root = keyRoot(sourceKey);
  const mode = sourceKey.toLowerCase().includes("minor") || sourceKey.includes("-") ? "minor" : "major";
  return `${noteName(pitchClass(root) + semitones, preferFlats)} ${mode}`;
}
