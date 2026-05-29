import type { ProgressionAnalysisResult } from "../types.ts";
import { detectCadences, toChartChords } from "./detectCadences.ts";
import { buildPracticeObjects } from "./practiceHints.ts";
import { buildRegions } from "./regionBuilder.ts";

export function analyseProgression(chords: string[]): ProgressionAnalysisResult {
  const chartChords = toChartChords(chords);
  const analysis = detectCadences(chartChords);
  const regions = buildRegions(analysis);
  const practice_objects = buildPracticeObjects(analysis);

  return {
    chords: chartChords,
    analysis,
    regions,
    practice_objects,
    warnings: []
  };
}
