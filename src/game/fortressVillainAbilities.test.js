import { describe, it, expect } from 'vitest';
import { spreadVermin, enterNightAllPlayers, resolveNightEnd } from './phases.js';
import { useLocationActionAction } from './actions.js';

function makeLocation(id, name, slots = 3, overrides = {}) {
  return { id, name, type: 'location', slots, ...overrides };
}

function makePlayer(overrides = {}) {
  return {
    action: null,
    bag: ['mouse', 'mouse', 'food'],
    band: [],
    bustCount: 0,
    busted: false,
    tableau: [],
    placements: {},
    abilityPlacements: {},
    champion: { id: 'champ-1', name: 'Champion', tableauSlots: 5, abilities: [] },
    nightReturns: 0,
    actionsUsed: 0,
    passed: false,
    currentLocation: null,
    drawBonuses: { power: 0, bagAdds: [], messages: [] },
    helpBand: [],
    helpBustCount: 0,
    helpBusted: false,
    ...overrides,
  };
}

function makeState(overrides = {}) {
  return {
    phase: 'day',
    day: 1,
    conquest: 2,
    playerCount: 1,
    activePlayerIndex: 0,
    helpPhase: false,
    gameResult: null,
    adventureRow: [],
    adventureDeck: [],
    discoveredLocations: [],
    cardSlots: {},
    horde: { fortress: null, villain: null, fortressCleared: false, fortressDeck: [] },
    message: '',
    players: [makePlayer()],
    ...overrides,
  };
}

// ── Cluny Siege Engine ─────────────────────────────

describe('Cluny Siege Engine', () => {
  const clunyFortress = { id: 'fort-cluny-siege', name: 'Cluny Siege Engine', type: 'fortress', slots: 4, startingVermin: 4 };

  it('adds +1 conquest when spreadVermin overflows and fortress is active', () => {
    const loc = makeLocation('loc-1', 'Place', 0, { verminLimit: 0 });
    const s = makeState({
      adventureRow: [loc],
      horde: { fortress: clunyFortress, villain: null, fortressCleared: false, fortressDeck: [] },
    });
    const result = spreadVermin(s, 1);
    // Normal overflow = 1, plus Cluny bonus = 2
    expect(result.conquestDelta).toBe(2);
    expect(result.log).toContain('Cluny Siege Engine: +1 conquest');
  });

  it('does not add bonus when fortress is cleared', () => {
    const loc = makeLocation('loc-1', 'Place', 0, { verminLimit: 0 });
    const s = makeState({
      adventureRow: [loc],
      horde: { fortress: clunyFortress, villain: null, fortressCleared: true, fortressDeck: [] },
    });
    const result = spreadVermin(s, 1);
    expect(result.conquestDelta).toBe(1);
  });

  it('does not add bonus when there is no overflow', () => {
    const loc = makeLocation('loc-1', 'Place', 3);
    const s = makeState({
      adventureRow: [loc],
      horde: { fortress: clunyFortress, villain: null, fortressCleared: false, fortressDeck: [] },
    });
    const result = spreadVermin(s, 1);
    expect(result.conquestDelta).toBe(0);
  });

  it('adds +1 conquest on card removal in resolveNightEnd', () => {
    const loc = makeLocation('loc-1', 'Old Road');
    const s = makeState({
      phase: 'night',
      conquest: 2,
      adventureRow: [loc],
      adventureDeck: [],
      cardSlots: { 'loc-1': [{ type: 'vermin' }] },
      horde: { fortress: clunyFortress, villain: null, fortressCleared: false, fortressDeck: [] },
      players: [makePlayer({ nightReturns: 0, actionsUsed: 0, passed: false })],
    });
    const result = resolveNightEnd(s);
    // 1 vermin on card + 1 cluny bonus = conquest +2
    expect(result.conquest).toBe(4);
    expect(result.message).toContain('Cluny Siege Engine');
  });

  it('no bonus on card removal when fortress is cleared', () => {
    const loc = makeLocation('loc-1', 'Old Road');
    const s = makeState({
      phase: 'night',
      conquest: 2,
      adventureRow: [loc],
      adventureDeck: [],
      cardSlots: { 'loc-1': [{ type: 'vermin' }] },
      horde: { fortress: clunyFortress, villain: null, fortressCleared: true, fortressDeck: [] },
      players: [makePlayer({ nightReturns: 0, actionsUsed: 0, passed: false })],
    });
    const result = resolveNightEnd(s);
    // Just the 1 vermin, no bonus
    expect(result.conquest).toBe(3);
  });
});

// ── Marsh Bridge ───────────────────────────────────

