/**
 * state.js — the single source of truth for game progress.
 *
 * Tracks: current room, collected memories, unlocked rooms, and "depth"
 * (how far into the rabbit hole the player has gone). Everything else
 * (rooms.js, the HUD, the memory modal, the ending sequence) reads from
 * or writes to this module instead of keeping its own copy of progress.
 *
 * Design choice: this is a plain object + functions, not a class. There
 * is only ever one game running at a time in this project, so a
 * singleton is simpler than instantiating something. If that ever
 * changes (e.g. unit tests wanting a fresh state per test), wrap this
 * in a factory function later — the API below wouldn't need to change.
 */

import { getInitiallyUnlockedRoomIds, getGatedRooms } from './rooms.js';
import { getMemoryDepthCosts, getEndingMemoryId } from './memories.js';

// --- Data: memory costs --------------------------------------------------------
// Derived from memories.js instead of duplicated here — that file is the
// single source of truth for memory text, cost, and which one ends the game.

export const MEMORY_DEPTH_COST = getMemoryDepthCosts();

// The memory that ends the game (triggers the mirror/closing sequence).
export const ENDING_MEMORY_ID = getEndingMemoryId();

// Depth thresholds that define the four narrative/visual stages.
// getStage() below returns the index (0-3) matching docs/narrative.md.
const STAGE_THRESHOLDS = [4, 9, 14, Infinity];

// --- State -------------------------------------------------------------------

const state = {
  currentRoom: 'portico',
  depth: 0,
  collectedMemories: new Set(),
  // Seeded from rooms.js instead of hardcoded here — rooms.js is the
  // single source of truth for which rooms start open vs. gated.
  unlockedRooms: new Set(getInitiallyUnlockedRoomIds()),
  hasEnded: false,

  // --- Sistemi di gameplay (vedi docs/gameplay.md) ---
  items: new Set(), // oggetti raccolti (valvola, chiave) — vedi game/items.js
  lucidity: 100, // 0-100: a 0 scatta l'"assenza"
  corruptedMemories: new Set(), // ricordi confusi da un'assenza (rileggerli li ripara)
  chaseActive: false, // true dopo l'ultimo ricordo: inseguimento verso l'osteria
};

// --- Pub/sub -------------------------------------------------------------------
// Minimal event emitter so UI modules (HUD, memory modal, room renderer)
// can react to state changes without polling or importing each other.
// Event names used: 'depth-changed', 'memory-collected', 'room-unlocked',
// 'room-changed', 'ending-triggered', 'reset', 'item-collected',
// 'lucidity-changed', 'memory-corrupted', 'memory-restored',
// 'chase-started', 'absence'.

const listeners = new Map(); // eventName -> Set<callback>

function emit(eventName, payload) {
  const callbacks = listeners.get(eventName);
  if (!callbacks) return;
  for (const cb of callbacks) cb(payload);
}

/** Subscribe to a state event. Returns an unsubscribe function. */
export function on(eventName, callback) {
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(callback);
  return () => listeners.get(eventName).delete(callback);
}

// --- Reads ---------------------------------------------------------------------

export function getDepth() {
  return state.depth;
}

export function getCurrentRoom() {
  return state.currentRoom;
}

export function isMemoryCollected(memoryId) {
  return state.collectedMemories.has(memoryId);
}

export function isRoomUnlocked(roomId) {
  return state.unlockedRooms.has(roomId);
}

export function hasEnded() {
  return state.hasEnded;
}

export function hasItem(itemId) {
  return state.items.has(itemId);
}

export function getItems() {
  return [...state.items];
}

export function getLucidity() {
  return state.lucidity;
}

export function isMemoryCorrupted(memoryId) {
  return state.corruptedMemories.has(memoryId);
}

export function getCorruptedMemoryIds() {
  return [...state.corruptedMemories];
}

export function isChaseActive() {
  return state.chaseActive;
}

/** Returns 0-3, matching the narrative stage table in docs/narrative.md. */
export function getStage() {
  return STAGE_THRESHOLDS.findIndex((max) => state.depth <= max);
}

/** Snapshot for saving, debugging, or passing to save-game storage later. */
export function getSnapshot() {
  return {
    currentRoom: state.currentRoom,
    depth: state.depth,
    collectedMemories: [...state.collectedMemories],
    unlockedRooms: [...state.unlockedRooms],
    hasEnded: state.hasEnded,
    items: [...state.items],
    lucidity: state.lucidity,
    corruptedMemories: [...state.corruptedMemories],
    chaseActive: state.chaseActive,
  };
}

// --- Writes ----------------------------------------------------------------------

/**
 * Call when the player examines a hotspot tied to a memory.
 * Safe to call repeatedly on an already-collected memory — it just won't
 * add depth twice (re-reading a memory shouldn't cost anything).
 */
