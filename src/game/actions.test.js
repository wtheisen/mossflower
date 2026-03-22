import { describe, it, expect } from 'vitest';
import {
  startRecruitAction,
  drawCubeAction,
  cancelActionAction,
  confirmRecruitAction,
  requestHelpAction,
  helperDrawCubeAction,
  helperDoneAction,
  skipHelpAction,
  endDayAction,
  discardFoodAction,
  returnCubeToBagAction,
  endNightAction,
  forfeitCombatAction,
  startFortressCombatAction,
  startVillainCombatAction,
  resolveCombatAction,
} from './actions.js';

// ── State helpers ──────────────────────────────────

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
    ...overrides,
  };
}

// ── startRecruitAction ──────────────────────────────

describe('startRecruitAction', () => {
  it('sets recruit action when hero is in adventure row', () => {
    const hero = { id: 'hero-1', name: 'Matthias', type: 'hero', cost: 2, affinity: 'mouse' };
    const s = makeState({ adventureRow: [hero] });
    const result = startRecruitAction(s, 'hero-1');
    const p = result.players[0];
    expect(p.action).toEqual({ type: 'recruit', targetId: 'hero-1', cost: 2 });
    expect(p.bustCount).toBe(0);
    expect(p.busted).toBe(false);
    expect(p.currentLocation).toBe('hero-1');
    expect(result.message).toContain('Matthias');
  });

  it('returns s unchanged when card is not a hero', () => {
    const loc = { id: 'loc-1', name: 'Abbey', type: 'location' };
    const s = makeState({ adventureRow: [loc] });
    expect(startRecruitAction(s, 'loc-1')).toBe(s);
  });

  it('returns s unchanged when player already has an action', () => {
    const hero = { id: 'hero-1', name: 'Matthias', type: 'hero', cost: 2, affinity: 'mouse' };
    const s = makeState({
      adventureRow: [hero],
      players: [makePlayer({ action: { type: 'recruit', targetId: 'hero-1' } })],
    });
    expect(startRecruitAction(s, 'hero-1')).toBe(s);
  });

  it('returns s unchanged when game is over', () => {
    const hero = { id: 'hero-1', name: 'Matthias', type: 'hero', cost: 2, affinity: 'mouse' };
    const s = makeState({ adventureRow: [hero], gameResult: 'lose' });
    expect(startRecruitAction(s, 'hero-1')).toBe(s);
  });

  it('returns s unchanged when not in day phase', () => {
    const hero = { id: 'hero-1', name: 'Matthias', type: 'hero', cost: 2, affinity: 'mouse' };
    const s = makeState({ adventureRow: [hero], phase: 'night' });
    expect(startRecruitAction(s, 'hero-1')).toBe(s);
  });

  it('includes hero cost in action object', () => {
    const hero = { id: 'hero-1', name: 'Matthias', type: 'hero', cost: 3, affinity: 'mouse' };
    const s = makeState({ adventureRow: [hero] });
    const result = startRecruitAction(s, 'hero-1');
    expect(result.players[0].action.cost).toBe(3);
  });
});

// ── cancelActionAction ──────────────────────────────

describe('cancelActionAction', () => {
  it('clears action when player has one', () => {
    const s = makeState({
      players: [makePlayer({ action: { type: 'recruit', targetId: 'hero-1' } })],
    });
    const result = cancelActionAction(s);
    expect(result.players[0].action).toBeNull();
    expect(result.message).toBe('Action cancelled.');
  });

  it('returns s unchanged when player has no action', () => {
    const s = makeState();
    expect(cancelActionAction(s)).toBe(s);
  });

  it('emits busted message when player was busted', () => {
    const s = makeState({
      players: [makePlayer({ action: { type: 'recruit', targetId: 'hero-1' }, busted: true, band: ['mouse'] })],
    });
    const result = cancelActionAction(s);
    expect(result.message).toContain('Busted');
  });

  it('returns band cubes to bag when not busted', () => {
    const s = makeState({
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1' },
        bag: ['food'],
        band: ['mouse', 'mouse'],
      })],
    });
    const result = cancelActionAction(s);
    const p = result.players[0];
    expect(p.band).toEqual([]);
    expect(p.bag).toHaveLength(3);
    expect(p.bag).toEqual(expect.arrayContaining(['food', 'mouse', 'mouse']));
  });

  it('keeps band cubes when busted', () => {
    const s = makeState({
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1' },
        busted: true,
        bag: ['food'],
        band: ['mouse', 'mouse'],
      })],
    });
    const result = cancelActionAction(s);
    const p = result.players[0];
    expect(p.band).toEqual(['mouse', 'mouse']);
    expect(p.bag).toEqual(['food']);
  });

  it('resets currentLocation to null when not busted', () => {
    const s = makeState({
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1' },
        currentLocation: 'hero-1',
      })],
    });
    const result = cancelActionAction(s);
    expect(result.players[0].currentLocation).toBeNull();
  });

  it('resets currentLocation to null when busted', () => {
    const s = makeState({
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1' },
        busted: true,
        currentLocation: 'hero-1',
        band: ['mouse'],
      })],
    });
    const result = cancelActionAction(s);
    expect(result.players[0].currentLocation).toBeNull();
  });
});

