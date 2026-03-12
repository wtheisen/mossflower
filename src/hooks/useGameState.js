import { useState, useCallback } from 'react';
import { DEMO_ADVENTURE_ROW, DEMO_ADVENTURE_DECK, DEMO_DISCOVERED, DEMO_HORDE, DEMO_PLAYER } from '../data/cards';
import { ABILITIES } from '../data/abilities';

const BUST_TYPES = new Set(['inexperience', 'vermin', 'wound']);

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

const INITIAL_STATE = {
  phase: 'day',
  day: 1,
  conquest: 2,

  // Board
  adventureRow: [...DEMO_ADVENTURE_ROW],
  discoveredLocations: [...DEMO_DISCOVERED],
  horde: { ...DEMO_HORDE },
  adventureDeck: shuffleArray([...DEMO_ADVENTURE_DECK]),

  // Player
  champion: DEMO_PLAYER.champion,
  tableau: [...DEMO_PLAYER.tableau],
  placements: { ...DEMO_PLAYER.placements },
  bag: shuffleArray(DEMO_PLAYER.bag),
  band: [],

  // Cubes on board cards (adventure row + locations): { cardId: [{type}, ...] }
  // Heroes start with critters pre-filled, locations get workers + vermin
  cardSlots: initCardSlots(DEMO_ADVENTURE_ROW),

  // Action state
  action: null,
  bustCount: 0,
  busted: false,
  message: null,

  // Dusk state
  selectedCubeIndex: null,

  // Night state
  nightReturns: 0,  // how many cubes returned to bag this night (max 2)
};

/**
 * Creates a mutable ctx object that ability functions use to manipulate state.
 */
function createAbilityCtx(state) {
  const bag = [...state.bag];
  const band = [...state.band];
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
      return { bag: shuffleArray(bag), band, message };
    },
  };
}

/**
 * Spawns vermin during the night phase.
 * Distributes `conquest` vermin round-robin across adventure row + discovered locations.
 * Workers on locations absorb vermin (worker removed instead of vermin added).
 * Then conquest track increases by 1.
 */
function spawnNightVermin(state) {
  const targets = [...state.adventureRow, ...state.discoveredLocations]
    .filter((c) => c.type === 'location' || c.type === 'hero');

  if (targets.length === 0) {
    return { cardSlots: { ...state.cardSlots }, conquest: state.conquest + 1 };
  }

  // Deep copy cardSlots
  const cardSlots = {};
  for (const [k, v] of Object.entries(state.cardSlots)) {
    cardSlots[k] = [...v];
  }

  const log = [];
  let toSpawn = state.conquest;

  for (let i = 0; i < toSpawn; i++) {
    const target = targets[i % targets.length];
    const slots = cardSlots[target.id] ?? [];

    // On locations, non-vermin cubes (workers) absorb vermin
    if (target.type === 'location') {
      const workerIdx = slots.findIndex((c) => c.type !== 'vermin');
      if (workerIdx !== -1) {
        const removed = slots.splice(workerIdx, 1)[0];
        cardSlots[target.id] = slots;
        log.push(`${target.name}: worker (${removed.type}) absorbed a vermin`);
        continue;
      }
    }

    // Add vermin to slot
    if (!cardSlots[target.id]) cardSlots[target.id] = [];
    cardSlots[target.id].push({ type: 'vermin' });
    log.push(`${target.name}: +1 vermin`);
  }

  const newConquest = state.conquest + 1;
  const message = `Night: spawned ${toSpawn} vermin. Conquest now ${newConquest}/10. ${log.join('; ')}.`;

  return { cardSlots, conquest: newConquest, nightMessage: message };
}

/** Returns a state patch for transitioning into Night. */
function enterNight(s) {
  const spawn = spawnNightVermin(s);
  return {
    phase: 'night',
    nightReturns: 0,
    cardSlots: spawn.cardSlots,
    conquest: spawn.conquest,
    message: spawn.nightMessage,
  };
}

