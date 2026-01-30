/*
  Block Battle - Main Game Loop
  Version: 0.6.19
  Last Updated: 2026-01-30
  Changelog:
  - 0.6.19: Replaced lobby hard clamp with wall-collision movement bounds.
  - 0.6.18: Tightened lobby bounds so players cannot exit the lobby walls.
  - 0.6.17: Added neon trim + lobby starfield extension for brighter lobby.
  - 0.6.16: Adjusted lobby layout with rotated upgrade table, walls, and spaced pads.
  - 0.6.15: Aligned lobby beyond corridor end and updated camera/clamp for lobby access.
  - 0.6.14: Shifted lobby further south to prevent corridor overlap.
  - 0.6.13: Rebuilt lobby layout with west wall upgrade table, switch pad, and return portal.
  - 0.6.12: Centralized arena/lobby layout and spawn zones for scaling maps.
  - 0.6.11: Restored hammer knockback by applying push stats on hit.
  - 0.6.10: Added debug HUD toggle flag.
  - 0.6.9: Spawn boss immediately on final non-boss defeat event.
  - 0.6.8: Spawn boss strictly from non-boss defeat counts (no bossPending dependency).
  - 0.6.7: Added debug HUD output for live wave and boss state.
  - 0.6.6: Added active non-boss fallback check to boss spawn and enforced defeat accounting.
  - 0.6.5: Switched boss spawn to count-based non-boss defeats and de-duplicated enemy defeat events.
  - 0.6.4: Fixed boss spawn countdown logic and blocked corridor while plasma gate is active.
  - 0.6.3: Added boss spawn watchdog timer when non-boss enemies are cleared.
  - 0.6.2: Enforced boss spawn after non-boss clears and gated wave completion on boss defeat.
  - 0.6.1: Count active enemies only and lock wave completion until boss is defeated.
  - 0.6.0: Fixed corridor movement clamp, gated powerups between waves, and improved gate-based spawns.
  - 0.5.9: Added wave spawn failsafe to recover when enemies fail to appear.
  - 0.5.8: Added wave tracking + spawn fallback to prevent instant wave-complete loops.
  - 0.5.7: Added wave-start grace window to prevent immediate re-completion loops.
  - 0.5.6: Moved lobby into the same scene and removed teleport flow.
  - 0.5.5: Added lobby grace period to prevent immediate return to arena.
  - 0.5.4: Added debug lobby toggle and widened plasma gate visuals.
  - 0.5.3: Fixed post-wave movement freeze, gated next-wave pad visibility, and updated plasma gate mesh.
  - 0.5.2: Replaced post-wave UI with arena start pad + countdown.
  - 0.5.1: Added armory lobby scene with gates, plasma shield, and basic shop/dummy flow.
  - 0.5.0: Allow selecting the same weapon by swapping primary/secondary in armory.
  - 0.4.9: Rogue now damages any enemies/players within attack range.
  - 0.4.8: Added Rogue Mode toggle and rogue AI that attacks everyone.
  - 0.4.7: Stabilized homing projectile speed at long distances.
  - 0.4.6: Added active weapon highlights, swap hint, and back-to-primary flow.
  - 0.4.5: Added primary/secondary weapon selection flow and HUD panels.
  - 0.4.4: Added wave display HUD and starfield background beyond arena.
  - 0.4.3: Homing projectiles now fire for melee weapons; wave starts spawn powerups.
  - 0.4.2: Prevented auto-attack on round start and improved south-edge camera pan.
  - 0.4.1: Cleaned dead enemies, cleared bombs/spears on new waves, added basic dodge AI, and improved camera zoom.
  - 0.4.0: Bombs now support 3 quick drops and apply powerup effects on explosion.
  - 0.3.9: Enemies now face movement; spears orient to travel and show markers when stuck.
  - 0.3.8: Powerups now clear immediately on player death.
  - 0.3.7: Added powerup letters, HUD status/timer, level heal, and sword range update.
  - 0.3.6: Added enemy separation, gate spawns, delayed boss entry, and shield blocking.
  - 0.3.5: Added 3-pack ammo + recharge for bombs and spears.
  - 0.3.4: Frost/Flame/Oil now apply on hit; shrink/grow scales stats and visuals.
  - 0.3.3: Tornado now applies on hit; fart disables attacking during stun.
  - 0.3.2: Added homing powerup behavior for bow/spear/bomb projectiles and updated fart color.
  - 0.3.1: Adjusted arrow orientation to point in firing direction.
  - 0.3.0: Bow now fires in the direction of player movement.
  - 0.2.9: Fixed bow hit detection to use ground-plane distance.
  - 0.2.8: Added arena boundary walls and clearer weapon visuals (hammer/bow/shield/spear).
  - 0.2.7: Added pause button and pause state handling.
  - 0.2.6: Added weapon icons in armory tabs and detail panel.
  - 0.2.5: Switched armory UI to weapon tabs + detail panel.
  - 0.2.4: Refined armory stats display, map sizing, and projectile speed stats.
  - 0.2.3: Added armory weapon cards with stats, wave-based arena maps, and expanded weapon stats.
  - 0.2.2: Added player death handling with game over UI and retry flow.
  - 0.2.1: Added wave/boss messaging, upgrade table, powerup HUD, and weapon visuals.
  - 0.2.0: Added comments and Phase 1 systems (weapons, enemies, powerups, HUD, menu).
*/
import * as THREE from 'three';
import { InputManager } from '../InputManager.js';
import { createRobot } from '../Robot.js';

// Core Three.js scene setup.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101015);

// Toggle debug HUD visibility.
const DEBUG_ENABLED = false;// Set to true to enable debug HUD on the bottom right corner for enemy counts, 
                            // wave state, and player position.

// Isometric-ish orthographic camera configuration.
const aspect = window.innerWidth / window.innerHeight;
const d = 12;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

camera.position.set(20, 20, 20);
camera.lookAt(scene.position);

// Renderer and canvas mounting.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const container = document.getElementById('game-container');
if (container) {
  container.appendChild(renderer.domElement);
}

// Lighting setup.
scene.add(new THREE.AmbientLight(0x404040));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Arena floor + grid + walls (sizes can change per wave set).
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x222244 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Starfield background outside the arena.
let starfield = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshBasicMaterial({ map: createStarTexture(), side: THREE.DoubleSide })
);
starfield.rotation.x = -Math.PI / 2;
starfield.position.y = -0.2;
scene.add(starfield);

let grid = new THREE.GridHelper(40, 40, 0x00ffff, 0x444444);
scene.add(grid);
let walls = [];
let gatePosition = new THREE.Vector3(0, 0, -20);
let southGatePosition = new THREE.Vector3(0, 0, 20);

// Plasma gate (south) - swirly pink/blue mesh only.
const plasmaMaterial = new THREE.MeshBasicMaterial({
  map: createPlasmaTexture(),
  transparent: true,
  opacity: 0.85,
  side: THREE.DoubleSide
});
plasmaMaterial.map.center.set(0.5, 0.5);
const plasmaShield = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), plasmaMaterial);
plasmaShield.position.set(0, 1.5, 20);
scene.add(plasmaShield);

// Next wave pad (blue circle) + label.
const nextWavePad = new THREE.Mesh(
  new THREE.CylinderGeometry(1.6, 1.6, 0.15, 32),
  new THREE.MeshStandardMaterial({ color: 0x3fa9ff, emissive: 0x3fa9ff, emissiveIntensity: 0.6 })
);
nextWavePad.position.set(6, 0.08, 18);
scene.add(nextWavePad);
const nextWaveLabel = createTextSprite('Start Next Wave', '#7fd1ff');
nextWaveLabel.position.copy(nextWavePad.position).add(new THREE.Vector3(0, 2.2, 0));
scene.add(nextWaveLabel);

// Lobby objects (same scene, south of arena).
let lobbyOrigin = new THREE.Vector3(0, 0, 60);
const lobbyObjects = [];
const LOBBY_SIZE = 30;
const LOBBY_WALK_INSET = 1;
const lobby = createLobbyScene();
const LOBBY_GAP_FROM_CORRIDOR = 2;

function isInLobbyArea(pos = player.position) {
  const half = LOBBY_SIZE / 2 - LOBBY_WALK_INSET;
  return (
    pos.x >= lobbyOrigin.x - half
    && pos.x <= lobbyOrigin.x + half
    && pos.z >= lobbyOrigin.z - half
    && pos.z <= lobbyOrigin.z + half
  );
}

// Wave-to-map assignment. Each range uses a fixed arena size.
const MAPS = [
  { name: 'Training Field', waves: [1, 5], size: 40 },
  { name: 'Asteroid Ring', waves: [6, 10], size: 55 },
  { name: 'Nebula Arena', waves: [11, 15], size: 70 }
];

// Active arena configuration for spawn bounds.
const arenaState = { size: 40 };
const ARENA_SPAWN_MARGIN = 4;
const arenaLayout = {
  half: arenaState.size / 2,
  playerSpawn: new THREE.Vector3(0, 0, 0),
  startWave: new THREE.Vector3(0, 0, 0),
  enemyGate: new THREE.Vector3(0, 0, -arenaState.size / 2 + 1.2),
  southGate: new THREE.Vector3(0, 0, arenaState.size / 2 - 1.2),
  spawnBounds: { minX: -16, maxX: 16, minZ: -16, maxZ: 16 }
};

// Corridor that connects arena south gate to the lobby area.
const corridor = createLobbyCorridor();

function getMapForWave(waveNumber) {
  const match = MAPS.find((map) => waveNumber >= map.waves[0] && waveNumber <= map.waves[1]);
  return match || MAPS[MAPS.length - 1];
}

function updateArenaLayout() {
  const half = arenaState.size / 2;
  arenaLayout.half = half;
  arenaLayout.playerSpawn.set(0, 0, 0);
  arenaLayout.startWave.set(0, 0, 0);

  const gateInset = 1.2;
  if (gatePosition) {
    arenaLayout.enemyGate.copy(gatePosition);
  } else {
    arenaLayout.enemyGate.set(0, 0, -half + gateInset);
  }
  arenaLayout.southGate.set(0, 0, half - gateInset);

  arenaLayout.spawnBounds.minX = -half + ARENA_SPAWN_MARGIN;
  arenaLayout.spawnBounds.maxX = half - ARENA_SPAWN_MARGIN;
  arenaLayout.spawnBounds.minZ = -half + ARENA_SPAWN_MARGIN;
  arenaLayout.spawnBounds.maxZ = half - ARENA_SPAWN_MARGIN;

  southGatePosition.copy(arenaLayout.southGate);
  if (typeof arenaGate !== 'undefined' && arenaGate) {
    arenaGate.position.set(southGatePosition.x, 1.5, southGatePosition.z);
  }
  plasmaShield.position.set(southGatePosition.x, 1.5, southGatePosition.z + 2);

  nextWavePad.position.set(arenaLayout.startWave.x, 0.08, arenaLayout.startWave.z);
  nextWaveLabel.position.copy(nextWavePad.position).add(new THREE.Vector3(0, 2.2, 0));

  if (corridor) {
    corridor.floor.position.set(0, 0, southGatePosition.z + corridor.length / 2);
    corridor.wallLeft.position.set(-corridor.width / 2, 1.5, corridor.floor.position.z);
    corridor.wallRight.position.set(corridor.width / 2, 1.5, corridor.floor.position.z);
  }

  const oldOrigin = lobbyOrigin.clone();
  const corridorCenterZ = corridor ? corridor.floor.position.z : southGatePosition.z;
  const corridorEndZ = corridor ? corridorCenterZ + corridor.length / 2 : southGatePosition.z;
  lobbyOrigin.set(0, 0, corridorEndZ + (LOBBY_SIZE / 2) + LOBBY_GAP_FROM_CORRIDOR);
  const lobbyDelta = lobbyOrigin.clone().sub(oldOrigin);
  if (lobbyDelta.lengthSq() > 0.0001) {
    lobbyObjects.forEach((obj) => obj.position.add(lobbyDelta));
  }
}

