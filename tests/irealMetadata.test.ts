import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseIrealHtml } from "../src/index.ts";

const fixtures = [
  ["autumn-leaves.html", "Autumn Leaves", "G-", 112],
  ["tune-up.html", "Tune Up", "Bb", null],
  ["blue-bossa.html", "Blue Bossa", "C-", null],
  ["solar.html", "Solar", "C-", 230],
  ["all-the-things-you-are.html", "All The Things You Are", "Ab", null]
] as const;

for (const [filename, title, key, tempo] of fixtures) {
  test(`extracts iReal metadata for ${filename}`, async () => {
    const html = await readFile(new URL(`../fixtures/${filename}`, import.meta.url), "utf8");
    const parsed = parseIrealHtml(html);
    assert.equal(parsed.metadata.title, title);
    assert.equal(parsed.metadata.declared_key_raw, key);
    assert.ok(parsed.raw_url.startsWith("irealb://"));
    assert.ok(parsed.raw_decoded_payload.startsWith(`irealb://${title}`));
    assert.ok(parsed.encoded_chord_body_payload);
    if (tempo) {
      assert.equal(parsed.metadata.tempo, tempo);
    }
  });
}