export default function useGameState() {
  const [state, setState] = useState(INITIAL_STATE);

  // ── Day Actions ─────────────────────────────────────

  const startRecruit = useCallback((cardId) => {
    setState((s) => {
      if (s.action || s.phase !== 'day') return s;
      const card = s.adventureRow.find((c) => c.id === cardId);
      if (!card || card.type !== 'hero') return s;
      return {
        ...s,
        action: { type: 'recruit', targetId: cardId },
        bustCount: 0,
        busted: false,
        message: `Recruiting ${card.name} (cost ${card.cost}) — draw cubes from your bag.`,
      };
    });
  }, []);

  const useLocationAction = useCallback((cardId) => {
    setState((s) => {
      if (s.action || s.phase !== 'day') return s;
      const loc = s.discoveredLocations.find((c) => c.id === cardId)
        || s.adventureRow.find((c) => c.id === cardId);
      if (!loc || loc.type !== 'location') return s;

      const ability = ABILITIES[cardId];
      if (!ability?.onAction) {
        return { ...s, message: `${loc.name}: No action available.` };
      }

      const ctx = createAbilityCtx(s);
      ability.onAction(ctx);
      const patch = ctx._apply();

      const inAdventureRow = s.adventureRow.some((c) => c.id === cardId);
      if (inAdventureRow) {
        patch.adventureRow = s.adventureRow.filter((c) => c.id !== cardId);
        patch.discoveredLocations = [...s.discoveredLocations, loc];
      }

      return { ...s, ...patch };
    });
  }, []);

  const drawCube = useCallback(() => {
    setState((s) => {
      if (!s.action || s.busted) return s;
      if (s.bag.length === 0) return { ...s, message: 'Bag is empty!' };

      const newBag = [...s.bag];
      const idx = Math.floor(Math.random() * newBag.length);
      const [drawn] = newBag.splice(idx, 1);
      const newBand = [...s.band, drawn];
      const isBustType = BUST_TYPES.has(drawn);
      const newBustCount = isBustType ? s.bustCount + 1 : s.bustCount;
      const busted = newBustCount >= 2;

      let message;
      if (busted) {
        message = `BUST! Drew "${drawn}" — too many bad cubes.`;
      } else if (isBustType) {
        message = `Drew "${drawn}" — careful, one more bad cube and you bust!`;
      } else {
        message = `Drew "${drawn}" — ${newBand.length} cubes drawn so far.`;
      }

      return { ...s, bag: newBag, band: newBand, bustCount: newBustCount, busted, message };
    });
  }, []);

  const confirmRecruit = useCallback(() => {
    setState((s) => {
      if (!s.action || s.action.type !== 'recruit' || s.busted) return s;
      const target = s.adventureRow.find((c) => c.id === s.action.targetId);
      if (!target) return s;

      const foodCount = s.band.filter((c) => c === 'food').length;
      if (foodCount < target.cost) {
        return { ...s, message: `Not enough food! Need ${target.cost}, have ${foodCount}. Keep drawing or cancel.` };
      }

      let foodToRemove = target.cost;
      const newBand = s.band.filter((c) => {
        if (c === 'food' && foodToRemove > 0) { foodToRemove--; return false; }
        return true;
      });

      return {
        ...s,
        adventureRow: s.adventureRow.filter((c) => c.id !== target.id),
        tableau: [...s.tableau, target],
        band: newBand,
        action: null, bustCount: 0, busted: false,
        message: `Recruited ${target.name}! Spent ${target.cost} food.`,
      };
    });
  }, []);

  const cancelAction = useCallback(() => {
    setState((s) => {
      if (!s.action) return s;
      return {
        ...s, action: null, bustCount: 0, busted: false,
        message: s.busted ? 'Busted! Drawn cubes stay in your band.' : 'Action cancelled.',
      };
    });
  }, []);

  // ── Phase Transitions ───────────────────────────────

  const endDay = useCallback(() => {
    setState((s) => {
      if (s.phase !== 'day' || s.action) return s;
      if (s.band.length === 0) {
        return { ...s, ...enterNight(s) };
      }
      return {
        ...s,
        phase: 'dusk',
        selectedCubeIndex: null,
        message: 'Dusk — select a cube from your band, then click a card to place it.',
      };
    });
  }, []);

  // ── Dusk Actions ────────────────────────────────────

  // Single handler for drag-and-drop: drop cube at index onto a card
  const dropCube = useCallback((cardId, cubeIndex) => {
    setState((s) => {
      if (s.phase !== 'dusk') return s;
      if (cubeIndex < 0 || cubeIndex >= s.band.length) return s;

      const cubeType = s.band[cubeIndex];

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
        const newBand = [...s.band];
        newBand.splice(cubeIndex, 1);
        const newCardSlots = { ...s.cardSlots, [cardId]: [...currentSlots, { type: cubeType }] };
        const doneMsg = newBand.length === 0
          ? 'All cubes placed!'
          : `Placed ${cubeType} worker at ${loc.name}. ${newBand.length} cube(s) remaining.`;
        const intermediate = { ...s, band: newBand, cardSlots: newCardSlots, message: doneMsg };
        if (newBand.length === 0) {
          return { ...intermediate, ...enterNight(intermediate) };
        }
        return intermediate;
      }

      // Otherwise it's a tableau card or champion
      const isChampion = s.champion.id === cardId;
      const tableauCard = isChampion ? s.champion : s.tableau.find((c) => c.id === cardId);
      if (!tableauCard) return { ...s, message: 'Invalid target.' };

      const totalSlots = tableauCard.tableauSlots ?? tableauCard.slots ?? 0;
      const currentPlacements = s.placements[cardId] ?? [];
      if (currentPlacements.length >= totalSlots) {
        return { ...s, message: `${tableauCard.name} is full!` };
      }

      const newBand = [...s.band];
      newBand.splice(cubeIndex, 1);
      const newPlacements = { ...s.placements, [cardId]: [...currentPlacements, { type: cubeType }] };
      const doneMsg = newBand.length === 0
        ? 'All cubes placed!'
        : `Placed ${cubeType} on ${tableauCard.name}. ${newBand.length} cube(s) remaining.`;
      const intermediate = { ...s, band: newBand, placements: newPlacements, message: doneMsg };
      if (newBand.length === 0) {
        return { ...intermediate, ...enterNight(intermediate) };
      }
      return intermediate;
    });
  }, []);

  // ── Night Actions ───────────────────────────────────

  // Click a cube on a tableau card to return it to bag (max 2)
  const returnCubeToBag = useCallback((cardId, slotIndex) => {
    setState((s) => {
      if (s.phase !== 'night') return s;
      if (s.nightReturns >= 2) return { ...s, message: 'Already returned 2 cubes this night.' };

      const currentPlacements = s.placements[cardId];
      if (!currentPlacements || slotIndex < 0 || slotIndex >= currentPlacements.length) return s;

      const cube = currentPlacements[slotIndex];
      const newPlacements = {
        ...s.placements,
        [cardId]: currentPlacements.filter((_, i) => i !== slotIndex),
      };
      const newBag = [...s.bag, cube.type];
      const returns = s.nightReturns + 1;

      const cardName = s.champion.id === cardId
        ? s.champion.name
        : s.tableau.find((c) => c.id === cardId)?.name ?? cardId;

      return {
        ...s,
        placements: newPlacements,
        bag: shuffleArray(newBag),
        nightReturns: returns,
        message: `Returned ${cube.type} from ${cardName} to bag. ${2 - returns} return(s) left.`,
      };
    });
  }, []);

  const endNight = useCallback(() => {
    setState((s) => {
      if (s.phase !== 'night') return s;

      // ── Morning: remove leftmost adventure row card, reveal new one ──
      const newRow = [...s.adventureRow];
      const newDeck = [...s.adventureDeck];
      const newCardSlots = { ...s.cardSlots };
      let newConquest = s.conquest;
      const log = [];

      if (newRow.length > 0) {
        const removed = newRow.shift();
        const removedSlots = newCardSlots[removed.id] ?? [];
        const verminCount = removedSlots.filter((c) => c.type === 'vermin').length;

        // Clean up slots for removed card
        delete newCardSlots[removed.id];

        // Add vermin to conquest unless the card is a horde/vermin type
        if (verminCount > 0 && removed.type !== 'villain' && removed.type !== 'fortress') {
          newConquest += verminCount;
          log.push(`${removed.name} removed with ${verminCount} vermin → conquest +${verminCount}`);
        } else if (verminCount > 0) {
          log.push(`${removed.name} removed (vermin discarded)`);
        } else {
          log.push(`${removed.name} removed`);
        }
      }

      // Reveal a new card from the deck
      if (newDeck.length > 0) {
        const revealed = newDeck.pop();
        newRow.push(revealed);
        // Initialize critters for newly revealed heroes
        if (revealed.type === 'hero' && revealed.critters) {
          newCardSlots[revealed.id] = expandCritters(revealed.critters);
        }
        log.push(`${revealed.name} revealed`);
      }

      const morning = log.length > 0 ? `Morning: ${log.join('. ')}.` : '';

      return {
        ...s,
        phase: 'day',
        day: s.day + 1,
        nightReturns: 0,
        adventureRow: newRow,
        adventureDeck: newDeck,
        cardSlots: newCardSlots,
        conquest: newConquest,
        message: `Day ${s.day + 1} begins. ${morning}`,
      };
    });
  }, []);

  return {
    state,
    startRecruit,
    useLocationAction,
    drawCube,
    confirmRecruit,
    cancelAction,
    endDay,
    dropCube,
    returnCubeToBag,
    endNight,
  };
}