export function collectMemory(memoryId) {
  if (state.collectedMemories.has(memoryId)) return; // already read, no-op

  const cost = MEMORY_DEPTH_COST[memoryId];
  if (cost === undefined) {
    console.warn(`collectMemory: unknown memory id "${memoryId}"`);
    return;
  }

  state.collectedMemories.add(memoryId);
  state.depth += cost;

  emit('memory-collected', { memoryId, depth: state.depth });
  emit('depth-changed', { depth: state.depth, stage: getStage() });

  checkUnlocks();

  if (memoryId === ENDING_MEMORY_ID && !state.chaseActive && !state.hasEnded) {
    // Il finale non parte più subito: prima c'è l'inseguimento — la fuga
    // dall'argine fino allo specchio dell'osteria. L'ending vero e proprio
    // scatta in moveToRoom() quando il giocatore raggiunge l'osteria.
    state.chaseActive = true;
    emit('chase-started', null);
  }
}

/** Move the player to a room, but only if it's actually unlocked. */
export function moveToRoom(roomId) {
  if (!state.unlockedRooms.has(roomId)) {
    console.warn(`moveToRoom: "${roomId}" is not unlocked yet`);
    return false;
  }
  state.currentRoom = roomId;
  emit('room-changed', { roomId });

  // Fine dell'inseguimento: raggiungere l'osteria (lo specchio) chiude il gioco.
  if (state.chaseActive && roomId === 'osteria' && !state.hasEnded) {
    state.hasEnded = true;
    emit('ending-triggered', null);
  }
  return true;
}

/** Re-evaluates UNLOCK_RULES against current depth/memories, unlocks any
 * room whose conditions are now met. Called automatically after every
 * collectMemory(), but exported in case something else needs to force
 * a re-check (e.g. loading a saved game). */
export function checkUnlocks() {
  for (const room of getGatedRooms()) {
    if (state.unlockedRooms.has(room.id)) continue; // already unlocked

    const { minDepth, requiresMemories } = room.unlock;
    const depthOk = state.depth >= minDepth;
    const memoriesOk = requiresMemories.every((id) =>
      state.collectedMemories.has(id)
    );

    if (depthOk && memoriesOk) {
      state.unlockedRooms.add(room.id);
      emit('room-unlocked', { roomId: room.id });
    }
  }
}

/** Call when the player picks up an item hotspot (kind: itemId in rooms.js). */
export function collectItem(itemId) {
  if (state.items.has(itemId)) return;
  state.items.add(itemId);
  emit('item-collected', { itemId });
}

function setLucidity(value) {
  const clamped = Math.max(0, Math.min(100, value));
  if (clamped === state.lucidity) return;
  state.lucidity = clamped;
  emit('lucidity-changed', { lucidity: clamped });
}

export function drainLucidity(amount) {
  setLucidity(state.lucidity - amount);
}

/** Senza argomento ripristina tutto (la sfoglina); con un numero, rigenera. */
export function restoreLucidity(amount = 100) {
  setLucidity(state.lucidity + amount);
}

/** Un ricordo confuso torna integro (dopo che il giocatore lo rilegge). */
export function restoreMemory(memoryId) {
  if (state.corruptedMemories.delete(memoryId)) {
    emit('memory-restored', { memoryId });
  }
}

/**
 * L'"assenza": il blackout dissociativo che scatta quando l'Altra tocca
 * Michela o la lucidità arriva a zero. Confonde un ricordo raccolto a
 * caso (mai quello finale), riporta il giocatore al portico e lascia la
 * lucidità a metà. Ritorna l'id del ricordo confuso (o null).
 * Il fade a nero e il ricaricamento della stanza sono di main.js.
 */
export function triggerAbsence() {
  const pool = [...state.collectedMemories].filter(
    (id) => id !== ENDING_MEMORY_ID && !state.corruptedMemories.has(id)
  );
  let corruptedId = null;
  if (pool.length > 0) {
    corruptedId = pool[Math.floor(Math.random() * pool.length)];
    state.corruptedMemories.add(corruptedId);
    emit('memory-corrupted', { memoryId: corruptedId });
  }

  state.lucidity = 55;
  emit('lucidity-changed', { lucidity: 55 });

  state.currentRoom = 'portico';
  emit('room-changed', { roomId: 'portico' });

  emit('absence', { memoryId: corruptedId });
  return corruptedId;
}

/** Resets everything to the initial state (for the "Ricomincia" button). */
export function resetGame() {
  state.currentRoom = 'portico';
  state.depth = 0;
  state.collectedMemories.clear();
  state.unlockedRooms = new Set(getInitiallyUnlockedRoomIds());
  state.hasEnded = false;
  state.items.clear();
  state.lucidity = 100;
  state.corruptedMemories.clear();
  state.chaseActive = false;
  emit('reset', null);
}
