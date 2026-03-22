import { CRITTER_TYPES, BASE_BUST_THRESHOLD, shuffleArray } from './constants';
import { combatStrength, getActivePlayer } from './helpers';

/**
 * Ability registry — keyed by card ID.
 *
 * Each ability gets a `ctx` object with:
 *   ctx.state        — current game state (read-only snapshot)
 *   ctx.addToBand(cubeType)     — add a cube to the band (not from bag)
 *   ctx.removeFromBand(cubeType) — remove & discard a cube from band
 *   ctx.addToBag(cubeType)      — add a cube to the bag
 *   ctx.removeFromBag(cubeType) — remove a cube from bag (discard)
 *   ctx.drawFromBag()           — draw a random cube from bag into band
 *   ctx.setMessage(msg)         — set the status message
 *
 * `onAction(ctx)` is called when a player uses a location's action.
 * Returns a patch object to merge into state, or null for no change.
 */

export const ABILITIES = {
  // ── Base Locations ──────────────────────────────────────

  // Great Hall (Base): Gain 1 Food
  'great-hall-base': {
    onAction(ctx) {
      ctx.addToBand('food');
      ctx.setMessage('The Great Hall: Gained 1 Food.');
    },
  },

  // The Cellar (Base): Gain 1 Food per Worker placed here
  // For now, just gain 1 food (workers not yet implemented)
  'cellar-base': {
    onAction(ctx) {
      ctx.addToBand('food');
      ctx.setMessage('The Cellar: Gained 1 Food.');
    },
  },

  // Redwall Infirmary: Remove ALL wounds from band
  'redwall-infirmary': {
    onAction(ctx) {
      let removed = 0;
      while (ctx.removeFromBand('wound')) removed++;
      if (removed > 0) {
        ctx.setMessage(`Redwall Infirmary: Removed ${removed} wound(s). Vermin spread incoming...`);
      } else {
        ctx.setMessage('Redwall Infirmary: No wounds to remove.');
      }
    },
  },

  // ── Adventure Row Locations ─────────────────────────────

  // The Great Hall (Adventure): Draw 2 cubes
  'loc-great-hall': {
    onAction(ctx) {
      const drawn = [];
      for (let i = 0; i < 2; i++) {
        const cube = ctx.drawFromBag();
        if (cube) drawn.push(cube);
      }
      if (drawn.length > 0) {
        ctx.setMessage(`The Great Hall: Drew ${drawn.join(', ')}.`);
      } else {
        ctx.setMessage('The Great Hall: Bag is empty, nothing to draw.');
      }
    },
  },

  // The Cellar (Adventure): Gain 2 Food if you place at least one Worker
  // Workers not yet implemented — just gain 2 food for now
  'loc-the-cellar': {
    onAction(ctx) {
      ctx.addToBand('food');
      ctx.addToBand('food');
      ctx.setMessage('The Cellar: Gained 2 Food.');
    },
  },

  // Salamandastron: passive combat modifier — no active action for now
  'loc-salamandastron': {
    onAction(ctx) {
      ctx.setMessage('Salamandastron: Combat modifier — no action to take right now.');
    },
  },

  // Mossflower Border: Draw 1 cube from bag
  'loc-mossflower-border': {
    onAction(ctx) {
      const cube = ctx.drawFromBag();
      if (cube) {
        ctx.setMessage(`Mossflower Border: Drew ${cube}.`);
      } else {
        ctx.setMessage('Mossflower Border: Bag is empty.');
      }
    },
  },

  // ── Hero Abilities ────────────────────────────────────────

  // Redwall Sentry: each mouse placed here gives +1 combat strength
  'hero-redwall-sentry': {
    combatBonus(placements) {
      return placements.filter((c) => c.type === 'mouse').length;
    },
  },

  // Guerrilla Scout: each squirrel placed here negates 1 vermin in combat
  'hero-guerilla-scout': {
    combatVerminReduction(placements) {
      return placements.filter((c) => c.type === 'squirrel').length;
    },
  },

  // Salamandastron Veteran: spend 2 matching cubes to remove 1 vermin anywhere
  // Returns pairs of matching cubes available to spend
  'hero-salamandastron-veteran': {
    canRemoveVermin(placements) {
      const counts = {};
      for (const c of placements) {
        counts[c.type] = (counts[c.type] ?? 0) + 1;
      }
      // Number of pairs available
      let pairs = 0;
      for (const n of Object.values(counts)) {
        pairs += Math.floor(n / 2);
      }
      return pairs;
    },
  },

  // Mossflower Forager: on combat win, add 1 food per squirrel placed here
  'hero-squirrel-1': {
    onCombatWin(placements) {
      return placements.filter((c) => c.type === 'squirrel').length;
    },
  },
};

/** Get the player's bust threshold (base 3 + Courage of Martin placements). */
export function getPlayerBustThreshold(p) {
  let threshold = BASE_BUST_THRESHOLD;
  const abilities = p.champion.abilities;
  if (!abilities) return threshold;
  for (const ability of abilities) {
    if (ability.effect === 'raiseBustThreshold') {
      const placed = (p.abilityPlacements ?? {})[ability.id] ?? [];
      threshold += placed.length;
    }
  }
  return threshold;
}

