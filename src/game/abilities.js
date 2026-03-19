import { CRITTER_TYPES, BASE_BUST_THRESHOLD, shuffleArray } from './constants';
import { combatStrength, getActivePlayer } from './helpers';
import { ABILITIES } from '../data/abilities';

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
