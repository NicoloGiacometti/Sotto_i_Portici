import * as THREE from 'three';
import { InteractionSystem } from './engine/InteractionSystem.js';
import { SceneManager } from './engine/SceneManager.js';
import { AltraEntity } from './engine/AltraEntity.js';
import { createHandsViewModel } from './engine/viewModel.js';
import { asset } from './engine/assetPath.js';
import { audio } from './engine/audio.js';
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
  hasItem,
  collectItem,
  getLucidity,
  drainLucidity,
  restoreLucidity,
  getCorruptedMemoryIds,
  isChaseActive,
  isRoomUnlocked,
  hasEnded,
  triggerAbsence,
} from './game/state.js';
import { getRoom } from './game/rooms.js';
import { getMemory } from './game/memories.js';
import { initHUD } from './ui/hud.js';
import { initLucidityHud } from './ui/lucidityHud.js';
import { initMemoryModal } from './ui/memoryModal.js';
import { initKeypadModal } from './ui/keypadModal.js';
import { initStartScreen } from './ui/startScreen.js';
import { initPauseMenu } from './ui/pauseMenu.js';
import { initEndingSequence } from './ui/endingSequence.js';
import { getMouseSensitivity } from './game/settings.js';

initHUD();
const lucidityHud = initLucidityHud();
const memoryModal = initMemoryModal();
const keypadModal = initKeypadModal();
const pauseMenu = initPauseMenu();
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
const vignette = createVignetteOverlay();

function updateStageVisuals(stage) {
  applyStageToScene({ scene, ambientLight, sunLight: sun }, stage);
  vignette.setStrength(STAGE_PALETTE[stage]?.vignette ?? 0);
  promptEl.classList.toggle('glitch-text', stage >= 3);
  audio.setStage(stage);
}

on('depth-changed', ({ stage }) => updateStageVisuals(stage));

// --- Ending -------------------------------------------------------------------
let gameEnded = false;
on('ending-triggered', () => {
  gameEnded = true;
  altra.despawn();
  endingSequence.trigger();
});

// --- Scene manager -------------------------------------------------------------
const sceneManager = new SceneManager({ scene, camera });

// --- L'Altra ---------------------------------------------------------------------
// La presenza ostile della casa (vedi engine/AltraEntity.js e
// docs/gameplay.md). Tutte le conseguenze di gioco passano da qui:
// drenaggio di lucidità, battito cardiaco, assenza al contatto.
const altra = new AltraEntity({
  scene,
  camera,
  onDrain: (amount) => drainLucidity(amount),
  onHeartbeat: () => audio.thump(),
  onWhisper: () => audio.whisper(),
  onFlee: (reason) => {
    audio.stinger();
    if (reason === 'fled') lucidityHud.toast('Non regge lo sguardo. Per ora.');
  },
  onCaught: () => doAbsence(),
});

const altraContext = () => ({ stage: getStage(), chase: isChaseActive() });

/** Cambio stanza: scena, interactables e l'Altra insieme. */
function changeRoom(roomId) {
  sceneManager.loadRoom(roomId);
  interaction.setHotspots(sceneManager.getInteractables());
  altra.onRoomChange(getRoom(roomId), altraContext());
}

// Quando una stanza si sblocca, aggiorna i lucchetti delle uscite già in
// scena (senza ricaricare la stanza, che riposizionerebbe la camera).
on('room-unlocked', () => {
  for (const object of sceneManager.getInteractables()) {
    if (object.userData.kind === 'exit') {
      object.userData.locked = !isRoomUnlocked(object.userData.to);
    }
  }
});

// --- Interaction ------------------------------------------------------------------
const interaction = new InteractionSystem({ camera, maxDistance: 4 });
sceneManager.loadRoom(getCurrentRoom()); // 'portico' at game start
interaction.setHotspots(sceneManager.getInteractables());
altra.onRoomChange(getRoom(getCurrentRoom()), altraContext());

