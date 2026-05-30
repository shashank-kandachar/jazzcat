import type { ParsedChord } from "../types.ts";
import { normalisePitchName } from "../harmony/intervals.ts";

const EXTENSION_PATTERN = /#11|b13|#9|b9|#5|b5|13|11|9/g;

function cleanDescriptor(descriptor: string): string {
  return descriptor
    .replace(/half[- ]?dim(?:inished)?/gi, "m7b5")
    .replace(/majmin/i, "mmaj")
    .replace(/major/gi, "maj")
    .replace(/minor/gi, "m")
    .replace(/min/gi, "m")
    .replace(/[∆Δ^]/g, "maj")
    .replace(/-/g, "m")
    .replace(/[øØ]/g, "m7b5")
    .replace(/\(([^)]+)\)/g, "$1");
}

function detectQuality(descriptor: string): string {
  const lower = descriptor.toLowerCase();

  if (lower.startsWith("mmaj7")) return "mmaj7";
  if (lower.startsWith("m7b5")) return "m7b5";
  if (lower.startsWith("dim7") || lower.startsWith("o7")) return "dim7";
  if (lower.startsWith("dim") || lower.startsWith("o")) return "dim";
  if (lower.startsWith("aug") || lower.startsWith("+")) return "aug";
  if (lower.startsWith("maj7")) return "maj7";
  if (lower.startsWith("maj")) return "maj";
  if (lower.startsWith("m7")) return "m7";
  if (lower.startsWith("m6")) return "m6";
  if (lower.startsWith("m")) return "m";
  if (lower.startsWith("7sus")) return "7sus";
  if (lower.startsWith("7")) return "7";
  if (lower.startsWith("13") || lower.startsWith("11") || lower.startsWith("9")) return "7";
  if (lower.startsWith("69") || lower.startsWith("6/9")) return "6";
  if (lower.startsWith("6")) return "6";
  if (lower === "") return "major";

  return descriptor;
}

function extractExtensions(descriptor: string, quality: string): string[] {
  const matches = descriptor.match(EXTENSION_PATTERN) ?? [];
  const withoutQualityExtension = matches.filter((extension) => {
    if (quality === "m7b5" && extension === "b5") return false;
    if ((quality === "7" || quality === "7sus") && extension === "9" && descriptor.toLowerCase().startsWith("9")) return false;
    if ((quality === "7" || quality === "7sus") && extension === "11" && descriptor.toLowerCase().startsWith("11")) return false;
    if ((quality === "7" || quality === "7sus") && extension === "13" && descriptor.toLowerCase().startsWith("13")) return false;
    return true;
  });

  if (descriptor.toLowerCase().startsWith("9")) return ["9", ...withoutQualityExtension];
  if (descriptor.toLowerCase().startsWith("11")) return ["11", ...withoutQualityExtension];
  if (descriptor.toLowerCase().startsWith("13")) return ["13", ...withoutQualityExtension];

  return [...new Set(withoutQualityExtension)];
}

export function formatChord(chord: Omit<ParsedChord, "symbol">): string {
  const quality = chord.quality === "major" ? "" : chord.quality;
  const extensionSuffix = chord.extensions.length > 0 ? `(${chord.extensions.join(",")})` : "";
  const bass = chord.bass ? `/${chord.bass}` : "";

  return `${chord.root}${quality}${extensionSuffix}${bass}`;
}

export function parseChord(raw: string): ParsedChord {
  const compact = raw.trim().replace(/\s+/g, "");
  if (!compact) {
    throw new Error("Cannot parse an empty chord symbol.");
  }

  const slashBass = /^(.+)\/([A-Ga-g][#b]?)$/.exec(compact);
  const symbolPart = slashBass ? slashBass[1] : compact;
  const bassPart = slashBass ? slashBass[2] : null;
  const rootMatch = /^([A-Ga-g][#b]?)/.exec(symbolPart);
  if (!rootMatch) {
    throw new Error(`Cannot parse chord root from: ${raw}`);
  }

  const root = normalisePitchName(rootMatch[1]);
  const descriptor = cleanDescriptor(symbolPart.slice(rootMatch[1].length));
  const quality = detectQuality(descriptor);
  const extensions = extractExtensions(descriptor, quality);
  const bass = bassPart ? normalisePitchName(bassPart) : null;
  const model = { raw, root, quality, extensions, bass };

  return {
    ...model,
    symbol: formatChord(model)
  };
}
