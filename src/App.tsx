import React, { useState, useEffect, useRef } from 'react';
import {
  ClientMessage,
  ServerMessage,
  ClientRoomState,
  GamePhase
} from './types';
import { HomeEntryView } from './components/views/HomeEntryView';
import { LobbyView } from './components/views/LobbyView';
import { QuestionCreationView } from './components/views/QuestionCreationView';
import { QuestionDisplayView } from './components/views/QuestionDisplayView';
import { VotingView } from './components/views/VotingView';
import { VoteResultView } from './components/views/VoteResultView';
import { DefenseView } from './components/views/DefenseView';
import { AuthorGuessView } from './components/views/AuthorGuessView';
import { SuspicionRevealView } from './components/views/SuspicionRevealView';
import { AuthorRevealView } from './components/views/AuthorRevealView';
import { RoundResultView } from './components/views/RoundResultView';
import { GameResultView } from './components/views/GameResultView';
import { SmartTVView } from './components/views/SmartTVView';
import { ShareModal } from './components/ShareModal';
import { ReportModal } from './components/ReportModal';
import { AvatarBadge } from './components/AvatarBadge';
import { soundFx } from './utils/audio';
import {
  Flame,
  Volume2,
  VolumeX,
  Share2,
  Tv,
  LogOut,
  Flag,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [wsState, setWsState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [roomState, setRoomState] = useState<ClientRoomState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [isTVDisplay, setIsTVDisplay] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [muted, setMuted] = useState(soundFx.isMuted);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectInfoRef = useRef<{ roomCode: string; playerId: string; isTV: boolean } | null>(null);

  // Check URL params for room code
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomCode(roomParam.toUpperCase());
    }
  }, []);

  const connectWebSocket = (onOpenCallback?: () => void) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (onOpenCallback) onOpenCallback();
      return;
    }

    setWsState('CONNECTING');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsState('CONNECTED');
      setErrorMessage(null);
      if (reconnectInfoRef.current) {
        // Attempt rejoin
        const { roomCode, playerId, isTV } = reconnectInfoRef.current;
        ws.send(JSON.stringify({
          type: 'RECONNECT',
          payload: { roomCode, playerId, isTVDisplay: isTV }
        }));
      }
      if (onOpenCallback) onOpenCallback();
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        if (msg.type === 'JOINED') {
          setCurrentPlayerId(msg.payload.playerId);
          setIsHost(msg.payload.isHost);
          setIsTVDisplay(msg.payload.isTVDisplay);
          setRoomState(msg.payload.state);
          reconnectInfoRef.current = {
            roomCode: msg.payload.roomCode,
            playerId: msg.payload.playerId,
            isTV: msg.payload.isTVDisplay
          };
        } else if (msg.type === 'STATE_UPDATE') {
          setRoomState(msg.payload.state);
          if (currentPlayerId) {
            setIsHost(msg.payload.state.hostId === currentPlayerId);
          }
        } else if (msg.type === 'TIMER_TICK') {
          setRoomState((prev) => (prev ? { ...prev, timer: msg.payload.timer } : null));
        } else if (msg.type === 'ERROR') {
          setErrorMessage(msg.payload.message);
        }
      } catch (err) {
        console.error('Failed to parse server message', err);
      }
    };

    ws.onclose = () => {
      setWsState('DISCONNECTED');
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
      setWsState('DISCONNECTED');
    };
  };

  const sendMessage = (msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const handleCreateRoom = (hostName: string, avatarColor: string, avatarIcon: string, isTV: boolean) => {
    connectWebSocket(() => {
      const msg: ClientMessage = {
        type: 'CREATE_ROOM',
        payload: { hostName, avatarColor, avatarIcon, isTVDisplay: isTV }
      };
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify(msg));
      }
    });
  };

  const handleJoinRoom = (roomCode: string, playerName: string, avatarColor: string, avatarIcon: string, isTV: boolean) => {
    connectWebSocket(() => {
      const msg: ClientMessage = {
        type: 'JOIN_ROOM',
        payload: { roomCode, playerName, avatarColor, avatarIcon, isTVDisplay: isTV }
      };
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify(msg));
      }
    });
  };

  const handleLeaveRoom = () => {
    sendMessage({ type: 'LEAVE_ROOM' });
    setRoomState(null);
    setCurrentPlayerId('');
    reconnectInfoRef.current = null;
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const toggleSound = () => {
    soundFx.isMuted = !soundFx.isMuted;
    setMuted(soundFx.isMuted);
  };

  // If viewing as Smart TV
  if (roomState && isTVDisplay) {
    return (
      <SmartTVView
        state={roomState}
        onStartGame={() => sendMessage({ type: 'START_GAME' })}
        onNextPhase={() => sendMessage({ type: 'NEXT_PHASE' })}
        onRequestRematch={() => sendMessage({ type: 'REQUEST_REMATCH' })}
      />
    );
  }

  const me = roomState?.players.find(p => p.id === currentPlayerId);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] flex flex-col font-sans selection:bg-[#FF10F0] selection:text-black border-0 sm:border-[6px] md:border-[10px] border-[#1A1A1A] relative">
      {/* Background Dots Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-10 artistic-dots-pink z-0"></div>

      {/* Top Navbar */}
      <header className="border-b-2 border-[#333] bg-[#080808]/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FF10F0] text-black flex items-center justify-center font-black text-xl sm:text-2xl shadow-[2px_2px_0px_0px_#39FF14] transform -rotate-3 shrink-0">
            ?
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#FF10F0] font-black block leading-none mb-0.5">
              Party Game Social
            </span>
            <span className="text-lg sm:text-2xl font-black tracking-tight text-white block leading-tight">
              ¿Quién de aquí…?
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            onClick={toggleSound}
            className="p-2 sm:p-2.5 rounded-none bg-[#1A1A1A] border-2 border-[#333] hover:border-[#39FF14] text-[#F2F2F2] hover:text-[#39FF14] transition shadow-[2px_2px_0px_0px_#000000]"
            title={muted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-[#39FF14]" />}
          </button>

          {roomState && (
            <>
              <button
                onClick={() => setShareOpen(true)}
                className="p-2 sm:p-2.5 rounded-none bg-[#1A1A1A] border-2 border-[#333] hover:border-[#FF10F0] text-[#FF10F0] hover:text-white transition shadow-[2px_2px_0px_0px_#000000]"
                title="Compartir sala / QR"
              >
                <Share2 size={16} />
              </button>

              <button
                onClick={() => setIsTVDisplay(true)}
                className="p-2 sm:p-2.5 rounded-none bg-[#1A1A1A] border-2 border-[#333] hover:border-[#39FF14] text-[#39FF14] hover:text-white transition shadow-[2px_2px_0px_0px_#000000]"
                title="Modo Pantalla de TV"
              >
                <Tv size={16} />
              </button>

              <button
                onClick={handleLeaveRoom}
                className="p-2 sm:p-2.5 rounded-none bg-[#1A1A1A] border-2 border-[#333] hover:border-rose-500 text-slate-400 hover:text-rose-400 transition shadow-[2px_2px_0px_0px_#000000]"
                title="Salir de la sala"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Error alert toast */}
      {errorMessage && (
        <div className="max-w-md mx-auto my-3 px-4 py-2.5 bg-black border-2 border-[#FF10F0] text-[#FF10F0] text-xs font-black uppercase tracking-wider flex items-center justify-between gap-2 shadow-[4px_4px_0px_0px_#FF10F0] z-30">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-white hover:text-[#39FF14]">
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center relative z-10">
        {!roomState ? (
          <HomeEntryView
            initialRoomCode={initialRoomCode}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        ) : (
          <>
            {roomState.phase === 'LOBBY' && (
              <LobbyView
                state={roomState}
                currentPlayerId={currentPlayerId}
                isHost={isHost}
                isTVDisplay={isTVDisplay}
                onStartGame={() => sendMessage({ type: 'START_GAME' })}
                onAddBots={(count) => sendMessage({ type: 'ADD_BOTS', payload: { count } })}
                onRemoveBots={() => sendMessage({ type: 'REMOVE_BOTS' })}
                onUpdateSettings={(settings) => sendMessage({ type: 'UPDATE_SETTINGS', payload: { settings } })}
                onOpenShare={() => setShareOpen(true)}
                onToggleTVMode={() => setIsTVDisplay(!isTVDisplay)}
              />
            )}

            {roomState.phase === 'QUESTION_CREATION' && (
              <QuestionCreationView
                state={roomState}
                currentPlayerId={currentPlayerId}
                onSubmitQuestion={(text) => sendMessage({ type: 'SUBMIT_QUESTION', payload: { text } })}
              />
            )}

            {roomState.phase === 'QUESTION_DISPLAY' && (
              <QuestionDisplayView
                state={roomState}
                onOpenReport={() => setReportOpen(true)}
              />
            )}

            {roomState.phase === 'VOTING' && (
              <VotingView
                state={roomState}
                currentPlayerId={currentPlayerId}
                onCastVote={(targetPlayerId) => sendMessage({ type: 'CAST_VOTE', payload: { targetPlayerId } })}
                onOpenReport={() => setReportOpen(true)}
              />
            )}

            {roomState.phase === 'VOTE_RESULT' && (
              <VoteResultView
                state={roomState}
                currentPlayerId={currentPlayerId}
              />
            )}

            {roomState.phase === 'DEFENSE' && (
              <DefenseView
                state={roomState}
                currentPlayerId={currentPlayerId}
                isHost={isHost}
                onNextPhase={() => sendMessage({ type: 'NEXT_PHASE' })}
              />
            )}

            {roomState.phase === 'AUTHOR_GUESS' && (
              <AuthorGuessView
                state={roomState}
                currentPlayerId={currentPlayerId}
                onGuessAuthor={(suspectedPlayerId) => sendMessage({ type: 'GUESS_AUTHOR', payload: { suspectedPlayerId } })}
              />
            )}

            {roomState.phase === 'SUSPICION_REVEAL' && (
              <SuspicionRevealView state={roomState} />
            )}

            {roomState.phase === 'AUTHOR_REVEAL' && (
              <AuthorRevealView
                state={roomState}
                currentPlayerId={currentPlayerId}
              />
            )}

            {roomState.phase === 'ROUND_RESULT' && (
              <RoundResultView
                state={roomState}
                currentPlayerId={currentPlayerId}
                isHost={isHost}
                onNextPhase={() => sendMessage({ type: 'NEXT_PHASE' })}
              />
            )}

            {roomState.phase === 'GAME_RESULT' && (
              <GameResultView
                state={roomState}
                currentPlayerId={currentPlayerId}
                isHost={isHost}
                onRequestRematch={() => sendMessage({ type: 'REQUEST_REMATCH' })}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs font-mono uppercase tracking-widest text-[#666] border-t border-[#222] mt-auto z-10 bg-[#080808]">
        ¿Quién de aquí…? · Party Game Social Web
      </footer>

      {/* Modals */}
      {roomState && (
        <>
          <ShareModal
            roomCode={roomState.code}
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
          />
          <ReportModal
            isOpen={reportOpen}
            onClose={() => setReportOpen(false)}
            onConfirmReport={() => sendMessage({ type: 'REPORT_QUESTION' })}
          />
        </>
      )}
    </div>
  );
}
