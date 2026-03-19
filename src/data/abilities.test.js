import { describe, it, expect, vi } from 'vitest';
import { ABILITIES } from './abilities.js';

/** Create a mock ctx matching the ability context interface. */
function mockCtx({ bag = [] } = {}) {
  const band = [];
  let message = '';
  const bagCopy = [...bag];

  return {
    state: {},
    addToBand(type) { band.push(type); },
    removeFromBand(type) {
      const idx = band.indexOf(type);
      if (idx === -1) return false;
      band.splice(idx, 1);
      return true;
    },
    addToBag(type) { bagCopy.push(type); },
    removeFromBag(type) {
      const idx = bagCopy.indexOf(type);
      if (idx === -1) return false;
      bagCopy.splice(idx, 1);
      return true;
    },
    drawFromBag() {
      if (bagCopy.length === 0) return null;
      const cube = bagCopy.shift();
      band.push(cube);
      return cube;
    },
    setMessage(msg) { message = msg; },
    // Helpers for assertions
    _band: band,
    _bag: bagCopy,
    get _message() { return message; },
  };
}

describe('loc-mossflower-border', () => {
  const ability = ABILITIES['loc-mossflower-border'];

  it('has an onAction', () => {
    expect(ability.onAction).toBeDefined();
  });

  it('draws 1 cube from bag', () => {
    const ctx = mockCtx({ bag: ['mouse'] });
    ability.onAction(ctx);
    expect(ctx._band).toEqual(['mouse']);
    expect(ctx._message).toBe('Mossflower Border: Drew mouse.');
  });

  it('reports empty bag', () => {
    const ctx = mockCtx({ bag: [] });
    ability.onAction(ctx);
    expect(ctx._band).toEqual([]);
    expect(ctx._message).toBe('Mossflower Border: Bag is empty.');
  });

  it('draws only 1 cube even if bag has multiple', () => {
    const ctx = mockCtx({ bag: ['squirrel', 'food', 'mouse'] });
    ability.onAction(ctx);
    expect(ctx._band).toHaveLength(1);
    expect(ctx._bag).toHaveLength(2);
  });
});

describe('useVeteranAbility is removed from hook exports', () => {
  it('ABILITIES still has hero-salamandastron-veteran with canRemoveVermin', () => {
    const vet = ABILITIES['hero-salamandastron-veteran'];
    expect(vet.canRemoveVermin).toBeDefined();
    expect(vet.canRemoveVermin([
      { type: 'mouse' }, { type: 'mouse' }, { type: 'squirrel' },
    ])).toBe(1);
  });
});

describe('loc-great-hall draws 2 cubes (reference pattern)', () => {
  it('draws 2 cubes', () => {
    const ctx = mockCtx({ bag: ['mouse', 'food'] });
    ABILITIES['loc-great-hall'].onAction(ctx);
    expect(ctx._band).toEqual(['mouse', 'food']);
  });
});
