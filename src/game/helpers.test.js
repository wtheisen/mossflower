import { describe, it, expect } from 'vitest';
import { findCardById } from './helpers.js';

function makeState({ adventureRow = [], discoveredLocations = [], fortress = null, villain = null } = {}) {
  return {
    adventureRow,
    discoveredLocations,
    horde: { fortress, villain },
  };
}

describe('findCardById', () => {
  it('finds a card in adventureRow', () => {
    const card = { id: 'hero-1', name: 'Matthias' };
    const state = makeState({ adventureRow: [card] });
    expect(findCardById(state, 'hero-1')).toBe(card);
  });

  it('finds a card in discoveredLocations', () => {
    const card = { id: 'loc-1', name: 'Great Hall' };
    const state = makeState({ discoveredLocations: [card] });
    expect(findCardById(state, 'loc-1')).toBe(card);
  });

  it('finds the fortress', () => {
    const fortress = { id: 'fort-1', name: 'Kotir' };
    const state = makeState({ fortress });
    expect(findCardById(state, 'fort-1')).toBe(fortress);
  });

  it('finds the villain', () => {
    const villain = { id: 'villain-1', name: 'Cluny' };
    const state = makeState({ villain });
    expect(findCardById(state, 'villain-1')).toBe(villain);
  });

  it('returns null when id not found', () => {
    const state = makeState({
      adventureRow: [{ id: 'a', name: 'A' }],
      discoveredLocations: [{ id: 'b', name: 'B' }],
      fortress: { id: 'c', name: 'C' },
      villain: { id: 'd', name: 'D' },
    });
    expect(findCardById(state, 'missing')).toBeNull();
  });

  it('returns null when fortress is null and id not found elsewhere', () => {
    const state = makeState({ fortress: null, villain: null });
    expect(findCardById(state, 'fort-1')).toBeNull();
  });

  it('prefers adventureRow over discoveredLocations for the same id', () => {
    const inAdventure = { id: 'loc-1', name: 'Adventure version' };
    const inDiscovered = { id: 'loc-1', name: 'Discovered version' };
    const state = makeState({ adventureRow: [inAdventure], discoveredLocations: [inDiscovered] });
    expect(findCardById(state, 'loc-1')).toBe(inAdventure);
  });
});
