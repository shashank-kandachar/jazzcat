const data = window.JAZZCAT_PREVIEW_DATA;

const state = {
  tuneIndex: 0,
  regionIndex: 0
};

const tuneTitle = document.querySelector("#tune-title");
const metaKey = document.querySelector("#meta-key");
const metaStyle = document.querySelector("#meta-style");
const metaRegions = document.querySelector("#meta-regions");
const confidenceSummary = document.querySelector("#confidence-summary");
const irealStatus = document.querySelector("#ireal-status");
const tuneTabs = document.querySelector("#tune-tabs");
const chartGrid = document.querySelector("#chart-grid");
const regionList = document.querySelector("#region-list");
const practiceList = document.querySelector("#practice-list");
const payloadPreview = document.querySelector("#payload-preview");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tune() {
  return data.tunes[state.tuneIndex];
}

function regionForBar(selectedTune, bar) {
  return selectedTune.regions.find((region) => bar >= region.start_bar && bar <= region.end_bar);
}

function activeRegion() {
  return tune().regions[state.regionIndex] ?? tune().regions[0];
}

function setTune(index) {
  state.tuneIndex = index;
  state.regionIndex = 0;
  render();
}

function setRegion(index) {
  state.regionIndex = index;
  render();
}

function renderTabs() {
  tuneTabs.innerHTML = data.tunes
    .map(
      (item, index) => `
        <button
          class="tab-button"
          type="button"
          aria-selected="${index === state.tuneIndex}"
          data-tune-index="${index}"
        >
          ${escapeHtml(item.title)}
        </button>
      `
    )
    .join("");
}

function renderChart() {
  const selectedTune = tune();
  const selectedRegion = activeRegion();

  chartGrid.innerHTML = selectedTune.chords
    .map((chord) => {
      const region = regionForBar(selectedTune, chord.bar);
      const role = region?.colour_role ?? "ambiguous-region";
      const active = selectedRegion && chord.bar >= selectedRegion.start_bar && chord.bar <= selectedRegion.end_bar;
      return `
        <div class="chord-cell ${escapeHtml(role)} ${active ? "is-active" : ""}">
          <span class="bar-number">Bar ${chord.bar}</span>
          <span class="chord-symbol">${escapeHtml(chord.symbol)}</span>
        </div>
      `;
    })
    .join("");
}

function renderRegions() {
  const selectedTune = tune();
  const highCount = selectedTune.regions.filter((region) => region.confidence === "high").length;
  confidenceSummary.textContent = `${highCount} high-confidence`;

  regionList.innerHTML = selectedTune.regions
    .map(
      (region, index) => `
        <button
          type="button"
          class="region-button ${escapeHtml(region.colour_role)}"
          aria-pressed="${index === state.regionIndex}"
          data-region-index="${index}"
        >
          <span class="region-topline">
            <span class="region-key">${escapeHtml(region.local_key)}</span>
            <span class="confidence">${escapeHtml(region.confidence)}</span>
          </span>
          <span class="region-function">Bars ${region.start_bar}-${region.end_bar} · ${escapeHtml(region.function)}</span>
          <span class="hint">${escapeHtml(selectedTune.analysis[index]?.practice_hint ?? "")}</span>
        </button>
      `
    )
    .join("");
}

function renderPractice() {
  const selectedTune = tune();
  if (selectedTune.practice_objects.length === 0) {
    practiceList.innerHTML = '<p class="quiet-text">No practice objects for this tune yet.</p>';
    return;
  }

  practiceList.innerHTML = selectedTune.practice_objects
    .map(
      (practice) => `
        <article class="practice-item">
          <div class="practice-topline">
            <strong class="practice-title">${escapeHtml(practice.exercise_type)}</strong>
            <span class="confidence">${escapeHtml(practice.think_v)}</span>
          </div>
          <p class="hint">${escapeHtml(practice.source_chords.join(" | "))}</p>
          <div class="practice-scale">
            <div>
              <span>Inside</span>
              <strong>${escapeHtml(practice.inside_scale)}</strong>
            </div>
            <div>
              <span>Tension</span>
              <strong>${escapeHtml(practice.tension_scale)}</strong>
            </div>
          </div>
          <p class="drill">${escapeHtml(practice.suggested_drills[0] ?? "")}</p>
        </article>
      `
    )
    .join("");
}

function renderPayload() {
  const selectedTune = tune();
  irealStatus.textContent = selectedTune.ireal.raw_payload_preserved
    ? `iReal preserved · ${selectedTune.ireal.chord_body_length} chars`
    : "No iReal payload";
  payloadPreview.textContent = selectedTune.ireal.decoded_payload_prefix;
}

function renderMeta() {
  const selectedTune = tune();
  tuneTitle.textContent = selectedTune.title;
  metaKey.textContent = selectedTune.declared_key;
  metaStyle.textContent = selectedTune.style;
  metaRegions.textContent = String(selectedTune.regions.length);
}

function bindEvents() {
  tuneTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tune-index]");
    if (!button) return;
    setTune(Number(button.dataset.tuneIndex));
  });

  regionList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-region-index]");
    if (!button) return;
    setRegion(Number(button.dataset.regionIndex));
  });
}

function render() {
  renderTabs();
  renderMeta();
  renderChart();
  renderRegions();
  renderPractice();
  renderPayload();
}

bindEvents();
render();
