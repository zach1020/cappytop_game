import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const BOARD_SIZE = 19;
const GRASS_FRAME_SIZE = 584;
const GRASS_COLUMNS = 6;
const GRASS_FRAMES = 19;
const WATER_FRAME_SIZE = 584;
const WATER_COLUMNS = 6;
const WATER_FRAMES = 19;
const HERO_FRAME_WIDTH = 584;
const HERO_FRAME_HEIGHT = 572;
const HERO_ATTACK_COLUMNS = 6;
const HERO_ATTACK_FRAMES = 18;
const HERO_ATTACK_FPS = 15;
const DRAGON_FRAME_SIZE = 584;
const DRAGON_ATTACK_COLUMNS = 6;
const DRAGON_ATTACK_FRAMES = 42;
const DRAGON_ATTACK_FPS = 18;
const HERO_MOVE_SPEED = 4.2;
const DRAGON_MOVE_SPEED = 3.4;
const TERRAIN_ANIMATION_SPEED = 0.5;
const HERO_MOVE_RANGE = 5;
const DRAGON_MOVE_RANGE = 5;
const ATTACK_RANGE = 2;
const HERO_ATTACK_DAMAGE = 5;
const DRAGON_ATTACK_DAMAGE = 3;
const MIN_MANUAL_ZOOM = 0.6;
const MAX_MANUAL_ZOOM = 1.75;
const INITIAL_HERO_CELL = { col: 5, row: 9 };
const INITIAL_DRAGON_CELL = { col: 14, row: 14 };

const TRACKS = [
  { title: 'Cabbage Carousel', file: '__Cabbage Carousel__.wav' },
  { title: 'Glitch Anthem', file: 'Glitch Anthem.wav' },
  { title: 'Glitch Orchard', file: 'Glitch Orchard.wav' },
  { title: 'Soldered Stardust', file: 'Soldered Stardust.wav' },
];

const TERRAIN_MAP = [
  '...................',
  '...............~~~~',
  '..............~~~~~',
  '.............~~~~..',
  '............~~~~...',
  '...........~~~~....',
  '..........~~~~.....',
  '.........~~~~......',
  '.........~~~.......',
  '..........~~~......',
  '...........~~~~....',
  '............~~~~...',
  '...~~~.......~~~...',
  '..~~~~.............',
  '..~~~..............',
  '...................',
  '.....~~~...........',
  '.....~~~...........',
  '...................',
];

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cellCenter(cell, tileSize, boardOffset) {
  return boardOffset + cell * tileSize + tileSize / 2;
}

function cellKey(cell) {
  return `${cell.col},${cell.row}`;
}

function isCellInBounds(cell) {
  return cell.col >= 0 && cell.col < BOARD_SIZE && cell.row >= 0 && cell.row < BOARD_SIZE;
}

function isWaterCell(cell) {
  return TERRAIN_MAP[cell.row]?.[cell.col] === '~';
}

function gridDistance(a, b) {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

function isBlockedCell(cell, blockedKeys = new Set()) {
  return !isCellInBounds(cell) || isWaterCell(cell) || blockedKeys.has(cellKey(cell));
}

function createBoardTiles() {
  const tiles = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const hash = ((row + 3) * 928371 + (col + 7) * 364479) % 997;
      const terrain = TERRAIN_MAP[row][col] === '~' ? 'water' : 'grass';
      tiles.push({
        row,
        col,
        terrain,
        offset: hash % (terrain === 'water' ? WATER_FRAMES : GRASS_FRAMES),
        fps: (7.5 + (hash % 6) * 0.45) * TERRAIN_ANIMATION_SPEED,
      });
    }
  }

  return tiles;
}

