/**
 * items.js — gli oggetti raccoglibili (inventario minimale).
 *
 * Un item non è un ricordo: non ha testo narrativo né costo di
 * profondità. Serve solo ad aprire qualcosa da un'altra parte
 * (videocassetta, porta sul retro). Le regole "cosa richiede cosa"
 * vivono in rooms.js come dati (`requiresItem`, `givesItem`, `itemId`);
 * qui c'è solo l'anagrafica per l'HUD.
 */

export const ITEMS = {
  valvola: { label: 'Valvola di ricambio' },
  chiave: { label: "Chiave dell'osteria" },
};

export function getItemLabel(itemId) {
  return ITEMS[itemId]?.label ?? itemId;
}
