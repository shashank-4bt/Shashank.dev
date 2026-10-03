# Shashank Kumar Singh — Portfolio

Static personal portfolio. HTML, CSS, and vanilla JavaScript.

## Run locally

```bash
npm run dev
```

Opens a local static server (default `http://localhost:3000`).

## Build

```bash
npm run build
```

Copies the site into `dist/`. Preview the production output with:

```bash
npm start
```

The production build does **not** call GitHub. Skill relationships are read from the generated file in `src/data/skill-usage.js`.

## Refresh GitHub-derived skills

The Skills section is generated from repositories under [github.com/shashank-4bt](https://github.com/shashank-4bt), including private repositories the authenticated CLI can read.

```bash
npm run update-skills
```

This inspects repository languages, trees, manifests, and selected source files, then rewrites `src/data/skill-usage.js`. It does not change layout or copy.

Requirements:

- GitHub CLI (`gh`) installed and authenticated (`gh auth login`)
- Access to private repositories such as Knowlyy if those mappings should stay current

Manual aliases and optional skill overrides live in `src/data/skill-config.js`. Re-run `npm run update-skills` after editing that file. Commit the regenerated `src/data/skill-usage.js` so Vercel and Render builds stay offline.

## Deploy

Vercel uses `vercel.json`: build command `node build.mjs`, output directory `dist`.

Render static hosting can use `render.yaml`: the same `node build.mjs` command and `dist` publish directory. No GitHub token is required at deploy time.
