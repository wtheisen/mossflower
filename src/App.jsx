import StatusBar from './components/StatusBar';
import AdventureRow from './components/AdventureRow';
import PlayerTableau from './components/PlayerTableau';
import Bag from './components/Bag';
import Band from './components/Band';
import HordeArea from './components/HordeArea';
import DiscoveredLocations from './components/DiscoveredLocations';
import ActionOverlay from './components/ActionOverlay';
import useGameState from './hooks/useGameState';

const styles = {
  board: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  middle: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  playerArea: {
    borderTop: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
    padding: '16px 20px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  tableauWrap: {
    flex: 1,
    minWidth: 0,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flexShrink: 0,
  },
};

export default function App() {
  const {
    state, startRecruit, useLocationAction,
    drawCube, confirmRecruit, resolveCombat, cancelAction,
    endDay, dropCube, returnCubeToBag, endNight,
    calculatePower, getPlayerBustThreshold,
  } = useGameState(2);

  const { phase, day, conquest, adventureRow, adventureDeck, discoveredLocations, horde,
    players, activePlayerIndex, playerCount, cardSlots, message } = state;
  const activePlayer = players[activePlayerIndex];
  const { champion, tableau, placements, abilityPlacements, bag, band, action, busted, bustCount, nightReturns, drawBonuses } = activePlayer;

  const canAct = !action && phase === 'day';
  const isDusk = phase === 'dusk';
  const isNight = phase === 'night';

  // Calculate power and bust threshold for display
  const power = calculatePower(activePlayer);
  const bustThreshold = getPlayerBustThreshold(activePlayer);

  // Find the target card for the action overlay
  const targetCard = action
    ? [...adventureRow, ...discoveredLocations].find((c) => c.id === action.targetId)
    : null;

  // During dusk, cards accept cube drops
  const cubeDrop = isDusk ? dropCube : undefined;

  return (
    <div style={styles.board}>
      <StatusBar
        day={day}
        phase={phase}
        conquest={conquest}
        activePlayerIndex={activePlayerIndex}
        playerCount={playerCount}
        championName={activePlayer.champion.name}
      />

      <div style={styles.middle}>
        <HordeArea
          fortress={horde.fortress}
          fortressDeckSize={horde.fortressDeckSize}
          villain={horde.villain}
          conquest={conquest}
        />
        <AdventureRow
          cards={adventureRow}
          deckSize={adventureDeck.length}
          onCardClick={startRecruit}
          onLocationClick={useLocationAction}
          selectedId={action?.targetId}
          canAct={canAct}
          cardSlots={cardSlots}
        />
        <DiscoveredLocations
          locations={discoveredLocations}
          onCardClick={useLocationAction}
          canAct={canAct}
          cardSlots={cardSlots}
          onCubeDrop={cubeDrop}
        />
      </div>

      <div style={styles.playerArea}>
        <div style={styles.tableauWrap}>
          <PlayerTableau
            champion={champion}
            tableau={tableau}
            placements={placements}
            abilityPlacements={abilityPlacements ?? {}}
            onCubeDrop={cubeDrop}
            onReturnCube={isNight && nightReturns < 2 ? returnCubeToBag : undefined}
          />
        </div>
        <div style={styles.sidebar}>
          <Bag cubes={bag} />
          <Band
            cubes={band}
            action={action}
            busted={busted}
            bagEmpty={bag.length === 0}
            message={message}
            power={power}
            bustThreshold={bustThreshold}
            bustCount={bustCount ?? 0}
            drawBonuses={drawBonuses}
            onDraw={drawCube}
            onRecruit={confirmRecruit}
            onResolveCombat={resolveCombat}
            onCancel={cancelAction}
            canEndDay={phase === 'day' && !action}
            onEndDay={endDay}
            isDusk={isDusk}
            isNight={isNight}
            nightReturns={nightReturns}
            onEndNight={endNight}
          />
        </div>
      </div>

      {action && targetCard && (
        <ActionOverlay
          targetCard={targetCard}
          bag={bag}
          band={band}
          action={action}
          busted={busted}
          bagEmpty={bag.length === 0}
          message={message}
          power={power}
          bustThreshold={bustThreshold}
          bustCount={bustCount ?? 0}
          drawBonuses={drawBonuses}
          onDraw={drawCube}
          onRecruit={confirmRecruit}
          onResolveCombat={resolveCombat}
          onCancel={cancelAction}
        />
      )}
    </div>
  );
}
