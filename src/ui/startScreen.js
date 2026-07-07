import { getMouseSensitivity, setMouseSensitivity } from '../game/settings.js';

/**
 * startScreen.js — the very first thing the player sees: title, incipit
 * text, an "Inizia" button, and an inline settings toggle (mouse
 * sensitivity for now — the natural place to add more later, e.g.
 * volume once audio exists).
 *
 * main.js builds the whole 3D scene/game underneath this overlay before
 * the player ever clicks "Inizia" — the overlay just sits on top
 * (highest z-index in the app) and hides it. onStart() is where main.js
 * actually kicks off the render loop and requests pointer lock.
 */
export function initStartScreen({ onStart }) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 100;
    background: radial-gradient(ellipse at center, #2b2118 0%, #14100c 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: Georgia, serif; color: #f4ead9;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    max-width: 520px; margin: 0 24px; text-align: center;
  `;

  const titleEl = document.createElement('h1');
  titleEl.textContent = 'Sotto i Portici';
  titleEl.style.cssText = `
    font-size: 2.4rem; font-weight: 400; letter-spacing: 0.02em;
    margin: 0 0 28px; color: #f4ead9;
  `;

  const incipitEl = document.createElement('p');
  incipitEl.textContent = `Sei tornata a Bologna per sistemare la casa. Lo dici così da settimane, anche a te stessa. La nonna Ines ti ha lasciato le chiavi senza dire una parola, come se sapesse che avresti dovuto scoprirlo da sola — qualunque cosa "lo" sia. Sotto il portico, l'aria di luglio pesa uguale a ventitré anni fa.`;
  incipitEl.style.cssText = `
    font-size: 1rem; line-height: 1.7; font-style: italic; opacity: 0.85;
    margin: 0 0 36px;
  `;

  const startButton = document.createElement('button');
  startButton.textContent = 'Inizia';
  startButton.style.cssText = `
    font-family: Georgia, serif; font-size: 1rem; letter-spacing: 0.05em;
    padding: 12px 40px; background: #d97757; color: #1e1712; border: none;
    border-radius: 2px; cursor: pointer; text-transform: uppercase;
  `;
  startButton.addEventListener('mouseenter', () => {
    startButton.style.background = '#e88a6a';
  });
  startButton.addEventListener('mouseleave', () => {
    startButton.style.background = '#d97757';
  });

  const settingsToggle = document.createElement('button');
  settingsToggle.textContent = 'Impostazioni';
  settingsToggle.style.cssText = `
    display: block; margin: 18px auto 0; background: none; border: none;
    color: #f4ead9; opacity: 0.55; font-family: Georgia, serif;
    font-size: 0.8rem; text-decoration: underline; cursor: pointer;
  `;

  // --- Inline settings panel, hidden until toggled ---------------------------
  const settingsPanel = document.createElement('div');
  settingsPanel.style.cssText = `
    display: none; margin-top: 22px; padding-top: 22px;
    border-top: 1px solid rgba(255,255,255,0.15); text-align: left;
  `;

  const sensitivityLabel = document.createElement('label');
  sensitivityLabel.style.cssText = `
    display: flex; justify-content: space-between; font-size: 0.85rem;
    opacity: 0.8; margin-bottom: 8px;
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
  sensitivitySlider.value = String(getMouseSensitivity());
  sensitivitySlider.style.cssText = `width: 100%;`;

  function renderSensitivityValue() {
    // Show as a friendlier 1-10 scale rather than the raw radian value.
    const pct = Math.round(
      ((Number(sensitivitySlider.value) - 0.0008) / (0.005 - 0.0008)) * 9 + 1
    );
    sensitivityValueText.textContent = String(pct);
  }
  renderSensitivityValue();

  sensitivitySlider.addEventListener('input', () => {
    setMouseSensitivity(Number(sensitivitySlider.value));
    renderSensitivityValue();
  });

  const controlsReminder = document.createElement('p');
  controlsReminder.innerHTML = `WASD per muoverti &middot; Shift per correre &middot; mouse per guardarti intorno<br>[E] per esaminare &middot; [M] per l'audio`;
  controlsReminder.style.cssText = `
    font-size: 0.75rem; opacity: 0.5; margin-top: 18px; text-align: center;
  `;

  settingsPanel.appendChild(sensitivityLabel);
  settingsPanel.appendChild(sensitivitySlider);
  settingsPanel.appendChild(controlsReminder);

  settingsToggle.addEventListener('click', () => {
    const isHidden = settingsPanel.style.display === 'none';
    settingsPanel.style.display = isHidden ? 'block' : 'none';
    settingsToggle.textContent = isHidden ? 'Nascondi impostazioni' : 'Impostazioni';
  });

  startButton.addEventListener('click', () => {
    overlay.remove();
    onStart();
  });

  // Avvertenza di gameplay: la casa non è più soltanto da esplorare.
  const warningEl = document.createElement('p');
  warningEl.textContent = `Più scavi, meno la casa resta soltanto una casa. Se qualcosa ti si avvicina, guardala: si ferma — ma guardarla costa. Se la lucidità si esaurisce, arriva l'assenza. La sfoglina della nonna ti riporta in te.`;
  warningEl.style.cssText = `
    font-size: 0.82rem; line-height: 1.6; opacity: 0.6; margin: 0 0 32px;
  `;

  card.appendChild(titleEl);
  card.appendChild(incipitEl);
  card.appendChild(warningEl);
  card.appendChild(startButton);
  card.appendChild(settingsToggle);
  card.appendChild(settingsPanel);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}
