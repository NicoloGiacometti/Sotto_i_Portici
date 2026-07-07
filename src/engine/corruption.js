import * as THREE from 'three';

/**
 * corruption.js — visual "stage" effects tied to state.getStage() (0-3).
 *
 * Two kinds of effect live here:
 *  1. Three.js scene properties (background color, fog, light color/
 *     intensity) — these can't be done in CSS, so this module owns them.
 *  2. A shared CSS injection for the text-glitch effect, used by both the
 *     temporary prompt in main.js and the memory modal, so both jitter
 *     the same way without duplicating the animation definition.
 *
 * Palette follows docs/narrative.md's four-stage table: warm/nostalgic
 * at stage 0, cooling and desaturating through 1-2, near-monochrome at 3.
 */

export const STAGE_PALETTE = [
  // Stage 0 — calm, warm, nostalgic
  {
    background: 0x2b2118,
    fogColor: 0x2b2118,
    fogNear: 14,
    fogFar: 32,
    ambientColor: 0xfff1e0,
    ambientIntensity: 0.65,
    sunColor: 0xffe9c7,
    sunIntensity: 0.8,
    vignette: 0.15,
  },
  // Stage 1 — colors start to mute, first contradictions
  {
    background: 0x241f1c,
    fogColor: 0x241f1c,
    fogNear: 11,
    fogFar: 26,
    ambientColor: 0xf3e4d2,
    ambientIntensity: 0.55,
    sunColor: 0xf0dcc0,
    sunIntensity: 0.7,
    vignette: 0.3,
  },
  // Stage 2 — cold, desaturated, memories openly contradict
  {
    background: 0x1c2024,
    fogColor: 0x1c2024,
    fogNear: 8,
    fogFar: 20,
    ambientColor: 0xd8e0e6,
    ambientIntensity: 0.45,
    sunColor: 0xc7d3dc,
    sunIntensity: 0.55,
    vignette: 0.48,
  },
  // Stage 3 — near-monochrome, revelation
  {
    background: 0x14171a,
    fogColor: 0x14171a,
    fogNear: 6,
    fogFar: 15,
    ambientColor: 0xaab2b8,
    ambientIntensity: 0.35,
    sunColor: 0x9aa4ab,
    sunIntensity: 0.4,
    vignette: 0.68,
  },
];

/** Applies the given stage's palette to the scene/lights (Three.js side). */
export function applyStageToScene({ scene, ambientLight, sunLight }, stage) {
  const p = STAGE_PALETTE[stage] ?? STAGE_PALETTE[0];

  scene.background = new THREE.Color(p.background);
  scene.fog = new THREE.Fog(p.fogColor, p.fogNear, p.fogFar);

  ambientLight.color.setHex(p.ambientColor);
  ambientLight.intensity = p.ambientIntensity;

  sunLight.color.setHex(p.sunColor);
  sunLight.intensity = p.sunIntensity;
}

/** Creates a fixed full-screen vignette div and returns a setter for its
 * strength (called with the current stage's `vignette` value, 0-1). */
export function createVignetteOverlay() {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; inset: 0; z-index: 5; pointer-events: none;
    background: radial-gradient(ellipse at center,
      rgba(0,0,0,0) 40%, rgba(0,0,0,0.9) 100%);
    opacity: 0; transition: opacity 1.2s ease;
  `;
  document.body.appendChild(el);

  return {
    element: el,
    setStrength(strength) {
      el.style.opacity = String(strength);
    },
  };
}

let glitchStylesInjected = false;

/** Injects the shared @keyframes for the text-glitch effect exactly once.
 * Call before using the 'glitch-text' class on any element. Idempotent —
 * safe to call from multiple modules without duplicating the <style> tag. */
export function injectGlitchStyles() {
  if (glitchStylesInjected) return;
  glitchStylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes sottoIPorticiGlitch {
      0%, 100% { transform: translate(0, 0); opacity: 1; }
      20% { transform: translate(-1px, 0.5px); opacity: 0.85; }
      40% { transform: translate(1px, -0.5px); opacity: 1; }
      60% { transform: translate(-0.5px, 0); opacity: 0.9; }
      80% { transform: translate(0.5px, 0.5px); opacity: 1; }
    }
    .glitch-text {
      animation: sottoIPorticiGlitch 2.4s infinite steps(1, end);
    }
  `;
  document.head.appendChild(style);
}
