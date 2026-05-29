export interface BookConcept {
  id: string;
  name: string;
  original_summary: string;
  related_exercises: string[];
}

export interface BookExerciseExtraction {
  id: string;
  title: string;
  original_summary: string;
  course_links: string[];
}

export interface BookPack {
  schema: "jazzcat-book-pack-v1";
  book: {
    title: string;
    author: string;
    type: "theory" | "improvisation" | "guitar" | "exercises" | "repertoire";
    difficulty: "beginner" | "intermediate" | "advanced";
    best_used_for: string[];
  };
  summary: {
    short: string;
    detailed: string;
  };
  chapter_map: Array<{ chapter: string; original_summary: string; concepts: string[] }>;
  concepts: BookConcept[];
  exercises: BookExerciseExtraction[];
  course_integration: Array<{ course_module_id: string; reason: string }>;
  copyright_policy: {
    contains_verbatim_book_text: false;
    notes: string;
  };
}
