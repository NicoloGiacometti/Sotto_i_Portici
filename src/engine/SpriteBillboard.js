import * as THREE from 'three';

/**
 * SpriteBillboard
 *
 * Wraps a 2D texture so it behaves like a classic "billboard sprite"
 * inside a 3D scene (Doom, Don't Starve, Cult of the Lamb style).
 *
 * Two modes:
 *  - mode: 'full'    -> always faces the camera exactly (THREE.Sprite default).
 *                       Good for small objects, icons, particles.
 *  - mode: 'upright'  -> only rotates around the world Y axis, stays vertical.
 *                       Good for characters and objects standing on the floor,
 *                       so they don't tilt weirdly when the player looks up/down.
 *
 * Usage:
 *   const npc = new SpriteBillboard({
 *     texturePath: '/assets/sprites/characters/nonna_ines_idle.png',
 *     width: 1.2,
 *     height: 2.0,
 *     mode: 'upright'
 *   });
 *   scene.add(npc.object);
 *   // in the render loop:
 *   npc.update(camera);
 */
export class SpriteBillboard {
  constructor({
    texturePath,
    width = 1,
    height = 1,
    mode = 'upright',
    anchorBottom = true, // if true, object's (0,0,0) sits at the sprite's feet, not its center
    transparent = true,
  }) {
    this.mode = mode;
    this.width = width;
    this.height = height;

    const loader = new THREE.TextureLoader();
    const texture = loader.load(texturePath);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter; // crisp pixel-art edges; switch to THREE.LinearFilter for painterly sprites
    texture.minFilter = THREE.NearestFilter;

    if (mode === 'full') {
      // True billboard: THREE.Sprite always faces the camera on every axis.
      const material = new THREE.SpriteMaterial({ map: texture, transparent });
      this.object = new THREE.Sprite(material);
      this.object.scale.set(width, height, 1);
      if (anchorBottom) {
        this.object.center.set(0.5, 0);
      }
    } else {
      // 'upright': a real plane mesh we manually rotate around Y each frame.
      const geometry = new THREE.PlaneGeometry(width, height);
      if (anchorBottom) {
        geometry.translate(0, height / 2, 0); // shift so the base sits on y = 0
      }
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent,
        side: THREE.DoubleSide,
        alphaTest: 0.5, // avoids sorting/blending artifacts on sprite edges
      });
      this.object = new THREE.Mesh(geometry, material);
    }
  }

  /** Call once per frame for 'upright' mode. No-op for 'full' mode. */
  update(camera) {
    if (this.mode !== 'upright') return;
    const objPos = this.object.position;
    const camPos = camera.position;
    // Look at the camera but only around the Y axis (ignore height difference).
    this.object.rotation.y = Math.atan2(
      camPos.x - objPos.x,
      camPos.z - objPos.z
    );
  }

  setPosition(x, y, z) {
    this.object.position.set(x, y, z);
    return this;
  }
}
