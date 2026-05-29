const NOTE_TO_PC: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11
};

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "D-", "G-", "C-", "F-", "Bb-", "Eb-", "Ab-"]);

export function normalisePitchName(note: string): string {
  const trimmed = note.trim();
  const match = /^([A-Ga-g])([#b]?)/.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid pitch name: ${note}`);
  }

  return `${match[1].toUpperCase()}${match[2] ?? ""}`;
}

export function pitchClass(note: string): number {
  const normalised = normalisePitchName(note);
  const value = NOTE_TO_PC[normalised];
  if (value === undefined) {
    throw new Error(`Unknown pitch name: ${note}`);
  }
  return value;
}

export function noteName(pc: number, preferFlats = false): string {
  const wrapped = ((pc % 12) + 12) % 12;
  return preferFlats ? FLAT_NAMES[wrapped] : SHARP_NAMES[wrapped];
}

export function intervalSemitones(from: string, to: string): number {
  return (pitchClass(to) - pitchClass(from) + 12) % 12;
}

export function transposePitchName(note: string, semitones: number, preferFlats = false): string {
  return noteName(pitchClass(note) + semitones, preferFlats);
}

export function preferFlatNames(...signals: Array<string | null | undefined>): boolean {
  return signals.some((signal) => {
    if (!signal) {
      return false;
    }
    const value = signal.trim();
    return value.includes("b") || value.toLowerCase().includes("flat") || FLAT_KEYS.has(value);
  });
}

export function targetFromDominant(root: string, preferFlats = false): string {
  return transposePitchName(root, 5, preferFlats);
}

export function dominantForTarget(root: string, preferFlats = false): string {
  return transposePitchName(root, -5, preferFlats);
}

export function keyLabel(root: string, mode: "major" | "minor"): string {
  return `${root} ${mode}`;
}
