import { Server } from 'boardgame.io/server';
import { MossflowerGame } from './game/mossflower.js';

const server = Server({
  games: [MossflowerGame]
});

const PORT = Number(process.env.PORT) || 8000;

server.run(PORT, () => {
  console.log(`Mossflower server running on http://localhost:${PORT}`);
});
