export interface ManualTuneFixture {
  slug: string;
  title: string;
  declared_key: string;
  style: string;
  chords: string[];
  expected_regions: string[];
}

export const manualTuneFixtures: ManualTuneFixture[] = [
  {
    slug: "autumn-leaves",
    title: "Autumn Leaves",
    declared_key: "G minor",
    style: "Medium Swing",
    chords: [
      "Cm7",
      "F7",
      "Bbmaj7",
      "Ebmaj7",
      "Am7b5",
      "D7b9",
      "Gm",
      "Gm",
      "F#m7b5",
      "B7",
      "Em",
      "Em",
      "Am7b5",
      "D7b13",
      "Gm",
      "Gm"
    ],
    expected_regions: ["Bb major area", "G minor area", "E minor temporary tonicisation", "G minor return"]
  },
  {
    slug: "tune-up",
    title: "Tune Up",
    declared_key: "Bb major",
    style: "Up Tempo Swing",
    chords: [
      "Em7",
      "A7",
      "Dmaj7",
      "Dmaj7",
      "Dm7",
      "G7",
      "Cmaj7",
      "Cmaj7",
      "Cm7",
      "F7",
      "Bbmaj7",
      "Bbmaj7",
      "Em7b5",
      "A7b9",
      "Dm7",
      "G7",
      "Cmaj7"
    ],
    expected_regions: ["D major ii-V-I", "C major ii-V-I", "Bb major ii-V-I", "Turnaround / return movement"]
  },
  {
    slug: "blue-bossa",
    title: "Blue Bossa",
    declared_key: "C minor",
    style: "Bossa Nova",
    chords: [
      "Cm7",
      "Cm7",
      "Fm7",
      "Fm7",
      "Dm7b5",
      "G7b9",
      "Cm7",
      "Cm7",
      "Ebm7",
      "Ab7",
      "Dbmaj7",
      "Dbmaj7",
      "Dm7b5",
      "G7b9",
      "Cm7",
      "Cm7"
    ],
    expected_regions: ["C minor area", "Db major area", "C minor return"]
  },
  {
    slug: "solar",
    title: "Solar",
    declared_key: "C minor",
    style: "Medium Swing",
    chords: [
      "Cmmaj7",
      "Cm6",
      "Gm7",
      "C7",
      "Fmaj7",
      "Fmaj7",
      "Fm7",
      "Bb7",
      "Ebmaj7",
      "Ebm7",
      "Ab7",
      "Dbmaj7",
      "Dm7b5",
      "G7b9",
      "Cm6"
    ],
    expected_regions: ["C minor / C minor-major colour", "F area", "Eb / Db region", "ii-V return into C minor"]
  },
  {
    slug: "all-the-things-you-are",
    title: "All The Things You Are",
    declared_key: "Ab major",
    style: "Medium Up Swing",
    chords: [
      "Fm7",
      "Bbm7",
      "Eb7",
      "Abmaj7",
      "Dbmaj7",
      "G7",
      "Cmaj7",
      "Cmaj7",
      "Cm7",
      "F7",
      "Bbmaj7",
      "Bbmaj7",
      "Am7b5",
      "D7",
      "Gmaj7",
      "Gmaj7",
      "Fm7",
      "Bb7",
      "Ebmaj7",
      "Abmaj7"
    ],
    expected_regions: ["Ab major opening area", "C major area", "Eb major area", "G / E minor-related movement", "Ab return"]
  }
];

function key(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function findManualFixture(value: string | null | undefined): ManualTuneFixture | null {
  if (!value) return null;
  const sought = key(value.replace(/\.html$/i, ""));
  return manualTuneFixtures.find((fixture) => key(fixture.slug) === sought || key(fixture.title) === sought) ?? null;
}
