import { describe, it, expect } from 'vitest';
import { BASE_LOCATIONS } from './cards.js';

describe('cellar-base card data', () => {
  const card = BASE_LOCATIONS.find(c => c.id === 'cellar-base');

  it('exists', () => {
    expect(card).toBeDefined();
  });

  it('actionText says "Gain 1 Food." (not a per-worker description)', () => {
    expect(card.actionText).toBe('Gain 1 Food.');
  });
});