// Prompt element — shows what you're looking at, and whether it's usable.
const promptEl = document.createElement('div');
promptEl.style.cssText = `
  position: fixed; left: 50%; bottom: 12%; transform: translateX(-50%);
  color: #f4ead9; font-family: Georgia, serif; font-size: 1.1rem;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8); pointer-events: none;
  opacity: 0; transition: opacity 0.15s ease; z-index: 10; text-align: center;
  max-width: 80vw;
`;
document.body.appendChild(promptEl);

updateStageVisuals(getStage()); // paint stage 0 immediately at game start

interaction.on('focus-changed', (target) => {
  if (!target) {
    promptEl.style.opacity = '0';
    return;
  }

  if (target.kind === 'exit') {
    if (target.locked) {
      promptEl.textContent = `${target.label} — è ancora chiuso`;
    } else if (target.requiresItem && !hasItem(target.requiresItem)) {
      promptEl.textContent = `${target.label} — ${target.lockedPrompt}`;
    } else {
      promptEl.textContent = `[E] ${target.label}`;
    }
  } else if (target.itemId) {
    promptEl.textContent = `[E] ${target.label}`;
  } else if (target.requiresMemory && !isMemoryCollected(target.requiresMemory)) {
    promptEl.textContent = `${target.label} — non sembra il momento giusto`;
  } else if (target.requiresItem && !hasItem(target.requiresItem)) {
    promptEl.textContent = `${target.label} — ${target.lockedPrompt}`;
  } else if (target.anchor && isMemoryCollected(target.memoryId)) {
    promptEl.textContent = `[E] ${target.label} — fermati un momento`;
  } else if (target.givesItem && isMemoryCollected(target.memoryId) && !hasItem(target.givesItem)) {
    promptEl.textContent = `[E] ${target.label} — guarda dietro la cornice`;
  } else {
    promptEl.textContent = `[E] ${target.label}`;
  }
  promptEl.style.opacity = '1';
});

// Dopo la chiusura del modale dell'ultimo ricordo parte l'inseguimento:
// l'Altra compare sull'argine e bisogna correre fino all'osteria.
let chaseIntroDone = false;
function onMemoryModalClosed() {
  if (isChaseActive() && !hasEnded() && !chaseIntroDone) {
    chaseIntroDone = true;
    lucidityHud.toast("Non sei sola sull'argine. Corri.", { important: true, durationMs: 5000 });
    audio.stinger();
    altra.onRoomChange(getRoom(getCurrentRoom()), altraContext());
  }
}

interaction.on('interact', (target) => {
  if (isUiFrozen()) return;

  if (target.kind === 'exit') {
    if (target.locked) return; // no-op, prompt already told the player why
    if (target.requiresItem && !hasItem(target.requiresItem)) return;

    const moved = moveToRoom(target.to);
    if (!moved) return;
    if (hasEnded()) return; // l'ending overlay ha già preso il controllo

    changeRoom(target.to);
    return;
  }

  // target.kind === 'hotspot'

  // Oggetto raccoglibile (valvola, ecc.)
  if (target.itemId) {
    collectItem(target.itemId);
    audio.click();
    if (target.pickupText) lucidityHud.toast(target.pickupText);
    sceneManager.removeHotspot(target.id);
    interaction.setHotspots(sceneManager.getInteractables());
    return;
  }

  const memoryLocked = target.requiresMemory && !isMemoryCollected(target.requiresMemory);
  if (memoryLocked) return;
  if (target.requiresItem && !hasItem(target.requiresItem)) return;

  // La sfoglina come àncora: riesaminarla dopo il ricordo ripristina la
  // lucidità e scaccia l'Altra (con un cooldown per non renderla gratis).
  if (target.anchor && isMemoryCollected(target.memoryId)) {
    if (anchorCooldown <= 0) {
      anchorCooldown = 25;
      restoreLucidity();
      altra.banish();
      lucidityHud.toast("Impasti l'aria con le mani, come faceva lei. Respiri.");
    } else {
      lucidityHud.toast('Hai appena ripreso fiato.');
    }
    return;
  }

  // Il lucchetto a combinazione in soffitta.
  if (target.keypad && !isMemoryCollected(target.memoryId)) {
    keypadModal.open({
      onSuccess: () => {
        lucidityHud.toast('Il lucchetto cede.');
        collectMemory(target.memoryId);
        memoryModal.show(target.memoryId, { onClose: onMemoryModalClosed });
      },
    });
    return;
  }

  // Lo specchio: al secondo esame, la chiave della porta sul retro.
  if (target.givesItem && isMemoryCollected(target.memoryId) && !hasItem(target.givesItem)) {
    collectItem(target.givesItem);
    audio.click();
    lucidityHud.toast('Dietro lo specchio, appesa a un chiodo: una chiave fredda.', { important: true });
    return;
  }

  collectMemory(target.memoryId);
  memoryModal.show(target.memoryId, { onClose: onMemoryModalClosed });
});