function setArenaForWave(waveNumber) {
  const map = getMapForWave(waveNumber);
  arenaState.size = map.size;

  if (floor.geometry) floor.geometry.dispose();
  floor.geometry = new THREE.PlaneGeometry(map.size, map.size);

  if (starfield.geometry) starfield.geometry.dispose();
  starfield.geometry = new THREE.PlaneGeometry(map.size * 3, map.size * 3);

  if (grid) {
    scene.remove(grid);
  }
  grid = new THREE.GridHelper(map.size, Math.floor(map.size / 2), 0x00ffff, 0x444444);
  scene.add(grid);

  walls.forEach((wall) => scene.remove(wall));
  const wallBundle = buildWalls(map.size);
  walls = wallBundle.walls;
  gatePosition = wallBundle.gate;
  walls.forEach((wall) => scene.add(wall));

  updateArenaLayout();
}

function getSpawnRange() {
  return Math.max(arenaLayout.half - ARENA_SPAWN_MARGIN, 10);
}

function getRandomArenaPosition(y = 0) {
  const { minX, maxX, minZ, maxZ } = arenaLayout.spawnBounds;
  return new THREE.Vector3(
    THREE.MathUtils.randFloat(minX, maxX),
    y,
    THREE.MathUtils.randFloat(minZ, maxZ)
  );
}

function getPowerupSpawnPosition() {
  return getRandomArenaPosition(0.6);
}

function getGateSpawnPosition() {
  return arenaLayout.enemyGate.clone();
}

function buildWalls(size) {
  const half = size / 2;
  const height = 3;
  const thickness = 0.6;
  const gateWidth = 8;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b2b38 });
  const leftNorth = new THREE.Mesh(new THREE.BoxGeometry((size - gateWidth) / 2, height, thickness), wallMat);
  leftNorth.position.set(-(gateWidth / 2 + (size - gateWidth) / 4), height / 2, -half);
  const rightNorth = new THREE.Mesh(new THREE.BoxGeometry((size - gateWidth) / 2, height, thickness), wallMat);
  rightNorth.position.set((gateWidth / 2 + (size - gateWidth) / 4), height / 2, -half);
  const leftSouth = new THREE.Mesh(new THREE.BoxGeometry((size - gateWidth) / 2, height, thickness), wallMat);
  leftSouth.position.set(-(gateWidth / 2 + (size - gateWidth) / 4), height / 2, half);
  const rightSouth = new THREE.Mesh(new THREE.BoxGeometry((size - gateWidth) / 2, height, thickness), wallMat);
  rightSouth.position.set((gateWidth / 2 + (size - gateWidth) / 4), height / 2, half);
  const west = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, size), wallMat);
  west.position.set(-half, height / 2, 0);
  const east = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, size), wallMat);
  east.position.set(half, height / 2, 0);
  return {
    walls: [leftNorth, rightNorth, leftSouth, rightSouth, west, east],
    gate: new THREE.Vector3(0, 0, -half + 1.2)
  };
}

function clampToArena(position) {
  const half = arenaState.size / 2 - 1;
  position.x = Math.max(-half, Math.min(half, position.x));
  position.z = Math.max(-half, Math.min(half, position.z));
}

function clampAxis(current, next, min, max) {
  if (current < min || current > max) {
    return THREE.MathUtils.clamp(current, min, max);
  }
  if (next < min || next > max) {
    return current;
  }
  return next;
}

function resolvePlayerMovement(currentPos, nextPos) {
  const half = arenaLayout.half - 1;
  const corridorHalf = corridor ? corridor.width / 2 - 1 : 5;
  const corridorStartZ = half;
  const corridorEndZ = corridor ? corridor.floor.position.z + corridor.length / 2 - 1 : half;
  const lobbyHalf = LOBBY_SIZE / 2 - LOBBY_WALK_INSET;
  const lobbyMinX = lobbyOrigin.x - lobbyHalf;
  const lobbyMaxX = lobbyOrigin.x + lobbyHalf;
  const lobbyMinZ = lobbyOrigin.z - lobbyHalf;
  const lobbyMaxZ = lobbyOrigin.z + lobbyHalf;

  const inLobbyNow = currentPos.z >= lobbyMinZ && currentPos.z <= lobbyMaxZ && currentPos.x >= lobbyMinX && currentPos.x <= lobbyMaxX;
  const inLobbyNext = nextPos.z >= lobbyMinZ && nextPos.z <= lobbyMaxZ && nextPos.x >= lobbyMinX && nextPos.x <= lobbyMaxX;

  if (!waveComplete) {
    nextPos.x = clampAxis(currentPos.x, nextPos.x, -half, half);
    nextPos.z = clampAxis(currentPos.z, nextPos.z, -half, half);
    return nextPos;
  }

  if (inLobbyNow || inLobbyNext) {
    nextPos.x = clampAxis(currentPos.x, nextPos.x, lobbyMinX, lobbyMaxX);
    nextPos.z = clampAxis(currentPos.z, nextPos.z, lobbyMinZ, lobbyMaxZ);
    return nextPos;
  }

  if (currentPos.z > corridorStartZ || nextPos.z > corridorStartZ) {
    const corridorMaxZ = Math.max(corridorEndZ, lobbyMinZ);
    nextPos.z = clampAxis(currentPos.z, nextPos.z, corridorStartZ, corridorMaxZ);
    nextPos.x = clampAxis(currentPos.x, nextPos.x, -corridorHalf, corridorHalf);
    return nextPos;
  }

  nextPos.x = clampAxis(currentPos.x, nextPos.x, -half, half);
  nextPos.z = clampAxis(currentPos.z, nextPos.z, -half, half);
  return nextPos;
}

// Cached UI elements.
const UI = {
  menu: document.getElementById('menu'),
  waveComplete: document.getElementById('wave-complete'),
  gameOver: document.getElementById('game-over'),
  messageBanner: document.getElementById('message-banner'),
  weaponTabs: document.getElementById('weapon-tabs'),
  weaponDetail: document.getElementById('weapon-detail'),
  pauseBtn: document.getElementById('pause-btn'),
  powerupTimer: document.getElementById('powerup-timer'),
  powerupMessage: document.getElementById('powerup-message'),
  waveNumber: document.getElementById('wave-number'),
  primaryWeapon: document.getElementById('primary-weapon'),
  primaryLevel: document.getElementById('primary-level'),
  secondaryWeapon: document.getElementById('secondary-weapon'),
  secondaryLevel: document.getElementById('secondary-level'),
  primaryActive: document.getElementById('primary-active'),
  secondaryActive: document.getElementById('secondary-active'),
  activeWeapon: document.getElementById('active-weapon'),
  armoryStep: document.getElementById('armory-step'),
  backPrimaryBtn: document.getElementById('back-primary-btn'),
  rogueToggle: document.getElementById('rogue-toggle'),
  startBtn: document.getElementById('start-btn'),
  armoryBtn: document.getElementById('armory-btn'),
  nextWaveBtn: document.getElementById('next-wave-btn'),
  retryBtn: document.getElementById('retry-btn'),
  armoryBtnLose: document.getElementById('armory-btn-lose'),
  powerupName: document.getElementById('powerup-name'),
  points: document.getElementById('points'),
  playerHealth: document.getElementById('player-health-fill'),
  enemyStatus: document.getElementById('enemy-status'),
  enemyHealth: document.getElementById('enemy-health-fill'),
  debugHud: document.getElementById('debug-hud')
};

// Weapon definitions + level configs + armory descriptors.
const WEAPONS = {
  sword: {
    name: 'Sword',
    type: 'melee',
    icon: '🗡️',
    description: 'Fast slashing melee weapon for close-range duels.',
    levels: [
      { label: 'Standard', damage: 12, defense: 0, range: 3.2, cooldown: 0.5, speed: 1.0 },
      { label: 'Fire', damage: 16, defense: 0, range: 3.2, cooldown: 0.5, speed: 1.05, burn: 4 },
      { label: 'Laser', damage: 20, defense: 0, range: 3.4, cooldown: 0.45, speed: 1.1, disarm: 3 }
    ],
    upgradeCosts: [0, 30, 60]
  },
  hammer: {
    name: 'Hammer',
    type: 'melee',
    icon: '🔨',
    description: 'Heavy hitter with slower swings and splash impact.',
    levels: [
      { label: 'Standard', damage: 18, defense: 0.05, range: 2.4, cooldown: 0.7, speed: 0.85, push: 1.4 },
      { label: 'Fire', damage: 22, defense: 0.05, range: 2.4, cooldown: 0.7, speed: 0.9, burn: 4, push: 1.7 },
      { label: 'Laser', damage: 26, defense: 0.1, range: 2.6, cooldown: 0.75, speed: 0.9, splash: 3.5, push: 2.0 }
    ],
    upgradeCosts: [0, 35, 70]
  },
  bow: {
    name: 'Bow',
    type: 'ranged',
    icon: '🏹',
    description: 'Long-range shots to kite enemies from a distance.',
    levels: [
      { label: 'Standard', damage: 10, defense: 0, range: 7.5, cooldown: 0.6, speed: 1.1, projectileSpeed: 16 },
      { label: 'Fire', damage: 12, defense: 0, range: 7.5, cooldown: 0.6, speed: 1.1, burn: 4, projectileSpeed: 16 },
      { label: 'Electric', damage: 14, defense: 0, range: 8.5, cooldown: 0.65, speed: 1.15, shock: 2.5, projectileSpeed: 18 }
    ],
    upgradeCosts: [0, 30, 65]
  },
  shield: {
    name: 'Shield',
    type: 'defense',
    icon: '🛡️',
    description: 'Defensive bash weapon that reduces incoming damage, pushes enemies back and recovers health',
    levels: [
      { label: 'Wood', damage: 6, defense: 1.5, range: 2.0, cooldown: 0.6, speed: 0.9, push: 3.2, block: 1.35 },
      { label: 'Iron', damage: 8, defense: 4.5, range: 2.0, cooldown: 0.6, speed: 0.9, push: 7.5, block: 2.45 },
      { label: 'Diamond', damage: 10, defense: 7.5, range: 2.2, cooldown: 0.5, speed: 0.95, push: 12.8, block: 4.6 }
    ],
    upgradeCosts: [0, 25, 55]
  },
  spear: {
    name: 'Spear',
    type: 'spear',
    icon: '🔱',
    description: 'Reach + throwable spear that must be recovered.',
    levels: [
      { label: 'Wood', damage: 14, defense: 0.05, range: 3.0, cooldown: 0.65, speed: 1.0, throwSpeed: 18 },
      { label: 'Fire', damage: 18, defense: 0.05, range: 3.0, cooldown: 0.65, speed: 1.0, throwSpeed: 18, burn: 4 },
      { label: 'Laser', damage: 24, defense: 0.1, range: 3.2, cooldown: 0.7, speed: 1.05, throwSpeed: 20, pierce: true }
    ],
    upgradeCosts: [0, 35, 75]
  },
  bombs: {
    name: 'Bombs',
    type: 'bomb',
    icon: '💣',
    description: 'Area damage with limited active bomb count.',
    levels: [
      { label: 'Standard', damage: 22, defense: 0, range: 3.0, cooldown: 3.0, speed: 0.8, radius: 3.0 },
      { label: 'Fire', damage: 26, defense: 0, range: 3.2, cooldown: 3.0, speed: 0.8, radius: 3.2, burn: 4 },
      { label: 'Laser', damage: 32, defense: 0, range: 3.5, cooldown: 2.8, speed: 0.85, radius: 3.5 }
    ],
    upgradeCosts: [0, 40, 80],
    maxActive: 3
  },
  punch: {
    name: 'Punch',
    type: 'melee',
    icon: '👊',
    description: 'Default backup attack with no upgrades.',
    levels: [
      { label: 'Default', damage: 6, defense: 0, range: 1.8, cooldown: 0.4, speed: 1.0 }
    ],
    upgradeCosts: [0]
  }
};

