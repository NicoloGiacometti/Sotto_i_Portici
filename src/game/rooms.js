/**
 * rooms.js — static data describing every room in the game.
 *
 * This is the single source of truth for: which rooms exist, how they
 * connect (exits), what can be examined in them (hotspots -> memory ids
 * from state.js), which NPCs stand around as ambient billboards, and
 * under what conditions a room unlocks.
 *
 * Positions are in meters, in that room's own local space (each room is
 * rendered as its own self-contained scene later by SceneManager — they
 * don't share a single giant coordinate system). y = height off the
 * floor; the SpriteBillboard engine already anchors sprites at their
 * base, so y here is where the sprite's *feet* touch the ground (usually 0),
 * while hotspot examine-points use y ~ 1 (roughly waist/eye height).
 *
 * `unlock: null` means the room is available from the start. Otherwise
 * `{ minDepth, requiresMemories }` — read and enforced by state.js's
 * checkUnlocks(), not duplicated here as logic, just as data.
 */

export const ROOMS = {
  portico: {
    id: 'portico',
    displayName: 'Il Portico',
    floorSize: { width: 12, depth: 8 },
    unlock: null, // starting room
    exits: [
      { to: 'cucina', label: 'Verso la cucina', position: [4, 0, 0] },
      { to: 'salotto', label: 'Verso il salotto', position: [-4, 0, 0] },
      { to: 'osteria', label: "Verso l'osteria chiusa", position: [0, 0, -3.5] },
    ],
    hotspots: [
      {
        id: 'swing_portico',
        memoryId: 'swing_portico',
        label: "L'altalena arrugginita",
        position: [2, 1, 2],
        spritePath: '/assets/sprites/objects/swing_portico.png',
      },
      {
        id: 'sfoglina_corridoio',
        memoryId: 'sfoglina_corridoio',
        label: 'La sfoglina, fuori posto',
        position: [-2, 1, 2.5],
        spritePath: '/assets/sprites/objects/sfoglina.png',
      },
    ],
    npcs: [],
  },

  cucina: {
    id: 'cucina',
    displayName: 'La Cucina',
    floorSize: { width: 6, depth: 6 },
    unlock: null,
    exits: [
      { to: 'portico', label: 'Torna al portico', position: [-2.8, 0, 0] },
      { to: 'camera_costanza', label: 'Verso la camera di Costanza', position: [2.8, 0, -1] },
    ],
    hotspots: [
      {
        id: 'foglio_ricetta',
        memoryId: 'foglio_ricetta',
        label: 'Il foglio con la ricetta',
        position: [1, 1, 1.5],
        spritePath: '/assets/sprites/objects/foglio_ricetta.png',
      },
      {
        id: 'videocassetta',
        memoryId: 'videocassetta',
        label: 'La videocassetta "Festa 12/7"',
        position: [-1.5, 1, -1.5],
        spritePath: '/assets/sprites/objects/videocassetta.png',
      },
    ],
    npcs: [
      {
        id: 'nonna_ines_cucina',
        name: 'Nonna Ines',
        spritePath: '/assets/sprites/characters/nonna_ines_idle.png',
        position: [0, 0, -2],
      },
    ],
  },

  camera_costanza: {
    id: 'camera_costanza',
    displayName: 'La Camera di Costanza',
    floorSize: { width: 5, depth: 5 },
    unlock: null,
    exits: [
      { to: 'cucina', label: 'Torna in cucina', position: [0, 0, 2.3] },
    ],
    hotspots: [
      {
        id: 'diario_costanza',
        memoryId: 'diario_costanza',
        label: 'Il diario sul comodino',
        position: [1.5, 1, -1],
        spritePath: '/assets/sprites/objects/diario_costanza.png',
      },
      {
        id: 'disegno_parete',
        memoryId: 'disegno_parete',
        label: 'Il disegno sulla parete',
        position: [-1.5, 1.4, -2],
        spritePath: '/assets/sprites/objects/disegno_parete.png',
      },
    ],
    npcs: [],
  },

  salotto: {
    id: 'salotto',
    displayName: 'Il Salotto',
    floorSize: { width: 7, depth: 6 },
    unlock: null,
    exits: [
      { to: 'portico', label: 'Torna al portico', position: [3.2, 0, 0] },
      { to: 'soffitta', label: 'Sali in soffitta', position: [0, 0, -2.8] },
    ],
    hotspots: [
      {
        id: 'poltrona_babbo',
        memoryId: 'poltrona_babbo',
        label: 'La poltrona di Renzo',
        position: [-2, 1, 1],
        spritePath: '/assets/sprites/objects/poltrona_babbo.png',
      },
      {
        id: 'radio_lucio_dalla',
        memoryId: 'radio_lucio_dalla',
        label: 'La radio a transistor',
        position: [2, 1, -1],
        spritePath: '/assets/sprites/objects/radio_lucio_dalla.png',
      },
    ],
    npcs: [
      {
        id: 'babbo_renzo_salotto',
        name: 'Babbo Renzo',
        spritePath: '/assets/sprites/characters/babbo_renzo_idle.png',
        position: [-2, 0, 1.3],
      },
    ],
  },

  soffitta: {
    id: 'soffitta',
    displayName: 'La Soffitta',
    floorSize: { width: 6, depth: 5 },
    unlock: { minDepth: 10, requiresMemories: ['videocassetta'] },
    exits: [
      { to: 'salotto', label: 'Scendi dal salotto', position: [0, 0, 2.3] },
    ],
    hotspots: [
      {
        id: 'lettera_dottore',
        memoryId: 'lettera_dottore',
        label: 'La lettera mai spedita',
        position: [1.5, 1, -1],
        spritePath: '/assets/sprites/objects/lettera_dottore.png',
      },
      {
        id: 'scatola_polaroid',
        memoryId: 'scatola_polaroid',
        label: 'La scatola di Polaroid',
        position: [-1.5, 1, -0.5],
        spritePath: '/assets/sprites/objects/scatola_polaroid.png',
      },
      {
        id: 'diario_alternativo',
        memoryId: 'diario_alternativo',
        label: "L'asse del pavimento sollevata",
        position: [0, 0.3, -1.8],
        // No spritePath yet — diario_alternativo.png is missing from
        // public/assets/sprites/objects/. Falls back to the placeholder
        // sphere marker automatically; add spritePath here once the PNG
        // exists, no other code changes needed.
        // Only examinable once `lettera_dottore` has been read — enforced
        // by main.js's 'interact' handler via state.isMemoryCollected().
        requiresMemory: 'lettera_dottore',
      },
    ],
    npcs: [],
  },

  osteria: {
    id: 'osteria',
    displayName: "L'Osteria Chiusa",
    floorSize: { width: 8, depth: 6 },
    unlock: { minDepth: 6, requiresMemories: [] },
    exits: [
      { to: 'portico', label: 'Torna al portico', position: [0, 0, 2.8] },
      { to: 'il_reno', label: 'Esci verso il Reno', position: [0, 0, -2.8] },
    ],
    hotspots: [
      {
        id: 'bancone_osteria',
        memoryId: 'bancone_osteria',
        label: 'Il bancone di legno',
        position: [-2, 1, 0],
        spritePath: '/assets/sprites/objects/bancone_osteria.png',
      },
      {
        id: 'specchio_incrinato',
        memoryId: 'specchio_incrinato',
        label: 'Lo specchio incrinato',
        position: [2.5, 1.5, -1.5],
        spritePath: '/assets/sprites/objects/specchio_incrinato.png',
      },
    ],
    npcs: [],
    // The closing mirror-monologue sequence overlays this room's scene
    // after `crollo_pozzo_argine` is collected in il_reno — see
    // docs/narrative.md "Sequenza di chiusura". Handled by ending.js
    // (later step), not by data here.
  },

  il_reno: {
    id: 'il_reno',
    displayName: 'Il Reno',
    floorSize: { width: 10, depth: 10 },
    unlock: {
      minDepth: 15,
      requiresMemories: ['lettera_dottore', 'diario_alternativo'],
    },
    exits: [
      { to: 'osteria', label: "Torna all'osteria", position: [0, 0, 4] },
    ],
    hotspots: [
      {
        id: 'crollo_pozzo_argine',
        memoryId: 'crollo_pozzo_argine',
        label: "Il vecchio molo sull'argine",
        position: [0, 0.5, -3],
        spritePath: '/assets/sprites/objects/crollo_pozzo_argine.png',
      },
    ],
    npcs: [],
  },
};

// --- Helpers -----------------------------------------------------------------

export function getRoom(roomId) {
  const room = ROOMS[roomId];
  if (!room) console.warn(`getRoom: unknown room id "${roomId}"`);
  return room ?? null;
}

export function getAllRoomIds() {
  return Object.keys(ROOMS);
}

/** Rooms with no unlock condition — used by state.js to seed initial progress. */
export function getInitiallyUnlockedRoomIds() {
  return Object.values(ROOMS)
    .filter((room) => room.unlock === null)
    .map((room) => room.id);
}

/** Rooms gated behind depth/memory conditions — used by state.js's checkUnlocks(). */
export function getGatedRooms() {
  return Object.values(ROOMS).filter((room) => room.unlock !== null);
}
