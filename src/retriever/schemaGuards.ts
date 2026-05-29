import type { BookPack } from "../library/bookPackTypes.ts";
import type { DatabaseUpdatePack } from "./databaseUpdateTypes.ts";
import type { KnowledgePack } from "./knowledgePackTypes.ts";
import type { RetrieveRequest } from "./retrieveRequestTypes.ts";

export function isJsonCompatible(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

export function isRetrieveRequest(value: unknown): value is RetrieveRequest {
  const candidate = value as Partial<RetrieveRequest>;
  return candidate?.schema === "jazzcat-retrieve-request-v1" && typeof candidate.request_id === "string";
}

export function isKnowledgePack(value: unknown): value is KnowledgePack {
  const candidate = value as Partial<KnowledgePack>;
  return candidate?.schema === "jazzcat-knowledge-pack-v1" && Boolean(candidate.source_policy?.requires_user_review);
}

export function isDatabaseUpdatePack(value: unknown): value is DatabaseUpdatePack {
  const candidate = value as Partial<DatabaseUpdatePack>;
  return candidate?.schema === "jazzcat-database-update-v1" && Array.isArray(candidate.actions);
}

export function bookPackAvoidsVerbatimText(value: BookPack): boolean {
  return value.copyright_policy.contains_verbatim_book_text === false;
}
