# Sotto i Portici — Narrativa

Documento di contenuto puro, separato dal codice. Se cambi un testo qui,
non devi toccare `rooms.js` — solo verificare che gli `id` combacino.

---

## Personaggi

- **Michela** (protagonista, 34 anni) — tornata a Bologna dopo anni a
  Milano "per lavoro", frase che ripete come un mantra anche quando
  nessuno gliel'ha chiesto.
- **Nonna Ines** — ex operaia alle Officine Minganti, comunista convinta,
  passa al dialetto stretto quando è agitata. Convinta che ogni verità
  importante si dica impastando, non parlando.
- **Babbo Renzo** — professore universitario in pensione, ossessionato da
  Lucio Dalla e dal Bologna F.C. degli anni '90. Cita il "cantautorato
  bolognese" come se fosse un dogma di famiglia.
- **Costanza** — sorella minore di Michela, scomparsa 23 anni fa durante
  la festa dell'Unità di quartiere. La famiglia non ne parla mai per
  nome, solo "quella sera lì".

---

## Mappa delle stanze

```
Portico (start)
  ├── Cucina
  │     └── Camera di Costanza
  ├── Salotto
  │     └── Soffitta [richiede: profondità >= 10 + ricordo "lettera_dottore"]
  └── Osteria (chiusa) [richiede: profondità >= 6]
        └── Il Reno [richiede: profondità >= 15 + ricordi "lettera_dottore" + "diario_alternativo"]
```

Il Reno è la stanza finale: una volta raccolto il ricordo lì, si passa
automaticamente alla sequenza di chiusura (specchio nell'osteria), senza
bisogno di una stanza "specchio" separata.

---

## Stadi narrativi (legati alla profondità)

| Stadio | Profondita | Tono visivo | Tono narrativo |
|--------|-----------|-------------|-----------------|
| 0 | 0-4  | Caldo, seppia, nostalgico | Ricordi teneri, normalita apparente |
| 1 | 5-9  | Colori iniziano a smorzarsi | Prime contraddizioni, piccoli dettagli fuori posto |
| 2 | 10-14 | Freddo, desaturato, vignettatura piu forte | I ricordi si contraddicono apertamente |
| 3 | 15+  | Quasi monocromo, glitch testuali | Rivelazione, la verita riemerge |

---

## Ricordi — Portico

### `swing_portico` (minore, +1)
*Hotspot: l'altalena di ferro arrugginita appesa alla ringhiera del
portico.*

L'altalena cigola ancora, anche senza vento. Michela ricorda Costanza
che gridava "spingimi piu forte, dai, non sono di vetro" — una frase che
diceva sempre, come se sapesse gia che un giorno qualcuno avrebbe avuto
paura di romperla.

### `sfoglina_corridoio` (minore, +1)
*Hotspot: la sfoglina di famiglia, appoggiata su un mobile nel corridoio
del portico, fuori posto — non sta mai in cucina.*

La nonna la sposta sempre nella stanza dove sta di piu, come un totem.
"Finche c'e la sfoglina in casa, c'e ancora una famiglia" diceva. Non ha
mai spiegato cosa succede quando la sfoglina si ferma.

---

## Ricordi — Cucina

### `foglio_ricetta` (minore, +1)
*Hotspot: un foglio ingiallito con la ricetta dei tortellini, scritta a
mano da Nonna Ines, con una macchia di brodo proprio sopra una data
cerchiata.*

La data e il 12 luglio, ventitre anni fa. Sotto, una parola e stata
cancellata cosi tante volte che la carta si e bucata. Michela non
riesce a leggerla, ma il gesto di cancellarla le sembra piu vecchio di
lei.

### `videocassetta` (maggiore, +2)
*Hotspot: una vecchia videocassetta VHS etichettata "Festa 12/7", dentro
un mobile con ancora sopra il televisore a tubo catodico.*

Il video mostra Michela che spegne le candeline, Costanza che applaude
fuori campo. Per un solo fotogramma la telecamera trema e il viso di
Michela sembra piu vecchio, stanco, e guarda dritto nell'obiettivo —
come se sapesse che un giorno l'avrebbe riguardato.

---

## Ricordi — Camera di Costanza
*(sbloccata automaticamente entrando in Cucina, nessuna soglia)*

### `diario_costanza` (maggiore, +2)
*Hotspot: un diario con la copertina a fiori, sul comodino, ancora
aperto all'ultima pagina scritta.*

La calligrafia da bambina di sette anni scrive in fretta, tagliando le
parole a meta. "Michela oggi si e arrabbiata di nuovo, non sembrava
lei. La mamma dice che a volte esce e torna un'altra persona. Non lo
dico a nessuno perche ho paura che se lo dico diventa vero."

### `disegno_parete` (minore, +1)
*Hotspot: un disegno a matita attaccato alla parete con lo scotch —
due bambine che si tengono per mano sotto un sole giallo.*

Una delle due figure e stata ridisegnata piu e piu volte, le linee
sovrapposte, come se chi disegnava non riuscisse a decidere che faccia
darle. L'altra bambina, invece, e sempre identica — sempre la stessa,
sempre ferma.

---

## Ricordi — Salotto

### `poltrona_babbo` (minore, +1)
*Hotspot: la poltrona di Renzo, ancora con l'impronta del suo corpo
nella seduta consumata, di fronte alla tivu sempre sintonizzata su
Rai Storia.*

Michela non ricorda piu la voce di suo padre di quell'estate — solo il
rumore di una porta che sbatteva, piu e piu volte, la sera della festa.
Nessuno le ha mai detto perche.

### `radio_lucio_dalla` (minore, +1)
*Hotspot: una vecchia radio a transistor sul mobile, sintonizzata su
una stazione locale bolognese.*

Suonava sempre Lucio Dalla, quell'estate. Babbo Renzo diceva che
"Bologna senza Dalla non e piu Bologna" — una frase che ripeteva con lo
stesso tono con cui evitava di rispondere alle domande su Costanza.

---

## Ricordi — Soffitta
*(sblocco: profondita >= 10 e ricordo `videocassetta` raccolto)*

### `lettera_dottore` (maggiore, +2)
*Hotspot: una lettera mai spedita, in una scatola di scarpe piena di
fotografie non sviluppate.*

"Gentile Signora Ines, riguardo agli episodi di sua nipote Michela..."
La lettera del dottor Fantini parla di "assenze" e "stati dissociativi"
mai raccontati a Michela — tenuti nascosti come si tiene nascosta una
crepa dietro un mobile spostato apposta.

### `scatola_polaroid` (minore, +1)
*Hotspot: una scatola di fotografie Polaroid non sviluppate del tutto,
sbiadite ai bordi.*

Una foto mostra Michela che tiene per il polso — non per mano — sua
sorella, vicino al fiume. Lo sguardo di Costanza non e verso
l'obiettivo, ma verso il Reno alle spalle di Michela.

---

## Ricordi — Osteria (chiusa)
*(sblocco: profondita >= 6)*

### `bancone_osteria` (minore, +1)
*Hotspot: il bancone di legno, polveroso, con ancora sopra un bicchiere
mai lavato e un biglietto della festa dell'Unita, mai staccato dal
tavolo.*

"Festa de l'Unita — Quartiere Cirenaica — 12 luglio". Nessuno in
famiglia ha mai voluto buttare quel biglietto, ma nessuno l'ha mai
nemmeno guardato in faccia.

### `specchio_incrinato` (maggiore, +2)
*Hotspot: uno specchio incrinato dietro il bancone, che riflette la
stanza in due meta leggermente disallineate.*

Per un istante, il riflesso di Michela non si muove insieme a lei. Poi
torna normale. O forse non si era mai mosso, ed e lei che ha smesso di
fidarsi di quello che vede.

---

## Ricordo finale — Il Reno
*(sblocco: profondita >= 15, ricordi `lettera_dottore` e
`diario_alternativo` entrambi raccolti)*

### `diario_alternativo` (maggiore, +2, trovato in Soffitta ma leggibile
solo dopo aver visto `lettera_dottore`)
*Hotspot: un secondo diario, nascosto sotto un'asse del pavimento della
soffitta, scritto con una grafia piu dura, piu adulta della calligrafia
di Michela bambina.*

