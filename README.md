# JazzCat v0.4

JazzCat is a small TypeScript prototype for jazz-harmony analysis and guitar-practice guidance.

The current milestone is "Smarter Tune Study Mode":

- extracting and preserving `irealb://` data from iReal Pro HTML exports;
- loading built-in demo tunes;
- pasting direct `irealb://` links;
- uploading iReal Pro HTML files in the browser;
- analysing plain-text chord progressions with optional metadata;
- parsing section headers such as A, Bridge, Tag, Intro, and Outro;
- manually curated five-tune chord fixtures while the iReal grammar is expanded;
- chord normalisation and transposition;
- rule-based cadence, turnaround, dominant-chain, modal-vamp, and local key-centre detection;
- semantic harmony regions and guitarist-ready practice objects;
- lead-sheet-style Tune Study chart view with 4-bar phrase grouping;
- harmony map / region summary for the current tune study;
- selected-region Practice Mode with guitar tasks;
- mini key trainer for transposed practice versions;
- copy/download Practice Pack JSON with optional practice notes;
- future-facing type foundations for course, guitar, media, library, knowledge, and Retriever packs.

## Commands

```sh
npm install
npm run build:preview
npm test
npm run analyse -- fixtures/autumn-leaves.html
npm run analyse:text -- fixtures/plain-text/ii-v-i.txt
```

The analyser writes JSON only.

## Browser App

Build the browser data and serve the static app:

```sh
npm run build:preview
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/ui/index.html
```

Unknown iReal charts preserve metadata and payload, but they need a decoded chord fixture before JazzCat can display a chord grid.

## Limitations

- Full iReal chord-body decoding is still incomplete.
- The plain-text parser is intentionally simple and rule-based; it preserves common metadata and sections but is not a full notation grammar.
- Harmony analysis and guitar tasks are rule-based starter guidance, not a full theory engine or guitar curriculum.
- Playback, media search, book/library features, Retriever packs, and full tune pages remain future work.
