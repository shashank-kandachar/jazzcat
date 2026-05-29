import { transposePitchName } from "./intervals.ts";

export function majorScaleSuggestions(thinkV: string, tonic: string): { inside_scale: string; tension_scale: string } {
  const alteredSource = transposePitchName(thinkV, 1, true);
  return {
    inside_scale: `${thinkV} Mixolydian / ${tonic} major`,
    tension_scale: `${thinkV} altered / ${alteredSource} melodic minor`
  };
}

export function minorScaleSuggestions(thinkV: string, tonic: string): { inside_scale: string; tension_scale: string } {
  const alteredSource = transposePitchName(thinkV, 1, true);
  return {
    inside_scale: `${thinkV} Phrygian dominant / ${tonic} harmonic minor`,
    tension_scale: `${thinkV} altered / ${alteredSource} melodic minor`
  };
}

export function dominantScaleSuggestions(thinkV: string, target: string): { inside_scale: string; tension_scale: string } {
  const alteredSource = transposePitchName(thinkV, 1, true);
  return {
    inside_scale: `${thinkV} Mixolydian resolving to ${target}`,
    tension_scale: `${thinkV} altered / ${alteredSource} melodic minor`
  };
}
