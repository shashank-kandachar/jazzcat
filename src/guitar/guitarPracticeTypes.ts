export interface FretboardPosition {
  name: string;
  fret_min: number;
  fret_max: number;
  string_set: string[];
}

export interface GuitarTask {
  id: string;
  task_type: "guide-tones" | "arpeggio" | "comping" | "12-key-drill" | "tune-application";
  source_chords: string[];
  fretboard_position?: FretboardPosition;
  target_tones: string[];
  suggested_tempo: number;
}

export interface GuitarPracticeQueue {
  date: string;
  level: "beginner" | "intermediate" | "advanced";
  tasks: GuitarTask[];
}