describe('Marsh Bridge', () => {
  const marshFortress = { id: 'fort-marsh-bridge', name: 'Marsh Bridge', type: 'fortress', slots: 3, startingVermin: 3 };

  it('adds 1 vermin to the weakest location during night', () => {
    const loc1 = makeLocation('loc-1', 'Place A');
    const loc2 = makeLocation('loc-2', 'Place B');
    const s = makeState({
      conquest: 0,
      adventureRow: [loc1, loc2],
      cardSlots: {
        'loc-1': [{ type: 'vermin' }, { type: 'vermin' }],
        'loc-2': [],
      },
      horde: { fortress: marshFortress, villain: null, fortressCleared: false, fortressDeck: [] },
      players: [makePlayer({ band: [] })],
    });
    const result = enterNightAllPlayers(s);
    // loc-2 had 0 vermin (weakest), should get +1 from Marsh Bridge
    expect(result.message).toContain('Marsh Bridge');
    expect(result.message).toContain('Place B');
    expect(result.message).toContain('weakest');
  });

  it('does not add vermin when fortress is cleared', () => {
    const loc = makeLocation('loc-1', 'Place A');
    const s = makeState({
      conquest: 0,
      adventureRow: [loc],
      cardSlots: {},
      horde: { fortress: marshFortress, villain: null, fortressCleared: true, fortressDeck: [] },
      players: [makePlayer({ band: [] })],
    });
    const result = enterNightAllPlayers(s);
    expect(result.message).not.toContain('Marsh Bridge');
  });

  it('reports full when weakest location is at capacity', () => {
    const loc = makeLocation('loc-1', 'Tiny', 1, { verminLimit: 1 });
    const s = makeState({
      conquest: 0,
      adventureRow: [loc],
      cardSlots: { 'loc-1': [{ type: 'vermin' }] },
      horde: { fortress: marshFortress, villain: null, fortressCleared: false, fortressDeck: [] },
      players: [makePlayer({ band: [] })],
    });
    const result = enterNightAllPlayers(s);
    expect(result.message).toContain('full');
  });
});

// ── Tsarmina ───────────────────────────────────────

describe('Tsarmina', () => {
  const tsarmina = { id: 'vil-tsarmina', name: 'Tsarmina', type: 'villain', slots: 5, startingVermin: 5 };

  it('adds 1 vermin to every quest card during night', () => {
    const loc1 = makeLocation('loc-1', 'Place A');
    const loc2 = makeLocation('loc-2', 'Place B');
    const s = makeState({
      conquest: 0,
      adventureRow: [loc1],
      discoveredLocations: [loc2],
      cardSlots: {},
      horde: { fortress: null, villain: tsarmina, fortressCleared: false, fortressDeck: [] },
      players: [makePlayer({ band: [] })],
    });
    const result = enterNightAllPlayers(s);
    expect(result.message).toContain('Tsarmina');
    expect(result.message).toContain('every quest');
    // Both locations should have gotten vermin from Tsarmina
    const loc1Vermin = (result.cardSlots['loc-1'] ?? []).filter(c => c.type === 'vermin').length;
    const loc2Vermin = (result.cardSlots['loc-2'] ?? []).filter(c => c.type === 'vermin').length;
    expect(loc1Vermin).toBeGreaterThanOrEqual(1);
    expect(loc2Vermin).toBeGreaterThanOrEqual(1);
  });

  it('respects vermin limits and does not overflow', () => {
    const loc = makeLocation('loc-1', 'Tiny', 1, { verminLimit: 1 });
    const s = makeState({
      conquest: 0,
      adventureRow: [loc],
      cardSlots: { 'loc-1': [{ type: 'vermin' }] },
      horde: { fortress: null, villain: tsarmina, fortressCleared: false, fortressDeck: [] },
      players: [makePlayer({ band: [] })],
    });
    const result = enterNightAllPlayers(s);
    // Location already at limit, Tsarmina should report full
    expect(result.message).toContain('full');
    const verminCount = result.cardSlots['loc-1'].filter(c => c.type === 'vermin').length;
    expect(verminCount).toBe(1);
  });

  it('does not add conquest (unlike old implementation)', () => {
    const loc = makeLocation('loc-1', 'Place');
    const s = makeState({
      conquest: 3,
      adventureRow: [loc],
      cardSlots: {},
      horde: { fortress: null, villain: tsarmina, fortressCleared: false, fortressDeck: [] },
      players: [makePlayer({ band: [] })],
    });
    const result = enterNightAllPlayers(s);
    // Tsarmina should NOT add +1 conquest directly
    // Conquest may only change from vermin spawn overflow, not from Tsarmina's ability
    expect(result.message).not.toContain('+1 conquest');
  });
});

// ── Salamandastron ─────────────────────────────────

describe('Salamandastron combat reduction', () => {
  it('reduces verminAdded by 1 when combat starts at Salamandastron', () => {
    const salamandastron = makeLocation('loc-salamandastron', 'Salamandastron', 3, { verminLimit: 4 });
    const s = makeState({
      discoveredLocations: [salamandastron],
      cardSlots: { 'loc-salamandastron': [{ type: 'vermin' }, { type: 'vermin' }] },
      players: [makePlayer()],
    });
    const result = useLocationActionAction(s, 'loc-salamandastron');
    const p = result.players[0];
    expect(p.action.verminAdded).toBe(1); // 2 vermin - 1 reduction = 1
    expect(result.message).toContain('Draw at least 1');
    expect(result.message).toContain('Salamandastron reduces');
  });

  it('does not reduce below 0', () => {
    const salamandastron = makeLocation('loc-salamandastron', 'Salamandastron', 3, { verminLimit: 4 });
    const s = makeState({
      discoveredLocations: [salamandastron],
      cardSlots: { 'loc-salamandastron': [{ type: 'vermin' }] },
      players: [makePlayer()],
    });
    const result = useLocationActionAction(s, 'loc-salamandastron');
    const p = result.players[0];
    expect(p.action.verminAdded).toBe(0); // 1 vermin - 1 reduction = 0, not negative
  });

  it('does not apply reduction to other locations', () => {
    const loc = makeLocation('loc-other', 'Other Place');
    const s = makeState({
      discoveredLocations: [loc],
      cardSlots: { 'loc-other': [{ type: 'vermin' }, { type: 'vermin' }] },
      players: [makePlayer()],
    });
    const result = useLocationActionAction(s, 'loc-other');
    const p = result.players[0];
    expect(p.action.verminAdded).toBe(2); // No reduction
  });
});
