import * as THREE from 'three';
import { SpriteBillboard } from './SpriteBillboard.js';
import { createHotspotMarker, createExitMarker } from './InteractionSystem.js';
import { makePlaceholderTexture } from './placeholderTexture.js';
import { getRoom } from '../game/rooms.js';
import { isRoomUnlocked } from '../game/state.js';

/**
 * SceneManager — builds the 3D content for whichever room is currently
 * active, and tears down the previous room's content first.
 *
 * Note on architecture: this file lives in engine/ but, unlike
 * InteractionSystem.js, it does know about game/rooms.js and
 * game/state.js. A scene manager's whole job is turning *this specific
 * game's* room data into Three.js objects, so full engine/game
 * separation isn't practical here — the coupling is intentional, not an
 * oversight.
 *
 * Usage:
 *   const sceneManager = new SceneManager({ scene, camera });
 *   sceneManager.loadRoom('portico');
 *   // in the render loop:
 *   sceneManager.update();
 *   // to get objects for InteractionSystem.setHotspots():
 *   interaction.setHotspots(sceneManager.getInteractables());
 */
export class SceneManager {
  constructor({ scene, camera }) {
    this.scene = scene;
    this.camera = camera;
    this.currentRoomId = null;

    this._trackedObjects = []; // everything added this room, for cleanup
    this._billboards = []; // SpriteBillboard instances needing per-frame update
    this._hotspotMarkers = [];
    this._exitMarkers = [];
  }

  /** Loads a room by id: clears the previous one, builds the new one. */
  loadRoom(roomId) {
    const room = getRoom(roomId);
    if (!room) return;

    this._clearCurrentRoom();
    this.currentRoomId = roomId;

    this._buildFloor(room);
    this._buildHotspots(room);
    this._buildExits(room);
    this._buildNPCs(room);
    this._placeCamera(room);
  }

  /** Combined hotspot + exit markers, ready to hand to InteractionSystem. */
  getInteractables() {
    return [...this._hotspotMarkers, ...this._exitMarkers];
  }

  /** Call once per frame, after camera position/rotation are finalized. */
  update() {
    for (const billboard of this._billboards) billboard.update(this.camera);
  }

  _buildFloor(room) {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(room.floorSize.width, room.floorSize.depth),
      new THREE.MeshStandardMaterial({ color: 0x4a3f33 })
    );
    floor.rotation.x = -Math.PI / 2;
    this._addTracked(floor);
  }

  _buildHotspots(room) {
    this._hotspotMarkers = room.hotspots.map((hotspotData) => {
      const marker = createHotspotMarker(hotspotData);
      this._addTracked(marker);
      return marker;
    });
  }

  _buildExits(room) {
    this._exitMarkers = room.exits.map((exitData) => {
      const marker = createExitMarker(exitData);
      // Flag whether the destination room is actually unlocked yet, so
      // main.js's 'interact' handler can show "locked" feedback instead
      // of silently moving/not-moving. Recomputed on every loadRoom()
      // since unlock state changes as depth increases.
      marker.userData.locked = !isRoomUnlocked(exitData.to);
      this._addTracked(marker);
      return marker;
    });
  }

  _buildNPCs(room) {
    this._billboards = room.npcs.map((npc) => {
      const billboard = new SpriteBillboard({
        texturePath: makePlaceholderTexture(npc.name),
        width: 1.2,
        height: 2.0,
        mode: 'upright',
      });
      billboard.setPosition(...npc.position);
      this._addTracked(billboard.object);
      return billboard;
    });
  }

  /** Places the camera roughly in the middle of the room, at eye height. */
  _placeCamera(room) {
    this.camera.position.set(0, 1.7, room.floorSize.depth / 2 - 1.5);
  }

  _addTracked(object3D) {
    this.scene.add(object3D);
    this._trackedObjects.push(object3D);
  }

  _clearCurrentRoom() {
    for (const object3D of this._trackedObjects) {
      this.scene.remove(object3D);
      object3D.geometry?.dispose?.();
      if (object3D.material) {
        const materials = Array.isArray(object3D.material)
          ? object3D.material
          : [object3D.material];
        for (const mat of materials) {
          mat.map?.dispose?.();
          mat.dispose?.();
        }
      }
    }
    this._trackedObjects = [];
    this._billboards = [];
    this._hotspotMarkers = [];
    this._exitMarkers = [];
  }
}
