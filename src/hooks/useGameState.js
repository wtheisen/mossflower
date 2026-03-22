import { useState, useCallback, useEffect, useRef } from 'react';
import { STORAGE_KEY } from '../game/constants';
import { calculatePower, getPlayerBustThreshold } from '../game/abilities';
import { buildInitialState } from '../game/setup';
import {
  startRecruitAction,
  useLocationActionAction,
  drawCubeAction,
  requestHelpAction,
  helperDrawCubeAction,
  helperDoneAction,
  skipHelpAction,
  confirmRecruitAction,
  resolveCombatAction,
  forfeitCombatAction,
  cancelActionAction,
  endDayAction,
  dropCubeAction,
  discardFoodAction,
  returnCubeToBagAction,
  endNightAction,
  startFortressCombatAction,
  startVillainCombatAction,
} from '../game/actions';

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
    setState((s) => startRecruitAction(s, cardId));
  }, []);

  const useLocationAction = useCallback((cardId) => {
    setState((s) => useLocationActionAction(s, cardId));
  }, []);

  const drawCube = useCallback(() => {
    setState((s) => drawCubeAction(s));
  }, []);

  // ── Helping Hands ──────────────────────────────────

  const requestHelp = useCallback(() => {
    setState((s) => requestHelpAction(s));
  }, []);

  const helperDrawCube = useCallback((helperIndex) => {
    setState((s) => helperDrawCubeAction(s, helperIndex));
  }, []);

  const helperDone = useCallback((helperIndex) => {
    setState((s) => helperDoneAction(s, helperIndex));
  }, []);

  const skipHelp = useCallback(() => {
    setState((s) => skipHelpAction(s));
  }, []);

  const confirmRecruit = useCallback(() => {
    setState((s) => confirmRecruitAction(s));
  }, []);

  const resolveCombat = useCallback(() => {
    setState((s) => resolveCombatAction(s));
  }, []);

  const forfeitCombat = useCallback(() => {
    setState((s) => forfeitCombatAction(s));
  }, []);

  const cancelAction = useCallback(() => {
    setState((s) => cancelActionAction(s));
  }, []);

  // ── Phase Transitions ───────────────────────────────

  const endDay = useCallback(() => {
    setState((s) => endDayAction(s));
  }, []);

  // ── Dusk Actions ────────────────────────────────────

  const dropCube = useCallback((cardId, cubeIndex) => {
    setState((s) => dropCubeAction(s, cardId, cubeIndex));
  }, []);

  const discardFood = useCallback((cubeIndex) => {
    setState((s) => discardFoodAction(s, cubeIndex));
  }, []);

  // ── Night Actions ───────────────────────────────────

  const returnCubeToBag = useCallback((cardId, slotIndex) => {
    setState((s) => returnCubeToBagAction(s, cardId, slotIndex));
  }, []);

  const endNight = useCallback(() => {
    setState((s) => endNightAction(s));
  }, []);

  const startFortressCombat = useCallback((fortressId) => {
    setState((s) => startFortressCombatAction(s, fortressId));
  }, []);

  const startVillainCombat = useCallback((villainId) => {
    setState((s) => startVillainCombatAction(s, villainId));
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
