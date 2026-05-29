import { extractIrealLink } from "./extractIrealLink.ts";
import { parseIrealMetadata, type ParsedIrealPayload } from "./parseIrealMetadata.ts";

export interface ParsedIrealHtml extends ParsedIrealPayload {
  warnings: string[];
}

export function parseIrealHtml(html: string): ParsedIrealHtml {
  const link = extractIrealLink(html);
  if (!link) {
    return {
      raw_url: "",
      raw_decoded_payload: "",
      encoded_chord_body_payload: null,
      decoded_chord_body_payload: null,
      metadata: {
        title: null,
        composer: null,
        style: null,
        declared_key_raw: null,
        declared_key: null,
        tempo: null
      },
      warnings: ["No irealb:// URL found in input."]
    };
  }

  return {
    ...parseIrealMetadata(link),
    warnings: []
  };
}
