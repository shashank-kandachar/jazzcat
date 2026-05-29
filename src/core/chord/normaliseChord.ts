import { parseChord } from "./parseChord.ts";

export function normaliseChord(raw: string): string {
  return parseChord(raw).symbol;
}
