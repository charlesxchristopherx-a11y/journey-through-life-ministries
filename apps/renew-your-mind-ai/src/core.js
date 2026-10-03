import { VERSES } from "./verses.js";

const EXPLICIT_CRISIS_PATTERNS = [
  /\bkill (?:myself|me)\b/i,
  /\bend (?:my|this) life\b/i,
  /\b(?:want|wish|going|plan(?:ning)?) to die\b/i,
  /\bbetter off dead\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bself[- ]?harm\b/i,
  /\bhurt myself\b/i,
  /\bno reason to live\b/i,
  /\bdo not want to (?:be here|live|wake up)\b/i,
  /\bdon['’]?t want to (?:be here|live|wake up)\b/i
];

const CHECK_IN_PATTERNS = [
  /\bno point (?:in|to) (?:trying|anything)\b/i,
  /\bnothing to look forward to\b/i,
  /\bcan['’]?t go on\b/i,
  /\bhopeless\b/i,
  /\bnobody would (?:notice|care)\b/i,
  /\bworthless\b/i
];

const FALLBACK_RULES = [
  { pattern: /anxi|worr|overwhelm|panic|stress/i, verseId: "prayer-and-peace" },
  { pattern: /afraid|fear|scared|unsafe/i, verseId: "fear-not" },
  { pattern: /jealous|envy|compar|behind everyone/i, verseId: "own-work" },
  { pattern: /guilt|asham|condemn|mistake|messed up|failed/i, verseId: "no-condemnation" },
  { pattern: /past|regret|move on|stuck/i, verseId: "press-forward" },
  { pattern: /alone|lonely|abandon|nobody cares|unseen/i, verseId: "never-forsaken" },
  { pattern: /relationship|forgiv|betray|conflict|argument/i, verseId: "live-peaceably" },
  { pattern: /purpose|calling|future|direction|what to do/i, verseId: "directed-path" },
  { pattern: /sad|grief|broken|hurt|loss/i, verseId: "near-brokenhearted" },
  { pattern: /tired|exhaust|burnout|heavy/i, verseId: "rest-for-weary" },
  { pattern: /change|habit|always be this way/i, verseId: "renewed-mind" },
  { pattern: /ugly|body|not good enough|hate myself|worth/i, verseId: "fearfully-made" }
];

export function normalizeThought(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

export function localSafetyLevel(thought) {
  if (EXPLICIT_CRISIS_PATTERNS.some((pattern) => pattern.test(thought))) return "crisis";
  if (CHECK_IN_PATTERNS.some((pattern) => pattern.test(thought))) return "check_in";
  return "normal";
}

export function fallbackVerseId(thought) {
  return FALLBACK_RULES.find(({ pattern }) => pattern.test(thought))?.verseId ?? "renewed-mind";
}

export function safeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function validateModelResult(raw, thought, localSafety = "normal") {
  const candidate = raw && typeof raw === "object" ? raw : {};
  const verseId = Object.hasOwn(VERSES, candidate.verse_id)
    ? candidate.verse_id
    : fallbackVerseId(thought);

  const modelSafety = ["normal", "check_in", "crisis"].includes(candidate.safety_level)
    ? candidate.safety_level
    : "normal";
  const safetyLevel = localSafety === "check_in" && modelSafety === "normal"
    ? "check_in"
    : modelSafety;

  return {
    thought,
    truth: safeText(candidate.truth, 360) || "This thought deserves to be examined; it does not have the final word about who you are or what is possible.",
    verseId,
    declaration: safeText(candidate.declaration, 300) || "I will bring this thought into the light and choose what is true, one step at a time.",
    action: safeText(candidate.action, 360) || "Take five quiet minutes to write the thought down, pray over it, and name one small step you can take today.",
    safetyLevel,
    safetyMessage: safeText(candidate.safety_message, 320)
  };
}

export function crisisReflection(thought) {
  return {
    thought,
    truth: "Your life has value, and you do not have to carry this moment alone.",
    verseId: "near-brokenhearted",
    declaration: "I will not face this moment alone; I will reach for immediate support now.",
    action: "Call or text 988 now if you are in the United States or Canada. If you may act on these thoughts or are in immediate danger, call local emergency services or go to the nearest emergency department.",
    safetyLevel: "crisis",
    safetyMessage: "Please pause and connect with a real person now—a trusted person who can stay with you, a crisis counselor, or emergency services."
  };
}

export function publicReflection(reflection) {
  const verse = VERSES[reflection.verseId];
  return {
    thought: reflection.thought,
    truth: reflection.truth,
    scripture: {
      reference: `${verse.reference} (KJV)`,
      text: verse.text
    },
    declaration: reflection.declaration,
    action: reflection.action,
    safety: {
      level: reflection.safetyLevel,
      message: reflection.safetyMessage || null
    }
  };
}
