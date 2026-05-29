import type { HarmonyAnalysis } from "../types.ts";
import { analyseProgression } from "../harmony/analyseProgression.ts";
import { transposeChart } from "../chord/transposeChord.ts";

export type KeyTrainerMode = "original" | "up_whole_step" | "down_minor_third" | "cycle_of_fourths" | "random_3_keys";

export interface KeyTrainerVersion {
  label: string;
  semitone_shift: number;
  chords: string[];
  local_key: string;
  function: string;
  think_v: string | null;
  resolve_to: string | null;
}

const MODE_SHIFTS: Record<Exclude<KeyTrainerMode, "random_3_keys">, Array<{ label: string; shift: number }>> = {
  original: [{ label: "Original", shift: 0 }],
  up_whole_step: [{ label: "Up whole step", shift: 2 }],
  down_minor_third: [{ label: "Down minor third", shift: -3 }],
  cycle_of_fourths: [
    { label: "Cycle 1", shift: 5 },
    { label: "Cycle 2", shift: 10 },
    { label: "Cycle 3", shift: 15 },
    { label: "Cycle 4", shift: 20 }
  ]
};

function dedupeShifts(shifts: number[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const shift of shifts) {
    const wrapped = ((shift % 12) + 12) % 12;
    if (seen.has(wrapped)) continue;
    seen.add(wrapped);
    result.push(shift);
  }
  return result;
}

function randomShiftPlan(randomShifts?: number[]): Array<{ label: string; shift: number }> {
  const candidates = dedupeShifts(randomShifts ?? [2, -3, 5, 7, -5, 10]).slice(0, 3);
  return candidates.map((shift, index) => ({
    label: `Random ${index + 1}`,
    shift
  }));
}

function firstAnalysis(chords: string[]): HarmonyAnalysis | null {
  return analyseProgression(chords).analysis[0] ?? null;
}

export function buildKeyTrainerVersions(
  chords: string[],
  mode: KeyTrainerMode,
  options: { randomShifts?: number[] } = {}
): KeyTrainerVersion[] {
  const shiftPlan = mode === "random_3_keys" ? randomShiftPlan(options.randomShifts) : MODE_SHIFTS[mode];

  return shiftPlan.map(({ label, shift }) => {
    const transposed = shift === 0 ? [...chords] : transposeChart(chords, shift, { preferFlats: true });
    const analysis = firstAnalysis(transposed);
    return {
      label,
      semitone_shift: shift,
      chords: transposed,
      local_key: analysis?.local_key ?? "unknown",
      function: analysis?.function ?? "unknown",
      think_v: analysis?.think_v ?? null,
      resolve_to: analysis?.resolve_to ?? null
    };
  });
}

export function buildAllKeyTrainerModes(chords: string[]): Record<KeyTrainerMode, KeyTrainerVersion[]> {
  return {
    original: buildKeyTrainerVersions(chords, "original"),
    up_whole_step: buildKeyTrainerVersions(chords, "up_whole_step"),
    down_minor_third: buildKeyTrainerVersions(chords, "down_minor_third"),
    cycle_of_fourths: buildKeyTrainerVersions(chords, "cycle_of_fourths"),
    random_3_keys: buildKeyTrainerVersions(chords, "random_3_keys")
  };
}
