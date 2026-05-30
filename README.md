# matteovissani.github.io

Personal research portfolio of **Matteo Vissani, PhD** — neuroengineer at MGH / Harvard.

Synthwave / retrowave themed single-page site built with **React + TypeScript + Vite**,
**framer-motion** for scroll animations, and **react-three-fiber + three.js** for the
animated 3D neural-network hero (with a bloom post-processing pass).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # type-check + bundle to dist/
npm run preview  # serve the production build locally
```

## Deploy

Deployment is automated via GitHub Actions (`.github/workflows/deploy.yml`):
every push to `master` builds the site and publishes `dist/` to GitHub Pages.

**One-time setup:** in the repo, go to **Settings → Pages → Build and deployment**
and set **Source: GitHub Actions**.

## Structure

```
src/
  components/   React components (Hero, Sections, NeuralScene, …)
  data/         content.ts — all CV-derived content lives here
  index.css     synthwave design system
public/         static assets (images, papers, CV pdf) copied verbatim to dist/
legacy/         the previous website, kept for reference
```

To update content (publications, awards, bio, links), edit `src/data/content.ts`.
