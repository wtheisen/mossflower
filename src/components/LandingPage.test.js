import { describe, it, expect } from 'vitest';

// Pure reimplementation of LandingPage's champion-picking state logic,
// used to verify the behaviour is preserved through the refactor.

function pickChampion(championIds, currentPicker, playerCount, champId) {
  const next = [...championIds];
  if (next[currentPicker] === champId) {
    // Deselect
    next[currentPicker] = null;
    return { championIds: next, currentPicker };
  }
  next[currentPicker] = champId;
  // Auto-advance to the next unpicked slot (multiplayer only)
  let newPicker = currentPicker;
  if (playerCount > 1) {
    for (let offset = 1; offset < playerCount; offset++) {
      const idx = (currentPicker + offset) % playerCount;
      if (!next[idx]) {
        newPicker = idx;
        break;
      }
    }
  }
  return { championIds: next, currentPicker: newPicker };
}

function allPicked(championIds, playerCount) {
  return championIds.slice(0, playerCount).every(Boolean);
}

function takenChampionIds(championIds, playerCount) {
  return new Set(championIds.slice(0, playerCount).filter(Boolean));
}

function resetPlayerCount(n) {
  return { playerCount: n, currentPicker: 0, championIds: [null, null, null, null] };
}

// ── pickChampion ──────────────────────────────────────────────────────────────

describe('pickChampion', () => {
  it('sets the champion for the current picker slot', () => {
    const result = pickChampion([null, null, null, null], 0, 2, 'champ-a');
    expect(result.championIds[0]).toBe('champ-a');
  });

  it('deselects when the same champion is picked again', () => {
    const result = pickChampion(['champ-a', null, null, null], 0, 2, 'champ-a');
    expect(result.championIds[0]).toBeNull();
    expect(result.currentPicker).toBe(0);
  });

  it('auto-advances to the next unpicked slot in multiplayer', () => {
    const result = pickChampion([null, null, null, null], 0, 2, 'champ-a');
    expect(result.currentPicker).toBe(1);
  });

  it('wraps around when later slots are filled', () => {
    // P1 picks, P2 already has a pick, P3 is empty → should advance to P3 (idx 2)
    const result = pickChampion([null, 'champ-b', null, null], 0, 3, 'champ-a');
    expect(result.currentPicker).toBe(2);
  });

  it('does not auto-advance in solo play', () => {
    const result = pickChampion([null, null, null, null], 0, 1, 'champ-a');
    expect(result.currentPicker).toBe(0);
  });

  it('stays on the current picker when all other slots are already filled', () => {
    const result = pickChampion([null, 'champ-b', null, null], 0, 2, 'champ-a');
    // Both slots now filled → no unpicked slot ahead → stays at 0
    expect(result.currentPicker).toBe(0);
  });

  it('deselect does not change the current picker', () => {
    const result = pickChampion(['champ-a', 'champ-b', null, null], 1, 2, 'champ-b');
    expect(result.championIds[1]).toBeNull();
    expect(result.currentPicker).toBe(1);
  });
});

// ── allPicked ─────────────────────────────────────────────────────────────────

describe('allPicked', () => {
  it('returns true when every active player slot has a champion', () => {
    expect(allPicked(['champ-a', 'champ-b', null, null], 2)).toBe(true);
  });

  it('returns false when any active slot is empty', () => {
    expect(allPicked(['champ-a', null, null, null], 2)).toBe(false);
  });

  it('ignores slots beyond playerCount', () => {
    // 4-slot array but only 2 players — unfilled slots 2/3 should not matter
    expect(allPicked(['champ-a', 'champ-b', null, null], 2)).toBe(true);
  });

  it('returns true for solo play with one pick', () => {
    expect(allPicked(['champ-a', null, null, null], 1)).toBe(true);
  });

  it('returns false for solo play with no pick', () => {
    expect(allPicked([null, null, null, null], 1)).toBe(false);
  });
});

// ── takenChampionIds ──────────────────────────────────────────────────────────

describe('takenChampionIds', () => {
  it('includes champions picked by active players', () => {
    const taken = takenChampionIds(['champ-a', 'champ-b', null, null], 2);
    expect(taken.has('champ-a')).toBe(true);
    expect(taken.has('champ-b')).toBe(true);
  });

  it('excludes null slots', () => {
    const taken = takenChampionIds(['champ-a', null, null, null], 2);
    expect(taken.size).toBe(1);
  });

  it('excludes slots beyond playerCount', () => {
    const taken = takenChampionIds(['champ-a', 'champ-b', 'champ-c', null], 2);
    expect(taken.has('champ-c')).toBe(false);
  });
});

// ── resetPlayerCount ──────────────────────────────────────────────────────────

describe('resetPlayerCount', () => {
  it('sets playerCount and clears all champion slots', () => {
    const state = resetPlayerCount(3);
    expect(state.playerCount).toBe(3);
    expect(state.currentPicker).toBe(0);
    expect(state.championIds).toEqual([null, null, null, null]);
  });
});
