import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { LobbyClient } from 'boardgame.io/client';
import { MossflowerGame } from './game/mossflower.js';
import { SvgBoard } from './ui/SvgBoard.jsx';
import './style.css';

const BGIO_SERVER = import.meta.env.VITE_BGIO_SERVER || inferServerURL();
const GAME_NAME = MossflowerGame.name;
const PLAYER_ID = '0';

const MossflowerClient = Client({
  game: MossflowerGame,
  board: SvgBoard,
  multiplayer: SocketIO({ server: BGIO_SERVER }),
  debug: false
});

function inferServerURL() {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }
  const url = new URL(window.location.href);
  url.port = '8000';
  return url.origin;
}

function useMatchSession() {
  const [session, setSession] = useState(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('mossflower-session') : null;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState(session ? 'ready' : 'connecting');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session || status === 'error') {
      return;
    }
    let cancelled = false;
    async function bootstrap() {
      setStatus('connecting');
      try {
        const lobby = new LobbyClient({ server: BGIO_SERVER });
        const { matchID } = await lobby.createMatch(GAME_NAME, { numPlayers: 4 });
        const { playerCredentials } = await lobby.joinMatch(GAME_NAME, matchID, {
          playerID: PLAYER_ID,
          playerName: 'Champion'
        });
        if (cancelled) return;
        const nextSession = {
          matchID,
          playerID: PLAYER_ID,
          credentials: playerCredentials
        };
        window.localStorage.setItem('mossflower-session', JSON.stringify(nextSession));
        setSession(nextSession);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to prepare match', err);
        setError(err?.message ?? 'Failed to create match');
        setStatus('error');
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  return { session, status, error };
}

function App() {
  const { session, status, error } = useMatchSession();

  if (status === 'connecting') {
    return <div className="panel">Preparing cooperative match…</div>;
  }

  if (error || !session) {
    return <div className="panel">Unable to prepare match: {error ?? 'Unknown error'}</div>;
  }

  return <MossflowerClient matchID={session.matchID} playerID={session.playerID} credentials={session.credentials} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
