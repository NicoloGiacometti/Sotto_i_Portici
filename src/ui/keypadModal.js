import { drainLucidity } from '../game/state.js';
import { audio } from '../engine/audio.js';
import { injectGlitchStyles } from '../engine/corruption.js';

/**
 * keypadModal.js — il lucchetto a combinazione sull'asse del pavimento
 * in soffitta. Tre cifre; la soluzione è la data che il giocatore ha già
 * incontrato tre volte (foglio della ricetta, videocassetta "Festa 12/7",
 * biglietto nell'osteria): 12 luglio → 127.
 *
 * Nessun aiuto esplicito: l'enigma è capire CHE COSA il lucchetto chiede,
 * non trovare un numero scritto da qualche parte. Ogni tentativo
 * sbagliato costa un po' di lucidità — provare a forza bruta ha un prezzo.
 */

const CODE = '127';

export function initKeypadModal() {
  injectGlitchStyles();

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 25;
    background: rgba(10, 8, 6, 0.85);
    display: none; align-items: center; justify-content: center;
    font-family: Georgia, serif; color: #f4ead9;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    max-width: 340px; margin: 0 24px; padding: 32px 36px; text-align: center;
    background: #1e1712; border: 1px solid rgba(255,220,168,0.25);
    border-radius: 4px; box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  `;

  const titleEl = document.createElement('div');
  titleEl.textContent = 'Un lucchetto a combinazione';
  titleEl.style.cssText = `
    font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: #d97757; margin-bottom: 12px;
  `;

  const hintEl = document.createElement('div');
  hintEl.textContent = 'Tre cifre. Una data che nessuno ha mai voluto buttare.';
  hintEl.style.cssText = `font-size: 0.85rem; font-style: italic; opacity: 0.7; margin-bottom: 16px;`;

  const displayEl = document.createElement('div');
  displayEl.style.cssText = `
    font-family: monospace; font-size: 2rem; letter-spacing: 0.5em;
    border-bottom: 1px solid rgba(244,234,217,0.4);
    display: inline-block; padding: 4px 12px 6px; margin-bottom: 18px; min-width: 120px;
  `;

  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid; grid-template-columns: repeat(3, 64px); gap: 10px;
    justify-content: center; margin-bottom: 18px;
  `;

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'lascia stare';
  cancelButton.style.cssText = `
    font-family: Georgia, serif; font-size: 0.85rem; padding: 8px 20px;
    background: none; color: #f4ead9; opacity: 0.6; border: none; cursor: pointer;
    text-decoration: underline;
  `;

  let buffer = '';
  let locked = false; // durante l'animazione di errore
  let callbacks = null;

  function renderDisplay() {
    displayEl.textContent = buffer.padEnd(3, '·').split('').join(' ');
  }

  function pressDigit(digit) {
    if (locked || buffer.length >= 3) return;
    audio.click();
    buffer += digit;
    renderDisplay();
    if (buffer.length < 3) return;

    if (buffer === CODE) {
      audio.click();
      const cb = callbacks;
      close();
      cb?.onSuccess?.();
    } else {
      // Tentativo sbagliato: glitch, stinger, e un po' di lucidità in meno.
      locked = true;
      displayEl.classList.add('glitch-text');
      audio.stinger();
      drainLucidity(6);
      setTimeout(() => {
        buffer = '';
        renderDisplay();
        displayEl.classList.remove('glitch-text');
        locked = false;
      }, 700);
    }
  }

  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) {
    const button = document.createElement('button');
    button.textContent = String(n);
    button.style.cssText = `
      padding: 14px 0; font-family: monospace; font-size: 1.2rem;
      background: none; color: #f4ead9; cursor: pointer;
      border: 1px solid rgba(244,234,217,0.3); border-radius: 2px;
    `;
    if (n === 0) button.style.gridColumn = '2';
    button.addEventListener('click', () => pressDigit(String(n)));
    grid.appendChild(button);
  }

  function onKeyDown(e) {
    if (/^Digit\d$/.test(e.code) || /^Numpad\d$/.test(e.code)) {
      pressDigit(e.code.slice(-1));
    } else if (e.code === 'Backspace') {
      if (!locked) {
        buffer = buffer.slice(0, -1);
        renderDisplay();
      }
    } else if (e.code === 'Escape') {
      close();
    }
  }

  function open({ onSuccess, onCancel } = {}) {
    callbacks = { onSuccess, onCancel };
    buffer = '';
    locked = false;
    renderDisplay();
    overlay.style.display = 'flex';
    if (document.pointerLockElement) document.exitPointerLock();
    document.addEventListener('keydown', onKeyDown);
  }

  function close() {
    overlay.style.display = 'none';
    document.removeEventListener('keydown', onKeyDown);
    const cb = callbacks;
    callbacks = null;
    cb?.onCancel?.();
  }

  cancelButton.addEventListener('click', close);
  overlay.addEventListener('click', close);
  card.addEventListener('click', (e) => e.stopPropagation());

  card.appendChild(titleEl);
  card.appendChild(hintEl);
  card.appendChild(displayEl);
  card.appendChild(grid);
  card.appendChild(cancelButton);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  return {
    open,
    close,
    isOpen: () => overlay.style.display === 'flex',
  };
}