function findPath(from, to, blockedKeys = new Set()) {
  if (isBlockedCell(to, blockedKeys)) {
    return [];
  }

  const startKey = cellKey(from);
  const targetKey = cellKey(to);

  if (startKey === targetKey) {
    return [];
  }

  const queue = [from];
  const visited = new Set([startKey]);
  const previous = new Map();
  const directions = [
    { col: 1, row: 0 },
    { col: -1, row: 0 },
    { col: 0, row: 1 },
    { col: 0, row: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const direction of directions) {
      const next = {
        col: current.col + direction.col,
        row: current.row + direction.row,
      };
      const nextKey = cellKey(next);

      if (isBlockedCell(next, blockedKeys) || visited.has(nextKey)) {
        continue;
      }

      visited.add(nextKey);
      previous.set(nextKey, current);

      if (nextKey === targetKey) {
        const path = [to];
        let cursor = current;

        while (cellKey(cursor) !== startKey) {
          path.push(cursor);
          cursor = previous.get(cellKey(cursor));
        }

        return path.reverse();
      }

      queue.push(next);
    }
  }

  return [];
}

function findReachableCells(from, maxSteps, blockedKeys = new Set()) {
  const startKey = cellKey(from);
  const queue = [{ cell: from, path: [] }];
  const visited = new Set([startKey]);
  const reachable = [];
  const directions = [
    { col: 1, row: 0 },
    { col: -1, row: 0 },
    { col: 0, row: 1 },
    { col: 0, row: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.path.length > 0) {
      reachable.push(current);
    }

    if (current.path.length >= maxSteps) {
      continue;
    }

    for (const direction of directions) {
      const next = {
        col: current.cell.col + direction.col,
        row: current.cell.row + direction.row,
      };
      const nextKey = cellKey(next);

      if (isBlockedCell(next, blockedKeys) || visited.has(nextKey)) {
        continue;
      }

      visited.add(nextKey);
      queue.push({
        cell: next,
        path: [...current.path, next],
      });
    }
  }

  return reachable;
}

