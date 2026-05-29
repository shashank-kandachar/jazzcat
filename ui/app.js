const data = window.JAZZCAT_PREVIEW_DATA;

const state = {
  activeSlug: data.demo_tunes[0]?.slug ?? "",
  regionIndex: 0,
  shift: 0,
  importInfo: null,
  unknownModel: null,
  plainText: null,
  keyTrainerMode: "original"
};

const elements = {
  tuneTitle: document.querySelector("#tune-title"),
  metaComposer: document.querySelector("#meta-composer"),
  metaKey: document.querySelector("#meta-key"),
  metaStyle: document.querySelector("#meta-style"),
  metaTempo: document.querySelector("#meta-tempo"),
  metaShift: document.querySelector("#meta-shift"),
  metaRegions: document.querySelector("#meta-regions"),
  confidenceSummary: document.querySelector("#confidence-summary"),
  irealStatus: document.querySelector("#ireal-status"),
  demoSelect: document.querySelector("#demo-select"),
  loadDemoButton: document.querySelector("#load-demo-button"),
  irealInput: document.querySelector("#ireal-input"),
  analysePasteButton: document.querySelector("#analyse-paste-button"),
  htmlFileInput: document.querySelector("#html-file-input"),
  analyseUploadButton: document.querySelector("#analyse-upload-button"),
  plainTitleInput: document.querySelector("#plain-title-input"),
  plainKeyInput: document.querySelector("#plain-key-input"),
  plainTextInput: document.querySelector("#plain-text-input"),
  analysePlainTextButton: document.querySelector("#analyse-plain-text-button"),
  warningList: document.querySelector("#warning-list"),
  transposeDown: document.querySelector("#transpose-down"),
  transposeUp: document.querySelector("#transpose-up"),
  transposeReset: document.querySelector("#transpose-reset"),
  transposeLabel: document.querySelector("#transpose-label"),
  chartGrid: document.querySelector("#chart-grid"),
  regionList: document.querySelector("#region-list"),
  regionDetail: document.querySelector("#region-detail"),
  practiceList: document.querySelector("#practice-list"),
  keyTrainerMode: document.querySelector("#key-trainer-mode"),
  keyTrainerList: document.querySelector("#key-trainer-list"),
  copyPackButton: document.querySelector("#copy-pack-button"),
  downloadPackButton: document.querySelector("#download-pack-button"),
  payloadPreview: document.querySelector("#payload-preview"),
  payloadLength: document.querySelector("#payload-length")
};

