import { on, getDepth } from '../game/state.js';
import { MEMORIES } from '../game/memories.js';

/**
 * hud.js — the depth gauge shown fixed in the corner of the screen.
 *
 * Self-contained: injects its own DOM/CSS (no changes needed to
 * index.html) and subscribes directly to game/state.js events, so
 * main.js just needs to call initHUD() once and never touch it again.
 */

const MAX_DEPTH = Object.values(MEMORIES).reduce((sum, m) => sum + m.cost, 0);

export function initHUD() {
  const container = document.createElement('div');
  container.id = 'hud-depth';
  container.style.cssText = `
    position: fixed; top: 24px; right: 24px; z-index: 10;
    display: flex; flex-direction: column; align-items: center;
    font-family: Georgia, serif; color: #f4ead9;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
    pointer-events: none;
  `;

  const labelEl = document.createElement('div');
  labelEl.textContent = 'Profondità';
  labelEl.style.cssText = `
    font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase;
    margin-bottom: 6px; opacity: 0.8;
  `;

  const trackEl = document.createElement('div');
  trackEl.style.cssText = `
    width: 10px; height: 160px; border-radius: 6px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.25);
    overflow: hidden; display: flex; align-items: flex-end;
  `;

  const fillEl = document.createElement('div');
  fillEl.style.cssText = `
    width: 100%; height: 0%;
    background: linear-gradient(to top, #7a2e2e, #d97757);
    transition: height 0.4s ease, background 0.6s ease;
  `;

  trackEl.appendChild(fillEl);
  container.appendChild(labelEl);
  container.appendChild(trackEl);
  document.body.appendChild(container);

  function render(depth) {
    const pct = Math.min(100, (depth / MAX_DEPTH) * 100);
    fillEl.style.height = `${pct}%`;

    // Cool the color down as depth increases, echoing the four-stage
    // palette shift described in docs/narrative.md.
    const stageColors = ['#d97757', '#c9743f', '#7d8a99', '#4a5560'];
    const stageIndex = Math.min(3, Math.floor((pct / 100) * 4));
    fillEl.style.background = `linear-gradient(to top, #3a2a24, ${stageColors[stageIndex]})`;
  }

  render(getDepth()); // initial paint
  on('depth-changed', ({ depth }) => render(depth));

  return { element: container };
}
