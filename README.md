# Mossflower

**A cooperative deck-building board game set in the world of Redwall, playable in your browser.**

Mossflower is a digital implementation of a tabletop game where 1–4 players take on the roles of champions from Brian Jacques' *Redwall* series. Players recruit heroes, explore locations, and draw cubes from a bag to build power — all while racing against a rising conquest track and a villain threatening to overrun the abbey.

---

## How It Works

### The Bag
Each player has a personal bag of colored cubes representing their allies and resources. On your turn you draw cubes one at a time into your **band**, building power to recruit heroes or fight the horde. But beware — draw too many **inexperience**, **vermin**, or **wound** cubes and you'll **bust**, losing your entire band for the turn.

### Cube Types
| Cube | Role |
|------|------|
| **Mouse, Squirrel, Hare, Otter, Mole** | Critter cubes — each adds +1 power |
| **Badger** | Elite critter — adds +2 power |
| **Food** | Resource cube for location abilities |
| **Mastery** | Upgraded cube with special synergies |
| **Inexperience** | Dead weight — counts toward busting |
| **Vermin** | Enemy presence — counts toward busting |
| **Wound** | Injury — counts toward busting |

### Game Phases

**Day** — Players take turns performing actions:
- **Recruit heroes** from the adventure row by drawing cubes to meet their cost
- **Fight fortresses and villains** by drawing cubes to match their combat strength
- **Use locations** to trigger special abilities (draw extra cubes, gain food, heal wounds)
- **End your day** when you're satisfied (or have busted)

**Dusk** — All drawn cubes in your band are placed onto cards in your tableau, powering up your heroes and champion abilities for future turns.

**Night** — Vermin spread across the board proportional to the conquest track. The villain activates their nightly ability. Each player may return up to 2 cubes from their tableau back to their bag. The leftmost adventure row card is discarded (its vermin increase conquest) and a new card is revealed. A new day begins.

### Win & Lose
- **Win:** Defeat the villain by clearing all vermin from its card in combat
- **Lose:** The conquest track reaches 10 — Mossflower has fallen

### The Horde
A fortress card blocks access to the villain. Clear the fortress first (remove all its vermin through combat), then the villain becomes vulnerable. The fortress deck may contain additional fortresses that must be cleared in sequence.

### Helping Hands
During combat, other players can contribute cubes from their own bags to help the active player succeed.

---

## Champions

| Champion | Affinities | Starting Bag | Special |
|----------|-----------|-------------|---------|
| **Matthias of Redwall** | Mouse, Squirrel | 2 mouse, 1 squirrel, 1 food, 3 inexperience | — |
| **Mariel of Redwall** | Hare, Otter | 2 hare, 1 otter, 1 food, 3 inexperience | — |
| **Brome and Felldoh** | Squirrel, Mole | 2 squirrel, 1 mole, 1 food, 3 inexperience | — |
| **Ralph Woodfellow** | Mouse, Hare | 4 mouse, 1 hare, 1 mole, 1 otter, 3 inexperience | 4 champion abilities with cube placement slots |

Ralph's abilities include **Strength in Numbers** (amplify mice), **Redwall Provisions** (food generation), **Rallying Cry** (ally synergy), and **Courage of Martin** (raise bust threshold).

## Villains

| Villain | Starting Vermin | Night Ability |
|---------|----------------|---------------|
| **Cluny the Scourge** | 6 | +1 conquest each night |
| **Tsarmina** | 5 | +1 conquest each night |

---

## Tech Stack

- **React 18** — UI components with hooks
- **Vite** — Build tooling and dev server
- **Pure CSS** — No component library; hand-crafted parchment/storybook visual theme
- **Zero backend** — Fully client-side, all game state managed in a single `useGameState` hook

### Visual Design
The interface uses a warm parchment aesthetic with sepia tones, serif typography (Cormorant Garamond + Crimson Text), and watercolor-inspired cube colors. Cards have a storybook feel with subtle animations and a botanical border frame.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open the dev server URL (usually `http://localhost:5173`) and you'll see the landing page. Choose your players, champions, and villain, then begin your adventure.

---

## Project Structure

```
src/
├── App.jsx                    # Main layout — status bar, board columns, player tableau
├── main.jsx                   # React entry point
├── theme.css                  # CSS variables, parchment theme, animations
├── hooks/
│   └── useGameState.js        # All game logic — phases, combat, recruiting, night cycle
├── data/
│   ├── cards.js               # Champions, heroes, locations, fortresses, villains, cube types
│   └── abilities.js           # Ability registry — location actions, hero combat bonuses
└── components/
    ├── LandingPage.jsx        # Title screen with champion/villain selection
    ├── StatusBar.jsx           # Day, phase, conquest track, active player
    ├── AdventureRow.jsx        # Shared row of available heroes and locations
    ├── DiscoveredLocations.jsx # Persistent locations discovered during play
    ├── HordeArea.jsx           # Fortress + villain sidebar
    ├── PlayerTableau.jsx       # Champion card, recruited heroes, ability slots
    ├── Card.jsx                # Universal card renderer with type-colored borders and slots
    ├── CubeSlots.jsx           # Cube slot display for cards
    ├── CubeChip.jsx            # Individual draggable cube chip
    ├── Bag.jsx                 # Player's cube bag display
    ├── Band.jsx                # Current draw band with power/bust info and action buttons
    ├── ActionOverlay.jsx       # Modal overlay for recruiting/combat with draw controls
    ├── DuskOverlay.jsx         # Dusk phase cube placement UI
    └── GameOverOverlay.jsx     # Win/loss screen
```

---

## License

This is a fan project inspired by Brian Jacques' *Redwall* series. Not affiliated with or endorsed by the Redwall estate.
