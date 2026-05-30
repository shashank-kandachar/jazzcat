import test from "node:test";
import assert from "node:assert/strict";
import { analyseProgression, buildGuitarTasksForAnalysis } from "../src/index.ts";

test("major ii-V-I produces guide-tone, arpeggio, think-V, resolution, and scale tasks", () => {
  const result = analyseProgression(["Dm7", "G7", "Cmaj7"]);
  const tasks = buildGuitarTasksForAnalysis(result.analysis[0], result.regions[0]);
  const taskTypes = tasks.map((task) => task.task_type);

  assert.ok(taskTypes.includes("guide-tones"));
  assert.ok(taskTypes.includes("arpeggios"));
  assert.ok(taskTypes.includes("think-v"));
  assert.ok(taskTypes.includes("resolution"));
  assert.ok(taskTypes.includes("scale-choice"));
  assert.ok(taskTypes.includes("comping"));
  assert.ok(taskTypes.includes("voice-leading"));
  assert.ok(taskTypes.includes("fretboard-position"));
  assert.ok(tasks.some((task) => task.instruction.includes("G7")));
});

test("minor iiø-V-i produces minor-cadence tasks", () => {
  const result = analyseProgression(["Am7b5", "D7b9", "Gm"]);
  const tasks = buildGuitarTasksForAnalysis(result.analysis[0], result.regions[0]);

  assert.ok(tasks.some((task) => task.instruction.includes("minor cadence")));
  assert.ok(tasks.some((task) => task.instruction.includes("m7b5")));
  assert.ok(tasks.some((task) => task.instruction.includes("Phrygian dominant")));
});

test("ambiguous region produces cautious advice", () => {
  const result = analyseProgression(["Cmaj7"]);
  const tasks = buildGuitarTasksForAnalysis(result.analysis[0], result.regions[0]);

  assert.ok(tasks.every((task) => task.task_type === "cautious-study"));
  assert.ok(tasks.some((task) => task.instruction.includes("Avoid overconfident")));
});
