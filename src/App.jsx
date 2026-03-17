import { useState } from 'react';
import LandingPage from './components/LandingPage';
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
import useGameState, { PLAYER_COLORS } from './hooks/useGameState';

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
    flexShrink: 0,
    overflowX: 'auto',
  },
};

const DEFAULT_CONFIG = { playerCount: 2, championIds: ['matthias', 'ralph'], villainId: 'vil-cluny' };

export default function App() {
  const [gameConfig, setGameConfig] = useState(DEFAULT_CONFIG);
  const [showLanding, setShowLanding] = useState(true);

  const {
    state, startRecruit, useLocationAction,
    drawCube, confirmRecruit, resolveCombat, forfeitCombat, cancelAction,
    endDay, dropCube, discardFood, returnCubeToBag, endNight,
    startFortressCombat, startVillainCombat, startGame, restartGame,
    requestHelp, helperDrawCube, helperDone, skipHelp,
    calculatePower, getPlayerBustThreshold,
  } = useGameState(gameConfig);

  const { phase, day, conquest, adventureRow, adventureDeck, discoveredLocations, horde,
    players, activePlayerIndex, playerCount, cardSlots, message, gameResult, helpPhase } = state;
  const activePlayer = players[activePlayerIndex];
  const { champion, tableau, placements, abilityPlacements, bag, band, action, busted, bustCount, nightReturns, drawBonuses } = activePlayer;

  const canAct = !action && phase === 'day';
  const isDusk = phase === 'dusk';
  const isNight = phase === 'night';
  const [activeTab, setActiveTab] = useState('adventure');
  const [viewedPlayerIndex, setViewedPlayerIndex] = useState(activePlayerIndex);
  const [draggedCubeType, setDraggedCubeType] = useState(null);

  // Reset viewed player when active player changes
  const viewedPlayer = players[viewedPlayerIndex] ?? activePlayer;
  const isViewingOwn = viewedPlayerIndex === activePlayerIndex;

  // Build player location token map: cardId → [{ index, color }]
  const playerTokensMap = {};
  for (const p of players) {
    if (p.currentLocation) {
      if (!playerTokensMap[p.currentLocation]) playerTokensMap[p.currentLocation] = [];
      playerTokensMap[p.currentLocation].push({ index: p.id, color: PLAYER_COLORS[p.id] });
    }
  }

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

  const tabs = [
    {
      id: 'adventure',
      label: 'Adventure',
      badge: adventureRow.length + (discoveredLocations.length > 0 ? ` / ${discoveredLocations.length}L` : ''),
      accentColor: 'var(--type-hero)',
      content: (
        <>
          <AdventureRow
            cards={adventureRow}
            deckSize={adventureDeck.length}
            onCardClick={startRecruit}
            onLocationClick={useLocationAction}
            selectedId={action?.targetId}
            canAct={canAct}
            cardSlots={cardSlots}
            playerTokensMap={playerTokensMap}
          />
          {discoveredLocations.length > 0 && (
            <DiscoveredLocations
              locations={discoveredLocations}
              onCardClick={useLocationAction}
              canAct={canAct}
              cardSlots={cardSlots}
              onCubeDrop={cubeDrop}
              isDusk={isDusk}
              draggedCubeType={draggedCubeType}
              playerTokensMap={playerTokensMap}
            />
          )}
        </>
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
          playerTokensMap={playerTokensMap}
        />
      ),
    },
  ];

  if (showLanding) {
    return <LandingPage onPlay={(config) => { setGameConfig(config); startGame(config); setShowLanding(false); }} />;
  }

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
        <PlayerTableau
          champion={viewedPlayer.champion}
          tableau={viewedPlayer.tableau}
          placements={viewedPlayer.placements}
          abilityPlacements={(viewedPlayer.abilityPlacements) ?? {}}
          onCubeDrop={isViewingOwn ? cubeDrop : undefined}
          onReturnCube={isViewingOwn && isNight && nightReturns < 2 ? returnCubeToBag : undefined}
          viewedPlayerIndex={viewedPlayerIndex}
          playerCount={playerCount}
          activePlayerIndex={activePlayerIndex}
          onPrevPlayer={() => setViewedPlayerIndex((viewedPlayerIndex - 1 + playerCount) % playerCount)}
          onNextPlayer={() => setViewedPlayerIndex((viewedPlayerIndex + 1) % playerCount)}
          isDusk={isDusk}
          draggedCubeType={draggedCubeType}
          bandSlot={isViewingOwn ?
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
              onDiscardFood={discardFood}
              helpPhase={helpPhase}
              onDragCubeType={setDraggedCubeType}
            />
            : null
          }
          bagSlot={isViewingOwn ? <Bag cubes={bag} /> : null}
        />
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
          onForfeit={forfeitCombat}
          onCancel={cancelAction}
          helpPhase={helpPhase}
          players={players}
          activePlayerIndex={activePlayerIndex}
          onRequestHelp={requestHelp}
          onHelperDraw={helperDrawCube}
          onHelperDone={helperDone}
          onSkipHelp={skipHelp}
          getPlayerBustThreshold={getPlayerBustThreshold}
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
