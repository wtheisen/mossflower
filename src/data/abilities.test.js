import { describe, it, expect } from 'vitest';
import { ABILITIES, calculatePower, getVerminReduction, getCombatWinFood } from '../game/abilities.js';

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

describe('great-hall-base', () => {
  it('adds 1 food to band', () => {
    const ctx = mockCtx();
    ABILITIES['great-hall-base'].onAction(ctx);
    expect(ctx._band).toEqual(['food']);
    expect(ctx._message).toContain('Great Hall');
  });
});

describe('cellar-base', () => {
  it('adds 1 food to band', () => {
    const ctx = mockCtx();
    ABILITIES['cellar-base'].onAction(ctx);
    expect(ctx._band).toEqual(['food']);
  });

  it('sets a message mentioning The Cellar', () => {
    const ctx = mockCtx();
    ABILITIES['cellar-base'].onAction(ctx);
    expect(ctx._message).toContain('The Cellar');
  });
});

describe('redwall-infirmary', () => {
  it('removes all wounds from band', () => {
    const ctx = mockCtx();
    ctx.addToBand('wound');
    ctx.addToBand('wound');
    ctx.addToBand('mouse');
    ABILITIES['redwall-infirmary'].onAction(ctx);
    expect(ctx._band).not.toContain('wound');
    expect(ctx._message).toContain('2 wound(s)');
  });

  it('reports no wounds when band is clean', () => {
    const ctx = mockCtx();
    ABILITIES['redwall-infirmary'].onAction(ctx);
    expect(ctx._message).toContain('No wounds');
  });
});

describe('hero-redwall-sentry combatBonus', () => {
  const ability = ABILITIES['hero-redwall-sentry'];

  it('returns 0 with no mice', () => {
    expect(ability.combatBonus([{ type: 'squirrel' }])).toBe(0);
  });

  it('counts mice only', () => {
    const placements = [{ type: 'mouse' }, { type: 'mouse' }, { type: 'food' }];
    expect(ability.combatBonus(placements)).toBe(2);
  });
});

describe('hero-guerilla-scout combatVerminReduction', () => {
  const ability = ABILITIES['hero-guerilla-scout'];

  it('returns 0 with no squirrels', () => {
    expect(ability.combatVerminReduction([{ type: 'mouse' }])).toBe(0);
  });

  it('counts squirrels only', () => {
    const placements = [{ type: 'squirrel' }, { type: 'squirrel' }, { type: 'mouse' }];
    expect(ability.combatVerminReduction(placements)).toBe(2);
  });
});

describe('hero-squirrel-1 onCombatWin', () => {
  const ability = ABILITIES['hero-squirrel-1'];

  it('returns squirrel count', () => {
    const placements = [{ type: 'squirrel' }, { type: 'mouse' }, { type: 'squirrel' }];
    expect(ability.onCombatWin(placements)).toBe(2);
  });

  it('returns 0 with no squirrels', () => {
    expect(ability.onCombatWin([{ type: 'food' }])).toBe(0);
  });
});

describe('calculatePower / getVerminReduction / getCombatWinFood use merged ABILITIES', () => {
  function makePlayer(placements = {}) {
    return {
      band: [],
      champion: { abilities: [] },
      abilityPlacements: {},
      placements,
    };
  }

  it('calculatePower adds combatBonus from hero-redwall-sentry', () => {
    const player = makePlayer({ 'hero-redwall-sentry': [{ type: 'mouse' }, { type: 'mouse' }] });
    // base power = 0 (empty band), bonus = 2 mice
    expect(calculatePower(player)).toBe(2);
  });

  it('getVerminReduction sums combatVerminReduction', () => {
    const player = makePlayer({ 'hero-guerilla-scout': [{ type: 'squirrel' }] });
    expect(getVerminReduction(player)).toBe(1);
  });

  it('getCombatWinFood sums onCombatWin bonuses', () => {
    const player = makePlayer({ 'hero-squirrel-1': [{ type: 'squirrel' }, { type: 'squirrel' }] });
    expect(getCombatWinFood(player)).toBe(2);
  });
});
