/**
 * memories.js — the actual narrative content: memory text, label, depth
 * cost, and whether a memory ends the game. Mirrors docs/narrative.md
 * exactly; that file is for humans planning/editing the story, this one
 * is what the game actually reads at runtime.
 *
 * state.js derives MEMORY_DEPTH_COST from this file instead of keeping
 * its own copy, so there's exactly one place to edit a memory's cost.
 */

export const MEMORIES = {
  swing_portico: {
    label: "L'altalena arrugginita",
    cost: 1,
    text: `L'altalena cigola ancora, anche senza vento. Michela ricorda Costanza che gridava "spingimi più forte, dai, non sono di vetro" — una frase che diceva sempre, come se sapesse già che un giorno qualcuno avrebbe avuto paura di romperla.`,
  },

  sfoglina_corridoio: {
    label: 'La sfoglina, fuori posto',
    cost: 1,
    text: `La nonna la sposta sempre nella stanza dove sta di più, come un totem. "Finché c'è la sfoglina in casa, c'è ancora una famiglia" diceva. Non ha mai spiegato cosa succede quando la sfoglina si ferma.`,
  },

  foglio_ricetta: {
    label: 'Il foglio con la ricetta',
    cost: 1,
    text: `La data è il 12 luglio, ventitré anni fa. Sotto, una parola è stata cancellata così tante volte che la carta si è bucata. Michela non riesce a leggerla, ma il gesto di cancellarla le sembra più vecchio di lei.`,
  },

  videocassetta: {
    label: 'La videocassetta "Festa 12/7"',
    cost: 2,
    text: `Il video mostra Michela che spegne le candeline, Costanza che applaude fuori campo. Per un solo fotogramma la telecamera trema e il viso di Michela sembra più vecchio, stanco, e guarda dritto nell'obiettivo — come se sapesse che un giorno l'avrebbe riguardato.`,
  },

  diario_costanza: {
    label: 'Il diario sul comodino',
    cost: 2,
    text: `La calligrafia da bambina di sette anni scrive in fretta, tagliando le parole a metà. "Michela oggi si è arrabbiata di nuovo, non sembrava lei. La mamma dice che a volte esce e torna un'altra persona. Non lo dico a nessuno perché ho paura che se lo dico diventa vero."`,
  },

  disegno_parete: {
    label: 'Il disegno sulla parete',
    cost: 1,
    text: `Una delle due figure è stata ridisegnata più e più volte, le linee sovrapposte, come se chi disegnava non riuscisse a decidere che faccia darle. L'altra bambina, invece, è sempre identica — sempre la stessa, sempre ferma.`,
  },

  poltrona_babbo: {
    label: 'La poltrona di Renzo',
    cost: 1,
    text: `Michela non ricorda più la voce di suo padre di quell'estate — solo il rumore di una porta che sbatteva, più e più volte, la sera della festa. Nessuno le ha mai detto perché.`,
  },

  radio_lucio_dalla: {
    label: 'La radio a transistor',
    cost: 1,
    text: `Suonava sempre Lucio Dalla, quell'estate. Babbo Renzo diceva che "Bologna senza Dalla non è più Bologna" — una frase che ripeteva con lo stesso tono con cui evitava di rispondere alle domande su Costanza.`,
  },

  lettera_dottore: {
    label: 'La lettera mai spedita',
    cost: 2,
    text: `"Gentile Signora Ines, riguardo agli episodi di sua nipote Michela..." La lettera del dottor Fantini parla di "assenze" e "stati dissociativi" mai raccontati a Michela — tenuti nascosti come si tiene nascosta una crepa dietro un mobile spostato apposta.`,
  },

  scatola_polaroid: {
    label: 'La scatola di Polaroid',
    cost: 1,
    text: `Una foto mostra Michela che tiene per il polso — non per mano — sua sorella, vicino al fiume. Lo sguardo di Costanza non è verso l'obiettivo, ma verso il Reno alle spalle di Michela.`,
  },

  bancone_osteria: {
    label: 'Il bancone di legno',
    cost: 1,
    text: `"Festa de l'Unità — Quartiere Cirenaica — 12 luglio". Nessuno in famiglia ha mai voluto buttare quel biglietto, ma nessuno l'ha mai nemmeno guardato in faccia.`,
  },

  specchio_incrinato: {
    label: 'Lo specchio incrinato',
    cost: 2,
    text: `Per un istante, il riflesso di Michela non si muove insieme a lei. Poi torna normale. O forse non si era mai mosso, ed è lei che ha smesso di fidarsi di quello che vede.`,
  },

  diario_alternativo: {
    label: "L'asse del pavimento sollevata",
    cost: 2,
    text: `"Devo proteggerla. Non deve sapere cosa succede quando non ci sono più io a decidere. Le cose che ho fatto per tenerla al sicuro la farebbero scappare, se le sapesse."`,
  },

  crollo_pozzo_argine: {
    label: "Il vecchio molo sull'argine",
    cost: 2,
    isEnding: true,
    text: `Il ricordo torna tutto insieme: Costanza che urla il suo nome, non per gioco. Michela le dice di stare zitta perché dentro casa i genitori litigano di nuovo, le voci che non si fermano mai. Poi il buio — quello che il dottor Fantini chiamava "l'assenza". Quando Michela torna in sé, Costanza non c'è più, e qualcun altro nella sua testa ha già scritto un'altra versione: ero in cucina, non ho visto niente. Per ventitré anni ci ha creduto anche lei.`,
  },
};

export function getMemory(memoryId) {
  const memory = MEMORIES[memoryId];
  if (!memory) console.warn(`getMemory: unknown memory id "${memoryId}"`);
  return memory ?? null;
}

/** { memoryId: cost } — used by state.js instead of duplicating costs. */
export function getMemoryDepthCosts() {
  return Object.fromEntries(
    Object.entries(MEMORIES).map(([id, m]) => [id, m.cost])
  );
}

/** The memory id that triggers the closing sequence, derived from the data
 * instead of hardcoded separately — there should only ever be one. */
export function getEndingMemoryId() {
  const entry = Object.entries(MEMORIES).find(([, m]) => m.isEnding);
  return entry ? entry[0] : null;
}
