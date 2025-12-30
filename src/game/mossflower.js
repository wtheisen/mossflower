import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import {
  adventureCards,
  baseLocations,
  champions,
  cubePalette,
  fortressDeck,
  hordeDeck,
  startingDiscoveredLocations,
  villainDeck
} from './content.js';
import { triggerAbilityHook } from './abilities.js';

const DAY_STAGE = 'dayAction';
const DUSK_STAGE = 'duskAssign';
const ASSIST_STAGE = 'assist';
const ADVENTURE_ROW_SIZE = 5;
const MAX_CONQUEST = 10;
const WORKER_CUBES = new Set(['mouse', 'hare', 'badger', 'squirrel', 'mole', 'otter', 'mastery']);

export const StageNames = {
  DAY: DAY_STAGE,
  DUSK: DUSK_STAGE,
  ASSIST: ASSIST_STAGE
};

export const MossflowerGame = {
  name: 'mossflower',
  minPlayers: 1,
  maxPlayers: 4,
  setup: (ctx) => setupGame(ctx),
  endIf: (G) => {
    if (G.conquestTrack >= MAX_CONQUEST) {
      return { winner: null, reason: 'Conquest Track reached 10' };
    }
    if (G.villainCleared) {
      return { winner: 'Champions', reason: 'Villain defeated' };
    }
    return undefined;
  },
  phases: {
    day: {
      start: true,
      next: 'night',
      turn: {
        order: TurnOrder.DEFAULT,
        onBegin: (G, ctx) => {
          const player = getCurrentPlayer(G, ctx);
          if (player) {
            player.drawnThisTurn = [];
            player.pendingCubes = [];
            player.didBust = false;
          }
          G.turnState = null;
          ctx?.events?.setActivePlayers({
            currentPlayer: DAY_STAGE,
            others: ASSIST_STAGE
          });
        },
        onEnd: (G) => {
          G.turnsInPhase = (G.turnsInPhase ?? 0) + 1;
        },
        stages: {
          [DAY_STAGE]: {
            moves: { chooseAction, drawCube, stopDrawing, travelToLocation },
            next: DUSK_STAGE
          },
          [DUSK_STAGE]: {
            moves: { assignCubeToTableau, assignCubeToLocation, discardCube, finishDusk }
          },
          [ASSIST_STAGE]: {
            moves: { assistDraw }
          }
        }
      },
      endIf: (G, ctx) => {
        const playerCount = ctx?.numPlayers ?? Object.keys(G.players ?? {}).length ?? 1;
        return G.turnsInPhase >= playerCount;
      },
      onEnd: (G) => {
        G.turnsInPhase = 0;
      }
    },
    night: {
      next: 'day',
      onBegin: (G, ctx) => {
        resolveNight(G, ctx);
        G.nightResolved = true;
      },
      endIf: (G) => G.nightResolved,
      onEnd: (G) => {
        G.nightResolved = false;
        G.day += 1;
        G.log.unshift(`Day ${G.day} begins.`);
      }
    }
  }
};

function setupGame(ctx) {
  const fortressStack = ctx.random.Shuffle(instantiateDeck(fortressDeck, 'fort'));
  const villainStack = ctx.random.Shuffle(instantiateDeck(villainDeck, 'vil'));
  const hordeStack = ctx.random.Shuffle(instantiateDeck(hordeDeck, 'hor'));
  const championPool = ctx.random.Shuffle(champions.map((champion) => ({ ...champion })));
  const players = {};
  const activeChampions = [];
  const playerCount = ctx?.numPlayers ?? 4;
  const playOrder = ctx?.playOrder ?? Array.from({ length: playerCount }, (_, i) => `${i}`);
  playOrder.forEach((playerID, index) => {
    const champion = championPool[index % championPool.length];
    activeChampions.push(champion);
    players[playerID] = createPlayerState(playerID, champion);
  });
  const questTemplates = activeChampions.flatMap((champion) => createChampionQuestCards(champion));
  const combinedCards = [...adventureCards, ...questTemplates];
  const adventureDeck = ctx.random.Shuffle(instantiateDeck(combinedCards, 'adv'));
  const adventureRow = adventureDeck.splice(0, ADVENTURE_ROW_SIZE);
  attachQuestCardRefs(players, adventureDeck, adventureRow);

  const discoveredLocations = startingDiscoveredLocations.map((locId, idx) => ({
    ...deepCopy(baseLocations[locId]),
    uid: `disc-${locId}-${idx}`,
    vermin: 0,
    workers: []
  }));

  return {
    day: 1,
    turnsInPhase: 0,
    conquestTrack: ctx?.numPlayers ?? playerCount,
    adventureDeck,
    adventureRow,
    discoveredLocations,
    fortressDeck: fortressStack,
    villainDeck: villainStack,
    hordeDeck: hordeStack,
    revealedFortress: fortressStack.shift() ?? null,
    revealedVillain: villainStack.shift() ?? null,
    hordeCard: hordeStack.shift() ?? null,
    players,
    fortressCleared: false,
    villainCleared: false,
    discardPile: [],
    turnState: null,
    nightResolved: false,
    log: ['Day 1 begins.']
  };
}

