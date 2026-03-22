import { describe, it, expect } from 'vitest';
import { spreadVermin } from './phases.js';

function makeLocation(id, name, slots = 3) {
  return { id, name, type: 'location', slots };
}

function makeState(overrides = {}) {
  return {
    adventureRow: [],
    discoveredLocations: [],
    cardSlots: {},
    conquest: 0,
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
