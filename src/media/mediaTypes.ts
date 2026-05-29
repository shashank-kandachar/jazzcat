export interface SourceConfidence {
  source: string;
  confidence: "low" | "medium" | "high";
  notes?: string;
}

export interface MediaQuery {
  query: string;
  purpose: "backing-track" | "iconic-recording" | "lesson" | "live-performance";
  source_confidence: SourceConfidence;
}

export interface SavedMediaItem {
  title: string;
  url: string;
  approved_by_user: boolean;
  source_confidence: SourceConfidence;
}

export interface MediaPack {
  schema: "jazzcat-media-pack-v1";
  youtube_search_queries: MediaQuery[];
  saved_links: SavedMediaItem[];
}
