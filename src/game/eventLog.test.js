import { describe, it, expect } from 'vitest';
import { setMessage } from './helpers.js';
import { startRecruitAction, drawCubeAction, confirmRecruitAction, dropCubeAction, endDayAction } from './actions.js';
import { resolveNightEnd, checkGameOver, enterNightAllPlayers } from './phases.js';

// ── setMessage helper ──────────────────────────────

describe('setMessage', () => {
  it('sets message and appends structured log entry', () => {
    const state = { day: 2, phase: 'day', message: null, log: [] };
    const result = setMessage(state, 'Something happened');
    expect(result.message).toBe('Something happened');
    expect(result.log).toEqual([{ day: 2, phase: 'day', message: 'Something happened' }]);
  });

  it('appends to existing log entries', () => {
    const existing = [{ day: 1, phase: 'night', message: 'Old event' }];
    const state = { day: 2, phase: 'dusk', message: null, log: existing };
    const result = setMessage(state, 'New event');
    expect(result.log).toHaveLength(2);
    expect(result.log[0]).toEqual({ day: 1, phase: 'night', message: 'Old event' });
    expect(result.log[1]).toEqual({ day: 2, phase: 'dusk', message: 'New event' });
  });

  it('handles missing log array gracefully', () => {
    const state = { day: 1, phase: 'day', message: null };
    const result = setMessage(state, 'First event');
    expect(result.log).toEqual([{ day: 1, phase: 'day', message: 'First event' }]);
  });

  it('does not mutate the original state', () => {
    const original = { day: 1, phase: 'day', message: null, log: [] };
    setMessage(original, 'Test');
    expect(original.log).toEqual([]);
    expect(original.message).toBeNull();
  });
});

// ── Log accumulation in actions ──────────────────────

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
    players: [makePlayer()],
    message: null,
    log: [],
    ...overrides,
  };
}

describe('log accumulation in actions', () => {
  it('startRecruitAction appends to log', () => {
    const hero = { id: 'hero-1', name: 'Matthias', type: 'hero', cost: 2, affinity: 'mouse' };
    const s = makeState({ adventureRow: [hero] });
    const result = startRecruitAction(s, 'hero-1');
    expect(result.log).toHaveLength(1);
    expect(result.log[0].day).toBe(1);
    expect(result.log[0].phase).toBe('day');
    expect(result.log[0].message).toContain('Recruiting Matthias');
  });

  it('multiple actions accumulate log entries', () => {
    const hero = { id: 'hero-1', name: 'Matthias', type: 'hero', cost: 2, affinity: 'mouse' };
    const s = makeState({ adventureRow: [hero] });

    let result = startRecruitAction(s, 'hero-1');
    expect(result.log).toHaveLength(1);

    // Drawing a cube adds another entry
    result = drawCubeAction(result);
    expect(result.log.length).toBeGreaterThanOrEqual(2);
  });

  it('endDayAction logs when advancing turns in multiplayer', () => {
    const s = makeState({
      playerCount: 2,
      players: [makePlayer(), makePlayer()],
    });
    const result = endDayAction(s);
    // Should log the turn advance message
    expect(result.log.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Log accumulation in phase transitions ──────────

describe('log accumulation in phases', () => {
  it('checkGameOver logs game loss', () => {
    const s = makeState({ conquest: 10, log: [{ day: 1, phase: 'day', message: 'Prior' }] });
    const result = checkGameOver(s);
    expect(result.gameResult).toBe('loss');
    expect(result.log).toHaveLength(2);
    expect(result.log[1].message).toContain('Mossflower has fallen');
  });

  it('resolveNightEnd logs new day message', () => {
    const s = makeState({
      phase: 'night',
      day: 2,
      players: [makePlayer({ band: [], nightReturns: 0, actionsUsed: 0, passed: false })],
    });
    const result = resolveNightEnd(s);
    expect(result.phase).toBe('day');
    expect(result.day).toBe(3);
    const dayEntry = result.log.find((e) => e.message.includes('Day 3'));
    expect(dayEntry).toBeTruthy();
    expect(dayEntry.phase).toBe('day');
  });

  it('enterNightAllPlayers logs night spawn message', () => {
    const loc = { id: 'loc-1', name: 'Cellar', type: 'location', slots: 3 };
    const s = makeState({
      discoveredLocations: [loc],
      cardSlots: {},
      conquest: 2,
      players: [makePlayer({ band: [], nightReturns: 0 })],
    });
    const result = enterNightAllPlayers(s);
    expect(result.phase).toBe('night');
    const nightEntry = result.log.find((e) => e.message.includes('Night'));
    expect(nightEntry).toBeTruthy();
  });
});

// ── Dusk log entries ──────────────────────────────

describe('log in dusk actions', () => {
  it('dropCubeAction logs cube placement on champion', () => {
    const champ = { id: 'champ-1', name: 'Champion', tableauSlots: 5, abilities: [] };
    const s = makeState({
      phase: 'dusk',
      players: [makePlayer({
        champion: champ,
        band: ['mouse'],
        placements: { 'champ-1': [] },
      })],
    });
    const result = dropCubeAction(s, 'champ-1', 0);
    expect(result.log.length).toBeGreaterThanOrEqual(1);
    const entry = result.log.find((e) => e.message.includes('cubes placed') || e.message.includes('Placed mouse'));
    expect(entry).toBeTruthy();
  });
});

// ── Log persists across state shape ──────────────

describe('log in initial state', () => {
  it('buildInitialState includes empty log array', async () => {
    const { buildInitialState } = await import('./setup.js');
    const config = { playerCount: 1, championIds: ['matthias'], villainId: 'vil-cluny' };
    const state = buildInitialState(config);
    expect(state.log).toEqual([]);
  });
});
