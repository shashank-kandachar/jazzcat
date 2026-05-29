export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface CourseExercise {
  id: string;
  title: string;
  exercise_type: "concept" | "shape" | "variation" | "12-key-drill" | "tune-application";
  instructions: string;
  target_tunes: string[];
}

export interface CourseLesson {
  id: string;
  title: string;
  prerequisites: string[];
  concepts: string[];
  exercises: CourseExercise[];
}

export interface CourseModule {
  id: string;
  title: string;
  level: CourseLevel;
  lessons: CourseLesson[];
  tune_applications: string[];
  progress_concepts: string[];
}
