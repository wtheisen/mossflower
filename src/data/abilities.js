/**
 * Ability registry — keyed by card ID.
 *
 * Each ability gets a `ctx` object with:
 *   ctx.state        — current game state (read-only snapshot)
 *   ctx.addToBand(cubeType)     — add a cube to the band (not from bag)
 *   ctx.removeFromBand(cubeType) — remove & discard a cube from band
 *   ctx.addToBag(cubeType)      — add a cube to the bag
 *   ctx.removeFromBag(cubeType) — remove a cube from bag (discard)
 *   ctx.drawFromBag()           — draw a random cube from bag into band
 *   ctx.setMessage(msg)         — set the status message
 *
 * `onAction(ctx)` is called when a player uses a location's action.
 * Returns a patch object to merge into state, or null for no change.
 */

export const ABILITIES = {
  // ── Base Locations ──────────────────────────────────────

  // Great Hall (Base): Gain 1 Food
  'great-hall-base': {
    onAction(ctx) {
      ctx.addToBand('food');
      ctx.setMessage('The Great Hall: Gained 1 Food.');
    },
  },

  // The Cellar (Base): Gain 1 Food per Worker placed here
  // For now, just gain 1 food (workers not yet implemented)
  'cellar-base': {
    onAction(ctx) {
      ctx.addToBand('food');
      ctx.setMessage('The Cellar: Gained 1 Food.');
    },
  },

  // Redwall Infirmary: Remove up to 2 wounds, return cubes to bag
  'redwall-infirmary': {
    onAction(ctx) {
      let removed = 0;
      for (let i = 0; i < 2; i++) {
        if (ctx.removeFromBand('wound')) removed++;
      }
      if (removed > 0) {
        ctx.setMessage(`Redwall Infirmary: Removed ${removed} wound(s) and returned them to your bag.`);
      } else {
        ctx.setMessage('Redwall Infirmary: No wounds to remove.');
      }
    },
  },

  // ── Adventure Row Locations ─────────────────────────────

  // The Great Hall (Adventure): Draw 2 cubes
  'loc-great-hall': {
    onAction(ctx) {
      const drawn = [];
      for (let i = 0; i < 2; i++) {
        const cube = ctx.drawFromBag();
        if (cube) drawn.push(cube);
      }
      if (drawn.length > 0) {
        ctx.setMessage(`The Great Hall: Drew ${drawn.join(', ')}.`);
      } else {
        ctx.setMessage('The Great Hall: Bag is empty, nothing to draw.');
      }
    },
  },

  // The Cellar (Adventure): Gain 2 Food if you place at least one Worker
  // Workers not yet implemented — just gain 2 food for now
  'loc-the-cellar': {
    onAction(ctx) {
      ctx.addToBand('food');
      ctx.addToBand('food');
      ctx.setMessage('The Cellar: Gained 2 Food.');
    },
  },

  // Salamandastron: passive combat modifier — no active action for now
  'loc-salamandastron': {
    onAction(ctx) {
      ctx.setMessage('Salamandastron: Combat modifier — no action to take right now.');
    },
  },
};
