import { shuffleArray } from './constants';
import { initCardSlots } from './helpers';
import { CHAMPIONS, BASE_LOCATIONS, expandStartingBag, buildAdventure, buildHorde } from '../data/cards';

export function createPlayer(index, championId) {
  const champion = CHAMPIONS.find(c => c.id === championId) ?? CHAMPIONS[0];
  const bag = shuffleArray(expandStartingBag(champion.startingBag));
  return {
    id: index,
    champion,
    tableau: [],
    placements: {},
    abilityPlacements: {},
    bag,
    band: [],
    action: null,
    bustCount: 0,
    busted: false,
    selectedCubeIndex: null,
    nightReturns: 0,
    actionsUsed: 0,
    passed: false,
    currentLocation: null,
    drawBonuses: { power: 0, bagAdds: [], messages: [] },
    helpBand: [],
    helpBustCount: 0,
    helpBusted: false,
  };
}

export function buildInitialState(config) {
  const { playerCount, championIds, villainId } = config;
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(createPlayer(i, championIds[i]));
  }
  const horde = buildHorde(villainId);
  const { adventureRow, adventureDeck } = buildAdventure(shuffleArray);
  const cardSlots = initCardSlots(adventureRow);

  if (horde.fortress) {
    cardSlots[horde.fortress.id] = Array.from(
      { length: horde.fortress.startingVermin },
      () => ({ type: 'vermin' }),
    );
  }
  if (horde.villain) {
    cardSlots[horde.villain.id] = Array.from(
      { length: horde.villain.startingVermin },
      () => ({ type: 'vermin' }),
    );
  }

  return {
    phase: 'day',
    day: 1,
    conquest: 2,
    playerCount,
    activePlayerIndex: 0,
    helpPhase: false,
    players,
    gameResult: null,
    adventureRow,
    discoveredLocations: [...BASE_LOCATIONS],
    horde,
    adventureDeck: shuffleArray(adventureDeck),
    cardSlots,
    message: null,
    log: [],
  };
}
