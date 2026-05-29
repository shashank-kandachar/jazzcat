export type DatabaseActionType =
  | "upsert_tune"
  | "upsert_artist"
  | "append_recording"
  | "append_user_note"
  | "link_tune_to_artist"
  | "link_tune_to_course_module"
  | "merge_concepts"
  | "replace_summary"
  | "append_media_query"
  | "append_backing_track_candidate";

export interface DatabaseAction {
  action: DatabaseActionType;
  target: string;
  payload: Record<string, unknown>;
  preview_summary: string;
  requires_user_approval: true;
}

export interface DatabaseUpdatePack {
  schema: "jazzcat-database-update-v1";
  request_id: string;
  actions: DatabaseAction[];
}
