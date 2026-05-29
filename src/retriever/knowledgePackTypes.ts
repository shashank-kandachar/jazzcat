import type { CourseModule } from "../course/courseTypes.ts";
import type { BookPack } from "../library/bookPackTypes.ts";
import type { MediaPack } from "../media/mediaTypes.ts";
import type { ArtistPage, TunePage } from "../knowledge/artistTuneTypes.ts";
import type { DatabaseAction } from "./databaseUpdateTypes.ts";

export interface KnowledgePack {
  schema: "jazzcat-knowledge-pack-v1";
  request_id: string;
  entities: {
    artists: ArtistPage[];
    tunes: TunePage[];
    recordings: unknown[];
    course_links: string[];
    practice_notes: string[];
  };
  media: MediaPack;
  database_actions: DatabaseAction[];
  source_policy: {
    requires_user_review: true;
    source_confidence_supported: true;
  };
}

export interface CoursePack {
  schema: "jazzcat-course-pack-v1";
  request_id: string;
  modules: CourseModule[];
}

export interface BookKnowledgePack {
  schema: "jazzcat-book-pack-v1";
  request_id: string;
  book_pack: BookPack;
}
