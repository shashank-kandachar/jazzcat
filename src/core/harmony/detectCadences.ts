import type { ChartChord, Confidence, HarmonyAnalysis } from "../types.ts";
import { parseChord } from "../chord/parseChord.ts";
import {
  dominantForTarget,
  intervalSemitones,
  keyLabel,
  preferFlatNames,
  targetFromDominant
} from "./intervals.ts";
import { dominantScaleSuggestions, majorScaleSuggestions, minorScaleSuggestions } from "./scaleSuggestions.ts";
import { targetTonesFor } from "./practiceHints.ts";

function isDominant(chord: ChartChord): boolean {
  return chord.parsed.quality === "7" || chord.parsed.quality === "7sus";
}

function isMinorSeven(chord: ChartChord): boolean {
  return chord.parsed.quality === "m7";
}

function isHalfDiminished(chord: ChartChord): boolean {
  return chord.parsed.quality === "m7b5";
}

function isMajorTarget(chord: ChartChord): boolean {
  return ["major", "maj", "maj7", "6"].includes(chord.parsed.quality);
}

function isMinorTarget(chord: ChartChord): boolean {
  return ["m", "m6", "m7", "mmaj7"].includes(chord.parsed.quality);
}

function chartChord(raw: string, index: number): ChartChord {
  return {
    bar: index + 1,
    raw,
    parsed: parseChord(raw)
  };
}

export function toChartChords(chords: string[]): ChartChord[] {
  return chords.map(chartChord);
}

function chordSymbols(chords: ChartChord[]): string[] {
  return chords.map((chord) => chord.parsed.symbol);
}

function span(chords: ChartChord[]): { start_bar: number; end_bar: number } {
  return {
    start_bar: chords[0].bar,
    end_bar: chords[chords.length - 1].bar
  };
}

function analysis(
  chords: ChartChord[],
  localKey: string,
  fn: string,
  confidence: Confidence,
  practiceHint: string,
  extras: Partial<HarmonyAnalysis> = {}
): HarmonyAnalysis {
  return {
    span: span(chords),
    chords: chordSymbols(chords),
    local_key: localKey,
    function: fn,
    confidence,
    practice_hint: practiceHint,
    ...extras
  };
}

function rootsPreferFlats(chords: ChartChord[]): boolean {
  return preferFlatNames(...chords.flatMap((chord) => [chord.parsed.root, chord.parsed.bass]));
}

function isFourthMove(from: ChartChord, to: ChartChord): boolean {
  return intervalSemitones(from.parsed.root, to.parsed.root) === 5;
}

function detectMajorTwoFiveOneFour(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group = chords.slice(index, index + 4);
  if (group.length < 4) return null;
  const [two, five, one, four] = group;
  if (!isMinorSeven(two) || !isDominant(five) || !isMajorTarget(one) || !isMajorTarget(four)) return null;
  if (!isFourthMove(two, five) || !isFourthMove(five, one) || !isFourthMove(one, four)) return null;

  const key = keyLabel(one.parsed.root, "major");
  const hint = `Think ${five.parsed.symbol} language across the ii-V, then resolve to ${one.parsed.symbol}.`;
  return analysis(group, key, "ii-V-I-IV", "high", hint, {
    reason: "A minor ii chord moves by fourth to V, resolves by fourth to I, then continues to IV: a strong major-key cadence area.",
    think_v: five.parsed.symbol,
    resolve_to: one.parsed.symbol,
    scale_suggestions: majorScaleSuggestions(five.parsed.root, one.parsed.root),
    target_tones: targetTonesFor(one.parsed.symbol)
  });
}

function detectBackdoor(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group = chords.slice(index, index + 3);
  if (group.length < 3) return null;
  const [minorSubdominant, backdoorDominant, target] = group;
  if (!isMinorSeven(minorSubdominant) || !isDominant(backdoorDominant) || !isMajorTarget(target)) return null;
  if (!isFourthMove(minorSubdominant, backdoorDominant)) return null;
  if (intervalSemitones(backdoorDominant.parsed.root, target.parsed.root) !== 2) return null;

  const realV = dominantForTarget(target.parsed.root, rootsPreferFlats(group));
  const key = keyLabel(target.parsed.root, "major");
  const hint = `Use ${backdoorDominant.parsed.symbol} backdoor dominant colour resolving to ${target.parsed.symbol}.`;
  return analysis(group, key, "backdoor ii-V to I", "medium", hint, {
    reason: "The ivm7-bVII7 sound resolves by whole step into a major tonic, so it is useful but slightly less literal than a diatonic ii-V-I.",
    think_v: backdoorDominant.parsed.symbol,
    resolve_to: target.parsed.symbol,
    scale_suggestions: dominantScaleSuggestions(realV, target.parsed.root),
    target_tones: targetTonesFor(target.parsed.symbol),
    alternate_interpretations: [
      {
        function: `subdominant minor colour into ${target.parsed.root}`,
        local_key: key,
        confidence: "medium",
        reason: "The ivm7 to bVII7 motion resolves by whole step into a major tonic."
      }
    ]
  });
}

