# Cappytop Game

A small browser-based 2D tactical RPG built with React, Vite, and an HTML canvas.

The game is a turn-based board battle on a 19x19 animated terrain grid. A party of three heroes moves around the field, opens chests, and fights dragon encounters across a short fixed-stage campaign. Sprite sheets provide the animated grass, water, heroes, enemies, projectiles, chest, and music player tracks.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment Notes

This app expects image and audio assets to be served from root URLs such as `/grass_tile_waving.png` and `/Glitch Anthem.wav`. In Vite, those files must live in `public/` so they are copied into the production `dist/` folder.

If a deployed version only shows the green background, check the browser console and network tab for missing asset requests. It usually means the production build cannot find the PNG or WAV files, not that npm modules need to load in the browser. Vercel installs npm dependencies during the build and ships the compiled static files.

## Project Structure

- `src/main.jsx` contains the React app, canvas rendering loop, turn logic, stage data, and game-state test hooks.
- `src/styles.css` contains the page layout and music/reward UI styling.
- `public/` contains the static game assets copied into production builds.
- `progress.md` records implementation notes and follow-up ideas from previous development passes.
