/**
 * Cube type definitions — the 11 cube types in Mossflower.
 */
export const CUBE_TYPES = {
  mouse:         { label: 'Mouse',         color: 'var(--cube-mouse)' },
  squirrel:      { label: 'Squirrel',      color: 'var(--cube-squirrel)' },
  hare:          { label: 'Hare',          color: 'var(--cube-hare)' },
  otter:         { label: 'Otter',         color: 'var(--cube-otter)' },
  mole:          { label: 'Mole',          color: 'var(--cube-mole)' },
  badger:        { label: 'Badger',        color: 'var(--cube-badger)' },
  food:          { label: 'Food',          color: 'var(--cube-food)' },
  inexperience:  { label: 'Inexperience',  color: 'var(--cube-inexperience)' },
  mastery:       { label: 'Mastery',       color: 'var(--cube-mastery)' },
  vermin:        { label: 'Vermin',        color: 'var(--cube-vermin)' },
  wound:         { label: 'Wound',         color: 'var(--cube-wound)' },
};

/**
 * Champion cards — one per player.
 */
export const CHAMPIONS = [
  {
    id: 'matthias',
    name: 'Matthias of Redwall',
    type: 'champion',
    affinities: ['mouse', 'squirrel'],
    tableauSlots: 5,
    startingBag: { mouse: 2, squirrel: 1, food: 1, inexperience: 3 },
  },
  {
    id: 'mariel',
    name: 'Mariel of Redwall',
    type: 'champion',
    affinities: ['hare', 'otter'],
    tableauSlots: 5,
    startingBag: { hare: 2, otter: 1, food: 1, inexperience: 3 },
  },
  {
    id: 'brome',
    name: 'Brome and Felldoh',
    type: 'champion',
    affinities: ['squirrel', 'mole'],
    tableauSlots: 5,
    startingBag: { squirrel: 2, mole: 1, food: 1, inexperience: 3 },
  },
  {
    id: 'ralph',
    name: 'Ralph Woodfellow',
    type: 'champion',
    affinities: ['mouse', 'hare'],
    startingBag: { mouse: 4, hare: 1, mole: 1, otter: 1, inexperience: 3 },
    abilities: [
      {
        id: 'strength-in-numbers',
        name: 'Strength in Numbers',
        slots: 3,
        slotFilter: 'mouse',
        trigger: 'onDrawMouse',
        effect: 'amplifyMice',
        description: 'Each mouse placed here gives drawn mice +1 power.',
      },
      {
        id: 'redwall-provisions',
        name: 'Redwall Provisions',
        slots: 2,
        slotFilter: 'food',
        trigger: 'onDrawMouse',
        effect: 'addFoodPerMouse',
        description: 'For each food placed here, each mouse drawn adds 1 food to your bag.',
      },
      {
        id: 'rallying-cry',
        name: 'Rallying Cry',
        slots: 2,
        slotFilter: 'non-mouse-critter',
        trigger: 'onDrawMouse',
        effect: 'allyPower',
        description: 'For each critter placed here, drawing a mouse grants +1 power.',
      },
      {
        id: 'courage-of-martin',
        name: 'Courage of Martin',
        slots: 2,
        slotFilter: 'any',
        trigger: 'passive',
        effect: 'raiseBustThreshold',
        description: 'Each cube placed here raises your bust threshold by 1.',
      },
    ],
  },
];

/**
 * Hero cards — recruited into your tableau.
 */
export const HEROES = [
  {
    id: 'hero-redwall-sentry',
    name: 'Redwall Sentry',
    type: 'hero',
    affinity: 'mouse',
    slots: 2,
    cost: 1,
    critters: { mouse: 2 },
    abilityText: 'Spend 1 mouse cube for +1 strength while defending.',
  },
  {
    id: 'hero-guerilla-scout',
    name: 'Guerrilla Scout',
    type: 'hero',
    affinity: 'squirrel',
    slots: 3,
    cost: 1,
    critters: { squirrel: 2, mouse: 1 },
    abilityText: 'Place 1 squirrel cube here to ignore 1 Vermin during combat.',
  },
  {
    id: 'hero-salamandastron-veteran',
    name: 'Salamandastron Veteran',
    type: 'hero',
    affinity: 'hare',
    slots: 3,
    cost: 1,
    critters: { hare: 2, badger: 1 },
    abilityText: 'Spend 2 matching cubes here to remove 1 Vermin anywhere.',
  },
  {
    id: 'hero-squirrel-1',
    name: 'Mossflower Forager',
    type: 'hero',
    affinity: 'squirrel',
    slots: 3,
    cost: 2,
    critters: { squirrel: 2 },
    abilityText: 'When you remove Vermin from a Location, add 1 Food there per Squirrel on this hero.',
  },
];

