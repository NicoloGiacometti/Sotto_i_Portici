import * as THREE from 'three';
import { SpriteBillboard } from './SpriteBillboard.js';

/**
 * InteractionSystem — raycasts from the center of the screen (where the
 * crosshair sits) to detect hotspot markers in front of the player, and
 * turns a key press into an "interact" event.
 *
 * Deliberately generic/reusable (belongs in engine/, not game/): it knows
 * nothing about memories, depth, or narrative content. It only knows
 * "here are some 3D objects tagged as hotspots, tell me which one the
 * player is looking at, and let me know when they press the interact key."
 * Wiring what an interaction *means* (collecting a memory, checking
 * state.isMemoryCollected for a gate, etc.) happens outside this file —
 * see main.js for how it's connected to game/state.js.
 *
 * Usage:
 *   const interaction = new InteractionSystem({ camera });
 *   interaction.setHotspots([mesh1, mesh2, ...]); // call again per room change
 *   interaction.on('focus-changed', (hotspotData) => { ...show/hide prompt... });
 *   interaction.on('interact', (hotspotData) => { ...collect memory, etc... });
 *   // in the render loop:
 *   interaction.update();
 */
export class InteractionSystem {
  constructor({ camera, maxDistance = 3.5, interactKey = 'KeyE' }) {
    this.camera = camera;
    this.maxDistance = maxDistance;
    this.interactKey = interactKey;

    this.raycaster = new THREE.Raycaster();
    this.centerNDC = new THREE.Vector2(0, 0); // screen center, matches the crosshair

    this.hotspotObjects = []; // THREE.Object3D[], each with userData holding hotspot info
    this.focusedHotspot = null; // the userData of whichever hotspot is currently looked at

    this._listeners = new Map(); // eventName -> Set<callback>

    this._onKeyDown = this._onKeyDown.bind(this);
    document.addEventListener('keydown', this._onKeyDown);
  }

  /** Replace the set of interactable objects (call this whenever the room changes). */
  setHotspots(objects) {
    this.hotspotObjects = objects;
    this.focusedHotspot = null; // avoid stale focus pointing at a removed room's object
  }

  on(eventName, callback) {
    if (!this._listeners.has(eventName)) this._listeners.set(eventName, new Set());
    this._listeners.get(eventName).add(callback);
    return () => this._listeners.get(eventName).delete(callback);
  }

  _emit(eventName, payload) {
    const callbacks = this._listeners.get(eventName);
    if (!callbacks) return;
    for (const cb of callbacks) cb(payload);
  }

  _onKeyDown(e) {
    if (e.code !== this.interactKey) return;
    if (!this.focusedHotspot) return;
    this._emit('interact', this.focusedHotspot);
  }

  /** Call once per frame. Casts a ray from the screen center and updates focus. */
  update() {
    if (this.hotspotObjects.length === 0) {
      if (this.focusedHotspot) {
        this.focusedHotspot = null;
        this._emit('focus-changed', null);
      }
      return;
    }

    this.raycaster.setFromCamera(this.centerNDC, this.camera);
    const hits = this.raycaster.intersectObjects(this.hotspotObjects, false);

    const closest = hits.length > 0 && hits[0].distance <= this.maxDistance
      ? hits[0]
      : null;

    const newFocusData = closest ? closest.object.userData : null;
    const focusChanged = newFocusData?.id !== this.focusedHotspot?.id;

    if (focusChanged) {
      this.focusedHotspot = newFocusData;
      this._emit('focus-changed', newFocusData);
    }
  }

  /** Call when the room/scene is torn down entirely (not just changed). */
  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
    this._listeners.clear();
  }
}

/**
 * Builds a small pulsing marker mesh, tagged with the data needed by
 * InteractionSystem and by whatever wires 'interact' events to game logic.
 * Shared by createHotspotMarker and createExitMarker below — they just
 * pass different colors/radius/userData shape.
 */
function createMarker(position, userData, { color, emissive, radius = 0.12 }) {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  const marker = new THREE.Mesh(geometry, material);
  marker.position.set(...position);
  marker.userData = userData;

  // Gentle pulse so markers read as "interactive" at a glance without
  // needing real art yet. Driven by wall-clock time, no per-frame state
  // needed from the render loop.
  marker.onBeforeRender = () => {
    const t = performance.now() * 0.002;
    const scale = 1 + Math.sin(t + marker.position.x) * 0.12;
    marker.scale.setScalar(scale);
  };

  return marker;
}

/**
 * Marker for a memory hotspot (an examinable object). Tagged
 * `kind: 'hotspot'` so main.js's 'interact' handler knows to call
 * collectMemory() + show the memory modal, not move rooms.
 *
 * This is a placeholder visual — a soft warm glowing sphere — so hotspots
 * are clickable/lookable at before any real sprite art exists. Swap the
 * geometry/material later without touching the interaction logic above.
 */
export function createHotspotMarker(hotspotData) {
  return createMarker(
    hotspotData.position,
    { ...hotspotData, kind: 'hotspot' },
    { color: 0xffdca8, emissive: 0xffb877, radius: 0.12 }
  );
}

/**
 * Builds the visual for a hotspot: a real sprite if `hotspotData.spritePath`
 * is set, or the placeholder pulsing sphere (createHotspotMarker) as a
 * fallback when the art doesn't exist yet. Either way, returns an object
 * ready for both the scene graph and InteractionSystem's raycasting.
 *
 * Sprites use mode: 'upright' (billboards on the Y axis only, like NPCs) and
 * are centered on `position` — not anchored at the feet — since hotspot
 * positions in rooms.js were authored as the object's center point (roughly
 * waist height), matching how the old sphere marker was placed.
 *
 * @returns {{ object3D: THREE.Object3D, billboard: SpriteBillboard|null }}
 *   `billboard` is non-null only when a real sprite was created — the
 *   caller (SceneManager) needs to call billboard.update(camera) every
 *   frame for it to keep facing the player, same as NPCs.
 */
export function createHotspotVisual(hotspotData) {
  if (!hotspotData.spritePath) {
    return { object3D: createHotspotMarker(hotspotData), billboard: null };
  }

  const billboard = new SpriteBillboard({
    texturePath: hotspotData.spritePath,
    width: hotspotData.spriteWidth ?? 0.5,
    height: hotspotData.spriteHeight ?? 0.5,
    mode: 'upright',
    anchorBottom: false, // position is the object's center, not its feet
  });
  billboard.setPosition(...hotspotData.position);
  billboard.object.userData = { ...hotspotData, kind: 'hotspot' };

  return { object3D: billboard.object, billboard };
}

/**
 * Marker for a room exit. Tagged `kind: 'exit'` so main.js's 'interact'
 * handler knows to call moveToRoom() + reload the scene, not open a
 * memory modal. Visually distinct (cool blue vs. warm amber) so players
 * can tell hotspots and exits apart at a glance even before real art.
 *
 * rooms.js exits don't have an `id` field (they're identified by `to`),
 * so one is synthesized here for InteractionSystem's focus-tracking.
 */
export function createExitMarker(exitData) {
  const userData = {
    id: `exit-${exitData.to}`,
    label: exitData.label,
    to: exitData.to,
    kind: 'exit',
  };
  return createMarker(exitData.position, userData, {
    color: 0x9fd8ff,
    emissive: 0x6fb8e8,
    radius: 0.18,
  });
}
