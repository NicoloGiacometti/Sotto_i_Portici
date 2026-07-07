/**
 * assetPath.js — resolves a path under public/ to the correct URL,
 * accounting for Vite's `base` config (e.g. '/' locally in dev, but
 * '/Sotto_i_Portici/' when built for GitHub Pages).
 *
 * Why this exists: Vite automatically rewrites asset paths it can see
 * statically (imports, <img src> in processed HTML/CSS), but a path
 * built as a plain JS string at runtime — like `spritePath` values in
 * rooms.js — is NOT rewritten. Without this helper, sprite/texture paths
 * that work in `npm run dev` (base = '/') 404 once deployed under a
 * subpath like GitHub Pages.
 *
 * Usage: asset('assets/sprites/objects/diario_costanza.png')
 * (leading slash optional — it's stripped automatically either way)
 */
export function asset(path) {
  const base = import.meta.env.BASE_URL; // e.g. '/' or '/Sotto_i_Portici/'
  const cleanPath = path.replace(/^\/+/, '');
  return base + cleanPath;
}
