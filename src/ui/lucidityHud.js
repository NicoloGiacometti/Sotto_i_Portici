import { on, getLucidity, getItems, getCorruptedMemoryIds } from '../game/state.js';
import { getRoom } from '../game/rooms.js';
import { getItemLabel } from '../game/items.js';

/**
 * lucidityHud.js — la seconda metà dell'HUD (la prima è hud.js, la barra
 * di profondità): barra della lucidità in basso a sinistra, chips degli
 * oggetti raccolti e dei ricordi confusi, e i "toast" — le righe di
 * testo temporanee con cui il gioco parla al giocatore senza aprire
 * modali (sblocchi, sussurri, raccolte).
 *
 * Come hud.js: inietta il proprio DOM e si iscrive agli eventi di
 * game/state.js da solo. initLucidityHud() ritorna { toast } perché
 * alcuni messaggi (testi di raccolta, sussurri procedurali) partono da
 * main.js, che non ha eventi di stato dedicati.
 */
export function initLucidityHud() {
  // --- Barra lucidità -------------------------------------------------------
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position: fixed; left: 24px; bottom: 24px; z-index: 10;
    width: 180px; display: flex; flex-direction: column; gap: 5px;
    font-family: Georgia, serif; pointer-events: none;
  `;

  const label = document.createElement('div');
  label.textContent = 'Lucidità';
  label.style.cssText = `
    color: #f4ead9; opacity: 0.8; font-size: 0.72rem;
    letter-spacing: 0.14em; text-transform: uppercase;
    text-shadow: 0 1px 3px rgba(0,0,0,0.9);
  `;

  const track = document.createElement('div');
  track.style.cssText = `
    height: 5px; background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden;
  `;

  const fill = document.createElement('div');
  fill.style.cssText = `
    height: 100%; width: 100%; background: #cbbfa4;
    transition: width 0.25s linear, background 0.5s ease;
  `;

  track.appendChild(fill);
  wrap.appendChild(label);
  wrap.appendChild(track);
  document.body.appendChild(wrap);

  function renderBar(lucidity) {
    fill.style.width = `${lucidity}%`;
    fill.style.background = lucidity > 55 ? '#cbbfa4' : lucidity > 25 ? '#c9a06a' : '#b05a4a';
  }

  // --- Chips: oggetti + ricordi confusi --------------------------------------
  const chipsEl = document.createElement('div');
  chipsEl.style.cssText = `
    position: fixed; left: 24px; bottom: 62px; z-index: 10;
    display: flex; gap: 8px; flex-wrap: wrap; max-width: 320px;
    font-family: Georgia, serif; pointer-events: none;
  `;
  document.body.appendChild(chipsEl);

  function renderChips() {
    chipsEl.innerHTML = '';
    for (const itemId of getItems()) {
      const chip = document.createElement('div');
      chip.textContent = getItemLabel(itemId);
      chip.style.cssText = `
        color: #e8d9ba; font-size: 0.72rem; letter-spacing: 0.05em;
        border: 1px solid rgba(232,217,186,0.35); border-radius: 2px;
        padding: 3px 9px; background: rgba(10,9,8,0.55);
      `;
      chipsEl.appendChild(chip);
    }
    const corrupted = getCorruptedMemoryIds().length;
    if (corrupted > 0) {
      const chip = document.createElement('div');
      chip.textContent = corrupted === 1 ? '1 ricordo confuso' : `${corrupted} ricordi confusi`;
      chip.className = 'glitch-text';
      chip.style.cssText = `
        color: #a9b4bc; font-size: 0.72rem; letter-spacing: 0.05em;
        border: 1px solid rgba(169,180,188,0.35); border-radius: 2px;
        padding: 3px 9px; background: rgba(10,9,8,0.55);
      `;
      chipsEl.appendChild(chip);
    }
  }

  // --- Toast ------------------------------------------------------------------
  const toastEl = document.createElement('div');
  toastEl.style.cssText = `
    position: fixed; top: 64px; left: 50%; transform: translateX(-50%);
    z-index: 12; color: #e8d9ba; font-family: Georgia, serif;
    font-size: 0.95rem; font-style: italic; text-align: center;
    text-shadow: 0 1px 4px rgba(0,0,0,0.9); max-width: 70vw;
    opacity: 0; transition: opacity 0.4s ease; pointer-events: none;
  `;
  document.body.appendChild(toastEl);

  let toastTimer = null;
  function toast(message, { important = false, durationMs = 3500 } = {}) {
    toastEl.textContent = message;
    toastEl.style.color = important ? '#f0e2c0' : '#e8d9ba';
    toastEl.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.style.opacity = '0';
    }, durationMs);
  }

  // --- Sottoscrizioni -----------------------------------------------------------
  on('lucidity-changed', ({ lucidity }) => renderBar(lucidity));
  on('item-collected', renderChips);
  on('memory-corrupted', renderChips);
  on('memory-restored', renderChips);
  on('room-unlocked', ({ roomId }) => {
    const room = getRoom(roomId);
    if (room) toast(`Qualcosa si è aperto: ${room.displayName}.`, { important: true });
  });

  renderBar(getLucidity());
  renderChips();

  return { toast };
}
