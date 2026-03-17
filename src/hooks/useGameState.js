import { useState, useCallback } from 'react';
import { DEMO_ADVENTURE_ROW, DEMO_ADVENTURE_DECK, DEMO_DISCOVERED, DEMO_HORDE, DEMO_PLAYER } from '../data/cards';
import { ABILITIES } from '../data/abilities';

const BUST_TYPES = new Set(['inexperience', 'vermin', 'wound']);
const CRITTER_TYPES = new Set(['mouse', 'squirrel', 'hare', 'otter', 'mole', 'badger']);
const BASE_BUST_THRESHOLD = 3;

/** Count combat strength from a list of cube type strings. Badgers count as 2. */
function combatStrength(cubes) {
  let strength = 0;
  for (const c of cubes) {
    if (c === 'badger') strength += 2;
    else if (CRITTER_TYPES.has(c)) strength += 1;
  }
  return strength;
}

/** Count vermin in a list of cube type strings. */
function countVermin(cubes) {
  return cubes.filter((c) => c === 'vermin').length;
}

/** Expand a critters map like { mouse: 2, squirrel: 1 } into [{type:'mouse'},{type:'mouse'},{type:'squirrel'}] */
function expandCritters(critters) {
  if (!critters) return [];
  const result = [];
  for (const [type, count] of Object.entries(critters)) {
    for (let i = 0; i < count; i++) result.push({ type });
  }
  return result;
}

