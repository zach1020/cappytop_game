Original prompt: Codex, I want to make a little 2D turn-based RPG game. Please implement this: I want a 16x16 board of these grass tiles that I've provided, each waving independently per the sprte sheet, and then I want a hero (the one I've provided) to be able to use click-based movement around the field/board. Please don't worry about turn-basing it yet. We will get to that. I just want to see some movement. Use the hero at the first step of the sprite sheet. Don't animate him yet. But DO animate the grass

Updates:
- Inspected provided assets. `grass_tile_waving.png` is treated as 584x584 frames in a 6-column sheet. `hero_attacking.png` is treated as 584px columns and 572px rows; only frame 0 is used.
- Added a Vite/React canvas game: 16x16 grass board, independently offset grass animation, static first-frame hero sprite, click-to-tile movement, fullscreen key, and `render_game_to_text` / `advanceTime` test hooks.
- Ran `npm install` and `npm run build`; build completed successfully.
- Added `zsprite_sheet.png` water terrain to the board. Water uses the same 584px frame grid, animates independently, and is treated as blocked terrain for click movement/pathfinding.
- Expanded the board to 19x19, slowed grass/water animation to 50% speed, added the dragon sprite as a blocking board occupant, and implemented a hero/dragon turn loop. Hero can move up to 5 squares or attack the dragon within 2 squares; dragon attacks within 2 squares or moves up to 5 squares toward the hero.
- Ran `npm run build`; build completed successfully after the turn-system changes.
- Added sprite-sheet attack playback for hero/dragon, auto/manual camera zoom, a bottom pixel-styled music player with four WAV tracks, and enlarged hover tiles that float above the board. Hero rendering now disappears at 0 HP.

TODO:
- Run final build and browser screenshot/state checks after the latest hover/music/camera/attack updates.
- Added fixed six-stage campaign data with hard-coded terrain maps, chest placements, hero starts, and dragon squads that scale up through a very hard final stage.
- Converted enemy logic from one dragon to multiple fixed dragons per stage, including dragon turns, targeting, attacks, health bars, camera framing, and text state output.
- Added stage outcomes: level clear, campaign clear reward/stat screen, game over, repeat stage, next stage, restart game, and end-turn controls.
- Removed the rewind feature entirely after it caused freezes: no history snapshots, no rewind button, no `window.rewind_turn` hook.
- Fixed archer attack sheet slicing to use the actual 6x3 grid (`502x560` frames) so the attack no longer cuts across rows.
- Increased close-range auto zoom for a more intimate camera when pertinent characters cluster, while keeping all living party/enemies in frame.
- Wired attack rumble into the actual terrain/highlight rendering and decay loop: target tile shakes strongly, adjacent tiles shake lightly.
- Ran `npm run build`; build completed successfully. Ran web-game Playwright smoke check and inspected screenshot/state for Stage 1 load.

TODO:
- Play through later stages manually to tune exact dragon HP/damage and chest placements for difficulty feel.
- Updated dragon ranged attack behavior to use the same tactical range as ranged player characters: wizard/archer range 5, dragons range 5 across every hard-coded stage. Dragons still move on their turn when targets are outside that range.
- Ran `npm run build`; build completed successfully. Ran web-game Playwright smoke check and confirmed text state reports `dragon_attack_range: 5`.
- Investigated Vercel green-screen deployment: production `dist/` was missing the root-level PNG/WAV assets because Vite only copies files from `public/` or imported assets. Moved all runtime image/audio assets into `public/` so existing `/asset-name` URLs work in dev and production.
- Added `README.md` with project overview, local commands, structure, and Vercel asset troubleshooting notes.
- Ran `npm run build`; production `dist/` now includes all PNG/WAV assets. Ran Vite preview plus web-game Playwright smoke check and visually inspected `output/web-game/shot-0.png`; the game board, terrain, party, dragon, and chest render correctly. Console check found no JS errors; one WAV request was aborted by the browser during idle load, which is harmless for the render fix.
- Added session chest power: each opened chest grants a small capped ATK/DEF bonus to the three player characters. The bonus lives outside per-stage battle state, so it persists through game over and Retry/Restart within the same browser session.