/** Check if a drawn cube matches an ability's trigger. */
export function matchesTrigger(trigger, drawnCube) {
  if (trigger === 'onDrawMouse') return drawnCube === 'mouse';
  if (trigger === 'onDrawCritter') return CRITTER_TYPES.has(drawnCube);
  return false;
}

/** Evaluate champion ability triggers after drawing a cube. */
export function evaluateDrawTriggers(player, drawnCube) {
  const abilities = player.champion.abilities;
  if (!abilities) return { bagAdds: [], messages: [] };

  const result = { bagAdds: [], messages: [] };
  const abilityPlacements = player.abilityPlacements ?? {};

  for (const ability of abilities) {
    if (ability.trigger === 'passive') continue;
    const placed = abilityPlacements[ability.id] ?? [];
    if (placed.length === 0) continue;
    if (!matchesTrigger(ability.trigger, drawnCube)) continue;

    switch (ability.effect) {
      case 'amplifyMice':
        result.messages.push(`${ability.name}: mice worth ${1 + placed.length} power each!`);
        break;
      case 'addFoodPerMouse':
        for (let i = 0; i < placed.length; i++) result.bagAdds.push('food');
        result.messages.push(`${ability.name}: +${placed.length} food to bag!`);
        break;
      case 'allyPower':
        result.messages.push(`${ability.name}: +${placed.length} power!`);
        break;
    }
  }

  return result;
}

/**
 * Calculate total power from a player's band + champion ability bonuses.
 * Base: critter cubes (badger=2, others=1).
 * Strength in Numbers: mice × placed count bonus.
 * Rallying Cry: mice drawn × placed critter count.
 */
export function calculatePower(player) {
  const band = player.band;
  let power = combatStrength(band);

  const abilities = player.champion.abilities;
  if (abilities) {
    const abilityPlacements = player.abilityPlacements ?? {};
    for (const ability of abilities) {
      const placed = abilityPlacements[ability.id] ?? [];
      if (placed.length === 0) continue;

      switch (ability.effect) {
        case 'amplifyMice': {
          const miceInBand = band.filter((c) => c === 'mouse').length;
          power += miceInBand * placed.length;
          break;
        }
        case 'allyPower': {
          const miceDrawn = band.filter((c) => c === 'mouse').length;
          power += miceDrawn * placed.length;
          break;
        }
      }
    }
  }

  const placements = player.placements ?? {};
  for (const [cardId, placed] of Object.entries(placements)) {
    if (placed.length === 0) continue;
    const heroAbility = ABILITIES[cardId];
    if (heroAbility?.combatBonus) {
      power += heroAbility.combatBonus(placed);
    }
  }

  return power;
}

/** Get total vermin reduction from hero abilities (e.g. Guerrilla Scout). */
export function getVerminReduction(player) {
  let reduction = 0;
  const placements = player.placements ?? {};
  for (const [cardId, placed] of Object.entries(placements)) {
    if (placed.length === 0) continue;
    const heroAbility = ABILITIES[cardId];
    if (heroAbility?.combatVerminReduction) {
      reduction += heroAbility.combatVerminReduction(placed);
    }
  }
  return reduction;
}

/** Get food bonus from hero abilities on combat win (e.g. Mossflower Forager). */
export function getCombatWinFood(player) {
  let food = 0;
  const placements = player.placements ?? {};
  for (const [cardId, placed] of Object.entries(placements)) {
    if (placed.length === 0) continue;
    const heroAbility = ABILITIES[cardId];
    if (heroAbility?.onCombatWin) {
      food += heroAbility.onCombatWin(placed);
    }
  }
  return food;
}

/** Check if a cube type passes an ability's slot filter. */
export function passesSlotFilter(slotFilter, cubeType) {
  switch (slotFilter) {
    case 'mouse': return cubeType === 'mouse';
    case 'food': return cubeType === 'food';
    case 'non-mouse-critter': return CRITTER_TYPES.has(cubeType) && cubeType !== 'mouse';
    case 'critter': return CRITTER_TYPES.has(cubeType);
    case 'any': return true;
    default: return true;
  }
}

/**
 * Creates a mutable ctx object that ability functions use to manipulate state.
 */
export function createAbilityCtx(state) {
  const p = getActivePlayer(state);
  const bag = [...p.bag];
  const band = [...p.band];
  let message = state.message;

  return {
    state,
    addToBand(cubeType) { band.push(cubeType); },
    removeFromBand(cubeType) {
      const idx = band.indexOf(cubeType);
      if (idx === -1) return false;
      band.splice(idx, 1);
      return true;
    },
    addToBag(cubeType) { bag.push(cubeType); },
    removeFromBag(cubeType) {
      const idx = bag.indexOf(cubeType);
      if (idx === -1) return false;
      bag.splice(idx, 1);
      return true;
    },
    drawFromBag() {
      if (bag.length === 0) return null;
      const idx = Math.floor(Math.random() * bag.length);
      const [cube] = bag.splice(idx, 1);
      band.push(cube);
      return cube;
    },
    setMessage(msg) { message = msg; },
    _apply() {
      return { playerPatch: { bag: shuffleArray(bag), band }, message };
    },
  };
}
