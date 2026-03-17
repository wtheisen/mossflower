import { useState } from 'react';
import StatusBar from './components/StatusBar';
import AdventureRow from './components/AdventureRow';
import PlayerTableau from './components/PlayerTableau';
import Bag from './components/Bag';
import Band from './components/Band';
import HordeArea from './components/HordeArea';
import DiscoveredLocations from './components/DiscoveredLocations';
import BoardTabs from './components/BoardTabs';
import ActionOverlay from './components/ActionOverlay';
import GameOverOverlay from './components/GameOverOverlay';
import useGameState from './hooks/useGameState';

const styles = {
  board: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  playerArea: {
    borderTop: '2px solid var(--border-card)',
    background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
    padding: '12px 24px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    flexShrink: 0,
    overflowX: 'auto',
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
    drawCube, confirmRecruit, resolveCombat, forfeitCombat, cancelAction,
    endDay, dropCube, returnCubeToBag, endNight,
    startFortressCombat, startVillainCombat, restartGame,
    calculatePower, getPlayerBustThreshold,
  } = useGameState(2);

  const { phase, day, conquest, adventureRow, adventureDeck, discoveredLocations, horde,
    players, activePlayerIndex, playerCount, cardSlots, message, gameResult } = state;
  const activePlayer = players[activePlayerIndex];
  const { champion, tableau, placements, abilityPlacements, bag, band, action, busted, bustCount, nightReturns, drawBonuses } = activePlayer;

  const canAct = !action && phase === 'day';
  const isDusk = phase === 'dusk';
  const isNight = phase === 'night';

  const [activeTab, setActiveTab] = useState('adventure');

  // Calculate power and bust threshold for display
  const power = calculatePower(activePlayer);
  const bustThreshold = getPlayerBustThreshold(activePlayer);

  // Next-draw teaser: what happens if the next cube is a mouse?
  let nextDrawTeaser = null;
  if (action && band.length > 0 && !busted && bag.length > 0) {
    const hypotheticalBand = [...band, 'mouse'];
    const hypotheticalPlayer = { ...activePlayer, band: hypotheticalBand };
    const hypotheticalPower = calculatePower(hypotheticalPlayer);
    const powerGain = hypotheticalPower - power;
    let teaser = `If mouse: power ${hypotheticalPower} (+${powerGain})`;
    const provisions = champion.abilities?.find((a) => a.effect === 'addFoodPerMouse');
    if (provisions) {
      const placed = (abilityPlacements ?? {})[provisions.id] ?? [];
      if (placed.length > 0) {
        teaser += ` and +${placed.length} food to bag`;
      }
    }
    nextDrawTeaser = teaser;
  }

  // Find the target card for the action overlay
  const targetCard = action
    ? [...adventureRow, ...discoveredLocations,
       ...(horde.fortress ? [horde.fortress] : []),
       ...(horde.villain ? [horde.villain] : []),
      ].find((c) => c.id === action.targetId)
    : null;

  // During dusk, cards accept cube drops
  const cubeDrop = isDusk ? dropCube : undefined;

  // Count total vermin across locations for badge
  const locationVermin = discoveredLocations.reduce((sum, loc) => {
    const slots = cardSlots[loc.id] ?? [];
    return sum + slots.filter((c) => c.type === 'vermin').length;
  }, 0);

  const tabs = [
    {
      id: 'adventure',
      label: 'Adventure',
      badge: adventureRow.length,
      accentColor: 'var(--type-hero)',
      content: (
        <AdventureRow
          cards={adventureRow}
          deckSize={adventureDeck.length}
          onCardClick={startRecruit}
          onLocationClick={useLocationAction}
          selectedId={action?.targetId}
          canAct={canAct}
          cardSlots={cardSlots}
        />
      ),
    },
    {
      id: 'horde',
      label: 'Horde',
      badge: `${conquest}/10`,
      badgeColor: conquest >= 7 ? 'var(--accent-red)' : 'var(--type-fortress)',
      accentColor: 'var(--accent-red)',
      content: (
        <HordeArea
          fortress={horde.fortress}
          fortressDeck={horde.fortressDeck}
          fortressCleared={horde.fortressCleared}
          villain={horde.villain}
          conquest={conquest}
          canAct={canAct}
          cardSlots={cardSlots}
          onFortressClick={startFortressCombat}
          onVillainClick={startVillainCombat}
        />
      ),
    },
    {
      id: 'locations',
      label: 'Locations',
      badge: locationVermin > 0 ? `${locationVermin}V` : discoveredLocations.length,
      badgeColor: locationVermin > 0 ? 'var(--accent-red)' : 'var(--type-location)',
      accentColor: 'var(--type-location)',
      content: (
        <DiscoveredLocations
          locations={discoveredLocations}
          onCardClick={useLocationAction}
          canAct={canAct}
          cardSlots={cardSlots}
          onCubeDrop={cubeDrop}
        />
      ),
    },
  ];

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

      <BoardTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

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
            nextDrawTeaser={nextDrawTeaser}
            onDraw={drawCube}
            onRecruit={confirmRecruit}
            onResolveCombat={resolveCombat}
            onForfeit={forfeitCombat}
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

      <GameOverOverlay
        gameResult={gameResult}
        day={day}
        conquest={conquest}
        onRestart={restartGame}
      />
    </div>
  );
}