function detectMinorTwoFiveOne(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group = chords.slice(index, index + 3);
  if (group.length < 3) return null;
  const [two, five, one] = group;
  if (!isHalfDiminished(two) || !isDominant(five) || !isMinorTarget(one)) return null;
  if (!isFourthMove(two, five) || !isFourthMove(five, one)) return null;

  const key = keyLabel(one.parsed.root, "minor");
  const hint = `Think ${five.parsed.symbol} altered or ${five.parsed.root} Phrygian dominant, then resolve to ${one.parsed.root} minor.`;
  return analysis(group, key, "iiø-V-i", "high", hint, {
    reason: "Half-diminished ii moves to dominant V and resolves by fourth into a minor tonic: a strong minor cadence.",
    think_v: five.parsed.symbol,
    resolve_to: one.parsed.symbol,
    scale_suggestions: minorScaleSuggestions(five.parsed.root, one.parsed.root),
    target_tones: targetTonesFor(one.parsed.symbol)
  });
}

function detectMajorTwoFiveOne(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group = chords.slice(index, index + 3);
  if (group.length < 3) return null;
  const [two, five, one] = group;
  if (!isMinorSeven(two) || !isDominant(five) || !isMajorTarget(one)) return null;
  if (!isFourthMove(two, five) || !isFourthMove(five, one)) return null;

  const key = keyLabel(one.parsed.root, "major");
  const hint = `Think ${five.parsed.symbol} language across the ii-V, then resolve to ${one.parsed.symbol}.`;
  return analysis(group, key, "ii-V-I", "high", hint, {
    reason: "Minor ii moves to dominant V and resolves by fourth into a major tonic: the clearest major-key cadence pattern.",
    think_v: five.parsed.symbol,
    resolve_to: one.parsed.symbol,
    scale_suggestions: majorScaleSuggestions(five.parsed.root, one.parsed.root),
    target_tones: targetTonesFor(one.parsed.symbol)
  });
}

function detectTritoneSub(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group = chords.slice(index, index + 2);
  if (group.length < 2) return null;
  const [subV, target] = group;
  if (!isDominant(subV) || !isMajorTarget(target)) return null;
  if (intervalSemitones(subV.parsed.root, target.parsed.root) !== 11) return null;

  const realV = dominantForTarget(target.parsed.root, rootsPreferFlats(group));
  const key = keyLabel(target.parsed.root, "major");
  const hint = `Treat ${subV.parsed.symbol} as tritone colour for ${realV}7, then resolve to ${target.parsed.symbol}.`;
  return analysis(group, key, "tritone sub for V7 resolving to I", "medium", hint, {
    reason: "The dominant root sits a half-step above the target, a common tritone-substitute resolution into a major chord.",
    think_v: `${realV}7`,
    resolve_to: target.parsed.symbol,
    scale_suggestions: dominantScaleSuggestions(realV, target.parsed.root),
    target_tones: targetTonesFor(target.parsed.symbol)
  });
}

