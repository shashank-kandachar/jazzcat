export type RetrieveRequestType =
  | "tune_research"
  | "artist_research"
  | "book_summary"
  | "course_enrichment"
  | "recording_list"
  | "backing_track_search"
  | "harmony_context"
  | "practice_pack";

export interface RetrieveRequest {
  schema: "jazzcat-retrieve-request-v1";
  request_id: string;
  requested_at: string;
  request_type: RetrieveRequestType;
  entity: {
    title: string;
    artist_or_author?: string;
    source: "iReal import" | "user entry" | "book upload" | "manual";
  };
  requested_data: Record<string, boolean>;
}
