export const BUST_TYPES = new Set(['inexperience', 'vermin', 'wound']);
export const CRITTER_TYPES = new Set(['mouse', 'squirrel', 'hare', 'otter', 'mole', 'badger']);
export const BASE_BUST_THRESHOLD = 3;
export const PLAYER_COLORS = ['#c49a2a', '#5b82a6', '#8a6aaa', '#a05040'];
export const STORAGE_KEY = 'mossflower-save';

export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
