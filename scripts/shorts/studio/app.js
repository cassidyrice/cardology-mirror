const state = { context: null, output: null, variant: 0 };

const form = document.querySelector("#generator-form");
const postType = document.querySelector("#post-type");
const dateSlug = document.querySelector("#date-slug");
const cardSlug = document.querySelector("#card-slug");
const cardASlug = document.querySelector("#card-a-slug");
const cardBSlug = document.querySelector("#card-b-slug");
const goal = document.querySelector("#goal");
const trendIdea = document.querySelector("#trend-idea");
const errorBox = document.querySelector("#form-error");

boot();

async function boot() {
  try {
    const response = await fetch("/api/context");
    state.context = await response.json();
    fillSelect(postType, state.context.postTypes, "value", "label");
    fillSelect(goal, state.context.goals, "value", "label");
    fillSelect(dateSlug, state.context.dates, "slug", "label", (item) => `${item.label} · ${item.cardLabel}`);
    for (const select of [cardSlug, cardASlug, cardBSlug]) {
      fillSelect(select, state.context.cards, "slug", "label", (item) => `${item.label} · ${item.title || "Card meaning"}`);
    }
    chooseToday();
    cardBSlug.selectedIndex = Math.min(13, cardBSlug.options.length - 1);
    updateFields();
  } catch (error) {
    showError("The studio could not load Card Blueprints data.");
  }
}

postType.addEventListener("change", updateFields);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.variant = 0;
  await generate();
});

document.querySelector("#another-button").addEventListener("click", async () => {
  state.variant = (state.variant + 1) % 3;
  await generate();
});

document.querySelector("#surprise-button").addEventListener("click", async () => {
  const types = ["birthday_reveal", "card_meaning", "compatibility"];
  postType.value = types[Math.floor(Math.random() * types.length)];
  dateSlug.selectedIndex = Math.floor(Math.random() * dateSlug.options.length);
  cardSlug.selectedIndex = Math.floor(Math.random() * cardSlug.options.length);
  cardASlug.selectedIndex = Math.floor(Math.random() * cardASlug.options.length);
  cardBSlug.selectedIndex = Math.floor(Math.random() * cardBSlug.options.length);
  updateFields();
  state.variant = Math.floor(Math.random() * 3);
  await generate();
});

document.querySelector("#copy-script").addEventListener("click", () => {
  if (!state.output) return;
  const lines = [
    state.output.title,
    "",
    `HOOK: ${state.output.hook}`,
    "",
    ...state.output.scenes.flatMap((scene) => [
      `${scene.start}–${scene.end}s`,
      `VISUAL: ${scene.visual}`,
      `ON SCREEN: ${scene.screenText}`,
      `VOICEOVER: ${scene.voiceover}`,
      "",
    ]),
    "CAPTION:",
    state.output.caption,
  ];
  copyText(lines.join("\n"), document.querySelector("#copy-script"));
});

document.querySelector("#copy-caption").addEventListener("click", () => {
  if (state.output) copyText(state.output.caption, document.querySelector("#copy-caption"));
});

async function generate() {
  clearError();
  setBusy(true);
  const duration = Number(document.querySelector('input[name="duration"]:checked').value);
  const payload = {
    postType: postType.value,
    duration,
    goal: goal.value,
    dateSlug: dateSlug.value,
    cardSlug: cardSlug.value,
    cardASlug: cardASlug.value,
    cardBSlug: cardBSlug.value,
    trendIdea: trendIdea.value.trim(),
    variant: state.variant,
  };
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not make the script.");
    state.output = data;
    render(data);
  } catch (error) {
    showError(error.message || "Could not make the script.");
  } finally {
    setBusy(false);
  }
}

function render(output) {
  document.querySelector("#empty-state").hidden = true;
  document.querySelector("#result").hidden = false;
  document.querySelector("#hook-output").textContent = output.hook;
  document.querySelector("#word-count").textContent = `${output.duration}-second post · ${output.wordCount} spoken words`;
  document.querySelector("#voiceover-output").textContent = output.voiceover;
  document.querySelector("#caption-output").textContent = output.caption;
  document.querySelector("#phone-hook").textContent = output.scenes[0]?.screenText || output.hook;
  document.querySelector("#phone-subject").textContent = output.subjectLabel;
  document.querySelector("#phone-cta").textContent = output.cta;

  const asset = output.visualAssets.find((value) => value.includes("/public/pins/"));
  const phone = document.querySelector("#phone-screen");
  phone.style.backgroundImage = asset
    ? `linear-gradient(to bottom, rgba(0,0,0,.18), rgba(0,0,0,.8)), url("${asset.replace("/public/", "/assets/")}")`
    : "linear-gradient(to bottom, rgba(0,0,0,.18), rgba(0,0,0,.8)), radial-gradient(circle at 50% 32%, rgba(184,146,77,.38), transparent 45%)";

  renderList("#facts-output", output.factsChecked);
  renderList("#warnings-output", output.warnings);
  document.querySelector("#warnings-card").hidden = output.warnings.length === 0;

  const scenes = document.querySelector("#scenes");
  scenes.replaceChildren(...output.scenes.map((scene) => {
    const article = document.createElement("article");
    article.className = "scene";
    article.innerHTML = `
      <div class="scene-time">${scene.start}–${scene.end}s</div>
      <div class="scene-screen"></div>
      <div class="scene-voice"></div>
    `;
    article.querySelector(".scene-screen").textContent = scene.screenText;
    const voice = article.querySelector(".scene-voice");
    voice.textContent = scene.voiceover;
    const small = document.createElement("small");
    small.textContent = scene.visual;
    voice.append(small);
    return article;
  }));

  for (const id of ["#copy-script", "#copy-caption", "#another-button"]) {
    document.querySelector(id).disabled = false;
  }
}

function updateFields() {
  document.querySelector("#birthday-fields").hidden = postType.value !== "birthday_reveal";
  document.querySelector("#card-fields").hidden = postType.value !== "card_meaning";
  document.querySelector("#compatibility-fields").hidden = postType.value !== "compatibility";
}

function fillSelect(select, items, valueKey, labelKey, formatter) {
  select.replaceChildren(...items.map((item) => {
    const option = document.createElement("option");
    option.value = item[valueKey];
    option.textContent = formatter ? formatter(item) : item[labelKey];
    return option;
  }));
}

function chooseToday() {
  const now = new Date();
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const slug = `${months[now.getMonth()]}-${now.getDate()}`;
  if ([...dateSlug.options].some((option) => option.value === slug)) dateSlug.value = slug;
}

function renderList(selector, items) {
  document.querySelector(selector).replaceChildren(...items.map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));
}

function setBusy(busy) {
  const button = form.querySelector("button[type=submit]");
  button.disabled = busy;
  button.textContent = busy ? "Checking the cards..." : "Make my script";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

async function copyText(text, button) {
  const before = button.textContent;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopy(text);
    }
    button.textContent = "Copied";
  } catch (error) {
    try {
      fallbackCopy(text);
      button.textContent = "Copied";
    } catch (fallbackError) {
      button.textContent = "Copy failed";
    }
  }
  setTimeout(() => { button.textContent = before; }, 1200);
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy was blocked.");
}
