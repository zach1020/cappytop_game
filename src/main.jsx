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
const ARCHER_FRAME_WIDTH = 502;
const ARCHER_FRAME_HEIGHT = 560;
const ARCHER_COLUMNS = 6;
const ARCHER_ATTACK_FRAMES = 18;
const ARCHER_ATTACK_FPS = 14;
const CHEST_FRAME_WIDTH = 584;
const CHEST_FRAME_HEIGHT = 564;
const CHEST_COLUMNS = 6;
const CHEST_FRAMES = 37;
const CHEST_FPS = 12;

const HERO_MOVE_SPEED = 4.2;
const WIZARD_MOVE_SPEED = 4;
const ARCHER_MOVE_SPEED = 4.1;
const DRAGON_MOVE_SPEED = 3.4;
const TERRAIN_ANIMATION_SPEED = 0.5;
const HERO_MOVE_RANGE = 5;
const WIZARD_MOVE_RANGE = 5;
const ARCHER_MOVE_RANGE = 5;
const DRAGON_MOVE_RANGE = 5;
const HERO_ATTACK_RANGE = 2;
const WIZARD_ATTACK_RANGE = 5;
const ARCHER_ATTACK_RANGE = 5;
const DRAGON_ATTACK_RANGE = 5;
const CHEST_OPEN_RANGE = 2;
const HERO_ATTACK_DAMAGE = 5;
const WIZARD_ATTACK_DAMAGE = 4;
const ARCHER_ATTACK_DAMAGE = 4;
const DRAGON_ATTACK_DAMAGE = 3;
const MIN_MANUAL_ZOOM = 0.6;
const MAX_MANUAL_ZOOM = 1.75;
const EDGE_FOG_MIN_SCALE = 1.08;

const INITIAL_HERO_CELL = { col: 5, row: 9 };
const INITIAL_WIZARD_CELL = { col: 4, row: 10 };
const INITIAL_ARCHER_CELL = { col: 6, row: 10 };
const CHEST_CELL = { col: 17, row: 18 };

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

