import type { ChartViewModel } from "./chartViewModel.ts";
import { nextTransposeShift } from "./transposeControls.ts";

export interface JazzCatAppState {
  active_slug: string;
  active_region_index: number;
  transpose_shift: number;
  imported_model: ChartViewModel | null;
}

export function createInitialAppState(activeSlug: string): JazzCatAppState {
  return {
    active_slug: activeSlug,
    active_region_index: 0,
    transpose_shift: 0,
    imported_model: null
  };
}

export function selectRegion(state: JazzCatAppState, regionIndex: number): JazzCatAppState {
  return {
    ...state,
    active_region_index: Math.max(0, regionIndex)
  };
}

export function selectDemoTune(state: JazzCatAppState, slug: string): JazzCatAppState {
  return {
    active_slug: slug,
    active_region_index: 0,
    transpose_shift: 0,
    imported_model: null
  };
}

export function transposeState(state: JazzCatAppState, delta: number): JazzCatAppState {
  return {
    ...state,
    active_region_index: 0,
    transpose_shift: nextTransposeShift(state.transpose_shift, delta)
  };
}
