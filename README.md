# JazzCat v0.1

JazzCat is a small TypeScript prototype for jazz-harmony analysis.

This first build focuses on:

- extracting and preserving `irealb://` data from iReal Pro HTML exports;
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

## Preview

Build the browser data and serve the static preview:

```sh
npm run build:preview
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/ui/index.html
```