// ── drawCubeAction ──────────────────────────────────

describe('drawCubeAction', () => {
  it('draws a cube from bag into band', () => {
    const s = makeState({
      players: [makePlayer({ action: { type: 'recruit', targetId: 'hero-1' }, bag: ['mouse'], band: [] })],
    });
    const result = drawCubeAction(s);
    expect(result.players[0].band).toHaveLength(1);
    expect(result.players[0].bag).toHaveLength(0);
  });

  it('returns s unchanged when bag is empty', () => {
    const s = makeState({
      players: [makePlayer({ action: { type: 'recruit', targetId: 'hero-1' }, bag: [], band: [] })],
    });
    const result = drawCubeAction(s);
    expect(result.message).toBe('Bag is empty!');
  });

  it('returns s unchanged when player has no action', () => {
    const s = makeState({ players: [makePlayer({ bag: ['mouse'] })] });
    expect(drawCubeAction(s)).toBe(s);
  });

  it('increments bustCount when bust cube drawn', () => {
    const s = makeState({
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1' },
        bag: ['inexperience'],
        band: [],
        bustCount: 0,
      })],
    });
    const result = drawCubeAction(s);
    expect(result.players[0].bustCount).toBe(1);
  });
});

// ── requestHelpAction ──────────────────────────────

describe('requestHelpAction', () => {
  it('sets helpPhase for multi-player games', () => {
    const s = makeState({
      playerCount: 2,
      players: [
        makePlayer({ action: { type: 'recruit', targetId: 'hero-1' } }),
        makePlayer(),
      ],
    });
    const result = requestHelpAction(s);
    expect(result.helpPhase).toBe(true);
  });

  it('rejects help when playerCount < 2', () => {
    const s = makeState({
      players: [makePlayer({ action: { type: 'recruit', targetId: 'hero-1' } })],
    });
    const result = requestHelpAction(s);
    expect(result.helpPhase).toBe(false);
    expect(result.message).toContain('No other players');
  });

  it('returns s unchanged when no action', () => {
    const s = makeState({ playerCount: 2, players: [makePlayer(), makePlayer()] });
    expect(requestHelpAction(s)).toBe(s);
  });
});

// ── helperDrawCubeAction ──────────────────────────

describe('helperDrawCubeAction', () => {
  it('draws a cube for helper into their helpBand', () => {
    const s = makeState({
      playerCount: 2,
      helpPhase: true,
      players: [
        makePlayer({ action: { type: 'recruit', targetId: 'hero-1' } }),
        makePlayer({ bag: ['mouse'], helpBand: [], helpBustCount: 0 }),
      ],
    });
    const result = helperDrawCubeAction(s, 1);
    expect(result.players[1].helpBand).toHaveLength(1);
    expect(result.players[1].bag).toHaveLength(0);
  });

  it('returns s unchanged if not in helpPhase', () => {
    const s = makeState({ playerCount: 2, helpPhase: false, players: [makePlayer(), makePlayer()] });
    expect(helperDrawCubeAction(s, 1)).toBe(s);
  });

  it('returns s unchanged if helper tries to draw as active player', () => {
    const s = makeState({ playerCount: 2, helpPhase: true, players: [makePlayer(), makePlayer()] });
    expect(helperDrawCubeAction(s, 0)).toBe(s);
  });
});

// ── helperDoneAction ──────────────────────────────

