import type { ColourRole, HarmonyAnalysis, PracticeObject, SemanticRegion } from "../core/types.ts";
import type { ChartViewModel } from "./chartViewModel.ts";

export const REGION_ROLE_CLASSES: Record<ColourRole, string> = {
  "major-key-region": "major-key-region",
  "minor-key-region": "minor-key-region",
  "dominant-tension": "dominant-tension",
  "ambiguous-region": "ambiguous-region",
  "modulation-region": "modulation-region"
};

export interface PracticeCardModel {
  progression: string;
  goal: string;
  drills: string[];
  target_tones: string[];
  inside_sound: string | null;
  tension_sound: string | null;
  think_v: string | null;
  resolve_to: string | null;
}

export interface RegionDetailViewModel {
  region: SemanticRegion;
  analysis: HarmonyAnalysis | null;
  colour_class: string;
  practice_priority: string;
  practice_cards: PracticeCardModel[];
}

function sameProgression(left: string[], right: string[]): boolean {
  return left.join("|") === right.join("|");
}

export function createPracticeCardForRegion(model: ChartViewModel, regionIndex: number): PracticeCardModel | null {
  const region = model.regions[regionIndex];
  const analysis = model.analysis[regionIndex];
  if (!region || !analysis) return null;

  const linkedPractice = model.practice_objects.find((practice) => sameProgression(practice.source_chords, analysis.chords));
  if (!linkedPractice && !analysis.think_v && !analysis.resolve_to) return null;

  return {
    progression: analysis.chords.join(" | "),
    goal: analysis.practice_hint,
    drills: linkedPractice?.suggested_drills ?? [
      "Play only guide tones.",
      analysis.think_v ? `Play a line from ${analysis.think_v}.` : "Play chord tones slowly.",
      analysis.resolve_to ? `Resolve clearly to ${analysis.resolve_to}.` : "Resolve to the next stable chord.",
      "Move the exercise through 3 keys."
    ],
    target_tones: linkedPractice?.target_tones ?? analysis.target_tones ?? [],
    inside_sound: linkedPractice?.inside_scale ?? analysis.scale_suggestions?.inside_scale ?? null,
    tension_sound: linkedPractice?.tension_scale ?? analysis.scale_suggestions?.tension_scale ?? null,
    think_v: linkedPractice?.think_v ?? analysis.think_v ?? null,
    resolve_to: linkedPractice?.resolve_to ?? analysis.resolve_to ?? null
  };
}

export function createRegionDetailViewModel(model: ChartViewModel, regionIndex: number): RegionDetailViewModel | null {
  const region = model.regions[regionIndex];
  if (!region) return null;

  const practiceCard = createPracticeCardForRegion(model, regionIndex);

  return {
    region,
    analysis: model.analysis[regionIndex] ?? null,
    colour_class: REGION_ROLE_CLASSES[region.colour_role],
    practice_priority: region.practice_priority,
    practice_cards: practiceCard ? [practiceCard] : []
  };
}
