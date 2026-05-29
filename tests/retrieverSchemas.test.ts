import test from "node:test";
import assert from "node:assert/strict";
import {
  bookPackAvoidsVerbatimText,
  isJsonCompatible,
  isKnowledgePack,
  isRetrieveRequest
} from "../src/retriever/index.ts";
import type { BookPack } from "../src/library/bookPackTypes.ts";

test("Retriever request and knowledge pack examples are JSON-compatible", () => {
  const request = {
    schema: "jazzcat-retrieve-request-v1",
    request_id: "req_test_001",
    requested_at: "2026-05-30",
    request_type: "tune_research",
    entity: {
      title: "Autumn Leaves",
      source: "iReal import"
    },
    requested_data: {
      tune_overview: true,
      iconic_versions: true
    }
  };

  const pack = {
    schema: "jazzcat-knowledge-pack-v1",
    request_id: "req_test_001",
    entities: {
      artists: [],
      tunes: [],
      recordings: [],
      course_links: [],
      practice_notes: []
    },
    media: {
      schema: "jazzcat-media-pack-v1",
      youtube_search_queries: [],
      saved_links: []
    },
    database_actions: [],
    source_policy: {
      requires_user_review: true,
      source_confidence_supported: true
    }
  };

  assert.ok(isJsonCompatible(request));
  assert.ok(isJsonCompatible(pack));
  assert.ok(isRetrieveRequest(request));
  assert.ok(isKnowledgePack(pack));
});

test("Book Pack schema does not require copyrighted verbatim text", () => {
  const bookPack: BookPack = {
    schema: "jazzcat-book-pack-v1",
    book: {
      title: "Example Jazz Book",
      author: "Example Author",
      type: "guitar",
      difficulty: "intermediate",
      best_used_for: ["guide-tone practice"]
    },
    summary: {
      short: "Original short summary.",
      detailed: "Original detailed summary."
    },
    chapter_map: [],
    concepts: [],
    exercises: [],
    course_integration: [],
    copyright_policy: {
      contains_verbatim_book_text: false,
      notes: "Only original summaries, concept maps, short references, user-owned notes, and practice tasks."
    }
  };

  assert.ok(bookPackAvoidsVerbatimText(bookPack));
  assert.ok(isJsonCompatible(bookPack));
});