describe('helperDoneAction', () => {
  it('transfers non-inexperience cubes to active player band', () => {
    const s = makeState({
      playerCount: 2,
      helpPhase: true,
      players: [
        makePlayer({ band: [] }),
        makePlayer({ helpBand: ['mouse', 'food'], bag: [] }),
      ],
    });
    const result = helperDoneAction(s, 1);
    expect(result.players[0].band).toEqual(['mouse', 'food']);
    expect(result.players[1].helpBand).toHaveLength(0);
  });

  it('returns inexperience to helper bag instead of transferring', () => {
    const s = makeState({
      playerCount: 2,
      helpPhase: true,
      players: [
        makePlayer({ band: [] }),
        makePlayer({ helpBand: ['inexperience'], bag: [] }),
      ],
    });
    const result = helperDoneAction(s, 1);
    expect(result.players[0].band).toHaveLength(0);
    expect(result.players[1].bag).toContain('inexperience');
  });
});

// ── skipHelpAction ────────────────────────────────

describe('skipHelpAction', () => {
  it('ends helpPhase and transfers any accumulated help cubes', () => {
    const s = makeState({
      playerCount: 2,
      helpPhase: true,
      players: [
        makePlayer({ band: [] }),
        makePlayer({ helpBand: ['mouse'], bag: [] }),
      ],
    });
    const result = skipHelpAction(s);
    expect(result.helpPhase).toBe(false);
    expect(result.players[0].band).toContain('mouse');
  });

  it('returns s unchanged when not in helpPhase', () => {
    const s = makeState({ helpPhase: false });
    expect(skipHelpAction(s)).toBe(s);
  });
});

// ── endDayAction ──────────────────────────────────

describe('endDayAction', () => {
  it('returns s unchanged when game is over', () => {
    const s = makeState({ gameResult: 'lose' });
    expect(endDayAction(s)).toBe(s);
  });

  it('returns s unchanged when player has an action', () => {
    const s = makeState({
      players: [makePlayer({ action: { type: 'recruit', targetId: 'hero-1' } })],
    });
    expect(endDayAction(s)).toBe(s);
  });

  it('returns s unchanged when not in day phase', () => {
    const s = makeState({ phase: 'night' });
    expect(endDayAction(s)).toBe(s);
  });
});

// ── discardFoodAction ─────────────────────────────

describe('discardFoodAction', () => {
  it('removes food cube from band', () => {
    const s = makeState({
      phase: 'dusk',
      players: [makePlayer({ band: ['food', 'mouse'] })],
    });
    const result = discardFoodAction(s, 0);
    expect(result.players[0].band).toEqual(['mouse']);
  });

  it('rejects non-food cubes', () => {
    const s = makeState({
      phase: 'dusk',
      players: [makePlayer({ band: ['mouse'] })],
    });
    const result = discardFoodAction(s, 0);
    expect(result.message).toContain('Only food');
    expect(result.players[0].band).toEqual(['mouse']);
  });

  it('returns s unchanged when not in dusk phase', () => {
    const s = makeState({ phase: 'day', players: [makePlayer({ band: ['food'] })] });
    expect(discardFoodAction(s, 0)).toBe(s);
  });
});

// ── returnCubeToBagAction ─────────────────────────

describe('returnCubeToBagAction', () => {
  it('returns cube from tableau placement to bag', () => {
    const s = makeState({
      phase: 'night',
      players: [makePlayer({
        bag: [],
        placements: { 'hero-1': [{ type: 'mouse' }, { type: 'food' }] },
        nightReturns: 0,
      })],
    });
    const result = returnCubeToBagAction(s, 'hero-1', 0);
    expect(result.players[0].bag).toContain('mouse');
    expect(result.players[0].placements['hero-1']).toHaveLength(1);
    expect(result.players[0].nightReturns).toBe(1);
  });

  it('returns s unchanged when not in night phase', () => {
    const s = makeState({ phase: 'day' });
    expect(returnCubeToBagAction(s, 'hero-1', 0)).toBe(s);
  });

  it('rejects when 2 cubes already returned', () => {
    const s = makeState({
      phase: 'night',
      players: [makePlayer({ nightReturns: 2 })],
    });
    const result = returnCubeToBagAction(s, 'hero-1', 0);
    expect(result.message).toContain('Already returned 2');
  });
});

// ── endNightAction ────────────────────────────────

describe('endNightAction', () => {
  it('returns s unchanged when not in night phase', () => {
    const s = makeState({ phase: 'day' });
    expect(endNightAction(s)).toBe(s);
  });
});

