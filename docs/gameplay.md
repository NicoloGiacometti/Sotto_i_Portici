# Gameplay — sistemi di sfida e horror

Questo documento descrive i sistemi aggiunti sopra il walking sim
originale (esplora → esamina → leggi). L'obiettivo: dare al giocatore
qualcosa da *fare*, qualcosa da *temere*, e qualcosa da *risolvere*,
senza tradire il tono di docs/narrative.md — la minaccia È la storia
(la parte dissociata di Michela), non un mostro incollato sopra.

## Lucidità (barra in basso a sinistra)

Risorsa 0–100. Cala per: presenza dell'Altra (1.5/s), guardarla (5/s),
eventi ambientali (3–5 per evento), codici sbagliati al lucchetto (6).
Rigenera da sola quando non c'è minaccia (2.5/s, 1.2/s se ci sono
ricordi confusi). Sotto 25 la visuale ondeggia.

**A zero scatta l'assenza** (vedi sotto). La **sfoglina della nonna**
(portico) è l'àncora: dopo averne raccolto il ricordo, riesaminarla
ripristina tutta la lucidità e scaccia l'Altra dalla stanza — con 25s
di cooldown, così tornare all'àncora è una scelta di percorso, non un
riflesso gratuito.

## L'Altra (engine/AltraEntity.js)

La presenza che abita la casa. Silhouette scura generata su canvas
(nessun asset). Comportamento per stadio di profondità:

| Stadio | Comportamento |
|---|---|
| 0 | Non esiste. |
| 1 | Può apparire ferma (30%). Guardarla ~1s la fa svanire (−4 lucidità). |
| 2 | Appare più spesso (55%), si **avvicina quando non la guardi** (1.15 m/s). Guardarla la blocca ma costa 5/s. Dopo 6s di sguardo fisso fugge. |
| 3 | Come 2, ma più frequente (75%) e più veloce (1.7 m/s). |

Contatto → **assenza**. Congelata mentre un modale è aperto: leggere
non è mai punito.

## L'assenza

Il blackout dissociativo di Michela, trasformato in fail-state coerente:
schermo nero, risveglio al portico, lucidità a 55 e **un ricordo
raccolto si "confonde"** (appare come rumore nel modale). Rileggerlo lo
ripara. Niente game over: la punizione è strada persa e memoria sporcata.

## Oggetti ed enigmi

- **La valvola** (salotto, scatola dei fusibili) → ripara il televisore:
  senza, la videocassetta in cucina non si legge. E la videocassetta
  serve per sbloccare la soffitta.
- **Il lucchetto a combinazione** (soffitta, asse del pavimento): tre
  cifre. La soluzione non è scritta da nessuna parte — è la data che
  ricorre in tre ricordi (ricetta, "Festa 12/7", biglietto dell'osteria):
  12 luglio → **127**. Errori: −6 lucidità.
- **La chiave dell'osteria**: riesaminare lo specchio incrinato dopo
  averne letto il ricordo. Senza chiave la porta sul retro (verso il
  Reno) resta sbarrata anche dopo lo sblocco per profondità.

## Inseguimento finale

Raccolto `crollo_pozzo_argine`, il finale non parte più subito:
alla chiusura del modale l'Altra compare sull'argine e **dà la caccia**
(3.8 m/s: camminando a 3.2 si viene presi, correndo con Shift a 5.2 si
scappa). Guardarla non la ferma più. Toccati → assenza (e l'inseguimento
riprende rientrando al Reno). La sequenza di chiusura scatta quando si
raggiunge l'osteria — lo specchio — via `moveToRoom()` in state.js.

## Eventi ambientali (main.js, horrorTick)

Dallo stadio 1, a intervalli irregolari (più fitti a stadi alti):
flicker delle luci, nebbia che si chiude per qualche secondo, sussurri
(frasi dei ricordi: "…spingimi più forte…"). Ogni evento lima la
lucidità. Audio interamente sintetizzato in engine/audio.js (drone,
battito, sussurri, stinger) — nessun file audio. [M] per il mute.

## Tuning rapido

- Soglie stadi: `STAGE_THRESHOLDS` in game/state.js
- Aggressività dell'Altra: costanti in cima a engine/AltraEntity.js
- Frequenza eventi: `horrorTick` in main.js
- Codice del lucchetto: `CODE` in ui/keypadModal.js
- Velocità di corsa: `sprintSpeed` in main.js
