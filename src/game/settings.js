/**
 * settings.js — user-adjustable preferences, persisted to localStorage
 * so they survive between play sessions on the same browser.
 *
 * Kept separate from game/state.js on purpose: state.js is *progress*
 * (resets when the player starts over), settings.js is *preferences*
 * (should NOT reset on "Ricomincia" — nobody wants their sensitivity
 * wiped just because they restarted the story).
 */

const STORAGE_KEY = 'sottoIPortici:settings';

const DEFAULTS = {
  mouseSensitivity: 0.0022, // matches the value main.js used to hardcode
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS }; // corrupted/blocked storage — fall back quietly
  }
}

function save(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — the
    // setting still works for this session, it just won't persist.
  }
}

let settings = load();

export function getMouseSensitivity() {
  return settings.mouseSensitivity;
}

export function setMouseSensitivity(value) {
  settings.mouseSensitivity = value;
  save(settings);
}
