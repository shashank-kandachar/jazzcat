export interface DisplayChordParts {
  root: string;
  descriptor: string;
  bass: string | null;
}

function displayPitchName(note: string): string {
  return note.replace(/#/g, "♯").replace(/b/g, "♭");
}

function splitDisplayChord(raw: string): DisplayChordParts {
  const compact = raw.trim().replace(/\s+/g, "");
  const slashBass = /^(.+)\/([A-Ga-g][#b]?)$/.exec(compact);
  const symbolPart = slashBass ? slashBass[1] : compact;
  const bass = slashBass ? slashBass[2] : null;
  const rootMatch = /^([A-Ga-g][#b]?)/.exec(symbolPart);

  if (!rootMatch) {
    return {
      root: compact,
      descriptor: "",
      bass: null
    };
  }

  return {
    root: `${rootMatch[1][0].toUpperCase()}${rootMatch[1].slice(1)}`,
    descriptor: symbolPart.slice(rootMatch[1].length),
    bass
  };
}

function cleanDescriptor(descriptor: string): string {
  return descriptor
    .replace(/half[- ]?dim(?:inished)?/gi, "m7b5")
    .replace(/majmin/gi, "mmaj")
    .replace(/major/gi, "maj")
    .replace(/minor|min/gi, "m")
    .replace(/[∆Δ^△]/g, "maj")
    .replace(/[øØ]/g, "m7b5")
    .replace(/\(([^)]+)\)/g, "$1")
    .replace(/-/g, "m")
    .toLowerCase();
}

function displayExtension(value: string): string {
  return value.replace(/b(?=(5|9|13))/g, "♭").replace(/#(?=(5|9|11))/g, "♯");
}

function majorDisplay(descriptor: string): string {
  const extension = descriptor.replace(/^maj/, "");
  if (extension === "" || extension === "or") return "△";
  if (extension === "7") return "△7";
  if (extension === "9") return "△9";
  if (extension === "13") return "△13";
  return `△${displayExtension(extension)}`;
}

function minorDisplay(descriptor: string): string {
  const extension = descriptor.replace(/^m/, "");
  if (extension === "") return "-";
  if (extension === "7") return "-7";
  if (extension === "9") return "-9";
  if (extension === "6") return "-6";
  if (extension === "maj7") return "-△7";
  return `-${displayExtension(extension)}`;
}

function qualityDisplay(descriptor: string): string {
  if (descriptor === "") return "";
  if (descriptor.startsWith("m7b5")) return "ø7";
  if (descriptor.startsWith("dim7") || descriptor.startsWith("o7")) return "°7";
  if (descriptor.startsWith("dim") || descriptor === "o") return "°";
  if (descriptor.startsWith("aug") || descriptor.startsWith("+")) return "+";
  if (descriptor.startsWith("maj")) return majorDisplay(descriptor);
  if (descriptor.startsWith("m")) return minorDisplay(descriptor);
  if (descriptor.startsWith("69") || descriptor.startsWith("6/9")) return "6/9";
  if (descriptor.startsWith("7alt")) return "7alt";
  return displayExtension(descriptor);
}

export function jazzChordDisplay(raw: string): string {
  const parts = splitDisplayChord(raw);
  const root = displayPitchName(parts.root);
  const quality = qualityDisplay(cleanDescriptor(parts.descriptor));
  const bass = parts.bass ? `/${displayPitchName(parts.bass)}` : "";

  return `${root}${quality}${bass}`;
}
