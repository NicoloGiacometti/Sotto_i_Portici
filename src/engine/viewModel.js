import * as THREE from 'three';

/**
 * viewModel.js — attaches a fixed "hands" sprite to the camera itself,
 * the classic FPS-style viewmodel. Unlike world sprites (SpriteBillboard),
 * this never needs a per-frame rotation update: it's a child of the
 * camera object, so it automatically inherits the camera's position and
 * rotation every frame for free.
 *
 * depthTest/depthWrite are disabled and renderOrder is pushed high so the
 * hands always draw on top of world geometry, never clipping into a wall
 * or object the camera happens to be close to.
 */
export function createHandsViewModel(camera, texturePath) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.PlaneGeometry(0.9, 1.3);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 999; // draw last, always on top
  // Local offset relative to the camera: slightly down-right and forward,
  // like hands resting in view at the bottom of the screen.
  mesh.position.set(0.22, -0.32, -0.7);
  mesh.rotation.set(0, 0, 0);

  camera.add(mesh);
  return mesh;
}
