import * as THREE from 'three';
import { InteractionSystem } from './engine/InteractionSystem.js';
import { SceneManager } from './engine/SceneManager.js';
import { createHandsViewModel } from './engine/viewModel.js';
import { asset } from './engine/assetPath.js';
import {
  applyStageToScene,
  createVignetteOverlay,
  injectGlitchStyles,
  STAGE_PALETTE,
} from './engine/corruption.js';
import {
  isMemoryCollected,
  collectMemory,
  moveToRoom,
  getCurrentRoom,
  getStage,
  on,
} from './game/state.js';
import { initHUD } from './ui/hud.js';
import { initMemoryModal } from './ui/memoryModal.js';
import { initStartScreen } from './ui/startScreen.js';
import { initPauseMenu } from './ui/pauseMenu.js';
import { initEndingSequence } from './ui/endingSequence.js';
import { getMouseSensitivity } from './game/settings.js';

initHUD();
const memoryModal = initMemoryModal();
initPauseMenu();
const endingSequence = initEndingSequence();
injectGlitchStyles();

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
createHandsViewModel(camera, asset('assets/sprites/characters/michela_mani_idle.png'));

// --- Lights -----------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xfff1e0, 0.6);
scene.add(ambientLight);
const sun = new THREE.DirectionalLight(0xffe9c7, 0.8);
sun.position.set(3, 5, 2);
scene.add(sun);

// --- Stage-based visual corruption (color, fog, vignette, glitch) -----------
// Reacts to state.getStage() (0-3) — see docs/narrative.md for the tone
// table this palette follows. Three.js-side properties (background/fog/
// lights) are applied here; the glitch-text CSS class is toggled on
// individual DOM elements (promptEl below, and inside memoryModal.js).
const vignette = createVignetteOverlay();

function updateStageVisuals(stage) {
  applyStageToScene({ scene, ambientLight, sunLight: sun }, stage);
  vignette.setStrength(STAGE_PALETTE[stage]?.vignette ?? 0);
  promptEl.classList.toggle('glitch-text', stage >= 3);
}

on('depth-changed', ({ stage }) => updateStageVisuals(stage));

// --- Ending: stop the game and play the closing sequence when triggered -----
let gameEnded = false;
on('ending-triggered', () => {
  gameEnded = true;
  endingSequence.trigger();
});

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

updateStageVisuals(getStage()); // paint stage 0 immediately at game start

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
  const sensitivity = getMouseSensitivity();
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

  if (gameEnded) {
    renderer.render(scene, camera); // keep the last frame visible under the overlay
    return;
  }

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

  // Clamp inside the current room's floor so the player can't walk off
  // the edge into empty space — room-relative bounds come from
  // SceneManager, which knows the active room's floorSize.
  const bounds = sceneManager.getMovementBounds();
  camera.position.x = Math.max(-bounds.maxX, Math.min(bounds.maxX, camera.position.x));
  camera.position.z = Math.max(-bounds.maxZ, Math.min(bounds.maxZ, camera.position.z));

  sceneManager.update();
  interaction.update();

  renderer.render(scene, camera);
}

animate();

// The start screen sits on top of everything (highest z-index) until the
// player clicks "Inizia" — the scene/camera/HUD are already built and
// rendering behind it by this point, so there's no loading gap once it's
// dismissed. animate() is called above unconditionally because pausing
// the render loop isn't necessary here (nothing moves without WASD/mouse
// input, and pointer lock can't engage until the player clicks the canvas
// anyway — which only becomes possible once the overlay is gone).
initStartScreen({ onStart: () => {} });
