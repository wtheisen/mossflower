import React from 'react';
import ReactDOM from 'react-dom/client';
import { Client } from 'boardgame.io/react';
import { RandomBot } from 'boardgame.io/ai';
import { MossflowerGame } from './game/mossflower.js';
import { SvgBoard } from './ui/SvgBoard.jsx';
import './style.css';

const MossflowerClient = Client({
  game: MossflowerGame,
  board: SvgBoard,
  numPlayers: 4,
  ai: {
    bot: RandomBot
  },
  debug: false
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MossflowerClient playerID="0" />
  </React.StrictMode>
);