const STAGES = [
  {
    name: 'Meadow Ambush',
    terrain: TERRAIN_MAP,
    heroes: { hero: INITIAL_HERO_CELL, wizard: INITIAL_WIZARD_CELL, archer: INITIAL_ARCHER_CELL },
    chest: CHEST_CELL,
    dragons: [{ id: 'dragon_1', label: 'Dragon', col: 14, row: 14, hp: 30, damage: 3, moveRange: 5, attackRange: 5 }],
  },
  {
    name: 'Split Creek',
    terrain: [
      '...................',
      '....~~~............',
      '....~~~.......~~~..',
      '....~~~.......~~~..',
      '.............~~~...',
      '.........~~~~......',
      '.........~~~~......',
      '...~~~.............',
      '...~~~......~~~....',
      '...~~~......~~~....',
      '..........~~~~.....',
      '..........~~~~.....',
      '.....~~~...........',
      '.....~~~.....~~~...',
      '............~~~....',
      '...~~~~............',
      '...~~~~............',
      '..............~~~..',
      '...................',
    ],
    heroes: { hero: { col: 3, row: 9 }, wizard: { col: 2, row: 10 }, archer: { col: 4, row: 10 } },
    chest: { col: 17, row: 2 },
    dragons: [
      { id: 'dragon_1', label: 'North Dragon', col: 14, row: 5, hp: 28, damage: 3, moveRange: 5, attackRange: 5 },
      { id: 'dragon_2', label: 'South Dragon', col: 15, row: 15, hp: 26, damage: 3, moveRange: 5, attackRange: 5 },
    ],
  },
  {
    name: 'Marsh Gate',
    terrain: [
      '......~~~..........',
      '......~~~....~~~...',
      '..~~~........~~~...',
      '..~~~..............',
      '..~~~....~~~~......',
      '........~~~~.......',
      '........~~~~..~~~..',
      '...~~~.........~~~.',
      '...~~~.............',
      '.........~~~.......',
      '.........~~~.......',
      '.....~~~......~~~..',
      '.....~~~......~~~..',
      '..............~~~..',
      '..~~~~.............',
      '..~~~~.....~~~.....',
      '...........~~~.....',
      '......~~~..........',
      '...................',
    ],
    heroes: { hero: { col: 2, row: 2 }, wizard: { col: 1, row: 3 }, archer: { col: 3, row: 3 } },
    chest: { col: 16, row: 17 },
    dragons: [
      { id: 'dragon_1', label: 'Marsh Dragon', col: 13, row: 4, hp: 32, damage: 4, moveRange: 5, attackRange: 5 },
      { id: 'dragon_2', label: 'Reed Dragon', col: 15, row: 11, hp: 30, damage: 4, moveRange: 5, attackRange: 5 },
    ],
  },
  {
    name: 'Broken Causeway',
    terrain: [
      '...................',
      '...~~~~............',
      '...~~~~......~~~...',
      '............~~~....',
      '.....~~~~.........~',
      '.....~~~~.........~',
      '...........~~~~....',
      '..~~~......~~~~....',
      '..~~~..............',
      '........~~~~.......',
      '........~~~~..~~~..',
      '....~~~.......~~~..',
      '....~~~............',
      '............~~~~...',
      '......~~~~..~~~~...',
      '......~~~~.........',
      '..~~~..............',
      '..~~~.......~~~~...',
      '...................',
    ],
    heroes: { hero: { col: 2, row: 16 }, wizard: { col: 1, row: 15 }, archer: { col: 3, row: 15 } },
    chest: { col: 17, row: 1 },
    dragons: [
      { id: 'dragon_1', label: 'Bridge Dragon', col: 13, row: 3, hp: 34, damage: 4, moveRange: 5, attackRange: 5 },
      { id: 'dragon_2', label: 'Causeway Dragon', col: 15, row: 9, hp: 34, damage: 4, moveRange: 5, attackRange: 5 },
      { id: 'dragon_3', label: 'Feral Dragon', col: 10, row: 15, hp: 28, damage: 4, moveRange: 6, attackRange: 5 },
    ],
  },
  {
    name: 'Dragon Ring',
    terrain: [
      '........~~~........',
      '...~~~..~~~..~~~...',
      '...~~~.......~~~...',
      '...................',
      '.....~~~~.~~~~.....',
      '.....~.......~.....',
      '.....~.......~.....',
      '.....~~~~.~~~~.....',
      '...................',
      '..~~~.........~~~..',
      '..~~~.........~~~..',
      '...................',
      '.....~~~~.~~~~.....',
      '.....~.......~.....',
      '.....~.......~.....',
      '.....~~~~.~~~~.....',
      '...~~~.......~~~...',
      '...~~~..~~~..~~~...',
      '........~~~........',
    ],
    heroes: { hero: { col: 9, row: 16 }, wizard: { col: 8, row: 17 }, archer: { col: 10, row: 17 } },
    chest: { col: 9, row: 1 },
    dragons: [
      { id: 'dragon_1', label: 'Ring Dragon', col: 5, row: 5, hp: 36, damage: 5, moveRange: 5, attackRange: 5 },
      { id: 'dragon_2', label: 'Ring Dragon', col: 13, row: 5, hp: 36, damage: 5, moveRange: 5, attackRange: 5 },
      { id: 'dragon_3', label: 'Ring Dragon', col: 5, row: 13, hp: 34, damage: 5, moveRange: 5, attackRange: 5 },
      { id: 'dragon_4', label: 'Ring Dragon', col: 13, row: 13, hp: 34, damage: 5, moveRange: 5, attackRange: 5 },
    ],
  },
  {
    name: 'The Bad Idea',
    terrain: [
      '.~~~.....~~~.....~~',
      '.....~~~.....~~~...',
      '~~~.....~~~.....~~~',
      '...~~~.....~~~.....',
      '.....~~~.....~~~...',
      '~~.....~~~.....~~~.',
      '...~~~.....~~~.....',
      '.....~~~.....~~~...',
      '~~~.....~~~.....~~~',
      '...................',
      '~~~.....~~~.....~~~',
      '.....~~~.....~~~...',
      '...~~~.....~~~.....',
      '.~~~.....~~~.....~~',
      '.....~~~.....~~~...',
      '~~~.....~~~.....~~~',
      '...~~~.....~~~.....',
      '.....~~~.....~~~...',
      '~~.....~~~.....~~~.',
    ],
    heroes: { hero: { col: 9, row: 9 }, wizard: { col: 8, row: 9 }, archer: { col: 10, row: 9 } },
    chest: { col: 18, row: 9 },
    dragons: [
      { id: 'dragon_1', label: 'Problem Dragon', col: 1, row: 1, hp: 40, damage: 5, moveRange: 6, attackRange: 5 },
      { id: 'dragon_2', label: 'Problem Dragon', col: 17, row: 1, hp: 40, damage: 5, moveRange: 6, attackRange: 5 },
      { id: 'dragon_3', label: 'Problem Dragon', col: 1, row: 17, hp: 40, damage: 5, moveRange: 6, attackRange: 5 },
      { id: 'dragon_4', label: 'Problem Dragon', col: 17, row: 17, hp: 40, damage: 5, moveRange: 6, attackRange: 5 },
      { id: 'dragon_5', label: 'Boss Dragon', col: 14, row: 9, hp: 54, damage: 6, moveRange: 6, attackRange: 5 },
    ],
  },
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

function isWaterCell(cell, terrainMap = TERRAIN_MAP) {
  return terrainMap[cell.row]?.[cell.col] === '~';
}

function gridDistance(a, b) {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

function isBlockedCell(cell, blockedKeys = new Set(), terrainMap = TERRAIN_MAP) {
  return !isCellInBounds(cell) || isWaterCell(cell, terrainMap) || blockedKeys.has(cellKey(cell));
}

function createBoardTiles(terrainMap = TERRAIN_MAP) {
  const tiles = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const hash = ((row + 3) * 928371 + (col + 7) * 364479) % 997;
      const terrain = terrainMap[row][col] === '~' ? 'water' : 'grass';
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

function findPath(from, to, blockedKeys = new Set(), terrainMap = TERRAIN_MAP) {
  if (isBlockedCell(to, blockedKeys, terrainMap)) {
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

      if (isBlockedCell(next, blockedKeys, terrainMap) || visited.has(nextKey)) {
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

function findReachableCells(from, maxSteps, blockedKeys = new Set(), terrainMap = TERRAIN_MAP) {
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

      if (isBlockedCell(next, blockedKeys, terrainMap) || visited.has(nextKey)) {
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
  const [restartNonce, setRestartNonce] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [battleOutcome, setBattleOutcome] = useState(null);
  const [campaignStats, setCampaignStats] = useState({
    stagesCleared: 0,
    chestsOpened: 0,
    dragonsDefeated: 0,
    turns: 0,
    damageDealt: 0,
    damageTaken: 0,
  });

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

  function endPlayerTurnFromUi() {
    window.end_player_turn?.();
  }

  function restartGame() {
    setBattleOutcome(null);
    setStageIndex(0);
    setCampaignStats({
      stagesCleared: 0,
      chestsOpened: 0,
      dragonsDefeated: 0,
      turns: 0,
      damageDealt: 0,
      damageTaken: 0,
    });
    setRestartNonce((nonce) => nonce + 1);
  }

  function repeatStage() {
    setBattleOutcome(null);
    setRestartNonce((nonce) => nonce + 1);
  }

  function nextStage() {
    setBattleOutcome(null);
    setStageIndex((index) => Math.min(index + 1, STAGES.length - 1));
    setRestartNonce((nonce) => nonce + 1);
  }

  const track = TRACKS[currentTrack];
  const stage = STAGES[stageIndex];

  useEffect(() => {
    setBattleOutcome(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const grassImage = loadImage('/grass_tile_waving.png');
    const waterImage = loadImage('/zsprite_sheet.png');
    const heroImage = loadImage('/hero_attacking.png');
    const dragonImage = loadImage('/DRAGON_zsprite_sheet.png');
    const wizardImage = loadImage('/wizard.png');
    const fireballImage = loadImage('/fireball.png');
    const archerImage = loadImage('/archer.png');
    const chestImage = loadImage('/chest.png');
    const boardTiles = createBoardTiles(stage.terrain);
    const createDragon = (dragon) => ({
      id: dragon.id,
      label: dragon.label,
      col: dragon.col,
      row: dragon.row,
      x: dragon.col,
      y: dragon.row,
      hp: dragon.hp,
      maxHp: dragon.hp,
      damage: dragon.damage,
      moveRange: dragon.moveRange,
      attackRange: dragon.attackRange,
      target: null,
      path: [],
      moving: false,
    });

    const state = {
      stageIndex,
      stageName: stage.name,
      terrainMap: stage.terrain,
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
      tileRumbles: [],
      activeAttack: null,
      fireballs: [],
      arrows: [],
      particles: [],
      screenBlurb: null,
      stageStats: {
        chestsOpened: 0,
        dragonsDefeated: 0,
        turns: 0,
        damageDealt: 0,
        damageTaken: 0,
      },
      outcomePublished: false,
      pendingDragonIds: [],
      activeDragonId: null,
      selectedActor: 'hero',
      acted: { hero: false, wizard: false, archer: false },
      aggro: { hero: 0, wizard: 0, archer: 0 },
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
        col: stage.heroes.hero.col,
        row: stage.heroes.hero.row,
        x: stage.heroes.hero.col,
        y: stage.heroes.hero.row,
        hp: 24,
        maxHp: 24,
        target: null,
        path: [],
        moving: false,
      },
      wizard: {
        id: 'wizard',
        col: stage.heroes.wizard.col,
        row: stage.heroes.wizard.row,
        x: stage.heroes.wizard.col,
        y: stage.heroes.wizard.row,
        hp: 18,
        maxHp: 18,
        target: null,
        path: [],
        moving: false,
      },
      archer: {
        id: 'archer',
        col: stage.heroes.archer.col,
        row: stage.heroes.archer.row,
        x: stage.heroes.archer.col,
        y: stage.heroes.archer.row,
        hp: 20,
        maxHp: 20,
        target: null,
        path: [],
        moving: false,
      },
      dragons: stage.dragons.map(createDragon),
      chest: {
        col: stage.chest.col,
        row: stage.chest.row,
        opened: false,
        opening: false,
        elapsed: 0,
        bonusRound: null,
        opener: null,
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
        archer: false,
        chest: false,
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

    function archerCell() {
      return actorCell(state.archer);
    }

    function livingEnemies() {
      return state.dragons.filter((dragon) => dragon.hp > 0);
    }

    function activeDragon() {
      return state.dragons.find((dragon) => dragon.id === state.activeDragonId) || livingEnemies()[0] || state.dragons[0];
    }

    function dragonCell(dragon = activeDragon()) {
      return actorCell(dragon);
    }

    function chestCell() {
      return { col: state.chest.col, row: state.chest.row };
    }

    function partyActors() {
      return [state.hero, state.wizard, state.archer];
    }

    function livingParty() {
      return partyActors().filter((actor) => actor.hp > 0);
    }

    function actorLabel(id) {
      if (id === 'hero') return 'Hero';
      if (id === 'wizard') return 'Wizard';
      if (id === 'archer') return 'Archer';
      if (id?.startsWith('dragon')) return actorById(id)?.label || 'Dragon';
      return 'Character';
    }

    function actorById(id) {
      if (id === 'hero') return state.hero;
      if (id === 'wizard') return state.wizard;
      if (id === 'archer') return state.archer;
      if (id === 'dragon') return activeDragon();
      if (id?.startsWith('dragon')) return state.dragons.find((dragon) => dragon.id === id) || null;
      return null;
    }

    function isEnemy(actor) {
      return Boolean(actor?.id?.startsWith('dragon'));
    }

    function moveRangeFor(actor) {
      if (actor.id === 'wizard') return WIZARD_MOVE_RANGE;
      if (actor.id === 'archer') return ARCHER_MOVE_RANGE;
      return HERO_MOVE_RANGE;
    }

    function attackRangeFor(actor) {
      if (actor.id === 'wizard') return WIZARD_ATTACK_RANGE;
      if (actor.id === 'archer') return ARCHER_ATTACK_RANGE;
      return HERO_ATTACK_RANGE;
    }

    function selectedActor() {
      const actor = actorById(state.selectedActor) || state.hero;
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
      for (const actor of [...partyActors(), ...state.dragons]) {
        if (actor.hp > 0 && actor.col === cell.col && actor.row === cell.row) {
          return actor;
        }
      }
      return null;
    }

    function isChestCell(cell) {
      return cellKey(cell) === cellKey(chestCell());
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
      for (const actor of partyActors()) {
        if (actor.hp > 0 && actor.id !== actorId) {
          keys.add(cellKey(actorCell(actor)));
        }
      }
      if (includeDragon) {
        for (const dragon of livingEnemies()) {
          if (dragon.id !== actorId) {
            keys.add(cellKey(dragonCell(dragon)));
          }
        }
      }
      keys.add(cellKey(chestCell()));
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

    function setScreenBlurb(text, duration = 1.35, persist = false) {
      state.screenBlurb = { text, elapsed: 0, duration, persist };
    }

    function completeLevel() {
      if (state.phase === 'victory') {
        return;
      }
      state.phase = 'victory';
      state.lastAction = 'Level cleared';
      setScreenBlurb(stageIndex === STAGES.length - 1 ? 'CAMPAIGN CLEARED!!!' : 'LEVEL CLEARED!!!', 4.5, true);
      if (!state.outcomePublished) {
        state.outcomePublished = true;
        const stageStats = {
          stagesCleared: 1,
          chestsOpened: state.stageStats.chestsOpened,
          dragonsDefeated: state.dragons.filter((dragon) => dragon.hp <= 0).length,
          turns: state.round,
          damageDealt: state.stageStats.damageDealt,
          damageTaken: state.stageStats.damageTaken,
        };
        setCampaignStats((stats) => ({
          ...(stats.stagesCleared > stageIndex
            ? stats
            : {
          stagesCleared: stats.stagesCleared + stageStats.stagesCleared,
          chestsOpened: stats.chestsOpened + stageStats.chestsOpened,
          dragonsDefeated: stats.dragonsDefeated + stageStats.dragonsDefeated,
          turns: stats.turns + stageStats.turns,
          damageDealt: stats.damageDealt + stageStats.damageDealt,
          damageTaken: stats.damageTaken + stageStats.damageTaken,
            }),
        }));
      }
      setBattleOutcome(stageIndex === STAGES.length - 1 ? 'campaign' : 'victory');
    }

    function gameOver() {
      if (state.phase === 'defeat') {
        return;
      }
      state.phase = 'defeat';
      state.lastAction = 'Game over';
      setScreenBlurb('GAME OVER !!!', 4.5, true);
      setBattleOutcome('defeat');
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
      for (const actor of [state.hero, state.wizard, state.archer, ...state.dragons]) {
        if (actor.hp > 0) {
          points.push(boardToWorld(actorScreenCell(actor)));
        }
      }

      if (points.length === 0) {
        return;
      }

      const baseMinX = Math.min(...points.map((point) => point.x));
      const baseMaxX = Math.max(...points.map((point) => point.x));
      const baseMinY = Math.min(...points.map((point) => point.y));
      const baseMaxY = Math.max(...points.map((point) => point.y));
      const rawWidth = baseMaxX - baseMinX;
      const rawHeight = baseMaxY - baseMinY;
      const closeness = clamp(1 - Math.max(rawWidth, rawHeight) / (state.tileSize * 20), 0, 1);
      const intimatePadding = state.tileSize * (5.8 - closeness * 3.1);
      const closeMinX = baseMinX - intimatePadding;
      const closeMaxX = baseMaxX + intimatePadding;
      const closeMinY = baseMinY - intimatePadding;
      const closeMaxY = baseMaxY + intimatePadding;
      const focusWidth = Math.max(state.tileSize * (7 - closeness * 2.4), closeMaxX - closeMinX);
      const focusHeight = Math.max(state.tileSize * (7 - closeness * 2.4), closeMaxY - closeMinY);
      const autoScale = clamp(
        Math.min(state.canvasWidth / focusWidth, (state.canvasHeight - 56) / focusHeight),
        1,
        2.85,
      );

      state.camera.targetX = (closeMinX + closeMaxX) / 2;
      state.camera.targetY = (closeMinY + closeMaxY) / 2;
      state.camera.targetScale = clamp(autoScale * state.camera.manualZoom, 0.62, 3.05);
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

    function endPlayerTurn() {
      if (!isPartyTurn()) {
        return;
      }
      for (const actor of livingParty()) {
        state.acted[actor.id] = true;
      }
      state.lastAction = 'Player ends turn';
      beginDragonTurn();
      render();
    }

    window.end_player_turn = endPlayerTurn;

    function beginDragonTurn() {
      if (state.phase === 'victory' || state.phase === 'defeat') {
        return;
      }
      state.phase = 'dragon_turn';
      state.aiDelay = 0.35;
      state.pendingDragonIds = livingEnemies().map((dragon) => dragon.id);
      state.activeDragonId = null;
      state.activePathHighlight = null;
      state.lastAction = 'Dragons turn';
    }

    function beginPlayerTurn() {
      if (state.phase === 'victory' || state.phase === 'defeat') {
        return;
      }
      state.phase = 'player_turn';
      state.round += 1;
      state.acted = {
        hero: state.hero.hp <= 0,
        wizard: state.wizard.hp <= 0,
        archer: state.archer.hp <= 0,
      };
      state.selectedActor = livingParty()[0]?.id || 'hero';
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
        state.lastAction = `${actorLabel(next.id)} ready`;
      }
    }

    function startHeroAttack(targetEnemy) {
      state.phase = 'hero_attacking';
      state.activeAttack = {
        actor: 'hero',
        target: targetEnemy.id,
        elapsed: 0,
        duration: HERO_ATTACK_FRAMES / HERO_ATTACK_FPS,
        damage: HERO_ATTACK_DAMAGE,
        applied: false,
      };
      state.lastAction = 'Hero attacks';
      state.lastClickCell = dragonCell(targetEnemy);
      state.blockedClickCell = null;
    }

    function startWizardAttack(targetEnemy) {
      state.phase = 'wizard_casting';
      state.activeAttack = {
        actor: 'wizard',
        target: targetEnemy.id,
        elapsed: 0,
        duration: WIZARD_CAST_FRAMES / WIZARD_CAST_FPS,
        damage: WIZARD_ATTACK_DAMAGE,
        applied: false,
      };
      state.lastAction = 'Wizard casts';
      state.lastClickCell = dragonCell(targetEnemy);
      state.blockedClickCell = null;
    }

    function startArcherAttack(targetEnemy) {
      state.phase = 'archer_attacking';
      state.activeAttack = {
        actor: 'archer',
        target: targetEnemy.id,
        elapsed: 0,
        duration: ARCHER_ATTACK_FRAMES / ARCHER_ATTACK_FPS,
        damage: ARCHER_ATTACK_DAMAGE,
        applied: false,
      };
      state.lastAction = 'Archer fires';
      state.lastClickCell = dragonCell(targetEnemy);
      state.blockedClickCell = null;
    }

    function launchFireball(owner, targetId, damage) {
      const ownerActor = actorById(owner);
      const targetActor = actorById(targetId);
      if (!ownerActor || !targetActor) {
        return;
      }
      const start = boardToWorld(actorScreenCell(ownerActor));
      const end = boardToWorld(actorScreenCell(targetActor));
      state.fireballs.push({
        owner,
        target: targetId,
        start,
        end,
        elapsed: 0,
        duration: 0.62,
        damage,
      });
      state.phase = 'fireball_flying';
      state.activeAttack = null;
      state.lastAction = `${actorLabel(owner)} fireball flies`;
    }

    function launchArrow() {
      const targetEnemy = actorById(state.activeAttack.target);
      if (!targetEnemy) {
        return;
      }
      const start = boardToWorld(actorScreenCell(state.archer));
      const end = boardToWorld(actorScreenCell(targetEnemy));
      state.arrows.push({
        target: targetEnemy.id,
        start,
        end,
        elapsed: 0,
        duration: 0.48,
        damage: ARCHER_ATTACK_DAMAGE,
      });
      state.phase = 'arrow_flying';
      state.activeAttack = null;
      state.lastAction = 'Arrow flies';
    }

    function startDragonAttack(dragon, targetId) {
      state.phase = 'dragon_attacking';
      state.activeDragonId = dragon.id;
      state.activeAttack = {
        actor: dragon.id,
        target: targetId,
        elapsed: 0,
        duration: DRAGON_ATTACK_FRAMES / DRAGON_ATTACK_FPS,
        damage: dragon.damage,
        applied: false,
      };
      state.lastAction = `${actorLabel(dragon.id)} attacks`;
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

    function rumbleTiles(centerCell) {
      const cells = [];
      for (let row = centerCell.row - 1; row <= centerCell.row + 1; row += 1) {
        for (let col = centerCell.col - 1; col <= centerCell.col + 1; col += 1) {
          const cell = { col, row };
          if (!isCellInBounds(cell)) {
            continue;
          }
          const distance = gridDistance(centerCell, cell);
          cells.push({
            cell,
            time: distance === 0 ? 0.5 : 0.34,
            maxTime: distance === 0 ? 0.5 : 0.34,
            strength: distance === 0 ? 0.34 : 0.13,
          });
        }
      }
      state.tileRumbles.push(...cells);
    }

    function applyAttackDamage() {
      if (!state.activeAttack || state.activeAttack.applied) {
        return;
      }

      state.activeAttack.applied = true;

      const enemyTarget = actorById(state.activeAttack.target);
      if (isEnemy(enemyTarget)) {
        enemyTarget.hp = Math.max(0, enemyTarget.hp - state.activeAttack.damage);
        state.stageStats.damageDealt += state.activeAttack.damage;
        state.aggro[state.activeAttack.actor] =
          (state.aggro[state.activeAttack.actor] || 0) + state.activeAttack.damage + 2;
        state.attackPulse = { cell: dragonCell(enemyTarget), time: 0.35, color: 'rgba(255, 235, 116, 0.82)' };
        rumbleTiles(dragonCell(enemyTarget));
        spawnSparks(dragonCell(enemyTarget), '#ffe45f');
        state.lastAction = `${actorLabel(state.activeAttack.actor)} hits ${actorLabel(enemyTarget.id)}`;
      } else {
        const target = actorById(state.activeAttack.target);
        if (!target) return;
        target.hp = Math.max(0, target.hp - state.activeAttack.damage);
        state.stageStats.damageTaken += state.activeAttack.damage;
        state.attackPulse = { cell: actorCell(target), time: 0.35, color: 'rgba(255, 97, 86, 0.86)' };
        rumbleTiles(actorCell(target));
        spawnSparks(actorCell(target), '#ff3d2e');
        state.lastAction = `Dragon hits ${actorLabel(state.activeAttack.target)}`;
      }
    }

    function finishAttack() {
      if (!state.activeAttack) {
        return;
      }

      const actor = state.activeAttack.actor;
      state.activeAttack = null;

      if (livingEnemies().length === 0) {
        completeLevel();
        return;
      }

      if (livingParty().length === 0) {
        gameOver();
        return;
      }

      if (actor === 'hero') {
        finishPlayerActorAction('hero');
      } else if (actor === 'archer') {
        finishPlayerActorAction('archer');
      } else if (actor?.startsWith('dragon')) {
        finishDragonAction();
      }
    }

    function computeMovePlan(actor, cell) {
      if (!actor || actor.hp <= 0) {
        return { valid: false, path: [], label: 'No actor' };
      }

      if (isWaterCell(cell, state.terrainMap)) {
        return { valid: false, path: [], label: 'Water blocks movement' };
      }

      const path = findPath(actorCell(actor), cell, occupiedKeysFor(actor.id, true), state.terrainMap);
      const sameCell = cellKey(actorCell(actor)) === cellKey(cell);
      const range = moveRangeFor(actor);

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
      if (isEnemy(occupant)) {
        const range = attackRangeFor(actor);
        const valid = gridDistance(actorCell(actor), dragonCell(occupant)) <= range;
        return { type: 'attack', valid, path: [dragonCell(occupant)], label: valid ? 'Attack in range' : 'Attack out of range' };
      }

      if (occupant && occupant.id !== actor.id) {
        return { type: 'blocked', valid: false, path: [cell], label: 'Occupied' };
      }

      if (!state.chest.opened && isChestCell(cell)) {
        const valid =
          livingEnemies().length > 0 &&
          livingParty().length > 0 &&
          gridDistance(actorCell(actor), chestCell()) <= CHEST_OPEN_RANGE;
        return { type: 'open_chest', valid, path: [chestCell()], label: valid ? 'Open chest' : 'Chest out of range' };
      }

      return { type: 'move', ...computeMovePlan(actor, cell) };
    }

    function handlePlayerClick(cell) {
      if (!isPartyTurn()) {
        return;
      }

      const occupant = actorAtCell(cell);
      if (occupant?.id === 'hero' || occupant?.id === 'wizard' || occupant?.id === 'archer') {
        state.selectedActor = occupant.id;
        state.lastAction = `${actorLabel(occupant.id)} selected`;
        render();
        return;
      }

      const actor = selectedActor();
      if (!actor || state.acted[actor.id]) {
        setBlockedClick(cell, 'That character already acted');
        return;
      }

      if (isEnemy(occupant)) {
        const range = attackRangeFor(actor);
        if (gridDistance(actorCell(actor), dragonCell(occupant)) > range) {
          setBlockedClick(cell, 'Attack out of range');
          return;
        }
        if (actor.id === 'wizard') {
          startWizardAttack(occupant);
        } else if (actor.id === 'archer') {
          startArcherAttack(occupant);
        } else {
          startHeroAttack(occupant);
        }
        return;
      }

      if (!state.chest.opened && isChestCell(cell)) {
        if (livingEnemies().length === 0 || livingParty().length === 0) {
          setBlockedClick(cell, 'Chest is locked after battle');
          return;
        }
        if (gridDistance(actorCell(actor), chestCell()) > CHEST_OPEN_RANGE) {
          setBlockedClick(cell, 'Chest out of range');
          return;
        }
        state.phase = 'chest_opening';
        state.chest.opened = true;
        state.chest.opening = true;
        state.chest.elapsed = 0;
        state.chest.bonusRound = state.round;
        state.chest.opener = actor.id;
        state.stageStats.chestsOpened = 1;
        setScreenBlurb('CHEST OPENED!', 1.35);
        state.lastClickCell = chestCell();
        state.blockedClickCell = null;
        state.lastAction = `${actorLabel(actor.id)} opens bonus chest`;
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
        state.phase = `${actor.id}_moving`;
      } else {
        finishPlayerActorAction(actor.id);
      }
    }

    function chooseDragonTarget(dragon) {
      const targets = livingParty();
      if (targets.length === 0) {
        return null;
      }

      return targets
        .map((actor) => ({
          actor,
          distance: gridDistance(dragonCell(dragon), actorCell(actor)),
          aggro: state.aggro[actor.id] || 0,
          hpRatio: actor.hp / actor.maxHp,
        }))
        .sort((a, b) => {
          if (b.aggro !== a.aggro) return b.aggro - a.aggro;
          if (a.hpRatio !== b.hpRatio) return a.hpRatio - b.hpRatio;
          return a.distance - b.distance;
        })[0];
    }

    function chooseDragonMove(dragon, target) {
      const blocked = new Set(livingParty().map((actor) => cellKey(actorCell(actor))));
      for (const other of livingEnemies()) {
        if (other.id !== dragon.id) {
          blocked.add(cellKey(dragonCell(other)));
        }
      }
      blocked.add(cellKey(chestCell()));
      const options = findReachableCells(dragonCell(dragon), dragon.moveRange, blocked, state.terrainMap);
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

    function finishDragonAction() {
      state.activeDragonId = null;
      state.pendingDragonIds = state.pendingDragonIds.filter((id) => actorById(id)?.hp > 0);
      if (state.pendingDragonIds.length > 0 && livingParty().length > 0) {
        state.phase = 'dragon_turn';
        state.aiDelay = 0.24;
      } else {
        beginPlayerTurn();
      }
    }

    function dragonAct() {
      const dragonId = state.pendingDragonIds.shift();
      const dragon = actorById(dragonId);
      if (!dragon || dragon.hp <= 0) {
        finishDragonAction();
        return;
      }

      state.activeDragonId = dragon.id;
      const target = chooseDragonTarget(dragon);
      if (!target) {
        gameOver();
        return;
      }

      if (target.distance <= dragon.attackRange) {
        startDragonAttack(dragon, target.actor.id);
        return;
      }

      const move = chooseDragonMove(dragon, target.actor);
      if (!move || move.path.length === 0) {
        state.lastAction = `${actorLabel(dragon.id)} waits`;
        finishDragonAction();
        return;
      }

      dragon.path = move.path;
      dragon.target = move.path[0];
      dragon.moving = true;
      state.activePathHighlight = { path: move.path, valid: false };
      state.phase = 'dragon_moving';
      state.lastAction = `${actorLabel(dragon.id)} moves ${move.path.length}`;
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

      const hits = state.fireballs.filter((fireball) => fireball.elapsed >= fireball.duration);
      state.fireballs = state.fireballs.filter((fireball) => fireball.elapsed < fireball.duration);

      for (const hit of hits) {
        const target = actorById(hit.target);
        if (!target || target.hp <= 0) {
          continue;
        }

        target.hp = Math.max(0, target.hp - hit.damage);

        if (isEnemy(target)) {
          state.stageStats.damageDealt += hit.damage;
          state.aggro[hit.owner] = (state.aggro[hit.owner] || 0) + hit.damage + 1;
          state.attackPulse = { cell: dragonCell(target), time: 0.35, color: 'rgba(255, 174, 56, 0.9)' };
          rumbleTiles(dragonCell(target));
          spawnSparks(dragonCell(target), '#ffd84d');
          state.lastAction = `${actorLabel(hit.owner)} hits ${actorLabel(target.id)} for ${hit.damage}`;

          if (livingEnemies().length === 0) {
            completeLevel();
          } else {
            finishPlayerActorAction(hit.owner);
          }
        } else {
          state.stageStats.damageTaken += hit.damage;
          state.attackPulse = { cell: actorCell(target), time: 0.35, color: 'rgba(255, 97, 86, 0.86)' };
          rumbleTiles(actorCell(target));
          spawnSparks(actorCell(target), '#ff3d2e');
          state.lastAction = `Dragon fireball hits ${actorLabel(hit.target)}`;

          if (livingParty().length === 0) {
            gameOver();
          } else {
            finishDragonAction();
          }
        }
      }
    }

    function updateArrows(dt) {
      for (const arrow of state.arrows) {
        arrow.elapsed += dt;
      }

      const hits = state.arrows.filter((arrow) => arrow.elapsed >= arrow.duration);
      state.arrows = state.arrows.filter((arrow) => arrow.elapsed < arrow.duration);

      for (const hit of hits) {
        const target = actorById(hit.target);
        if (!target || target.hp <= 0) {
          continue;
        }
        target.hp = Math.max(0, target.hp - hit.damage);
        state.stageStats.damageDealt += hit.damage;
        state.aggro.archer = (state.aggro.archer || 0) + hit.damage + 1;
        state.attackPulse = { cell: dragonCell(target), time: 0.35, color: 'rgba(255, 235, 116, 0.84)' };
        rumbleTiles(dragonCell(target));
        spawnSparks(dragonCell(target), '#ffe45f');
        state.lastAction = `Archer hits ${actorLabel(target.id)} for ${hit.damage}`;

        if (livingEnemies().length === 0) {
          completeLevel();
        } else {
          finishPlayerActorAction('archer');
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

    function updateTileRumbles(dt) {
      for (const rumble of state.tileRumbles) {
        rumble.time -= dt;
      }
      state.tileRumbles = state.tileRumbles.filter((rumble) => rumble.time > 0);
    }

    function update(dt) {
      state.time += dt;
      updateCamera(dt);
      updateParticles(dt);
      updateTileRumbles(dt);

      if (state.screenBlurb) {
        state.screenBlurb.elapsed += dt;
        if (!state.screenBlurb.persist && state.screenBlurb.elapsed >= state.screenBlurb.duration) {
          state.screenBlurb = null;
        }
      }

      if (state.attackPulse) {
        state.attackPulse.time -= dt;
        if (state.attackPulse.time <= 0) {
          state.attackPulse = null;
        }
      }

      if (state.phase === 'hero_attacking') {
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
      } else if (state.phase === 'dragon_attacking') {
        state.activeAttack.elapsed += dt;
        if (state.activeAttack.elapsed >= state.activeAttack.duration) {
          const targetId = state.activeAttack.target;
          const dragon = actorById(state.activeAttack.actor);
          if (!dragon) return;
          launchFireball(dragon.id, targetId, dragon.damage);
        }
      } else if (state.phase === 'wizard_casting') {
        state.activeAttack.elapsed += dt;
        if (state.activeAttack.elapsed >= state.activeAttack.duration) {
          launchFireball('wizard', state.activeAttack.target, WIZARD_ATTACK_DAMAGE);
        }
      } else if (state.phase === 'archer_attacking') {
        state.activeAttack.elapsed += dt;
        if (state.activeAttack.elapsed >= state.activeAttack.duration) {
          launchArrow();
        }
      } else if (state.phase === 'fireball_flying') {
        updateFireballs(dt);
      } else if (state.phase === 'arrow_flying') {
        updateArrows(dt);
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
      } else if (state.phase === 'archer_moving') {
        const finished = updateMover(state.archer, dt, ARCHER_MOVE_SPEED);
        if (finished) {
          finishPlayerActorAction('archer');
        }
      } else if (state.phase === 'dragon_turn') {
        state.aiDelay -= dt;
        if (state.aiDelay <= 0) {
          dragonAct();
        }
      } else if (state.phase === 'dragon_moving') {
        const dragon = activeDragon();
        const finished = updateMover(dragon, dt, DRAGON_MOVE_SPEED);
        if (finished) {
          state.activePathHighlight = null;
          finishDragonAction();
        }
      } else if (state.phase === 'chest_opening') {
        state.chest.elapsed += dt;
        if (state.chest.elapsed >= CHEST_FRAMES / CHEST_FPS) {
          state.chest.opening = false;
          finishPlayerActorAction(state.chest.opener);
        }
      }

      if (state.hero.hp <= 0) {
        state.acted.hero = true;
      }
      if (state.wizard.hp <= 0) {
        state.acted.wizard = true;
      }
      if (state.archer.hp <= 0) {
        state.acted.archer = true;
      }
    }

    function tileRumbleOffset(cell) {
      let x = 0;
      let y = 0;

      for (const rumble of state.tileRumbles) {
        if (rumble.cell.col !== cell.col || rumble.cell.row !== cell.row) {
          continue;
        }
        const decay = clamp(rumble.time / rumble.maxTime, 0, 1);
        const amplitude = state.tileSize * rumble.strength * decay;
        const phase = state.time * 92 + cell.col * 11.7 + cell.row * 17.3;
        x += Math.sin(phase) * amplitude;
        y += Math.cos(phase * 1.27) * amplitude * 0.72;
      }

      return { x, y };
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
      const rumble = tileRumbleOffset(tile);
      const destX = state.boardOffsetX + tile.col * state.tileSize + rumble.x;
      const destY = state.boardOffsetY + tile.row * state.tileSize + rumble.y;
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
      const rumble = tileRumbleOffset(cell);
      const x = state.boardOffsetX + cell.col * state.tileSize - (size - state.tileSize) / 2 + rumble.x;
      const y = state.boardOffsetY + cell.row * state.tileSize - lift - (size - state.tileSize) / 2 + rumble.y;
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

    function drawAttackRadius(actor) {
      if (!actor || actor.hp <= 0 || state.acted[actor.id] || (actor.id !== 'wizard' && actor.id !== 'archer')) {
        return;
      }

      const range = attackRangeFor(actor);
      const origin = actorCell(actor);

      for (let row = origin.row - range; row <= origin.row + range; row += 1) {
        for (let col = origin.col - range; col <= origin.col + range; col += 1) {
          const cell = { col, row };
          if (!isCellInBounds(cell) || gridDistance(origin, cell) > range || isWaterCell(cell, state.terrainMap)) {
            continue;
          }

          const edge = gridDistance(origin, cell) === range;
          drawCellHighlight(
            cell,
            edge ? 'rgba(255, 226, 115, 0.065)' : 'rgba(255, 226, 115, 0.035)',
            edge ? 'rgba(255, 226, 115, 0.22)' : null,
            7,
          );
        }
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
          drawAttackRadius(actor);
          const range = moveRangeFor(actor);
          for (const option of findReachableCells(actorCell(actor), range, occupiedKeysFor(actor.id, true), state.terrainMap)) {
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
      const hoveredEnemy = state.hoverCell ? actorAtCell(state.hoverCell) : null;
      if (isEnemy(hoveredEnemy)) {
        drawActorCellOutline(hoveredEnemy, 'rgba(255, 232, 96, 0.95)');
      }
      if (!state.chest.opened) {
        drawCellHighlight(chestCell(), null, 'rgba(255, 216, 96, 0.58)', 4);
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

    function drawArcher() {
      if (state.archer.hp <= 0) {
        return;
      }
      const archerCenterX = cellCenter(state.archer.x, state.tileSize, state.boardOffsetX);
      const archerFeetY = state.boardOffsetY + (state.archer.y + 1.03) * state.tileSize;
      const drawHeight = state.tileSize * 2.18;
      const drawWidth = drawHeight * (ARCHER_FRAME_WIDTH / ARCHER_FRAME_HEIGHT);
      const bob = state.archer.moving ? Math.sin(state.time * 16) * 1.1 : 0;
      const attackFrame =
        state.activeAttack?.actor === 'archer'
          ? Math.min(ARCHER_ATTACK_FRAMES - 1, Math.floor(state.activeAttack.elapsed * ARCHER_ATTACK_FPS))
          : 0;
      const sourceX = (attackFrame % ARCHER_COLUMNS) * ARCHER_FRAME_WIDTH;
      const sourceY = Math.floor(attackFrame / ARCHER_COLUMNS) * ARCHER_FRAME_HEIGHT;

      withLowHealthFlash(state.archer, () => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 8;
        ctx.drawImage(
          archerImage,
          sourceX,
          sourceY,
          ARCHER_FRAME_WIDTH,
          ARCHER_FRAME_HEIGHT,
          archerCenterX - drawWidth / 2,
          archerFeetY - drawHeight + bob,
          drawWidth,
          drawHeight,
        );
      });
    }

    function drawDragon(dragon) {
      if (dragon.hp <= 0) {
        return;
      }
      const dragonCenterX = cellCenter(dragon.x, state.tileSize, state.boardOffsetX);
      const dragonFeetY = state.boardOffsetY + (dragon.y + 1.02) * state.tileSize;
      const drawHeight = state.tileSize * 2.75;
      const drawWidth = drawHeight;
      const bob = dragon.moving ? Math.sin(state.time * 12) * 1.4 : 0;
      const attackFrame =
        state.activeAttack?.actor === dragon.id
          ? Math.min(DRAGON_ATTACK_FRAMES - 1, Math.floor(state.activeAttack.elapsed * DRAGON_ATTACK_FPS))
          : 0;
      const sourceX = (attackFrame % DRAGON_ATTACK_COLUMNS) * DRAGON_FRAME_SIZE;
      const sourceY = Math.floor(attackFrame / DRAGON_ATTACK_COLUMNS) * DRAGON_FRAME_SIZE;

      withLowHealthFlash(dragon, () => {
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

    function drawChest() {
      const frame = state.chest.opened
        ? Math.min(CHEST_FRAMES - 1, Math.floor(state.chest.elapsed * CHEST_FPS))
        : 0;
      const sourceX = (frame % CHEST_COLUMNS) * CHEST_FRAME_WIDTH;
      const sourceY = Math.floor(frame / CHEST_COLUMNS) * CHEST_FRAME_HEIGHT;
      const centerX = cellCenter(state.chest.col, state.tileSize, state.boardOffsetX);
      const feetY = state.boardOffsetY + (state.chest.row + 0.98) * state.tileSize;
      const drawWidth = state.tileSize * 1.5;
      const drawHeight = drawWidth * (CHEST_FRAME_HEIGHT / CHEST_FRAME_WIDTH);

      ctx.save();
      ctx.shadowColor = state.chest.opened ? 'rgba(255, 208, 75, 0.58)' : 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = state.chest.opened ? 18 : 9;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(
        chestImage,
        sourceX,
        sourceY,
        CHEST_FRAME_WIDTH,
        CHEST_FRAME_HEIGHT,
        centerX - drawWidth / 2,
        feetY - drawHeight,
        drawWidth,
        drawHeight,
      );
      ctx.restore();
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

    function drawArrows() {
      for (const arrow of state.arrows) {
        const progress = clamp(arrow.elapsed / arrow.duration, 0, 1);
        const x = arrow.start.x + (arrow.end.x - arrow.start.x) * progress;
        const y = arrow.start.y + (arrow.end.y - arrow.start.y) * progress;
        const angle = Math.atan2(arrow.end.y - arrow.start.y, arrow.end.x - arrow.start.x);
        const length = state.tileSize * 0.8;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeStyle = '#f5e7a8';
        ctx.lineWidth = Math.max(2, state.tileSize * 0.06);
        ctx.shadowColor = 'rgba(255, 230, 130, 0.72)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-length / 2, 0);
        ctx.lineTo(length / 2, 0);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(length / 2 + 5, 0);
        ctx.lineTo(length / 2 - 5, -4);
        ctx.lineTo(length / 2 - 5, 4);
        ctx.closePath();
        ctx.fill();
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

    function worldToScreen(point) {
      return {
        x: (point.x - state.camera.x) * state.camera.scale + state.canvasWidth / 2,
        y: (point.y - state.camera.y) * state.camera.scale + state.canvasHeight / 2,
      };
    }

    function drawCameraEdgeFog() {
      const amount = clamp((state.camera.scale - EDGE_FOG_MIN_SCALE) / 0.75, 0, 1);
      if (amount <= 0) {
        return;
      }

      const radius = Math.max(state.canvasWidth, state.canvasHeight) * (0.47 - amount * 0.08);
      const gradient = ctx.createRadialGradient(
        state.canvasWidth / 2,
        state.canvasHeight / 2,
        radius * 0.5,
        state.canvasWidth / 2,
        state.canvasHeight / 2,
        Math.max(state.canvasWidth, state.canvasHeight) * 0.72,
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.58, `rgba(3, 7, 5, ${0.08 * amount})`);
      gradient.addColorStop(1, `rgba(3, 7, 5, ${0.5 * amount})`);
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);
      ctx.restore();
    }

    function drawScreenBlurb() {
      if (!state.screenBlurb) {
        return;
      }

      const progress = clamp(state.screenBlurb.elapsed / state.screenBlurb.duration, 0, 1);
      const alpha = state.screenBlurb.persist ? 1 : progress < 0.72 ? 1 : 1 - (progress - 0.72) / 0.28;
      const y = state.canvasHeight * 0.2 - Math.sin(progress * Math.PI) * 12;
      const scale = 1 + Math.sin(state.screenBlurb.elapsed * 4.5) * (state.screenBlurb.persist ? 0.025 : 0.08);
      const width = Math.min(360, state.canvasWidth - 80);
      const height = 54;
      const x = state.canvasWidth / 2 - width / 2;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(state.canvasWidth / 2, y + height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-state.canvasWidth / 2, -(y + height / 2));
      ctx.fillStyle = 'rgba(42, 28, 10, 0.9)';
      ctx.strokeStyle = '#ffd66b';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255, 205, 67, 0.5)';
      ctx.shadowBlur = 18;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
      ctx.fillStyle = '#fff0a7';
      ctx.font = '800 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.screenBlurb.text, state.canvasWidth / 2, y + height / 2 + 1);
      ctx.restore();
    }

    function drawChestIndicator() {
      if (state.chest.opened) {
        return;
      }

      const chestPoint = worldToScreen(boardToWorld(chestCell()));
      const margin = 42;
      const visible =
        chestPoint.x >= margin &&
        chestPoint.x <= state.canvasWidth - margin &&
        chestPoint.y >= margin &&
        chestPoint.y <= state.canvasHeight - margin;

      if (visible) {
        return;
      }

      const center = { x: state.canvasWidth / 2, y: state.canvasHeight / 2 };
      const dx = chestPoint.x - center.x;
      const dy = chestPoint.y - center.y;
      const angle = Math.atan2(dy, dx);
      const x = clamp(chestPoint.x, margin, state.canvasWidth - margin);
      const y = clamp(chestPoint.y, margin, state.canvasHeight - margin);

      ctx.save();
      ctx.translate(x, y);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(39, 30, 16, 0.9)';
      ctx.strokeStyle = '#ffd66b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.rotate(angle);
      ctx.fillStyle = '#ffd66b';
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(14, -8);
      ctx.lineTo(14, 8);
      ctx.closePath();
      ctx.fill();
      ctx.rotate(-angle);
      ctx.fillStyle = '#fff0a7';
      ctx.font = '700 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 1);
      ctx.restore();
    }

    function drawHud() {
      if (state.camera.manualZoom > 0.94) {
        return;
      }

      const status =
        state.phase === 'player_turn'
          ? 'Player Turn'
          : state.phase === 'hero_attacking'
            ? 'Hero Attack'
            : state.phase === 'wizard_casting' || state.phase === 'fireball_flying'
              ? 'Wizard Attack'
              : state.phase === 'archer_attacking' || state.phase === 'arrow_flying'
                ? 'Archer Attack'
              : state.phase === 'dragon_attacking'
                ? 'Dragon Attack'
                : state.phase === 'dragon_turn' || state.phase === 'dragon_moving'
                  ? 'Dragon Turn'
                  : state.phase === 'chest_opening'
                    ? 'Bonus Chest'
                  : state.phase === 'victory'
                    ? 'Victory'
                    : state.phase === 'defeat'
                      ? 'Defeat'
                      : 'Moving';
      const selected = actorLabel(state.selectedActor);

      ctx.save();
      ctx.fillStyle = 'rgba(33, 23, 12, 0.82)';
      ctx.strokeStyle = '#d8b65a';
      ctx.lineWidth = 2;
      ctx.fillRect(state.boardOffsetX, 12, state.boardPixels, 34);
      ctx.strokeRect(state.boardOffsetX, 12, state.boardPixels, 34);
      ctx.fillStyle = '#e6f0cd';
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${status} | ${selected} selected`, state.boardOffsetX + 12, 34);
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
        !state.loaded.fireball ||
        !state.loaded.archer ||
        !state.loaded.chest
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

      drawChest();

      const actors = [state.hero, state.wizard, state.archer, ...state.dragons].sort((a, b) => a.y - b.y);
      for (const actor of actors) {
        if (actor.id === 'hero') drawHero();
        if (actor.id === 'wizard') drawWizard();
        if (actor.id === 'archer') drawArcher();
        if (isEnemy(actor)) drawDragon(actor);
      }
      drawFireballs();
      drawArrows();
      drawParticles();
      for (const actor of actors) {
        drawHealthBar(actor);
      }

      ctx.restore();
      drawCameraEdgeFog();
      drawScreenBlurb();
      drawChestIndicator();
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
        stage: { number: state.stageIndex + 1, name: state.stageName, total: STAGES.length },
        phase: state.phase,
        battle_outcome: state.phase === 'victory' ? 'victory' : state.phase === 'defeat' ? 'defeat' : null,
        round: state.round,
        selected_actor: state.selectedActor,
        acted: state.acted,
        last_action: state.lastAction,
        rules: {
          hero_move_range: HERO_MOVE_RANGE,
          wizard_move_range: WIZARD_MOVE_RANGE,
          archer_move_range: ARCHER_MOVE_RANGE,
          dragon_move_range: DRAGON_MOVE_RANGE,
          hero_attack_range: HERO_ATTACK_RANGE,
          wizard_attack_range: WIZARD_ATTACK_RANGE,
          archer_attack_range: ARCHER_ATTACK_RANGE,
          dragon_attack_range: DRAGON_ATTACK_RANGE,
          chest_open_range: CHEST_OPEN_RANGE,
          terrain_animation_speed_multiplier: TERRAIN_ANIMATION_SPEED,
        },
        camera: {
          auto_zoom_scale: Number(state.camera.scale.toFixed(2)),
          manual_zoom: Number(state.camera.manualZoom.toFixed(2)),
        },
        aggro: state.aggro,
        active_attack: state.activeAttack,
        fireballs: state.fireballs.length,
        arrows: state.arrows.length,
        stage_stats: state.stageStats,
        chest: {
          col: state.chest.col,
          row: state.chest.row,
          opened: state.chest.opened,
          opening: state.chest.opening,
          bonus_round: state.chest.bonusRound,
          included_in_auto_zoom: false,
        },
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
        archer: {
          col: Number(state.archer.x.toFixed(2)),
          row: Number(state.archer.y.toFixed(2)),
          cell_col: state.archer.col,
          cell_row: state.archer.row,
          hp: state.archer.hp,
          moving: state.archer.moving,
          queued_steps: state.archer.path.length,
        },
        dragons: state.dragons.map((dragon) => ({
          id: dragon.id,
          label: dragon.label,
          col: Number(dragon.x.toFixed(2)),
          row: Number(dragon.y.toFixed(2)),
          cell_col: dragon.col,
          cell_row: dragon.row,
          hp: dragon.hp,
          max_hp: dragon.maxHp,
          damage: dragon.damage,
          moving: dragon.moving,
          queued_steps: dragon.path.length,
          blocks_party: true,
        })),
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
    archerImage.onload = () => {
      state.loaded.archer = true;
      render();
    };
    chestImage.onload = () => {
      state.loaded.chest = true;
      render();
    };
    grassImage.onerror = () => console.error('Failed to load grass_tile_waving.png');
    waterImage.onerror = () => console.error('Failed to load zsprite_sheet.png');
    heroImage.onerror = () => console.error('Failed to load hero_attacking.png');
    dragonImage.onerror = () => console.error('Failed to load DRAGON_zsprite_sheet.png');
    wizardImage.onerror = () => console.error('Failed to load wizard.png');
    fireballImage.onerror = () => console.error('Failed to load fireball.png');
    archerImage.onerror = () => console.error('Failed to load archer.png');
    chestImage.onerror = () => console.error('Failed to load chest.png');

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
      delete window.end_player_turn;
    };
  }, [restartNonce]);

  return (
    <main>
      <section className="game-shell">
        <header className="credit-plug">
          <span>
            <strong className="gold-word">Made by Cappy (Zach)</strong> · <a href="https://zachbohl.com" target="_blank" rel="noreferrer">zachbohl.com</a>
          </span>
          <span>
            The <strong className="magic-word">whole thing</strong>, yes, the <strong className="danger-word">ENTIRE THING INCLUDING ASSETS</strong>, was <strong className="magic-word">vibe coded</strong>.
          </span>
        </header>
        <canvas ref={canvasRef} aria-label="19 by 19 turn-based RPG board" />
        <aside className="music-player" aria-label="Music player">
          <audio
            ref={audioRef}
            src={`/${encodeURIComponent(track.file)}`}
            preload="auto"
            onEnded={onTrackEnded}
          />
          <div className="player-screen">
            <span className="track-label">
              Stage {stageIndex + 1}/{STAGES.length} · {stage.name} · Track {currentTrack + 1}/{TRACKS.length}
            </span>
            <strong>{track.title}</strong>
            {battleOutcome && (
              <span className="outcome-label">
                {battleOutcome === 'campaign' ? 'CAMPAIGN CLEARED' : battleOutcome === 'victory' ? 'LEVEL CLEARED' : 'GAME OVER'}
              </span>
            )}
          </div>
          <div className="player-buttons">
            <button type="button" onClick={playPauseMusic}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button type="button" onClick={skipTrack}>
              Skip
            </button>
            <button type="button" onClick={endPlayerTurnFromUi} disabled={battleOutcome !== null}>
              End Turn
            </button>
            {battleOutcome === 'victory' && (
              <button type="button" onClick={repeatStage}>
                Repeat
              </button>
            )}
            {battleOutcome === 'victory' && stageIndex < STAGES.length - 1 && (
              <button type="button" onClick={nextStage}>
                Next
              </button>
            )}
            {battleOutcome === 'campaign' && (
              <button type="button" onClick={repeatStage}>
                Repeat
              </button>
            )}
            {battleOutcome && (
              <button type="button" onClick={restartGame}>
                Restart
              </button>
            )}
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
        {battleOutcome === 'campaign' && (
          <section className="reward-screen" aria-label="Campaign reward">
            <strong>Good job. You cleared the whole campaign.</strong>
            <span>Stages cleared: {campaignStats.stagesCleared}/{STAGES.length}</span>
            <span>Dragons defeated: {campaignStats.dragonsDefeated}</span>
            <span>Bonus chests opened: {campaignStats.chestsOpened}</span>
            <span>Total turns: {campaignStats.turns}</span>
            <span>Damage dealt: {campaignStats.damageDealt} · Damage taken: {campaignStats.damageTaken}</span>
            <a href="https://zachbohl.com" target="_blank" rel="noreferrer">zachbohl.com</a>
          </section>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
