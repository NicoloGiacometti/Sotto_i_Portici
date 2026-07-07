import { getMemory } from '../game/memories.js';

/**
 * memoryModal.js — the overlay that shows a memory's text when the
 * player examines a hotspot.
 *
 * Deliberately exposes a single `show(memoryId)` method rather than
 * subscribing to state's 'memory-collected' event directly: re-examining
 * an already-collected memory should still open the modal (so the player
 * can re-read it), even though that doesn't fire 'memory-collected' again
 * (collectMemory() is a no-op on repeats). main.js decides when to call
 * show(), independent of whether the memory was new or already known.
 */
export function initMemoryModal() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 20;
    background: rgba(10, 8, 6, 0.82);
    display: none; align-items: center; justify-content: center;
    font-family: Georgia, serif;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    max-width: 480px; margin: 0 24px; padding: 32px 36px;
    background: #1e1712; border: 1px solid rgba(255,220,168,0.25);
    border-radius: 4px; color: #f4ead9;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  `;

  const titleEl = document.createElement('div');
  titleEl.style.cssText = `
    font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: #d97757; margin-bottom: 14px;
  `;

  const textEl = document.createElement('div');
  textEl.style.cssText = `
    font-size: 1.05rem; line-height: 1.6; font-style: italic;
  `;

  const hintEl = document.createElement('div');
  hintEl.textContent = 'Click o [Esc] per chiudere';
  hintEl.style.cssText = `
    margin-top: 22px; font-size: 0.75rem; opacity: 0.5; font-style: normal;
  `;

  card.appendChild(titleEl);
  card.appendChild(textEl);
  card.appendChild(hintEl);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function close() {
    overlay.style.display = 'none';
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.code === 'Escape') close();
  }

  overlay.addEventListener('click', close);
  card.addEventListener('click', (e) => e.stopPropagation()); // don't close on card click

  function show(memoryId) {
    const memory = getMemory(memoryId);
    if (!memory) return;

    // Exit pointer lock while reading — otherwise the mouse cursor stays
    // hidden and the player can't click the close hint or see what's
    // happening. Clicking the game canvas after closing re-locks it.
    if (document.pointerLockElement) document.exitPointerLock();

    titleEl.textContent = memory.label;
    textEl.textContent = memory.text;
    overlay.style.display = 'flex';
    document.addEventListener('keydown', onKeyDown);
  }

  return { show, close };
}