function createPlayerState(playerID, champion) {
  const championCard = {
    id: `champion-${champion.id}`,
    cardId: champion.id,
    name: champion.name,
    slots: champion.tableauSlots,
    cubes: [],
    isChampion: true,
    affinity: champion.affinities ?? [],
    abilityKey: null
  };

  return {
    id: playerID,
    championId: champion.id,
    name: champion.name,
    affinities: champion.affinities,
    bag: expandBag(champion.startingBag),
    tableau: [championCard],
    quests: champion.quests.map((quest, index) => ({
      ...quest,
      uid: `${champion.id}-quest-${index}`,
      progress: 0,
      complete: false
    })),
    locationId: 'great-hall',
    drawnThisTurn: [],
    pendingCubes: [],
    workersPlaced: {},
    exhaustion: false,
    didBust: false,
    mustVisitInfirmary: false,
    combatContext: null
  };
}

function expandBag(entries) {
  const cubes = [];
  entries.forEach((entry) => {
    for (let i = 0; i < entry.count; i += 1) {
      cubes.push(entry.type);
    }
  });
  return cubes;
}

function instantiateDeck(cards, prefix) {
  return cards.map((card, index) => ({
    ...deepCopy(card),
    uid: `${prefix}-${card.id}-${index}`,
    workers: [],
    vermin: card.vermin ?? 0,
    slots: card.slots ?? 3
  }));
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function getCurrentPlayer(G, ctx) {
  return G.players?.[ctx.currentPlayer];
}

function chooseAction(G, ctx, args) {
  const { targetId, mode = 'action' } = args ?? {};
  const player = getCurrentPlayer(G, ctx);
  const currentStage = ctx.activePlayers?.[ctx.currentPlayer];
  if (!player || !targetId || currentStage !== DAY_STAGE) {
    return INVALID_MOVE;
  }
  if (G.turnState && !G.turnState.resolved) {
    return INVALID_MOVE;
  }
  const card = findCardByUid(G, targetId);
  if (!card) {
    return INVALID_MOVE;
  }
  if (player.mustVisitInfirmary && card.id !== 'redwall-infirmary') {
    return INVALID_MOVE;
  }
  if (mode === 'action' && (card.vermin ?? 0) > 0) {
    return INVALID_MOVE;
  }
  if (mode === 'combat' && (card.vermin ?? 0) <= 0) {
    return INVALID_MOVE;
  }
  if (mode === 'recruit' && card.type !== 'hero') {
    return INVALID_MOVE;
  }
  if (mode === 'recruit' && (card.vermin ?? 0) > 0) {
    return INVALID_MOVE;
  }
  if (card.type === 'quest' && card.ownerChampionId && card.ownerChampionId !== player.championId) {
    return INVALID_MOVE;
  }
  if (card.uid === G.revealedVillain?.uid && !G.fortressCleared) {
    return INVALID_MOVE;
  }

  if (card.type === 'location') {
    if (!isLocationDiscovered(G, card.id)) {
      discoverLocation(G, card);
    }
    player.locationId = card.id;
    collectWorkers(card, player);
  }

  let minDraw = 0;
  if (mode === 'combat') {
    const verminCount = card.vermin ?? 0;
    const combatModifier = getHordeCombatModifier(G, card);
    minDraw = Math.max(1, verminCount + combatModifier);
    prepareCombatCubes(player, verminCount);
    card.vermin = 0;
    player.locationId = card.id;
  }

  player.pendingCubes = [];
  player.drawnThisTurn = [];
  player.didBust = false;
  player.combatContext = mode === 'combat' ? { targetUid: card.uid, verminAdded: minDraw } : null;

  G.turnState = {
    playerID: ctx.currentPlayer,
    targetId,
    mode,
    targetType: card.type,
    minDraw,
    resolved: false,
    busted: false,
    helpers: {
      allowed: false,
      draws: {}
    }
  };

  G.log.unshift(
    `${player.name} targets ${card.name} for ${mode === 'combat' ? 'combat' : mode}.`
  );
}

function travelToLocation(G, ctx, args) {
  const player = getCurrentPlayer(G, ctx);
  if (!player || ctx.activePlayers?.[ctx.currentPlayer] !== DAY_STAGE) {
    return INVALID_MOVE;
  }
  const { locationId } = args ?? {};
  if (!locationId) {
    return INVALID_MOVE;
  }
  const destination = getDiscoveredLocationById(G, locationId);
  if (!destination) {
    return INVALID_MOVE;
  }
  player.locationId = destination.id;
  collectWorkers(destination, player);
  G.log.unshift(`${player.name} travels to ${destination.name}.`);
}

function drawCube(G, ctx) {
  const player = getCurrentPlayer(G, ctx);
  const currentStage = ctx.activePlayers?.[ctx.currentPlayer];
  if (!player || !G.turnState || G.turnState.resolved || currentStage !== DAY_STAGE) {
    return INVALID_MOVE;
  }
  const cube = pullCubeFromBag(player, ctx);
  if (!cube) {
    return INVALID_MOVE;
  }
  player.drawnThisTurn.push(cube);
  if (cube !== 'vermin') {
    player.pendingCubes.push(cube);
  }
  unlockHelperStage(G);
  updateBustStatus(G, ctx);
}

function pullCubeFromBag(player, ctx) {
  if (!player.bag.length) {
    return null;
  }
  const dieResult = ctx.random.Die(player.bag.length) - 1;
  const [cube] = player.bag.splice(dieResult, 1);
  return cube;
}

function checkBust(cubes) {
  const white = cubes.filter((cube) => cube === 'inexperience').length;
  const black = cubes.filter((cube) => cube === 'wound' || cube === 'vermin').length;
  return white + black >= 2;
}

function countAlliedCubes(cubes) {
  return cubes.filter((cube) => cube !== 'wound' && cube !== 'vermin').length;
}

function stopDrawing(G, ctx) {
  const player = getCurrentPlayer(G, ctx);
  const currentStage = ctx.activePlayers?.[ctx.currentPlayer];
  if (!player || !G.turnState || G.turnState.resolved || currentStage !== DAY_STAGE) {
    return INVALID_MOVE;
  }
  if (
    G.turnState.mode === 'combat' &&
    player.drawnThisTurn.length < G.turnState.minDraw &&
    !player.didBust
  ) {
    return INVALID_MOVE;
  }
  concludeDayAction(G, ctx);
}

function resolveActivity(G, ctx, player, card, actionState) {
  if (!card) {
    return 'Action fizzled: card missing.';
  }
  let message = '';
  if (actionState.mode === 'combat') {
    message = resolveCombat(G, ctx, player, card, actionState);
  } else if (actionState.mode === 'recruit') {
    message = resolveRecruit(G, player, card);
  } else {
    message = resolveCardAction(G, player, card);
  }
  transferHelperCubes(G, player);
  cleanupCombatContext(player, card);
  return message;
}

function resolveCombat(G, ctx, player, card, actionState) {
  const combat = player.combatContext ?? { verminAdded: actionState.minDraw ?? 0 };
  const helpers = actionState.helpers ?? { draws: {} };
  const verminTarget = combat.verminAdded ?? 0;
  const totalCubes = gatherActionCubes(player, helpers);
  const affinityBonus = calculateAffinityBonus(player, card);
  const allied = countAlliedCubes(totalCubes) + affinityBonus;
  const bust = player.didBust;

  if (bust) {
    restoreCardVermin(card, combat.verminAdded);
    increaseConquest(G, 1);
    return `${player.name} busts in combat at ${card.name}. Conquest +1.`;
  }

  if (allied > verminTarget) {
    let message = `${player.name} wins combat at ${card.name} (Vermin ${verminTarget}).`;
    if (verminTarget >= 4) {
      increaseConquest(G, -1);
      message += ' Horde pushed back!';
    }
    if (verminTarget >= 7) {
      if (promoteInexperience(player)) {
        message += ' Gained 1 Mastery.';
      }
    }
    if (card?.type === 'location' && verminTarget > 0) {
      triggerAbilityHook({ G, ctx, player, location: card, hook: 'onLocationVerminCleared' });
    }
    message += handleFortressVillainProgress(G, card);
    return message;
  }

  restoreCardVermin(card, combat.verminAdded);
  increaseConquest(G, 1);
  return `${player.name} is defeated at ${card.name}. Conquest +1.`;
}

function increaseConquest(G, delta) {
  G.conquestTrack = Math.min(MAX_CONQUEST, Math.max(0, G.conquestTrack + delta));
}

function assignCubeToTableau(G, ctx, args) {
  const { cubeIndex, targetId } = args ?? {};
  const player = getCurrentPlayer(G, ctx);
  const currentStage = ctx.activePlayers?.[ctx.currentPlayer];
  if (!player || currentStage !== DUSK_STAGE) {
    return INVALID_MOVE;
  }
  if (cubeIndex === undefined || cubeIndex === null) {
    return INVALID_MOVE;
  }
  const cube = player.pendingCubes?.splice(cubeIndex, 1)?.[0];
  if (!cube) {
    return INVALID_MOVE;
  }
  const hero = findHeroById(player, targetId) ?? player.tableau[0];
  if (cube === 'inexperience' && !hero.isChampion) {
    player.pendingCubes.splice(cubeIndex, 0, cube);
    return INVALID_MOVE;
  }
  if (hero.cubes.length >= hero.slots) {
    player.pendingCubes.splice(cubeIndex, 0, cube);
    return INVALID_MOVE;
  }
  hero.cubes.push(cube);
}

function assignCubeToLocation(G, ctx, args) {
  const player = getCurrentPlayer(G, ctx);
  const currentStage = ctx.activePlayers?.[ctx.currentPlayer];
  if (!player || currentStage !== DUSK_STAGE) {
    return INVALID_MOVE;
  }
  const { cubeIndex } = args ?? {};
  if (cubeIndex === undefined || cubeIndex === null) {
    return INVALID_MOVE;
  }
  const cube = player.pendingCubes?.splice(cubeIndex, 1)?.[0];
  if (!cube) {
    return INVALID_MOVE;
  }
  if (!WORKER_CUBES.has(cube)) {
    player.pendingCubes.splice(cubeIndex, 0, cube);
    return INVALID_MOVE;
  }
  const location = getDiscoveredLocationById(G, player.locationId);
  if (!location) {
    return INVALID_MOVE;
  }
  location.workers = location.workers ?? [];
  if (location.workers.length >= (location.slots ?? 3)) {
    player.pendingCubes.splice(cubeIndex, 0, cube);
    return INVALID_MOVE;
  }
  location.workers.push({ cube, playerID: player.id });
  player.workersPlaced[location.id] = (player.workersPlaced[location.id] ?? 0) + 1;
}

function discardCube(G, ctx, args) {
  const player = getCurrentPlayer(G, ctx);
  const currentStage = ctx.activePlayers?.[ctx.currentPlayer];
  if (!player || currentStage !== DUSK_STAGE) {
    return INVALID_MOVE;
  }
  const { cubeIndex } = args ?? {};
  if (cubeIndex === undefined || cubeIndex === null) {
    return INVALID_MOVE;
  }
  const [cube] = player.pendingCubes.splice(cubeIndex, 1);
  if (cube !== 'food') {
    player.pendingCubes.splice(cubeIndex, 0, cube);
    return INVALID_MOVE;
  }
}

function assistDraw(G, ctx) {
  if (!G.turnState || G.turnState.resolved) {
    return INVALID_MOVE;
  }
  const helperId = ctx.playerID ?? ctx.currentPlayer;
  const helper = G.players?.[helperId];
  if (!helper) {
    return INVALID_MOVE;
  }
  if (helperId === G.turnState.playerID) {
    return INVALID_MOVE;
  }
  if (ctx.activePlayers?.[helperId] !== ASSIST_STAGE) {
    return INVALID_MOVE;
  }
  if (!G.turnState.helpers?.allowed) {
    return INVALID_MOVE;
  }
  const cube = pullCubeFromBag(helper, ctx);
  if (!cube) {
    return INVALID_MOVE;
  }
  if (!G.turnState.helpers.draws[helperId]) {
    G.turnState.helpers.draws[helperId] = [];
  }
  G.turnState.helpers.draws[helperId].push(cube);
  updateBustStatus(G, ctx);
}

function finishDusk(G, ctx) {
  const player = getCurrentPlayer(G, ctx);
  const currentStage = ctx.activePlayers?.[ctx.currentPlayer];
  if (!player || currentStage !== DUSK_STAGE) {
    return INVALID_MOVE;
  }
  while (player.pendingCubes.length > 0) {
    const cube = player.pendingCubes.shift();
    forcePlaceCube(G, player, cube, ctx);
  }
  player.drawnThisTurn = [];
  player.didBust = false;
  ctx?.events?.endStage?.();
  ctx?.events?.endTurn?.();
}

function findHeroById(player, targetId) {
  if (!targetId) {
    return null;
  }
  return player.tableau.find((hero) => hero.id === targetId || hero.cardId === targetId) ?? null;
}

function findCardByUid(G, uid) {
  return (
    G.adventureRow.find((card) => card.uid === uid) ||
    G.discoveredLocations.find((card) => card.uid === uid) ||
    (G.revealedFortress && G.revealedFortress.uid === uid ? G.revealedFortress : null) ||
    (G.revealedVillain && G.revealedVillain.uid === uid ? G.revealedVillain : null)
  );
}

function isLocationDiscovered(G, id) {
  return G.discoveredLocations.some((location) => location.id === id);
}

function discoverLocation(G, card) {
  if (isLocationDiscovered(G, card.id)) {
    return;
  }
  G.discoveredLocations.push(card);
  G.adventureRow = G.adventureRow.filter((entry) => entry.uid !== card.uid);
  refillAdventureRow(G);
  G.log.unshift(`${card.name} is now a discovered location.`);
}

function getDiscoveredLocationById(G, id) {
  return G.discoveredLocations.find((location) => location.id === id) ?? null;
}

function refillAdventureRow(G) {
  while (G.adventureRow.length < ADVENTURE_ROW_SIZE && G.adventureDeck.length > 0) {
    const nextCard = G.adventureDeck.shift();
    G.adventureRow.push(nextCard);
  }
}

function addCardsToDiscard(G, cards) {
  if (!cards || cards.length === 0) {
    return;
  }
  G.discardPile = G.discardPile ?? [];
  cards.forEach((card) => {
    if (card) {
      G.discardPile.push(card);
    }
  });
}

function resolveNight(G, ctx) {
  G.turnState = null;
  const removed = [];
  G.adventureRow = G.adventureRow.filter((card) => {
    if ((card.vermin ?? 0) > 0) {
      removed.push(card);
      return false;
    }
    return true;
  });
  if (removed.length > 0) {
    increaseConquest(G, 1);
    const names = removed.map((card) => card.name).join(', ');
    G.log.unshift(`Occupied sites lost: ${names}`);
    addCardsToDiscard(G, removed);
  }
  refillAdventureRow(G);

  spawnNightVermin(G);
  applyHordeNightEffect(G);
  allowRest(G, ctx);
  increaseConquest(G, 1);
  G.log.unshift('Night falls. Vermin advance across Mossflower.');
}

function spawnNightVermin(G) {
  const targets = [...G.adventureRow, ...G.discoveredLocations];
  if (G.revealedFortress) {
    targets.push(G.revealedFortress);
  }
  if (G.revealedVillain) {
    targets.push(G.revealedVillain);
  }
  if (!targets.length) {
    return;
  }
  for (let i = 0; i < G.conquestTrack; i += 1) {
    const card = targets[i % targets.length];
    addVerminToCard(card, 1);
  }
}

function allowRest(G, ctx) {
  Object.values(G.players).forEach((player) => {
    const cubesToReturn = [];
    for (const hero of player.tableau) {
      while (hero.cubes.length > 0 && cubesToReturn.length < 2) {
        const cube = hero.cubes.pop();
        cubesToReturn.push(cube);
        triggerAbilityHook({ G, ctx, player, hero, cube, hook: 'onCubeRemovedFromHero' });
      }
      if (cubesToReturn.length >= 2) {
        break;
      }
    }
    cubesToReturn.forEach((cube) => player.bag.push(cube));
    if (player.exhaustion && player.tableau[0].cubes.length < player.tableau[0].slots) {
      player.exhaustion = false;
    }
  });
}

export function getCubeColor(cube) {
  return cubePalette[cube]?.color ?? '#888';
}

function unlockHelperStage(G) {
  if (!G.turnState || G.turnState.helpers?.allowed) {
    return;
  }
  const threshold = G.turnState.mode === 'combat' ? G.turnState.minDraw : 1;
  const player = G.players[G.turnState.playerID];
  if (player.drawnThisTurn.length >= Math.max(1, threshold)) {
    G.turnState.helpers.allowed = true;
  }
}

function gatherActionCubes(player, helpers) {
  const cubes = [...(player.drawnThisTurn ?? [])];
  if (!helpers?.draws) {
    return cubes;
  }
  Object.values(helpers.draws).forEach((helperCubes) => {
    cubes.push(...helperCubes);
  });
  return cubes;
}

function updateBustStatus(G, ctx) {
  if (!G.turnState) {
    return;
  }
  const player = getCurrentPlayer(G, ctx);
  const cubes = gatherActionCubes(player, G.turnState.helpers);
  player.didBust = checkBust(cubes);
  G.turnState.busted = player.didBust;
  if (player.didBust) {
    concludeDayAction(G, ctx);
  }
}

function transferHelperCubes(G, player) {
  const helpers = G.turnState?.helpers;
  if (!helpers) {
    return;
  }
  Object.entries(helpers.draws ?? {}).forEach(([helperId, cubes]) => {
    const helper = G.players[helperId];
    if (!helper) {
      return;
    }
    cubes.forEach((cube) => {
      if (cube === 'inexperience') {
        helper.pendingCubes.push(cube);
      } else {
        player.pendingCubes.push(cube);
      }
    });
  });
  helpers.draws = {};
  helpers.allowed = false;
}

function concludeDayAction(G, ctx) {
  if (!G.turnState || G.turnState.resolved) {
    return;
  }
  const player = getCurrentPlayer(G, ctx);
  const card = findCardByUid(G, G.turnState.targetId);
  const outcome = resolveActivity(G, ctx, player, card, G.turnState);
  G.turnState.resolved = true;
  if (outcome) {
    G.log.unshift(outcome);
  }
  ctx?.events?.setStage?.(DUSK_STAGE);
}

function calculateAffinityBonus(player, card) {
  if (!card?.affinity || card.affinity.length === 0) {
    return 0;
  }
  let bonus = 0;
  player.tableau.forEach((hero) => {
    const heroAffinity = hero.affinity ?? [];
    heroAffinity.forEach((type) => {
      if (card.affinity.includes(type)) {
        bonus += 1;
      }
    });
  });
  return bonus;
}

function resolveCardAction(G, player, card) {
  if (player.didBust) {
    return `${player.name} busts while working ${card.name}.`;
  }
  if (card.type === 'quest') {
    return resolveQuest(G, player, card);
  }
  let reward = '';
  switch (card.id) {
    case 'redwall-infirmary':
      reward = handleInfirmary(player);
      break;
    case 'great-hall':
    case 'loc-great-hall':
      player.bag.push('food');
      reward = `${player.name} secures provisions from the Great Hall.`;
      break;
    case 'cellar':
    case 'loc-the-cellar':
      player.bag.push('food');
      player.bag.push('food');
      reward = `${player.name} stocks up on cellared food.`;
      break;
    case 'loc-mossflower-border':
      player.bag.push('mouse');
      reward = `${player.name} gathers scouts along Mossflower Border.`;
      break;
    case 'loc-salamandastron':
      reward = `${player.name} gains resolve at Salamandastron.`;
      break;
    default:
      reward = `${player.name} completes ${card.name}.`;
      break;
  }
  return reward;
}

function handleInfirmary(player) {
  let removed = 0;
  for (const hero of player.tableau) {
    hero.cubes = hero.cubes.filter((cube) => {
      if (cube === 'wound' && removed < 2) {
        removed += 1;
        return false;
      }
      return true;
    });
    if (removed >= 2) {
      break;
    }
  }
  player.mustVisitInfirmary = false;
  player.exhaustion = false;
  return removed > 0
    ? `${player.name} heals ${removed} wound${removed > 1 ? 's' : ''} at Redwall Infirmary.`
    : `${player.name} rests at Redwall Infirmary.`;
}

function resolveRecruit(G, player, card) {
  if (player.didBust) {
    return `${player.name} busts before recruiting ${card.name}.`;
  }
  if (player.tableau.length >= 4) {
    return `${player.name} has no room to recruit ${card.name}.`;
  }
  const cost = card.cost ?? 0;
  const availableFood = player.pendingCubes.filter((cube) => cube === 'food').length;
  if (availableFood < cost) {
    return `${player.name} needs ${cost} Food to recruit ${card.name}.`;
  }
  spendPendingCubes(player, 'food', cost);

  player.tableau.push({
    id: card.uid,
    cardId: card.id,
    name: card.name,
    slots: card.slots,
    cubes: [],
    isChampion: false,
    affinity: card.affinity ?? [],
    abilityKey: card.abilityKey ?? null
  });
  card.critters?.forEach((entry) => {
    for (let i = 0; i < entry.count; i += 1) {
      player.bag.push(entry.type);
    }
  });
  removeCardFromAdventureRow(G, card.uid);
  refillAdventureRow(G);
  return `${player.name} recruits ${card.name}.`;
}

function spendPendingCubes(player, type, amount) {
  let remaining = amount;
  for (let i = player.pendingCubes.length - 1; i >= 0 && remaining > 0; i -= 1) {
    if (player.pendingCubes[i] === type) {
      player.pendingCubes.splice(i, 1);
      remaining -= 1;
    }
  }
}

function removeCardFromAdventureRow(G, uid) {
  const index = G.adventureRow.findIndex((card) => card.uid === uid);
  if (index >= 0) {
    const [removed] = G.adventureRow.splice(index, 1);
    addCardsToDiscard(G, [removed]);
  }
}

function prepareCombatCubes(player, count) {
  if (!count) {
    return;
  }
  for (let i = 0; i < count; i += 1) {
    player.bag.push('vermin');
  }
}

function cleanupCombatContext(player) {
  if (!player.combatContext) {
    return;
  }
  const drawnVermin = player.drawnThisTurn.filter((cube) => cube === 'vermin').length;
  const undrawn = Math.max(0, player.combatContext.verminAdded - drawnVermin);
  removeCubeTypeFromBag(player.bag, 'vermin', undrawn);
  player.combatContext = null;
  player.lastCombatLocationId = player.locationId;
}

function removeCubeTypeFromBag(bag, type, amount) {
  let remaining = amount;
  for (let i = bag.length - 1; i >= 0 && remaining > 0; i -= 1) {
    if (bag[i] === type) {
      bag.splice(i, 1);
      remaining -= 1;
    }
  }
}

function collectWorkers(card, player) {
  if (!card.workers || card.workers.length === 0) {
    return;
  }
  card.workers.forEach((worker) => {
    player.bag.push(worker.cube);
  });
  card.workers = [];
}

function restoreCardVermin(card, amount) {
  if (!card) {
    return;
  }
  card.vermin = (card.vermin ?? 0) + (amount ?? 0);
}

function promoteInexperience(player) {
  if (replaceCube(player.bag, 'inexperience', 'mastery')) {
    return true;
  }
  for (const hero of player.tableau) {
    if (replaceCube(hero.cubes, 'inexperience', 'mastery')) {
      return true;
    }
  }
  if (replaceCube(player.pendingCubes, 'inexperience', 'mastery')) {
    return true;
  }
  return false;
}

function replaceCube(collection, from, to) {
  if (!collection) {
    return false;
  }
  const idx = collection.indexOf(from);
  if (idx === -1) {
    return false;
  }
  collection.splice(idx, 1, to);
  return true;
}

function addVerminToCard(card, amount) {
  if (!card) {
    return;
  }
  card.vermin = card.vermin ?? 0;
  card.workers = card.workers ?? [];
  for (let i = 0; i < amount; i += 1) {
    if (card.workers.length > 0) {
      card.workers.pop();
      continue;
    }
    if (card.vermin < (card.slots ?? Infinity)) {
      card.vermin += 1;
    }
  }
}

function handleFortressVillainProgress(G, card) {
  let message = '';
  if (G.revealedFortress && card.uid === G.revealedFortress.uid) {
    G.revealedFortress = G.fortressDeck.shift() ?? null;
    if (!G.revealedFortress) {
      G.fortressCleared = true;
      message += ' Fortress cleared!';
    } else {
      message += ` ${G.revealedFortress.name} emerges next.`;
    }
  }
  if (G.revealedVillain && card.uid === G.revealedVillain.uid && (card.vermin ?? 0) <= 0) {
    G.villainCleared = true;
    message += ' Villain defeated!';
  }
  return message;
}

function createChampionQuestCards(champion) {
  return (champion.quests ?? []).map((quest, index) => ({
    id: quest.id,
    name: quest.name,
    type: 'quest',
    text: quest.requirement,
    ownerChampionId: champion.id,
    goal: quest.goal,
    slots: quest.goal?.target ?? quest.goal?.cubes ?? 3,
    affinity: champion.affinities ?? [],
    progress: 0,
    completed: false,
    order: index
  }));
}

function attachQuestCardRefs(players, adventureDeck, adventureRow) {
  const pool = [...adventureDeck, ...(adventureRow ?? [])];
  Object.values(players).forEach((player) => {
    player.completedQuests = player.completedQuests ?? [];
    player.quests.forEach((quest) => {
      const questCard = pool.find((card) => card.id === quest.id);
      if (questCard) {
        quest.cardUid = questCard.uid;
      }
    });
  });
}

function resolveQuest(G, player, card) {
  if (card.ownerChampionId && card.ownerChampionId !== player.championId) {
    return `${player.name} cannot progress ${card.name}.`;
  }
  if (card.completed) {
    return `${card.name} already completed.`;
  }
  const goal = normalizeQuestGoal(card);
  const spent = contributeToQuest(player, goal);
  if (!spent) {
    return `${player.name} needs ${goal.target} suitable cubes for ${card.name}.`;
  }
  card.completed = true;
  player.completedQuests.push(card.id);
  player.quests.forEach((quest) => {
    if (quest.id === card.id) {
      quest.complete = true;
    }
  });
  let reward = '';
  if (promoteInexperience(player)) {
    reward = ' Gains a Mastery cube.';
  }
  removeCardFromAdventureRow(G, card.uid);
  refillAdventureRow(G);
  return `${player.name} completes ${card.name}!${reward}`;
}

function normalizeQuestGoal(card) {
  const raw = card.goal ?? {};
  const target = raw.target ?? raw.cubes ?? card.slots ?? 3;
  return {
    target,
    requires: raw.requires ?? []
  };
}

function contributeToQuest(player, goal) {
  const required = goal.target ?? 0;
  if (required <= 0) {
    return 0;
  }
  const eligible = player.pendingCubes
    .map((cube, index) => ({ cube, index }))
    .filter(({ cube }) => cube !== 'wound' && cube !== 'vermin');
  if (eligible.length < required) {
    return 0;
  }
  const usedIndices = new Set();
  for (const type of goal.requires ?? []) {
    const match = eligible.find((entry) => !usedIndices.has(entry.index) && entry.cube === type);
    if (!match) {
      return 0;
    }
    usedIndices.add(match.index);
  }
  for (const entry of eligible) {
    if (usedIndices.size >= required) {
      break;
    }
    if (!usedIndices.has(entry.index)) {
      usedIndices.add(entry.index);
    }
  }
  if (usedIndices.size < required) {
    return 0;
  }
  const sorted = [...usedIndices].sort((a, b) => b - a);
  sorted.forEach((idx) => player.pendingCubes.splice(idx, 1));
  return required;
}

function getHordeCombatModifier(G) {
  const key = G.hordeCard?.effectKey;
  if (key === 'combat-plus-one') {
    return 1;
  }
  return 0;
}

function applyHordeNightEffect(G) {
  const key = G.hordeCard?.effectKey;
  if (!key) {
    return;
  }
  if (key === 'workers-pressure') {
    const locations = [...G.discoveredLocations];
    if (!locations.length) {
      return;
    }
    locations.sort((a, b) => (b.workers?.length ?? 0) - (a.workers?.length ?? 0));
    const target = locations[0];
    if ((target.workers?.length ?? 0) > 0) {
      addVerminToCard(target, 1);
      G.log.unshift(`Rat Pack swarms ${target.name}, punishing its workers.`);
    }
  }
}

function triggerExhaustion(G, player, ctx) {
  const location = getDiscoveredLocationById(G, player.locationId) ?? getDiscoveredLocationById(G, 'redwall-infirmary');
  let woundsToDrop = 0;
  for (const hero of player.tableau) {
    hero.cubes = hero.cubes.filter((cube) => {
      if (cube === 'wound') {
        woundsToDrop += 1;
        triggerAbilityHook({ G, ctx, player, hero, cube, hook: 'onCubeRemovedFromHero' });
        return false;
      }
      return true;
    });
  }
  if (location) {
    addVerminToCard(location, woundsToDrop);
  }
  player.locationId = 'redwall-infirmary';
  player.mustVisitInfirmary = true;
  player.exhaustion = true;
  return true;
}

function forcePlaceCube(G, player, cube, ctx) {
  if (cube === 'food') {
    player.bag.push(cube);
    return;
  }
  if (cube === 'inexperience') {
    const champion = player.tableau[0];
    if (!placeCubeOnHero(champion, cube)) {
      triggerExhaustion(G, player, ctx);
      placeCubeOnHero(champion, cube);
    }
    return;
  }
  const hero = player.tableau.find((card) => card.cubes.length < card.slots);
  if (hero) {
    hero.cubes.push(cube);
    return;
  }
  triggerExhaustion(G, player, ctx);
  const fallback = player.tableau.find((card) => card.cubes.length < card.slots);
  if (fallback) {
    fallback.cubes.push(cube);
  }
}

function placeCubeOnHero(hero, cube) {
  if (!hero) {
    return false;
  }
  if (hero.cubes.length >= hero.slots) {
    return false;
  }
  hero.cubes.push(cube);
  return true;
}
