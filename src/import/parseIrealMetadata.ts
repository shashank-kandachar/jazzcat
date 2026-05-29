export interface IrealMetadata {
  title: string | null;
  composer: string | null;
  style: string | null;
  declared_key_raw: string | null;
  declared_key: string | null;
  tempo: number | null;
}

export interface ParsedIrealPayload {
  raw_url: string;
  raw_decoded_payload: string;
  encoded_chord_body_payload: string | null;
  decoded_chord_body_payload: string | null;
  metadata: IrealMetadata;
}

function decodeUrl(url: string): string {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function humanKey(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.endsWith("-")) return `${raw.slice(0, -1)} minor`;
  return `${raw} major`;
}

function findTempo(parts: string[]): number | null {
  const numericParts = parts
    .map((part) => Number(part))
    .filter((value) => Number.isInteger(value) && value >= 40 && value <= 300);
  return numericParts.length > 0 ? numericParts[numericParts.length - 1] : null;
}

function findChordBodyIndex(parts: string[]): number {
  const index = parts.findIndex((part, position) => position > 4 && /[A-G][#b-]?|\|/.test(part) && part.length > 8);
  return index >= 0 ? index : 5;
}

export function parseIrealMetadata(rawUrl: string): ParsedIrealPayload {
  const decoded = decodeUrl(rawUrl);
  const encodedBody = rawUrl.replace(/^irealb:\/\//i, "");
  const decodedBody = decoded.replace(/^irealb:\/\//i, "");
  const encodedParts = encodedBody.split("=");
  const parts = decodedBody.split("=");
  const chordBodyIndex = findChordBodyIndex(parts);
  const declaredKeyRaw = parts[4] || null;

  return {
    raw_url: rawUrl,
    raw_decoded_payload: decoded,
    encoded_chord_body_payload: encodedParts[chordBodyIndex] || null,
    decoded_chord_body_payload: parts[chordBodyIndex] || null,
    metadata: {
      title: parts[0] || null,
      composer: parts[1] || null,
      style: parts[3] || null,
      declared_key_raw: declaredKeyRaw,
      declared_key: humanKey(declaredKeyRaw),
      tempo: findTempo(parts)
    }
  };
}