// Powerup definitions with visuals + durations.
const POWERUPS = [
  { id: 'frost', label: 'Frost Bite', color: 0x55ccff, duration: 10, letter: 'F' },
  { id: 'flame', label: 'FlameKiss', color: 0xff5533, duration: 10, letter: 'K' },
  { id: 'tornado', label: 'Tornado', color: 0xd2b48c, duration: 10, letter: 'T' },
  { id: 'oil', label: 'Oil Slick', color: 0x666666, duration: 10, letter: 'O' },
  { id: 'missiles', label: 'Homing Missiles', color: 0xffcc00, duration: 10, letter: 'H' },
  { id: 'size', label: 'Shrink/Grow', color: 0xcc99ff, duration: 10, letter: 'S' },
  { id: 'fart', label: 'Fart', color: 0x33ff66, duration: 5, letter: 'R' }
];

// Player entity and runtime state.
const player = createRobot(0x33ff33);
player.position.set(0, 0, 0);
scene.add(player);

const playerState = {
  health: 100,
  points: 0,
  primaryWeaponId: 'sword',
  secondaryWeaponId: 'bow',
  activeSlot: 'primary',
  weaponLevels: {
    sword: 1,
    hammer: 1,
    bow: 1,
    shield: 1,
    spear: 1,
    bombs: 1,
    punch: 1
  },
  attackCooldown: 0,
  isAttacking: false,
  swingTimer: 0,
  blockStrength: 0,
  spears: [],
  bombAmmo: 3,
  spearAmmo: 3,
  isDead: false,
  homingTimer: 0,
  tornadoTimer: 0,
  stunTimer: 0,
  frostTimer: 0,
  flameTimer: 0,
  oilTimer: 0,
  sizeTimer: 0,
  sizeMode: 'normal',
  damageMultiplier: 1,
  defenseMultiplier: 1,
  speedMultiplier: 1,
  lastMoveDir: new THREE.Vector3(0, 0, -1)
};

// Collections for active entities.
const enemies = [];
const projectiles = [];
const bombs = [];
const powerups = [];
let powerupSpawnTimer = 20;
let gameRunning = false;
let currentWave = 1;
let waveComplete = false;
let pendingWave = 1;
let isPaused = false;
let bossPending = false;
let lastInputState = { x: 0, y: 0, attack: false, dash: false, bomb: false, shield: false };
let armoryStep = 'primary';
let rogueEnabled = false;
let rogue = null;
const ROGUE_SPAWN_CHANCE = 0.35;
let interactRequested = false;
let nextWaveCountdown = 0;
let waveStartQueued = false;
let waveStartGrace = 0;
let waveElapsed = 0;
let waveSpawned = 0;
let waveDefeated = 0;
let waveNonBossSpawned = 0;
let waveNonBossDefeated = 0;
let bossSpawned = false;
let debugHudTimer = 0;

// Input system + time.
const input = new InputManager();
const clock = new THREE.Clock();
let attackRequested = false;

// Pointer attack toggle (for mouse click attacks).
window.addEventListener('pointerdown', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.closest('button')) return;
  if (!gameRunning) return;
  attackRequested = true;
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyB' && gameRunning && !isPaused) {
    setActiveSlot(playerState.activeSlot === 'primary' ? 'secondary' : 'primary');
  }
  if (event.code === 'KeyF') {
    interactRequested = true;
  }
});

// Generate temporary upgrade costs for all weapons.
function seedUpgradeCosts() {
  Object.entries(WEAPONS).forEach(([id, weapon]) => {
    if (id === 'punch') return;
    weapon.upgradeCosts = [
      randomCost(5, 20, 5),
      randomCost(25, 60, 5),
      randomCost(60, 120, 10)
    ];
  });
}

function randomCost(min, max, step) {
  const range = Math.floor((max - min) / step);
  return min + Math.floor(Math.random() * (range + 1)) * step;
}

// Build the start menu armory tabs and detail panel.
function createMenu() {
  renderWeaponTabs();
  renderWeaponDetail();
  updateArmoryStepUI();

  if (UI.startBtn) {
    UI.startBtn.addEventListener('click', () => {
      if (armoryStep === 'primary') {
        armoryStep = 'secondary';
        updateArmoryStepUI();
        renderWeaponTabs();
        renderWeaponDetail();
        return;
      }
      if (UI.menu) UI.menu.style.display = 'none';
      gameRunning = true;
      setActiveSlot('primary');
      startWave(pendingWave);
    });
  }

  // Post-wave actions are now handled via arena pad and lobby gate.

  if (UI.pauseBtn) {
    UI.pauseBtn.addEventListener('click', () => {
      togglePause();
    });
  }

  if (UI.backPrimaryBtn) {
    UI.backPrimaryBtn.addEventListener('click', () => {
      armoryStep = 'primary';
      updateArmoryStepUI();
      renderWeaponTabs();
      renderWeaponDetail();
    });
  }

  if (UI.retryBtn) {
    UI.retryBtn.addEventListener('click', () => {
      if (UI.gameOver) UI.gameOver.style.display = 'none';
      resetPlayer();
      gameRunning = true;
      startWave(currentWave);
    });
  }

  if (UI.armoryBtnLose) {
    UI.armoryBtnLose.addEventListener('click', () => {
      if (UI.gameOver) UI.gameOver.style.display = 'none';
      if (UI.menu) UI.menu.style.display = 'flex';
      gameRunning = false;
      resetPlayer();
      armoryStep = 'primary';
      updateArmoryStepUI();
      renderWeaponTabs();
      renderWeaponDetail();
    });
  }

  if (UI.rogueToggle) {
    UI.rogueToggle.checked = rogueEnabled;
    UI.rogueToggle.addEventListener('change', (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement) {
        rogueEnabled = target.checked;
      }
    });
  }
}

// Render the weapon selector tabs (top row).
function renderWeaponTabs() {
  if (!UI.weaponTabs) return;
  UI.weaponTabs.innerHTML = '';
  Object.entries(WEAPONS)
    .filter(([id]) => id !== 'punch')
    .forEach(([id, weapon]) => {
      const tab = document.createElement('div');
      tab.className = 'weapon-tab';
      const selectedId = armoryStep === 'primary' ? playerState.primaryWeaponId : playerState.secondaryWeaponId;
      if (id === selectedId) tab.classList.add('selected');
      tab.textContent = `${weapon.icon} ${weapon.name}`;
      tab.addEventListener('click', () => {
        const otherId = armoryStep === 'primary' ? playerState.secondaryWeaponId : playerState.primaryWeaponId;
        if (id === otherId) {
          // Swap primary/secondary if the chosen weapon is already in the other slot.
          const temp = playerState.primaryWeaponId;
          playerState.primaryWeaponId = playerState.secondaryWeaponId;
          playerState.secondaryWeaponId = temp;
        } else if (armoryStep === 'primary') {
          playerState.primaryWeaponId = id;
        } else {
          playerState.secondaryWeaponId = id;
        }
        renderWeaponTabs();
        renderWeaponDetail();
        updateHud();
      });
      UI.weaponTabs.appendChild(tab);
    });
}

// Render the detail panel for the currently selected weapon.
function renderWeaponDetail() {
  if (!UI.weaponDetail) return;
  const selectedId = armoryStep === 'primary' ? playerState.primaryWeaponId : playerState.secondaryWeaponId;
  const weapon = WEAPONS[selectedId];
  if (!weapon) return;
  const levelIndex = Math.min((playerState.weaponLevels[selectedId] || 1) - 1, weapon.levels.length - 1);
  const level = weapon.levels[levelIndex];
  const specials = buildSpecialList(level);
  const costs = weapon.upgradeCosts || [0, 0, 0];

  UI.weaponDetail.innerHTML = `
    <h3>${weapon.icon} ${weapon.name} <span style="font-size:12px;color:rgba(255,255,255,0.7)">(Lv ${playerState.weaponLevels[selectedId] || 1})</span></h3>
    <div class="meta">${weapon.description}</div>
    <div class="weapon-stats">
      <span>Attack: ${level.damage}</span>
      <span>Defense: ${Math.round((level.defense || 0) * 100)}%</span>
      <span>Range: ${level.range ?? '—'}</span>
      <span>Cooldown: ${level.cooldown}s</span>
      <span>Speed: ${level.speed ?? '—'}</span>
      ${level.radius ? `<span>AoE: ${level.radius}</span>` : ''}
      ${level.projectileSpeed ? `<span>Projectile: ${level.projectileSpeed}</span>` : ''}
      ${specials.length ? `<span>Special: ${specials.join(', ')}</span>` : ''}
      <span>Costs: L1 ${costs[0]} / L2 ${costs[1]} / L3 ${costs[2]}</span>
    </div>
  `;
}

// Refresh weapon selection visuals (tabs + detail).
function updateWeaponCards() {
  renderWeaponTabs();
  renderWeaponDetail();
}

