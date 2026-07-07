import * as THREE from 'three';
import { InteractionSystem } from './engine/InteractionSystem.js';
import { SceneManager } from './engine/SceneManager.js';
import {
  isMemoryCollected,
  collectMemory,
  moveToRoom,
  getCurrentRoom,
} from './game/state.js';
import { initHUD } from './ui/hud.js';
import { initMemoryModal } from './ui/memoryModal.js';

initHUD();
const memoryModal = initMemoryModal();

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

// --- Lights -----------------------------------------------------------------
scene.add(new THREE.AmbientLight(0xfff1e0, 0.6));
const sun = new THREE.DirectionalLight(0xffe9c7, 0.8);
sun.position.set(3, 5, 2);
scene.add(sun);

// --- Scene manager: builds/tears down room content, places the camera -------
const sceneManager = new SceneManager({ scene, camera });
sceneManager.loadRoom(getCurrentRoom()); // 'portico' at game start

// --- Interaction: raycasts hotspots + exits, handles the [E] key -------------
const interaction = new InteractionSystem({ camera, maxDistance: 4 });
interaction.setHotspots(sceneManager.getInteractables());

// Simple temporary prompt element until a dedicated ui component exists —
// shows what you're looking at, and whether it's actually usable right now.
const promptEl = document.createElement('div');
promptEl.style.cssText = `
  position: fixed; left: 50%; bottom: 12%; transform: translateX(-50%);
  color: #f4ead9; font-family: Georgia, serif; font-size: 1.1rem;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8); pointer-events: none;
  opacity: 0; transition: opacity 0.15s ease; z-index: 10;
`;
document.body.appendChild(promptEl);

interaction.on('focus-changed', (target) => {
  if (!target) {
    promptEl.style.opacity = '0';
    return;
  }

  if (target.kind === 'exit' && target.locked) {
    promptEl.textContent = `${target.label} — è ancora chiuso`;
  } else if (target.kind === 'hotspot' && target.requiresMemory && !isMemoryCollected(target.requiresMemory)) {
    promptEl.textContent = `${target.label} — non sembra il momento giusto`;
  } else {
    promptEl.textContent = `[E] ${target.label}`;
  }
  promptEl.style.opacity = '1';
});

interaction.on('interact', (target) => {
  if (target.kind === 'exit') {
    if (target.locked) return; // no-op, prompt already told the player why

    const moved = moveToRoom(target.to);
    if (!moved) return; // shouldn't happen if .locked was accurate, but just in case

    sceneManager.loadRoom(target.to);
    interaction.setHotspots(sceneManager.getInteractables());
    return;
  }

  // target.kind === 'hotspot'
  const locked = target.requiresMemory && !isMemoryCollected(target.requiresMemory);
  if (locked) return;

  collectMemory(target.memoryId);
  memoryModal.show(target.memoryId);
});

// --- First-person movement (WASD + pointer-lock mouse look) -----------------
const move = { forward: false, back: false, left: false, right: false };
const velocity = new THREE.Vector3();
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

  // inputForward: +1 = W (walk forward), -1 = S (walk backward)
  // inputRight:   +1 = D (strafe right),  -1 = A (strafe left)
  // Mouse is the ONLY thing that changes yaw/pitch (handled above); WASD only
  // ever translates the camera position, never rotates the view.
  let inputForward = 0;
  let inputRight = 0;
  if (move.forward) inputForward += 1;
  if (move.back) inputForward -= 1;
  if (move.right) inputRight += 1;
  if (move.left) inputRight -= 1;

  // Derive forward/right directly from the camera's actual world orientation
  // instead of hand-rolled trig, so the sign always matches what the camera
  // is really looking at.
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

  velocity.set(0, 0, 0);
  velocity.addScaledVector(forward, inputForward * walkSpeed * dt);
  velocity.addScaledVector(right, inputRight * walkSpeed * dt);
  camera.position.add(velocity);

  sceneManager.update();
  interaction.update();

  renderer.render(scene, camera);
}

animate();
