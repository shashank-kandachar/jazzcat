import type { HarmonyAnalysis, SemanticRegion } from "../types.ts";

export interface GuitarTaskSuggestion {
  task_type: "guide-tones" | "arpeggios" | "think-v" | "resolution" | "scale-choice" | "transpose" | "cautious-study";
  instruction: string;
  priority: "low" | "medium" | "high";
}

export function buildGuitarTasksForAnalysis(
  analysis: HarmonyAnalysis | null | undefined,
  region?: SemanticRegion | null
): GuitarTaskSuggestion[] {
  if (!analysis) return [];

  const functionName = analysis.function;
  const thinkV = analysis.think_v ?? "the V chord";
  const resolveTo = analysis.resolve_to ?? "the target chord";
  const localKey = analysis.local_key;

  if (functionName.includes("ii-V-I") && !functionName.includes("iiø")) {
    return [
      { task_type: "guide-tones", instruction: "Play only guide tones through the progression.", priority: "high" },
      { task_type: "arpeggios", instruction: "Play the arpeggio of each chord.", priority: "medium" },
      { task_type: "think-v", instruction: `Think ${thinkV} across the ii-V.`, priority: "high" },
      { task_type: "resolution", instruction: `Resolve to the root or 3rd of ${resolveTo}.`, priority: "high" },
      { task_type: "scale-choice", instruction: "Try inside first, then altered on the V.", priority: "medium" },
      { task_type: "transpose", instruction: "Move the idea through three keys.", priority: "medium" }
    ];
  }

  if (functionName.includes("iiø-V-i") || functionName.includes("iiø-V")) {
    return [
      { task_type: "guide-tones", instruction: "Play guide tones through the minor cadence.", priority: "high" },
      { task_type: "arpeggios", instruction: "Outline the m7b5 chord clearly.", priority: "high" },
      { task_type: "think-v", instruction: `Think altered dominant or Phrygian dominant on ${thinkV}.`, priority: "high" },
      { task_type: "resolution", instruction: `Resolve strongly to ${resolveTo}.`, priority: "high" },
      { task_type: "transpose", instruction: "Move the idea through three keys.", priority: "medium" }
    ];
  }

  if (functionName === "V-I" || functionName === "V-i" || functionName.includes("secondary dominant")) {
    return [
      { task_type: "guide-tones", instruction: "Isolate dominant tension and resolution.", priority: "high" },
      { task_type: "resolution", instruction: `Target the 3rd or root of ${resolveTo}.`, priority: "high" },
      { task_type: "scale-choice", instruction: "Try one inside line and one altered line.", priority: "medium" }
    ];
  }

  return [
    { task_type: "cautious-study", instruction: "Start with guide tones and chord tones first.", priority: region?.practice_priority ?? "low" },
    { task_type: "cautious-study", instruction: "Avoid overconfident scale advice until the tonal centre is clear.", priority: "low" },
    { task_type: "cautious-study", instruction: `Confirm whether ${localKey} is the intended tonal centre.`, priority: "low" }
  ];
}
