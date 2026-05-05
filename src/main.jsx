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
const WIZARD_FRAME_WIDTH = 479;
const WIZARD_FRAME_HEIGHT = 534;
const WIZARD_COLUMNS = 6;
const WIZARD_CAST_FRAMES = 18;
const WIZARD_CAST_FPS = 14;
const FIREBALL_FRAME_WIDTH = 551;
const FIREBALL_FRAME_HEIGHT = 458;
const FIREBALL_COLUMNS = 6;
const FIREBALL_FRAMES = 18;
const FIREBALL_FPS = 18;

const HERO_MOVE_SPEED = 4.2;
const WIZARD_MOVE_SPEED = 4;
const DRAGON_MOVE_SPEED = 3.4;
const TERRAIN_ANIMATION_SPEED = 0.5;
const HERO_MOVE_RANGE = 5;
const WIZARD_MOVE_RANGE = 5;
const DRAGON_MOVE_RANGE = 5;
const HERO_ATTACK_RANGE = 2;
const WIZARD_ATTACK_RANGE = 8;
const DRAGON_ATTACK_RANGE = 2;
const HERO_ATTACK_DAMAGE = 5;
const WIZARD_ATTACK_DAMAGE = 4;
const DRAGON_ATTACK_DAMAGE = 3;
const MIN_MANUAL_ZOOM = 0.6;
const MAX_MANUAL_ZOOM = 1.75;

const INITIAL_HERO_CELL = { col: 5, row: 9 };
const INITIAL_WIZARD_CELL = { col: 4, row: 10 };
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
  const queue = [{ cell: from, path: [] }];
  const visited = new Set([cellKey(from)]);
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
      queue.push({ cell: next, path: [...current.path, next] });
    }
  }

  return reachable;
}