function detectDominantResolution(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group = chords.slice(index, index + 2);
  if (group.length < 2) return null;
  const [dominant, target] = group;
  if (!isDominant(dominant) || !isFourthMove(dominant, target)) return null;

  if (isMajorTarget(target)) {
    const key = keyLabel(target.parsed.root, "major");
    const hint = `Think ${dominant.parsed.symbol} tension, then resolve to ${target.parsed.symbol}.`;
    return analysis(group, key, "V-I", "high", hint, {
      reason: "Dominant resolves by fourth into a major tonic chord.",
      think_v: dominant.parsed.symbol,
      resolve_to: target.parsed.symbol,
      scale_suggestions: dominantScaleSuggestions(dominant.parsed.root, target.parsed.root),
      target_tones: targetTonesFor(target.parsed.symbol)
    });
  }

  if (["m", "m6", "mmaj7"].includes(target.parsed.quality)) {
    const key = keyLabel(target.parsed.root, "minor");
    const hint = `Think ${dominant.parsed.symbol} tension, then resolve to ${target.parsed.root} minor chord tones.`;
    return analysis(group, key, "V-i", "high", hint, {
      reason: "Dominant resolves by fourth into a minor tonic chord.",
      think_v: dominant.parsed.symbol,
      resolve_to: target.parsed.symbol,
      scale_suggestions: minorScaleSuggestions(dominant.parsed.root, target.parsed.root),
      target_tones: targetTonesFor(target.parsed.symbol)
    });
  }

  if (target.parsed.quality === "m7") {
    const key = keyLabel(target.parsed.root, "minor");
    const hint = `Treat ${dominant.parsed.symbol} as a temporary V resolving to ${target.parsed.symbol}.`;
    return analysis(group, key, "secondary dominant", "medium", hint, {
      reason: "Dominant resolves by fourth into a minor seventh chord, so JazzCat treats it as a temporary tonicisation.",
      think_v: dominant.parsed.symbol,
      resolve_to: target.parsed.symbol,
      scale_suggestions: dominantScaleSuggestions(dominant.parsed.root, target.parsed.root),
      target_tones: targetTonesFor(target.parsed.symbol),
      alternate_interpretations: [
        {
          function: `V of ${target.parsed.root} minor`,
          local_key: key,
          confidence: "medium",
          reason: "Dominant root resolves by perfect fourth into a minor seventh chord."
        }
      ]
    });
  }

  return null;
}

function detectMinorTwoFive(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group = chords.slice(index, index + 2);
  if (group.length < 2) return null;
  const [two, five] = group;
  if (!isHalfDiminished(two) || !isDominant(five) || !isFourthMove(two, five)) return null;

  const preferFlats = rootsPreferFlats(group);
  const target = targetFromDominant(five.parsed.root, preferFlats);
  const key = keyLabel(target, "minor");
  const hint = `Think ${five.parsed.symbol} tension; expect resolution to ${target} minor.`;
  return analysis(group, key, "iiø-V", "medium", hint, {
    reason: "The minor iiø-V motion is clear, but the tonic chord is implied rather than present.",
    think_v: five.parsed.symbol,
    resolve_to: `${target}m`,
    scale_suggestions: minorScaleSuggestions(five.parsed.root, target),
    target_tones: targetTonesFor(`${target}m`)
  });
}

function detectMajorTwoFive(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group = chords.slice(index, index + 2);
  if (group.length < 2) return null;
  const [two, five] = group;
  if (!isMinorSeven(two) || !isDominant(five) || !isFourthMove(two, five)) return null;

  const preferFlats = rootsPreferFlats(group);
  const target = targetFromDominant(five.parsed.root, preferFlats);
  const key = keyLabel(target, "major");
  const hint = `Think ${five.parsed.symbol} language; expect resolution to ${target}.`;
  return analysis(group, key, "ii-V", "medium", hint, {
    reason: "The ii-V motion is clear, but the tonic chord is implied rather than present.",
    think_v: five.parsed.symbol,
    resolve_to: target,
    scale_suggestions: majorScaleSuggestions(five.parsed.root, target),
    target_tones: targetTonesFor(target)
  });
}

function detectTurnaround(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group = chords.slice(index, index + 4);
  if (group.length < 4) return null;
  const [one, six, two, five] = group;
  if (!isMajorTarget(one) || !isMinorSeven(six) || !isMinorSeven(two) || !isDominant(five)) return null;
  if (!isFourthMove(six, two) || !isFourthMove(two, five)) return null;

  const target = targetFromDominant(five.parsed.root, rootsPreferFlats(group));
  if (target !== one.parsed.root) return null;

  const key = keyLabel(one.parsed.root, "major");
  const hint = `Hear ${one.parsed.symbol} as home, then use ${five.parsed.symbol} to turn back toward ${one.parsed.root}.`;
  return analysis(group, key, "I-vi-ii-V turnaround", "medium", hint, {
    reason: "A tonic major chord moves through vi-ii-V, a common turnaround that points back to the same key centre.",
    think_v: five.parsed.symbol,
    resolve_to: one.parsed.symbol,
    scale_suggestions: majorScaleSuggestions(five.parsed.root, one.parsed.root),
    target_tones: targetTonesFor(one.parsed.symbol)
  });
}