function App() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const gameRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) {
      return;
    }

    audio.play().catch(() => {
      setIsPlaying(false);
    });
  }, [currentTrack, isPlaying]);

  function playPauseMusic() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      setIsPlaying(false);
    });
  }

  function skipTrack() {
    setCurrentTrack((track) => (track + 1) % TRACKS.length);
    setIsPlaying(true);
  }

  function onTrackEnded() {
    setCurrentTrack((track) => (track + 1) % TRACKS.length);
    setIsPlaying(true);
  }

  const track = TRACKS[currentTrack];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const grassImage = loadImage('/grass_tile_waving.png');
    const waterImage = loadImage('/zsprite_sheet.png');
    const heroImage = loadImage('/hero_attacking.png');
    const dragonImage = loadImage('/DRAGON_zsprite_sheet.png');
    const boardTiles = createBoardTiles();

    const state = {
      canvasWidth: 960,
      canvasHeight: 960,
      boardPixels: 844,
      boardOffsetX: 58,
      boardOffsetY: 72,
      tileSize: 44,
      time: 0,
      phase: 'hero_turn',
      aiDelay: 0,
      round: 1,
      lastAction: 'Hero turn',
      attackPulse: null,
      activeAttack: null,
      camera: {
        x: 480,
        y: 480,
        scale: 1,
        targetX: 480,
        targetY: 480,
        targetScale: 1,
        manualZoom: 1,
      },
      hero: {
        col: INITIAL_HERO_CELL.col,
        row: INITIAL_HERO_CELL.row,
        x: INITIAL_HERO_CELL.col,
        y: INITIAL_HERO_CELL.row,
        hp: 24,
        maxHp: 24,
        target: null,
        path: [],
        moving: false,
      },
      dragon: {
        col: INITIAL_DRAGON_CELL.col,
        row: INITIAL_DRAGON_CELL.row,
        x: INITIAL_DRAGON_CELL.col,
        y: INITIAL_DRAGON_CELL.row,
        hp: 30,
        maxHp: 30,
        target: null,
        path: [],
        moving: false,
      },
      hoverCell: null,
      lastClickCell: null,
      blockedClickCell: null,
      loaded: {
        grass: false,
        water: false,
        hero: false,
        dragon: false,
      },
    };

    gameRef.current = state;

    function heroCell() {
      return { col: state.hero.col, row: state.hero.row };
    }

    function dragonCell() {
      return { col: state.dragon.col, row: state.dragon.row };
    }

    function actorScreenCell(actor) {
      return { col: actor.x, row: actor.y };
    }

    function boardToWorld(cell) {
      return {
        x: cellCenter(cell.col, state.tileSize, state.boardOffsetX),
        y: cellCenter(cell.row, state.tileSize, state.boardOffsetY),
      };
    }

    function screenToWorld(point) {
      return {
        x: (point.x - state.canvasWidth / 2) / state.camera.scale + state.camera.x,
        y: (point.y - state.canvasHeight / 2) / state.camera.scale + state.camera.y,
      };
    }

    function setManualZoom(nextZoom) {
      state.camera.manualZoom = clamp(nextZoom, MIN_MANUAL_ZOOM, MAX_MANUAL_ZOOM);
      updateCameraTarget();
      render();
    }

    function setBlockedClick(cell, label = 'Blocked') {
      state.blockedClickCell = cell;
      state.lastClickCell = null;
      state.lastAction = label;
      render();
    }

    function resize() {
      const maxSide = Math.min(window.innerWidth - 32, window.innerHeight - 32, 980);
      const side = Math.max(420, Math.floor(maxSide));
      const ratio = window.devicePixelRatio || 1;

      state.canvasWidth = side;
      state.canvasHeight = side;
      state.boardPixels = Math.floor(side * 0.86);
      state.tileSize = state.boardPixels / BOARD_SIZE;
      state.boardOffsetX = (side - state.boardPixels) / 2;
      state.boardOffsetY = Math.max(56, (side - state.boardPixels) / 2 + 22);

      if (state.boardOffsetY + state.boardPixels > side - 10) {
        state.boardOffsetY = side - state.boardPixels - 10;
      }

      canvas.width = Math.floor(side * ratio);
      canvas.height = Math.floor(side * ratio);
      canvas.style.width = `${side}px`;
      canvas.style.height = `${side}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      updateCameraTarget();
      state.camera.x = state.camera.targetX;
      state.camera.y = state.camera.targetY;
      render();
    }

    function canvasToCell(event) {
      const rect = canvas.getBoundingClientRect();
      const world = screenToWorld({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      const col = Math.floor((world.x - state.boardOffsetX) / state.tileSize);
      const row = Math.floor((world.y - state.boardOffsetY) / state.tileSize);

      if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) {
        return null;
      }

      return { col, row };
    }

    function updateCameraTarget() {
      const heroPoint = boardToWorld(actorScreenCell(state.hero));
      const dragonPoint = state.dragon.hp > 0 ? boardToWorld(actorScreenCell(state.dragon)) : heroPoint;
      const padding = state.tileSize * 5.8;
      const minX = Math.min(heroPoint.x, dragonPoint.x) - padding;
      const maxX = Math.max(heroPoint.x, dragonPoint.x) + padding;
      const minY = Math.min(heroPoint.y, dragonPoint.y) - padding;
      const maxY = Math.max(heroPoint.y, dragonPoint.y) + padding;
      const focusWidth = Math.max(state.tileSize * 8, maxX - minX);
      const focusHeight = Math.max(state.tileSize * 8, maxY - minY);
      const autoScale = clamp(
        Math.min(state.canvasWidth / focusWidth, (state.canvasHeight - 56) / focusHeight),
        1,
        2.15,
      );

      state.camera.targetX = (minX + maxX) / 2;
      state.camera.targetY = (minY + maxY) / 2;
      state.camera.targetScale = clamp(autoScale * state.camera.manualZoom, 0.62, 2.65);
    }

    function updateCamera(dt) {
      updateCameraTarget();
      const ease = 1 - Math.pow(0.001, dt);
      state.camera.x += (state.camera.targetX - state.camera.x) * ease;
      state.camera.y += (state.camera.targetY - state.camera.y) * ease;
      state.camera.scale += (state.camera.targetScale - state.camera.scale) * ease;
    }

    function beginDragonTurn() {
      if (state.phase === 'victory' || state.phase === 'defeat') {
        return;
      }

      state.phase = 'dragon_turn';
      state.aiDelay = 0.35;
      state.lastAction = 'Dragon turn';
    }

    function beginHeroTurn() {
      if (state.phase === 'victory' || state.phase === 'defeat') {
        return;
      }

      state.phase = 'hero_turn';
      state.round += 1;
      state.lastAction = 'Hero turn';
    }

    function startHeroAttack() {
      state.phase = 'hero_attacking';
      state.activeAttack = {
        actor: 'hero',
        target: 'dragon',
        elapsed: 0,
        duration: HERO_ATTACK_FRAMES / HERO_ATTACK_FPS,
        damage: HERO_ATTACK_DAMAGE,
        applied: false,
      };
      state.lastAction = 'Hero attacks';
      state.lastClickCell = dragonCell();
      state.blockedClickCell = null;
    }

    function startDragonAttack() {
      state.phase = 'dragon_attacking';
      state.activeAttack = {
        actor: 'dragon',
        target: 'hero',
        elapsed: 0,
        duration: DRAGON_ATTACK_FRAMES / DRAGON_ATTACK_FPS,
        damage: DRAGON_ATTACK_DAMAGE,
        applied: false,
      };
      state.lastAction = 'Dragon attacks';
    }

    function applyAttackDamage() {
      if (!state.activeAttack || state.activeAttack.applied) {
        return;
      }

      state.activeAttack.applied = true;

      if (state.activeAttack.target === 'dragon') {
        state.dragon.hp = Math.max(0, state.dragon.hp - state.activeAttack.damage);
        state.attackPulse = { cell: dragonCell(), time: 0.35, color: 'rgba(255, 235, 116, 0.82)' };
        state.lastAction = `Hero hits dragon for ${state.activeAttack.damage}`;
      } else {
        state.hero.hp = Math.max(0, state.hero.hp - state.activeAttack.damage);
        state.attackPulse = { cell: heroCell(), time: 0.35, color: 'rgba(255, 97, 86, 0.86)' };
        state.lastAction = `Dragon hits hero for ${state.activeAttack.damage}`;
      }
    }

    function finishAttack() {
      if (!state.activeAttack) {
        return;
      }

      const actor = state.activeAttack.actor;
      state.activeAttack = null;

      if (state.dragon.hp <= 0) {
        state.phase = 'victory';
        state.lastAction = 'Dragon defeated';
        return;
      }

      if (state.hero.hp <= 0) {
        state.phase = 'defeat';
        state.lastAction = 'Hero defeated';
        return;
      }

      if (actor === 'hero') {
        beginDragonTurn();
      } else {
        beginHeroTurn();
      }
    }

    function moveHeroTo(cell) {
      if (state.phase !== 'hero_turn') {
        return;
      }

      const dragonKey = cellKey(dragonCell());

      if (cellKey(cell) === dragonKey) {
        if (gridDistance(heroCell(), dragonCell()) <= ATTACK_RANGE) {
          startHeroAttack();
        } else {
          setBlockedClick(cell, 'Dragon is out of range');
        }
        return;
      }

      if (isWaterCell(cell)) {
        setBlockedClick(cell, 'Water blocks movement');
        return;
      }

      const path = findPath(heroCell(), cell, new Set([dragonKey]));
      const isSameCell = cellKey(heroCell()) === cellKey(cell);

      if (!isSameCell && path.length === 0) {
        setBlockedClick(cell, 'No path');
        return;
      }

      if (path.length > HERO_MOVE_RANGE) {
        setBlockedClick(cell, `Move range is ${HERO_MOVE_RANGE}`);
        return;
      }

      state.hero.path = path;
      state.hero.target = path[0] || null;
      state.hero.moving = Boolean(state.hero.target);
      state.lastClickCell = cell;
      state.blockedClickCell = null;
      state.lastAction = path.length > 0 ? `Hero moves ${path.length}` : 'Hero waits';

      if (state.hero.moving) {
        state.phase = 'hero_moving';
      } else {
        beginDragonTurn();
      }
    }

    function chooseDragonMove() {
      const heroKey = cellKey(heroCell());
      const options = findReachableCells(dragonCell(), DRAGON_MOVE_RANGE, new Set([heroKey]));
      let best = null;

      for (const option of options) {
        const distance = gridDistance(option.cell, heroCell());
        const score = distance * 100 + option.path.length;

        if (!best || score < best.score) {
          best = { ...option, score };
        }
      }

      return best;
    }

    function dragonAct() {
      if (gridDistance(dragonCell(), heroCell()) <= ATTACK_RANGE) {
        startDragonAttack();
        return;
      }

      const move = chooseDragonMove();

      if (!move || move.path.length === 0) {
        state.lastAction = 'Dragon waits';
        beginHeroTurn();
        return;
      }

      state.dragon.path = move.path;
      state.dragon.target = move.path[0];
      state.dragon.moving = true;
      state.phase = 'dragon_moving';
      state.lastAction = `Dragon moves ${move.path.length}`;
    }

    function onPointerMove(event) {
      state.hoverCell = canvasToCell(event);
      render();
    }

    function onPointerLeave() {
      state.hoverCell = null;
      render();
    }

    function onPointerDown(event) {
      const cell = canvasToCell(event);
      if (cell) {
        moveHeroTo(cell);
      }
    }

    function onKeyDown(event) {
      if (event.key.toLowerCase() === 'f') {
        if (!document.fullscreenElement) {
          canvas.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      } else if (event.key === '+' || event.key === '=') {
        setManualZoom(state.camera.manualZoom * 1.12);
      } else if (event.key === '-' || event.key === '_') {
        setManualZoom(state.camera.manualZoom / 1.12);
      } else if (event.key === '0') {
        setManualZoom(1);
      }
    }

    function onWheel(event) {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      setManualZoom(state.camera.manualZoom * factor);
    }

    function updateMover(entity, dt, speed) {
      if (!entity.target) {
        entity.moving = false;
        return false;
      }

      const target = entity.target;
      const dx = target.col - entity.x;
      const dy = target.row - entity.y;
      const distance = Math.hypot(dx, dy);
      const step = speed * dt;

      if (distance <= step) {
        entity.x = target.col;
        entity.y = target.row;
        entity.col = target.col;
        entity.row = target.row;
        entity.path.shift();
        entity.target = entity.path[0] || null;
        entity.moving = Boolean(entity.target);
        return !entity.moving;
      }

      if (distance > 0) {
        entity.x += (dx / distance) * step;
        entity.y += (dy / distance) * step;
        entity.moving = true;
      }

      return false;
    }

    function update(dt) {
      state.time += dt;
      updateCamera(dt);

      if (state.attackPulse) {
        state.attackPulse.time -= dt;
        if (state.attackPulse.time <= 0) {
          state.attackPulse = null;
        }
      }

      if (state.phase === 'hero_attacking' || state.phase === 'dragon_attacking') {
        state.activeAttack.elapsed += dt;

        if (state.activeAttack.elapsed >= state.activeAttack.duration * 0.55) {
          applyAttackDamage();
        }

        if (state.activeAttack.elapsed >= state.activeAttack.duration) {
          if (!state.activeAttack.applied) {
            applyAttackDamage();
          }
          finishAttack();
        }
      } else if (state.phase === 'hero_moving') {
        const finished = updateMover(state.hero, dt, HERO_MOVE_SPEED);
        if (finished) {
          beginDragonTurn();
        }
      } else if (state.phase === 'dragon_turn') {
        state.aiDelay -= dt;
        if (state.aiDelay <= 0) {
          dragonAct();
        }
      } else if (state.phase === 'dragon_moving') {
        const finished = updateMover(state.dragon, dt, DRAGON_MOVE_SPEED);
        if (finished) {
          beginHeroTurn();
        }
      }
    }

    function drawTerrainTile(tile) {
      const isWater = tile.terrain === 'water';
      const image = isWater ? waterImage : grassImage;
      const frameSize = isWater ? WATER_FRAME_SIZE : GRASS_FRAME_SIZE;
      const columns = isWater ? WATER_COLUMNS : GRASS_COLUMNS;
      const frameCount = isWater ? WATER_FRAMES : GRASS_FRAMES;
      const frame = Math.floor(state.time * tile.fps + tile.offset) % frameCount;
      const sourceX = (frame % columns) * frameSize;
      const sourceY = Math.floor(frame / columns) * frameSize;
      const destX = state.boardOffsetX + tile.col * state.tileSize;
      const destY = state.boardOffsetY + tile.row * state.tileSize;

      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        frameSize,
        frameSize,
        destX,
        destY,
        state.tileSize + 0.6,
        state.tileSize + 0.6,
      );
    }

    function drawCellHighlight(cell, fill, stroke, inset = 2) {
      const x = state.boardOffsetX + cell.col * state.tileSize;
      const y = state.boardOffsetY + cell.row * state.tileSize;

      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, state.tileSize, state.tileSize);
      }

      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x + inset,
          y + inset,
          state.tileSize - inset * 2,
          state.tileSize - inset * 2,
        );
      }
    }

    function drawBoardChrome() {
      const x = state.boardOffsetX;
      const y = state.boardOffsetY;
      const size = state.boardPixels;

      ctx.strokeStyle = 'rgba(221, 238, 199, 0.46)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);

      ctx.strokeStyle = 'rgba(23, 39, 24, 0.24)';
      ctx.lineWidth = 1;
      for (let i = 1; i < BOARD_SIZE; i += 1) {
        const line = x + i * state.tileSize;
        ctx.beginPath();
        ctx.moveTo(line, y);
        ctx.lineTo(line, y + size);
        ctx.stroke();

        const rowLine = y + i * state.tileSize;
        ctx.beginPath();
        ctx.moveTo(x, rowLine);
        ctx.lineTo(x + size, rowLine);
        ctx.stroke();
      }

      if (state.phase === 'hero_turn') {
        for (const option of findReachableCells(heroCell(), HERO_MOVE_RANGE, new Set([cellKey(dragonCell())]))) {
          drawCellHighlight(option.cell, 'rgba(189, 231, 122, 0.08)', null);
        }
      }

      if (state.hoverCell) {
        drawCellHighlight(state.hoverCell, 'rgba(255, 245, 176, 0.16)', 'rgba(255, 245, 176, 0.58)', 1);
      }

      if (state.lastClickCell) {
        drawCellHighlight(state.lastClickCell, null, 'rgba(156, 229, 104, 0.72)', 3);
      }

      if (state.blockedClickCell) {
        drawCellHighlight(state.blockedClickCell, null, 'rgba(255, 94, 94, 0.9)', 4);
      }

      if (state.attackPulse) {
        drawCellHighlight(state.attackPulse.cell, 'rgba(255, 255, 255, 0.08)', state.attackPulse.color, 2);
      }
    }

    function drawHero() {
      const heroCenterX = cellCenter(state.hero.x, state.tileSize, state.boardOffsetX);
      const heroFeetY = state.boardOffsetY + (state.hero.y + 0.98) * state.tileSize;
      const drawHeight = state.tileSize * 2.18;
      const drawWidth = drawHeight * (HERO_FRAME_WIDTH / HERO_FRAME_HEIGHT);
      const bob = state.hero.moving ? Math.sin(state.time * 18) * 1.2 : 0;
      const attackFrame =
        state.activeAttack?.actor === 'hero'
          ? Math.min(HERO_ATTACK_FRAMES - 1, Math.floor(state.activeAttack.elapsed * HERO_ATTACK_FPS))
          : 0;
      const sourceX = (attackFrame % HERO_ATTACK_COLUMNS) * HERO_FRAME_WIDTH;
      const sourceY = Math.floor(attackFrame / HERO_ATTACK_COLUMNS) * HERO_FRAME_HEIGHT;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 8;
      ctx.drawImage(
        heroImage,
        sourceX,
        sourceY,
        HERO_FRAME_WIDTH,
        HERO_FRAME_HEIGHT,
        heroCenterX - drawWidth / 2,
        heroFeetY - drawHeight + bob,
        drawWidth,
        drawHeight,
      );
      ctx.restore();
    }

    function drawDragon() {
      if (state.dragon.hp <= 0) {
        return;
      }

      const dragonCenterX = cellCenter(state.dragon.x, state.tileSize, state.boardOffsetX);
      const dragonFeetY = state.boardOffsetY + (state.dragon.y + 1.02) * state.tileSize;
      const drawHeight = state.tileSize * 2.75;
      const drawWidth = drawHeight;
      const bob = state.dragon.moving ? Math.sin(state.time * 12) * 1.4 : 0;
      const attackFrame =
        state.activeAttack?.actor === 'dragon'
          ? Math.min(DRAGON_ATTACK_FRAMES - 1, Math.floor(state.activeAttack.elapsed * DRAGON_ATTACK_FPS))
          : 0;
      const sourceX = (attackFrame % DRAGON_ATTACK_COLUMNS) * DRAGON_FRAME_SIZE;
      const sourceY = Math.floor(attackFrame / DRAGON_ATTACK_COLUMNS) * DRAGON_FRAME_SIZE;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.46)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 9;
      ctx.drawImage(
        dragonImage,
        sourceX,
        sourceY,
        DRAGON_FRAME_SIZE,
        DRAGON_FRAME_SIZE,
        dragonCenterX - drawWidth / 2,
        dragonFeetY - drawHeight + bob,
        drawWidth,
        drawHeight,
      );
      ctx.restore();
    }

    function drawHud() {
      const status =
        state.phase === 'hero_turn'
          ? 'Hero Turn'
          : state.phase === 'hero_attacking'
            ? 'Hero Attack'
            : state.phase === 'dragon_attacking'
              ? 'Dragon Attack'
              : state.phase === 'dragon_turn' || state.phase === 'dragon_moving'
            ? 'Dragon Turn'
            : state.phase === 'victory'
              ? 'Victory'
              : state.phase === 'defeat'
                ? 'Defeat'
                : 'Moving';

      ctx.save();
      ctx.fillStyle = 'rgba(10, 18, 12, 0.74)';
      ctx.fillRect(state.boardOffsetX, 12, state.boardPixels, 34);
      ctx.fillStyle = '#e6f0cd';
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${status}  |  Hero ${state.hero.hp}/${state.hero.maxHp}  |  Dragon ${state.dragon.hp}/${state.dragon.maxHp}`,
        state.boardOffsetX + 12,
        34,
      );
      ctx.textAlign = 'right';
      ctx.fillText(
        `${state.lastAction}  |  Zoom ${Math.round(state.camera.manualZoom * 100)}%`,
        state.boardOffsetX + state.boardPixels - 12,
        34,
      );
      ctx.restore();
    }

    function applyCameraTransform() {
      ctx.translate(state.canvasWidth / 2, state.canvasHeight / 2);
      ctx.scale(state.camera.scale, state.camera.scale);
      ctx.translate(-state.camera.x, -state.camera.y);
    }

    function renderLoading() {
      ctx.fillStyle = '#182218';
      ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);
      ctx.fillStyle = '#dbeac0';
      ctx.font = '600 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading field...', state.canvasWidth / 2, state.canvasHeight / 2);
    }

    function render() {
      if (!state.loaded.grass || !state.loaded.water || !state.loaded.hero || !state.loaded.dragon) {
        renderLoading();
        return;
      }

      ctx.fillStyle = '#172214';
      ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

      ctx.save();
      applyCameraTransform();

      for (const tile of boardTiles) {
        drawTerrainTile(tile);
      }

      drawBoardChrome();

      const heroIsBehindDragon = state.hero.row <= state.dragon.row;
      if (heroIsBehindDragon) {
        drawHero();
        drawDragon();
      } else {
        drawDragon();
        drawHero();
      }

      ctx.restore();
      drawHud();
    }

    function frame(now) {
      if (!state.lastFrameAt) {
        state.lastFrameAt = now;
      }

      const dt = clamp((now - state.lastFrameAt) / 1000, 0, 1 / 20);
      state.lastFrameAt = now;
      update(dt);
      render();
      state.animationFrame = requestAnimationFrame(frame);
    }

    function renderGameToText() {
      return JSON.stringify({
        coordinate_system: '19x19 board, origin at top-left, col increases right, row increases down',
        board: { columns: BOARD_SIZE, rows: BOARD_SIZE },
        phase: state.phase,
        round: state.round,
        last_action: state.lastAction,
        rules: {
          hero_move_range: HERO_MOVE_RANGE,
          dragon_move_range: DRAGON_MOVE_RANGE,
          attack_range: ATTACK_RANGE,
          terrain_animation_speed_multiplier: TERRAIN_ANIMATION_SPEED,
        },
        camera: {
          auto_zoom_scale: Number(state.camera.scale.toFixed(2)),
          manual_zoom: Number(state.camera.manualZoom.toFixed(2)),
        },
        active_attack: state.activeAttack
          ? {
              actor: state.activeAttack.actor,
              target: state.activeAttack.target,
              frame:
                state.activeAttack.actor === 'hero'
                  ? Math.min(HERO_ATTACK_FRAMES - 1, Math.floor(state.activeAttack.elapsed * HERO_ATTACK_FPS))
                  : Math.min(DRAGON_ATTACK_FRAMES - 1, Math.floor(state.activeAttack.elapsed * DRAGON_ATTACK_FPS)),
              damage_applied: state.activeAttack.applied,
            }
          : null,
        hero: {
          col: Number(state.hero.x.toFixed(2)),
          row: Number(state.hero.y.toFixed(2)),
          cell_col: state.hero.col,
          cell_row: state.hero.row,
          hp: state.hero.hp,
          moving: state.hero.moving,
          target: state.hero.target,
          queued_steps: state.hero.path.length,
        },
        dragon: {
          col: Number(state.dragon.x.toFixed(2)),
          row: Number(state.dragon.y.toFixed(2)),
          cell_col: state.dragon.col,
          cell_row: state.dragon.row,
          hp: state.dragon.hp,
          moving: state.dragon.moving,
          target: state.dragon.target,
          queued_steps: state.dragon.path.length,
          blocks_hero: true,
        },
        hover_cell: state.hoverCell,
        selected_cell: state.lastClickCell,
        blocked_click_cell: state.blockedClickCell,
        terrain: {
          water_cells: boardTiles
            .filter((tile) => tile.terrain === 'water')
            .map((tile) => ({ col: tile.col, row: tile.row })),
          water_is_blocking: true,
          movement_pathing: '4-direction BFS around blocked water and occupied cells',
        },
        grass: {
          animated: true,
          frames: GRASS_FRAMES,
          independent_offsets: true,
        },
        water: {
          animated: true,
          frames: WATER_FRAMES,
          blocks_hero: true,
        },
      });
    }

    window.render_game_to_text = renderGameToText;
    window.advanceTime = (ms) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i += 1) {
        update(1 / 60);
      }
      render();
    };

    grassImage.onload = () => {
      state.loaded.grass = true;
      render();
    };
    waterImage.onload = () => {
      state.loaded.water = true;
      render();
    };
    heroImage.onload = () => {
      state.loaded.hero = true;
      render();
    };
    dragonImage.onload = () => {
      state.loaded.dragon = true;
      render();
    };
    grassImage.onerror = () => {
      console.error('Failed to load grass_tile_waving.png');
    };
    waterImage.onerror = () => {
      console.error('Failed to load zsprite_sheet.png');
    };
    heroImage.onerror = () => {
      console.error('Failed to load hero_attacking.png');
    };
    dragonImage.onerror = () => {
      console.error('Failed to load DRAGON_zsprite_sheet.png');
    };

    resize();
    state.animationFrame = requestAnimationFrame(frame);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(state.animationFrame);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, []);

  return (
    <main>
      <section className="game-shell">
        <canvas ref={canvasRef} aria-label="19 by 19 turn-based RPG board" />
        <aside className="music-player" aria-label="Music player">
          <audio
            ref={audioRef}
            src={`/${encodeURIComponent(track.file)}`}
            preload="auto"
            onEnded={onTrackEnded}
          />
          <div className="player-screen">
            <span className="track-label">Track {currentTrack + 1}/{TRACKS.length}</span>
            <strong>{track.title}</strong>
          </div>
          <div className="player-buttons">
            <button type="button" onClick={playPauseMusic}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button type="button" onClick={skipTrack}>
              Skip
            </button>
          </div>
          <label className="volume-control">
            <span>Volume {Math.round(volume * 100)}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
            />
          </label>
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
