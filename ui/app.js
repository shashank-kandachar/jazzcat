const data = window.JAZZCAT_PREVIEW_DATA;

const state = {
  activeSlug: data.demo_tunes[0]?.slug ?? "",
  regionIndex: 0,
  shift: 0,
  importInfo: null,
  unknownModel: null
};

const elements = {
  tuneTitle: document.querySelector("#tune-title"),
  metaComposer: document.querySelector("#meta-composer"),
  metaKey: document.querySelector("#meta-key"),
  metaStyle: document.querySelector("#meta-style"),
  metaTempo: document.querySelector("#meta-tempo"),
  metaShift: document.querySelector("#meta-shift"),
  metaRegions: document.querySelector("#meta-regions"),
  confidenceSummary: document.querySelector("#confidence-summary"),
  irealStatus: document.querySelector("#ireal-status"),
  demoSelect: document.querySelector("#demo-select"),
  loadDemoButton: document.querySelector("#load-demo-button"),
  irealInput: document.querySelector("#ireal-input"),
  analysePasteButton: document.querySelector("#analyse-paste-button"),
  htmlFileInput: document.querySelector("#html-file-input"),
  analyseUploadButton: document.querySelector("#analyse-upload-button"),
  warningList: document.querySelector("#warning-list"),
  transposeDown: document.querySelector("#transpose-down"),
  transposeUp: document.querySelector("#transpose-up"),
  transposeReset: document.querySelector("#transpose-reset"),
  transposeLabel: document.querySelector("#transpose-label"),
  chartGrid: document.querySelector("#chart-grid"),
  regionList: document.querySelector("#region-list"),
  regionDetail: document.querySelector("#region-detail"),
  practiceList: document.querySelector("#practice-list"),
  payloadPreview: document.querySelector("#payload-preview"),
  payloadLength: document.querySelector("#payload-length")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function aliasKey(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function wrapShift(value) {
  const wrapped = ((value % 12) + 12) % 12;
  return wrapped > 6 ? wrapped - 12 : wrapped;
}

function formatShift(value) {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : String(value);
}

function decodeUrl(url) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function extractIrealLink(input) {
  const trimmed = input.trim();
  if (trimmed.startsWith("irealb://")) return trimmed;

  const hrefMatch = /href=["'](irealb:\/\/[^"']+)["']/i.exec(input);
  if (hrefMatch) return hrefMatch[1].replace(/&amp;/g, "&");

  const looseMatch = /(irealb:\/\/[^\s"'<>]+)/i.exec(input);
  return looseMatch ? looseMatch[1].replace(/&amp;/g, "&") : null;
}

function humanKey(raw) {
  if (!raw) return null;
  return raw.endsWith("-") ? `${raw.slice(0, -1)} minor` : `${raw} major`;
}

function findTempo(parts) {
  const numericParts = parts.map((part) => Number(part)).filter((value) => Number.isInteger(value) && value >= 40 && value <= 300);
  return numericParts.length > 0 ? numericParts[numericParts.length - 1] : null;
}

function findChordBodyIndex(parts) {
  const index = parts.findIndex((part, position) => position > 4 && /[A-G][#b-]?|\|/.test(part) && part.length > 8);
  return index >= 0 ? index : 5;
}

function parseIrealMetadata(rawUrl) {
  const decoded = decodeUrl(rawUrl);
  const encodedBody = rawUrl.replace(/^irealb:\/\//i, "");
  const decodedBody = decoded.replace(/^irealb:\/\//i, "");
  const encodedParts = encodedBody.split("=");
  const parts = decodedBody.split("=");
  const chordBodyIndex = findChordBodyIndex(parts);
  const declaredKeyRaw = parts[4] || null;

  return {
    raw_url: rawUrl,
    raw_decoded_payload: decoded,
    encoded_chord_body_payload: encodedParts[chordBodyIndex] || null,
    decoded_chord_body_payload: parts[chordBodyIndex] || null,
    metadata: {
      title: parts[0] || null,
      composer: parts[1] || null,
      style: parts[3] || null,
      declared_key_raw: declaredKeyRaw,
      declared_key: humanKey(declaredKeyRaw),
      tempo: findTempo(parts)
    }
  };
}

function parseChartInput(kind, value) {
  const trimmed = value.trim();
  const rawUrl = kind === "ireal_link" || trimmed.startsWith("irealb://") ? trimmed : extractIrealLink(value);

  if (!rawUrl) {
    return {
      parsed: {
        raw_url: "",
        raw_decoded_payload: "",
        encoded_chord_body_payload: null,
        decoded_chord_body_payload: null,
        metadata: {
          title: null,
          composer: null,
          style: null,
          declared_key_raw: null,
          declared_key: null,
          tempo: null
        }
      },
      warnings: ["No irealb:// URL found in input."]
    };
  }

  return {
    parsed: parseIrealMetadata(rawUrl),
    warnings: []
  };
}

function findDemoByTitle(title) {
  const key = aliasKey(title);
  return data.demo_tunes.find((tune) => tune.aliases.includes(key) || aliasKey(tune.title) === key) ?? null;
}

function demoTune(slug = state.activeSlug) {
  return data.demo_tunes.find((tune) => tune.slug === slug) ?? data.demo_tunes[0];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function payloadView(parsed) {
  const rawDecoded = parsed?.raw_decoded_payload ?? "";
  const decodedBody = parsed?.decoded_chord_body_payload ?? null;
  return {
    raw_url: parsed?.raw_url ?? "",
    raw_decoded_payload: rawDecoded,
    decoded_payload_prefix: rawDecoded.slice(0, 260),
    encoded_chord_body_payload: parsed?.encoded_chord_body_payload ?? null,
    decoded_chord_body_payload: decodedBody,
    chord_body_length: decodedBody?.length ?? 0,
    raw_url_present: Boolean(parsed?.raw_url),
    raw_payload_preserved: Boolean(rawDecoded)
  };
}

function applyImportOverlay(model, importInfo) {
  if (!importInfo) return model;
  const metadata = importInfo.parsed.metadata;
  return {
    ...model,
    source_kind: importInfo.kind === "ireal_link" ? "pasted_ireal" : "uploaded_html",
    title: metadata.title ?? model.title,
    composer: metadata.composer ?? model.composer,
    declared_key: metadata.declared_key ?? model.declared_key,
    style: metadata.style ?? model.style,
    tempo: metadata.tempo ?? model.tempo,
    ireal: payloadView(importInfo.parsed),
    warnings: [...new Set([...(importInfo.warnings ?? []), ...(model.warnings ?? [])])]
  };
}

function createUnknownModel(parsed, kind, warnings) {
  return {
    id: "unknown-ireal-chart",
    source_kind: "unknown_ireal",
    title: parsed.metadata.title ?? "Unknown iReal Chart",
    composer: parsed.metadata.composer ?? null,
    declared_key: parsed.metadata.declared_key ?? null,
    style: parsed.metadata.style ?? null,
    tempo: parsed.metadata.tempo ?? null,
    current_transposition_shift: 0,
    current_transposition_label: "0",
    expected_regions: [],
    chords: [],
    regions: [],
    analysis: [],
    practice_objects: [],
    ireal: payloadView(parsed),
    warnings: [
      ...new Set([
        ...warnings,
        "Chord body preserved, but this chart does not yet have a decoded chord fixture.",
        `Source accepted as ${kind === "ireal_link" ? "pasted_ireal" : "uploaded_html"}.`
      ])
    ]
  };
}

function currentModel() {
  if (state.unknownModel) return state.unknownModel;
  const selectedTune = demoTune();
  const model = clone(selectedTune.models_by_shift[String(state.shift)] ?? selectedTune.models_by_shift["0"]);
  return applyImportOverlay(model, state.importInfo);
}

function currentAnalysisForRegion(model, regionIndex) {
  return model.analysis[regionIndex] ?? null;
}

function practiceForAnalysis(model, analysis) {
  if (!analysis) return null;
  return model.practice_objects.find((practice) => practice.source_chords.join("|") === analysis.chords.join("|")) ?? null;
}

function regionForBar(model, bar) {
  return model.regions.find((region) => bar >= region.start_bar && bar <= region.end_bar) ?? null;
}

function setDemo(slug) {
  state.activeSlug = slug;
  state.regionIndex = 0;
  state.shift = 0;
  state.importInfo = null;
  state.unknownModel = null;
  render();
}

function setImported(kind, value) {
  const result = parseChartInput(kind, value);
  const matchedDemo = findDemoByTitle(result.parsed.metadata.title);

  if (!matchedDemo) {
    state.unknownModel = createUnknownModel(result.parsed, kind, result.warnings);
    state.importInfo = null;
    state.regionIndex = 0;
    state.shift = 0;
    render();
    return;
  }

  state.activeSlug = matchedDemo.slug;
  state.regionIndex = 0;
  state.shift = 0;
  state.unknownModel = null;
  state.importInfo = {
    kind,
    parsed: result.parsed,
    warnings: result.warnings
  };
  elements.demoSelect.value = matchedDemo.slug;
  render();
}

function setRegion(index) {
  state.regionIndex = index;
  render();
}

function setShift(delta) {
  if (state.unknownModel) return;
  state.shift = wrapShift(state.shift + delta);
  state.regionIndex = 0;
  render();
}

function resetShift() {
  state.shift = 0;
  state.regionIndex = 0;
  render();
}

function renderDemoSelect() {
  elements.demoSelect.innerHTML = data.demo_tunes
    .map((tune) => `<option value="${escapeHtml(tune.slug)}">${escapeHtml(tune.title)}</option>`)
    .join("");
  elements.demoSelect.value = state.activeSlug;
}

function renderMeta(model) {
  elements.tuneTitle.textContent = model.title;
  elements.metaComposer.textContent = model.composer || "-";
  elements.metaKey.textContent = model.declared_key || "-";
  elements.metaStyle.textContent = model.style || "-";
  elements.metaTempo.textContent = model.tempo ? String(model.tempo) : "-";
  elements.metaShift.textContent = model.current_transposition_label;
  elements.metaRegions.textContent = String(model.regions.length);
  elements.transposeLabel.textContent = `Shift ${formatShift(state.shift)}`;
  const transposeDisabled = model.chords.length === 0;
  elements.transposeDown.disabled = transposeDisabled;
  elements.transposeUp.disabled = transposeDisabled;
  elements.transposeReset.disabled = transposeDisabled;
}

function renderWarnings(model) {
  elements.warningList.innerHTML = model.warnings.length
    ? model.warnings.map((warning) => `<span class="warning-pill">${escapeHtml(warning)}</span>`).join(" ")
    : "";
}

function renderChart(model) {
  const selectedRegion = model.regions[state.regionIndex] ?? null;

  if (model.chords.length === 0) {
    elements.chartGrid.innerHTML = `<div class="empty-state">Chord body preserved, but no decoded chord grid is available yet.</div>`;
    return;
  }

  elements.chartGrid.innerHTML = model.chords
    .map((chord) => {
      const region = regionForBar(model, chord.bar);
      const role = region?.colour_role ?? "ambiguous-region";
      const active = selectedRegion && chord.bar >= selectedRegion.start_bar && chord.bar <= selectedRegion.end_bar;
      return `
        <button
          type="button"
          class="chord-cell ${escapeHtml(role)} ${active ? "is-active" : ""}"
          data-region-id="${escapeHtml(region?.region_id ?? "")}"
          aria-label="Bar ${chord.bar} ${escapeHtml(chord.symbol)}"
        >
          <span class="bar-number">Bar ${chord.bar}</span>
          <span class="region-chip">${escapeHtml(region?.local_key ?? "")}</span>
          <span class="chord-symbol">${escapeHtml(chord.symbol)}</span>
        </button>
      `;
    })
    .join("");
}

function renderRegions(model) {
  const highCount = model.regions.filter((region) => region.confidence === "high").length;
  elements.confidenceSummary.textContent = model.regions.length ? `${highCount} high-confidence` : "No decoded regions";

  if (model.regions.length === 0) {
    elements.regionList.innerHTML = `<p class="quiet-text">No regions yet.</p>`;
    return;
  }

  elements.regionList.innerHTML = model.regions
    .map((region, index) => {
      const analysis = currentAnalysisForRegion(model, index);
      return `
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
          <span class="hint">${escapeHtml(analysis?.practice_hint ?? "")}</span>
        </button>
      `;
    })
    .join("");
}

function renderRegionDetail(model) {
  const region = model.regions[state.regionIndex] ?? null;
  const analysis = currentAnalysisForRegion(model, state.regionIndex);

  if (!region || !analysis) {
    elements.regionDetail.innerHTML = `<p class="quiet-text">No selected region.</p>`;
    return;
  }

  elements.regionDetail.innerHTML = `
    <dl class="detail-grid">
      <div>
        <dt>Local Key</dt>
        <dd>${escapeHtml(region.local_key)}</dd>
      </div>
      <div>
        <dt>Function</dt>
        <dd>${escapeHtml(region.function)}</dd>
      </div>
      <div>
        <dt>Confidence</dt>
        <dd>${escapeHtml(region.confidence)}</dd>
      </div>
      <div>
        <dt>Priority</dt>
        <dd>${escapeHtml(region.practice_priority)}</dd>
      </div>
      <div>
        <dt>Chords</dt>
        <dd>${escapeHtml(analysis.chords.join(" | "))}</dd>
      </div>
      <div>
        <dt>Think V</dt>
        <dd>${escapeHtml(analysis.think_v ?? "-")}</dd>
      </div>
      <div>
        <dt>Resolve To</dt>
        <dd>${escapeHtml(analysis.resolve_to ?? "-")}</dd>
      </div>
      <div>
        <dt>Inside</dt>
        <dd>${escapeHtml(analysis.scale_suggestions?.inside_scale ?? "-")}</dd>
      </div>
      <div>
        <dt>Tension</dt>
        <dd>${escapeHtml(analysis.scale_suggestions?.tension_scale ?? "-")}</dd>
      </div>
    </dl>
    <p class="detail-explanation">${escapeHtml(analysis.reason ?? analysis.practice_hint)}</p>
  `;
}

function renderPractice(model) {
  const analysis = currentAnalysisForRegion(model, state.regionIndex);
  const practice = practiceForAnalysis(model, analysis);

  if (!analysis) {
    elements.practiceList.innerHTML = `<p class="quiet-text">No practice card for this selection.</p>`;
    return;
  }

  const drills =
    practice?.suggested_drills ??
    [
      "Play only guide tones.",
      analysis.think_v ? `Play a line from ${analysis.think_v}.` : "Play chord tones slowly.",
      analysis.resolve_to ? `Resolve clearly to ${analysis.resolve_to}.` : "Resolve to the next stable chord.",
      "Move the exercise through 3 keys."
    ];

  elements.practiceList.innerHTML = `
    <article class="practice-item">
      <div class="practice-topline">
        <strong class="practice-title">${escapeHtml(analysis.function)}</strong>
        <span class="confidence">${escapeHtml(analysis.think_v ?? "study")}</span>
      </div>
      <p class="hint"><strong>Progression:</strong> ${escapeHtml(analysis.chords.join(" | "))}</p>
      <p class="hint"><strong>Goal:</strong> ${escapeHtml(analysis.practice_hint)}</p>
      <div class="practice-scale">
        <div>
          <span>Inside Sound</span>
          <strong>${escapeHtml(practice?.inside_scale ?? analysis.scale_suggestions?.inside_scale ?? "-")}</strong>
        </div>
        <div>
          <span>Tension Sound</span>
          <strong>${escapeHtml(practice?.tension_scale ?? analysis.scale_suggestions?.tension_scale ?? "-")}</strong>
        </div>
      </div>
      <ul class="drill-list">
        ${drills.map((drill) => `<li>${escapeHtml(drill)}</li>`).join("")}
      </ul>
      ${
        (practice?.target_tones ?? analysis.target_tones ?? []).length
          ? `<p class="target-tones"><strong>Target tones:</strong> ${escapeHtml((practice?.target_tones ?? analysis.target_tones).join(", "))}</p>`
          : ""
      }
    </article>
  `;
}

function renderPayload(model) {
  elements.irealStatus.textContent = model.ireal.raw_payload_preserved
    ? `iReal preserved · ${model.ireal.chord_body_length} chars`
    : "No iReal payload";
  elements.payloadLength.textContent = model.ireal.raw_url_present ? "Decoded payload" : "";
  elements.payloadPreview.textContent = model.ireal.raw_decoded_payload || "";
}

function bindEvents() {
  elements.loadDemoButton.addEventListener("click", () => setDemo(elements.demoSelect.value));

  elements.demoSelect.addEventListener("change", () => setDemo(elements.demoSelect.value));

  elements.analysePasteButton.addEventListener("click", () => {
    const value = elements.irealInput.value.trim();
    if (!value) return;
    setImported("ireal_link", value);
  });

  elements.analyseUploadButton.addEventListener("click", async () => {
    const file = elements.htmlFileInput.files?.[0];
    if (!file) return;
    const value = await file.text();
    setImported("ireal_html", value);
  });

  elements.transposeDown.addEventListener("click", () => setShift(-1));
  elements.transposeUp.addEventListener("click", () => setShift(1));
  elements.transposeReset.addEventListener("click", resetShift);

  elements.regionList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-region-index]");
    if (!button) return;
    setRegion(Number(button.dataset.regionIndex));
  });

  elements.chartGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-region-id]");
    if (!button || !button.dataset.regionId) return;
    const model = currentModel();
    const index = model.regions.findIndex((region) => region.region_id === button.dataset.regionId);
    if (index >= 0) setRegion(index);
  });
}

function render() {
  const model = currentModel();
  renderDemoSelect();
  renderMeta(model);
  renderWarnings(model);
  renderChart(model);
  renderRegions(model);
  renderRegionDetail(model);
  renderPractice(model);
  renderPayload(model);
}

bindEvents();
render();
