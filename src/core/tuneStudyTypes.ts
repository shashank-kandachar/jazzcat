import type { Confidence, SemanticRegion } from "./types.ts";

export interface TuneMetadata {
  title: string | null;
  composer: string | null;
  declared_key: string | null;
  form: string | null;
  style: string | null;
  tempo: number | null;
}

export interface ChartSection {
  section_id: string;
  label: string;
  start_bar: number;
  end_bar: number;
}

export interface ChordBar {
  bar: number;
  raw: string;
  chords: string[];
  section_id: string | null;
  section_label: string | null;
}

export type HarmonyRegion = SemanticRegion;

export interface PracticeTask {
  task_type: string;
  instruction: string;
  priority: Confidence;
}

export interface TuneStudy {
  metadata: TuneMetadata;
  sections: ChartSection[];
  bars: ChordBar[];
  chords: string[];
  warnings: string[];
}
