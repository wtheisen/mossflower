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
    drawCube, confirmRecruit, cancelAction,
    endDay, dropCube, returnCubeToBag, endNight,
  } = useGameState();

  const { phase, day, conquest, adventureRow, adventureDeck, discoveredLocations, horde,
    champion, tableau, placements, bag, band, cardSlots,
    action, busted, message, nightReturns } = state;

  const canAct = !action && phase === 'day';
  const isDusk = phase === 'dusk';
  const isNight = phase === 'night';

  // Find the target card for the action overlay
  const targetCard = action
    ? [...adventureRow, ...discoveredLocations].find((c) => c.id === action.targetId)
    : null;

  // During dusk, cards accept cube drops
  const cubeDrop = isDusk ? dropCube : undefined;

  return (
    <div style={styles.board}>
      <StatusBar day={day} phase={phase} conquest={conquest} />

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
            onDraw={drawCube}
            onRecruit={confirmRecruit}
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
          onDraw={drawCube}
          onRecruit={confirmRecruit}
          onCancel={cancelAction}
        />
      )}
    </div>
  );
}