function buildSpecialList(level) {
  const specials = [];
  if (level.burn) specials.push(`Burn ${level.burn}s`);
  if (level.disarm) specials.push(`Disarm ${level.disarm}s`);
  if (level.shock) specials.push(`Shock ${level.shock}s`);
  if (level.splash) specials.push(`Splash ${level.splash}`);
  if (level.radius) specials.push(`AoE ${level.radius}`);
  if (level.block) specials.push(`Block ${Math.round(level.block * 100)}%`);
  return specials;
}

// Get active weapon config by level.
function getWeaponConfig() {
  const weaponId = getActiveWeaponId();
  const weapon = WEAPONS[weaponId] || WEAPONS.punch;
  const levelIndex = Math.min((playerState.weaponLevels[weaponId] || 1) - 1, weapon.levels.length - 1);
  return { weapon, config: weapon.levels[levelIndex] };
}

function getActiveWeaponId() {
  return playerState.activeSlot === 'primary' ? playerState.primaryWeaponId : playerState.secondaryWeaponId;
}

function setActiveSlot(slot) {
  playerState.activeSlot = slot;
  updateHud();
}

function updateArmoryStepUI() {
  if (!UI.armoryStep) return;
  if (armoryStep === 'primary') {
    UI.armoryStep.textContent = 'Select your primary weapon.';
    if (UI.startBtn) UI.startBtn.textContent = 'Next';
    if (UI.backPrimaryBtn) UI.backPrimaryBtn.style.display = 'none';
  } else {
    UI.armoryStep.textContent = 'Select your secondary weapon.';
    if (UI.startBtn) UI.startBtn.textContent = 'Start Training';
    if (UI.backPrimaryBtn) UI.backPrimaryBtn.style.display = 'inline-block';
  }
}

// Refresh HUD values.
function updateHud() {
  if (UI.waveNumber) UI.waveNumber.textContent = String(currentWave);
  if (UI.primaryWeapon) UI.primaryWeapon.textContent = WEAPONS[playerState.primaryWeaponId].name;
  if (UI.secondaryWeapon) UI.secondaryWeapon.textContent = WEAPONS[playerState.secondaryWeaponId].name;
  if (UI.primaryLevel) UI.primaryLevel.textContent = String(playerState.weaponLevels[playerState.primaryWeaponId] || 1);
  if (UI.secondaryLevel) UI.secondaryLevel.textContent = String(playerState.weaponLevels[playerState.secondaryWeaponId] || 1);
  if (UI.activeWeapon) UI.activeWeapon.textContent = playerState.activeSlot === 'primary' ? 'Primary' : 'Secondary';
  if (UI.primaryActive) UI.primaryActive.classList.toggle('active', playerState.activeSlot === 'primary');
  if (UI.secondaryActive) UI.secondaryActive.classList.toggle('active', playerState.activeSlot === 'secondary');
  if (UI.points) UI.points.textContent = String(playerState.points);
  if (UI.playerHealth) UI.playerHealth.style.width = `${Math.max(playerState.health, 0)}%`;
  updateWeaponVisual();
}

function updateDebugHud(dt) {
  if (!UI.debugHud) return;
  if (!DEBUG_ENABLED) {
    UI.debugHud.style.display = 'none';
    return;
  }
  UI.debugHud.style.display = 'block';
  debugHudTimer -= dt;
  if (debugHudTimer > 0) return;
  debugHudTimer = 0.2;

  const aliveEnemies = enemies.filter((enemy) => enemy.health > 0 && !enemy.defeated);
  const liveNonBoss = aliveEnemies.filter((enemy) => !enemy.isBoss).length;
  const bossAlive = aliveEnemies.some((enemy) => enemy.isBoss);

  UI.debugHud.textContent = [
    `wave: ${currentWave} (${waveComplete ? 'complete' : 'active'})`,
    `pendingWave: ${pendingWave}`,
    `bossPending: ${bossPending} bossSpawned: ${bossSpawned}`,
    `enemies: ${enemies.length} alive: ${aliveEnemies.length}`,
    `nonBoss live: ${liveNonBoss}`,
    `nonBoss spawned/defeated: ${waveNonBossSpawned}/${waveNonBossDefeated}`,
    `bossAlive: ${bossAlive ? 'yes' : 'no'}`,
    `waveElapsed: ${waveElapsed.toFixed(1)}s`,
    `startGrace: ${waveStartGrace.toFixed(1)}s`
  ].join('\n');
}

// Toggle weapon visuals on the player model.
function updateWeaponVisual() {
  if (!player.userData) return;
  const weapon = getActiveWeaponId();
  const showSword = weapon === 'sword';
  const showHammer = weapon === 'hammer';
  const showBow = weapon === 'bow';
  const showShield = weapon === 'shield';
  const showSpear = weapon === 'spear';
  const showBomb = weapon === 'bombs';

  if (player.userData.swordBlade) player.userData.swordBlade.visible = showSword;
  if (player.userData.hammerHead) player.userData.hammerHead.visible = showHammer;
  if (player.userData.bowFrame) player.userData.bowFrame.visible = showBow;
  if (player.userData.shield) player.userData.shield.visible = showShield;
  if (player.userData.spearShaft) player.userData.spearShaft.visible = showSpear;
  if (player.userData.spearTip) player.userData.spearTip.visible = showSpear;
  if (player.userData.heldBomb) player.userData.heldBomb.visible = showBomb;
}

// Spawn an enemy with size-based stats.
function spawnEnemy(size = 'small', position = null) {
  const color = size === 'boss' ? 0xff9999 : size === 'large' ? 0xff7777 : size === 'medium' ? 0xff5555 : 0xff3333;
  const enemy = createRobot(color);
  if (position) {
    enemy.position.copy(position);
  } else {
    enemy.position.copy(getRandomArenaPosition(0));
  }
  enemy.lookAt(0, 0, 0);
  scene.add(enemy);

  const stats = {
    small: { health: 40, speed: 2.2, damage: 6, points: 5 },
    medium: { health: 70, speed: 1.8, damage: 10, points: 10 },
    large: { health: 110, speed: 1.4, damage: 14, points: 15 },
    boss: { health: 220, speed: 1.2, damage: 18, points: 25 }
  }[size];

  if (size === 'boss') {
    enemy.scale.setScalar(1.4);
    const waveBoost = Math.max(currentWave - 1, 0);
    stats.health = Math.round(stats.health + waveBoost * 80);
    stats.damage = Math.round(stats.damage + waveBoost * 3);
    stats.speed = Math.max(0.9, stats.speed - waveBoost * 0.05);
    stats.points = Math.round(stats.points + waveBoost * 10);
  }

  enemies.push({
    mesh: enemy,
    health: stats.health,
    maxHealth: stats.health,
    speed: stats.speed,
    damage: stats.damage,
    points: stats.points,
    attackCooldown: 0,
    dodgeTimer: 0,
    dodgeDir: new THREE.Vector3(0, 0, 0),
    size,
    status: {},
    isBoss: size === 'boss',
    defeated: false
  });
  waveSpawned += 1;
  if (!enemy.isBoss) {
    waveNonBossSpawned += 1;
  }
}

// Spawn a full wave batch at the current gate position.
function spawnWaveBatch(waveNumber, spawnAt = getGateSpawnPosition()) {
  const smallCount = 2 + waveNumber;
  const mediumCount = 1 + Math.floor(waveNumber / 2);
  const largeCount = Math.floor(waveNumber / 3);

  const spawnPoint = spawnAt || getGateSpawnPosition();
  for (let i = 0; i < smallCount; i++) spawnEnemy('small', spawnPoint.clone());
  for (let i = 0; i < mediumCount; i++) spawnEnemy('medium', spawnPoint.clone());
  for (let i = 0; i < largeCount; i++) spawnEnemy('large', spawnPoint.clone());
}

// Clear and spawn a wave with a boss finisher.
function startWave(waveNumber) {
  waveStartQueued = false;
  waveComplete = false;
  gameRunning = true;
  waveStartGrace = 1.2;
  waveElapsed = 0;
  waveSpawned = 0;
  waveDefeated = 0;
  waveNonBossSpawned = 0;
  waveNonBossDefeated = 0;
  bossSpawned = false;
  enemies.forEach((enemy) => scene.remove(enemy.mesh));
  enemies.length = 0;
  bombs.forEach((bomb) => scene.remove(bomb.mesh));
  bombs.length = 0;
  projectiles.forEach((proj) => scene.remove(proj.mesh));
  projectiles.length = 0;
  playerState.spears.forEach((spear) => scene.remove(spear.mesh));
  playerState.spears = [];
  playerState.spearAmmo = 3;
  playerState.bombAmmo = WEAPONS.bombs.maxActive;
  if (rogue) {
    scene.remove(rogue.mesh);
    rogue = null;
  }
  currentWave = waveNumber;
  pendingWave = waveNumber;
  if (UI.gameOver) UI.gameOver.style.display = 'none';
  if (playerState.isDead) resetPlayer();
  setArenaForWave(waveNumber);
  player.position.copy(arenaLayout.playerSpawn);

  spawnWaveBatch(waveNumber);
  if (enemies.length === 0) {
    spawnEnemy('small', getGateSpawnPosition());
  }
  bossPending = true;
  attackRequested = false;
  setActiveSlot('primary');
  nextWaveCountdown = 0;
  spawnPowerup();
  spawnPowerup();
  trySpawnRogue();
  updateHud();
  if (UI.enemyStatus) UI.enemyStatus.textContent = 'Active';
  if (UI.enemyHealth) UI.enemyHealth.style.width = '100%';
  showMessage(`Wave ${currentWave} starting...`, 2000);
  setTimeout(() => showMessage('Enemies entering...', 1800), 1400);
}