// --- Assenza ------------------------------------------------------------------
// Il blackout dissociativo: schermo nero, risveglio al portico, un
// ricordo si confonde. Scatta al contatto con l'Altra o a lucidità zero.
const blackoutEl = document.createElement('div');
blackoutEl.style.cssText = `
  position: fixed; inset: 0; z-index: 50; background: #000;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity 0.5s ease;
  font-family: Georgia, serif;
`;
const blackoutText = document.createElement('span');
blackoutText.textContent = "… l'assenza …";
blackoutText.style.cssText = `color: #5c5245; font-size: 1.3rem; font-style: italic; letter-spacing: 0.2em;`;
blackoutEl.appendChild(blackoutText);
document.body.appendChild(blackoutEl);

let absenceRunning = false;
function doAbsence() {
  if (absenceRunning || gameEnded) return;
  absenceRunning = true;
  altra.despawn();
  audio.stinger();
  blackoutEl.style.opacity = '1';
  blackoutEl.style.pointerEvents = 'auto';

  setTimeout(() => {
    const corruptedId = triggerAbsence();
    changeRoom('portico');
    setTimeout(() => {
      blackoutEl.style.opacity = '0';
      blackoutEl.style.pointerEvents = 'none';
      absenceRunning = false;
      const label = corruptedId ? getMemory(corruptedId)?.label : null;
      lucidityHud.toast(
        label
          ? `Ti svegli sotto il portico. Qualcosa si è confuso: ${label.toLowerCase()}.`
          : 'Ti svegli sotto il portico. Le mani ti tremano.',
        { important: true, durationMs: 5000 }
      );
    }, 900);
  }, 1400);
}

// --- Eventi horror ambientali ------------------------------------------------
// Dallo stadio 1 in poi la casa "reagisce" a intervalli irregolari:
// luci che tremano, nebbia che si chiude, sussurri. Ogni evento costa
// un po' di lucidità — l'orologio della sfoglina, in pratica.
const WHISPER_LINES = [
  '…michela…',
  '…dove sei…',
  '…spingimi più forte…',
  '…non sono di vetro…',
];
let nextEventIn = 20;
let flickerUntil = 0;
let fogSurgeUntil = 0;

function horrorTick(dt, t) {
  const stage = getStage();
  if (stage < 1) return;
  nextEventIn -= dt;
  if (nextEventIn > 0) return;
  nextEventIn = 26 - stage * 5 + Math.random() * 18;

  const roll = Math.random();
  if (roll < 0.35) {
    flickerUntil = t + 1.3;
    audio.click();
    drainLucidity(3);
  } else if (roll < 0.65) {
    audio.whisper();
    lucidityHud.toast(WHISPER_LINES[Math.floor(Math.random() * WHISPER_LINES.length)]);
    drainLucidity(4);
  } else {
    fogSurgeUntil = t + 3;
    drainLucidity(5);
  }
}

// --- First-person movement (WASD + Shift + pointer-lock mouse look) ----------
const move = { forward: false, back: false, left: false, right: false, sprint: false };
const velocity = new THREE.Vector3();
let yaw = 0;
let pitch = 0;
let anchorCooldown = 0;

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') move.forward = true;
  if (e.code === 'KeyS') move.back = true;
  if (e.code === 'KeyA') move.left = true;
  if (e.code === 'KeyD') move.right = true;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') move.sprint = true;
  if (e.code === 'KeyM') {
    const muted = audio.toggleMute();
    lucidityHud.toast(muted ? 'Audio disattivato.' : 'Audio attivo.');
  }
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') move.forward = false;
  if (e.code === 'KeyS') move.back = false;
  if (e.code === 'KeyA') move.left = false;
  if (e.code === 'KeyD') move.right = false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') move.sprint = false;
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

