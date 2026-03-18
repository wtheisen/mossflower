import { useState } from 'react';
import LandingPage from './components/LandingPage';
import StatusBar from './components/StatusBar';
import AdventureRow from './components/AdventureRow';
import PlayerTableau from './components/PlayerTableau';
import Bag from './components/Bag';
import Band from './components/Band';
import HordeArea from './components/HordeArea';
import DiscoveredLocations from './components/DiscoveredLocations';
import CardDetail from './components/CardDetail';

import ActionOverlay from './components/ActionOverlay';
import GameOverOverlay from './components/GameOverOverlay';
import useGameState, { PLAYER_COLORS } from './hooks/useGameState';
import useIsMobile from './hooks/useIsMobile';

/* Layout styles moved to src/layout.css for responsive breakpoints */

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
  const [viewedPlayerIndex, setViewedPlayerIndex] = useState(activePlayerIndex);
  const [draggedCubeType, setDraggedCubeType] = useState(null);
  const [selectedBandCubeIndex, setSelectedBandCubeIndex] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [mobileTab, setMobileTab] = useState('board');
  const { isMobile } = useIsMobile();

  const handleExpand = (card, filledSlots, { playerTokens, wide } = {}) => {
    const actions = [];
    if (canAct && card.type === 'hero') {
      actions.push({ label: 'Recruit', handler: () => { startRecruit(card.id); setExpandedCard(null); } });
    }
    if (canAct && card.type === 'location') {
      actions.push({ label: 'Use Location', handler: () => { useLocationAction(card.id); setExpandedCard(null); } });
    }
    if (canAct && card.type === 'fortress') {
      actions.push({ label: 'Attack Fortress', handler: () => { startFortressCombat(card.id); setExpandedCard(null); } });
    }
    if (canAct && card.type === 'villain' && horde.fortressCleared) {
      actions.push({ label: 'Fight Villain', handler: () => { startVillainCombat(card.id); setExpandedCard(null); } });
    }
    setExpandedCard({ card, filledSlots, actions, playerTokens, wide });
  };

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

  // During dusk, cards accept cube drops (drag-and-drop or tap-to-place)
  const cubeDrop = isDusk ? dropCube : undefined;

  // Tap-to-place: when a band cube is selected, clicking a valid target places it
  const handleTapPlace = (targetId) => {
    if (selectedBandCubeIndex != null && isDusk) {
      dropCube(targetId, selectedBandCubeIndex);
      setSelectedBandCubeIndex(null);
    }
  };


  if (showLanding) {
    return <LandingPage onPlay={(config) => { setGameConfig(config); startGame(config); setShowLanding(false); }} />;
  }

  const showBoard = !isMobile || mobileTab === 'board';
  const showPlayer = !isMobile || mobileTab === 'player';

  return (
    <div className={`board${isMobile ? ' board--mobile' : ''}`}>
      <StatusBar
        day={day}
        phase={phase}
        conquest={conquest}
        activePlayerIndex={activePlayerIndex}
        playerCount={playerCount}
        championName={activePlayer.champion.name}
        compact={isMobile}
      />

      <div className={isMobile ? 'mobile-tab-content' : 'main-area'}>
        {showBoard && (
          <div className={isMobile ? 'mobile-board-view' : 'left-column'}>
            {isMobile ? (
              <div className="mobile-board-main">
                <div className="mobile-board-left">
                  <AdventureRow
                    cards={adventureRow}
                    deckSize={adventureDeck.length}
                    onCardClick={startRecruit}
                    onLocationClick={useLocationAction}
                    selectedId={action?.targetId}
                    canAct={canAct}
                    cardSlots={cardSlots}
                    playerTokensMap={playerTokensMap}
                    compact
                    onExpand={handleExpand}
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
                      onTapPlace={selectedBandCubeIndex != null ? handleTapPlace : undefined}
                      compact
                      onExpand={handleExpand}
                    />
                  )}
                </div>
                <div className="mobile-board-right">
                  <HordeArea
                    fortress={horde.fortress}
                    fortressDeck={horde.fortressDeck}
                    fortressCleared={horde.fortressCleared}
                    villain={horde.villain}
                    canAct={canAct}
                    cardSlots={cardSlots}
                    onFortressClick={startFortressCombat}
                    onVillainClick={startVillainCombat}
                    playerTokensMap={playerTokensMap}
                    compact
                    onExpand={handleExpand}
                  />
                </div>
              </div>
            ) : (
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
                    onTapPlace={selectedBandCubeIndex != null ? handleTapPlace : undefined}
                  />
                )}
              </>
            )}
          </div>
        )}

        {!isMobile && (
          <div className="right-column">
            <HordeArea
              fortress={horde.fortress}
              fortressDeck={horde.fortressDeck}
              fortressCleared={horde.fortressCleared}
              villain={horde.villain}
              canAct={canAct}
              cardSlots={cardSlots}
              onFortressClick={startFortressCombat}
              onVillainClick={startVillainCombat}
              playerTokensMap={playerTokensMap}
            />
          </div>
        )}
      </div>

      {showPlayer && (
        <div className={isMobile ? 'mobile-player-view' : 'player-area'}>
          <PlayerTableau
            champion={viewedPlayer.champion}
            tableau={viewedPlayer.tableau}
            placements={viewedPlayer.placements}
            abilityPlacements={(viewedPlayer.abilityPlacements) ?? {}}
            onCubeDrop={isViewingOwn ? cubeDrop : undefined}
            onTapPlace={isViewingOwn && selectedBandCubeIndex != null ? handleTapPlace : undefined}
            onReturnCube={isViewingOwn && isNight && nightReturns < 2 ? returnCubeToBag : undefined}
            viewedPlayerIndex={viewedPlayerIndex}
            playerCount={playerCount}
            activePlayerIndex={activePlayerIndex}
            onPrevPlayer={() => setViewedPlayerIndex((viewedPlayerIndex - 1 + playerCount) % playerCount)}
            onNextPlayer={() => setViewedPlayerIndex((viewedPlayerIndex + 1) % playerCount)}
            isDusk={isDusk}
            draggedCubeType={draggedCubeType}
            compact={isMobile}
            onExpand={isMobile ? handleExpand : undefined}
            bandSlot={isViewingOwn ? (
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
                selectedCubeIndex={selectedBandCubeIndex}
                onSelectCube={setSelectedBandCubeIndex}
              />
            ) : null}
            bagSlot={isViewingOwn ? <Bag cubes={bag} /> : null}
          />
        </div>
      )}

      {isMobile && (
        <div className="mobile-tab-bar">
          <button
            className={`mobile-tab-btn${mobileTab === 'board' ? ' mobile-tab-btn--active' : ''}`}
            onClick={() => setMobileTab('board')}
          >
            Board
          </button>
          <button
            className={`mobile-tab-btn${mobileTab === 'player' ? ' mobile-tab-btn--active' : ''}`}
            onClick={() => setMobileTab('player')}
          >
            Player
          </button>
        </div>
      )}

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

      {expandedCard && (
        <CardDetail
          card={expandedCard.card}
          filledSlots={expandedCard.filledSlots}
          actions={expandedCard.actions}
          wide={expandedCard.wide}
          playerTokens={expandedCard.playerTokens}
          onClose={() => setExpandedCard(null)}
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