function App() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const gameRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) {
      return;
    }

    audio.play().catch(() => setIsPlaying(false));
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

    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
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
    const wizardImage = loadImage('/wizard.png');
    const fireballImage = loadImage('/fireball.png');
    const boardTiles = createBoardTiles();

    const state = {
      canvasWidth: 960,
      canvasHeight: 960,
      boardPixels: 844,
      boardOffsetX: 58,
      boardOffsetY: 72,
      tileSize: 44,
      time: 0,
      phase: 'player_turn',
      aiDelay: 0,
      round: 1,
      lastAction: 'Player turn',
      attackPulse: null,
      activeAttack: null,
      fireballs: [],
      particles: [],
      selectedActor: 'hero',
      acted: { hero: false, wizard: false },
      activePathHighlight: null,
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
        id: 'hero',
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
      wizard: {
        id: 'wizard',
        col: INITIAL_WIZARD_CELL.col,
        row: INITIAL_WIZARD_CELL.row,
        x: INITIAL_WIZARD_CELL.col,
        y: INITIAL_WIZARD_CELL.row,
        hp: 18,
        maxHp: 18,
        target: null,
        path: [],
        moving: false,
      },
      dragon: {
        id: 'dragon',
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
        wizard: false,
        fireball: false,
      },
    };

    gameRef.current = state;

    function actorCell(actor) {
      return { col: actor.col, row: actor.row };
    }

    function actorScreenCell(actor) {
      return { col: actor.x, row: actor.y };
    }

    function heroCell() {
      return actorCell(state.hero);
    }

    function wizardCell() {
      return actorCell(state.wizard);
    }

    function dragonCell() {
      return actorCell(state.dragon);
    }

    function livingParty() {
      return [state.hero, state.wizard].filter((actor) => actor.hp > 0);
    }

    function selectedActor() {
      const actor = state.selectedActor === 'wizard' ? state.wizard : state.hero;
      if (actor.hp > 0) {
        return actor;
      }
      const fallback = livingParty()[0];
      if (fallback) {
        state.selectedActor = fallback.id;
      }
      return fallback || actor;
    }

    function isPartyTurn() {
      return state.phase === 'player_turn';
    }

    function actorAtCell(cell) {
      for (const actor of [state.hero, state.wizard, state.dragon]) {
        if (actor.hp > 0 && actor.col === cell.col && actor.row === cell.row) {
          return actor;
        }
      }
      return null;
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

    function occupiedKeysFor(actorId, includeDragon = true) {
      const keys = new Set();
      for (const actor of [state.hero, state.wizard]) {
        if (actor.hp > 0 && actor.id !== actorId) {
          keys.add(cellKey(actorCell(actor)));
        }
      }
      if (includeDragon && state.dragon.hp > 0 && actorId !== 'dragon') {
        keys.add(cellKey(dragonCell()));
      }
      return keys;
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
      const points = [];
      for (const actor of [state.hero, state.wizard, state.dragon]) {
        if (actor.hp > 0) {
          points.push(boardToWorld(actorScreenCell(actor)));
        }
      }

      if (points.length === 0) {
        return;
      }

      const padding = state.tileSize * 5.8;
      const minX = Math.min(...points.map((point) => point.x)) - padding;
      const maxX = Math.max(...points.map((point) => point.x)) + padding;
      const minY = Math.min(...points.map((point) => point.y)) - padding;
      const maxY = Math.max(...points.map((point) => point.y)) + padding;
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

    function livingActionIds() {
      return livingParty().map((actor) => actor.id);
    }

    function hasEveryoneActed() {
      const ids = livingActionIds();
      return ids.length === 0 || ids.every((id) => state.acted[id]);
    }

    function beginDragonTurn() {
      if (state.phase === 'victory' || state.phase === 'defeat') {
        return;
      }
      state.phase = 'dragon_turn';
      state.aiDelay = 0.35;
      state.activePathHighlight = null;
      state.lastAction = 'Dragon turn';
    }

    function beginPlayerTurn() {
      if (state.phase === 'victory' || state.phase === 'defeat') {
        return;
      }
      state.phase = 'player_turn';
      state.round += 1;
      state.acted = { hero: state.hero.hp <= 0, wizard: state.wizard.hp <= 0 };
      state.selectedActor = state.hero.hp > 0 ? 'hero' : 'wizard';
      state.activePathHighlight = null;
      state.lastAction = 'Player turn';
    }

    function finishPlayerActorAction(actorId) {
      state.acted[actorId] = true;
      state.activePathHighlight = null;

      if (hasEveryoneActed()) {
        beginDragonTurn();
        return;
      }

      state.phase = 'player_turn';
      const next = livingParty().find((actor) => !state.acted[actor.id]);
      if (next) {
        state.selectedActor = next.id;
        state.lastAction = `${next.id === 'hero' ? 'Hero' : 'Wizard'} ready`;
      }
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

    function startWizardAttack() {
      state.phase = 'wizard_casting';
      state.activeAttack = {
        actor: 'wizard',
        target: 'dragon',
        elapsed: 0,
        duration: WIZARD_CAST_FRAMES / WIZARD_CAST_FPS,
        damage: WIZARD_ATTACK_DAMAGE,
        applied: false,
      };
      state.lastAction = 'Wizard casts';
      state.lastClickCell = dragonCell();
      state.blockedClickCell = null;
    }

    function launchFireball() {
      const start = boardToWorld(actorScreenCell(state.wizard));
      const end = boardToWorld(actorScreenCell(state.dragon));
      state.fireballs.push({
        start,
        end,
        elapsed: 0,
        duration: 0.62,
        damage: WIZARD_ATTACK_DAMAGE,
      });
      state.phase = 'fireball_flying';
      state.activeAttack = null;
      state.lastAction = 'Fireball flies';
    }

    function startDragonAttack(targetId) {
      state.phase = 'dragon_attacking';
      state.activeAttack = {
        actor: 'dragon',
        target: targetId,
        elapsed: 0,
        duration: DRAGON_ATTACK_FRAMES / DRAGON_ATTACK_FPS,
        damage: DRAGON_ATTACK_DAMAGE,
        applied: false,
      };
      state.lastAction = 'Dragon attacks';
    }

    function spawnSparks(cell, color) {
      const origin = boardToWorld(cell);
      for (let i = 0; i < 18; i += 1) {
        const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.6;
        const speed = state.tileSize * (1.6 + Math.random() * 2.1);
        const life = 0.42 + Math.random() * 0.24;
        state.particles.push({
          x: origin.x,
          y: origin.y - state.tileSize * 0.25,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - state.tileSize * 0.8,
          life,
          maxLife: life,
          size: 2.2 + Math.random() * 2.6,
          color,
        });
      }
    }

    function applyAttackDamage() {
      if (!state.activeAttack || state.activeAttack.applied) {
        return;
      }

      state.activeAttack.applied = true;

      if (state.activeAttack.target === 'dragon') {
        state.dragon.hp = Math.max(0, state.dragon.hp - state.activeAttack.damage);
        state.attackPulse = { cell: dragonCell(), time: 0.35, color: 'rgba(255, 235, 116, 0.82)' };
        spawnSparks(dragonCell(), state.activeAttack.actor === 'wizard' ? '#ffd84d' : '#ffe45f');
        state.lastAction = `${state.activeAttack.actor === 'hero' ? 'Hero' : 'Wizard'} hits dragon`;
      } else {
        const target = state.activeAttack.target === 'wizard' ? state.wizard : state.hero;
        target.hp = Math.max(0, target.hp - state.activeAttack.damage);
        state.attackPulse = { cell: actorCell(target), time: 0.35, color: 'rgba(255, 97, 86, 0.86)' };
        spawnSparks(actorCell(target), '#ff3d2e');
        state.lastAction = `Dragon hits ${state.activeAttack.target}`;
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

      if (state.hero.hp <= 0 && state.wizard.hp <= 0) {
        state.phase = 'defeat';
        state.lastAction = 'Party defeated';
        return;
      }

      if (actor === 'hero') {
        finishPlayerActorAction('hero');
      } else if (actor === 'dragon') {
        beginPlayerTurn();
      }
    }

    function computeMovePlan(actor, cell) {
      if (!actor || actor.hp <= 0) {
        return { valid: false, path: [], label: 'No actor' };
      }

      if (isWaterCell(cell)) {
        return { valid: false, path: [], label: 'Water blocks movement' };
      }

      const path = findPath(actorCell(actor), cell, occupiedKeysFor(actor.id, true));
      const sameCell = cellKey(actorCell(actor)) === cellKey(cell);
      const range = actor.id === 'wizard' ? WIZARD_MOVE_RANGE : HERO_MOVE_RANGE;

      if (!sameCell && path.length === 0) {
        return { valid: false, path: [], label: 'No path' };
      }

      if (path.length > range) {
        return { valid: false, path, label: `Move range is ${range}` };
      }

      return { valid: true, path, label: path.length > 0 ? `${actor.id} moves ${path.length}` : `${actor.id} waits` };
    }

    function computeHoverPlan(cell) {
      if (!isPartyTurn() || !cell) {
        return null;
      }

      const actor = selectedActor();
      if (!actor || state.acted[actor.id]) {
        return null;
      }

      const occupant = actorAtCell(cell);
      if (occupant?.id === 'dragon') {
        const range = actor.id === 'wizard' ? WIZARD_ATTACK_RANGE : HERO_ATTACK_RANGE;
        const valid = gridDistance(actorCell(actor), dragonCell()) <= range;
        return { type: 'attack', valid, path: [dragonCell()], label: valid ? 'Attack in range' : 'Attack out of range' };
      }

      if (occupant && occupant.id !== actor.id) {
        return { type: 'blocked', valid: false, path: [cell], label: 'Occupied' };
      }

      return { type: 'move', ...computeMovePlan(actor, cell) };
    }

    function handlePlayerClick(cell) {
      if (!isPartyTurn()) {
        return;
      }

      const occupant = actorAtCell(cell);
      if (occupant?.id === 'hero' || occupant?.id === 'wizard') {
        state.selectedActor = occupant.id;
        state.lastAction = `${occupant.id === 'hero' ? 'Hero' : 'Wizard'} selected`;
        render();
        return;
      }

      const actor = selectedActor();
      if (!actor || state.acted[actor.id]) {
        setBlockedClick(cell, 'That character already acted');
        return;
      }

      if (occupant?.id === 'dragon') {
        const range = actor.id === 'wizard' ? WIZARD_ATTACK_RANGE : HERO_ATTACK_RANGE;
        if (gridDistance(actorCell(actor), dragonCell()) > range) {
          setBlockedClick(cell, 'Attack out of range');
          return;
        }
        if (actor.id === 'wizard') {
          startWizardAttack();
        } else {
          startHeroAttack();
        }
        return;
      }

      const plan = computeMovePlan(actor, cell);
      state.activePathHighlight = { path: plan.path, valid: plan.valid };

      if (!plan.valid) {
        setBlockedClick(cell, plan.label);
        return;
      }

      actor.path = plan.path;
      actor.target = plan.path[0] || null;
      actor.moving = Boolean(actor.target);
      state.lastClickCell = cell;
      state.blockedClickCell = null;
      state.lastAction = plan.label;

      if (actor.moving) {
        state.phase = actor.id === 'wizard' ? 'wizard_moving' : 'hero_moving';
      } else {
        finishPlayerActorAction(actor.id);
      }
    }

    function nearestPartyTarget() {
      let best = null;
      for (const actor of livingParty()) {
        const distance = gridDistance(dragonCell(), actorCell(actor));
        if (!best || distance < best.distance) {
          best = { actor, distance };
        }
      }
      return best;
    }

    function chooseDragonMove(target) {
      const blocked = new Set(livingParty().map((actor) => cellKey(actorCell(actor))));
      const options = findReachableCells(dragonCell(), DRAGON_MOVE_RANGE, blocked);
      let best = null;

      for (const option of options) {
        const distance = gridDistance(option.cell, actorCell(target));
        const score = distance * 100 + option.path.length;
        if (!best || score < best.score) {
          best = { ...option, score };
        }
      }

      return best;
    }

    function dragonAct() {
      const nearest = nearestPartyTarget();
      if (!nearest) {
        state.phase = 'defeat';
        state.lastAction = 'Party defeated';
        return;
      }

      if (nearest.distance <= DRAGON_ATTACK_RANGE) {
        startDragonAttack(nearest.actor.id);
        return;
      }

      const move = chooseDragonMove(nearest.actor);
      if (!move || move.path.length === 0) {
        state.lastAction = 'Dragon waits';
        beginPlayerTurn();
        return;
      }

      state.dragon.path = move.path;
      state.dragon.target = move.path[0];
      state.dragon.moving = true;
      state.activePathHighlight = { path: move.path, valid: false };
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
        handlePlayerClick(cell);
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

    function updateFireballs(dt) {
      for (const fireball of state.fireballs) {
        fireball.elapsed += dt;
      }

      const hit = state.fireballs.find((fireball) => fireball.elapsed >= fireball.duration);
      state.fireballs = state.fireballs.filter((fireball) => fireball.elapsed < fireball.duration);

      if (hit) {
        state.dragon.hp = Math.max(0, state.dragon.hp - hit.damage);
        state.attackPulse = { cell: dragonCell(), time: 0.35, color: 'rgba(255, 174, 56, 0.9)' };
        spawnSparks(dragonCell(), '#ffd84d');
        state.lastAction = `Wizard hits dragon for ${hit.damage}`;

        if (state.dragon.hp <= 0) {
          state.phase = 'victory';
          state.lastAction = 'Dragon defeated';
        } else {
          finishPlayerActorAction('wizard');
        }
      }
    }

    function updateParticles(dt) {
      for (const particle of state.particles) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += state.tileSize * 4.8 * dt;
      }
      state.particles = state.particles.filter((particle) => particle.life > 0);
    }

    function update(dt) {
      state.time += dt;
      updateCamera(dt);
      updateParticles(dt);

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
      } else if (state.phase === 'wizard_casting') {
        state.activeAttack.elapsed += dt;
        if (state.activeAttack.elapsed >= state.activeAttack.duration) {
          launchFireball();
        }
      } else if (state.phase === 'fireball_flying') {
        updateFireballs(dt);
      } else if (state.phase === 'hero_moving') {
        const finished = updateMover(state.hero, dt, HERO_MOVE_SPEED);
        if (finished) {
          finishPlayerActorAction('hero');
        }
      } else if (state.phase === 'wizard_moving') {
        const finished = updateMover(state.wizard, dt, WIZARD_MOVE_SPEED);
        if (finished) {
          finishPlayerActorAction('wizard');
        }
      } else if (state.phase === 'dragon_turn') {
        state.aiDelay -= dt;
        if (state.aiDelay <= 0) {
          dragonAct();
        }
      } else if (state.phase === 'dragon_moving') {
        const finished = updateMover(state.dragon, dt, DRAGON_MOVE_SPEED);
        if (finished) {
          state.activePathHighlight = null;
          beginPlayerTurn();
        }
      }

      if (state.hero.hp <= 0) {
        state.acted.hero = true;
      }
      if (state.wizard.hp <= 0) {
        state.acted.wizard = true;
      }
    }

    function drawTerrainTile(tile, lifted = false) {
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
      const lift = lifted ? state.tileSize * 0.34 : 0;
      const pulse = lifted ? Math.sin(state.time * 10) * 0.035 : 0;
      const scale = lifted ? 1.36 + pulse : 1;
      const drawSize = state.tileSize * scale + 0.6;

      if (lifted) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.beginPath();
        ctx.ellipse(
          destX + state.tileSize / 2,
          destY + state.tileSize * 0.78,
          state.tileSize * 0.56,
          state.tileSize * 0.18,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      if (lifted) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.48)';
        ctx.shadowBlur = 26;
        ctx.shadowOffsetY = 18;
      }
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        frameSize,
        frameSize,
        destX - (drawSize - state.tileSize) / 2,
        destY - lift - (drawSize - state.tileSize) / 2,
        drawSize,
        drawSize,
      );
      ctx.restore();
    }

    function tileRect(cell, lifted = false) {
      const lift = lifted ? state.tileSize * 0.34 : 0;
      const pulse = lifted ? Math.sin(state.time * 10) * 0.035 : 0;
      const scale = lifted ? 1.36 + pulse : 1;
      const size = state.tileSize * scale;
      const x = state.boardOffsetX + cell.col * state.tileSize - (size - state.tileSize) / 2;
      const y = state.boardOffsetY + cell.row * state.tileSize - lift - (size - state.tileSize) / 2;
      return { x, y, size };
    }

    function drawCellHighlight(cell, fill, stroke, inset = 2, lifted = false) {
      const rect = tileRect(cell, lifted);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(rect.x, rect.y, rect.size, rect.size);
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lifted ? 3 : 2;
        ctx.strokeRect(rect.x + inset, rect.y + inset, rect.size - inset * 2, rect.size - inset * 2);
      }
    }

    function drawPathHighlight(plan) {
      if (!plan || !plan.path || plan.path.length === 0) {
        return;
      }
      const fill = plan.valid ? 'rgba(92, 236, 106, 0.22)' : 'rgba(255, 76, 76, 0.2)';
      const stroke = plan.valid ? 'rgba(103, 255, 124, 0.76)' : 'rgba(255, 76, 76, 0.78)';
      for (const cell of plan.path) {
        drawCellHighlight(cell, fill, stroke, 5);
      }
    }

    function drawActorCellOutline(actor, color) {
      if (actor.hp <= 0) {
        return;
      }
      drawCellHighlight(actorCell(actor), null, color, 1);
      drawCellHighlight(actorCell(actor), null, color, 6);
    }

    function drawBoardChrome(hoverPlan) {
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

      if (isPartyTurn()) {
        const actor = selectedActor();
        if (actor && !state.acted[actor.id]) {
          const range = actor.id === 'wizard' ? WIZARD_MOVE_RANGE : HERO_MOVE_RANGE;
          for (const option of findReachableCells(actorCell(actor), range, occupiedKeysFor(actor.id, true))) {
            drawCellHighlight(option.cell, 'rgba(189, 231, 122, 0.08)', null);
          }
        }
      }

      drawPathHighlight(state.activePathHighlight);
      drawPathHighlight(hoverPlan);

      if (state.lastClickCell) {
        drawCellHighlight(state.lastClickCell, null, 'rgba(156, 229, 104, 0.72)', 3);
      }
      if (state.blockedClickCell) {
        drawCellHighlight(state.blockedClickCell, null, 'rgba(255, 94, 94, 0.9)', 4);
      }
      if (state.attackPulse) {
        drawCellHighlight(state.attackPulse.cell, 'rgba(255, 255, 255, 0.08)', state.attackPulse.color, 2);
      }
      if (state.hoverCell && !actorAtCell(state.hoverCell)) {
        drawCellHighlight(
          state.hoverCell,
          'rgba(255, 245, 176, 0.1)',
          hoverPlan?.valid === false ? 'rgba(255, 76, 76, 0.8)' : 'rgba(255, 245, 176, 0.58)',
          1,
        );
      }

      drawActorCellOutline(selectedActor(), 'rgba(120, 218, 255, 0.82)');
      if (state.hoverCell && state.dragon.hp > 0 && cellKey(state.hoverCell) === cellKey(dragonCell())) {
        drawActorCellOutline(state.dragon, 'rgba(255, 232, 96, 0.95)');
      }
    }

    function drawHero() {
      if (state.hero.hp <= 0) {
        return;
      }
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

      withLowHealthFlash(state.hero, () => {
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
      });
    }

    function drawWizard() {
      if (state.wizard.hp <= 0) {
        return;
      }
      const wizardCenterX = cellCenter(state.wizard.x, state.tileSize, state.boardOffsetX);
      const wizardFeetY = state.boardOffsetY + (state.wizard.y + 1.02) * state.tileSize;
      const drawHeight = state.tileSize * 2.12;
      const drawWidth = drawHeight * (WIZARD_FRAME_WIDTH / WIZARD_FRAME_HEIGHT);
      const bob = state.wizard.moving ? Math.sin(state.time * 16) * 1.1 : 0;
      const castFrame =
        state.activeAttack?.actor === 'wizard'
          ? Math.min(WIZARD_CAST_FRAMES - 1, Math.floor(state.activeAttack.elapsed * WIZARD_CAST_FPS))
          : 0;
      const sourceX = (castFrame % WIZARD_COLUMNS) * WIZARD_FRAME_WIDTH;
      const sourceY = Math.floor(castFrame / WIZARD_COLUMNS) * WIZARD_FRAME_HEIGHT;

      withLowHealthFlash(state.wizard, () => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 8;
        ctx.drawImage(
          wizardImage,
          sourceX,
          sourceY,
          WIZARD_FRAME_WIDTH,
          WIZARD_FRAME_HEIGHT,
          wizardCenterX - drawWidth / 2,
          wizardFeetY - drawHeight + bob,
          drawWidth,
          drawHeight,
        );
      });
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

      withLowHealthFlash(state.dragon, () => {
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
      });
    }

    function drawFireballs() {
      for (const fireball of state.fireballs) {
        const progress = clamp(fireball.elapsed / fireball.duration, 0, 1);
        const x = fireball.start.x + (fireball.end.x - fireball.start.x) * progress;
        const y = fireball.start.y + (fireball.end.y - fireball.start.y) * progress;
        const angle = Math.atan2(fireball.end.y - fireball.start.y, fireball.end.x - fireball.start.x);
        const frame = Math.floor(state.time * FIREBALL_FPS) % FIREBALL_FRAMES;
        const sourceX = (frame % FIREBALL_COLUMNS) * FIREBALL_FRAME_WIDTH;
        const sourceY = Math.floor(frame / FIREBALL_COLUMNS) * FIREBALL_FRAME_HEIGHT;
        const width = state.tileSize * 1.35;
        const height = width * (FIREBALL_FRAME_HEIGHT / FIREBALL_FRAME_WIDTH);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.shadowColor = 'rgba(255, 119, 28, 0.7)';
        ctx.shadowBlur = 16;
        ctx.drawImage(
          fireballImage,
          sourceX,
          sourceY,
          FIREBALL_FRAME_WIDTH,
          FIREBALL_FRAME_HEIGHT,
          -width / 2,
          -height / 2,
          width,
          height,
        );
        ctx.restore();
      }
    }

    function drawParticles() {
      for (const particle of state.particles) {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size,
        );
        ctx.restore();
      }
    }

    function healthColor(actor) {
      const ratio = actor.hp / actor.maxHp;
      if (ratio <= 0.3) {
        return '#ff3b30';
      }
      if (ratio <= 0.55) {
        return '#ffb02e';
      }
      return '#55e55d';
    }

    function isLowHealth(actor) {
      return actor.hp > 0 && actor.hp / actor.maxHp <= 0.3;
    }

    function lowHealthAlpha(actor) {
      if (!isLowHealth(actor)) {
        return 0;
      }
      return (Math.sin(state.time * 4.4) + 1) * 0.5;
    }

    function withLowHealthFlash(actor, draw) {
      ctx.save();
      const alpha = lowHealthAlpha(actor);
      if (alpha > 0.42) {
        ctx.filter = 'sepia(1) saturate(7) hue-rotate(315deg) brightness(1.15)';
      }
      draw();
      ctx.restore();
    }

    function drawHealthBar(actor) {
      if (actor.hp <= 0) {
        return;
      }
      const point = boardToWorld(actorScreenCell(actor));
      const width = state.tileSize * 1.22;
      const height = Math.max(5, state.tileSize * 0.13);
      const x = point.x - width / 2;
      const y = point.y + state.tileSize * 0.44;
      const ratio = clamp(actor.hp / actor.maxHp, 0, 1);
      const flash = lowHealthAlpha(actor);

      ctx.save();
      if (flash > 0) {
        ctx.shadowColor = 'rgba(255, 54, 54, 0.85)';
        ctx.shadowBlur = 6 + flash * 8;
      }
      ctx.fillStyle = 'rgba(8, 12, 8, 0.82)';
      ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
      ctx.fillStyle = '#321111';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = healthColor(actor);
      ctx.fillRect(x, y, width * ratio, height);
      ctx.strokeStyle = 'rgba(238, 255, 211, 0.72)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
      ctx.restore();
    }

    function drawHud() {
      const status =
        state.phase === 'player_turn'
          ? 'Player Turn'
          : state.phase === 'hero_attacking'
            ? 'Hero Attack'
            : state.phase === 'wizard_casting' || state.phase === 'fireball_flying'
              ? 'Wizard Attack'
              : state.phase === 'dragon_attacking'
                ? 'Dragon Attack'
                : state.phase === 'dragon_turn' || state.phase === 'dragon_moving'
                  ? 'Dragon Turn'
                  : state.phase === 'victory'
                    ? 'Victory'
                    : state.phase === 'defeat'
                      ? 'Defeat'
                      : 'Moving';
      const selected = state.selectedActor === 'wizard' ? 'Wizard' : 'Hero';

      ctx.save();
      ctx.fillStyle = 'rgba(10, 18, 12, 0.74)';
      ctx.fillRect(state.boardOffsetX, 12, state.boardPixels, 34);
      ctx.fillStyle = '#e6f0cd';
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${status} | ${selected} selected | Hero ${state.hero.hp}/${state.hero.maxHp} | Wizard ${state.wizard.hp}/${state.wizard.maxHp} | Dragon ${state.dragon.hp}/${state.dragon.maxHp}`,
        state.boardOffsetX + 12,
        34,
      );
      ctx.textAlign = 'right';
      ctx.fillText(
        `${state.lastAction} | Zoom ${Math.round(state.camera.manualZoom * 100)}%`,
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
      if (
        !state.loaded.grass ||
        !state.loaded.water ||
        !state.loaded.hero ||
        !state.loaded.dragon ||
        !state.loaded.wizard ||
        !state.loaded.fireball
      ) {
        renderLoading();
        return;
      }

      ctx.fillStyle = '#172214';
      ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

      ctx.save();
      applyCameraTransform();

      const hoverTile = state.hoverCell
        ? boardTiles.find((tile) => tile.col === state.hoverCell.col && tile.row === state.hoverCell.row)
        : null;
      const hoverPlan = computeHoverPlan(state.hoverCell);

      for (const tile of boardTiles) {
        if (tile === hoverTile) {
          continue;
        }
        drawTerrainTile(tile);
      }

      drawBoardChrome(hoverPlan);

      if (hoverTile) {
        drawTerrainTile(hoverTile, true);
        drawCellHighlight(
          hoverTile,
          null,
          hoverPlan?.valid === false ? 'rgba(255, 76, 76, 0.92)' : 'rgba(255, 245, 176, 0.9)',
          1,
          true,
        );
      }

      const actors = [state.hero, state.wizard, state.dragon].sort((a, b) => a.y - b.y);
      for (const actor of actors) {
        if (actor.id === 'hero') drawHero();
        if (actor.id === 'wizard') drawWizard();
        if (actor.id === 'dragon') drawDragon();
      }
      drawFireballs();

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
        selected_actor: state.selectedActor,
        acted: state.acted,
        last_action: state.lastAction,
        rules: {
          hero_move_range: HERO_MOVE_RANGE,
          wizard_move_range: WIZARD_MOVE_RANGE,
          dragon_move_range: DRAGON_MOVE_RANGE,
          hero_attack_range: HERO_ATTACK_RANGE,
          wizard_attack_range: WIZARD_ATTACK_RANGE,
          dragon_attack_range: DRAGON_ATTACK_RANGE,
          terrain_animation_speed_multiplier: TERRAIN_ANIMATION_SPEED,
        },
        camera: {
          auto_zoom_scale: Number(state.camera.scale.toFixed(2)),
          manual_zoom: Number(state.camera.manualZoom.toFixed(2)),
        },
        active_attack: state.activeAttack,
        fireballs: state.fireballs.length,
        hero: {
          col: Number(state.hero.x.toFixed(2)),
          row: Number(state.hero.y.toFixed(2)),
          cell_col: state.hero.col,
          cell_row: state.hero.row,
          hp: state.hero.hp,
          moving: state.hero.moving,
          queued_steps: state.hero.path.length,
        },
        wizard: {
          col: Number(state.wizard.x.toFixed(2)),
          row: Number(state.wizard.y.toFixed(2)),
          cell_col: state.wizard.col,
          cell_row: state.wizard.row,
          hp: state.wizard.hp,
          moving: state.wizard.moving,
          queued_steps: state.wizard.path.length,
        },
        dragon: {
          col: Number(state.dragon.x.toFixed(2)),
          row: Number(state.dragon.y.toFixed(2)),
          cell_col: state.dragon.col,
          cell_row: state.dragon.row,
          hp: state.dragon.hp,
          moving: state.dragon.moving,
          queued_steps: state.dragon.path.length,
          blocks_party: true,
        },
        hover_cell: state.hoverCell,
        selected_cell: state.lastClickCell,
        blocked_click_cell: state.blockedClickCell,
        path_highlight: state.activePathHighlight,
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
    wizardImage.onload = () => {
      state.loaded.wizard = true;
      render();
    };
    fireballImage.onload = () => {
      state.loaded.fireball = true;
      render();
    };
    grassImage.onerror = () => console.error('Failed to load grass_tile_waving.png');
    waterImage.onerror = () => console.error('Failed to load zsprite_sheet.png');
    heroImage.onerror = () => console.error('Failed to load hero_attacking.png');
    dragonImage.onerror = () => console.error('Failed to load DRAGON_zsprite_sheet.png');
    wizardImage.onerror = () => console.error('Failed to load wizard.png');
    fireballImage.onerror = () => console.error('Failed to load fireball.png');

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
