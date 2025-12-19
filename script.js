const formElements = {
  role: document.getElementById("role"),
  goal: document.getElementById("goal"),
  context: document.getElementById("context"),
  inputs: document.getElementById("inputs"),
  steps: document.getElementById("steps"),
  tone: document.getElementById("tone"),
  examples: document.getElementById("examples"),
  format: document.getElementById("format"),
  constraints: document.getElementById("constraints"),
  creativity: document.getElementById("creativity"),
  priority: document.getElementById("priority"),
};

const templates = {
  blank: {
    role: "You are a helpful, detail-oriented assistant.",
    goal: "Deliver a clear response for the user's request.",
    context: "",
    inputs: "",
    steps: "",
    tone: "Balanced, concise, and supportive.",
    examples: "",
    format: "Concise paragraphs with bullet points for key items.",
    constraints: "Cite assumptions and ask one clarifying question if needed.",
    priority: "Accuracy first, then brevity.",
  },
  analysis: {
    role: "You are a senior analyst who explains tradeoffs like a mentor.",
    goal: "Evaluate options and recommend the best path with rationale.",
    context: "Consider the decision context, stakeholders, and constraints.",
    inputs: "List of options, audience, risk tolerance, timeline, and budget.",
    steps:
      "1) Summarize the objective in one line.\n2) Compare options with pros/cons.\n3) Flag risks and unknowns.\n4) Recommend the best option and why.\n5) Suggest next steps or data to gather.",
    tone: "Neutral, concrete, and transparent about uncertainty.",
    examples: "Good: recommendations that show evidence and make tradeoffs explicit.\nAvoid: opinions without reasoning or caveats.",
    format: "Markdown with headings: Objective, Comparison, Recommendation, Next steps.",
    constraints: "Keep to under 250 words. Call out any missing info.",
    priority: "Clarity over creativity; cite assumptions.",
  },
  writing: {
    role: "You are a writing coach who polishes text and strengthens intent.",
    goal: "Rewrite the draft to match the target tone while keeping key facts.",
    context: "Audience, medium (email, doc, announcement), and desired impression.",
    inputs: "Original draft and any phrases to preserve.",
    steps:
      "1) Restate the goal and audience.\n2) Rewrite for clarity and flow.\n3) Suggest 2 subject lines or hooks.\n4) Offer 3 small edits the author can choose.",
    tone: "Warm, confident, and succinct.",
    examples: "Good: rewrites that keep author voice but sharpen impact.\nAvoid: generic fluff or removing key details.",
    format: "Rewritten draft, bullet notes for reasoning, then optional variations.",
    constraints: "Keep under 180 words and avoid emojis.",
    priority: "Preserve intent first, then polish tone.",
  },
  coding: {
    role: "You are a staff-level engineer who explains code step by step.",
    goal: "Walk through the code, highlight risks, and propose improvements.",
    context: "Language, framework, and key constraints (perf, security, readability).",
    inputs: "Code snippet and the desired outcome (optimize, debug, refactor).",
    steps:
      "1) Summarize what the code does.\n2) Point out correctness and edge cases.\n3) Surface security or performance concerns.\n4) Suggest precise, minimal changes.\n5) Provide an improved snippet if helpful.",
    tone: "Direct, constructive, and concise.",
    examples: "Good: actionable suggestions with examples.\nAvoid: vague advice or large rewrites unless necessary.",
    format: "Bullets for issues, code blocks for snippets, then a short recap.",
    constraints: "Stay within 200 words and avoid stylistic bikeshedding.",
    priority: "Correctness and safety over style.",
  },
};

const promptOutput = document.getElementById("promptOutput");
const wordCount = document.getElementById("wordCount");
const creativityLabel = document.getElementById("creativityLabel");
const toast = document.getElementById("toast");
const whyList = document.getElementById("whyList");
const tonePills = document.getElementById("tonePills");

function buildPrompt() {
  const values = Object.fromEntries(
    Object.entries(formElements).map(([key, el]) => [key, (el.value || "").trim()])
  );

  const parts = [];
  if (values.role) parts.push(`You are ${values.role}`);
  if (values.goal) parts.push(`Goal: ${values.goal}`);
  if (values.context) parts.push(`Context: ${values.context}`);
  if (values.inputs) parts.push(`The user will provide: ${values.inputs}`);
  if (values.steps) parts.push(`Follow these steps:\n${values.steps}`);
  if (values.tone) parts.push(`Tone and style: ${values.tone}`);
  if (values.examples) parts.push(`Examples to mirror/avoid:\n${values.examples}`);
  if (values.format) parts.push(`Respond using: ${values.format}`);
  if (values.constraints)
    parts.push(`Constraints & guardrails: ${values.constraints}`);
  parts.push(`Creativity setting: ${describeCreativity(values.creativity)}`);
  if (values.priority) parts.push(`Prioritize: ${values.priority}`);

  const prompt = parts.join("\n\n");
  promptOutput.textContent = prompt;
  wordCount.textContent = `${prompt.split(/\s+/).filter(Boolean).length} words`;
  updateWhyList(values);
}

function describeCreativity(value) {
  const numeric = Number(value || 0);
  if (numeric <= 2) return "Literal (focus on accuracy, avoid speculation).";
  if (numeric <= 6) return "Balanced (mix precision with light variation).";
  return "Inventive (offer fresh angles while staying on-topic).";
}

function applyTemplate(name) {
  const template = templates[name];
  if (!template) return;
  Object.entries(template).forEach(([key, val]) => {
    if (formElements[key]) {
      formElements[key].value = val;
    }
  });
  buildPrompt();
}

function resetForm() {
  Object.values(formElements).forEach((el) => {
    if (el.type === "range") {
      el.value = "4";
    } else {
      el.value = "";
    }
  });
  buildPrompt();
}

function copyPrompt() {
  const text = promptOutput.textContent;
  navigator.clipboard
    .writeText(text)
    .then(showToast)
    .catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast();
    });
}

function showToast() {
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1500);
}

function updateWhyList(values) {
  const messages = [];
  if (values.role) messages.push("Role anchors the assistant's perspective.");
  if (values.steps) messages.push("Steps break down the work into verifiable pieces.");
  if (values.format) messages.push("Format guidance shapes the final output.");
  if (!messages.length) {
    messages.push("Add a role and goal to ground the prompt.");
  }
  whyList.innerHTML = messages.map((m) => `<li>${m}</li>`).join("");
}

function bindEvents() {
  Object.values(formElements).forEach((el) => {
    el.addEventListener("input", () => {
      if (el.id === "creativity") {
        creativityLabel.textContent = `Creativity: ${describeCreativity(el.value)}`;
      }
      buildPrompt();
    });
  });

  document.getElementById("copy").addEventListener("click", copyPrompt);
  document.getElementById("reset").addEventListener("click", resetForm);
  document.getElementById("template").addEventListener("change", (event) => {
    applyTemplate(event.target.value);
  });
  document.getElementById("loadTemplate").addEventListener("click", () => {
    applyTemplate(document.getElementById("template").value);
  });
  document.getElementById("startFresh").addEventListener("click", resetForm);

  tonePills.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      tonePills.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      formElements.tone.value = btn.dataset.tone;
      buildPrompt();
    });
  });
}

bindEvents();
applyTemplate("blank");
buildPrompt();
