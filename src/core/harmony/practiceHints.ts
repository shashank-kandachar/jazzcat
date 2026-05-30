import type { HarmonyAnalysis, PracticeObject } from "../types.ts";

export function targetTonesFor(resolveTo: string): string[] {
  return [`3rd of ${resolveTo}`, `7th of ${resolveTo}`, `root of ${resolveTo}`];
}

export function buildPracticeObjects(analysis: HarmonyAnalysis[]): PracticeObject[] {
  return analysis
    .filter((item) => item.think_v && item.resolve_to && item.scale_suggestions)
    .filter((item) => item.function.includes("ii") || item.function.includes("tritone") || item.function.includes("backdoor"))
    .map((item) => ({
      exercise_type: item.function,
      source_chords: item.chords,
      think_v: item.think_v ?? "",
      resolve_to: item.resolve_to ?? "",
      inside_scale: item.scale_suggestions?.inside_scale ?? "",
      tension_scale: item.scale_suggestions?.tension_scale ?? "",
      target_tones: item.target_tones ?? targetTonesFor(item.resolve_to ?? ""),
      suggested_drills: [
        `Play guide tones through ${item.chords.join(" | ")}.`,
        `Voice-lead shell voicings through ${item.chords.join(" | ")}.`,
        `Run the line in 12 keys, resolving clearly to ${item.resolve_to}.`,
        `Comp shell voicings, then single-note lines from ${item.think_v}.`,
        "Play the same idea in two nearby fretboard positions."
      ]
    }));
}