// Enemy AI + status effects.
function updateEnemies(dt) {
  if (waveComplete) return;
  if (!gameRunning) return;
  const hasProjectiles = projectiles.length > 0;
  enemies.forEach((enemy) => {
    if (enemy.health <= 0 || enemy.defeated) return;

    if (enemy.status.freeze > 0) {
      enemy.status.freeze -= dt;
      return;
    }

    const target = getEnemyTargetPosition(enemy).clone();
    const dir = target.sub(enemy.mesh.position);
    const distance = dir.length();
    dir.normalize();
    enemy.mesh.rotation.y = Math.atan2(dir.x, dir.z);

    const slow = enemy.status.slow > 0 ? 0.4 : 1;
    if (enemy.status.slow > 0) enemy.status.slow -= dt;

    let moveDir = dir.clone();
    if (enemy.dodgeTimer > 0) {
      enemy.dodgeTimer -= dt;
      moveDir = enemy.dodgeDir.clone();
    } else if (hasProjectiles) {
      for (let i = 0; i < projectiles.length; i++) {
        const proj = projectiles[i];
        if (proj.mesh.position.distanceTo(enemy.mesh.position) < 4) {
          // Randomize dodge direction so it feels less robotic.
          const side = Math.random() < 0.5 ? -1 : 1;
          enemy.dodgeDir = new THREE.Vector3(-dir.z, 0, dir.x)
            .multiplyScalar(side)
            .add(dir.clone().multiplyScalar(0.2))
            .normalize();
          enemy.dodgeTimer = 0.35;
          moveDir = enemy.dodgeDir.clone();
          break;
        }
      }
    }

    if (distance > 2.2) {
      enemy.mesh.position.add(moveDir.multiplyScalar(enemy.speed * slow * dt));
    } else {
      if (enemy.attackCooldown <= 0) {
        dealDamageToTarget(enemy.damage, getEnemyTargetType(enemy));
        enemy.attackCooldown = 1.2;
      }
    }

    if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

    if (enemy.status.burn > 0) {
      enemy.status.burn -= dt;
      enemy.health -= 4 * dt;
      if (enemy.health <= 0) handleEnemyDefeat(enemy);
    }
  });

  // Separate enemies so they don't stack into each other.
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];
      if (a.health <= 0 || b.health <= 0 || a.defeated || b.defeated) continue;
      const delta = new THREE.Vector3().subVectors(a.mesh.position, b.mesh.position);
      const dist = delta.length();
      const minDist = 1.6;
      if (dist > 0 && dist < minDist) {
        const push = delta.normalize().multiplyScalar((minDist - dist) * 0.5);
        a.mesh.position.add(push);
        b.mesh.position.sub(push);
        clampToArena(a.mesh.position);
        clampToArena(b.mesh.position);
      }
    }
  }

  const aliveEnemies = enemies.filter((enemy) => enemy.health > 0 && !enemy.defeated);
  const nonBossAlive = aliveEnemies.some((enemy) => !enemy.isBoss);
  const bossAlive = aliveEnemies.some((enemy) => enemy.isBoss);

  updateRogue(dt);

  const boss = enemies.find((enemy) => enemy.isBoss && enemy.health > 0 && !enemy.defeated);
  if (boss && UI.enemyHealth) {
    const pct = Math.max(0, (boss.health / boss.maxHealth) * 100);
    UI.enemyHealth.style.width = `${pct}%`;
  }
  if (!boss && UI.enemyStatus) {
    UI.enemyStatus.textContent = 'Destroyed';
  }

  if (
    !waveComplete
    && bossSpawned
    && !bossAlive
    && waveStartGrace <= 0
    && waveElapsed > 1.5
    && waveSpawned > 0
  ) {
    handleWaveComplete();
  }
}

// Player damage with shield mitigation.
function dealPlayerDamage(amount) {
  const { weapon, config } = getWeaponConfig();
  const block = weapon.type === 'defense' ? config.block : 0;
  const shieldBonus = weapon.type === 'defense' && lastInputState.shield ? 0.2 : 0;
  const finalDamage = amount * (1 - block - shieldBonus) * playerState.defenseMultiplier;
  playerState.health -= finalDamage;
  if (playerState.health <= 0 && !playerState.isDead) {
    handlePlayerDeath();
  }
  updateHud();
}

function dealDamageToTarget(amount, targetType) {
  if (targetType === 'rogue' && rogue) {
    rogue.health -= amount;
    if (rogue.health <= 0) {
      handleRogueDefeat();
    }
    return;
  }
  dealPlayerDamage(amount);
}

function handlePlayerDeath() {
  playerState.isDead = true;
  gameRunning = false;
  clearActivePowerups();
  player.rotation.x = Math.PI / 2;
  showMessage('You were destroyed!', 2500);
  if (UI.gameOver) UI.gameOver.style.display = 'flex';
}

function resetPlayer() {
  playerState.health = 100;
  playerState.isDead = false;
  playerState.attackCooldown = 0;
  playerState.isAttacking = false;
  playerState.swingTimer = 0;
  clearActivePowerups();
  player.rotation.x = 0;
  player.position.copy(arenaLayout.playerSpawn);
  updateHud();
}

// Attack handler dispatches by weapon type.
function performAttack() {
  const { weapon, config } = getWeaponConfig();
  playerState.isAttacking = true;
  playerState.swingTimer = 0.2;
  playerState.attackCooldown = config.cooldown;

  if (playerState.homingTimer > 0 && weapon.type === 'melee') {
    spawnArrow({ ...config, projectileSpeed: 14 }, { homing: true });
  }

  if (weapon.type === 'ranged') {
    spawnArrow(config, { homing: playerState.homingTimer > 0 });
    return;
  }

  if (weapon.type === 'bomb') {
    // Allow quick bomb placement up to the max active limit.
    playerState.attackCooldown = 0.4;
    if (playerState.homingTimer > 0) {
      const bombConfig = { ...config, projectileSpeed: 14 };
      spawnArrow(bombConfig, { homing: true, bombTip: true });
    } else {
      placeBomb(config);
    }
    return;
  }

  if (weapon.type === 'spear') {
    if (config.throwSpeed && config.throwSpeed > 0 && getNearestEnemyDistance() > config.range) {
      throwSpear(config);
      return;
    }
  }

  const hitTargets = enemies.filter((enemy) => enemy.health > 0 && enemy.mesh.position.distanceTo(player.position) < config.range);
  hitTargets.forEach((enemy) => {
    applyWeaponDamage(enemy, config);
    if (config.push) {
      const pushDir = new THREE.Vector3().subVectors(enemy.mesh.position, player.position).normalize();
      enemy.mesh.position.add(pushDir.multiplyScalar(config.push));
    }
  });
  if (rogue && rogue.health > 0 && rogue.mesh.position.distanceTo(player.position) < config.range) {
    applyWeaponDamageToRogue(config);
  }
  if (isInLobbyArea() && lobby.dummy && lobby.dummy.position.distanceTo(player.position) < config.range) {
    flashMesh(lobby.dummy, lobby.dummy.userData?.visorMaterial);
  }
}

// Apply damage + status effects to a target.
function applyWeaponDamage(enemy, config) {
  const scaledDamage = config.damage * playerState.damageMultiplier;
  if (playerState.tornadoTimer > 0) {
    enemy.health = 0;
  } else {
    enemy.health -= scaledDamage;
  }
  if (playerState.frostTimer > 0) enemy.status.freeze = 5;
  if (playerState.flameTimer > 0) enemy.status.burn = 5;
  if (playerState.oilTimer > 0) enemy.status.slow = 4;
  if (config.burn) enemy.status.burn = config.burn;
  if (config.disarm) enemy.status.slow = config.disarm;
  if (config.shock) chainShock(enemy, config.shock);
  if (config.splash) splashDamage(enemy, config.splash, scaledDamage * 0.5);

  flashEnemy(enemy);

  if (enemy.health <= 0) handleEnemyDefeat(enemy);
}

function applyWeaponDamageToRogue(config) {
  if (!rogue || rogue.health <= 0) return;
  const scaledDamage = config.damage * playerState.damageMultiplier;
  if (playerState.tornadoTimer > 0) {
    rogue.health = 0;
  } else {
    rogue.health -= scaledDamage;
  }
  if (rogue.health <= 0) handleRogueDefeat();
}

// Electric bow splash effect.
function chainShock(primary, radius) {
  enemies.forEach((enemy) => {
    if (enemy !== primary && enemy.health > 0) {
      const dist = enemy.mesh.position.distanceTo(primary.mesh.position);
      if (dist <= radius) {
        enemy.health -= 8;
        flashEnemy(enemy);
        if (enemy.health <= 0) handleEnemyDefeat(enemy);
      }
    }
  });
}

// Hammer splash effect.
function splashDamage(primary, radius, damage) {
  enemies.forEach((enemy) => {
    if (enemy.health > 0) {
      const dist = enemy.mesh.position.distanceTo(primary.mesh.position);
      if (dist <= radius) {
        enemy.health -= damage;
        flashEnemy(enemy);
        if (enemy.health <= 0) handleEnemyDefeat(enemy);
      }
    }
  });
}

// Visual feedback for enemy hits.
function flashEnemy(enemy) {
  flashMesh(enemy.mesh, enemy.mesh.userData?.visorMaterial);
}

function flashMesh(mesh, skipMaterial = null) {
  mesh.traverse((part) => {
    if (part.material && part.material.color) {
      if (skipMaterial && part.material === skipMaterial) return;
      const oldColor = part.material.color.getHex();
      part.material.color.setHex(0xffffff);
      setTimeout(() => part.material.color.setHex(oldColor), 100);
    }
  });
}

function trySpawnBoss() {
  if (bossSpawned) return;
  if (waveNonBossSpawned === 0) return;
  if (waveNonBossDefeated < waveNonBossSpawned) return;
  spawnEnemy('boss', getGateSpawnPosition());
  bossPending = false;
  bossSpawned = true;
  showMessage('Boss entering!', 2000);
}

// Enemy defeat logic (points + fall over).
function handleEnemyDefeat(enemy) {
  if (enemy.health > 0) return;
  if (enemy.defeated) return;
  enemy.defeated = true;
  playerState.points += enemy.points;
  updateHud();
  waveDefeated += 1;
  if (!enemy.isBoss) {
    waveNonBossDefeated += 1;
    trySpawnBoss();
  }
  enemy.mesh.rotation.x = -Math.PI / 2;
  enemy.mesh.position.y = 0.5;
  setTimeout(() => {
    scene.remove(enemy.mesh);
    const index = enemies.indexOf(enemy);
    if (index !== -1) {
      enemies.splice(index, 1);
    }
  }, 600);
}

function trySpawnRogue() {
  if (!rogueEnabled) return;
  if (Math.random() > ROGUE_SPAWN_CHANCE) return;
  const mesh = createRobot(0xffcc00);
  mesh.position.copy(getRandomArenaPosition(0));
  mesh.lookAt(0, 0, 0);
  scene.add(mesh);
  rogue = {
    mesh,
    health: 160,
    speed: 2.4,
    damage: 10,
    attackCooldown: 0,
    spin: 0
  };
  showMessage('Rogue bot entered!', 2000);
}

function updateRogue(dt) {
  if (!rogue || rogue.health <= 0) return;
  rogue.spin += dt * 8;
  rogue.mesh.rotation.y = rogue.spin;
  const target = getRogueTargetPosition().clone();
  const dir = target.sub(rogue.mesh.position);
  const distance = dir.length();
  dir.normalize();
  if (distance > 2.4) {
    rogue.mesh.position.add(dir.multiplyScalar(rogue.speed * dt));
    clampToArena(rogue.mesh.position);
  } else if (rogue.attackCooldown <= 0) {
    // Rogue hits anything in range (enemies and player).
    const hitRadius = 2.4;
    let hitSomething = false;
    enemies.forEach((enemy) => {
      if (enemy.health > 0 && enemy.mesh.position.distanceTo(rogue.mesh.position) <= hitRadius) {
        enemy.health -= rogue.damage;
        hitSomething = true;
        if (enemy.health <= 0) handleEnemyDefeat(enemy);
      }
    });
    if (player.position.distanceTo(rogue.mesh.position) <= hitRadius) {
      dealPlayerDamage(rogue.damage);
      hitSomething = true;
    }
    if (hitSomething) {
      rogue.attackCooldown = 0.9;
    }
  }
  if (rogue.attackCooldown > 0) rogue.attackCooldown -= dt;
}