/** Build initial cardSlots for adventure row heroes (pre-filled with critters) */
function initCardSlots(adventureRow) {
  const slots = {};
  for (const card of adventureRow) {
    if (card.type === 'hero' && card.critters) {
      slots[card.id] = expandCritters(card.critters);
    }
  }
  return slots;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Champion ability helpers ──────────────────────────

/** Get the player's bust threshold (base 3 + Courage of Martin placements). */
function getPlayerBustThreshold(p) {
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
function matchesTrigger(trigger, drawnCube) {
  if (trigger === 'onDrawMouse') return drawnCube === 'mouse';
  if (trigger === 'onDrawCritter') return CRITTER_TYPES.has(drawnCube);
  return false;
}

/** Evaluate champion ability triggers after drawing a cube. */
function evaluateDrawTriggers(player, drawnCube) {
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
function calculatePower(player) {
  const band = player.band;
  let power = combatStrength(band);

  // Champion ability bonuses
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

  // Hero combat bonuses from tableau placements
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
function getVerminReduction(player) {
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
function getCombatWinFood(player) {
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
function passesSlotFilter(slotFilter, cubeType) {
  switch (slotFilter) {
    case 'mouse': return cubeType === 'mouse';
    case 'food': return cubeType === 'food';
    case 'non-mouse-critter': return CRITTER_TYPES.has(cubeType) && cubeType !== 'mouse';
    case 'critter': return CRITTER_TYPES.has(cubeType);
    case 'any': return true;
    default: return true;
  }
}

// ── Player helpers ──────────────────────────────────

function createPlayer(index) {
  return {
    id: index,
    champion: DEMO_PLAYER.champion,
    tableau: [...DEMO_PLAYER.tableau],
    placements: { ...DEMO_PLAYER.placements },
    abilityPlacements: { ...(DEMO_PLAYER.abilityPlacements ?? {}) },
    bag: shuffleArray(DEMO_PLAYER.bag),
    band: [],
    action: null,
    bustCount: 0,
    busted: false,
    selectedCubeIndex: null,
    nightReturns: 0,
    actionsUsed: 0,
    passed: false,
    drawBonuses: { power: 0, bagAdds: [], messages: [] },
  };
}

function buildInitialState(playerCount) {
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(createPlayer(i));
  }
  return {
    phase: 'day',
    day: 1,
    conquest: 2,
    playerCount,
    activePlayerIndex: 0,
    players,

    // Shared board
    adventureRow: [...DEMO_ADVENTURE_ROW],
    discoveredLocations: [...DEMO_DISCOVERED],
    horde: { ...DEMO_HORDE },
    adventureDeck: shuffleArray([...DEMO_ADVENTURE_DECK]),
    cardSlots: initCardSlots(DEMO_ADVENTURE_ROW),

    message: null,
  };
}

function getActivePlayer(s) {
  return s.players[s.activePlayerIndex];
}

function patchActivePlayer(s, patch) {
  const players = [...s.players];
  players[s.activePlayerIndex] = { ...players[s.activePlayerIndex], ...patch };
  return { ...s, players };
}

// ── Turn advancement ────────────────────────────────

/** Find next unpassed player index after current, or -1 if all passed. */
function nextUnpassedPlayer(s) {
  const n = s.playerCount;
  for (let offset = 1; offset <= n; offset++) {
    const idx = (s.activePlayerIndex + offset) % n;
    if (!s.players[idx].passed) return idx;
  }
  return -1;
}

/** Advance to the next unpassed player during day, or trigger dusk if all passed. */
function advanceDayTurn(s) {
  const next = nextUnpassedPlayer(s);
  if (next === -1) {
    return startDuskPhase(s);
  }
  return { ...s, activePlayerIndex: next, message: `Player ${next + 1}'s turn.` };
}

/** Find first player with band cubes for dusk, or skip to night if none. */
function startDuskPhase(s) {
  for (let i = 0; i < s.playerCount; i++) {
    if (s.players[i].band.length > 0) {
      return {
        ...s,
        phase: 'dusk',
        activePlayerIndex: i,
        message: s.playerCount > 1
          ? `Dusk — Player ${i + 1}, place your cubes.`
          : 'Dusk — select a cube from your band, then click a card to place it.',
      };
    }
  }
  // No player has band cubes — skip straight to night
  return enterNightAllPlayers(s);
}

/** Sequential advance for dusk: find next player with band cubes after current. */
function advanceDusk(s) {
  for (let offset = 1; offset < s.playerCount; offset++) {
    const idx = (s.activePlayerIndex + offset) % s.playerCount;
    // Only advance forward; if we wrap past 0 we're done
    if (idx <= s.activePlayerIndex) break;
    if (s.players[idx].band.length > 0) {
      return {
        ...s,
        activePlayerIndex: idx,
        message: s.playerCount > 1
          ? `Dusk — Player ${idx + 1}, place your cubes.`
          : 'Dusk — place your cubes.',
      };
    }
  }
  // All remaining players done → night
  return enterNightAllPlayers(s);
}

/** Simple sequential advance for night. */
function advanceNight(s) {
  const next = s.activePlayerIndex + 1;
  if (next < s.playerCount) {
    return {
      ...s,
      activePlayerIndex: next,
      message: s.playerCount > 1
        ? `Night — Player ${next + 1}, return up to 2 cubes.`
        : null,
    };
  }
  // All players done → morning
  return resolveNightEnd(s);
}

/**
 * Distributes `count` vermin round-robin across adventure row + discovered locations.
 */
function spreadVermin(state, count) {
  const targets = [...state.adventureRow, ...state.discoveredLocations]
    .filter((c) => c.type === 'location' || c.type === 'hero');

  const cardSlots = {};
  for (const [k, v] of Object.entries(state.cardSlots)) {
    cardSlots[k] = [...v];
  }

  if (targets.length === 0 || count <= 0) {
    return { cardSlots, conquestDelta: 0, log: [] };
  }

  const log = [];
  let hadOverflow = false;

  for (let i = 0; i < count; i++) {
    const target = targets[i % targets.length];
    const slots = cardSlots[target.id] ?? [];

    if (target.type === 'location') {
      const workerIdx = slots.findIndex((c) => c.type !== 'vermin');
      if (workerIdx !== -1) {
        const removed = slots.splice(workerIdx, 1)[0];
        cardSlots[target.id] = slots;
        log.push(`${target.name}: worker (${removed.type}) absorbed a vermin`);
        continue;
      }
    }

    const limit = target.verminLimit ?? target.slots ?? Infinity;
    const currentVermin = (cardSlots[target.id] ?? []).filter((c) => c.type === 'vermin').length;
    if (currentVermin >= limit) {
      hadOverflow = true;
      log.push(`${target.name}: vermin overflow`);
      continue;
    }

    if (!cardSlots[target.id]) cardSlots[target.id] = [];
    cardSlots[target.id].push({ type: 'vermin' });
    log.push(`${target.name}: +1 vermin`);
  }

  const conquestDelta = hadOverflow ? 1 : 0;
  return { cardSlots, conquestDelta, log };
}

function spawnNightVermin(state) {
  const { cardSlots, conquestDelta, log } = spreadVermin(state, state.conquest);
  const newConquest = state.conquest + conquestDelta;
  const message = `Night: spawned ${state.conquest} vermin. Conquest now ${newConquest}/10. ${log.join('; ')}.`;
  return { cardSlots, conquest: newConquest, nightMessage: message };
}

function applyVillainNight(state, conquest) {
  const villain = state.horde?.villain;
  if (!villain) return { conquest, villainMsg: '' };

  switch (villain.id) {
    case 'vil-cluny':
      return { conquest: conquest + 1, villainMsg: `${villain.name}: +1 conquest.` };
    case 'vil-tsarmina':
      return { conquest: conquest + 1, villainMsg: `${villain.name}: +1 conquest.` };
    default:
      return { conquest, villainMsg: '' };
  }
}

/** Enter night: shared vermin spawn + villain, reset all players' nightReturns. */
function enterNightAllPlayers(s) {
  const spawn = spawnNightVermin(s);
  const villain = applyVillainNight(s, spawn.conquest);
  const messages = [spawn.nightMessage, villain.villainMsg].filter(Boolean).join(' ');

  let result = {
    ...s,
    phase: 'night',
    activePlayerIndex: 0,
    cardSlots: spawn.cardSlots,
    conquest: villain.conquest,
    message: messages,
  };

  // Reset nightReturns for all players
  const players = result.players.map((p) => ({ ...p, nightReturns: 0 }));
  result.players = players;

  return result;
}

/** Morning resolution: card rotation, reveal, reset all players for new day. */
function resolveNightEnd(s) {
  const newRow = [...s.adventureRow];
  const newDeck = [...s.adventureDeck];
  const newCardSlots = { ...s.cardSlots };
  let newConquest = s.conquest;
  const log = [];

  if (newRow.length > 0) {
    const removed = newRow.shift();
    const removedSlots = newCardSlots[removed.id] ?? [];
    const verminCount = removedSlots.filter((c) => c.type === 'vermin').length;
    delete newCardSlots[removed.id];

    if (verminCount > 0 && removed.type !== 'villain' && removed.type !== 'fortress') {
      newConquest += verminCount;
      log.push(`${removed.name} removed with ${verminCount} vermin → conquest +${verminCount}`);
    } else if (verminCount > 0) {
      log.push(`${removed.name} removed (vermin discarded)`);
    } else {
      log.push(`${removed.name} removed`);
    }
  }

  if (newDeck.length > 0) {
    const revealed = newDeck.pop();
    newRow.push(revealed);
    if (revealed.type === 'hero' && revealed.critters) {
      newCardSlots[revealed.id] = expandCritters(revealed.critters);
    }
    log.push(`${revealed.name} revealed`);
  }

  const morning = log.length > 0 ? `Morning: ${log.join('. ')}.` : '';

  // Reset all players for new day
  const players = s.players.map((p) => ({
    ...p,
    nightReturns: 0,
    actionsUsed: 0,
    passed: false,
  }));

  return {
    ...s,
    phase: 'day',
    day: s.day + 1,
    activePlayerIndex: 0,
    players,
    adventureRow: newRow,
    adventureDeck: newDeck,
    cardSlots: newCardSlots,
    conquest: newConquest,
    message: `Day ${s.day + 1} begins. ${morning}`,
  };
}

/** After completing an action, increment actionsUsed and auto-pass if >= 2. */
function countAction(s) {
  const p = getActivePlayer(s);
  const actionsUsed = p.actionsUsed + 1;
  const passed = actionsUsed >= 2;
  let result = patchActivePlayer(s, { actionsUsed, passed });
  if (passed) {
    result = advanceDayTurn(result);
  }
  return result;
}

/**
 * Creates a mutable ctx object that ability functions use to manipulate state.
 */
function createAbilityCtx(state) {
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

export default function useGameState(playerCount = 2) {
  const [state, setState] = useState(() => buildInitialState(playerCount));

  // ── Day Actions ─────────────────────────────────────

  const startRecruit = useCallback((cardId) => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (p.action || s.phase !== 'day') return s;
      const card = s.adventureRow.find((c) => c.id === cardId);
      if (!card || card.type !== 'hero') return s;
      let result = patchActivePlayer(s, {
        action: { type: 'recruit', targetId: cardId },
        bustCount: 0,
        busted: false,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      result.message = `Recruiting ${card.name} (cost: ${card.cost} food) — draw cubes from your bag.`;
      return result;
    });
  }, []);

  const useLocationAction = useCallback((cardId) => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (p.action || s.phase !== 'day') return s;
      const loc = s.discoveredLocations.find((c) => c.id === cardId)
        || s.adventureRow.find((c) => c.id === cardId);
      if (!loc || loc.type !== 'location') return s;

      const slots = s.cardSlots[cardId] ?? [];
      const verminOnCard = slots.filter((c) => c.type === 'vermin').length;

      if (verminOnCard > 0) {
        const newCardSlots = {
          ...s.cardSlots,
          [cardId]: slots.filter((c) => c.type !== 'vermin'),
        };
        const newBag = [...p.bag];
        for (let i = 0; i < verminOnCard; i++) newBag.push('vermin');

        let result = { ...s, cardSlots: newCardSlots };
        result = patchActivePlayer(result, {
          bag: shuffleArray(newBag),
          action: { type: 'combat', targetId: cardId, verminAdded: verminOnCard },
          bustCount: 0,
          busted: false,
          drawBonuses: { power: 0, bagAdds: [], messages: [] },
        });
        result.message = `Combat at ${loc.name}! ${verminOnCard} vermin added to your bag. Draw at least ${verminOnCard} cubes.`;
        return result;
      }

      const ability = ABILITIES[cardId];
      if (!ability?.onAction) {
        return { ...s, message: `${loc.name}: No action available.` };
      }

      const ctx = createAbilityCtx(s);
      ability.onAction(ctx);
      const { playerPatch, message } = ctx._apply();

      let result = patchActivePlayer(s, playerPatch);
      result.message = message;

      const inAdventureRow = s.adventureRow.some((c) => c.id === cardId);
      if (inAdventureRow) {
        result = {
          ...result,
          adventureRow: s.adventureRow.filter((c) => c.id !== cardId),
          discoveredLocations: [...s.discoveredLocations, loc],
        };
      }

      // Infirmary triggers vermin spread equal to current conquest
      if (cardId === 'redwall-infirmary' && result.conquest > 0) {
        const spread = spreadVermin(result, result.conquest);
        result = {
          ...result,
          cardSlots: spread.cardSlots,
          conquest: result.conquest + spread.conquestDelta,
          message: `${result.message} Vermin spread (${result.conquest}): ${spread.log.join('; ')}.${spread.conquestDelta > 0 ? ' Overflow → conquest +1.' : ''}`,
        };
      }

      // Location action completes immediately — count it
      result = countAction(result);

      return result;
    });
  }, []);

  const drawCube = useCallback(() => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (!p.action || p.busted) return s;
      if (p.bag.length === 0) return { ...s, message: 'Bag is empty!' };

      const newBag = [...p.bag];
      const idx = Math.floor(Math.random() * newBag.length);
      const [drawn] = newBag.splice(idx, 1);
      const newBand = [...p.band, drawn];
      const isCombat = p.action.type === 'combat';

      const isBustType = BUST_TYPES.has(drawn);
      const newBustCount = isBustType ? p.bustCount + 1 : p.bustCount;
      const bustThreshold = getPlayerBustThreshold(p);
      const busted = newBustCount >= bustThreshold;

      // Evaluate champion ability triggers
      const playerForTriggers = { ...p, band: newBand };
      const triggers = evaluateDrawTriggers(playerForTriggers, drawn);

      // Add permanent food from Redwall Provisions
      for (const cubeType of triggers.bagAdds) {
        newBag.push(cubeType);
      }

      // Accumulate draw bonuses
      const prevBonuses = p.drawBonuses ?? { power: 0, bagAdds: [], messages: [] };
      const newDrawBonuses = {
        power: prevBonuses.power,
        bagAdds: [...prevBonuses.bagAdds, ...triggers.bagAdds],
        messages: [...prevBonuses.messages, ...triggers.messages],
      };

      // Calculate current power
      const power = calculatePower({ ...p, band: newBand, abilityPlacements: p.abilityPlacements });
      const triggerMsg = triggers.messages.length > 0 ? ' ' + triggers.messages.join(' ') : '';

      let message;
      if (isCombat && busted) {
        // Combat bust — auto-resolve as a loss
        const { targetId } = p.action;
        const newCardSlots = { ...s.cardSlots };
        const existing = newCardSlots[targetId] ?? [];
        const verminToReturn = newBand.filter((c) => c === 'vermin').length;
        const returnSlots = [];
        for (let i = 0; i < verminToReturn; i++) returnSlots.push({ type: 'vermin' });
        newCardSlots[targetId] = [...existing, ...returnSlots];
        const bandAfter = newBand.filter((c) => c !== 'vermin');

        const loc = s.discoveredLocations.find((c) => c.id === targetId)
          || s.adventureRow.find((c) => c.id === targetId);
        const locName = loc?.name ?? targetId;

        let result = { ...s, cardSlots: newCardSlots, conquest: s.conquest + 1 };
        result = patchActivePlayer(result, {
          bag: newBag,
          band: bandAfter,
          action: null,
          bustCount: 0,
          busted: false,
          drawBonuses: { power: 0, bagAdds: [], messages: [] },
        });
        result.message = `BUST at ${locName}! Drew "${drawn}" — ${bustThreshold} bad cubes. Vermin return, conquest +1 (now ${s.conquest + 1}).${triggerMsg}`;

        result = countAction(result);
        return result;
      } else if (isCombat) {
        const rawVerm = countVermin(newBand);
        const reduction = getVerminReduction({ ...p, band: newBand });
        const effectiveVerm = Math.max(0, rawVerm - reduction);
        const reductionNote = reduction > 0 ? ` (${reduction} negated)` : '';
        const badWarning = newBustCount > 0 ? ` (${newBustCount}/${bustThreshold} bad)` : '';
        message = `Drew "${drawn}" — Power ${power} vs ${effectiveVerm} vermin.${reductionNote}${badWarning}${triggerMsg}`;
      } else if (busted) {
        message = `BUST! Drew "${drawn}" — ${bustThreshold} bad cubes. Power was ${power}.${triggerMsg}`;
      } else {
        const badWarning = newBustCount > 0 ? ` (${newBustCount}/${bustThreshold} bad)` : '';
        message = `Drew "${drawn}" — Power: ${power}. ${newBand.length} cubes drawn.${badWarning}${triggerMsg}`;
      }

      let result = patchActivePlayer(s, {
        bag: newBag, band: newBand, bustCount: newBustCount, busted,
        drawBonuses: newDrawBonuses,
      });
      result.message = message;
      return result;
    });
  }, []);

  const confirmRecruit = useCallback(() => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (!p.action || p.action.type !== 'recruit' || p.busted) return s;
      const target = s.adventureRow.find((c) => c.id === p.action.targetId);
      if (!target) return s;

      // Recruit gates on food only
      const foodCount = p.band.filter((c) => c === 'food').length;
      if (foodCount < target.cost) {
        return { ...s, message: `Need ${target.cost} food to recruit. Have ${foodCount}. Keep drawing or cancel.` };
      }

      // Power gives inexperience removal: total power / 3
      const power = calculatePower(p);
      const inexperienceToRemove = Math.floor(power / 3);

      let foodToRemove = target.cost;
      const newBand = p.band.filter((c) => {
        if (c === 'food' && foodToRemove > 0) { foodToRemove--; return false; }
        return true;
      });

      // Remove inexperience from bag
      const newBag = [...p.bag];
      let removed = 0;
      for (let i = newBag.length - 1; i >= 0 && removed < inexperienceToRemove; i--) {
        if (newBag[i] === 'inexperience') {
          newBag.splice(i, 1);
          removed++;
        }
      }

      let result = {
        ...s,
        adventureRow: s.adventureRow.filter((c) => c.id !== target.id),
      };
      result = patchActivePlayer(result, {
        tableau: [...p.tableau, target],
        band: newBand,
        bag: shuffleArray(newBag),
        action: null,
        bustCount: 0,
        busted: false,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      const inexMsg = removed > 0 ? ` Power ${power} removed ${removed} inexperience!` : '';
      result.message = `Recruited ${target.name}! Spent ${target.cost} food.${inexMsg}`;

      result = countAction(result);
      return result;
    });
  }, []);

  const resolveCombat = useCallback(() => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (!p.action || p.action.type !== 'combat') return s;
      const { targetId, verminAdded } = p.action;

      if (p.band.length < verminAdded) {
        return { ...s, message: `Must draw at least ${verminAdded} cubes. Drawn ${p.band.length} so far.` };
      }

      const power = calculatePower(p);
      const rawVerm = countVermin(p.band);
      const reduction = getVerminReduction(p);
      const verm = Math.max(0, rawVerm - reduction);
      const reductionNote = reduction > 0 ? ` (${rawVerm} vermin - ${reduction} negated)` : '';

      const loc = s.discoveredLocations.find((c) => c.id === targetId)
        || s.adventureRow.find((c) => c.id === targetId);
      const locName = loc?.name ?? targetId;

      let result;
      if (power >= verm) {
        const newBand = p.band.filter((c) => c !== 'vermin');
        const overkill = power - verm;
        const conquestReduction = Math.max(1, overkill);
        const newConquest = Math.max(0, s.conquest - conquestReduction);
        const overkillNote = overkill > 0 ? ` Overkill ${overkill} → conquest -${conquestReduction}` : ' Conquest -1';

        // Mossflower Forager: add food to location on win
        const winFood = getCombatWinFood(p);
        const newCardSlots = { ...s.cardSlots };
        if (winFood > 0) {
          const existing = newCardSlots[targetId] ?? [];
          const foodSlots = [];
          for (let i = 0; i < winFood; i++) foodSlots.push({ type: 'food' });
          newCardSlots[targetId] = [...existing, ...foodSlots];
        }
        const foodNote = winFood > 0 ? ` Forager added ${winFood} food to ${locName}.` : '';

        result = { ...s, conquest: newConquest, cardSlots: newCardSlots };
        result = patchActivePlayer(result, {
          band: newBand,
          action: null,
          bustCount: 0,
          busted: false,
          drawBonuses: { power: 0, bagAdds: [], messages: [] },
        });
        result.message = `Victory at ${locName}! Power ${power} vs ${verm} vermin.${reductionNote}${overkillNote} (now ${newConquest}).${foodNote}`;
      } else {
        const newCardSlots = { ...s.cardSlots };
        const existing = newCardSlots[targetId] ?? [];
        const verminToReturn = p.band.filter((c) => c === 'vermin').length;
        const returnSlots = [];
        for (let i = 0; i < verminToReturn; i++) returnSlots.push({ type: 'vermin' });
        newCardSlots[targetId] = [...existing, ...returnSlots];
        const newBand = p.band.filter((c) => c !== 'vermin');

        result = { ...s, cardSlots: newCardSlots, conquest: s.conquest + 1 };
        result = patchActivePlayer(result, {
          band: newBand,
          action: null,
          bustCount: 0,
          busted: false,
          drawBonuses: { power: 0, bagAdds: [], messages: [] },
        });
        result.message = `Defeated at ${locName}. Power ${power} vs ${verm} vermin. Vermin return, conquest +1 (now ${s.conquest + 1}).`;
      }

      result = countAction(result);
      return result;
    });
  }, []);

  const forfeitCombat = useCallback(() => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (!p.action || p.action.type !== 'combat') return s;
      const { targetId } = p.action;

      // Same logic as combat loss: vermin return to location, conquest +1
      const newCardSlots = { ...s.cardSlots };
      const existing = newCardSlots[targetId] ?? [];
      const verminToReturn = p.band.filter((c) => c === 'vermin').length;
      const returnSlots = [];
      for (let i = 0; i < verminToReturn; i++) returnSlots.push({ type: 'vermin' });
      newCardSlots[targetId] = [...existing, ...returnSlots];
      const newBand = p.band.filter((c) => c !== 'vermin');

      const loc = s.discoveredLocations.find((c) => c.id === targetId)
        || s.adventureRow.find((c) => c.id === targetId);
      const locName = loc?.name ?? targetId;

      let result = { ...s, cardSlots: newCardSlots, conquest: s.conquest + 1 };
      result = patchActivePlayer(result, {
        band: newBand,
        action: null,
        bustCount: 0,
        busted: false,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      result.message = `Forfeited combat at ${locName}. Vermin return, conquest +1 (now ${s.conquest + 1}).`;

      result = countAction(result);
      return result;
    });
  }, []);

  const useVeteranAbility = useCallback((targetLocationId) => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (p.action || s.phase !== 'day') return s;

      const vetId = 'hero-salamandastron-veteran';
      const vetAbility = ABILITIES[vetId];
      if (!vetAbility?.canRemoveVermin) return s;

      const placed = p.placements[vetId] ?? [];
      if (vetAbility.canRemoveVermin(placed) < 1) {
        return { ...s, message: 'Salamandastron Veteran: need 2 matching cubes placed.' };
      }

      // Find the target location and check it has vermin
      const loc = s.discoveredLocations.find((c) => c.id === targetLocationId)
        || s.adventureRow.find((c) => c.id === targetLocationId);
      if (!loc) return { ...s, message: 'Invalid target location.' };

      const slots = s.cardSlots[targetLocationId] ?? [];
      const verminIdx = slots.findIndex((c) => c.type === 'vermin');
      if (verminIdx === -1) {
        return { ...s, message: `${loc.name} has no vermin to remove.` };
      }

      // Spend 2 matching cubes from the Veteran's placements
      const counts = {};
      for (const c of placed) {
        counts[c.type] = (counts[c.type] ?? 0) + 1;
      }
      let spentType = null;
      for (const [type, n] of Object.entries(counts)) {
        if (n >= 2) { spentType = type; break; }
      }
      if (!spentType) {
        return { ...s, message: 'Salamandastron Veteran: no matching pair to spend.' };
      }

      // Remove 2 of spentType from placements
      let toRemove = 2;
      const newPlaced = placed.filter((c) => {
        if (c.type === spentType && toRemove > 0) { toRemove--; return false; }
        return true;
      });

      // Remove 1 vermin from target location
      const newSlots = [...slots];
      newSlots.splice(verminIdx, 1);

      const newCardSlots = { ...s.cardSlots, [targetLocationId]: newSlots };
      const newPlacements = { ...p.placements, [vetId]: newPlaced };

      let result = { ...s, cardSlots: newCardSlots };
      result = patchActivePlayer(result, { placements: newPlacements });
      result.message = `Salamandastron Veteran: spent 2 ${spentType} cubes, removed 1 vermin from ${loc.name}.`;

      result = countAction(result);
      return result;
    });
  }, []);

  const cancelAction = useCallback(() => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (!p.action) return s;

      const wasBusted = p.busted;
      let result = patchActivePlayer(s, {
        action: null, bustCount: 0, busted: false,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      result.message = wasBusted ? 'Busted! Drawn cubes stay in your band.' : 'Action cancelled.';

      if (wasBusted) {
        result = countAction(result);
      }

      return result;
    });
  }, []);

  // ── Phase Transitions ───────────────────────────────

  const endDay = useCallback(() => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (s.phase !== 'day' || p.action) return s;

      let result = patchActivePlayer(s, { passed: true });
      result = advanceDayTurn(result);
      return result;
    });
  }, []);

  // ── Dusk Actions ────────────────────────────────────

  const dropCube = useCallback((cardId, cubeIndex) => {
    setState((s) => {
      if (s.phase !== 'dusk') return s;
      const p = getActivePlayer(s);
      if (cubeIndex < 0 || cubeIndex >= p.band.length) return s;

      const cubeType = p.band[cubeIndex];

      // Check if it's a location (worker placement)
      const loc = s.discoveredLocations.find((c) => c.id === cardId);
      if (loc) {
        if (BUST_TYPES.has(cubeType)) {
          return { ...s, message: `Can't place ${cubeType} as a worker — must go on your tableau.` };
        }
        const currentSlots = s.cardSlots[cardId] ?? [];
        if (currentSlots.length >= (loc.slots ?? 0)) {
          return { ...s, message: `${loc.name} is full!` };
        }
        const newBand = [...p.band];
        newBand.splice(cubeIndex, 1);
        const newCardSlots = { ...s.cardSlots, [cardId]: [...currentSlots, { type: cubeType }] };
        const doneMsg = newBand.length === 0
          ? 'All cubes placed!'
          : `Placed ${cubeType} worker at ${loc.name}. ${newBand.length} cube(s) remaining.`;
        let result = { ...s, cardSlots: newCardSlots };
        result = patchActivePlayer(result, { band: newBand });
        result.message = doneMsg;
        if (newBand.length === 0) {
          result = advanceDusk(result);
        }
        return result;
      }

      // Check if it's a champion ability slot
      const ability = p.champion.abilities?.find((a) => a.id === cardId);
      if (ability) {
        if (!passesSlotFilter(ability.slotFilter, cubeType)) {
          const filterLabel = ability.slotFilter === 'non-mouse-critter' ? 'non-mouse critter' : ability.slotFilter;
          return { ...s, message: `${ability.name} only accepts ${filterLabel} cubes.` };
        }
        const currentPlacements = (p.abilityPlacements ?? {})[ability.id] ?? [];
        if (currentPlacements.length >= ability.slots) {
          return { ...s, message: `${ability.name} is full!` };
        }
        const newBand = [...p.band];
        newBand.splice(cubeIndex, 1);
        const newAbilityPlacements = {
          ...(p.abilityPlacements ?? {}),
          [ability.id]: [...currentPlacements, { type: cubeType }],
        };
        const doneMsg = newBand.length === 0
          ? 'All cubes placed!'
          : `Placed ${cubeType} on ${ability.name}. ${newBand.length} cube(s) remaining.`;
        let result = patchActivePlayer(s, { band: newBand, abilityPlacements: newAbilityPlacements });
        result.message = doneMsg;
        if (newBand.length === 0) {
          result = advanceDusk(result);
        }
        return result;
      }

      // Otherwise it's a tableau card or champion (without abilities)
      const isChampion = p.champion.id === cardId;
      const tableauCard = isChampion ? p.champion : p.tableau.find((c) => c.id === cardId);
      if (!tableauCard) return { ...s, message: 'Invalid target.' };

      const totalSlots = tableauCard.tableauSlots ?? tableauCard.slots ?? 0;
      const currentPlacements = p.placements[cardId] ?? [];
      if (currentPlacements.length >= totalSlots) {
        return { ...s, message: `${tableauCard.name} is full!` };
      }

      const newBand = [...p.band];
      newBand.splice(cubeIndex, 1);
      const newPlacements = { ...p.placements, [cardId]: [...currentPlacements, { type: cubeType }] };
      const doneMsg = newBand.length === 0
        ? 'All cubes placed!'
        : `Placed ${cubeType} on ${tableauCard.name}. ${newBand.length} cube(s) remaining.`;
      let result = patchActivePlayer(s, { band: newBand, placements: newPlacements });
      result.message = doneMsg;
      if (newBand.length === 0) {
        result = advanceDusk(result);
      }
      return result;
    });
  }, []);

  // ── Night Actions ───────────────────────────────────

  const returnCubeToBag = useCallback((cardId, slotIndex) => {
    setState((s) => {
      if (s.phase !== 'night') return s;
      const p = getActivePlayer(s);
      if (p.nightReturns >= 2) return { ...s, message: 'Already returned 2 cubes this night.' };

      // Check hero/champion placements first
      let currentPlacements = p.placements[cardId];
      let isAbility = false;

      if (!currentPlacements || slotIndex < 0 || slotIndex >= (currentPlacements?.length ?? 0)) {
        // Check ability placements
        currentPlacements = (p.abilityPlacements ?? {})[cardId];
        if (!currentPlacements || slotIndex < 0 || slotIndex >= currentPlacements.length) return s;
        isAbility = true;
      }

      const cube = currentPlacements[slotIndex];
      const returns = p.nightReturns + 1;
      const newBag = [...p.bag, cube.type];

      let patch;
      if (isAbility) {
        const newAbilityPlacements = {
          ...(p.abilityPlacements ?? {}),
          [cardId]: currentPlacements.filter((_, i) => i !== slotIndex),
        };
        // Find ability name
        const abilityDef = p.champion.abilities?.find((a) => a.id === cardId);
        const cardName = abilityDef?.name ?? cardId;
        patch = { abilityPlacements: newAbilityPlacements, bag: shuffleArray(newBag), nightReturns: returns };
        let result = patchActivePlayer(s, patch);
        result.message = `Returned ${cube.type} from ${cardName} to bag. ${2 - returns} return(s) left.`;
        return result;
      } else {
        const newPlacements = {
          ...p.placements,
          [cardId]: currentPlacements.filter((_, i) => i !== slotIndex),
        };
        const cardName = p.champion.id === cardId
          ? p.champion.name
          : p.tableau.find((c) => c.id === cardId)?.name ?? cardId;
        patch = { placements: newPlacements, bag: shuffleArray(newBag), nightReturns: returns };
        let result = patchActivePlayer(s, patch);
        result.message = `Returned ${cube.type} from ${cardName} to bag. ${2 - returns} return(s) left.`;
        return result;
      }
    });
  }, []);

  const endNight = useCallback(() => {
    setState((s) => {
      if (s.phase !== 'night') return s;
      return advanceNight(s);
    });
  }, []);

  return {
    state,
    startRecruit,
    useLocationAction,
    drawCube,
    confirmRecruit,
    resolveCombat,
    forfeitCombat,
    useVeteranAbility,
    cancelAction,
    endDay,
    dropCube,
    returnCubeToBag,
    endNight,
    calculatePower: (player) => calculatePower(player),
    getPlayerBustThreshold: (player) => getPlayerBustThreshold(player),
  };
}
