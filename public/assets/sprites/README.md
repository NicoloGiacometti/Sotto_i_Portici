# Specifiche sprite — Sotto i Portici

Regole da rispettare quando disegni gli sprite, per evitare di doverli
ritoccare dopo averli importati nel motore.

## Formato file

- **PNG con canale alpha** (sfondo trasparente). Niente JPG: perderesti la
  trasparenza e vedresti un riquadro colorato attorno allo sprite.
- Nome file in `snake_case`, descrittivo: `nonna_ines_idle.png`,
  `sfoglina_oggetto.png`, `costanza_diario_chiuso.png`.

## Dimensioni (in pixel)

Usa sempre potenze utili al rendering (non serve potenza di 2 esatta con
Vite/Three.js moderno, ma mantieni un rapporto larghezza:altezza pulito):

| Categoria     | Dimensione consigliata | Rapporto |
|---------------|------------------------|----------|
| Personaggi    | 512 × 896 px           | ~1:1.75 (proporzioni umane in piedi) |
| Oggetti medi (sfoglina, radio, sedia) | 512 × 512 px | 1:1 |
| Oggetti piccoli (diario, foto, lettera) | 256 × 256 px | 1:1 |
| Elementi ambiente (albero, lampione) | 512 × 1024 px | 1:2 |

Puoi disegnare più grande e poi esportare a queste dimensioni: meglio
ridurre in post che avere pixel sgranati a schermo.

## Punto di ancoraggio (anchor)

Il motore ancora ogni sprite **alla base** (i "piedi" toccano il
pavimento), non al centro. Quando disegni:

- Lascia che il soggetto stia sul **bordo inferiore** del canvas.
- Non centrare verticalmente il personaggio nel frame — se lo fai,
  affonderà a metà nel pavimento in gioco.
- Un margine trasparente di ~5% ai lati va bene, aiuta a evitare che i
  bordi vengano tagliati durante il filtraggio della texture.

## Stile grafico

- **Contorno netto** (outline scuro di 2-4px) aiuta gli sprite a leggersi
  bene contro sfondi 3D generici, specialmente in penombra.
- Palette limitata e desaturata coerente con lo stadio narrativo della
  stanza (vedi `docs/narrative.md` per la palette a 4 stadi).
- Evita dettagli minuti che spariscono a distanza — questi sprite si
  vedranno spesso a 3-8 metri dalla camera, non a schermo intero.

## Modalità billboard: quando usare 'upright' vs 'full'

- **`upright`** (default per personaggi e oggetti a terra): lo sprite
  ruota solo sull'asse verticale, resta sempre dritto. Usalo per
  chiunque/qualunque cosa stia in piedi sul pavimento.
- **`full`**: lo sprite ruota su ogni asse per restare perfettamente
  perpendicolare alla camera. Usalo solo per elementi fluttuanti/piccoli
  (particelle, icone, effetti), mai per personaggi — altrimenti sembrano
  "sdraiarsi" quando il giocatore guarda in basso.

## Cartelle

- `characters/` — Michela (se visibile, es. mani/braccia in prima
  persona), Nonna Ines, Costanza, Babbo Renzo. Prevedi almeno una posa
  "idle" per personaggio; espressioni/pose aggiuntive più avanti se
  servono per scene specifiche.
- `objects/` — sfoglina, biglietto rosso, diario, foto, lettera, radio,
  tutto ciò con cui il giocatore interagisce direttamente.
- `environment/` — dettagli decorativi non interattivi (piante, lampioni,
  dettagli portico) se preferisci farli come sprite invece che geometria
  3D pura.

## Placeholder attuali

Finché non ci sono sprite veri, `src/main.js` genera un placeholder via
canvas a runtime (rettangolo colorato + etichetta) con le stesse
proporzioni di un personaggio (512×896 equivalente). Quando hai un PNG
pronto, basta sostituire `texturePath` nel codice con il percorso reale,
es. `/assets/sprites/characters/nonna_ines_idle.png`.
