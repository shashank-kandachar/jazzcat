# JazzCat v0.2

JazzCat is a small TypeScript prototype for jazz-harmony analysis and guitar-practice guidance.

The current milestone is "Bring Your Own Chart":

- extracting and preserving `irealb://` data from iReal Pro HTML exports;
- loading built-in demo tunes;
- pasting direct `irealb://` links;
- uploading iReal Pro HTML files in the browser;
- manually curated five-tune chord fixtures while the iReal grammar is expanded;
- chord normalisation and transposition;
- rule-based cadence and local key-centre detection;
- semantic harmony regions and guitarist-ready practice objects;
- future-facing type foundations for course, guitar, media, library, knowledge, and Retriever packs.

## Commands

```sh
npm install
npm run build:preview
npm test
npm run analyse -- fixtures/autumn-leaves.html
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
