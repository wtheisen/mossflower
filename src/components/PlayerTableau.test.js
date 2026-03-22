import { describe, it, expect } from 'vitest';
import { isValidDuskTarget } from './PlayerTableau.jsx';

describe('isValidDuskTarget', () => {
  it('returns true when no cube is dragged (null)', () => {
    expect(isValidDuskTarget(null, 'champion')).toBe(true);
    expect(isValidDuskTarget(null, 'hero')).toBe(true);
    expect(isValidDuskTarget(null, 'ability')).toBe(true);
    expect(isValidDuskTarget(null, 'location')).toBe(true);
  });

  it('returns true when no cube is dragged (undefined)', () => {
    expect(isValidDuskTarget(undefined, 'champion')).toBe(true);
  });

  it('inexperience targets champion and ability only', () => {
    expect(isValidDuskTarget('inexperience', 'champion')).toBe(true);
    expect(isValidDuskTarget('inexperience', 'ability')).toBe(true);
    expect(isValidDuskTarget('inexperience', 'hero')).toBe(false);
    expect(isValidDuskTarget('inexperience', 'location')).toBe(false);
  });

  it('wound targets champion and hero only', () => {
    expect(isValidDuskTarget('wound', 'champion')).toBe(true);
    expect(isValidDuskTarget('wound', 'hero')).toBe(true);
    expect(isValidDuskTarget('wound', 'ability')).toBe(false);
    expect(isValidDuskTarget('wound', 'location')).toBe(false);
  });

  it('vermin targets champion and hero only', () => {
    expect(isValidDuskTarget('vermin', 'champion')).toBe(true);
    expect(isValidDuskTarget('vermin', 'hero')).toBe(true);
    expect(isValidDuskTarget('vermin', 'ability')).toBe(false);
    expect(isValidDuskTarget('vermin', 'location')).toBe(false);
  });

  it('critter types are valid for all targets', () => {
    const critters = ['mouse', 'squirrel', 'hare', 'otter', 'mole', 'badger'];
    for (const critter of critters) {
      expect(isValidDuskTarget(critter, 'champion')).toBe(true);
      expect(isValidDuskTarget(critter, 'hero')).toBe(true);
      expect(isValidDuskTarget(critter, 'location')).toBe(true);
    }
  });

  it('food is valid for all targets', () => {
    expect(isValidDuskTarget('food', 'champion')).toBe(true);
    expect(isValidDuskTarget('food', 'hero')).toBe(true);
    expect(isValidDuskTarget('food', 'location')).toBe(true);
  });
});
