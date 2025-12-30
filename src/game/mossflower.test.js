import { describe, expect, it, beforeEach } from 'vitest';
import { MossflowerGame, StageNames } from './mossflower.js';

const dayPhase = MossflowerGame.phases.day;
const dayMoves = dayPhase.turn.stages[StageNames.DAY].moves;

function createMockCtx(numPlayers = 1) {
  const playOrder = Array.from({ length: numPlayers }, (_, idx) => String(idx));
  const ctx = {
    numPlayers,
    playOrder,
    currentPlayer: '0',
    activePlayers: {},
    random: {
      Shuffle: (array) => array.slice(),
      Die: () => 1
    }
  };

  ctx.events = {
    setActivePlayers: (args) => {
      if (args.value) {
        ctx.activePlayers = args.value;
        return;
      }
      ctx.activePlayers = { [ctx.currentPlayer]: args.currentPlayer };
      if (args.others) {
        playOrder.forEach((playerID) => {
          if (playerID !== ctx.currentPlayer) {
            ctx.activePlayers[playerID] = args.others;
          }
        });
      }
    },
    setStage: (stage) => {
      ctx.activePlayers[ctx.currentPlayer] = stage;
    },
    endStage: () => {
      ctx.activePlayers[ctx.currentPlayer] = null;
    },
    endTurn: () => {
      ctx.currentPlayer = playOrder[(playOrder.indexOf(ctx.currentPlayer) + 1) % numPlayers];
      ctx.events.setActivePlayers({ currentPlayer: StageNames.DAY, others: StageNames.ASSIST });
    }
  };

  return ctx;
}

function beginTurn(G, ctx) {
  dayPhase.turn.onBegin(G, ctx);
}

describe('Mossflower setup', () => {
  it('initializes conquest track per player count', () => {
    const ctx = createMockCtx(3);
    const G = MossflowerGame.setup(ctx);
    expect(G.conquestTrack).toBe(3);
    expect(G.adventureRow).toHaveLength(5);
    expect(Object.keys(G.players)).toHaveLength(3);
  });
});

describe('Day actions', () => {
  let ctx;
  let G;
  let player;

  beforeEach(() => {
    ctx = createMockCtx();
    G = MossflowerGame.setup(ctx);
    player = G.players['0'];
    beginTurn(G, ctx);
  });

  it('busts when two bust cubes are drawn', () => {
    const card = G.adventureRow[0];
    card.vermin = 0;
    player.bag = ['inexperience', 'wound'];
    ctx.random.Die = () => 1;

    dayMoves.chooseAction(G, ctx, { targetId: card.uid, mode: 'action' });
    dayMoves.drawCube(G, ctx);
    dayMoves.drawCube(G, ctx);

    expect(player.didBust).toBe(true);
    expect(ctx.activePlayers['0']).toBe(StageNames.DUSK);
  });

  it('rewards major combat victories with conquest relief and mastery', () => {
    const card = G.adventureRow[0];
    card.vermin = 7;
    player.bag = [
      'mouse',
      'hare',
      'badger',
      'squirrel',
      'otter',
      'mole',
      'food',
      'inexperience',
      'mouse',
      'hare'
    ];
    ctx.random.Die = () => 1;

    dayMoves.chooseAction(G, ctx, { targetId: card.uid, mode: 'combat' });
    for (let i = 0; i < 8; i += 1) {
      dayMoves.drawCube(G, ctx);
    }
    dayMoves.stopDrawing(G, ctx);

    expect(G.conquestTrack).toBe(0);
    const masteryCount = [...player.bag, ...player.pendingCubes].filter((cube) => cube === 'mastery');
    expect(masteryCount).toHaveLength(1);
  });

  it('applies affinity bonuses when resolving combat', () => {
    const card = G.adventureRow[0];
    card.vermin = 2;
    card.affinity = ['mouse'];
    player.tableau.push({
      id: 'hero-mouse',
      name: 'Mouse Friend',
      cardId: 'mouse-friend',
      slots: 2,
      cubes: [],
      isChampion: false,
      affinity: ['mouse']
    });
    player.bag = ['mouse', 'food'];
    ctx.random.Die = () => 1;

    dayMoves.chooseAction(G, ctx, { targetId: card.uid, mode: 'combat' });
    dayMoves.drawCube(G, ctx);
    dayMoves.drawCube(G, ctx);
    dayMoves.stopDrawing(G, ctx);

    expect(G.log[0]).toContain('wins combat');
  });

  it('completes champion quests when enough cubes are contributed', () => {
    const quest = {
      uid: 'quest-test',
      id: player.quests[0].id,
      name: 'Heroic Quest',
      type: 'quest',
      ownerChampionId: player.championId,
      goal: { target: 2, requires: [] },
      slots: 2,
      completed: false
    };
    G.adventureRow[0] = quest;
    player.bag = ['mouse', 'hare', 'inexperience'];
    ctx.random.Die = () => 1;

    dayMoves.chooseAction(G, ctx, { targetId: quest.uid, mode: 'action' });
    dayMoves.drawCube(G, ctx);
    dayMoves.drawCube(G, ctx);
    dayMoves.stopDrawing(G, ctx);

    expect(quest.completed).toBe(true);
    const masteryCount = [...player.bag, ...player.pendingCubes].filter((cube) => cube === 'mastery');
    expect(masteryCount.length).toBeGreaterThanOrEqual(1);
  });

  it('applies horde combat modifiers to required draws', () => {
    const card = G.adventureRow[0];
    card.vermin = 1;
    G.hordeCard = { effectKey: 'combat-plus-one' };

    dayMoves.chooseAction(G, ctx, { targetId: card.uid, mode: 'combat' });
    expect(G.turnState.minDraw).toBe(2);
  });
});
