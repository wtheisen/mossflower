export const cubePalette = {
  mouse: { label: 'Mouse', color: '#f9b34f' },
  hare: { label: 'Hare', color: '#a0e075' },
  badger: { label: 'Badger', color: '#c4c4c4' },
  squirrel: { label: 'Squirrel', color: '#ff8d94' },
  mole: { label: 'Mole', color: '#d9b5a0' },
  otter: { label: 'Otter', color: '#83d0f2' },
  food: { label: 'Food', color: '#f6f193' },
  inexperience: { label: 'Inexperience', color: '#ffffff' },
  mastery: { label: 'Mastery', color: '#ffd166' },
  wound: { label: 'Wound', color: '#2b2b2b' },
  vermin: { label: 'Vermin', color: '#69312f' }
};

export const champions = [
  {
    id: 'matthias',
    name: 'Matthias of Redwall',
    affinities: ['mouse', 'sword'],
    startingBag: [
      { type: 'mouse', count: 2 },
      { type: 'squirrel', count: 1 },
      { type: 'food', count: 1 },
      { type: 'inexperience', count: 3 }
    ],
    tableauSlots: 5,
    quests: [
      {
        id: 'matthias-quest-1',
        name: 'Novice Warrior',
        requirement: 'Place 2 cubes to inspire novices.',
        goal: { type: 'contribute', target: 2, requires: ['mouse', 'squirrel'] }
      },
      {
        id: 'matthias-quest-2',
        name: 'Defend Redwall',
        requirement: 'Bolster the Great Hall with 3 cubes.',
        goal: { type: 'contribute', target: 3 }
      },
      {
        id: 'matthias-quest-3',
        name: 'Slay Cluny',
        requirement: 'Commit 4 cubes to a final assault.',
        goal: { type: 'contribute', target: 4 }
      }
    ]
  },
  {
    id: 'mariel',
    name: 'Mariel of Redwall',
    affinities: ['hare', 'otter'],
    startingBag: [
      { type: 'hare', count: 2 },
      { type: 'otter', count: 1 },
      { type: 'food', count: 1 },
      { type: 'inexperience', count: 3 }
    ],
    tableauSlots: 5,
    quests: [
      {
        id: 'mariel-quest-1',
        name: 'Captain of the Skies',
        requirement: 'Supply the resistance with 3 cubes.',
        goal: { type: 'contribute', target: 3, requires: ['hare', 'otter'] }
      },
      {
        id: 'mariel-quest-2',
        name: 'Horde Harrier',
        requirement: 'Commit 2 cubes anywhere along the border.',
        goal: { type: 'contribute', target: 2 }
      },
      {
        id: 'mariel-quest-3',
        name: 'Legend of Salamandastron',
        requirement: 'Supply Salamandastron with 4 cubes.',
        goal: { type: 'contribute', target: 4 }
      }
    ]
  },
  {
    id: 'brome',
    name: 'Brome and Felldoh',
    affinities: ['squirrel', 'mole'],
    startingBag: [
      { type: 'squirrel', count: 2 },
      { type: 'mole', count: 1 },
      { type: 'food', count: 1 },
      { type: 'inexperience', count: 3 }
    ],
    tableauSlots: 5,
    quests: [
      {
        id: 'brome-quest-1',
        name: 'Freedom Call',
        requirement: 'Place 2 cubes among woodland allies.',
        goal: { type: 'contribute', target: 2, requires: ['squirrel', 'mole'] }
      },
      {
        id: 'brome-quest-2',
        name: 'Raise the Horde',
        requirement: 'Commit 3 cubes to the uprising.',
        goal: { type: 'contribute', target: 3 }
      },
      {
        id: 'brome-quest-3',
        name: 'Silent Hunter',
        requirement: 'Gather 4 cubes for a precise strike.',
        goal: { type: 'contribute', target: 4 }
      }
    ]
  }
];