// ── forfeitCombatAction ───────────────────────────

describe('forfeitCombatAction', () => {
  it('increments conquest and returns vermin to card slots', () => {
    const s = makeState({
      conquest: 2,
      cardSlots: { 'loc-1': [] },
      discoveredLocations: [{ id: 'loc-1', name: 'Old Abbey', type: 'location' }],
      players: [makePlayer({
        action: { type: 'combat', targetId: 'loc-1', verminAdded: 2 },
        band: ['vermin', 'vermin', 'mouse'],
      })],
    });
    const result = forfeitCombatAction(s);
    expect(result.conquest).toBe(3);
    expect(result.cardSlots['loc-1'].filter(c => c.type === 'vermin')).toHaveLength(2);
    expect(result.players[0].action).toBeNull();
    expect(result.players[0].band.filter(c => c === 'vermin')).toHaveLength(0);
  });

  it('returns s unchanged when player has no combat action', () => {
    const s = makeState();
    expect(forfeitCombatAction(s)).toBe(s);
  });
});

// ── startFortressCombatAction ─────────────────────

describe('startFortressCombatAction', () => {
  it('sets up combat against fortress', () => {
    const fortress = { id: 'fortress-1', name: 'Kotir', startingVermin: 3 };
    const s = makeState({
      horde: { fortress, villain: null, fortressCleared: false, fortressDeck: [] },
      cardSlots: { 'fortress-1': [{ type: 'vermin' }, { type: 'vermin' }] },
    });
    const result = startFortressCombatAction(s, 'fortress-1');
    const p = result.players[0];
    expect(p.action.type).toBe('combat');
    expect(p.action.combatTarget).toBe('fortress');
    expect(p.action.verminAdded).toBe(2);
    expect(result.cardSlots['fortress-1']).toHaveLength(0);
  });

  it('returns message when fortress has no vermin', () => {
    const fortress = { id: 'fortress-1', name: 'Kotir', startingVermin: 0 };
    const s = makeState({
      horde: { fortress, villain: null, fortressCleared: false, fortressDeck: [] },
      cardSlots: { 'fortress-1': [] },
    });
    const result = startFortressCombatAction(s, 'fortress-1');
    expect(result.message).toContain('no vermin');
    expect(result.players[0].action).toBeNull();
  });

  it('returns s unchanged when game is over', () => {
    const s = makeState({ gameResult: 'win' });
    expect(startFortressCombatAction(s, 'fortress-1')).toBe(s);
  });
});

// ── startVillainCombatAction ──────────────────────

describe('startVillainCombatAction', () => {
  it('returns message when fortress not cleared', () => {
    const villain = { id: 'villain-1', name: 'Tsarmina', startingVermin: 4 };
    const s = makeState({
      horde: { fortress: null, villain, fortressCleared: false, fortressDeck: [] },
      cardSlots: { 'villain-1': [{ type: 'vermin' }] },
    });
    const result = startVillainCombatAction(s, 'villain-1');
    expect(result.message).toContain('fortress must be cleared');
  });

  it('sets up villain combat when fortress is cleared', () => {
    const villain = { id: 'villain-1', name: 'Tsarmina', startingVermin: 4 };
    const s = makeState({
      horde: { fortress: null, villain, fortressCleared: true, fortressDeck: [] },
      cardSlots: { 'villain-1': [{ type: 'vermin' }, { type: 'vermin' }] },
    });
    const result = startVillainCombatAction(s, 'villain-1');
    expect(result.players[0].action.combatTarget).toBe('villain');
    expect(result.players[0].action.verminAdded).toBe(2);
  });
});

// ── resolveCombatAction ───────────────────────────

