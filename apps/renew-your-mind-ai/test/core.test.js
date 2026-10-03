import test from "node:test";
import assert from "node:assert/strict";

import {
  crisisReflection,
  fallbackVerseId,
  localSafetyLevel,
  normalizeThought,
  publicReflection,
  validateModelResult
} from "../src/core.js";

test("normalizes whitespace and control characters", () => {
  assert.equal(normalizeThought("  I\n feel\t overwhelmed.  "), "I feel overwhelmed.");
});

test("detects explicit crisis language before calling AI", () => {
  assert.equal(localSafetyLevel("I want to kill myself"), "crisis");
  assert.equal(localSafetyLevel("There is no point in trying anymore"), "check_in");
  assert.equal(localSafetyLevel("I am nervous about tomorrow"), "normal");
});

test("selects a deterministic fallback verse", () => {
  assert.equal(fallbackVerseId("I keep comparing myself to everyone"), "own-work");
  assert.equal(fallbackVerseId("I feel overwhelmed by everything"), "prayer-and-peace");
});

test("rejects invented verse ids while retaining safe model text", () => {
  const result = validateModelResult({
    truth: "This fear is real, but it is not the whole story.",
    verse_id: "made-up-verse",
    declaration: "I can take one faithful step.",
    action: "Write one concern down and pray over it for five minutes.",
    safety_level: "normal",
    safety_message: null
  }, "I am afraid", "normal");

  assert.equal(result.verseId, "fear-not");
  assert.equal(result.truth, "This fear is real, but it is not the whole story.");
});

test("public reflections always use curated KJV text", () => {
  const publicResult = publicReflection(crisisReflection("I want to die"));
  assert.equal(publicResult.scripture.reference, "Psalm 34:18 (KJV)");
  assert.match(publicResult.scripture.text, /broken heart/);
  assert.equal(publicResult.safety.level, "crisis");
});