function handleRogueDefeat() {
  if (!rogue) return;
  scene.remove(rogue.mesh);
  rogue = null;
  showMessage('Rogue defeated!', 1600);
}

function getEnemyTargetPosition(enemy) {
  if (rogue && rogue.health > 0) {
    const rogueDist = enemy.mesh.position.distanceTo(rogue.mesh.position);
    const playerDist = enemy.mesh.position.distanceTo(player.position);
    if (rogueDist < playerDist) return rogue.mesh.position;
  }
  return player.position;
}

function getEnemyTargetType(enemy) {
  if (rogue && rogue.health > 0) {
    const rogueDist = enemy.mesh.position.distanceTo(rogue.mesh.position);
    const playerDist = enemy.mesh.position.distanceTo(player.position);
    if (rogueDist < playerDist) return 'rogue';
  }
  return 'player';
}

function getRogueTargetPosition() {
  if (!rogue) return player.position;
  const nearestEnemy = findNearestEnemy(rogue.mesh.position);
  if (nearestEnemy) return nearestEnemy.mesh.position;
  return player.position;
}

// End-of-wave flow.
function handleWaveComplete() {
  waveComplete = true;
  pendingWave = currentWave + 1;
  waveStartQueued = false;
  gameRunning = true;
  playerState.health = 100;
  updateHud();
  if (UI.enemyHealth) UI.enemyHealth.style.width = '100%';
  showMessage(`Wave ${currentWave} complete!`, 2200);
}

function handleLobbyInteractions() {
  if (!waveComplete) return;
  const distToUpgrade = lobby.upgradePad ? player.position.distanceTo(lobby.upgradePad.position) : Infinity;
  const distToSwitch = lobby.switchPad ? player.position.distanceTo(lobby.switchPad.position) : Infinity;
  const distToReturn = lobby.returnPortal ? player.position.distanceTo(lobby.returnPortal.position) : Infinity;

  if (distToUpgrade < 2.5) {
    showMessage('Press F to upgrade active weapon', 1200);
    if (interactRequested) {
      tryUpgradeActiveWeapon();
    }
  } else if (distToSwitch < 2.5) {
    showMessage('Press F to switch weapons', 1200);
    if (interactRequested) {
      if (UI.menu) UI.menu.style.display = 'flex';
      armoryStep = 'primary';
      updateArmoryStepUI();
      renderWeaponTabs();
      renderWeaponDetail();
    }
  } else if (distToReturn < 2.5) {
    showMessage('Press F to return to arena', 1200);
    if (interactRequested) {
      player.position.copy(arenaLayout.playerSpawn);
      nextWaveCountdown = 3;
      waveStartQueued = true;
      showMessage('Returning to arena...', 1200);
    }
  }
}

function tryUpgradeActiveWeapon() {
  const weaponId = getActiveWeaponId();
  const weapon = WEAPONS[weaponId];
  if (!weapon) return;
  const currentLevel = playerState.weaponLevels[weaponId] || 1;
  const nextLevel = Math.min(currentLevel + 1, weapon.levels.length);
  if (nextLevel === currentLevel) {
    showMessage('Weapon already maxed', 1200);
    return;
  }
  const cost = weapon.upgradeCosts[nextLevel - 1] || 0;
  if (playerState.points < cost) {
    showMessage('Not enough points', 1200);
    return;
  }
  playerState.points -= cost;
  playerState.weaponLevels[weaponId] = nextLevel;
  updateHud();
  renderWeaponDetail();
  showMessage(`${weapon.name} upgraded to Lv ${nextLevel}`, 1400);
}

function showMessage(text, duration = 2000) {
  if (!UI.messageBanner) return;
  UI.messageBanner.textContent = text;
  UI.messageBanner.style.display = 'block';
  clearTimeout(showMessage._timer);
  showMessage._timer = setTimeout(() => {
    if (UI.messageBanner) UI.messageBanner.style.display = 'none';
  }, duration);
}

// Bow projectile spawn (fires in last movement direction).
function spawnArrow(config, options = {}) {
  const arrow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xffcc88 })
  );
  arrow.position.copy(player.position).add(new THREE.Vector3(0, 1.4, 0));
  if (options.bombTip) {
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.18), new THREE.MeshStandardMaterial({ color: 0xffaa00 }));
    tip.position.y = 0.9;
    arrow.add(tip);
  }
  scene.add(arrow);

  const shotDir = playerState.lastMoveDir.clone().normalize();
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), shotDir);

  const projectileSpeed = config.projectileSpeed || 16;
  projectiles.push({
    mesh: arrow,
    velocity: shotDir.multiplyScalar(projectileSpeed),
    config,
    type: 'arrow',
    homing: options.homing || false,
    speed: projectileSpeed
  });
}

// Move projectiles and resolve hits.
function updateProjectiles(dt) {
  projectiles.forEach((proj, index) => {
    if (proj.homing) {
      const target = findNearestEnemy(proj.mesh.position);
      if (target) {
        const desired = new THREE.Vector3().subVectors(target.mesh.position, proj.mesh.position).normalize();
        const speed = proj.speed || proj.velocity.length() || 16;
        proj.velocity.lerp(desired.multiplyScalar(speed), 0.2);
        proj.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), proj.velocity.clone().normalize());
      }
    }
    proj.mesh.position.add(proj.velocity.clone().multiplyScalar(dt));
    if (Math.abs(proj.mesh.position.x) > arenaState.size / 2 || Math.abs(proj.mesh.position.z) > arenaState.size / 2) {
      scene.remove(proj.mesh);
      projectiles.splice(index, 1);
      return;
    }
    const hitEnemy = enemies.find((enemy) => {
      if (enemy.health <= 0) return false;
      const dx = enemy.mesh.position.x - proj.mesh.position.x;
      const dz = enemy.mesh.position.z - proj.mesh.position.z;
      return Math.hypot(dx, dz) < 1.6;
    });
    if (hitEnemy) {
      applyWeaponDamage(hitEnemy, proj.config);
      scene.remove(proj.mesh);
      projectiles.splice(index, 1);
      return;
    }
    if (isInLobbyArea() && lobby.dummy && lobby.dummy.position.distanceTo(proj.mesh.position) < 1.6) {
      flashMesh(lobby.dummy, lobby.dummy.userData?.visorMaterial);
      scene.remove(proj.mesh);
      projectiles.splice(index, 1);
      return;
    }
    if (rogue && rogue.health > 0) {
      const dx = rogue.mesh.position.x - proj.mesh.position.x;
      const dz = rogue.mesh.position.z - proj.mesh.position.z;
      if (Math.hypot(dx, dz) < 1.6) {
        applyWeaponDamageToRogue(proj.config);
        scene.remove(proj.mesh);
        projectiles.splice(index, 1);
      }
    }
  });
}

// Place bomb with detonation timer.
function placeBomb(config) {
  if (bombs.length >= WEAPONS.bombs.maxActive || playerState.bombAmmo <= 0) return;
  const bomb = new THREE.Mesh(
    new THREE.SphereGeometry(0.4),
    new THREE.MeshStandardMaterial({ color: 0xffaa00 })
  );
  bomb.position.copy(player.position).add(new THREE.Vector3(0, 0.4, 0));
  scene.add(bomb);
  bombs.push({ mesh: bomb, timer: 1.6, config });
  playerState.bombAmmo -= 1;
}

// Countdown and explode bombs.
function updateBombs(dt) {
  bombs.forEach((bomb, index) => {
    bomb.timer -= dt;
    if (bomb.timer <= 0) {
      explodeBomb(bomb);
      scene.remove(bomb.mesh);
      bombs.splice(index, 1);
      playerState.bombAmmo = Math.min(WEAPONS.bombs.maxActive, playerState.bombAmmo + 1);
    }
  });
}

// Bomb explosion splash.
function explodeBomb(bomb) {
  const origin = { mesh: bomb.mesh };
  splashDamage(origin, bomb.config.radius, bomb.config.damage);

  // Apply powerup effects on hit within explosion radius.
  enemies.forEach((enemy) => {
    if (enemy.health <= 0) return;
    const dist = enemy.mesh.position.distanceTo(bomb.mesh.position);
    if (dist > bomb.config.radius) return;
    if (playerState.tornadoTimer > 0) {
      enemy.health = 0;
      handleEnemyDefeat(enemy);
      return;
    }
    if (playerState.frostTimer > 0) enemy.status.freeze = 5;
    if (playerState.flameTimer > 0) enemy.status.burn = 5;
    if (playerState.oilTimer > 0) enemy.status.slow = 4;
  });
  if (rogue && rogue.health > 0) {
    const dist = rogue.mesh.position.distanceTo(bomb.mesh.position);
    if (dist <= bomb.config.radius) {
      applyWeaponDamageToRogue(bomb.config);
    }
  }
  if (isInLobbyArea() && lobby.dummy) {
    const dist = lobby.dummy.position.distanceTo(bomb.mesh.position);
    if (dist <= bomb.config.radius) {
      flashMesh(lobby.dummy, lobby.dummy.userData?.visorMaterial);
    }
  }
}

// Spear throw handling (must be recovered).
function throwSpear(config) {
  if (playerState.spearAmmo <= 0) return;
  const spear = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xffddaa })
  );
  spear.position.copy(player.position).add(new THREE.Vector3(0, 1.2, 0));
  scene.add(spear);

  const throwDir = playerState.lastMoveDir.clone().normalize();
  spear.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), throwDir);
  const velocity = throwDir.multiplyScalar(config.throwSpeed);
  playerState.spears.push({ mesh: spear, velocity, config, stuck: false, homing: playerState.homingTimer > 0, speed: config.throwSpeed });
  playerState.spearAmmo -= 1;
}

// Update spear flight and pickup.
function updateSpear(dt) {
  if (playerState.spears.length === 0) return;
  playerState.spears = playerState.spears.filter((spear) => {
    if (!spear.stuck) {
      if (spear.homing) {
        const target = findNearestEnemy(spear.mesh.position);
        if (target) {
        const desired = new THREE.Vector3().subVectors(target.mesh.position, spear.mesh.position).normalize();
        const speed = spear.speed || spear.velocity.length() || spear.config.throwSpeed;
        spear.velocity.lerp(desired.multiplyScalar(speed), 0.15);
          spear.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spear.velocity.clone().normalize());
        }
      }
      spear.mesh.position.add(spear.velocity.clone().multiplyScalar(dt));
      if (Math.abs(spear.mesh.position.x) > arenaState.size / 2 || Math.abs(spear.mesh.position.z) > arenaState.size / 2) {
        clampToArena(spear.mesh.position);
        spear.stuck = true;
      }
    const hitEnemy = enemies.find((enemy) => enemy.health > 0 && enemy.mesh.position.distanceTo(spear.mesh.position) < 1.6);
    if (hitEnemy) {
      applyWeaponDamage(hitEnemy, spear.config);
      spear.stuck = true;
    } else if (rogue && rogue.health > 0 && rogue.mesh.position.distanceTo(spear.mesh.position) < 1.6) {
      applyWeaponDamageToRogue(spear.config);
      spear.stuck = true;
    } else if (isInLobbyArea() && lobby.dummy && lobby.dummy.position.distanceTo(spear.mesh.position) < 1.6) {
      flashMesh(lobby.dummy, lobby.dummy.userData?.visorMaterial);
      spear.stuck = true;
    }
      if (spear.stuck) {
        attachSpearMarker(spear);
      }
      return true;
    }

    if (player.position.distanceTo(spear.mesh.position) < 2) {
      scene.remove(spear.mesh);
      playerState.spearAmmo = Math.min(3, playerState.spearAmmo + 1);
      return false;
    }
    return true;
  });
}

