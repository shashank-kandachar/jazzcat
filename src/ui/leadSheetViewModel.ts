import type { UiBarViewModel } from "./chartViewModel.ts";

export type LeadSheetMeasureKind = "chords" | "repeat-previous-bar" | "held";

export interface LeadSheetMeasureViewModel {
  bar: number;
  raw: string | null;
  display_kind: LeadSheetMeasureKind;
  display_symbols: string[];
  marker: "%" | "/" | "N.C." | null;
  chord_count: number;
  region_ids: string[];
  colour_role: string | null;
  section_id: string | null;
  section_label: string | null;
}

function barSignature(bar: UiBarViewModel): string | null {
  if (bar.chords.length === 0) return null;
  return bar.chords.map((chord) => chord.symbol).join("|");
}

function heldMarker(raw: string | null): "/" | "%" | "N.C." {
  const value = raw?.trim() ?? "";
  if (value === "%") return "%";
  if (/^n\.?c\.?$/i.test(value)) return "N.C.";
  return "/";
}

export function createLeadSheetMeasures(bars: UiBarViewModel[]): LeadSheetMeasureViewModel[] {
  let previousSignature: string | null = null;

  return bars.map((bar) => {
    const signature = barSignature(bar);
    const repeatsPrevious = signature !== null && signature === previousSignature;
    const displayKind: LeadSheetMeasureKind = bar.chords.length === 0 ? "held" : repeatsPrevious ? "repeat-previous-bar" : "chords";

    if (signature) {
      previousSignature = signature;
    }

    return {
      bar: bar.bar,
      raw: bar.raw,
      display_kind: displayKind,
      display_symbols: displayKind === "chords" ? bar.chords.map((chord) => chord.display_symbol) : [],
      marker: displayKind === "held" ? heldMarker(bar.raw) : displayKind === "repeat-previous-bar" ? "%" : null,
      chord_count: bar.chords.length,
      region_ids: bar.region_ids,
      colour_role: bar.colour_role,
      section_id: bar.section_id,
      section_label: bar.section_label
    };
  });
}