// --- Freeze dei sistemi di minaccia -------------------------------------------
// L'Altra, gli eventi horror e il drenaggio non corrono mentre il
// giocatore legge un ricordo, usa il tastierino, sta nel menu o prima
// di "Inizia" — leggere non deve mai essere punito.
let gameStarted = false;
function isUiFrozen() {
  return (
    !gameStarted ||
    gameEnded ||
    absenceRunning ||
    memoryModal.isOpen() ||
    keypadModal.isOpen() ||
    pauseMenu.isOpen()
  );
}

// --- Render loop ----------------------------------------------------------------
const clock = new THREE.Clock();
const walkSpeed = 3.2; // meters/second
const sprintSpeed = 5.2; // per l'inseguimento finale (l'Altra corre a 3.8)

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (gameEnded) {
    renderer.render(scene, camera); // keep the last frame visible under the overlay
    return;
  }

  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  const frozen = isUiFrozen();

  if (!frozen) {
    // Movement
    let inputForward = 0;
    let inputRight = 0;
    if (move.forward) inputForward += 1;
    if (move.back) inputForward -= 1;
    if (move.right) inputRight += 1;
    if (move.left) inputRight -= 1;

    const speed = move.sprint ? sprintSpeed : walkSpeed;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    velocity.set(0, 0, 0);
    velocity.addScaledVector(forward, inputForward * speed * dt);
    velocity.addScaledVector(right, inputRight * speed * dt);
    camera.position.add(velocity);

    const bounds = sceneManager.getMovementBounds();
    camera.position.x = Math.max(-bounds.maxX, Math.min(bounds.maxX, camera.position.x));
    camera.position.z = Math.max(-bounds.maxZ, Math.min(bounds.maxZ, camera.position.z));

    // Sistemi di minaccia
    altra.update(dt, altraContext());
    horrorTick(dt, t);
    anchorCooldown = Math.max(0, anchorCooldown - dt);

    // Lucidità: rigenera lentamente quando l'Altra non c'è (più piano se
    // ci sono ricordi confusi in giro); a zero scatta l'assenza.
    if (!altra.active) {
      const regenPerSecond = getCorruptedMemoryIds().length > 0 ? 1.2 : 2.5;
      restoreLucidity(regenPerSecond * dt);
    }
    if (getLucidity() <= 0) doAbsence();
  }

  // Tremolio della camera a lucidità bassa (sempre visibile, anche da fermo)
  const lucidity = getLucidity();
  camera.rotation.z =
    lucidity < 25 ? Math.sin(t * 13) * 0.004 * (1 - lucidity / 25) : 0;

  // Flicker delle luci / nebbia che si chiude (decadono da soli)
  const palette = STAGE_PALETTE[getStage()] ?? STAGE_PALETTE[0];
  if (t < flickerUntil) {
    const k = 0.35 + Math.random() * 0.9;
    ambientLight.intensity = palette.ambientIntensity * k;
    sun.intensity = palette.sunIntensity * k;
  } else {
    ambientLight.intensity = palette.ambientIntensity;
    sun.intensity = palette.sunIntensity;
  }
  if (scene.fog) {
    const targetNear = t < fogSurgeUntil ? 2.5 : palette.fogNear;
    const targetFar = t < fogSurgeUntil ? 9 : palette.fogFar;
    const lerp = Math.min(1, dt * 2);
    scene.fog.near += (targetNear - scene.fog.near) * lerp;
    scene.fog.far += (targetFar - scene.fog.far) * lerp;
  }

  sceneManager.update();
  interaction.update();

  renderer.render(scene, camera);
}

animate();

initStartScreen({
  onStart: () => {
    gameStarted = true;
    audio.init(); // AudioContext richiede un gesto utente: eccolo
  },
});
