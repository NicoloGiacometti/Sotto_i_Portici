import { getMouseSensitivity, setMouseSensitivity } from '../game/settings.js';

/**
 * pauseMenu.js — an in-game menu reachable any time via a small corner
 * button, with the same sensitivity control as the start screen plus a
 * "Ricomincia" option.
 *
 * "Ricomincia" reloads the page rather than calling state.resetGame()
 * in place. This is a deliberate simplification: resetting game/state.js
 * alone wouldn't also reset the camera position, the currently-loaded
 * SceneManager room, or in-flight visual corruption (fog/vignette) — a
 * full reload guarantees a truly clean start with no leftover state,
 * at the cost of a brief page flash. Worth revisiting if that flash
 * ever feels wrong once the game has more content.
 */
export function initPauseMenu() {
  const openButton = document.createElement('button');
  openButton.textContent = '⚙';
  openButton.setAttribute('aria-label', 'Impostazioni');
  openButton.style.cssText = `
    position: fixed; top: 24px; left: 24px; z-index: 15;
    width: 38px; height: 38px; border-radius: 50%;
    background: rgba(30, 23, 18, 0.6); border: 1px solid rgba(255,255,255,0.2);
    color: #f4ead9; font-size: 1.1rem; cursor: pointer;
  `;
  document.body.appendChild(openButton);

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 30;
    background: rgba(10, 8, 6, 0.85);
    display: none; align-items: center; justify-content: center;
    font-family: Georgia, serif; color: #f4ead9;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    max-width: 360px; width: 100%; margin: 0 24px; padding: 32px;
    background: #1e1712; border: 1px solid rgba(255,220,168,0.25);
    border-radius: 4px; box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  `;

  const titleEl = document.createElement('div');
  titleEl.textContent = 'Impostazioni';
  titleEl.style.cssText = `
    font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: #d97757; margin-bottom: 20px;
  `;

  const sensitivityLabel = document.createElement('label');
  sensitivityLabel.style.cssText = `
    display: flex; justify-content: space-between; font-size: 0.85rem;
    opacity: 0.85; margin-bottom: 8px;
  `;
  const sensitivityLabelText = document.createElement('span');
  sensitivityLabelText.textContent = 'Sensibilità mouse';
  const sensitivityValueText = document.createElement('span');
  sensitivityLabel.appendChild(sensitivityLabelText);
  sensitivityLabel.appendChild(sensitivityValueText);

  const sensitivitySlider = document.createElement('input');
  sensitivitySlider.type = 'range';
  sensitivitySlider.min = '0.0008';
  sensitivitySlider.max = '0.0050';
  sensitivitySlider.step = '0.0002';
  sensitivitySlider.style.cssText = `width: 100%; margin-bottom: 24px;`;

  function syncSliderFromSettings() {
    sensitivitySlider.value = String(getMouseSensitivity());
    const pct = Math.round(
      ((Number(sensitivitySlider.value) - 0.0008) / (0.005 - 0.0008)) * 9 + 1
    );
    sensitivityValueText.textContent = String(pct);
  }

  sensitivitySlider.addEventListener('input', () => {
    setMouseSensitivity(Number(sensitivitySlider.value));
    const pct = Math.round(
      ((Number(sensitivitySlider.value) - 0.0008) / (0.005 - 0.0008)) * 9 + 1
    );
    sensitivityValueText.textContent = String(pct);
  });

  const restartButton = document.createElement('button');
  restartButton.textContent = 'Ricomincia da capo';
  restartButton.style.cssText = `
    width: 100%; font-family: Georgia, serif; font-size: 0.85rem;
    padding: 10px; background: transparent; color: #d97757;
    border: 1px solid #d97757; border-radius: 2px; cursor: pointer;
    margin-bottom: 10px;
  `;
  restartButton.addEventListener('click', () => {
    const confirmed = window.confirm(
      'Ricominciare da capo? Tutti i ricordi raccolti andranno persi.'
    );
    if (confirmed) window.location.reload();
  });

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Chiudi';
  closeButton.style.cssText = `
    width: 100%; font-family: Georgia, serif; font-size: 0.85rem;
    padding: 10px; background: none; color: #f4ead9; opacity: 0.6;
    border: none; cursor: pointer;
  `;

  function open() {
    syncSliderFromSettings();
    overlay.style.display = 'flex';
    if (document.pointerLockElement) document.exitPointerLock();
  }
  function close() {
    overlay.style.display = 'none';
  }

  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', close);
  card.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (overlay.style.display === 'flex') close();
    else open();
  });

  card.appendChild(titleEl);
  card.appendChild(sensitivityLabel);
  card.appendChild(sensitivitySlider);
  card.appendChild(restartButton);
  card.appendChild(closeButton);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // main.js congela i sistemi di minaccia (l'Altra, il drenaggio di
  // lucidità) mentre il menu è aperto — serve sapere se lo è.
  return { isOpen: () => overlay.style.display === 'flex' };
}
