import * as THREE from 'three';
import { SpriteBillboard } from './engine/SpriteBillboard.js';

// --- Renderer -------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

// --- Scene & camera ---------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1512); // warm dark brown, placeholder mood for stage 0

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.7, 5); // ~1.7m = eye height

// --- Lights -----------------------------------------------------------------
scene.add(new THREE.AmbientLight(0xfff1e0, 0.6));
const sun = new THREE.DirectionalLight(0xffe9c7, 0.8);
sun.position.set(3, 5, 2);
scene.add(sun);

// --- Floor (placeholder for the portico) ------------------------------------
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x4a3f33 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- Placeholder billboard sprite -------------------------------------------
// Draws a simple labeled rectangle on a canvas and uses it as a texture,
// so the billboard pipeline is provable before real sprite art exists.
// Replace `texturePath` with a real PNG under /public/assets/sprites/... later.
function makePlaceholderTexture(label, bg = '#7a2e2e') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  ctx.fillStyle = '#ffffff';
  ctx.font = '28px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL();
}

const placeholderNPC = new SpriteBillboard({
  texturePath: makePlaceholderTexture('Nonna Ines\n(placeholder)'),
  width: 1.2,
  height: 2.0,
  mode: 'upright',
});
placeholderNPC.setPosition(0, 0, 0);
scene.add(placeholderNPC.object);

// Keep every billboard in one list so the render loop can update them all.
const billboards = [placeholderNPC];

// --- First-person movement (WASD + pointer-lock mouse look) -----------------
const move = { forward: false, back: false, left: false, right: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let yaw = 0;
let pitch = 0;

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') move.forward = true;
  if (e.code === 'KeyS') move.back = true;
  if (e.code === 'KeyA') move.left = true;
  if (e.code === 'KeyD') move.right = true;
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') move.forward = false;
  if (e.code === 'KeyS') move.back = false;
  if (e.code === 'KeyA') move.left = false;
  if (e.code === 'KeyD') move.right = false;
});

renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  const sensitivity = 0.0022;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch));
});

// --- Resize -------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Render loop ----------------------------------------------------------------
const clock = new THREE.Clock();
const walkSpeed = 3.2; // meters/second

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  direction.set(0, 0, 0);
  if (move.forward) direction.z -= 1;
  if (move.back) direction.z += 1;
  if (move.left) direction.x -= 1;
  if (move.right) direction.x += 1;
  direction.normalize();

  // Move relative to where the camera is facing (yaw only, so looking up/down
  // doesn't fly the player into the floor or ceiling).
  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));
  velocity.set(0, 0, 0);
  velocity.addScaledVector(forward, -direction.z * walkSpeed * dt);
  velocity.addScaledVector(right, direction.x * walkSpeed * dt);
  camera.position.add(velocity);

  for (const b of billboards) b.update(camera);

  renderer.render(scene, camera);
}

animate();