export const heroCards = [
  {
    id: 'hero-redwall-sentry',
    name: 'Redwall Sentry',
    type: 'hero',
    affinity: ['mouse'],
    slots: 2,
    cost: 2,
    critters: [
      { type: 'mouse', count: 2 }
    ],
    ability: 'Spend 1 mouse cube for +1 strength while defending.',
    abilityKey: null
  },
  {
    id: 'hero-guerilla-scout',
    name: 'Guerrilla Scout',
    type: 'hero',
    affinity: ['squirrel'],
    slots: 3,
    cost: 3,
    critters: [
      { type: 'squirrel', count: 2 },
      { type: 'mouse', count: 1 }
    ],
    ability: 'Place 1 squirrel cube here to ignore 1 Vermin during combat.',
    abilityKey: null
  },
  {
    id: 'hero-salamandastron-veteran',
    name: 'Salamandastron Veteran',
    type: 'hero',
    affinity: ['badger', 'hare'],
    slots: 3,
    cost: 4,
    critters: [
      { type: 'hare', count: 2 },
      { type: 'badger', count: 1 }
    ],
    ability: 'Spend 2 matching cubes here to remove 1 Vermin anywhere.',
    abilityKey: null
  },
  {
    id: 'hero-squirrel-1',
    name: 'Squirrel 1',
    type: 'hero',
    affinity: ['squirrel'],
    slots: 3,
    cost: 2,
    critters: [
      { type: 'squirrel', count: 2 }
    ],
    ability: 'When you remove Vermin from a Location, add 1 Food there per Squirrel on this hero.',
    abilityKey: 'squirrel-food-cache'
  },
  {
    id: 'hero-mole-2',
    name: 'Mole 2',
    type: 'hero',
    affinity: ['mole'],
    slots: 2,
    cost: 2,
    critters: [{ type: 'mole', count: 1 }],
    ability: 'If you remove a Mole from this hero you may shuffle a Discard card back into the Adventure Deck.',
    abilityKey: 'mole-discard-recycle'
  }
];

export const locationCards = [
  {
    id: 'loc-great-hall',
    name: 'The Great Hall',
    type: 'location',
    slots: 3,
    verminLimit: 3,
    action: 'Draw 2 cubes. Convert Food into any critter type this turn.'
  },
  {
    id: 'loc-the-cellar',
    name: 'The Cellar',
    type: 'location',
    slots: 2,
    verminLimit: 2,
    action: 'Gain 2 Food if you place at least one Worker here.'
  },
  {
    id: 'loc-mossflower-border',
    name: 'Mossflower Border',
    type: 'location',
    slots: 3,
    verminLimit: 3,
    action: 'Place 1 Worker to add 1 hero from the row to your bag temporarily.'
  },
  {
    id: 'loc-salamandastron',
    name: 'Salamandastron',
    type: 'location',
    slots: 3,
    verminLimit: 4,
    action: 'Combat actions here reduce required Vermin draws by 1.'
  }
];

export const questCards = [
  {
    id: 'quest-sword-of-martin',
    name: 'Sword of Martin',
    type: 'quest',
    slots: 3,
    text: 'Place 3 cubes with at least 1 badger to gain 1 mastery token.',
    goal: { type: 'contribute', target: 3, requires: ['badger'] }
  },
  {
    id: 'quest-abbey-restoration',
    name: 'Abbey Restoration',
    type: 'quest',
    slots: 2,
    text: 'Spend 2 food to heal 1 wound and gain 1 morale.',
    goal: { type: 'contribute', target: 2, requires: ['food'] }
  }
];

export const adventureCards = [...heroCards, ...locationCards, ...questCards];

export const baseLocations = {
  'redwall-infirmary': {
    id: 'redwall-infirmary',
    name: 'Redwall Infirmary',
    type: 'location',
    slots: 3,
    verminLimit: 2,
    action: 'Remove up to 2 wounds and return the cubes to your bag.'
  },
  'great-hall': {
    id: 'great-hall',
    name: 'The Great Hall',
    type: 'location',
    slots: 3,
    verminLimit: 3,
    action: 'Standard rally location. Gain 1 Food.'
  },
  cellar: {
    id: 'cellar',
    name: 'The Cellar',
    type: 'location',
    slots: 2,
    verminLimit: 2,
    action: 'Gain 1 Food per Worker placed here.'
  }
};

export const startingDiscoveredLocations = ['redwall-infirmary', 'great-hall', 'cellar'];

export const fortressDeck = [
  {
    id: 'fort-cluny-siege',
    name: 'Cluny Siege Engine',
    slots: 4,
    vermin: 4,
    text: 'Increase Conquest Track gains by +1 if not cleared.'
  },
  {
    id: 'fort-marsh-bridge',
    name: 'Marsh Bridge',
    slots: 3,
    vermin: 3,
    text: 'Adds 1 Vermin to the weakest location every night.'
  }
];

export const villainDeck = [
  {
    id: 'vil-tsarmina',
    name: 'Tsarmina',
    slots: 5,
    vermin: 5,
    text: 'Night: add 1 Vermin to every quest.'
  },
  {
    id: 'vil-cluny',
    name: 'Cluny the Scourge',
    slots: 6,
    vermin: 6,
    text: 'Night: add +1 Conquest if not engaged.'
  }
];

export const hordeDeck = [
  {
    id: 'horde-rat-pack',
    name: 'Rat Pack',
    text: 'Night: add +1 Vermin to the location with most Workers.',
    effectKey: 'workers-pressure'
  },
  {
    id: 'horde-ferret-clan',
    name: 'Ferret Clan',
    text: 'Day: Combat rolls require +1 draw.',
    effectKey: 'combat-plus-one'
  }
];
