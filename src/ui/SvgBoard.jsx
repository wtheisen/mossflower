import React from 'react';
import { StageNames, getCubeColor } from '../game/mossflower.js';

const workerEligible = new Set(['mouse', 'hare', 'badger', 'squirrel', 'mole', 'otter', 'mastery']);
const stageLabels = {
  [StageNames.DAY]: 'Day Action',
  [StageNames.DUSK]: 'Dusk',
  [StageNames.ASSIST]: 'Assist',
  waiting: 'Waiting'
};

export function SvgBoard(props) {
  const { G, ctx, moves, playerID, isActive } = props;
  const me = G.players?.[playerID];
  if (!me) {
    return <div className="panel">Waiting for setup...</div>;
  }

  const myStage = me.phase ?? 'waiting';
  const isDayStage = myStage === StageNames.DAY;
  const isDuskStage = myStage === StageNames.DUSK;
  const isAssistStage = myStage === StageNames.ASSIST;
  const pending = me.pendingCubes ?? [];
  const drawn = me.drawnThisTurn ?? [];
  const cardPool = buildCardPool(G);
  const actingTurn = G.turnState ?? null;
  const actingPlayer = actingTurn ? G.players?.[actingTurn.playerID] : null;
  const focusCard = actingTurn ? cardPool.find((card) => card.uid === actingTurn.targetId) : null;
  const actingDrawn = actingPlayer?.drawnThisTurn?.length ?? 0;
  const assistDrawsNeeded = actingTurn?.mode === 'combat' ? Math.max(0, (actingTurn.minDraw ?? 0) - actingDrawn) : 0;
  const helperDraws = actingTurn?.helpers
    ? Object.entries(actingTurn.helpers.draws ?? {}).map(([helperId, cubes]) => ({
        helperId,
        name: G.players?.[helperId]?.name ?? `Player ${helperId}`,
        cubes
      }))
    : [];
  const bagSummary = summarizeBag(me.bag);
  const stageLabel = stageLabels[myStage] ?? stageLabels.waiting;
  const canDraw = Boolean(isActive && isDayStage && moves.drawCube);
  const needMoreDraws = Boolean(
    actingTurn &&
    actingTurn.playerID === playerID &&
    actingTurn.mode === 'combat' &&
    drawn.length < (actingTurn.minDraw ?? 0) &&
    !me.didBust
  );
  const canStop = Boolean(isActive && isDayStage && drawn.length > 0 && !needMoreDraws && moves.stopDrawing);
  const myLocation = getLocationName(G, me.locationId);

  return (
    <div className="board-wrapper">
      <section className="panel status-panel" aria-label="status">
        <div className="status-header">
          <div>
            <h2>Mossflower</h2>
            <p className="small-note">Stage: {stageLabel}</p>
          </div>
          <div className="status-tags">
            <span className="tag">Day {G.day}</span>
            <span className="tag">Phase {ctx.phase}</span>
            <span className={`tag ${G.conquestTrack >= 7 ? 'tag-warning' : ''}`}>
              Conquest {G.conquestTrack}/{10}
            </span>
          </div>
        </div>
        <p>Bag size: {me.bag.length} cubes · Current location: {myLocation}</p>
        {me.mustVisitInfirmary && <p className="warning">Must visit Redwall Infirmary next turn.</p>}
        {actingPlayer && (
          <div className="focus-box">
            <div>
              <p className="small-note">Active Champion</p>
              <strong>{actingPlayer.name}</strong>
            </div>
            <div>
              <p className="small-note">Action</p>
              <strong>{actingTurn.mode ?? '—'}</strong>
            </div>
            <div>
              <p className="small-note">Drawn</p>
              <strong>
                {actingDrawn}/{actingTurn?.minDraw ?? 0}
              </strong>
            </div>
            {focusCard && (
              <div className="focus-target">
                <p className="small-note">Target</p>
                <strong>{focusCard.name}</strong>
                <span className="stat-line">
                  {focusCard.type} · Vermin {focusCard.vermin ?? 0} · Slots {focusCard.slots ?? 0}
                </span>
                {focusCard.type === 'quest' && (
                  <span className="stat-line">Goal: {focusCard.goal?.target ?? focusCard.slots ?? 3} cubes</span>
                )}
              </div>
            )}
            {helperDraws.length > 0 && (
              <div className="helper-list">
                <p className="small-note">Helpers</p>
                {helperDraws.map((helper) => (
                  <div key={helper.helperId} className="helper-row">
                    <span>{helper.name}</span>
                    <div className="cube-row">
                      {helper.cubes.map((cube, idx) => (
                        <span key={`${helper.helperId}-${cube}-${idx}`} className="cube-chip" style={{ background: getCubeColor(cube) }}>
                          {cube}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="btn-row">
          <button className="btn" disabled={!canDraw} onClick={() => moves.drawCube?.()}>
            Draw Cube
          </button>
          <button
            className="btn"
            disabled={!canStop}
            title={needMoreDraws ? 'Need to meet combat draw requirement before stopping.' : ''}
            onClick={() => moves.stopDrawing?.()}
          >
            {needMoreDraws ? `Draw ${(actingTurn?.minDraw ?? 0) - drawn.length} more` : 'Stop Drawing'}
          </button>
        </div>
        {isDuskStage && (
          <button className="btn" style={{ marginTop: '0.4rem' }} onClick={() => moves.finishDusk?.()}>
            Finish Dusk
          </button>
        )}
        <p>
          Drawn this turn: {drawn.length > 0 ? drawn.join(', ') : '—'}
          {isAssistStage && ' • Assisting ally'}
        </p>
      </section>

      {isAssistStage && actingPlayer && actingPlayer.id !== me.id && (
        <section className="panel assist-panel" aria-label="assist">
          <h3>Assist {actingPlayer.name}</h3>
          <p>
            They need {assistDrawsNeeded > 0 ? assistDrawsNeeded : 'no'} more required draws. Pull cubes from your
            bag to help them finish their action.
          </p>
          <div className="btn-row">
            <button className="btn" onClick={() => moves.assistDraw?.()}>
              Draw for Ally
            </button>
          </div>
        </section>
      )}

      <section className="panel" aria-label="siege status">
        <h3>Horde & Siege</h3>
        {G.hordeCard ? (
          <article className="card card--horde">
            <strong>{G.hordeCard.name}</strong>
            <p className="stat-line">{G.hordeCard.text}</p>
          </article>
        ) : (
          <p>No active Horde effect.</p>
        )}
        {G.revealedFortress && (
          <SiegeCard
            label="Fortress"
            card={G.revealedFortress}
            isDayStage={isDayStage}
            isActive={isActive}
            moves={moves}
          />
        )}
        {G.revealedVillain && (
          <SiegeCard
            label="Villain"
            card={G.revealedVillain}
            isDayStage={isDayStage}
            isActive={isActive && G.fortressCleared}
            moves={moves}
            disabledReason={G.fortressCleared ? null : 'Clear the Fortress first.'}
          />
        )}
      </section>

      <section className="panel" aria-label="bag composition">
        <h3>Bag Composition</h3>
        {bagSummary.length === 0 ? (
          <p>Bag is empty.</p>
        ) : (
          <div className="bag-grid">
            {bagSummary.map(([cube, count]) => (
              <span key={cube} className="cube-chip" style={{ background: getCubeColor(cube) }}>
                {cube}: {count}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="panel" aria-label="travel">
        <h3>Travel & Locations</h3>
        <div className="card-row">
          {G.discoveredLocations.map((loc) => (
            <article key={loc.uid} className={`card travel-card ${loc.id === me.locationId ? 'card--highlight' : ''}`}>
              <strong>{loc.name}</strong>
              <span className="stat-line">
                Workers {loc.workers?.length ?? 0} · Vermin {loc.vermin ?? 0}
              </span>
              <p className="stat-line">{loc.action}</p>
              <button
                className="btn"
                disabled={!isDayStage || !isActive || loc.id === me.locationId}
                onClick={() => moves.travelToLocation?.({ locationId: loc.id })}
              >
                {loc.id === me.locationId ? 'Currently Here' : 'Travel'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" aria-label="quests">
        <h3>Champion Quests</h3>
        <div className="quest-list">
          {(me.quests ?? []).map((quest) => {
            const rowIndex = quest.cardUid ? G.adventureRow.findIndex((card) => card.uid === quest.cardUid) : -1;
            const inRow = rowIndex >= 0;
            return (
              <article key={quest.uid ?? quest.id} className={`quest-card ${quest.complete ? 'quest-card--done' : ''}`}>
                <header>
                  <strong>{quest.name}</strong>
                  <span className="tag small">
                    {quest.complete ? 'Completed' : inRow ? `In Row (Slot ${rowIndex + 1})` : 'Pending'}
                  </span>
                </header>
                <p className="stat-line">{quest.requirement}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel" aria-label="adventure row">
        <h3>Adventure Row</h3>
        <div className="card-row">
          {G.adventureRow.map((card) => (
            <AdventureCard
              key={card.uid}
              card={card}
              isDayStage={isDayStage}
              isActive={isActive}
              moves={moves}
              questOwnerName={card.ownerChampionId ? findChampionName(G, card.ownerChampionId) : null}
              isPlayerQuest={card.ownerChampionId === me.championId}
              infoText={card.ability || card.action || card.text || ''}
            />
          ))}
        </div>
      </section>

      <section className="panel" aria-label="pending placement">
        <h3>Dusk Placement</h3>
        {focusCard?.type === 'quest' && actingTurn?.playerID === playerID && (
          <p className="small-note">
            {focusCard.name} requires {focusCard.goal?.target ?? focusCard.slots ?? 3} cubes
            {focusCard.goal?.requires?.length ? ` (${focusCard.goal.requires.join(', ')})` : ''}.
          </p>
        )}
        {pending.length === 0 ? (
          <p>No cubes awaiting placement.</p>
        ) : (
          <div className="pending-list">
            {pending.map((cube, index) => (
              <div key={`${cube}-${index}`} className="cube-chip" style={{ background: getCubeColor(cube) }}>
                {cube}
                {isDuskStage && (
                  <div className="btn-row" style={{ marginTop: '0.35rem' }}>
                    {me.tableau.map((hero) => (
                      <button
                        key={`${hero.id}-${index}`}
                        className="btn"
                        onClick={() => moves.assignCubeToTableau?.({ cubeIndex: index, targetId: hero.id })}
                      >
                        {hero.isChampion ? 'Champion' : hero.name}
                      </button>
                    ))}
                    <button
                      className="btn"
                      disabled={!workerEligible.has(cube) || !myLocation}
                      onClick={() => moves.assignCubeToLocation?.({ cubeIndex: index })}
                    >
                      Location
                    </button>
                    <button
                      className="btn"
                      disabled={cube !== 'food'}
                      onClick={() => moves.discardCube?.({ cubeIndex: index })}
                    >
                      Return Food
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel" aria-label="tableau">
        <h3>Tableau</h3>
        {me.tableau.map((hero) => (
          <article key={hero.id} className="card">
            <strong>{hero.name}</strong>
            <span className="stat-line">
              Slots {hero.cubes.length}/{hero.slots}
            </span>
            <div className="cube-row">
              {hero.cubes.map((cube, idx) => (
                <span key={`${cube}-${idx}`} className="cube-chip" style={{ background: getCubeColor(cube) }}>
                  {cube}
                </span>
              ))}
              {hero.cubes.length === 0 && <span className="small-note">Empty</span>}
            </div>
          </article>
        ))}
      </section>

      <section className="panel" aria-label="allies">
        <h3>Allies</h3>
        <div className="ally-list">
          {Object.values(G.players).map((player) => (
            <div key={player.id} className={`ally-row ${player.id === ctx.currentPlayer ? 'ally-row--active' : ''}`}>
              <div>
                <strong>{player.name}</strong>
                <p className="small-note">{stageLabels[player.phase] ?? stageLabels.waiting}</p>
              </div>
              <div className="ally-meta">
                <span>Bag {player.bag.length}</span>
                <span>{getLocationName(G, player.locationId)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel" aria-label="log">
        <h3>Journal</h3>
        <div className="log-area">
          <ul>
            {G.log.slice(0, 10).map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function AdventureCard({ card, isDayStage, isActive, moves, questOwnerName, isPlayerQuest, infoText }) {
  const occupied = (card.vermin ?? 0) > 0;
  const classNames = ['card'];
  if (card.type === 'quest') classNames.push('card--quest');
  if (occupied) classNames.push('card--occupied');
  if (isPlayerQuest) classNames.push('card--questOwned');

  return (
    <article className={classNames.join(' ')}>
      <strong>{card.name}</strong>
      {infoText && (
        <span className="info-tip" data-tooltip={infoText} aria-label={infoText}>
          ⓘ
        </span>
      )}
      <svg viewBox="0 0 120 60" role="img" aria-label={card.name}>
        <rect width="120" height="60" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" />
        <text x="8" y="24" fill="#fff" fontSize="10">
          {card.type.toUpperCase()}
        </text>
        <text x="8" y="46" fill="#ffd966" fontSize="12">
          Vermin: {card.vermin ?? 0}
        </text>
      </svg>
      <span className="stat-line">Slots: {card.slots ?? 0}</span>
      {card.type === 'quest' && (
        <span className="stat-line">
          Owner: {questOwnerName ?? 'Any'} · Goal {card.goal?.target ?? card.slots ?? 3}
        </span>
      )}
      {card.type === 'hero' && (
        <span className="stat-line">Cost: {card.cost ?? 0} Food</span>
      )}
      <div className="btn-row">
        <button
          className="btn"
          disabled={!isDayStage || !isActive || occupied}
          onClick={() => moves.chooseAction?.({ targetId: card.uid, mode: 'action' })}
        >
          Action
        </button>
        <button
          className="btn"
          disabled={!isDayStage || !isActive || (card.vermin ?? 0) === 0}
          onClick={() => moves.chooseAction?.({ targetId: card.uid, mode: 'combat' })}
        >
          Combat
        </button>
      </div>
      {card.type === 'hero' && (
        <button
          className="btn"
          disabled={!isDayStage || !isActive}
          onClick={() => moves.chooseAction?.({ targetId: card.uid, mode: 'recruit' })}
        >
          Recruit
        </button>
      )}
      {card.type === 'quest' && card.goal?.requires?.length > 0 && (
        <p className="small-note">Requires: {card.goal.requires.join(', ')}</p>
      )}
    </article>
  );
}

function SiegeCard({ label, card, isDayStage, isActive, moves, disabledReason }) {
  const disabled = !isDayStage || !isActive || (card.vermin ?? 0) === 0 || Boolean(disabledReason);
  const classNames = ['card', label === 'Villain' ? 'card--villain' : 'card--fortress'];
  return (
    <article className={classNames.join(' ')}>
      <strong>
        {label}: {card.name}
      </strong>
      <span className="stat-line">Vermin {card.vermin ?? 0} · Slots {card.slots ?? 0}</span>
      <p className="stat-line">{card.text}</p>
      <button
        className="btn"
        disabled={disabled}
        title={disabledReason ?? ''}
        onClick={() => moves.chooseAction?.({ targetId: card.uid, mode: 'combat' })}
      >
        Engage in Combat
      </button>
    </article>
  );
}

function buildCardPool(G) {
  const pool = [...G.adventureRow, ...G.discoveredLocations];
  if (G.revealedFortress) {
    pool.push(G.revealedFortress);
  }
  if (G.revealedVillain) {
    pool.push(G.revealedVillain);
  }
  return pool;
}

function summarizeBag(bag) {
  const counts = bag.reduce((acc, cube) => {
    acc[cube] = (acc[cube] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts);
}

function findChampionName(G, championId) {
  return Object.values(G.players).find((player) => player.championId === championId)?.name ?? null;
}

function getLocationName(G, locationId) {
  if (!locationId) {
    return 'Unknown';
  }
  const location = G.discoveredLocations.find((loc) => loc.id === locationId);
  if (location) {
    return location.name;
  }
  if (G.revealedFortress?.id === locationId) {
    return G.revealedFortress.name;
  }
  if (G.revealedVillain?.id === locationId) {
    return G.revealedVillain.name;
  }
  return locationId.replace(/-/g, ' ');
}