function detectDominantChain(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const group: ChartChord[] = [];
  let cursor = index;

  while (cursor < chords.length && isDominant(chords[cursor])) {
    if (group.length > 0 && !isFourthMove(group[group.length - 1], chords[cursor])) break;
    group.push(chords[cursor]);
    cursor += 1;
  }

  if (group.length < 3) return null;

  const preferFlats = rootsPreferFlats(group);
  const impliedTarget = targetFromDominant(group[group.length - 1].parsed.root, preferFlats);
  const following = chords[cursor] ?? null;
  const resolvesToFollowing = following && isFourthMove(group[group.length - 1], following);
  const fullGroup = resolvesToFollowing ? [...group, following] : group;
  const targetSymbol = resolvesToFollowing ? following.parsed.symbol : impliedTarget;
  const targetRoot = resolvesToFollowing ? following.parsed.root : impliedTarget;
  const mode = resolvesToFollowing && isMinorTarget(following) ? "minor" : "major";
  const key = keyLabel(targetRoot, mode);
  const hint = `Follow each dominant by fourth, then aim ${group[group.length - 1].parsed.symbol} toward ${targetSymbol}.`;

  return analysis(fullGroup, key, resolvesToFollowing ? "dominant chain to I" : "dominant chain", "medium", hint, {
    reason: "Three or more dominants move by fourths, creating a chain of temporary V sounds and forward motion.",
    think_v: group[group.length - 1].parsed.symbol,
    resolve_to: targetSymbol,
    scale_suggestions: dominantScaleSuggestions(group[group.length - 1].parsed.root, targetRoot),
    target_tones: targetTonesFor(targetSymbol),
    alternate_interpretations: [
      {
        function: "sequence of secondary dominants",
        local_key: key,
        confidence: "medium",
        reason: "Each dominant can be practised as a V of the next chord in the chain."
      }
    ]
  });
}

function detectStaticVamp(chords: ChartChord[], index: number): HarmonyAnalysis | null {
  const first = chords[index];
  const group = [first];
  let cursor = index + 1;

  while (cursor < chords.length) {
    const next = chords[cursor];
    if (next.parsed.root !== first.parsed.root || next.parsed.quality !== first.parsed.quality) break;
    group.push(next);
    cursor += 1;
  }

  if (group.length < 2) return null;

  const mode = isMinorTarget(first) || isHalfDiminished(first) ? "minor" : "major";
  const key = keyLabel(first.parsed.root, mode);
  const chordQuality = mode === "minor" ? "minor or Dorian" : "major";
  return analysis(group, key, "modal/static vamp", "medium", `Treat ${first.parsed.symbol} as a static ${chordQuality} sound and build melody from chord tones first.`, {
    reason: "The same harmony is repeated, so JazzCat avoids a cadence claim and treats the span as a static practice area.",
    target_tones: targetTonesFor(first.parsed.symbol),
    alternate_interpretations: [
      {
        function: "static modal area",
        local_key: key,
        confidence: "medium",
        reason: "Repeated harmony points more to sound and texture than to functional resolution."
      }
    ]
  });
}

function detectAmbiguous(chords: ChartChord[], index: number): HarmonyAnalysis {
  const chord = chords[index];
  const mode = isMinorTarget(chord) || isHalfDiminished(chord) ? "minor" : "major";
  const key = keyLabel(chord.parsed.root, mode);
  return analysis([chord], key, "ambiguous-region", "low", "No strong cadence claim; use the chord tones and listen for the next resolution.", {
    reason: "The local pattern did not match a high-confidence v0.1 cadence rule.",
    alternate_interpretations: [
      {
        function: "static harmony or connective chord",
        local_key: key,
        confidence: "low",
        reason: "Single-chord spans need surrounding context before JazzCat should overstate a key centre."
      }
    ]
  });
}

const DETECTORS = [
  detectMajorTwoFiveOneFour,
  detectBackdoor,
  detectMinorTwoFiveOne,
  detectMajorTwoFiveOne,
  detectTurnaround,
  detectDominantChain,
  detectStaticVamp,
  detectTritoneSub,
  detectDominantResolution,
  detectMinorTwoFive,
  detectMajorTwoFive
];

export function detectCadences(chords: ChartChord[]): HarmonyAnalysis[] {
  const results: HarmonyAnalysis[] = [];
  let index = 0;

  while (index < chords.length) {
    const detected = DETECTORS.map((detector) => detector(chords, index)).find((item): item is HarmonyAnalysis => item !== null);
    if (detected) {
      results.push(detected);
      index += detected.chords.length;
      continue;
    }

    results.push(detectAmbiguous(chords, index));
    index += 1;
  }

  return results;
}