describe('resolveCombatAction', () => {
  it('returns message when insufficient cubes drawn', () => {
    const s = makeState({
      cardSlots: { 'loc-1': [] },
      players: [makePlayer({
        action: { type: 'combat', targetId: 'loc-1', verminAdded: 2 },
        band: ['mouse'], // only 1 drawn, need 2
      })],
    });
    const result = resolveCombatAction(s);
    expect(result.message).toContain('Must draw at least 2');
  });

  it('returns s unchanged when player has no combat action', () => {
    const s = makeState();
    expect(resolveCombatAction(s)).toBe(s);
  });

  it('victory reduces conquest when power exceeds vermin', () => {
    const loc = { id: 'loc-1', name: 'Old Abbey', type: 'location' };
    const s = makeState({
      conquest: 3,
      discoveredLocations: [loc],
      cardSlots: { 'loc-1': [] },
      players: [makePlayer({
        action: { type: 'combat', targetId: 'loc-1', verminAdded: 0 },
        band: ['mouse', 'mouse'], // power=2, vermin=0
      })],
    });
    const result = resolveCombatAction(s);
    expect(result.conquest).toBeLessThan(3);
    expect(result.players[0].action).toBeNull();
  });

  it('defeat increases conquest when power < vermin', () => {
    const loc = { id: 'loc-1', name: 'Old Abbey', type: 'location' };
    const s = makeState({
      conquest: 3,
      discoveredLocations: [loc],
      cardSlots: { 'loc-1': [{ type: 'vermin' }, { type: 'vermin' }, { type: 'vermin' }] },
      players: [makePlayer({
        action: { type: 'combat', targetId: 'loc-1', verminAdded: 3 },
        band: ['vermin', 'vermin', 'vermin'], // power=0, vermin=3
      })],
    });
    const result = resolveCombatAction(s);
    expect(result.conquest).toBe(4);
  });

  it('preserves combat result message into dusk when combat is the 2nd action', () => {
    const loc = { id: 'loc-1', name: 'Dark Forest', type: 'location' };
    const s = makeState({
      conquest: 3,
      discoveredLocations: [loc],
      cardSlots: { 'loc-1': [] },
      players: [makePlayer({
        actionsUsed: 1, // this is the 2nd action — will trigger dusk
        action: { type: 'combat', targetId: 'loc-1', verminAdded: 0 },
        band: ['mouse', 'mouse'], // power=2, vermin=0 → victory
      })],
    });
    const result = resolveCombatAction(s);
    expect(result.phase).toBe('dusk');
    expect(result.message).toContain('Victory');
    expect(result.message).toContain('Dark Forest');
  });
});

// ── confirmRecruitAction ──────────────────────────────

describe('confirmRecruitAction', () => {
  const hero = { id: 'hero-1', name: 'Matthias', type: 'hero', cost: 2, affinity: 'mouse' };

  it('succeeds when player has enough food', () => {
    const s = makeState({
      adventureRow: [hero],
      cardSlots: { 'hero-1': [] },
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1', cost: 2 },
        band: ['food', 'food', 'mouse'],
      })],
    });
    const result = confirmRecruitAction(s);
    expect(result.players[0].action).toBeNull();
    expect(result.players[0].tableau).toContainEqual(hero);
    expect(result.players[0].band.filter((c) => c === 'food').length).toBe(0);
  });

  it('returns message when player has insufficient food', () => {
    const s = makeState({
      adventureRow: [hero],
      cardSlots: { 'hero-1': [] },
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1', cost: 2 },
        band: ['food', 'mouse'], // only 1 food, need 2
      })],
    });
    const result = confirmRecruitAction(s);
    expect(result.message).toContain('food');
    expect(result.players[0].action).not.toBeNull();
  });

  it('includes keep-drawing guidance in the insufficient-food message', () => {
    const s = makeState({
      adventureRow: [hero],
      cardSlots: { 'hero-1': [] },
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1', cost: 2 },
        band: ['food', 'mouse'], // only 1 food, need 2
      })],
    });
    const result = confirmRecruitAction(s);
    expect(result.message).toBe('Need 2 food to recruit. Have 1. Keep drawing or cancel.');
  });

  it('returns message when player has no food at all', () => {
    const s = makeState({
      adventureRow: [hero],
      cardSlots: { 'hero-1': [] },
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1', cost: 2 },
        band: ['mouse', 'mouse'],
      })],
    });
    const result = confirmRecruitAction(s);
    expect(result.message).toContain('food');
    expect(result.players[0].tableau).toHaveLength(0);
  });

  it('returns s unchanged when player is busted', () => {
    const s = makeState({
      adventureRow: [hero],
      players: [makePlayer({
        action: { type: 'recruit', targetId: 'hero-1', cost: 2 },
        band: ['food', 'food'],
        busted: true,
      })],
    });
    expect(confirmRecruitAction(s)).toBe(s);
  });

  it('returns s unchanged when there is no recruit action', () => {
    const s = makeState();
    expect(confirmRecruitAction(s)).toBe(s);
  });
});
