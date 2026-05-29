import { parseChord } from "../core/chord/parseChord.ts";

export interface PlainTextBar {
  bar: number;
  raw: string;
  chords: string[];
}

export interface PlainTextChart {
  bars: PlainTextBar[];
  chords: string[];
  warnings: string[];
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
  "dim7"
]);

function hasExplicitBars(input: string): boolean {
  return input.includes("|") || (input.includes("[") && input.includes("]"));
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

function splitBars(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (trimmed.includes("[") && trimmed.includes("]")) {
    const bracketed = [...trimmed.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim()).filter(Boolean);
    if (bracketed.length > 0) return bracketed;
  }

  if (trimmed.includes("|")) {
    return trimmed
      .split("|")
      .map((bar) => bar.trim())
      .filter(Boolean);
  }

  const lines = trimmed
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  return splitChordTokens(trimmed);
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

export function parsePlainTextChart(input: string): PlainTextChart {
  const warnings: string[] = [];
  const explicitBars = hasExplicitBars(input);
  const rawBars = splitBars(input);
  const bars: PlainTextBar[] = [];
  const chords: string[] = [];

  rawBars.forEach((rawBar, index) => {
    const tokens = splitChordTokens(rawBar);
    const parsedTokens = tokens
      .map((token) => normaliseToken(token, warnings))
      .filter((token): token is string => Boolean(token));

    if (parsedTokens.length === 0) return;

    if (explicitBars || rawBars.length > 1) {
      bars.push({
        bar: bars.length + 1,
        raw: rawBar,
        chords: parsedTokens
      });
    } else {
      parsedTokens.forEach((chord) => {
        bars.push({
          bar: bars.length + 1,
          raw: chord,
          chords: [chord]
        });
      });
    }

    chords.push(...parsedTokens);
  });

  if (rawBars.length === 0) {
    warnings.push("No chord text found.");
  } else if (chords.length === 0) {
    warnings.push("No parseable chords found.");
  }

  return {
    bars,
    chords,
    warnings: [...new Set(warnings)]
  };
}
