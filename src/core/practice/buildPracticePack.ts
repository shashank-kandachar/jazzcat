import type { Confidence, HarmonyAnalysis, PracticeObject, SemanticRegion } from "../types.ts";
import type { GuitarTaskSuggestion } from "../harmony/guitarTasks.ts";
import { buildGuitarTasksForAnalysis } from "../harmony/guitarTasks.ts";
import type { KeyTrainerMode, KeyTrainerVersion } from "./keyTrainer.ts";
import { buildKeyTrainerVersions } from "./keyTrainer.ts";

export interface PracticePackSource {
  type: "demo" | "ireal_html" | "ireal_link" | "plain_text";
  title: string;
  declared_key: string | null;
  transposition_shift: number;
}

export interface PracticePack {
  schema: "jazzcat-practice-pack-v1";
  source: PracticePackSource;
  selected_region: {
    region_id: string;
    start_bar: number;
    end_bar: number;
    chords: string[];
    local_key: string;
    function: string;
    confidence: Confidence;
  };
  practice_focus: {
    think_v: string | null;
    resolve_to: string | null;
    inside_scale: string | null;
    tension_scale: string | null;
    target_tones: string[];
    suggested_drills: string[];
    guitar_tasks: GuitarTaskSuggestion[];
  };
  key_trainer: {
    mode: KeyTrainerMode;
    versions: KeyTrainerVersion[];
  };
  notes: string[];
}

export interface BuildPracticePackInput {
  source: PracticePackSource;
  region: SemanticRegion;
  analysis: HarmonyAnalysis;
  practiceObject?: PracticeObject | null;
  keyTrainerMode?: KeyTrainerMode;
  guitarTasks?: GuitarTaskSuggestion[];
  notes?: string[];
}

export function buildPracticePack(input: BuildPracticePackInput): PracticePack {
  const mode = input.keyTrainerMode ?? "original";
  const guitarTasks = input.guitarTasks ?? buildGuitarTasksForAnalysis(input.analysis, input.region);
  const suggestedDrills = input.practiceObject?.suggested_drills ?? guitarTasks.map((task) => task.instruction);

  return {
    schema: "jazzcat-practice-pack-v1",
    source: input.source,
    selected_region: {
      region_id: input.region.region_id,
      start_bar: input.region.start_bar,
      end_bar: input.region.end_bar,
      chords: input.analysis.chords,
      local_key: input.region.local_key,
      function: input.region.function,
      confidence: input.region.confidence
    },
    practice_focus: {
      think_v: input.practiceObject?.think_v ?? input.analysis.think_v ?? null,
      resolve_to: input.practiceObject?.resolve_to ?? input.analysis.resolve_to ?? null,
      inside_scale: input.practiceObject?.inside_scale ?? input.analysis.scale_suggestions?.inside_scale ?? null,
      tension_scale: input.practiceObject?.tension_scale ?? input.analysis.scale_suggestions?.tension_scale ?? null,
      target_tones: input.practiceObject?.target_tones ?? input.analysis.target_tones ?? [],
      suggested_drills: suggestedDrills,
      guitar_tasks: guitarTasks
    },
    key_trainer: {
      mode,
      versions: buildKeyTrainerVersions(input.analysis.chords, mode)
    },
    notes: input.notes ?? []
  };
}

export function serialisePracticePack(pack: PracticePack): string {
  return JSON.stringify(pack, null, 2);
}