const NOTE_TO_PC = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11
};

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const SUPPORTED_QUALITIES = new Set(["major", "maj", "maj7", "6", "m", "m6", "m7", "m7b5", "mmaj7", "7", "7sus", "dim7"]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function aliasKey(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function wrapShift(value) {
  const wrapped = ((value % 12) + 12) % 12;
  return wrapped > 6 ? wrapped - 12 : wrapped;
}

function formatShift(value) {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : String(value);
}

function normalisePitchName(note) {
  const match = /^([A-Ga-g])([#b]?)/.exec(String(note).trim());
  if (!match) throw new Error(`Invalid pitch name: ${note}`);
  return `${match[1].toUpperCase()}${match[2] ?? ""}`;
}

function pitchClass(note) {
  const value = NOTE_TO_PC[normalisePitchName(note)];
  if (value === undefined) throw new Error(`Unknown pitch name: ${note}`);
  return value;
}

function noteName(pc, preferFlats = false) {
  const wrapped = ((pc % 12) + 12) % 12;
  return preferFlats ? FLAT_NAMES[wrapped] : SHARP_NAMES[wrapped];
}

function intervalSemitones(from, to) {
  return (pitchClass(to) - pitchClass(from) + 12) % 12;
}

function transposePitchName(note, semitones, preferFlats = false) {
  return noteName(pitchClass(note) + semitones, preferFlats);
}

function preferFlatNames(...signals) {
  return signals.some((signal) => String(signal ?? "").includes("b") || String(signal ?? "").toLowerCase().includes("flat"));
}

function cleanDescriptor(descriptor) {
  return descriptor
    .replace(/majmin/i, "mmaj")
    .replace(/min/gi, "m")
    .replace(/[∆Δ^]/g, "maj")
    .replace(/-/g, "m")
    .replace(/[øØ]/g, "m7b5")
    .replace(/\(([^)]+)\)/g, "$1");
}

function detectQuality(descriptor) {
  const lower = descriptor.toLowerCase();
  if (lower.startsWith("mmaj7")) return "mmaj7";
  if (lower.startsWith("m7b5")) return "m7b5";
  if (lower.startsWith("dim7") || lower.startsWith("o7")) return "dim7";
  if (lower.startsWith("maj7")) return "maj7";
  if (lower.startsWith("maj")) return "maj";
  if (lower.startsWith("m7")) return "m7";
  if (lower.startsWith("m6")) return "m6";
  if (lower.startsWith("m")) return "m";
  if (lower.startsWith("7sus")) return "7sus";
  if (lower.startsWith("7")) return "7";
  if (lower.startsWith("13") || lower.startsWith("11") || lower.startsWith("9")) return "7";
  if (lower.startsWith("6")) return "6";
  if (lower === "") return "major";
  return descriptor;
}

function extractExtensions(descriptor, quality) {
  const matches = descriptor.match(/#11|b13|#9|b9|#5|b5|13|11|9/g) ?? [];
  const filtered = matches.filter((extension) => {
    if (quality === "m7b5" && extension === "b5") return false;
    if ((quality === "7" || quality === "7sus") && ["9", "11", "13"].includes(extension) && descriptor.toLowerCase().startsWith(extension)) return false;
    return true;
  });
  if (descriptor.toLowerCase().startsWith("9")) return ["9", ...filtered];
  if (descriptor.toLowerCase().startsWith("11")) return ["11", ...filtered];
  if (descriptor.toLowerCase().startsWith("13")) return ["13", ...filtered];
  return [...new Set(filtered)];
}

function formatChord(chord) {
  const quality = chord.quality === "major" ? "" : chord.quality;
  const extensionSuffix = chord.extensions.length > 0 ? `(${chord.extensions.join(",")})` : "";
  const bass = chord.bass ? `/${chord.bass}` : "";
  return `${chord.root}${quality}${extensionSuffix}${bass}`;
}

function parseChord(raw) {
  const compact = String(raw).trim().replace(/\s+/g, "");
  if (!compact) throw new Error("Cannot parse an empty chord symbol.");
  const [symbolPart, bassPart] = compact.split("/");
  const rootMatch = /^([A-Ga-g][#b]?)/.exec(symbolPart);
  if (!rootMatch) throw new Error(`Cannot parse chord root from: ${raw}`);
  const root = normalisePitchName(rootMatch[1]);
  const descriptor = cleanDescriptor(symbolPart.slice(rootMatch[1].length));
  const quality = detectQuality(descriptor);
  const extensions = extractExtensions(descriptor, quality);
  const bass = bassPart ? normalisePitchName(bassPart) : null;
  const model = { raw, root, quality, extensions, bass };
  return { ...model, symbol: formatChord(model) };
}

function transposeChord(raw, semitones, preferFlats = false) {
  const chord = parseChord(raw);
  const model = {
    raw: chord.raw,
    root: transposePitchName(chord.root, semitones, preferFlats),
    quality: chord.quality,
    extensions: [...chord.extensions],
    bass: chord.bass ? transposePitchName(chord.bass, semitones, preferFlats) : null
  };
  return formatChord(model);
}

function transposeChart(chords, semitones, preferFlats = false) {
  return chords.map((chord) => transposeChord(chord, semitones, preferFlats));
}

function stripToken(token) {
  return token.trim().replace(/^[|:[\]{}]+|[|:[\]{}]+$/g, "");
}

function splitChordTokens(bar) {
  return bar
    .replace(/,/g, " ")
    .replace(/\s+\/\s+/g, " ")
    .split(/\s+/)
    .map(stripToken)
    .filter(Boolean);
}

function splitPlainTextBars(input) {
  const trimmed = input.trim();
  if (!trimmed) return [];
  if (trimmed.includes("[") && trimmed.includes("]")) {
    const bracketed = [...trimmed.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim()).filter(Boolean);
    if (bracketed.length > 0) return bracketed;
  }
  if (trimmed.includes("|")) return trimmed.split("|").map((bar) => bar.trim()).filter(Boolean);
  const lines = trimmed.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return splitChordTokens(trimmed);
}

function parsePlainTextChart(input) {
  const warnings = [];
  const explicitBars = input.includes("|") || (input.includes("[") && input.includes("]"));
  const rawBars = splitPlainTextBars(input);
  const bars = [];
  const chords = [];

  rawBars.forEach((rawBar) => {
    const parsedTokens = splitChordTokens(rawBar)
      .map((token) => {
        try {
          const chord = parseChord(token);
          if (!SUPPORTED_QUALITIES.has(chord.quality)) {
            warnings.push(`Unparseable chord token skipped: ${token}`);
            return null;
          }
          return chord.symbol;
        } catch {
          warnings.push(`Unparseable chord token skipped: ${token}`);
          return null;
        }
      })
      .filter(Boolean);

    if (parsedTokens.length === 0) return;

    if (explicitBars || rawBars.length > 1) {
      bars.push({ bar: bars.length + 1, raw: rawBar, chords: parsedTokens });
    } else {
      parsedTokens.forEach((chord) => bars.push({ bar: bars.length + 1, raw: chord, chords: [chord] }));
    }
    chords.push(...parsedTokens);
  });

  if (rawBars.length === 0) warnings.push("No chord text found.");
  else if (chords.length === 0) warnings.push("No parseable chords found.");
  return { bars, chords, warnings: [...new Set(warnings)] };
}

function chartChord(raw, index) {
  return { bar: index + 1, raw, parsed: parseChord(raw) };
}

function isDominant(chord) {
  return chord.parsed.quality === "7" || chord.parsed.quality === "7sus";
}

function isMinorSeven(chord) {
  return chord.parsed.quality === "m7";
}

function isHalfDiminished(chord) {
  return chord.parsed.quality === "m7b5";
}

function isMajorTarget(chord) {
  return ["major", "maj", "maj7", "6"].includes(chord.parsed.quality);
}

function isMinorTarget(chord) {
  return ["m", "m6", "m7", "mmaj7"].includes(chord.parsed.quality);
}

function isFourthMove(from, to) {
  return intervalSemitones(from.parsed.root, to.parsed.root) === 5;
}

function chordSymbols(chords) {
  return chords.map((chord) => chord.parsed.symbol);
}

function keyLabel(root, mode) {
  return `${root} ${mode}`;
}

function targetFromDominant(root, preferFlats = false) {
  return transposePitchName(root, 5, preferFlats);
}

function dominantForTarget(root, preferFlats = false) {
  return transposePitchName(root, -5, preferFlats);
}

function targetTonesFor(resolveTo) {
  return [`3rd of ${resolveTo}`, `7th of ${resolveTo}`, `root of ${resolveTo}`];
}

function majorScaleSuggestions(thinkV, tonic) {
  return { inside_scale: `${thinkV} Mixolydian / ${tonic} major`, tension_scale: `${thinkV} altered / ${transposePitchName(thinkV, 1, true)} melodic minor` };
}

function minorScaleSuggestions(thinkV, tonic) {
  return { inside_scale: `${thinkV} Phrygian dominant / ${tonic} harmonic minor`, tension_scale: `${thinkV} altered / ${transposePitchName(thinkV, 1, true)} melodic minor` };
}

function dominantScaleSuggestions(thinkV, target) {
  return { inside_scale: `${thinkV} Mixolydian resolving to ${target}`, tension_scale: `${thinkV} altered / ${transposePitchName(thinkV, 1, true)} melodic minor` };
}

function analysisFor(chords, localKey, functionName, confidence, practiceHint, extras = {}) {
  return {
    span: { start_bar: chords[0].bar, end_bar: chords[chords.length - 1].bar },
    chords: chordSymbols(chords),
    local_key: localKey,
    function: functionName,
    confidence,
    practice_hint: practiceHint,
    ...extras
  };
}

function detectAt(chords, index) {
  const four = chords.slice(index, index + 4);
  if (four.length >= 4) {
    const [two, five, one, fourChord] = four;
    if (isMinorSeven(two) && isDominant(five) && isMajorTarget(one) && isMajorTarget(fourChord) && isFourthMove(two, five) && isFourthMove(five, one) && isFourthMove(one, fourChord)) {
      return analysisFor(four, keyLabel(one.parsed.root, "major"), "ii-V-I-IV", "high", `Think ${five.parsed.symbol} language across the ii-V, then resolve to ${one.parsed.symbol}.`, {
        think_v: five.parsed.symbol,
        resolve_to: one.parsed.symbol,
        scale_suggestions: majorScaleSuggestions(five.parsed.root, one.parsed.root),
        target_tones: targetTonesFor(one.parsed.symbol)
      });
    }
  }

  const three = chords.slice(index, index + 3);
  if (three.length >= 3) {
    const [first, second, third] = three;
    if (isMinorSeven(first) && isDominant(second) && isMajorTarget(third) && isFourthMove(first, second) && intervalSemitones(second.parsed.root, third.parsed.root) === 2) {
      const realV = dominantForTarget(third.parsed.root, preferFlatNames(...chordSymbols(three)));
      return analysisFor(three, keyLabel(third.parsed.root, "major"), "backdoor ii-V to I", "medium", `Use ${second.parsed.symbol} backdoor dominant colour resolving to ${third.parsed.symbol}.`, {
        think_v: second.parsed.symbol,
        resolve_to: third.parsed.symbol,
        scale_suggestions: dominantScaleSuggestions(realV, third.parsed.root),
        target_tones: targetTonesFor(third.parsed.symbol)
      });
    }
    if (isHalfDiminished(first) && isDominant(second) && isMinorTarget(third) && isFourthMove(first, second) && isFourthMove(second, third)) {
      return analysisFor(three, keyLabel(third.parsed.root, "minor"), "iiø-V-i", "high", `Think ${second.parsed.symbol} altered or ${second.parsed.root} Phrygian dominant, then resolve to ${third.parsed.root} minor.`, {
        think_v: second.parsed.symbol,
        resolve_to: third.parsed.symbol,
        scale_suggestions: minorScaleSuggestions(second.parsed.root, third.parsed.root),
        target_tones: targetTonesFor(third.parsed.symbol)
      });
    }
    if (isMinorSeven(first) && isDominant(second) && isMajorTarget(third) && isFourthMove(first, second) && isFourthMove(second, third)) {
      return analysisFor(three, keyLabel(third.parsed.root, "major"), "ii-V-I", "high", `Think ${second.parsed.symbol} language across the ii-V, then resolve to ${third.parsed.symbol}.`, {
        think_v: second.parsed.symbol,
        resolve_to: third.parsed.symbol,
        scale_suggestions: majorScaleSuggestions(second.parsed.root, third.parsed.root),
        target_tones: targetTonesFor(third.parsed.symbol)
      });
    }
  }

  const two = chords.slice(index, index + 2);
  if (two.length >= 2) {
    const [first, second] = two;
    if (isDominant(first) && isMajorTarget(second) && intervalSemitones(first.parsed.root, second.parsed.root) === 11) {
      const realV = dominantForTarget(second.parsed.root, preferFlatNames(...chordSymbols(two)));
      return analysisFor(two, keyLabel(second.parsed.root, "major"), "tritone sub for V7 resolving to I", "medium", `Treat ${first.parsed.symbol} as tritone colour for ${realV}7, then resolve to ${second.parsed.symbol}.`, {
        think_v: `${realV}7`,
        resolve_to: second.parsed.symbol,
        scale_suggestions: dominantScaleSuggestions(realV, second.parsed.root),
        target_tones: targetTonesFor(second.parsed.symbol)
      });
    }
    if (isDominant(first) && isFourthMove(first, second)) {
      if (isMajorTarget(second)) {
        return analysisFor(two, keyLabel(second.parsed.root, "major"), "V-I", "high", `Think ${first.parsed.symbol} tension, then resolve to ${second.parsed.symbol}.`, {
          think_v: first.parsed.symbol,
          resolve_to: second.parsed.symbol,
          scale_suggestions: dominantScaleSuggestions(first.parsed.root, second.parsed.root),
          target_tones: targetTonesFor(second.parsed.symbol)
        });
      }
      if (["m", "m6", "mmaj7"].includes(second.parsed.quality)) {
        return analysisFor(two, keyLabel(second.parsed.root, "minor"), "V-i", "high", `Think ${first.parsed.symbol} tension, then resolve to ${second.parsed.root} minor chord tones.`, {
          think_v: first.parsed.symbol,
          resolve_to: second.parsed.symbol,
          scale_suggestions: minorScaleSuggestions(first.parsed.root, second.parsed.root),
          target_tones: targetTonesFor(second.parsed.symbol)
        });
      }
      if (second.parsed.quality === "m7") {
        return analysisFor(two, keyLabel(second.parsed.root, "minor"), "secondary dominant", "medium", `Treat ${first.parsed.symbol} as a temporary V resolving to ${second.parsed.symbol}.`, {
          think_v: first.parsed.symbol,
          resolve_to: second.parsed.symbol,
          scale_suggestions: dominantScaleSuggestions(first.parsed.root, second.parsed.root),
          target_tones: targetTonesFor(second.parsed.symbol)
        });
      }
    }
    if (isHalfDiminished(first) && isDominant(second) && isFourthMove(first, second)) {
      const target = targetFromDominant(second.parsed.root, preferFlatNames(...chordSymbols(two)));
      return analysisFor(two, keyLabel(target, "minor"), "iiø-V", "medium", `Think ${second.parsed.symbol} tension; expect resolution to ${target} minor.`, {
        think_v: second.parsed.symbol,
        resolve_to: `${target}m`,
        scale_suggestions: minorScaleSuggestions(second.parsed.root, target),
        target_tones: targetTonesFor(`${target}m`)
      });
    }
    if (isMinorSeven(first) && isDominant(second) && isFourthMove(first, second)) {
      const target = targetFromDominant(second.parsed.root, preferFlatNames(...chordSymbols(two)));
      return analysisFor(two, keyLabel(target, "major"), "ii-V", "medium", `Think ${second.parsed.symbol} language; expect resolution to ${target}.`, {
        think_v: second.parsed.symbol,
        resolve_to: target,
        scale_suggestions: majorScaleSuggestions(second.parsed.root, target),
        target_tones: targetTonesFor(target)
      });
    }
  }

  const chord = chords[index];
  const mode = isMinorTarget(chord) || isHalfDiminished(chord) ? "minor" : "major";
  return analysisFor([chord], keyLabel(chord.parsed.root, mode), "ambiguous-region", "low", "No strong cadence claim; use the chord tones and listen for the next resolution.", {
    reason: "The local pattern did not match a high-confidence cadence rule."
  });
}

function buildRegions(analysis) {
  return analysis.map((item, index) => {
    let colourRole = "ambiguous-region";
    if (item.function.includes("secondary") || item.function.includes("tritone")) colourRole = "modulation-region";
    else if (item.local_key.includes("minor")) colourRole = "minor-key-region";
    else if (item.local_key.includes("major")) colourRole = "major-key-region";
    return {
      region_id: `region-${index + 1}`,
      start_bar: item.span.start_bar,
      end_bar: item.span.end_bar,
      chords: item.chords,
      local_key: item.local_key,
      function: item.function,
      confidence: item.confidence,
      colour_role: colourRole,
      practice_priority: item.confidence
    };
  });
}

function buildPracticeObjects(analysis) {
  return analysis
    .filter((item) => item.think_v && item.resolve_to && item.scale_suggestions)
    .filter((item) => item.function.includes("ii") || item.function.includes("tritone") || item.function.includes("backdoor"))
    .map((item) => ({
      exercise_type: item.function,
      source_chords: item.chords,
      think_v: item.think_v,
      resolve_to: item.resolve_to,
      inside_scale: item.scale_suggestions.inside_scale,
      tension_scale: item.scale_suggestions.tension_scale,
      target_tones: item.target_tones ?? targetTonesFor(item.resolve_to),
      suggested_drills: [
        `Play guide tones through ${item.chords.join(" | ")}.`,
        `Run the line in 12 keys, resolving clearly to ${item.resolve_to}.`,
        `Comp shell voicings, then single-note lines from ${item.think_v}.`
      ]
    }));
}

function analyseProgression(chordSymbolsForAnalysis) {
  const chartChords = chordSymbolsForAnalysis.map(chartChord);
  const analysis = [];
  let index = 0;
  while (index < chartChords.length) {
    const item = detectAt(chartChords, index);
    analysis.push(item);
    index += item.chords.length;
  }
  return {
    chords: chartChords,
    analysis,
    regions: buildRegions(analysis),
    practice_objects: buildPracticeObjects(analysis),
    warnings: []
  };
}

function decodeUrl(url) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function extractIrealLink(input) {
  const trimmed = input.trim();
  if (trimmed.startsWith("irealb://")) return trimmed;

  const hrefMatch = /href=["'](irealb:\/\/[^"']+)["']/i.exec(input);
  if (hrefMatch) return hrefMatch[1].replace(/&amp;/g, "&");

  const looseMatch = /(irealb:\/\/[^\s"'<>]+)/i.exec(input);
  return looseMatch ? looseMatch[1].replace(/&amp;/g, "&") : null;
}

function humanKey(raw) {
  if (!raw) return null;
  return raw.endsWith("-") ? `${raw.slice(0, -1)} minor` : `${raw} major`;
}

function findTempo(parts) {
  const numericParts = parts.map((part) => Number(part)).filter((value) => Number.isInteger(value) && value >= 40 && value <= 300);
  return numericParts.length > 0 ? numericParts[numericParts.length - 1] : null;
}

function findChordBodyIndex(parts) {
  const index = parts.findIndex((part, position) => position > 4 && /[A-G][#b-]?|\|/.test(part) && part.length > 8);
  return index >= 0 ? index : 5;
}

function parseIrealMetadata(rawUrl) {
  const decoded = decodeUrl(rawUrl);
  const encodedBody = rawUrl.replace(/^irealb:\/\//i, "");
  const decodedBody = decoded.replace(/^irealb:\/\//i, "");
  const encodedParts = encodedBody.split("=");
  const parts = decodedBody.split("=");
  const chordBodyIndex = findChordBodyIndex(parts);
  const declaredKeyRaw = parts[4] || null;

  return {
    raw_url: rawUrl,
    raw_decoded_payload: decoded,
    encoded_chord_body_payload: encodedParts[chordBodyIndex] || null,
    decoded_chord_body_payload: parts[chordBodyIndex] || null,
    metadata: {
      title: parts[0] || null,
      composer: parts[1] || null,
      style: parts[3] || null,
      declared_key_raw: declaredKeyRaw,
      declared_key: humanKey(declaredKeyRaw),
      tempo: findTempo(parts)
    }
  };
}

function parseChartInput(kind, value) {
  const trimmed = value.trim();
  const rawUrl = kind === "ireal_link" || trimmed.startsWith("irealb://") ? trimmed : extractIrealLink(value);

  if (!rawUrl) {
    return {
      parsed: {
        raw_url: "",
        raw_decoded_payload: "",
        encoded_chord_body_payload: null,
        decoded_chord_body_payload: null,
        metadata: { title: null, composer: null, style: null, declared_key_raw: null, declared_key: null, tempo: null }
      },
      warnings: ["No irealb:// URL found in input."]
    };
  }

  return { parsed: parseIrealMetadata(rawUrl), warnings: [] };
}

function findDemoByTitle(title) {
  const key = aliasKey(title);
  return data.demo_tunes.find((tune) => tune.aliases.includes(key) || aliasKey(tune.title) === key) ?? null;
}

function demoTune(slug = state.activeSlug) {
  return data.demo_tunes.find((tune) => tune.slug === slug) ?? data.demo_tunes[0];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function payloadView(parsed) {
  const rawDecoded = parsed?.raw_decoded_payload ?? "";
  const decodedBody = parsed?.decoded_chord_body_payload ?? null;
  return {
    raw_url: parsed?.raw_url ?? "",
    raw_decoded_payload: rawDecoded,
    decoded_payload_prefix: rawDecoded.slice(0, 260),
    encoded_chord_body_payload: parsed?.encoded_chord_body_payload ?? null,
    decoded_chord_body_payload: decodedBody,
    chord_body_length: decodedBody?.length ?? 0,
    raw_url_present: Boolean(parsed?.raw_url),
    raw_payload_preserved: Boolean(rawDecoded)
  };
}

function applyImportOverlay(model, importInfo) {
  if (!importInfo) return model;
  const metadata = importInfo.parsed.metadata;
  return {
    ...model,
    source_kind: importInfo.kind === "ireal_link" ? "pasted_ireal" : "uploaded_html",
    title: metadata.title ?? model.title,
    composer: metadata.composer ?? model.composer,
    declared_key: metadata.declared_key ?? model.declared_key,
    style: metadata.style ?? model.style,
    tempo: metadata.tempo ?? model.tempo,
    ireal: payloadView(importInfo.parsed),
    warnings: [...new Set([...(importInfo.warnings ?? []), ...(model.warnings ?? [])])]
  };
}

function createUnknownModel(parsed, kind, warnings) {
  return {
    id: "unknown-ireal-chart",
    source_kind: "unknown_ireal",
    title: parsed.metadata.title ?? "Unknown iReal Chart",
    composer: parsed.metadata.composer ?? null,
    declared_key: parsed.metadata.declared_key ?? null,
    style: parsed.metadata.style ?? null,
    tempo: parsed.metadata.tempo ?? null,
    current_transposition_shift: 0,
    current_transposition_label: "0",
    expected_regions: [],
    bars: [],
    chords: [],
    regions: [],
    analysis: [],
    practice_objects: [],
    ireal: payloadView(parsed),
    warnings: [
      ...new Set([
        ...warnings,
        "Chord body preserved, but this chart does not yet have a decoded chord fixture.",
        `Source accepted as ${kind === "ireal_link" ? "pasted_ireal" : "uploaded_html"}.`
      ])
    ]
  };
}

function regionForSequence(model, sequenceIndex) {
  return model.regions.find((region) => sequenceIndex >= region.start_bar && sequenceIndex <= region.end_bar) ?? null;
}

function createPlainTextModel(input, title, declaredKey, shift) {
  const parsed = parsePlainTextChart(input);
  const preferFlats = preferFlatNames(declaredKey, ...parsed.chords);
  const shiftedChords = shift === 0 ? parsed.chords : transposeChart(parsed.chords, shift, preferFlats);
  const analysed = analyseProgression(shiftedChords);
  const bars = [];
  const chords = [];
  let cursor = 0;

  parsed.bars.forEach((bar) => {
    const barChords = [];
    for (let index = 0; index < bar.chords.length; index += 1) {
      const sequenceIndex = cursor + index + 1;
      const analysedChord = analysed.chords[sequenceIndex - 1];
      const region = analysed.regions.find((item) => sequenceIndex >= item.start_bar && sequenceIndex <= item.end_bar) ?? null;
      const chord = {
        bar: bar.bar,
        sequence_index: sequenceIndex,
        symbol: analysedChord?.parsed.symbol ?? shiftedChords[sequenceIndex - 1],
        root: analysedChord?.parsed.root ?? "",
        quality: analysedChord?.parsed.quality ?? "",
        extensions: analysedChord?.parsed.extensions ?? [],
        bass: analysedChord?.parsed.bass ?? null,
        region_id: region?.region_id ?? null,
        colour_role: region?.colour_role ?? null
      };
      chords.push(chord);
      barChords.push(chord);
    }
    cursor += bar.chords.length;
    bars.push({
      bar: bar.bar,
      chords: barChords,
      region_ids: [...new Set(barChords.map((chord) => chord.region_id).filter(Boolean))],
      colour_role: barChords.find((chord) => chord.colour_role)?.colour_role ?? null
    });
  });

  return {
    id: "plain-text-chart",
    source_kind: "plain_text",
    title: title?.trim() || "Untitled Progression",
    composer: null,
    declared_key: declaredKey?.trim() || null,
    style: "Plain Text",
    tempo: null,
    current_transposition_shift: shift,
    current_transposition_label: formatShift(shift),
    expected_regions: [],
    bars,
    chords,
    regions: analysed.regions,
    analysis: analysed.analysis,
    practice_objects: analysed.practice_objects,
    ireal: payloadView(null),
    warnings: [...parsed.warnings, ...analysed.warnings]
  };
}

function currentModel() {
  if (state.unknownModel) return state.unknownModel;
  if (state.plainText) return createPlainTextModel(state.plainText.text, state.plainText.title, state.plainText.declaredKey, state.shift);
  const selectedTune = demoTune();
  const model = clone(selectedTune.models_by_shift[String(state.shift)] ?? selectedTune.models_by_shift["0"]);
  return applyImportOverlay(model, state.importInfo);
}

function currentAnalysisForRegion(model, regionIndex) {
  return model.analysis[regionIndex] ?? null;
}

function practiceForAnalysis(model, analysis) {
  if (!analysis) return null;
  return model.practice_objects.find((practice) => practice.source_chords.join("|") === analysis.chords.join("|")) ?? null;
}

function setDemo(slug) {
  state.activeSlug = slug;
  state.regionIndex = 0;
  state.shift = 0;
  state.importInfo = null;
  state.unknownModel = null;
  state.plainText = null;
  render();
}

function setImported(kind, value) {
  const result = parseChartInput(kind, value);
  const matchedDemo = findDemoByTitle(result.parsed.metadata.title);

  if (!matchedDemo) {
    state.unknownModel = createUnknownModel(result.parsed, kind, result.warnings);
    state.importInfo = null;
    state.plainText = null;
    state.regionIndex = 0;
    state.shift = 0;
    render();
    return;
  }

  state.activeSlug = matchedDemo.slug;
  state.regionIndex = 0;
  state.shift = 0;
  state.unknownModel = null;
  state.plainText = null;
  state.importInfo = { kind, parsed: result.parsed, warnings: result.warnings };
  elements.demoSelect.value = matchedDemo.slug;
  render();
}

function setPlainText() {
  state.plainText = {
    title: elements.plainTitleInput.value,
    declaredKey: elements.plainKeyInput.value,
    text: elements.plainTextInput.value
  };
  state.importInfo = null;
  state.unknownModel = null;
  state.regionIndex = 0;
  state.shift = 0;
  render();
}

function setRegion(index) {
  state.regionIndex = index;
  render();
}

function setShift(delta) {
  if (state.unknownModel) return;
  state.shift = wrapShift(state.shift + delta);
  state.regionIndex = 0;
  render();
}

function resetShift() {
  state.shift = 0;
  state.regionIndex = 0;
  render();
}

function buildGuitarTasks(analysis, region) {
  if (!analysis) return [];
  const fn = analysis.function;
  const thinkV = analysis.think_v ?? "the V chord";
  const resolveTo = analysis.resolve_to ?? "the target chord";
  if (fn.includes("ii-V-I") && !fn.includes("iiø")) {
    return [
      "Play only guide tones through the progression.",
      "Play the arpeggio of each chord.",
      `Think ${thinkV} across the ii-V.`,
      `Resolve to the root or 3rd of ${resolveTo}.`,
      "Try inside first, then altered on the V.",
      "Move the idea through three keys."
    ];
  }
  if (fn.includes("iiø-V-i") || fn.includes("iiø-V")) {
    return [
      "Play guide tones through the minor cadence.",
      "Outline the m7b5 chord clearly.",
      `Think altered dominant or Phrygian dominant on ${thinkV}.`,
      `Resolve strongly to ${resolveTo}.`,
      "Move the idea through three keys."
    ];
  }
  if (fn === "V-I" || fn === "V-i" || fn.includes("secondary dominant")) {
    return [
      "Isolate dominant tension and resolution.",
      `Target the 3rd or root of ${resolveTo}.`,
      "Try one inside line and one altered line."
    ];
  }
  return [
    "Start with guide tones and chord tones first.",
    "Avoid overconfident scale advice until the tonal centre is clear.",
    `Confirm whether ${analysis.local_key || region?.local_key || "this area"} is the intended tonal centre.`
  ];
}

function keyTrainerPlan(mode) {
  if (mode === "up_whole_step") return [{ label: "Up whole step", shift: 2 }];
  if (mode === "down_minor_third") return [{ label: "Down minor third", shift: -3 }];
  if (mode === "cycle_of_fourths") return [{ label: "Cycle 1", shift: 5 }, { label: "Cycle 2", shift: 10 }, { label: "Cycle 3", shift: 15 }, { label: "Cycle 4", shift: 20 }];
  if (mode === "random_3_keys") return [{ label: "Random 1", shift: 2 }, { label: "Random 2", shift: -3 }, { label: "Random 3", shift: 5 }];
  return [{ label: "Original", shift: 0 }];
}

function buildKeyTrainerVersions(chords, mode) {
  return keyTrainerPlan(mode).map(({ label, shift }) => {
    const transposed = shift === 0 ? [...chords] : transposeChart(chords, shift, true);
    const item = analyseProgression(transposed).analysis[0] ?? null;
    return {
      label,
      semitone_shift: shift,
      chords: transposed,
      local_key: item?.local_key ?? "unknown",
      function: item?.function ?? "unknown",
      think_v: item?.think_v ?? null,
      resolve_to: item?.resolve_to ?? null
    };
  });
}

function selectedPracticeContext(model) {
  const region = model.regions[state.regionIndex] ?? null;
  const analysis = currentAnalysisForRegion(model, state.regionIndex);
  const practice = practiceForAnalysis(model, analysis);
  const guitarTasks = buildGuitarTasks(analysis, region);
  const keyTrainer = analysis ? buildKeyTrainerVersions(analysis.chords, state.keyTrainerMode) : [];
  return { region, analysis, practice, guitarTasks, keyTrainer };
}

function practicePackSource(model) {
  const typeMap = {
    demo: "demo",
    pasted_ireal: "ireal_link",
    uploaded_html: "ireal_html",
    plain_text: "plain_text"
  };
  return {
    type: typeMap[model.source_kind] ?? "demo",
    title: model.title,
    declared_key: model.declared_key,
    transposition_shift: model.current_transposition_shift
  };
}

function buildSelectedPracticePack(model) {
  const { region, analysis, practice, guitarTasks, keyTrainer } = selectedPracticeContext(model);
  if (!region || !analysis) return null;
  return {
    schema: "jazzcat-practice-pack-v1",
    source: practicePackSource(model),
    selected_region: {
      region_id: region.region_id,
      start_bar: region.start_bar,
      end_bar: region.end_bar,
      chords: analysis.chords,
      local_key: region.local_key,
      function: region.function,
      confidence: region.confidence
    },
    practice_focus: {
      think_v: practice?.think_v ?? analysis.think_v ?? null,
      resolve_to: practice?.resolve_to ?? analysis.resolve_to ?? null,
      inside_scale: practice?.inside_scale ?? analysis.scale_suggestions?.inside_scale ?? null,
      tension_scale: practice?.tension_scale ?? analysis.scale_suggestions?.tension_scale ?? null,
      target_tones: practice?.target_tones ?? analysis.target_tones ?? [],
      suggested_drills: practice?.suggested_drills ?? guitarTasks,
      guitar_tasks: guitarTasks
    },
    key_trainer: {
      mode: state.keyTrainerMode,
      versions: keyTrainer
    },
    notes: []
  };
}

function renderDemoSelect() {
  elements.demoSelect.innerHTML = data.demo_tunes.map((tune) => `<option value="${escapeHtml(tune.slug)}">${escapeHtml(tune.title)}</option>`).join("");
  elements.demoSelect.value = state.activeSlug;
}

function renderMeta(model) {
  elements.tuneTitle.textContent = model.title;
  elements.metaComposer.textContent = model.composer || "-";
  elements.metaKey.textContent = model.declared_key || "-";
  elements.metaStyle.textContent = model.style || "-";
  elements.metaTempo.textContent = model.tempo ? String(model.tempo) : "-";
  elements.metaShift.textContent = model.current_transposition_label;
  elements.metaRegions.textContent = String(model.regions.length);
  elements.transposeLabel.textContent = `Shift ${formatShift(state.shift)}`;
  const transposeDisabled = model.chords.length === 0;
  elements.transposeDown.disabled = transposeDisabled;
  elements.transposeUp.disabled = transposeDisabled;
  elements.transposeReset.disabled = transposeDisabled;
  const packDisabled = model.regions.length === 0;
  elements.copyPackButton.disabled = packDisabled;
  elements.downloadPackButton.disabled = packDisabled;
}

function renderWarnings(model) {
  elements.warningList.innerHTML = model.warnings.length
    ? model.warnings.map((warning) => `<span class="warning-pill">${escapeHtml(warning)}</span>`).join(" ")
    : "";
}

function renderChart(model) {
  const selectedRegion = model.regions[state.regionIndex] ?? null;
  const bars = model.bars?.length ? model.bars : model.chords.map((chord) => ({ bar: chord.bar, chords: [chord], region_ids: chord.region_id ? [chord.region_id] : [], colour_role: chord.colour_role }));

  if (bars.length === 0) {
    elements.chartGrid.innerHTML = `<div class="empty-state">Chord body preserved, but no decoded chord grid is available yet.</div>`;
    return;
  }

  elements.chartGrid.innerHTML = bars
    .map((bar) => {
      const active = selectedRegion && bar.region_ids.includes(selectedRegion.region_id);
      const role = bar.colour_role ?? "ambiguous-region";
      const label = bar.chords.map((chord) => chord.symbol).join(" ");
      const regionId = bar.region_ids[0] ?? "";
      return `
        <button
          type="button"
          class="chord-cell ${escapeHtml(role)} ${active ? "is-active" : ""}"
          data-region-id="${escapeHtml(regionId)}"
          aria-label="Bar ${bar.bar} ${escapeHtml(label)}"
        >
          <span class="bar-number">Bar ${bar.bar}</span>
          <span class="region-chip">${escapeHtml(bar.chords.map((chord) => regionForSequence(model, chord.sequence_index)?.local_key ?? "").filter(Boolean)[0] ?? "")}</span>
          <span class="chord-symbol">${bar.chords.map((chord) => `<span>${escapeHtml(chord.symbol)}</span>`).join("")}</span>
        </button>
      `;
    })
    .join("");
}

function renderRegions(model) {
  const highCount = model.regions.filter((region) => region.confidence === "high").length;
  elements.confidenceSummary.textContent = model.regions.length ? `${highCount} high-confidence` : "No decoded regions";

  if (model.regions.length === 0) {
    elements.regionList.innerHTML = `<p class="quiet-text">No regions yet.</p>`;
    return;
  }

  elements.regionList.innerHTML = model.regions
    .map((region, index) => {
      const analysis = currentAnalysisForRegion(model, index);
      return `
        <button
          type="button"
          class="region-button ${escapeHtml(region.colour_role)}"
          aria-pressed="${index === state.regionIndex}"
          data-region-index="${index}"
        >
          <span class="region-topline">
            <span class="region-key">${escapeHtml(region.local_key)}</span>
            <span class="confidence">${escapeHtml(region.confidence)}</span>
          </span>
          <span class="region-function">Bars ${region.start_bar}-${region.end_bar} · ${escapeHtml(region.function)}</span>
          <span class="hint">${escapeHtml(analysis?.practice_hint ?? "")}</span>
        </button>
      `;
    })
    .join("");
}

function renderRegionDetail(model) {
  const { region, analysis } = selectedPracticeContext(model);
  if (!region || !analysis) {
    elements.regionDetail.innerHTML = `<p class="quiet-text">No selected region.</p>`;
    return;
  }

  elements.regionDetail.innerHTML = `
    <dl class="detail-grid">
      <div><dt>Local Key</dt><dd>${escapeHtml(region.local_key)}</dd></div>
      <div><dt>Function</dt><dd>${escapeHtml(region.function)}</dd></div>
      <div><dt>Confidence</dt><dd>${escapeHtml(region.confidence)}</dd></div>
      <div><dt>Priority</dt><dd>${escapeHtml(region.practice_priority)}</dd></div>
      <div><dt>Chords</dt><dd>${escapeHtml(analysis.chords.join(" | "))}</dd></div>
      <div><dt>Think V</dt><dd>${escapeHtml(analysis.think_v ?? "-")}</dd></div>
      <div><dt>Resolve To</dt><dd>${escapeHtml(analysis.resolve_to ?? "-")}</dd></div>
      <div><dt>Inside</dt><dd>${escapeHtml(analysis.scale_suggestions?.inside_scale ?? "-")}</dd></div>
      <div><dt>Tension</dt><dd>${escapeHtml(analysis.scale_suggestions?.tension_scale ?? "-")}</dd></div>
    </dl>
    <p class="detail-explanation">${escapeHtml(analysis.reason ?? analysis.practice_hint)}</p>
  `;
}

function renderPractice(model) {
  const { region, analysis, practice, guitarTasks } = selectedPracticeContext(model);
  if (!region || !analysis) {
    elements.practiceList.innerHTML = `<p class="quiet-text">No practice card for this selection.</p>`;
    elements.keyTrainerList.innerHTML = "";
    return;
  }

  const drills = practice?.suggested_drills ?? guitarTasks;
  elements.practiceList.innerHTML = `
    <article class="practice-item">
      <div class="practice-topline">
        <strong class="practice-title">${escapeHtml(analysis.function)}</strong>
        <span class="confidence">${escapeHtml(analysis.think_v ?? "study")}</span>
      </div>
      <p class="hint"><strong>Progression:</strong> ${escapeHtml(analysis.chords.join(" | "))}</p>
      <p class="hint"><strong>Goal:</strong> ${escapeHtml(analysis.practice_hint)}</p>
      <div class="practice-scale">
        <div><span>Inside Sound</span><strong>${escapeHtml(practice?.inside_scale ?? analysis.scale_suggestions?.inside_scale ?? "-")}</strong></div>
        <div><span>Tension Sound</span><strong>${escapeHtml(practice?.tension_scale ?? analysis.scale_suggestions?.tension_scale ?? "-")}</strong></div>
      </div>
      <p class="target-tones"><strong>Target tones:</strong> ${escapeHtml((practice?.target_tones ?? analysis.target_tones ?? []).join(", ") || "-")}</p>
      <h3 class="subheading">Suggested Drills</h3>
      <ul class="drill-list">${drills.map((drill) => `<li>${escapeHtml(drill)}</li>`).join("")}</ul>
      <h3 class="subheading">Guitar Tasks</h3>
      <ul class="drill-list">${guitarTasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("")}</ul>
    </article>
  `;
}

function renderKeyTrainer(model) {
  const { analysis, keyTrainer } = selectedPracticeContext(model);
  if (!analysis) {
    elements.keyTrainerList.innerHTML = "";
    return;
  }

  elements.keyTrainerList.innerHTML = `
    <div class="key-trainer-table">
      ${keyTrainer
        .map(
          (version) => `
            <div class="key-trainer-row">
              <strong>${escapeHtml(version.label)}</strong>
              <span>${escapeHtml(formatShift(version.semitone_shift))}</span>
              <span>${escapeHtml(version.chords.join(" | "))}</span>
              <span>${escapeHtml(version.local_key)}</span>
              <span>${escapeHtml(version.think_v ?? "-")} -> ${escapeHtml(version.resolve_to ?? "-")}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderPayload(model) {
  elements.irealStatus.textContent = model.ireal.raw_payload_preserved
    ? `iReal preserved · ${model.ireal.chord_body_length} chars`
    : model.source_kind === "plain_text"
      ? "Plain text"
      : "No iReal payload";
  elements.payloadLength.textContent = model.ireal.raw_url_present ? "Decoded payload" : "";
  elements.payloadPreview.textContent = model.ireal.raw_decoded_payload || (state.plainText?.text ?? "");
}

async function copyPracticePack() {
  const pack = buildSelectedPracticePack(currentModel());
  if (!pack) return;
  const json = JSON.stringify(pack, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    elements.copyPackButton.textContent = "Copied";
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = json;
    textArea.setAttribute("readonly", "true");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
    elements.copyPackButton.textContent = "Copied";
  } finally {
    window.setTimeout(() => {
      elements.copyPackButton.textContent = "Copy JSON";
    }, 1200);
  }
}

function downloadPracticePack() {
  const pack = buildSelectedPracticePack(currentModel());
  if (!pack) return;
  const json = JSON.stringify(pack, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${aliasKey(pack.source.title) || "jazzcat"}-practice-pack.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  elements.loadDemoButton.addEventListener("click", () => setDemo(elements.demoSelect.value));
  elements.demoSelect.addEventListener("change", () => setDemo(elements.demoSelect.value));

  elements.analysePasteButton.addEventListener("click", () => {
    const value = elements.irealInput.value.trim();
    if (!value) return;
    setImported("ireal_link", value);
  });

  elements.analyseUploadButton.addEventListener("click", async () => {
    const file = elements.htmlFileInput.files?.[0];
    if (!file) return;
    const value = await file.text();
    setImported("ireal_html", value);
  });

  elements.analysePlainTextButton.addEventListener("click", setPlainText);
  elements.transposeDown.addEventListener("click", () => setShift(-1));
  elements.transposeUp.addEventListener("click", () => setShift(1));
  elements.transposeReset.addEventListener("click", resetShift);

  elements.regionList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-region-index]");
    if (!button) return;
    setRegion(Number(button.dataset.regionIndex));
  });

  elements.chartGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-region-id]");
    if (!button || !button.dataset.regionId) return;
    const model = currentModel();
    const index = model.regions.findIndex((region) => region.region_id === button.dataset.regionId);
    if (index >= 0) setRegion(index);
  });

  elements.keyTrainerMode.addEventListener("change", () => {
    state.keyTrainerMode = elements.keyTrainerMode.value;
    render();
  });

  elements.copyPackButton.addEventListener("click", copyPracticePack);
  elements.downloadPackButton.addEventListener("click", downloadPracticePack);
}

function render() {
  const model = currentModel();
  renderDemoSelect();
  renderMeta(model);
  renderWarnings(model);
  renderChart(model);
  renderRegions(model);
  renderRegionDetail(model);
  renderPractice(model);
  renderKeyTrainer(model);
  renderPayload(model);
}

bindEvents();
render();
