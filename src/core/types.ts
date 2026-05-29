export type Confidence = "low" | "medium" | "high";

export type ColourRole =
  | "major-key-region"
  | "minor-key-region"
  | "dominant-tension"
  | "ambiguous-region"
  | "modulation-region";

export interface ParsedChord {
  raw: string;
  root: string;
  quality: string;
  extensions: string[];
  bass: string | null;
  symbol: string;
}

export interface ChartChord {
  bar: number;
  raw: string;
  parsed: ParsedChord;
}

export interface ScaleSuggestions {
  inside_scale: string;
  tension_scale: string;
}

export interface AlternateInterpretation {
  function: string;
  local_key: string;
  confidence: Confidence;
  reason: string;
}

export interface HarmonyAnalysis {
  span: {
    start_bar: number;
    end_bar: number;
  };
  chords: string[];
  local_key: string;
  function: string;
  confidence: Confidence;
  practice_hint: string;
  think_v?: string;
  resolve_to?: string;
  scale_suggestions?: ScaleSuggestions;
  target_tones?: string[];
  alternate_interpretations?: AlternateInterpretation[];
  reason?: string;
}

export interface SemanticRegion {
  region_id: string;
  start_bar: number;
  end_bar: number;
  chords: string[];
  local_key: string;
  function: string;
  confidence: Confidence;
  colour_role: ColourRole;
  practice_priority: Confidence;
}

export interface PracticeObject {
  exercise_type: string;
  source_chords: string[];
  think_v: string;
  resolve_to: string;
  inside_scale: string;
  tension_scale: string;
  target_tones: string[];
  suggested_drills: string[];
}

export interface ProgressionAnalysisResult {
  chords: ChartChord[];
  analysis: HarmonyAnalysis[];
  regions: SemanticRegion[];
  practice_objects: PracticeObject[];
  warnings: string[];
}