// Nearest enemy distance (for spear logic).
function getNearestEnemyDistance() {
  let closest = Infinity;
  enemies.forEach((enemy) => {
    if (enemy.health > 0) {
      const dist = enemy.mesh.position.distanceTo(player.position);
      if (dist < closest) closest = dist;
    }
  });
  return closest;
}

function findNearestEnemy(position) {
  let closest = null;
  let closestDist = Infinity;
  enemies.forEach((enemy) => {
    if (enemy.health > 0) {
      const dist = enemy.mesh.position.distanceTo(position);
      if (dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }
  });
  return closest;
}

function createPowerupBadge(letter, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 32, 34);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, color: new THREE.Color(color) });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.8, 0.8, 0.8);
  return sprite;
}

function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.6;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

function createTextSprite(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}

function createPlasmaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 128, 128);
    grad.addColorStop(0, '#ff4fd8');
    grad.addColorStop(1, '#3fd1ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(64, 64, 10 + i * 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createLobbyScene() {
  const objects = lobbyObjects;
  objects.length = 0;
  const size = LOBBY_SIZE;
  const half = size / 2;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color: 0x171824 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.copy(lobbyOrigin);
  scene.add(floor);
  objects.push(floor);

  // Starfield extension under the lobby for continuity.
  const lobbyStars = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 2.4, size * 2.4),
    new THREE.MeshBasicMaterial({ map: createStarTexture(), side: THREE.DoubleSide })
  );
  lobbyStars.rotation.x = -Math.PI / 2;
  lobbyStars.position.copy(lobbyOrigin).add(new THREE.Vector3(0, -0.25, 0));
  scene.add(lobbyStars);
  objects.push(lobbyStars);

  // Low boundary walls to keep the player in the lobby.
  const wallHeight = 1.2;
  const wallThickness = 0.4;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x202132 });
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(size, wallHeight, wallThickness), wallMat);
  northWall.position.copy(lobbyOrigin).add(new THREE.Vector3(0, wallHeight / 2, -half));
  scene.add(northWall);
  objects.push(northWall);
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(size, wallHeight, wallThickness), wallMat);
  southWall.position.copy(lobbyOrigin).add(new THREE.Vector3(0, wallHeight / 2, half));
  scene.add(southWall);
  objects.push(southWall);
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, size), wallMat);
  westWall.position.copy(lobbyOrigin).add(new THREE.Vector3(-half, wallHeight / 2, 0));
  scene.add(westWall);
  objects.push(westWall);
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, size), wallMat);
  eastWall.position.copy(lobbyOrigin).add(new THREE.Vector3(half, wallHeight / 2, 0));
  scene.add(eastWall);
  objects.push(eastWall);

  // Neon trim on the lobby perimeter (pink + cyan).
  const trimMatPink = new THREE.MeshStandardMaterial({ color: 0xff4fd8, emissive: 0xff4fd8, emissiveIntensity: 0.9 });
  const trimMatBlue = new THREE.MeshStandardMaterial({ color: 0x3fd1ff, emissive: 0x3fd1ff, emissiveIntensity: 0.9 });
  const trimHeight = 0.15;
  const trimInset = 0.35;
  const trimNorth = new THREE.Mesh(new THREE.BoxGeometry(size - 0.6, trimHeight, 0.2), trimMatPink);
  trimNorth.position.copy(lobbyOrigin).add(new THREE.Vector3(0, wallHeight + 0.05, -half + trimInset));
  scene.add(trimNorth);
  objects.push(trimNorth);
  const trimSouth = new THREE.Mesh(new THREE.BoxGeometry(size - 0.6, trimHeight, 0.2), trimMatBlue);
  trimSouth.position.copy(lobbyOrigin).add(new THREE.Vector3(0, wallHeight + 0.05, half - trimInset));
  scene.add(trimSouth);
  objects.push(trimSouth);
  const trimWest = new THREE.Mesh(new THREE.BoxGeometry(0.2, trimHeight, size - 0.6), trimMatBlue);
  trimWest.position.copy(lobbyOrigin).add(new THREE.Vector3(-half + trimInset, wallHeight + 0.05, 0));
  scene.add(trimWest);
  objects.push(trimWest);
  const trimEast = new THREE.Mesh(new THREE.BoxGeometry(0.2, trimHeight, size - 0.6), trimMatPink);
  trimEast.position.copy(lobbyOrigin).add(new THREE.Vector3(half - trimInset, wallHeight + 0.05, 0));
  scene.add(trimEast);
  objects.push(trimEast);

  // Upgrade table on the west boundary.
  const upgradeTable = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x222244 })
  );
  upgradeTable.position.copy(lobbyOrigin).add(new THREE.Vector3(-half + 4.2, 0.6, -4));
  scene.add(upgradeTable);
  objects.push(upgradeTable);

  const foods = [
    { geo: new THREE.TorusGeometry(0.3, 0.12, 10, 18), color: 0x888888 },
    { geo: new THREE.SphereGeometry(0.25), color: 0x4455aa },
    { geo: new THREE.TorusGeometry(0.25, 0.08, 10, 18), color: 0x999999 },
    { geo: new THREE.BoxGeometry(0.4, 0.2, 0.2), color: 0xccaa55 }
  ];
  foods.forEach((item, i) => {
    const mesh = new THREE.Mesh(item.geo, new THREE.MeshStandardMaterial({ color: item.color }));
    mesh.position.copy(upgradeTable.position).add(new THREE.Vector3(0, 0.9, -3 + i * 2));
    scene.add(mesh);
    objects.push(mesh);
  });

  // Upgrade activation pad (in front of the table).
  const upgradePad = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.2, 20),
    new THREE.MeshStandardMaterial({ color: 0x33ffcc, emissive: 0x33ffcc, emissiveIntensity: 0.6 })
  );
  upgradePad.position.copy(upgradeTable.position).add(new THREE.Vector3(3.2, -0.5, 0));
  scene.add(upgradePad);
  objects.push(upgradePad);

  // Switch weapons pad (left/right of upgrade pad).
  const switchPad = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.2, 20),
    new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xffaa33, emissiveIntensity: 0.6 })
  );
  switchPad.position.copy(upgradePad.position).add(new THREE.Vector3(0, 0, 4.2));
  scene.add(switchPad);
  objects.push(switchPad);

  const upgradeLabel = createTextSprite('Upgrade Here', '#33ffcc');
  upgradeLabel.position.copy(upgradeTable.position).add(new THREE.Vector3(-2.4, 2.2, 0));
  scene.add(upgradeLabel);
  objects.push(upgradeLabel);

  // Training dummy.
  const dummy = createRobot(0x666666);
  dummy.position.copy(lobbyOrigin).add(new THREE.Vector3(0, 0, 6));
  scene.add(dummy);
  objects.push(dummy);

  // Fish tank.
  const tank = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0x2255aa, transparent: true, opacity: 0.4 })
  );
  tank.position.copy(upgradeTable.position).add(new THREE.Vector3(3.2, 1, -6));
  scene.add(tank);
  objects.push(tank);

  // Neon light bars.
  for (let i = 0; i < 3; i++) {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1.5, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 1 })
    );
    light.position.copy(upgradeTable.position).add(new THREE.Vector3(-1.4, 1, -6 + i * 6));
    scene.add(light);
    objects.push(light);
  }

  // Return portal to arena.
  const returnPortal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.2, 24),
    new THREE.MeshStandardMaterial({ color: 0x3fd1ff, emissive: 0x3fd1ff, emissiveIntensity: 0.7 })
  );
  returnPortal.position.copy(lobbyOrigin).add(new THREE.Vector3(6, 0.1, 10));
  scene.add(returnPortal);
  objects.push(returnPortal);
  const returnLabel = createTextSprite('Return to Arena', '#7fd1ff');
  returnLabel.position.copy(returnPortal.position).add(new THREE.Vector3(0, 2.2, 0));
  scene.add(returnLabel);
  objects.push(returnLabel);

  return {
    spawnOffset: new THREE.Vector3(10, 0, 10),
    upgradePad,
    switchPad,
    returnPortal,
    dummy
  };
}

function createLobbyCorridor() {
  const width = 12;
  const length = 50;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshStandardMaterial({ color: 0x1b1b2b })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, arenaState.size / 2 + length / 2);
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x222233 });
  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, length), wallMat);
  wallLeft.position.set(-width / 2, 1.5, floor.position.z);
  const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, length), wallMat);
  wallRight.position.set(width / 2, 1.5, floor.position.z);
  scene.add(wallLeft);
  scene.add(wallRight);

  return { floor, wallLeft, wallRight, width, length };
}

function attachSpearMarker(spear) {
  if (spear.marker) return;
  const marker = new THREE.Sprite(
    new THREE.SpriteMaterial({ color: 0xffee88, opacity: 0.9 })
  );
  marker.scale.set(0.6, 0.6, 0.6);
  marker.position.set(0, 1.6, 0);
  spear.mesh.add(marker);
  spear.marker = marker;
  if (spear.mesh.material) {
    spear.mesh.material.emissive = new THREE.Color(0xffaa55);
    spear.mesh.material.emissiveIntensity = 0.6;
  }
}

// Spawn a random powerup with expiry timer.
function spawnPowerup() {
  if (powerups.length >= 5) return;
  const def = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color })
  );
  if (def.letter) {
    const badge = createPowerupBadge(def.letter, def.color);
    badge.position.set(0, 0.9, 0);
    mesh.add(badge);
  }
  mesh.position.copy(getPowerupSpawnPosition());
  scene.add(mesh);
  powerups.push({ mesh, def, timer: 15 });
}

// Rotate, expire, and collect powerups.
function updatePowerups(dt) {
  if (waveComplete) return;
  powerups.forEach((powerup, index) => {
    powerup.timer -= dt;
    powerup.mesh.rotation.y += dt * 2;
    if (powerup.timer <= 0) {
      scene.remove(powerup.mesh);
      powerups.splice(index, 1);
    }
    if (player.position.distanceTo(powerup.mesh.position) < 1.6) {
      applyPowerup(powerup.def);
      scene.remove(powerup.mesh);
      powerups.splice(index, 1);
      powerupSpawnTimer = 4;
    }
  });
}

