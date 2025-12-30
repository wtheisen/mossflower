# Card Data CSVs

Use the CSV files in `data/cards/` as templates for entering your physical card designs. Each file contains the placeholder data currently wired into the prototype. Replace the rows (or add new ones) with your finalized cards.

## Files

- `champions.csv` – Champion metadata: affinities, starting bags, tableau slots, and linked quest IDs.
- `heroes.csv` – Recruitable hero cards: cost, affinity, cube payload, ability text, and optional `ability_key` for scripting special powers.
- `locations.csv` – Adventure and base locations (the `category` column distinguishes them).
- `quests.csv` – Champion-specific quests plus global quests, including owner, goal type, targets, and requirements.
- `fortress.csv` / `villains.csv` – Siege stacks with slots, starting Vermin, and ability text.
- `horde.csv` – Horde cards with their rules text and effect keys.

## Editing Tips

1. Keep the header row intact so automated tooling can parse the file.
2. Use semicolons (`;`) to separate multiple affinities, cube types, or quest requirements within a single cell.
3. If you add new card types, create another CSV following the same pattern (header + one line per card) so it’s easy to script the import later.
4. Once updated, let me know and I can pull the new CSV data directly into the `content.js` structures.
