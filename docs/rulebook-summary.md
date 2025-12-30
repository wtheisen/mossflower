# Mossflower Rulebook Summary

## Core Concepts
- Cooperative bag-building tableau builder set in the Redwall universe.
- Players control Champions with unique bags, quests, and affinities to hero cards.
- Defeat the Horde by clearing its Fortress and Villain cards before the Conquest Track reaches 10.

## Setup Highlights
1. Deal a Champion to each player and seed their bag per the Champion card.
2. Each Champion tucks their personal quest cards under their Champion (quest side showing).
3. Start with Redwall Infirmary, Great Hall, and Cellar in the Discovered Locations row; reveal five cards in the Adventure Row (3 normal + 2 after inserting Horde Captains).
4. Reveal a Horde card and place Fortress/Villain decks above the Adventure Row, revealing the top Fortress card.
5. Add Vermin equal to player count to the Conquest Track.
6. Mouse Champion (or most recent mouse witness) takes the first turn.

## Day Structure
Each round is a Day with three phases:
- **Day:** Players, in order, either engage in Combat against Vermin on a card or trigger an Action printed on a card (including Recruit/Discover actions). Helping Hands/Reinforcements allow other players to draw after the active player meets minimum draw requirements.
- **Dusk:** Players place every cube drawn that day into either their Tableau (per-hero slots, with wounds/inexperience restrictions) or the Location they currently occupy (as workers/reserves).
- **Night:** Resolve night abilities, remove occupied Adventure Row cards (adding Vermin to Conquest if any removed), spawn Vermin onto cards equal to the Conquest Track value, then add +1 Vermin to the track. Players may return up to two cubes from their Tableau to their bag after night resolution.

## Drawing & Bust Rules
- Players draw cubes one at a time and may stop voluntarily, except during Combat where they must draw at least the number of Vermin cubes added.
- Drawing any combination of two white (Inexperience) and/or black (Vermin/Wounds) cubes immediately busts the attempt.

## Combat Summary
- Add all Vermin on the target card to the active player’s bag before drawing.
- Must keep drawing until at least as many cubes as Vermin were added.
- **Victory:** More allied cubes than Vermin; return Vermin to supply, remove 1 Conquest Vermin if 4+ fought, replace an inexperience cube with mastery if 7+ fought.
- **Defeat:** Vermin cubes return to the card, add +1 to Conquest Track.

## Tableau & Exhaustion
- Cubes placed on Hero cards trigger unique benefits; black cubes become wounds, white inexperience must go on the Champion.
- If forced to place a cube with no empty slots, the Champion becomes Exhausted: move all wounds from the Tableau to the Champion’s current location as Vermin, move the Champion to Redwall Infirmary, and the next day they must take that action.

## Locations & Workers
- Critters placed on locations become Workers for future visitors; using the action adds those cubes to the acting player’s bag.
- Vermin added to a location with Workers remove one Worker per Vermin prevented.

## Quests & Affinity
- Champions add their personal Quests to the Adventure Deck, enabling upgrades from inexperience cubes to mastery tokens.
- Cards have affinities; matching cards in your Tableau count as a free cube of that type when interacting with cards of the same affinity.

This summary emphasizes the flow, resource economy, and end conditions needed when prototyping the digital implementation.

## Digital Prototype Notes
- Day actions enforce the bust rule (any two white or black draws) and combat automatically loads Vermin cubes into the bag, requiring a minimum draw equal to the target’s Vermin.
- Combat resolution clears Vermin on victory, reduces the Conquest Track for large clashes, unlocks Mastery upgrades for 7+ Vermin fights, and handles Fortress/Villain progress (Fortress deck must be cleared before the Villain becomes vulnerable).
- Dusk placement forces white cubes onto the Champion, black cubes into the tableau, and only critter cubes can become Workers at your current location; exhaustion moves wounds to that location as Vermin and sends you to the Infirmary next day.
- Night removes any occupied Adventure Row cards (adding conquest if at least one), spreads Vermin while workers absorb hits, and automatically returns up to two tableau cubes to each bag to simulate resting.
- Affinity bonuses count every matching tableau card as a virtual draw, and helping-hand draws from other players feed into the current player’s cube pool while inexperience penalties stick with the helper.
- Champion-specific quests are shuffled directly into the Adventure Deck; resolving them consumes cubes from the current draw (respecting any required critter types) and grants a Mastery upgrade upon completion.
- Traveling between discovered locations is a free Day move, immediately collecting any waiting workers, while Fortress/Villain cards require explicit targeting and respect Horde modifiers.
- Horde cards now inject scripted abilities (e.g., Ferret Clan enforcing extra combat draws, Rat Pack harassing worker-heavy locations) that modify Day combat rules or Nighttime vermin spread.
