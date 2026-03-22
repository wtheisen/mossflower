import { describe, it, expect } from 'vitest';

// Pure reimplementation of Band's animation detection logic:
// When cubes.length increases during an action, the last cube should animate.

function detectNewCube(prevLen, currentLen, inAction) {
  if (currentLen > prevLen && inAction) {
    return { index: currentLen - 1, phase: 'wobble' };
  }
  return null;
}

function transitionPhase(animState, completedAnimation) {
  if (!animState) return null;
  if (animState.phase === 'wobble' && completedAnimation === 'cubeWobble') {
    return { ...animState, phase: 'reveal' };
  }
  return animState;
}

function clearAnimation() {
  return null;
}

function shouldDisableDraw(isAnimating) {
  return isAnimating;
}

describe('Band draw animation state', () => {
  describe('detectNewCube', () => {
    it('returns wobble state when a new cube appears during an action', () => {
      const result = detectNewCube(2, 3, true);
      expect(result).toEqual({ index: 2, phase: 'wobble' });
    });

    it('returns null when cubes length stays the same', () => {
      expect(detectNewCube(3, 3, true)).toBeNull();
    });

    it('returns null when cubes length decreases', () => {
      expect(detectNewCube(3, 2, true)).toBeNull();
    });

    it('returns null when not in an action (e.g. dusk phase)', () => {
      expect(detectNewCube(2, 3, false)).toBeNull();
    });

    it('targets the last cube index', () => {
      const result = detectNewCube(0, 1, true);
      expect(result.index).toBe(0);
    });

    it('handles first draw correctly (0 -> 1)', () => {
      const result = detectNewCube(0, 1, true);
      expect(result).toEqual({ index: 0, phase: 'wobble' });
    });
  });

  describe('transitionPhase', () => {
    it('transitions from wobble to reveal when cubeWobble animation ends', () => {
      const state = { index: 2, phase: 'wobble' };
      const result = transitionPhase(state, 'cubeWobble');
      expect(result).toEqual({ index: 2, phase: 'reveal' });
    });

    it('ignores non-cubeWobble animation events (e.g. cubeCycleColors)', () => {
      const state = { index: 2, phase: 'wobble' };
      const result = transitionPhase(state, 'cubeCycleColors');
      expect(result).toEqual(state);
    });

    it('returns null if no animation state', () => {
      expect(transitionPhase(null, 'cubeWobble')).toBeNull();
    });
  });

  describe('clearAnimation', () => {
    it('returns null to clear animation state', () => {
      expect(clearAnimation()).toBeNull();
    });
  });

  describe('shouldDisableDraw', () => {
    it('disables draw when animating', () => {
      expect(shouldDisableDraw(true)).toBe(true);
    });

    it('enables draw when not animating', () => {
      expect(shouldDisableDraw(false)).toBe(false);
    });
  });
});
