import test from "node:test";
import assert from "node:assert/strict";
import { jazzChordDisplay } from "../src/index.ts";

test("displays common jazz chord shorthand", () => {
  assert.equal(jazzChordDisplay("Cmaj7"), "C△7");
  assert.equal(jazzChordDisplay("Cmaj9"), "C△9");
  assert.equal(jazzChordDisplay("Cmajor7"), "C△7");
  assert.equal(jazzChordDisplay("Cm7"), "C-7");
  assert.equal(jazzChordDisplay("Cmin7"), "C-7");
  assert.equal(jazzChordDisplay("Cm7b5"), "Cø7");
  assert.equal(jazzChordDisplay("Cmin7b5"), "Cø7");
  assert.equal(jazzChordDisplay("Chalf-dim"), "Cø7");
  assert.equal(jazzChordDisplay("Cdim7"), "C°7");
  assert.equal(jazzChordDisplay("Cdim"), "C°");
  assert.equal(jazzChordDisplay("Caug"), "C+");
  assert.equal(jazzChordDisplay("C+"), "C+");
  assert.equal(jazzChordDisplay("C7alt"), "C7alt");
  assert.equal(jazzChordDisplay("C6/9"), "C6/9");
});

test("displays roots, accidentals, and slash chords musically", () => {
  assert.equal(jazzChordDisplay("Bbmaj7"), "B♭△7");
  assert.equal(jazzChordDisplay("F#min7"), "F♯-7");
  assert.equal(jazzChordDisplay("Eb7"), "E♭7");
  assert.equal(jazzChordDisplay("Dm7/G"), "D-7/G");
});
