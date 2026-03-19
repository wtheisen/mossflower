import { CRITTER_TYPES } from './constants';

/** Expand a critters map like { mouse: 2, squirrel: 1 } into [{type:'mouse'},{type:'mouse'},{type:'squirrel'}] */
export function expandCritters(critters) {
  if (!critters) return [];
  const result = [];
  for (const [type, count] of Object.entries(critters)) {
    for (let i = 0; i < count; i++) result.push({ type });
  }
  return result;
}

/** Build initial cardSlots for adventure row heroes (pre-filled with critters) */
export function initCardSlots(adventureRow) {
  const slots = {};
  for (const card of adventureRow) {
    if (card.type === 'hero' && card.critters) {
      slots[card.id] = expandCritters(card.critters);
    }
  }
  return slots;
}

/** Count combat strength from a list of cube type strings. Badgers count as 2. */
export function combatStrength(cubes) {
  let strength = 0;
  for (const c of cubes) {
    if (c === 'badger') strength += 2;
    else if (CRITTER_TYPES.has(c)) strength += 1;
  }
  return strength;
}

/** Count vermin in a list of cube type strings. */
export function countVermin(cubes) {
  return cubes.filter((c) => c === 'vermin').length;
}

export function getActivePlayer(s) {
  return s.players[s.activePlayerIndex];
}

export function patchActivePlayer(s, patch) {
  const players = [...s.players];
  players[s.activePlayerIndex] = { ...players[s.activePlayerIndex], ...patch };
  return { ...s, players };
}

export function patchPlayer(s, playerIndex, patch) {
  const players = [...s.players];
  players[playerIndex] = { ...players[playerIndex], ...patch };
  return { ...s, players };
}