/**
 * Location cards — placed in the Adventure Row or discovered.
 */
export const LOCATIONS = [
  {
    id: 'loc-great-hall',
    name: 'The Great Hall',
    type: 'location',
    slots: 3,
    verminLimit: 3,
    actionText: 'Draw 2 cubes. Convert Food into any critter type this turn.',
  },
  {
    id: 'loc-the-cellar',
    name: 'The Cellar',
    type: 'location',
    slots: 2,
    verminLimit: 2,
    actionText: 'Gain 2 Food if you place at least one Worker here.',
  },
  {
    id: 'loc-mossflower-border',
    name: 'Mossflower Border',
    type: 'location',
    slots: 3,
    verminLimit: 3,
    actionText: 'Place 1 Worker to add 1 hero from the row to your bag temporarily.',
  },
  {
    id: 'loc-salamandastron',
    name: 'Salamandastron',
    type: 'location',
    slots: 3,
    verminLimit: 4,
    actionText: 'Combat actions here reduce required Vermin draws by 1.',
  },
];

/**
 * Fortress cards — must be cleared before the Villain is vulnerable.
 */
export const FORTRESS = [
  {
    id: 'fort-cluny-siege',
    name: 'Cluny Siege Engine',
    type: 'fortress',
    slots: 4,
    startingVermin: 4,
    abilityText: 'Increase Conquest Track gains by +1 if not cleared.',
  },
  {
    id: 'fort-marsh-bridge',
    name: 'Marsh Bridge',
    type: 'fortress',
    slots: 3,
    startingVermin: 3,
    abilityText: 'Adds 1 Vermin to the weakest location every night.',
  },
];

/**
 * Villain cards — final boss, vulnerable after Fortress is cleared.
 */
export const VILLAINS = [
  {
    id: 'vil-tsarmina',
    name: 'Tsarmina',
    type: 'villain',
    slots: 5,
    startingVermin: 5,
    abilityText: 'Night: add 1 Vermin to every quest.',
  },
  {
    id: 'vil-cluny',
    name: 'Cluny the Scourge',
    type: 'villain',
    slots: 6,
    startingVermin: 6,
    abilityText: 'Night: add +1 Conquest if not engaged.',
  },
];

/**
 * Base locations — always available from the start.
 */
export const BASE_LOCATIONS = [
  {
    id: 'redwall-infirmary',
    name: 'Redwall Infirmary',
    type: 'location',
    slots: 3,
    verminLimit: 2,
    actionText: 'Remove up to 2 wounds and return the cubes to your bag.',
  },
  {
    id: 'great-hall-base',
    name: 'The Great Hall',
    type: 'location',
    slots: 3,
    verminLimit: 3,
    actionText: 'Standard rally location. Gain 1 Food.',
  },
  {
    id: 'cellar-base',
    name: 'The Cellar',
    type: 'location',
    slots: 2,
    verminLimit: 2,
    actionText: 'Gain 1 Food per Worker placed here.',
  },
];

/**
 * Static demo data — a sample adventure row and player tableau.
 */
export const DEMO_ADVENTURE_ROW = [
  HEROES[0],   // Redwall Sentry
  LOCATIONS[0], // The Great Hall
  HEROES[1],   // Guerrilla Scout
  LOCATIONS[2], // Mossflower Border
  HEROES[2],   // Salamandastron Veteran
];

// Cards remaining in the adventure deck (not in the starting row)
export const DEMO_ADVENTURE_DECK = [
  HEROES[3],    // Mossflower Forager
  LOCATIONS[1], // The Cellar
  LOCATIONS[3], // Salamandastron
];

export const DEMO_DISCOVERED = [...BASE_LOCATIONS];

export const DEMO_HORDE = {
  fortress: FORTRESS[0],  // Cluny Siege Engine (revealed)
  fortressDeck: [FORTRESS[1]],  // remaining fortress cards
  fortressCleared: false,
  villain: VILLAINS[1],    // Cluny the Scourge
};

export const DEMO_PLAYER = {
  champion: CHAMPIONS[3], // Ralph Woodfellow
  tableau: [HEROES[0], HEROES[3]], // Redwall Sentry, Mossflower Forager
  placements: {
    'hero-redwall-sentry': [{ type: 'mouse' }, { type: 'mouse' }],
    'hero-squirrel-1': [{ type: 'squirrel' }],
  },
  abilityPlacements: {},
  // All cubes in the bag at start (matches Ralph starting bag)
  bag: [
    'mouse', 'mouse', 'mouse', 'mouse',
    'hare', 'mole', 'otter',
    'inexperience', 'inexperience', 'inexperience',
  ],
};
