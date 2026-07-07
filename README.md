# Sotto i Portici

Walking sim psicologico in 3D con sprite 2D billboard (stile Doom / Don't
Starve). Costruito con Three.js + Vite.

## Setup

```bash
npm install
npm run dev
```

Apri il link che stampa Vite (di solito `http://localhost:5173`).
Click sullo schermo per attivare il mouse-look, `WASD` per muoverti,
`Esc` per rilasciare il puntatore.

## Struttura

- `src/main.js` — entry point: scena, camera, movimento, loop di render
- `src/engine/` — codice riutilizzabile (billboard, movimento, interazioni)
- `src/game/` — contenuto specifico di questo gioco (stanze, ricordi, stato)
- `src/ui/` — overlay 2D (HUD, modali) sopra il canvas 3D
- `public/assets/sprites/` — vedi `README.md` lì dentro per le specifiche
  prima di disegnare
- `docs/narrative.md` — mappa stanze e testi dei ricordi (contenuto puro,
  separato dal codice)

## Stato attuale

Scaffold minimo funzionante: piano 3D, movimento in prima persona, e uno
sprite billboard placeholder generato via canvas per verificare che la
pipeline funzioni prima di avere gli asset veri.

Prossimi passi: `src/game/rooms.js`, `src/game/state.js`, e i testi in
`docs/narrative.md`.
