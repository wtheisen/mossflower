import { Server } from 'boardgame.io/server';
import { RandomBot } from 'boardgame.io/ai';
import { MossflowerGame } from './game/mossflower.js';

const { PORT = 8000, CLIENT_ORIGIN = 'http://localhost:5173' } = process.env;

const server = Server({
  games: [
    {
      name: MossflowerGame.name,
      game: MossflowerGame,
      bots: {
        '1': RandomBot,
        '2': RandomBot,
        '3': RandomBot
      }
    }
  ],
  origins: [CLIENT_ORIGIN, 'http://localhost:4173']
});

server.run(Number(PORT), () => {
  console.log(`Mossflower server running on http://localhost:${PORT}`);
  console.log(`Allowing requests from ${CLIENT_ORIGIN}`);
});
