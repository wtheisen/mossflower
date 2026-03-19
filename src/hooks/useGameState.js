import { useState, useCallback, useEffect, useRef } from 'react';
import { BUST_TYPES, shuffleArray, STORAGE_KEY } from '../game/constants';
import { getActivePlayer, patchActivePlayer, patchPlayer, countVermin } from '../game/helpers';
import {
  getPlayerBustThreshold, evaluateDrawTriggers, calculatePower,
  getVerminReduction, getCombatWinFood, createAbilityCtx,
} from '../game/abilities';
import {
  checkGameOver, advanceDayTurn, advanceDusk, advanceNight,
  spreadVermin, countAction,
} from '../game/phases';
import { buildInitialState } from '../game/setup';
import { ABILITIES } from '../data/abilities';

// Re-export for backward compatibility
export { PLAYER_COLORS } from '../game/constants';

// ── localStorage persistence ──────────────────────────

function saveGame(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function hasSavedGame() {
  const saved = loadGame();
  return saved != null && saved.phase != null;
}

export function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Hook ──────────────────────────────────────────────

export default function useGameState(config) {
  const [state, setState] = useState(() => buildInitialState(config));
  const mountedRef = useRef(false);

  // Auto-save on state changes (skip initial mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    saveGame(state);
  }, [state]);

  const resumeGame = useCallback(() => {
    const saved = loadGame();
    if (saved) setState(saved);
  }, []);

  // ── Day Actions ─────────────────────────────────────

  const startRecruit = useCallback((cardId) => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (p.action || s.phase !== 'day') return s;
      const card = s.adventureRow.find((c) => c.id === cardId);
      if (!card || card.type !== 'hero') return s;
      let result = patchActivePlayer(s, {
        action: { type: 'recruit', targetId: cardId },
        bustCount: 0,
        busted: false,
        currentLocation: cardId,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      result.message = `Recruiting ${card.name} (cost: ${card.cost} food) — draw cubes from your bag.`;
      return result;
    });
  }, []);

  const useLocationAction = useCallback((cardId) => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (p.action || s.phase !== 'day') return s;
      const loc = s.discoveredLocations.find((c) => c.id === cardId)
        || s.adventureRow.find((c) => c.id === cardId);
      if (!loc || loc.type !== 'location') return s;

      const slots = s.cardSlots[cardId] ?? [];
      const verminOnCard = slots.filter((c) => c.type === 'vermin').length;

      if (verminOnCard > 0) {
        const newCardSlots = {
          ...s.cardSlots,
          [cardId]: slots.filter((c) => c.type !== 'vermin'),
        };
        const newBag = [...p.bag];
        for (let i = 0; i < verminOnCard; i++) newBag.push('vermin');

        let result = { ...s, cardSlots: newCardSlots };
        result = patchActivePlayer(result, {
          bag: shuffleArray(newBag),
          action: { type: 'combat', targetId: cardId, verminAdded: verminOnCard },
          bustCount: 0,
          busted: false,
          currentLocation: cardId,
          drawBonuses: { power: 0, bagAdds: [], messages: [] },
        });
        result.message = `Combat at ${loc.name}! ${verminOnCard} vermin added to your bag. Draw at least ${verminOnCard} cubes.`;
        return result;
      }

      const ability = ABILITIES[cardId];
      if (!ability?.onAction) {
        return { ...s, message: `${loc.name}: No action available.` };
      }

      const ctx = createAbilityCtx(s);
      ability.onAction(ctx);
      const { playerPatch, message } = ctx._apply();

      let result = patchActivePlayer(s, { ...playerPatch, currentLocation: cardId });
      result.message = message;

      const inAdventureRow = s.adventureRow.some((c) => c.id === cardId);
      if (inAdventureRow) {
        result = {
          ...result,
          adventureRow: s.adventureRow.filter((c) => c.id !== cardId),
          discoveredLocations: [...s.discoveredLocations, loc],
        };
      }

      if (cardId === 'redwall-infirmary' && result.conquest > 0) {
        const spread = spreadVermin(result, result.conquest);
        result = {
          ...result,
          cardSlots: spread.cardSlots,
          conquest: result.conquest + spread.conquestDelta,
          message: `${result.message} Vermin spread (${result.conquest}): ${spread.log.join('; ')}.${spread.conquestDelta > 0 ? ' Overflow → conquest +1.' : ''}`,
        };
        result = checkGameOver(result);
        if (result.gameResult) return result;
      }

      result = countAction(result);
      return result;
    });
  }, []);

  const drawCube = useCallback(() => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (!p.action || p.busted) return s;
      if (p.bag.length === 0) return { ...s, message: 'Bag is empty!' };

      const newBag = [...p.bag];
      const idx = Math.floor(Math.random() * newBag.length);
      const [drawn] = newBag.splice(idx, 1);
      const newBand = [...p.band, drawn];
      const isCombat = p.action.type === 'combat';

      const isBustType = BUST_TYPES.has(drawn);
      const newBustCount = isBustType ? p.bustCount + 1 : p.bustCount;
      const bustThreshold = getPlayerBustThreshold(p);
      const busted = newBustCount >= bustThreshold;

      const playerForTriggers = { ...p, band: newBand };
      const triggers = evaluateDrawTriggers(playerForTriggers, drawn);

      for (const cubeType of triggers.bagAdds) {
        newBag.push(cubeType);
      }

      const prevBonuses = p.drawBonuses ?? { power: 0, bagAdds: [], messages: [] };
      const newDrawBonuses = {
        power: prevBonuses.power,
        bagAdds: [...prevBonuses.bagAdds, ...triggers.bagAdds],
        messages: [...prevBonuses.messages, ...triggers.messages],
      };

      const power = calculatePower({ ...p, band: newBand, abilityPlacements: p.abilityPlacements });
      const triggerMsg = triggers.messages.length > 0 ? ' ' + triggers.messages.join(' ') : '';

      let message;
      if (isCombat && busted) {
        const { targetId } = p.action;
        const newCardSlots = { ...s.cardSlots };
        const existing = newCardSlots[targetId] ?? [];
        const verminToReturn = newBand.filter((c) => c === 'vermin').length;
        const returnSlots = [];
        for (let i = 0; i < verminToReturn; i++) returnSlots.push({ type: 'vermin' });
        newCardSlots[targetId] = [...existing, ...returnSlots];
        const bandAfter = newBand.filter((c) => c !== 'vermin');

        const loc = s.discoveredLocations.find((c) => c.id === targetId)
          || s.adventureRow.find((c) => c.id === targetId)
          || (s.horde.fortress?.id === targetId ? s.horde.fortress : null)
          || (s.horde.villain?.id === targetId ? s.horde.villain : null);
        const locName = loc?.name ?? targetId;

        let result = { ...s, helpPhase: false, cardSlots: newCardSlots, conquest: s.conquest + 1 };
        result = patchActivePlayer(result, {
          bag: newBag,
          band: bandAfter,
          action: null,
          bustCount: 0,
          busted: false,
          drawBonuses: { power: 0, bagAdds: [], messages: [] },
        });
        result.message = `BUST at ${locName}! Drew "${drawn}" — ${bustThreshold} bad cubes. Vermin return, conquest +1 (now ${s.conquest + 1}).${triggerMsg}`;

        result = checkGameOver(result);
        if (!result.gameResult) result = countAction(result);
        return result;
      } else if (isCombat) {
        const rawVerm = countVermin(newBand);
        const reduction = getVerminReduction({ ...p, band: newBand });
        const effectiveVerm = Math.max(0, rawVerm - reduction);
        const reductionNote = reduction > 0 ? ` (${reduction} negated)` : '';
        const badWarning = newBustCount > 0 ? ` (${newBustCount}/${bustThreshold} bad)` : '';
        message = `Drew "${drawn}" — Power ${power} vs ${effectiveVerm} vermin.${reductionNote}${badWarning}${triggerMsg}`;
      } else if (busted) {
        message = `BUST! Drew "${drawn}" — ${bustThreshold} bad cubes. Power was ${power}.${triggerMsg}`;
      } else {
        const badWarning = newBustCount > 0 ? ` (${newBustCount}/${bustThreshold} bad)` : '';
        message = `Drew "${drawn}" — Power: ${power}. ${newBand.length} cubes drawn.${badWarning}${triggerMsg}`;
      }

      let result = patchActivePlayer(s, {
        bag: newBag, band: newBand, bustCount: newBustCount, busted,
        drawBonuses: newDrawBonuses,
      });
      result.message = message;
      return result;
    });
  }, []);

  // ── Helping Hands ──────────────────────────────────

  const requestHelp = useCallback(() => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (!p.action) return s;
      if (s.playerCount < 2) return { ...s, message: 'No other players to help.' };
      if (s.helpPhase) return s;
      const players = s.players.map((pl, i) =>
        i === s.activePlayerIndex ? pl : { ...pl, helpBand: [], helpBustCount: 0, helpBusted: false },
      );
      return { ...s, players, helpPhase: true, message: 'Help phase — other players may draw from their bags to assist.' };
    });
  }, []);

  const helperDrawCube = useCallback((helperIndex) => {
    setState((s) => {
      if (!s.helpPhase) return s;
      if (helperIndex === s.activePlayerIndex) return s;
      const helper = s.players[helperIndex];
      if (!helper || helper.helpBusted) return { ...s, message: `Player ${helperIndex + 1} already busted.` };
      if (helper.bag.length === 0) return { ...s, message: `Player ${helperIndex + 1}'s bag is empty.` };

      const newBag = [...helper.bag];
      const idx = Math.floor(Math.random() * newBag.length);
      const [drawn] = newBag.splice(idx, 1);
      const newHelpBand = [...helper.helpBand, drawn];

      const isBustType = BUST_TYPES.has(drawn);
      const newBustCount = isBustType ? helper.helpBustCount + 1 : helper.helpBustCount;
      const bustThreshold = getPlayerBustThreshold(helper);
      const busted = newBustCount >= bustThreshold;

      const badWarning = newBustCount > 0 ? ` (${newBustCount}/${bustThreshold} bad)` : '';
      const bustMsg = busted ? ` BUST! Helper's cubes still count.` : '';
      const message = `Player ${helperIndex + 1} drew "${drawn}".${badWarning}${bustMsg}`;

      let result = patchPlayer(s, helperIndex, {
        bag: newBag,
        helpBand: newHelpBand,
        helpBustCount: newBustCount,
        helpBusted: busted,
      });
      result.message = message;
      return result;
    });
  }, []);

  const helperDone = useCallback((helperIndex) => {
    setState((s) => {
      if (!s.helpPhase) return s;
      if (helperIndex === s.activePlayerIndex) return s;
      const helper = s.players[helperIndex];
      if (!helper || helper.helpBand.length === 0) return s;

      const toTransfer = [];
      const toReturn = [];
      for (const cube of helper.helpBand) {
        if (cube === 'inexperience') {
          toReturn.push(cube);
        } else {
          toTransfer.push(cube);
        }
      }

      const activePlayer = getActivePlayer(s);
      const newActiveBand = [...activePlayer.band, ...toTransfer];
      const helperBag = [...helper.bag, ...toReturn];

      let result = patchPlayer(s, helperIndex, {
        bag: shuffleArray(helperBag),
        helpBand: [],
        helpBustCount: 0,
        helpBusted: false,
      });
      result = patchActivePlayer(result, { band: newActiveBand });

      const transferMsg = toTransfer.length > 0 ? `${toTransfer.join(', ')} added to active player's band.` : 'No cubes to transfer.';
      const returnMsg = toReturn.length > 0 ? ` ${toReturn.length} inexperience returned to helper's bag.` : '';
      result.message = `Player ${helperIndex + 1} done helping. ${transferMsg}${returnMsg}`;
      return result;
    });
  }, []);

  const skipHelp = useCallback(() => {
    setState((s) => {
      if (!s.helpPhase) return s;
      let result = { ...s };
      for (let i = 0; i < s.playerCount; i++) {
        if (i === s.activePlayerIndex) continue;
        const helper = result.players[i];
        if (helper.helpBand.length > 0) {
          const toTransfer = [];
          const toReturn = [];
          for (const cube of helper.helpBand) {
            if (cube === 'inexperience') toReturn.push(cube);
            else toTransfer.push(cube);
          }
          const activePlayer = getActivePlayer(result);
          const newActiveBand = [...activePlayer.band, ...toTransfer];
          const helperBag = [...helper.bag, ...toReturn];
          result = patchPlayer(result, i, {
            bag: shuffleArray(helperBag), helpBand: [], helpBustCount: 0, helpBusted: false,
          });
          result = patchActivePlayer(result, { band: newActiveBand });
        }
      }
      return { ...result, helpPhase: false, message: 'Help phase ended. Resolve your action.' };
    });
  }, []);

  const confirmRecruit = useCallback(() => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (!p.action || p.action.type !== 'recruit' || p.busted) return s;
      const target = s.adventureRow.find((c) => c.id === p.action.targetId);
      if (!target) return s;

      const usedSlots = p.tableau.reduce((sum, h) => sum + (h.affinity === 'badger' ? 2 : 1), 0);
      const slotsNeeded = target.affinity === 'badger' ? 2 : 1;
      const maxSlots = p.champion.tableauSlots ?? 5;
      if (usedSlots + slotsNeeded > maxSlots) {
        return { ...s, message: `Not enough tableau space! Need ${slotsNeeded} slot(s), have ${maxSlots - usedSlots} free.` };
      }

      const foodCount = p.band.filter((c) => c === 'food').length;
      if (foodCount < target.cost) {
        return { ...s, message: `Need ${target.cost} food to recruit. Have ${foodCount}. Keep drawing or cancel.` };
      }

      const power = calculatePower(p);
      const inexperienceToRemove = Math.floor(power / 3);

      let foodToRemove = target.cost;
      const newBand = p.band.filter((c) => {
        if (c === 'food' && foodToRemove > 0) { foodToRemove--; return false; }
        return true;
      });

      const newBag = [...p.bag];
      let removed = 0;
      for (let i = newBag.length - 1; i >= 0 && removed < inexperienceToRemove; i--) {
        if (newBag[i] === 'inexperience') {
          newBag.splice(i, 1);
          removed++;
        }
      }

      const heroSlots = s.cardSlots[target.id] ?? [];
      const newCardSlots = { ...s.cardSlots };
      delete newCardSlots[target.id];

      let result = {
        ...s,
        helpPhase: false,
        adventureRow: s.adventureRow.filter((c) => c.id !== target.id),
        cardSlots: newCardSlots,
      };
      result = patchActivePlayer(result, {
        tableau: [...p.tableau, target],
        placements: { ...p.placements, [target.id]: heroSlots },
        band: newBand,
        bag: shuffleArray(newBag),
        action: null,
        bustCount: 0,
        busted: false,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      const inexMsg = removed > 0 ? ` Power ${power} removed ${removed} inexperience!` : '';
      result.message = `Recruited ${target.name}! Spent ${target.cost} food.${inexMsg}`;

      result = countAction(result);
      return result;
    });
  }, []);

  const resolveCombat = useCallback(() => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (!p.action || p.action.type !== 'combat') return s;
      const { targetId, verminAdded, combatTarget } = p.action;

      if (p.band.length < verminAdded) {
        return { ...s, message: `Must draw at least ${verminAdded} cubes. Drawn ${p.band.length} so far.` };
      }

      const power = calculatePower(p);
      const rawVerm = countVermin(p.band);
      const reduction = getVerminReduction(p);
      const verm = Math.max(0, rawVerm - reduction);
      const reductionNote = reduction > 0 ? ` (${rawVerm} vermin - ${reduction} negated)` : '';

      const loc = s.discoveredLocations.find((c) => c.id === targetId)
        || s.adventureRow.find((c) => c.id === targetId)
        || (s.horde.fortress?.id === targetId ? s.horde.fortress : null)
        || (s.horde.villain?.id === targetId ? s.horde.villain : null);
      const locName = loc?.name ?? targetId;

      const clearAction = {
        action: null, bustCount: 0, busted: false,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      };

      s = { ...s, helpPhase: false };

      let result;
      if (power >= verm) {
        const newBand = p.band.filter((c) => c !== 'vermin');

        if (combatTarget === 'villain') {
          const overkill = power - verm;
          const conquestReduction = Math.max(1, overkill);
          const newConquest = Math.max(0, s.conquest - conquestReduction);
          result = { ...s, conquest: newConquest };
          result = patchActivePlayer(result, { band: newBand, ...clearAction });
          result.gameResult = 'win';
          result.message = `Victory! ${locName} is defeated! Mossflower is saved!`;
          return result;
        }

        if (combatTarget === 'fortress') {
          const overkill = power - verm;
          const conquestReduction = Math.max(1, overkill);
          const newConquest = Math.max(0, s.conquest - conquestReduction);
          const newHorde = { ...s.horde };
          const newCardSlots = { ...s.cardSlots };
          delete newCardSlots[targetId];
          const newDeck = [...newHorde.fortressDeck];
          if (newDeck.length > 0) {
            const next = newDeck.pop();
            newHorde.fortress = next;
            newHorde.fortressDeck = newDeck;
            newCardSlots[next.id] = Array.from(
              { length: next.startingVermin },
              () => ({ type: 'vermin' }),
            );
            result = { ...s, conquest: newConquest, horde: newHorde, cardSlots: newCardSlots };
            result = patchActivePlayer(result, { band: newBand, ...clearAction });
            result.message = `Fortress ${locName} cleared! Power ${power} vs ${verm} vermin. Conquest -${conquestReduction} (now ${newConquest}). Next fortress: ${next.name}.`;
          } else {
            newHorde.fortress = null;
            newHorde.fortressDeck = [];
            newHorde.fortressCleared = true;
            result = { ...s, conquest: newConquest, horde: newHorde, cardSlots: newCardSlots };
            result = patchActivePlayer(result, { band: newBand, ...clearAction });
            result.message = `Fortress ${locName} cleared! All fortresses destroyed! The villain is now vulnerable. Conquest -${conquestReduction} (now ${newConquest}).`;
          }
          result = countAction(result);
          return result;
        }

        const overkill = power - verm;
        const conquestReduction = Math.max(1, overkill);
        const newConquest = Math.max(0, s.conquest - conquestReduction);
        const overkillNote = overkill > 0 ? ` Overkill ${overkill} → conquest -${conquestReduction}` : ' Conquest -1';

        const winFood = getCombatWinFood(p);
        const newCardSlots = { ...s.cardSlots };
        if (winFood > 0) {
          const existing = newCardSlots[targetId] ?? [];
          const foodSlots = [];
          for (let i = 0; i < winFood; i++) foodSlots.push({ type: 'food' });
          newCardSlots[targetId] = [...existing, ...foodSlots];
        }
        const foodNote = winFood > 0 ? ` Forager added ${winFood} food to ${locName}.` : '';

        result = { ...s, conquest: newConquest, cardSlots: newCardSlots };
        result = patchActivePlayer(result, { band: newBand, ...clearAction });
        result.message = `Victory at ${locName}! Power ${power} vs ${verm} vermin.${reductionNote}${overkillNote} (now ${newConquest}).${foodNote}`;
      } else {
        const newCardSlots = { ...s.cardSlots };
        const existing = newCardSlots[targetId] ?? [];
        const verminToReturn = p.band.filter((c) => c === 'vermin').length;
        const returnSlots = [];
        for (let i = 0; i < verminToReturn; i++) returnSlots.push({ type: 'vermin' });
        newCardSlots[targetId] = [...existing, ...returnSlots];
        const newBand = p.band.filter((c) => c !== 'vermin');

        result = { ...s, cardSlots: newCardSlots, conquest: s.conquest + 1 };
        result = patchActivePlayer(result, { band: newBand, ...clearAction });
        result.message = `Defeated at ${locName}. Power ${power} vs ${verm} vermin. Vermin return, conquest +1 (now ${s.conquest + 1}).`;

        result = checkGameOver(result);
        if (result.gameResult) return result;
      }

      result = countAction(result);
      return result;
    });
  }, []);

  const forfeitCombat = useCallback(() => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (!p.action || p.action.type !== 'combat') return s;
      const { targetId } = p.action;

      const newCardSlots = { ...s.cardSlots };
      const existing = newCardSlots[targetId] ?? [];
      const verminToReturn = p.band.filter((c) => c === 'vermin').length;
      const returnSlots = [];
      for (let i = 0; i < verminToReturn; i++) returnSlots.push({ type: 'vermin' });
      newCardSlots[targetId] = [...existing, ...returnSlots];
      const newBand = p.band.filter((c) => c !== 'vermin');

      const loc = s.discoveredLocations.find((c) => c.id === targetId)
        || s.adventureRow.find((c) => c.id === targetId)
        || (s.horde.fortress?.id === targetId ? s.horde.fortress : null)
        || (s.horde.villain?.id === targetId ? s.horde.villain : null);
      const locName = loc?.name ?? targetId;

      let result = { ...s, helpPhase: false, cardSlots: newCardSlots, conquest: s.conquest + 1 };
      result = patchActivePlayer(result, {
        band: newBand,
        action: null,
        bustCount: 0,
        busted: false,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      result.message = `Forfeited combat at ${locName}. Vermin return, conquest +1 (now ${s.conquest + 1}).`;

      result = checkGameOver(result);
      if (!result.gameResult) result = countAction(result);
      return result;
    });
  }, []);

  const cancelAction = useCallback(() => {
    setState((s) => {
      const p = getActivePlayer(s);
      if (!p.action) return s;

      const wasBusted = p.busted;
      let result = patchActivePlayer({ ...s, helpPhase: false }, {
        action: null, bustCount: 0, busted: false,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      result.message = wasBusted ? 'Busted! Drawn cubes stay in your band.' : 'Action cancelled.';

      if (wasBusted) {
        result = countAction(result);
      }

      return result;
    });
  }, []);

  // ── Phase Transitions ───────────────────────────────

  const endDay = useCallback(() => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (s.phase !== 'day' || p.action) return s;

      let result = patchActivePlayer(s, { passed: true });
      result = advanceDayTurn(result);
      return result;
    });
  }, []);

  // ── Dusk Actions ────────────────────────────────────

  const dropCube = useCallback((cardId, cubeIndex) => {
    setState((s) => {
      if (s.phase !== 'dusk') return s;
      const p = getActivePlayer(s);
      if (cubeIndex < 0 || cubeIndex >= p.band.length) return s;

      const cubeType = p.band[cubeIndex];

      const loc = s.discoveredLocations.find((c) => c.id === cardId);
      if (loc) {
        if (p.currentLocation !== cardId) {
          return { ...s, message: `You can only place workers at your current location.` };
        }
        if (BUST_TYPES.has(cubeType)) {
          const hint = cubeType === 'inexperience'
            ? 'Inexperience must be placed on your Champion.'
            : `${cubeType} must go on your tableau (champion or heroes).`;
          return { ...s, message: hint };
        }
        const currentSlots = s.cardSlots[cardId] ?? [];
        if (currentSlots.length >= (loc.slots ?? 0)) {
          return { ...s, message: `${loc.name} is full!` };
        }
        const newBand = [...p.band];
        newBand.splice(cubeIndex, 1);
        const newCardSlots = { ...s.cardSlots, [cardId]: [...currentSlots, { type: cubeType }] };
        const doneMsg = newBand.length === 0
          ? 'All cubes placed!'
          : `Placed ${cubeType} worker at ${loc.name}. ${newBand.length} cube(s) remaining.`;
        let result = { ...s, cardSlots: newCardSlots };
        result = patchActivePlayer(result, { band: newBand });
        result.message = doneMsg;
        if (newBand.length === 0) {
          result = advanceDusk(result);
        }
        return result;
      }

      const ability = p.champion.abilities?.find((a) => a.id === cardId);
      if (ability) {
        if (cubeType === 'wound' || cubeType === 'vermin') {
          return { ...s, message: `${cubeType} must go on a tableau card, not an ability slot.` };
        }
        const currentPlacements = (p.abilityPlacements ?? {})[ability.id] ?? [];
        if (currentPlacements.length >= ability.slots) {
          return { ...s, message: `${ability.name} is full!` };
        }
        const newBand = [...p.band];
        newBand.splice(cubeIndex, 1);
        const newAbilityPlacements = {
          ...(p.abilityPlacements ?? {}),
          [ability.id]: [...currentPlacements, { type: cubeType }],
        };
        const doneMsg = newBand.length === 0
          ? 'All cubes placed!'
          : `Placed ${cubeType} on ${ability.name}. ${newBand.length} cube(s) remaining.`;
        let result = patchActivePlayer(s, { band: newBand, abilityPlacements: newAbilityPlacements });
        result.message = doneMsg;
        if (newBand.length === 0) {
          result = advanceDusk(result);
        }
        return result;
      }

      const isChampion = p.champion.id === cardId;
      const tableauCard = isChampion ? p.champion : p.tableau.find((c) => c.id === cardId);
      if (!tableauCard) return { ...s, message: 'Invalid target.' };

      if (cubeType === 'inexperience' && !isChampion) {
        return { ...s, message: 'Inexperience must be placed on your Champion.' };
      }

      const totalSlots = tableauCard.tableauSlots ?? tableauCard.slots ?? 0;
      const currentPlacements = p.placements[cardId] ?? [];
      if (currentPlacements.length >= totalSlots) {
        return { ...s, message: `${tableauCard.name} is full!` };
      }

      const newBand = [...p.band];
      newBand.splice(cubeIndex, 1);
      const newPlacements = { ...p.placements, [cardId]: [...currentPlacements, { type: cubeType }] };
      const doneMsg = newBand.length === 0
        ? 'All cubes placed!'
        : `Placed ${cubeType} on ${tableauCard.name}. ${newBand.length} cube(s) remaining.`;
      let result = patchActivePlayer(s, { band: newBand, placements: newPlacements });
      result.message = doneMsg;
      if (newBand.length === 0) {
        result = advanceDusk(result);
      }
      return result;
    });
  }, []);

  const discardFood = useCallback((cubeIndex) => {
    setState((s) => {
      if (s.phase !== 'dusk') return s;
      const p = getActivePlayer(s);
      if (cubeIndex < 0 || cubeIndex >= p.band.length) return s;
      if (p.band[cubeIndex] !== 'food') {
        return { ...s, message: 'Only food cubes can be returned to supply.' };
      }
      const newBand = [...p.band];
      newBand.splice(cubeIndex, 1);
      const doneMsg = newBand.length === 0
        ? 'All cubes placed!'
        : `Returned food to supply. ${newBand.length} cube(s) remaining.`;
      let result = patchActivePlayer(s, { band: newBand });
      result.message = doneMsg;
      if (newBand.length === 0) {
        result = advanceDusk(result);
      }
      return result;
    });
  }, []);

  // ── Night Actions ───────────────────────────────────

  const returnCubeToBag = useCallback((cardId, slotIndex) => {
    setState((s) => {
      if (s.phase !== 'night') return s;
      const p = getActivePlayer(s);
      if (p.nightReturns >= 2) return { ...s, message: 'Already returned 2 cubes this night.' };

      let currentPlacements = p.placements[cardId];
      let isAbility = false;

      if (!currentPlacements || slotIndex < 0 || slotIndex >= (currentPlacements?.length ?? 0)) {
        currentPlacements = (p.abilityPlacements ?? {})[cardId];
        if (!currentPlacements || slotIndex < 0 || slotIndex >= currentPlacements.length) return s;
        isAbility = true;
      }

      const cube = currentPlacements[slotIndex];
      const returns = p.nightReturns + 1;
      const newBag = [...p.bag, cube.type];

      if (isAbility) {
        const newAbilityPlacements = {
          ...(p.abilityPlacements ?? {}),
          [cardId]: currentPlacements.filter((_, i) => i !== slotIndex),
        };
        const abilityDef = p.champion.abilities?.find((a) => a.id === cardId);
        const cardName = abilityDef?.name ?? cardId;
        const patch = { abilityPlacements: newAbilityPlacements, bag: shuffleArray(newBag), nightReturns: returns };
        let result = patchActivePlayer(s, patch);
        result.message = `Returned ${cube.type} from ${cardName} to bag. ${2 - returns} return(s) left.`;
        return result;
      } else {
        const newPlacements = {
          ...p.placements,
          [cardId]: currentPlacements.filter((_, i) => i !== slotIndex),
        };
        const cardName = p.champion.id === cardId
          ? p.champion.name
          : p.tableau.find((c) => c.id === cardId)?.name ?? cardId;
        const patch = { placements: newPlacements, bag: shuffleArray(newBag), nightReturns: returns };
        let result = patchActivePlayer(s, patch);
        result.message = `Returned ${cube.type} from ${cardName} to bag. ${2 - returns} return(s) left.`;
        return result;
      }
    });
  }, []);

  const endNight = useCallback(() => {
    setState((s) => {
      if (s.phase !== 'night') return s;
      return advanceNight(s);
    });
  }, []);

  const startFortressCombat = useCallback((fortressId) => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (p.action || s.phase !== 'day') return s;
      const fortress = s.horde.fortress;
      if (!fortress || fortress.id !== fortressId) return s;

      const slots = s.cardSlots[fortressId] ?? [];
      const verminCount = slots.filter((c) => c.type === 'vermin').length;
      if (verminCount === 0) return { ...s, message: `${fortress.name} has no vermin — already cleared!` };

      const newCardSlots = {
        ...s.cardSlots,
        [fortressId]: slots.filter((c) => c.type !== 'vermin'),
      };
      const newBag = [...p.bag];
      for (let i = 0; i < verminCount; i++) newBag.push('vermin');

      let result = { ...s, cardSlots: newCardSlots };
      result = patchActivePlayer(result, {
        bag: shuffleArray(newBag),
        action: { type: 'combat', targetId: fortressId, verminAdded: verminCount, combatTarget: 'fortress' },
        bustCount: 0,
        busted: false,
        currentLocation: fortressId,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      result.message = `Attacking ${fortress.name}! ${verminCount} vermin added to your bag. Draw cubes to fight!`;
      return result;
    });
  }, []);

  const startVillainCombat = useCallback((villainId) => {
    setState((s) => {
      if (s.gameResult) return s;
      const p = getActivePlayer(s);
      if (p.action || s.phase !== 'day') return s;
      if (!s.horde.fortressCleared) return { ...s, message: 'The fortress must be cleared before engaging the villain!' };
      const villain = s.horde.villain;
      if (!villain || villain.id !== villainId) return s;

      const slots = s.cardSlots[villainId] ?? [];
      const verminCount = slots.filter((c) => c.type === 'vermin').length;
      if (verminCount === 0) return { ...s, message: `${villain.name} has no vermin!` };

      const newCardSlots = {
        ...s.cardSlots,
        [villainId]: slots.filter((c) => c.type !== 'vermin'),
      };
      const newBag = [...p.bag];
      for (let i = 0; i < verminCount; i++) newBag.push('vermin');

      let result = { ...s, cardSlots: newCardSlots };
      result = patchActivePlayer(result, {
        bag: shuffleArray(newBag),
        action: { type: 'combat', targetId: villainId, verminAdded: verminCount, combatTarget: 'villain' },
        bustCount: 0,
        busted: false,
        currentLocation: villainId,
        drawBonuses: { power: 0, bagAdds: [], messages: [] },
      });
      result.message = `Final battle with ${villain.name}! ${verminCount} vermin added to your bag. Draw cubes to fight!`;
      return result;
    });
  }, []);

  const startGame = useCallback((newConfig) => {
    clearSavedGame();
    setState(buildInitialState(newConfig));
  }, []);

  const restartGame = useCallback(() => {
    clearSavedGame();
    setState(buildInitialState(config));
  }, [config]);

  return {
    state,
    startRecruit,
    useLocationAction,
    drawCube,
    confirmRecruit,
    resolveCombat,
    forfeitCombat,
    cancelAction,
    endDay,
    dropCube,
    discardFood,
    returnCubeToBag,
    endNight,
    startFortressCombat,
    startVillainCombat,
    startGame,
    restartGame,
    resumeGame,
    requestHelp,
    helperDrawCube,
    helperDone,
    skipHelp,
    calculatePower: (player) => calculatePower(player),
    getPlayerBustThreshold: (player) => getPlayerBustThreshold(player),
  };
}