"Devo proteggerla. Non deve sapere cosa succede quando non ci sono piu
io a decidere. Le cose che ho fatto per tenerla al sicuro la farebbero
scappare, se le sapesse."

### `crollo_pozzo_argine` (maggiore, +2 — memoria finale, sblocca la
sequenza di chiusura)
*Hotspot: l'argine del Reno, dove il legno del vecchio molo cede sotto
i piedi.*

Il ricordo torna tutto insieme: Costanza che urla il suo nome, non per
gioco. Michela le dice di stare zitta perche dentro casa i genitori
litigano di nuovo, le voci che non si fermano mai. Poi il buio — quello
che il dottor Fantini chiamava "l'assenza". Quando Michela torna in se,
Costanza non c'e piu, e qualcun altro nella sua testa ha gia scritto
un'altra versione: ero in cucina, non ho visto niente. Per ventitre
anni ci ha creduto anche lei.

---

## Sequenza di chiusura (Osteria, specchio)

Non e una stanza nuova, ma una sovrapposizione alla scena dell'Osteria
gia visitata, che si attiva subito dopo `crollo_pozzo_argine`.

Tre voci, in sequenza, testo a comparsa riga per riga al click:

1. *"Non sono un mostro. Sono quello che e rimasto quando lei non
   riusciva piu a restare."*
2. *"Io ho portato il peso per ventitre anni, cosi che il resto di voi
   potesse continuare a respirare."*
3. *(la voce di Michela, finalmente una sola)* — *"Va bene. Adesso lo
   portiamo insieme."*

Schermata finale: Michela che chiama il dottor Fantini, non per
raccontare tutto subito, ma per dire che e pronta a ricominciare a
ricordare, un pezzo alla volta. Bottone "Ricomincia".

---

## Conteggio profondita (verifica)

- Minori (+1): swing_portico, sfoglina_corridoio, foglio_ricetta,
  disegno_parete, poltrona_babbo, radio_lucio_dalla, scatola_polaroid,
  bancone_osteria -> 8 ricordi x 1 = 8
- Maggiori (+2): videocassetta, diario_costanza, lettera_dottore,
  specchio_incrinato, diario_alternativo, crollo_pozzo_argine -> 6
  ricordi x 2 = 12
- **Totale profondita massima: 20**

Soglie: Osteria a 6, Soffitta a 10, Reno a 15 — tutte raggiungibili
prima di aver esaurito tutti i ricordi, cosi il giocatore ha margine
per esplorare con calma senza sentirsi bloccato da un conteggio troppo
rigido.
