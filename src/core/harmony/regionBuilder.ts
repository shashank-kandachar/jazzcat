import type { ColourRole, HarmonyAnalysis, SemanticRegion } from "../types.ts";

function colourRoleFor(analysis: HarmonyAnalysis): ColourRole {
  if (analysis.function.includes("ambiguous")) return "ambiguous-region";
  if (analysis.function.includes("secondary") || analysis.function.includes("tritone")) return "modulation-region";
  if (analysis.local_key.includes("minor")) return "minor-key-region";
  if (analysis.local_key.includes("major")) return "major-key-region";
  if (analysis.function.includes("V")) return "dominant-tension";
  return "ambiguous-region";
}

export function buildRegions(analysis: HarmonyAnalysis[]): SemanticRegion[] {
  return analysis.map((item, index) => ({
    region_id: `region-${index + 1}`,
    start_bar: item.span.start_bar,
    end_bar: item.span.end_bar,
    chords: item.chords,
    local_key: item.local_key,
    function: item.function,
    confidence: item.confidence,
    colour_role: colourRoleFor(item),
    practice_priority: item.confidence
  }));
}
