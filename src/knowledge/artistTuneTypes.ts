import type { SourceConfidence } from "../media/mediaTypes.ts";

export interface Recording {
  title: string;
  artist: string;
  year?: number;
  source_confidence: SourceConfidence;
}

export interface ArtistPage {
  id: string;
  name: string;
  eras: string[];
  recordings: Recording[];
  listening_paths: string[];
  study_angles: string[];
  user_notes: string[];
}

export interface TunePage {
  id: string;
  title: string;
  composers: string[];
  common_keys: string[];
  recordings: Recording[];
  harmony_notes: string[];
  course_links: string[];
  media_links: string[];
  user_notes: string[];
}
