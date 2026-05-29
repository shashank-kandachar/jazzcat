import { findManualFixture, type ManualTuneFixture } from "../fixtures/manualChordFixtures.ts";
import { parseIrealHtml } from "../import/parseIrealHtml.ts";
import { parseIrealMetadata, type ParsedIrealPayload } from "../import/parseIrealMetadata.ts";
import { extractIrealLink } from "../import/extractIrealLink.ts";
import { createChartViewModel, createUnknownImportViewModel, type ChartViewModel } from "./chartViewModel.ts";

export type BrowserChartInputKind = "ireal_link" | "ireal_html";

export interface BrowserChartInput {
  kind: BrowserChartInputKind;
  value: string;
  filename?: string;
}

export interface ImportMatchResult {
  parsed: ParsedIrealPayload;
  fixture: ManualTuneFixture | null;
  warnings: string[];
}

function sourceKind(kind: BrowserChartInputKind): "pasted_ireal" | "uploaded_html" {
  return kind === "ireal_link" ? "pasted_ireal" : "uploaded_html";
}

export function parseBrowserChartInput(input: BrowserChartInput): ImportMatchResult {
  const rawValue = input.value.trim();
  const parsed =
    input.kind === "ireal_link" || rawValue.startsWith("irealb://")
      ? parseIrealMetadata(rawValue)
      : parseIrealHtml(rawValue);

  const fixture = findManualFixture(parsed.metadata.title);
  const warnings: string[] = [];

  if (!parsed.raw_url) {
    warnings.push("No irealb:// URL found in input.");
  }

  if (!fixture && parsed.raw_url) {
    warnings.push("Chord body preserved, but this chart does not yet have a decoded chord fixture.");
  }

  return {
    parsed,
    fixture,
    warnings
  };
}

export function extractBrowserIrealLink(value: string): string | null {
  if (value.trim().startsWith("irealb://")) {
    return value.trim();
  }

  return extractIrealLink(value);
}

export function createImportedChartViewModel(input: BrowserChartInput, transpose = 0): ChartViewModel {
  const result = parseBrowserChartInput(input);

  if (result.fixture) {
    return createChartViewModel(result.fixture, {
      transpose,
      parsedIreal: result.parsed,
      sourceKind: sourceKind(input.kind),
      warnings: result.warnings
    });
  }

  return createUnknownImportViewModel(result.parsed, sourceKind(input.kind), result.warnings);
}
