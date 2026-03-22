import { expandCritters, getActivePlayer, patchActivePlayer, setMessage } from './helpers';

/** Check if conquest >= 10 → loss. */
export function checkGameOver(s) {
  if (s.gameResult) return s;
  if (s.conquest >= 10) {
    return setMessage({ ...s, gameResult: 'loss' }, 'Conquest reached 10 — Mossflower has fallen.');
  }
  return s;
}

/** Find next unpassed player index after current, or -1 if all passed. */
export function nextUnpassedPlayer(s) {
  const n = s.playerCount;
  for (let offset = 1; offset <= n; offset++) {
    const idx = (s.activePlayerIndex + offset) % n;
    if (!s.players[idx].passed) return idx;
  }
  return -1;
}

/** Advance to the next unpassed player during day, or trigger dusk if all passed. */
export function advanceDayTurn(s) {
  const next = nextUnpassedPlayer(s);
  if (next === -1) {
    return startDuskPhase(s);
  }
  return setMessage({ ...s, activePlayerIndex: next }, `Player ${next + 1}'s turn.`);
}

/** Find first player with band cubes for dusk, or skip to night if none. */
export function startDuskPhase(s) {
  for (let i = 0; i < s.playerCount; i++) {
    if (s.players[i].band.length > 0) {
      const base = { ...s, phase: 'dusk', activePlayerIndex: i };
      if (s.playerCount > 1) {
        return setMessage(base, `Dusk — Player ${i + 1}, place your cubes.`);
      }
      return { ...base, message: s.message };
    }
  }
  return enterNightAllPlayers(s);
}

/** Sequential advance for dusk: find next player with band cubes after current. */
export function advanceDusk(s) {
  for (let i = s.activePlayerIndex + 1; i < s.playerCount; i++) {
    if (s.players[i].band.length > 0) {
      const msg = s.playerCount > 1
        ? `Dusk — Player ${i + 1}, place your cubes.`
        : 'Dusk — place your cubes.';
      return setMessage({ ...s, activePlayerIndex: i }, msg);
    }
  }
  return enterNightAllPlayers(s);
}

/** Simple sequential advance for night. */
export function advanceNight(s) {
  const next = s.activePlayerIndex + 1;
  if (next < s.playerCount) {
    const msg = s.playerCount > 1
      ? `Night — Player ${next + 1}, return up to 2 cubes.`
      : null;
    const base = { ...s, activePlayerIndex: next };
    return msg ? setMessage(base, msg) : { ...base, message: null };
  }
  return resolveNightEnd(s);
}

/**
 * Distributes `count` vermin round-robin across adventure row + discovered locations.
 */
export function spreadVermin(state, count) {
  const targets = [...state.adventureRow, ...state.discoveredLocations]
    .filter((c) => c.type === 'location' || c.type === 'hero');

  const cardSlots = {};
  for (const [k, v] of Object.entries(state.cardSlots)) {
    cardSlots[k] = [...v];
  }

  if (targets.length === 0 || count <= 0) {
    return { cardSlots, conquestDelta: 0, log: [] };
  }

  const adventureRowIds = new Set(state.adventureRow.map((c) => c.id));
  const targetNames = targets.map((c) => c.name);
  const hasDuplicateNames = targetNames.length !== new Set(targetNames).size;

  function labelFor(target) {
    if (hasDuplicateNames && adventureRowIds.has(target.id)) {
      return `${target.name} (row)`;
    }
    return target.name;
  }

  const log = [];
  let hadOverflow = false;

  for (let i = 0; i < count; i++) {
    const target = targets[i % targets.length];
    const slots = cardSlots[target.id] ?? [];
    const label = labelFor(target);

    if (target.type === 'location') {
      const workerIdx = slots.findIndex((c) => c.type !== 'vermin');
      if (workerIdx !== -1) {
        const removed = slots.splice(workerIdx, 1)[0];
        cardSlots[target.id] = slots;
        log.push(`${label}: worker (${removed.type}) absorbed a vermin`);
        continue;
      }
    }

    const limit = target.verminLimit ?? target.slots ?? Infinity;
    const currentVermin = (cardSlots[target.id] ?? []).filter((c) => c.type === 'vermin').length;
    if (currentVermin >= limit) {
      hadOverflow = true;
      log.push(`${label}: vermin overflow`);
      continue;
    }

    if (!cardSlots[target.id]) cardSlots[target.id] = [];
    cardSlots[target.id].push({ type: 'vermin' });
    log.push(`${label}: +1 vermin`);
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
export function enterNightAllPlayers(s) {
  const spawn = spawnNightVermin(s);
  const villain = applyVillainNight(s, spawn.conquest);
  const messages = [spawn.nightMessage, villain.villainMsg].filter(Boolean).join(' ');

  let result = setMessage({
    ...s,
    phase: 'night',
    activePlayerIndex: 0,
    cardSlots: spawn.cardSlots,
    conquest: villain.conquest,
  }, messages);

  const players = result.players.map((p) => ({ ...p, nightReturns: 0 }));
  result.players = players;

  return checkGameOver(result);
}

/** Morning resolution: card rotation, reveal, reset all players for new day. */
export function resolveNightEnd(s) {
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

  const players = s.players.map((p) => ({
    ...p,
    nightReturns: 0,
    actionsUsed: 0,
    passed: false,
  }));

  return checkGameOver(setMessage({
    ...s,
    phase: 'day',
    day: s.day + 1,
    activePlayerIndex: 0,
    players,
    adventureRow: newRow,
    adventureDeck: newDeck,
    cardSlots: newCardSlots,
    conquest: newConquest,
  }, `Day ${s.day + 1} begins. ${morning}`));
}

/** After completing an action, increment actionsUsed and auto-pass if >= 2. */
export function countAction(s) {
  const p = getActivePlayer(s);
  const actionsUsed = p.actionsUsed + 1;
  const passed = actionsUsed >= 2;
  let result = patchActivePlayer(s, { actionsUsed, passed });
  if (passed) {
    result = advanceDayTurn(result);
  }
  return result;
}