// Apply powerup effects (Phase 1 rules).
function applyPowerup(powerup) {
  setActivePowerup(powerup.label, powerup.duration);
  if (powerup.id === 'frost') {
    playerState.frostTimer = powerup.duration;
  }
  if (powerup.id === 'flame') {
    playerState.flameTimer = powerup.duration;
  }
  if (powerup.id === 'tornado') {
    playerState.tornadoTimer = powerup.duration;
  }
  if (powerup.id === 'oil') {
    playerState.oilTimer = powerup.duration;
  }
  if (powerup.id === 'missiles') {
    playerState.homingTimer = powerup.duration;
  }
  if (powerup.id === 'size') {
    if (playerState.sizeMode === 'normal') {
      playerState.sizeMode = Math.random() > 0.5 ? 'grow' : 'shrink';
    }
    if (playerState.sizeMode === 'grow') {
      player.scale.setScalar(1.35);
      playerState.damageMultiplier = 1.35;
      playerState.defenseMultiplier = 0.85;
      playerState.speedMultiplier = 0.85;
    } else {
      player.scale.setScalar(0.75);
      playerState.damageMultiplier = 0.75;
      playerState.defenseMultiplier = 1.15;
      playerState.speedMultiplier = 1.25;
    }
    playerState.sizeTimer = powerup.duration;
  }
  if (powerup.id === 'fart') {
    player.rotation.x = Math.PI / 2;
    setTimeout(() => (player.rotation.x = 0), powerup.duration * 1000);
    playerState.stunTimer = powerup.duration;
  }
}

function setActivePowerup(label, durationSeconds) {
  if (UI.powerupName) UI.powerupName.textContent = label;
  if (UI.powerupMessage) UI.powerupMessage.textContent = `Picked up ${label}`;
  if (UI.powerupTimer) UI.powerupTimer.textContent = String(Math.ceil(durationSeconds));
  if (durationSeconds > 0) {
    setActivePowerup._remaining = durationSeconds;
    setActivePowerup._label = label;
    setTimeout(() => {
      if (UI.powerupName && UI.powerupName.textContent === label) {
        UI.powerupName.textContent = 'None';
      }
      if (UI.powerupMessage && UI.powerupMessage.textContent.includes(label)) {
        UI.powerupMessage.textContent = `${label} expired`;
      }
    }, durationSeconds * 1000);
  } else {
    setTimeout(() => {
      if (UI.powerupName && UI.powerupName.textContent === label) {
        UI.powerupName.textContent = 'None';
      }
      if (UI.powerupMessage && UI.powerupMessage.textContent.includes(label)) {
        UI.powerupMessage.textContent = `${label} expired`;
      }
    }, 2000);
  }
}

function clearActivePowerups() {
  playerState.homingTimer = 0;
  playerState.tornadoTimer = 0;
  playerState.stunTimer = 0;
  playerState.frostTimer = 0;
  playerState.flameTimer = 0;
  playerState.oilTimer = 0;
  playerState.sizeTimer = 0;
  playerState.sizeMode = 'normal';
  playerState.damageMultiplier = 1;
  playerState.defenseMultiplier = 1;
  playerState.speedMultiplier = 1;
  player.scale.setScalar(1);
  setActivePowerup._remaining = 0;
  setActivePowerup._label = '';
  if (UI.powerupName) UI.powerupName.textContent = 'None';
  if (UI.powerupTimer) UI.powerupTimer.textContent = '0';
  if (UI.powerupMessage) UI.powerupMessage.textContent = '—';
}

// Main loop.
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (isPaused) {
    renderer.render(scene, camera);
    return;
  }

  if (!gameRunning) {
    renderer.render(scene, camera);
    return;
  }

  const state = input.getState();
  lastInputState = state;
  const speed = 5 * dt * playerState.speedMultiplier;

  if (playerState.homingTimer > 0) {
    playerState.homingTimer = Math.max(0, playerState.homingTimer - dt);
  }
  if (playerState.tornadoTimer > 0) {
    playerState.tornadoTimer = Math.max(0, playerState.tornadoTimer - dt);
  }
  if (playerState.stunTimer > 0) {
    playerState.stunTimer = Math.max(0, playerState.stunTimer - dt);
  }
  if (playerState.frostTimer > 0) {
    playerState.frostTimer = Math.max(0, playerState.frostTimer - dt);
  }
  if (playerState.flameTimer > 0) {
    playerState.flameTimer = Math.max(0, playerState.flameTimer - dt);
  }
  if (playerState.oilTimer > 0) {
    playerState.oilTimer = Math.max(0, playerState.oilTimer - dt);
  }
  if (playerState.sizeTimer > 0) {
    playerState.sizeTimer = Math.max(0, playerState.sizeTimer - dt);
    if (playerState.sizeTimer === 0) {
      playerState.sizeMode = 'normal';
      player.scale.setScalar(1);
      playerState.damageMultiplier = 1;
      playerState.defenseMultiplier = 1;
      playerState.speedMultiplier = 1;
    }
  }
  if (setActivePowerup._remaining > 0) {
    setActivePowerup._remaining = Math.max(0, setActivePowerup._remaining - dt);
    if (UI.powerupTimer) {
      UI.powerupTimer.textContent = String(Math.ceil(setActivePowerup._remaining));
    }
    if (setActivePowerup._remaining === 0 && UI.powerupName) {
      if (UI.powerupName.textContent === setActivePowerup._label) {
        UI.powerupName.textContent = 'None';
      }
    }
  }
  if (waveStartGrace > 0) {
    waveStartGrace = Math.max(0, waveStartGrace - dt);
  }
  if (!waveComplete) {
    waveElapsed += dt;
  }
  updateDebugHud(dt);
  if (!waveComplete && waveElapsed > 2 && waveSpawned === 0) {
    const fallback = getGateSpawnPosition();
    spawnWaveBatch(currentWave, fallback);
    if (enemies.length === 0) {
      spawnEnemy('small', fallback);
    }
  }

  if (state.x !== 0 || state.y !== 0) {
    const nextPos = player.position.clone();
    nextPos.x += state.x * speed;
    nextPos.z += state.y * speed;
    player.position.copy(resolvePlayerMovement(player.position, nextPos));
    player.rotation.y = Math.atan2(state.x, state.y);
    playerState.lastMoveDir.set(state.x, 0, state.y);
    if (player.userData.torso) {
      player.userData.torso.position.y = 1.5 + Math.sin(clock.elapsedTime * 10) * 0.1;
    }
  } else if (player.userData.torso) {
    player.userData.torso.position.y = 1.5;
  }

  // Attack logic + cooldown.
  if (playerState.attackCooldown > 0) {
    playerState.attackCooldown -= dt;
  }

  const wantsAttack = (state.attack || attackRequested) && playerState.stunTimer <= 0;
  if (wantsAttack && playerState.attackCooldown <= 0) {
    performAttack();
    attackRequested = false;
  } else if (attackRequested && playerState.attackCooldown > 0) {
    attackRequested = false;
  }

  if (playerState.isAttacking && player.userData.rightArm) {
    player.userData.rightArm.rotation.x = -Math.PI / 2;
    playerState.swingTimer -= dt;
    if (playerState.swingTimer <= 0) {
      player.userData.rightArm.rotation.x = 0;
      playerState.isAttacking = false;
    }
  }

  // Arena-only updates.
  updateEnemies(dt);
  updateProjectiles(dt);
  updateBombs(dt);
  updateSpear(dt);
  if (!isInLobbyArea()) {
    updatePowerups(dt);
  }

  // Plasma shield animation + visibility (disable when wave complete).
  plasmaShield.visible = !waveComplete;
  plasmaMaterial.map.rotation += dt * 0.4;
  plasmaMaterial.map.offset.x += dt * 0.05;
  plasmaMaterial.map.offset.y += dt * 0.03;

  if (waveComplete && player.position.distanceTo(southGatePosition) < 2.5) {
    showMessage('Gate open to Armory Lobby', 1200);
  } else if (!waveComplete && player.position.distanceTo(southGatePosition) < 2.5) {
    showMessage('Plasma shield active', 1200);
  }

  nextWavePad.position.set(arenaLayout.startWave.x, 0.08, arenaLayout.startWave.z);
  nextWaveLabel.position.copy(nextWavePad.position).add(new THREE.Vector3(0, 2.2, 0));
  nextWavePad.visible = waveComplete;
  nextWaveLabel.visible = waveComplete;
  const onNextPad = waveComplete && player.position.distanceTo(nextWavePad.position) < 2.2;
  if (onNextPad && !waveStartQueued && nextWaveCountdown === 0) {
    nextWaveCountdown = 3;
    waveStartQueued = true;
  }
  if (!onNextPad && nextWaveCountdown > 0) {
    nextWaveCountdown = 0;
    waveStartQueued = false;
  }

  handleLobbyInteractions();

  if (nextWaveCountdown > 0) {
    nextWaveCountdown = Math.max(0, nextWaveCountdown - dt);
    showMessage(`Next wave in ${Math.ceil(nextWaveCountdown)}...`, 900);
    if (nextWaveCountdown === 0 && waveComplete) {
      startWave(pendingWave);
    }
  }

  // Powerup spawn cadence.
  if (!isInLobbyArea() && !waveComplete) {
    powerupSpawnTimer -= dt;
    if (powerupSpawnTimer <= 0) {
      spawnPowerup();
      powerupSpawnTimer = 6;
    }
  }

  const edgeBoost = Math.max(0, (Math.abs(player.position.z) / (arenaState.size / 2)) - 0.6);
  const inLobby = isInLobbyArea();
  const lobbyBoost = inLobby ? arenaState.size / 3 : 0;
  const zoomOut = 20 + edgeBoost * 12 + (arenaState.size / 4) + lobbyBoost;
  camera.position.x = player.position.x + zoomOut;
  camera.position.z = player.position.z + zoomOut;
  const southEdge = arenaState.size / 2;
  const southT = Math.max(0, (player.position.z - southEdge * 0.4) / (southEdge * 0.6));
  const lookOffset = new THREE.Vector3(0, 0, -southT * (arenaState.size / 6));
  const target = inLobby ? player.position.clone() : player.position.clone().add(lookOffset);
  camera.lookAt(target);

  renderer.render(scene, camera);

  interactRequested = false;
}

// Initialize UI + loop.
seedUpgradeCosts();
createMenu();
updateHud();
animate();

// Resize handler keeps the orthographic camera in sync.
window.addEventListener('resize', () => {
  const nextAspect = window.innerWidth / window.innerHeight;
  camera.left = -d * nextAspect;
  camera.right = d * nextAspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function togglePause() {
  isPaused = !isPaused;
  if (UI.pauseBtn) UI.pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  if (isPaused) {
    showMessage('Paused', 1200);
  }
}
