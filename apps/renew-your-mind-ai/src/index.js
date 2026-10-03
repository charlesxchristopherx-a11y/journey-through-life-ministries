import { VERSE_CHOICES } from "./verses.js";
import {
  crisisReflection,
  localSafetyLevel,
  normalizeThought,
  publicReflection,
  validateModelResult
} from "./core.js";

const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const MAX_BODY_BYTES = 4096;
const MIN_THOUGHT_LENGTH = 3;
const MAX_THOUGHT_LENGTH = 600;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    truth: { type: "string", maxLength: 360 },
    verse_id: { type: "string", enum: VERSE_CHOICES.map(({ id }) => id) },
    declaration: { type: "string", maxLength: 300 },
    action: { type: "string", maxLength: 360 },
    safety_level: { type: "string", enum: ["normal", "check_in", "crisis"] },
    safety_message: { type: "string", maxLength: 320 }
  },
  required: ["truth", "verse_id", "declaration", "action", "safety_level", "safety_message"],
  additionalProperties: false
};

const VERSE_CATALOG = VERSE_CHOICES
  .map(({ id, reference, themes }) => `${id} | ${reference} | ${themes}`)
  .join("\n");

const SYSTEM_PROMPT = `You are a careful Christian reflection assistant for Journey In His Word.

Your purpose is to help a person examine one difficult thought. A thought is something they can examine; it is not necessarily the truth. Respond with compassion and humility, following this flow: Thought → Truth → Scripture → Declaration → Action.

Rules:
- Use the King James Version only. Choose exactly one verse_id from the approved catalog below. Do not quote or invent Scripture; the application supplies the verified KJV text after your selection.
- Write truth as one or two grounded sentences. Do not shame the person, diagnose them, preach at them, or promise a specific outcome from God.
- Write declaration as one honest first-person sentence. Avoid absolute guarantees such as “nothing bad will happen.”
- Write action as one small, safe, concrete next step that can usually be done within 15 minutes. Suitable actions include a brief prayer, journaling, slowing the breath, contacting a trusted person, setting a calm boundary, or taking one practical next step.
- Never recommend changing medication, replacing professional care, self-punishment, extreme fasting, giving money, secrecy, ending a job or relationship, confronting someone, or any illegal or dangerous act.
- If the thought may signal hopelessness but not explicit self-harm, set safety_level to check_in and include a brief invitation to tell a trusted person today.
- If the thought suggests suicide, self-harm, wanting to die, or immediate danger, set safety_level to crisis. Keep the action focused on immediate human help; do not provide a normal self-help exercise.
- Use an empty string for safety_message when safety_level is normal.
- Return only data matching the supplied JSON schema.

Approved KJV verse catalog:
${VERSE_CATALOG}`;

function securityHeaders() {
  return {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY"
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...securityHeaders(), ...extraHeaders }
  });
}

function parseAIResponse(result) {
  const value = result?.response ?? result;
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") throw new Error("Workers AI returned an unsupported response shape.");
  return JSON.parse(value);
}

async function readBodyWithLimit(request, maxBytes) {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel("Request body too large");
      throw new RangeError("Request body too large");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

async function handleReflection(request, env) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ error: "That thought is too long. Please keep it under 600 characters." }, 413);
  }

  let rawBody;
  try {
    rawBody = await readBodyWithLimit(request, MAX_BODY_BYTES);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return json({ error: "That thought is too long. Please keep it under 600 characters." }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Please send a valid thought and try again." }, 400);
  }

  const thought = normalizeThought(payload?.thought);
  if (thought.length < MIN_THOUGHT_LENGTH) {
    return json({ error: "Please enter a little more about the thought you want to examine." }, 400);
  }
  if (thought.length > MAX_THOUGHT_LENGTH) {
    return json({ error: "Please keep your thought under 600 characters." }, 400);
  }

  const localSafety = localSafetyLevel(thought);
  if (localSafety === "crisis") {
    return json({ reflection: publicReflection(crisisReflection(thought)) });
  }

  const clientKey = request.headers.get("cf-connecting-ip") || "local-preview";
  const rate = await env.AI_RATE_LIMITER.limit({ key: `reflection:${clientKey}` });
  if (!rate.success) {
    return json(
      { error: "You’ve reached the reflection limit for this minute. Please pause briefly and try again." },
      429,
      { "retry-after": "60" }
    );
  }

  try {
    const aiResult = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `The person wrote this thought:\n\n${thought}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: RESPONSE_SCHEMA
      },
      max_tokens: 420,
      temperature: 0.35
    });

    const modelResult = parseAIResponse(aiResult);
    const reflection = validateModelResult(modelResult, thought, localSafety);

    if (reflection.safetyLevel === "crisis") {
      return json({ reflection: publicReflection(crisisReflection(thought)) });
    }

    if (reflection.safetyLevel === "check_in" && !reflection.safetyMessage) {
      reflection.safetyMessage = "This sounds especially heavy. Please tell a trusted person what you are carrying today; you do not have to hold it alone.";
    }

    return json({ reflection: publicReflection(reflection) });
  } catch (error) {
    console.error(JSON.stringify({
      event: "reflection_generation_failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }));
    return json({ error: "The reflection could not be prepared just now. Please try again in a moment." }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, model: MODEL });
    }

    if (url.pathname === "/api/renew") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed." }, 405, { allow: "POST" });
      }
      return handleReflection(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found." }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
