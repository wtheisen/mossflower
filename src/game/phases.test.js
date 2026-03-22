import { describe, it, expect } from 'vitest';
import { spreadVermin, startDuskPhase, enterNightAllPlayers } from './phases.js';

function makeLocation(id, name, slots = 3) {
  return { id, name, type: 'location', slots };
}

function makePlayer(overrides = {}) {
  return {
    action: null,
    bag: [],
    band: ['mouse'],
    bustCount: 0,
    busted: false,
    tableau: [],
    placements: {},
    abilityPlacements: {},
    champion: { id: 'champ-1', name: 'Champion', tableauSlots: 5, abilities: [] },
    nightReturns: 0,
    actionsUsed: 2,
    passed: true,
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

describe('spreadVermin', () => {
  it('returns empty log when count is 0', () => {
    const loc = makeLocation('loc-1', 'The Cellar');
    const s = makeState({ discoveredLocations: [loc] });
    const result = spreadVermin(s, 0);
    expect(result.log).toEqual([]);
    expect(result.conquestDelta).toBe(0);
  });

  it('returns empty log when there are no targets', () => {
    const s = makeState();
    const result = spreadVermin(s, 3);
    expect(result.log).toEqual([]);
  });

  it('adds +1 vermin log for a discovered location', () => {
    const loc = makeLocation('cellar-base', 'The Cellar');
    const s = makeState({ discoveredLocations: [loc] });
    const result = spreadVermin(s, 1);
    expect(result.log).toEqual(['The Cellar: +1 vermin']);
    expect(result.cardSlots['cellar-base']).toHaveLength(1);
  });

  it('uses plain name for adventure row card when no duplicate names exist', () => {
    const loc = makeLocation('loc-dungeon', 'The Dungeon');
    const s = makeState({ adventureRow: [loc] });
    const result = spreadVermin(s, 1);
    expect(result.log).toEqual(['The Dungeon: +1 vermin']);
  });

  it('appends (row) to adventure row card name when duplicate names exist', () => {
    const rowLoc = makeLocation('loc-the-cellar', 'The Cellar');
    const discoveredLoc = makeLocation('cellar-base', 'The Cellar');
    const s = makeState({
      adventureRow: [rowLoc],
      discoveredLocations: [discoveredLoc],
    });
    const result = spreadVermin(s, 2);
    expect(result.log).toContain('The Cellar (row): +1 vermin');
    expect(result.log).toContain('The Cellar: +1 vermin');
  });

  it('disambiguates worker-absorbed-vermin messages too', () => {
    const rowLoc = makeLocation('loc-the-cellar', 'The Cellar');
    const discoveredLoc = makeLocation('cellar-base', 'The Cellar');
    const s = makeState({
      adventureRow: [rowLoc],
      discoveredLocations: [discoveredLoc],
      cardSlots: { 'loc-the-cellar': [{ type: 'mouse' }] },
    });
    const result = spreadVermin(s, 1);
    expect(result.log[0]).toContain('The Cellar (row): worker');
  });

  it('disambiguates vermin overflow messages', () => {
    const rowLoc = makeLocation('loc-the-cellar', 'The Cellar', 0);
    rowLoc.verminLimit = 0;
    const discoveredLoc = makeLocation('cellar-base', 'The Cellar');
    const s = makeState({
      adventureRow: [rowLoc],
      discoveredLocations: [discoveredLoc],
    });
    const result = spreadVermin(s, 1);
    expect(result.log[0]).toBe('The Cellar (row): vermin overflow');
    expect(result.conquestDelta).toBe(1);
  });

  it('round-robins vermin across multiple targets', () => {
    const a = makeLocation('loc-a', 'Loc A');
    const b = makeLocation('loc-b', 'Loc B');
    const s = makeState({ discoveredLocations: [a, b] });
    const result = spreadVermin(s, 4);
    expect(result.cardSlots['loc-a']).toHaveLength(2);
    expect(result.cardSlots['loc-b']).toHaveLength(2);
  });

  it('does not mutate original cardSlots', () => {
    const loc = makeLocation('loc-1', 'Place');
    const original = {};
    const s = makeState({ discoveredLocations: [loc], cardSlots: original });
    spreadVermin(s, 1);
    expect(original['loc-1']).toBeUndefined();
  });
});

describe('enterNightAllPlayers', () => {
  it('includes night spawn info in message without a villain', () => {
    const s = makeState({ conquest: 2 });
    const result = enterNightAllPlayers(s);
    expect(result.message).toContain('Night: spawned 2 vermin');
    expect(result.conquest).toBe(2);
  });

  it('includes villain message and adjusts conquest (Cluny +1)', () => {
    const s = makeState({
      conquest: 2,
      horde: { fortress: null, villain: { id: 'vil-cluny', name: 'Cluny the Scourge' }, fortressCleared: false, fortressDeck: [] },
    });
    const result = enterNightAllPlayers(s);
    expect(result.message).toContain('Cluny the Scourge: +1 conquest.');
    expect(result.conquest).toBe(3);
  });

  it('does not show pre-villain conquest count in villain message', () => {
    const s = makeState({
      conquest: 2,
      horde: { fortress: null, villain: { id: 'vil-cluny', name: 'Cluny the Scourge' }, fortressCleared: false, fortressDeck: [] },
    });
    const result = enterNightAllPlayers(s);
    expect(result.conquest).toBe(3);
  });

  it('sets phase to night and resets nightReturns', () => {
    const s = makeState({ players: [makePlayer({ nightReturns: 3 })] });
    const result = enterNightAllPlayers(s);
    expect(result.phase).toBe('night');
    expect(result.players[0].nightReturns).toBe(0);
  });
});

describe('startDuskPhase', () => {
  describe('single player', () => {
    it('preserves the existing message (e.g. combat result) when entering dusk', () => {
      const combatMsg = 'Victory at Dark Forest! Power 3 vs 2 vermin. Overkill 1 → conquest -1 (now 1).';
      const s = makeState({ message: combatMsg });
      const result = startDuskPhase(s);
      expect(result.phase).toBe('dusk');
      expect(result.message).toBe(combatMsg);
    });

    it('sets phase to dusk', () => {
      const s = makeState({ message: 'Day 1 begins.' });
      const result = startDuskPhase(s);
      expect(result.phase).toBe('dusk');
    });

    it('skips players with empty band and uses first with cubes', () => {
      const s = makeState({
        playerCount: 1,
        players: [makePlayer({ band: ['mouse'] })],
        message: 'some message',
      });
      const result = startDuskPhase(s);
      expect(result.activePlayerIndex).toBe(0);
      expect(result.phase).toBe('dusk');
    });
  });

  describe('multi player', () => {
    it('sets player-specific dusk message', () => {
      const s = makeState({
        playerCount: 2,
        players: [makePlayer(), makePlayer()],
        message: 'Victory at X!',
      });
      const result = startDuskPhase(s);
      expect(result.phase).toBe('dusk');
      expect(result.message).toContain('Player 1');
      expect(result.message).toContain('place your cubes');
    });

    it('uses first player with band cubes', () => {
      const s = makeState({
        playerCount: 2,
        players: [makePlayer({ band: [] }), makePlayer({ band: ['mouse'] })],
        message: 'some message',
      });
      const result = startDuskPhase(s);
      expect(result.activePlayerIndex).toBe(1);
      expect(result.message).toContain('Player 2');
    });
  });
});
