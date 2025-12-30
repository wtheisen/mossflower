export const abilityHandlers = {
  'squirrel-food-cache': {
    onLocationVerminCleared: ({ G, player, hero, location }) => {
      if (!location) {
        return;
      }
      const squirrelCount = hero.cubes.filter((cube) => cube === 'squirrel').length;
      if (squirrelCount <= 0) {
        return;
      }
      location.workers = location.workers ?? [];
      for (let i = 0; i < squirrelCount; i += 1) {
        location.workers.push({ cube: 'food', playerID: hero.id });
      }
      G.log.unshift(`${player.name}'s ${hero.name} caches ${squirrelCount} Food at ${location.name}.`);
    }
  },
  'mole-discard-recycle': {
    onCubeRemovedFromHero: ({ G, ctx, cube }) => {
      if (cube !== 'mole') {
        return;
      }
      const discard = G.discardPile ?? [];
      if (discard.length === 0) {
        return;
      }
      const card = discard.pop();
      G.adventureDeck = G.adventureDeck ?? [];
      G.adventureDeck.unshift(card);
      if (ctx?.random) {
        G.adventureDeck = ctx.random.Shuffle(G.adventureDeck);
      }
      G.log.unshift(`Mole 2 returns ${card.name} to the Adventure Deck.`);
    }
  }
};

export function triggerAbilityHook({ player, hook, location, G, cube, ctx }) {
  if (!player) {
    return;
  }
  player.tableau.forEach((hero) => {
    if (!hero.abilityKey) {
      return;
    }
    const handler = abilityHandlers[hero.abilityKey];
    const hookFn = handler?.[hook];
    if (typeof hookFn === 'function') {
      hookFn({ G, ctx, player, hero, location, cube });
    }
  });
}
