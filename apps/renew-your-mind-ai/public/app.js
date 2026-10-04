const EXAMPLES = [
  "I’m not good enough.",
  "I’m afraid something will go wrong.",
  "Everyone else is ahead of me.",
  "I can’t move past what happened.",
  "Nobody really understands me.",
  "I don’t know what my purpose is.",
  "I’ll never change.",
  "I feel overwhelmed by everything.",
  "I keep replaying my mistake.",
  "I’m afraid to take the next step.",
  "I feel forgotten.",
  "My future feels uncertain."
];

const form = document.querySelector("#reflection-form");
const thoughtInput = document.querySelector("#thought");
const characterCount = document.querySelector("#character-count");
const examples = document.querySelector("#thought-examples");
const submitButtons = [...document.querySelectorAll("[data-submit-button]")];
const errorBox = document.querySelector("#form-error");
const waitingState = document.querySelector("#waiting-state");
const loadingState = document.querySelector("#loading-state");
const results = document.querySelector("#results");
const progressSteps = [...document.querySelectorAll(".progress-step")];
const supportAlert = document.querySelector("#support-alert");
const supportMessage = document.querySelector("#support-message");
const supportLinks = document.querySelector("#support-links");
const checkIn = document.querySelector("#check-in");
const checkInMessage = document.querySelector("#check-in-message");
const truthSource = document.querySelector("#truth-source");
const actionSource = document.querySelector("#action-source");
const copyButton = document.querySelector("#copy-button");
const shareButton = document.querySelector("#share-button");
const startOverButton = document.querySelector("#start-over-button");
const actionStatus = document.querySelector("#action-status");

let currentReflection = null;
let progressTimer = null;

function renderExamples() {
  const fragment = document.createDocumentFragment();
  EXAMPLES.forEach((thought) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "thought-chip";
    button.textContent = thought;
    button.addEventListener("click", () => {
      thoughtInput.value = thought;
      thoughtInput.dispatchEvent(new Event("input"));
      thoughtInput.focus();
    });
    fragment.append(button);
  });
  examples.append(fragment);
}

function updateCount() {
  characterCount.textContent = `${thoughtInput.value.length} / 600`;
  thoughtInput.removeAttribute("aria-invalid");
  errorBox.hidden = true;
}

function setProgress(activeStep, complete = false) {
  progressSteps.forEach((step, index) => {
    const number = index + 1;
    step.classList.toggle("is-current", !complete && number === activeStep);
    step.classList.toggle("is-complete", complete || number < activeStep);
    if (!complete && number === activeStep) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
}

function startProgressAnimation() {
  let stage = 2;
  setProgress(stage);
  progressTimer = window.setInterval(() => {
    stage = stage >= 4 ? 2 : stage + 1;
    setProgress(stage);
  }, 1100);
}

function stopProgressAnimation() {
  if (progressTimer) window.clearInterval(progressTimer);
  progressTimer = null;
}

function setSubmitButtons(isLoading) {
  submitButtons.forEach((button) => {
    button.disabled = isLoading;
    button.querySelector(".button-label").textContent = isLoading
      ? "Preparing your reflection…"
      : "Turn this thought toward truth";
  });
}

function setLoading(isLoading) {
  setSubmitButtons(isLoading);
  waitingState.hidden = true;
  results.hidden = true;
  loadingState.hidden = !isLoading;
  if (isLoading) startProgressAnimation();
  else stopProgressAnimation();
}

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function renderReflection(reflection) {
  currentReflection = reflection;
  loadingState.hidden = true;
  waitingState.hidden = true;
  results.hidden = false;
  setProgress(5, true);

  setText("#result-thought", `“${reflection.thought}”`);
  setText("#result-truth", reflection.truth);
  setText("#result-scripture", `“${reflection.scripture.text}”`);
  setText("#result-reference", reflection.scripture.reference);
  setText("#result-declaration", `“${reflection.declaration}”`);
  setText("#result-action", reflection.action);

  const level = reflection.safety?.level || "normal";
  truthSource.textContent = level === "crisis" ? "Safety response" : "Personalized by AI";
  actionSource.textContent = level === "crisis" ? "Immediate human support" : "AI-generated, small & safe";
  supportAlert.hidden = level !== "crisis";
  supportLinks.hidden = level !== "crisis";
  checkIn.hidden = level !== "check_in";

  if (level === "crisis") {
    supportMessage.textContent = reflection.safety.message || "Please pause and connect with a trusted person, crisis counselor, or emergency service now.";
  }

  if (level === "check_in") {
    checkInMessage.textContent = reflection.safety.message || "This sounds especially heavy. Please tell a trusted person what you are carrying today.";
  }

  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reflectionAsText() {
  if (!currentReflection) return "";
  const r = currentReflection;
  return [
    "RENEW YOUR MIND",
    "Journey In His Word",
    "",
    `THOUGHT\n${r.thought}`,
    "",
    `TRUTH\n${r.truth}`,
    "",
    `SCRIPTURE — ${r.scripture.reference}\n“${r.scripture.text}”`,
    "",
    `DECLARATION\n${r.declaration}`,
    "",
    `ACTION\n${r.action}`,
    "",
    "A faith-centered reflection, not medical advice or crisis care.",
    `Create your own reflection: ${window.location.href}`
  ].join("\n");
}

async function copyReflection() {
  try {
    await navigator.clipboard.writeText(reflectionAsText());
    actionStatus.textContent = "Reflection copied.";
  } catch {
    actionStatus.textContent = "Copy was unavailable. Try selecting the text directly.";
  }
}

async function shareReflection() {
  const text = reflectionAsText();
  if (!navigator.share) {
    await copyReflection();
    return;
  }
  try {
    await navigator.share({ title: "Renew Your Mind reflection", text, url: window.location.href });
    actionStatus.textContent = "Reflection shared.";
  } catch (error) {
    if (error?.name !== "AbortError") actionStatus.textContent = "Sharing was unavailable.";
  }
}

function reset() {
  currentReflection = null;
  thoughtInput.value = "";
  updateCount();
  results.hidden = true;
  loadingState.hidden = true;
  waitingState.hidden = false;
  supportAlert.hidden = true;
  checkIn.hidden = true;
  actionStatus.textContent = "";
  setProgress(1);
  thoughtInput.focus();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const thought = thoughtInput.value.trim();

  if (thought.length < 3) {
    errorBox.textContent = "Please enter a little more about the thought you want to examine.";
    errorBox.hidden = false;
    thoughtInput.setAttribute("aria-invalid", "true");
    thoughtInput.focus();
    return;
  }

  errorBox.hidden = true;
  actionStatus.textContent = "";
  setLoading(true);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch("/api/renew", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ thought }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.reflection) {
      throw new Error(data.error || "The reflection could not be prepared. Please try again.");
    }
    renderReflection(data.reflection);
  } catch (error) {
    loadingState.hidden = true;
    waitingState.hidden = false;
    setProgress(1);
    errorBox.textContent = error?.name === "AbortError"
      ? "The reflection took too long to prepare. Please try again."
      : (error?.message || "The reflection could not be prepared. Please try again.");
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
  } finally {
    window.clearTimeout(timeout);
    stopProgressAnimation();
    setSubmitButtons(false);
  }
});

thoughtInput.addEventListener("input", updateCount);
copyButton.addEventListener("click", copyReflection);
shareButton.addEventListener("click", shareReflection);
startOverButton.addEventListener("click", reset);

renderExamples();
updateCount();
