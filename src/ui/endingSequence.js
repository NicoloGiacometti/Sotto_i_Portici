/**
 * endingSequence.js — the closing mirror-monologue sequence, triggered
 * once `crollo_pozzo_argine` is collected (see docs/narrative.md,
 * "Sequenza di chiusura"). Three short voice lines revealed one at a
 * time on click, then a closing paragraph and a "Ricomincia" button.
 *
 * Text lives here rather than in game/memories.js because it isn't a
 * memory the player collects — it's the game's own closing narration,
 * a different kind of content.
 */

const VOICE_LINES = [
  'Non sono un mostro. Sono quello che è rimasto quando lei non riusciva più a restare.',
  'Io ho portato il peso per ventitré anni, così che il resto di voi potesse continuare a respirare.',
  'Va bene. Adesso lo portiamo insieme.',
];

const CLOSING_TEXT = `Il mattino dopo, Michela chiama il dottor Fantini. Non per raccontare tutto subito — solo per dire che è pronta a ricominciare a ricordare, un pezzo alla volta.`;

export function initEndingSequence() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 200;
    background: #0c0a08;
    display: none; align-items: center; justify-content: center;
    font-family: Georgia, serif; color: #f4ead9;
    cursor: pointer;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    max-width: 560px; margin: 0 32px; text-align: center;
  `;

  const textEl = document.createElement('p');
  textEl.style.cssText = `
    font-size: 1.15rem; line-height: 1.8; font-style: italic;
    margin: 0 0 32px; min-height: 4.5em;
  `;

  const hintEl = document.createElement('div');
  hintEl.textContent = 'click per continuare';
  hintEl.style.cssText = `
    font-size: 0.75rem; opacity: 0.45; text-transform: uppercase;
    letter-spacing: 0.08em;
  `;

  const restartButton = document.createElement('button');
  restartButton.textContent = 'Ricomincia';
  restartButton.style.cssText = `
    display: none; font-family: Georgia, serif; font-size: 1rem;
    letter-spacing: 0.05em; padding: 12px 40px; background: #d97757;
    color: #1e1712; border: none; border-radius: 2px; cursor: pointer;
    text-transform: uppercase; margin-top: 12px;
  `;
  restartButton.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.reload();
  });

  card.appendChild(textEl);
  card.appendChild(hintEl);
  card.appendChild(restartButton);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Sequence: the three voice lines, then the closing paragraph as a
  // final "line" that swaps the click-hint for the restart button.
  const allLines = [...VOICE_LINES, CLOSING_TEXT];
  let index = 0;

  function renderCurrentLine() {
    textEl.textContent = allLines[index];
    const isLast = index === allLines.length - 1;
    hintEl.style.display = isLast ? 'none' : 'block';
    restartButton.style.display = isLast ? 'inline-block' : 'none';
  }

  overlay.addEventListener('click', () => {
    if (index >= allLines.length - 1) return; // last line: only the button advances (restarts)
    index += 1;
    renderCurrentLine();
  });

  function trigger() {
    if (document.pointerLockElement) document.exitPointerLock();
    index = 0;
    renderCurrentLine();
    overlay.style.display = 'flex';
  }

  return { trigger };
}
