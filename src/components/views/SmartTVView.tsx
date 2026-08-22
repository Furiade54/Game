import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Tv,
  Users,
  Flame,
  Clock,
  Trophy,
  Award,
  Sparkles,
  Volume2,
  VolumeX,
  FastForward,
  Play,
  RotateCcw
} from 'lucide-react';
import { ClientRoomState } from '../../types';
import { AvatarBadge } from '../AvatarBadge';
import { soundFx } from '../../utils/audio';

interface SmartTVViewProps {
  state: ClientRoomState;
  onStartGame: () => void;
  onNextPhase: () => void;
  onRequestRematch: () => void;
}

export const SmartTVView: React.FC<SmartTVViewProps> = ({
  state,
  onStartGame,
  onNextPhase,
  onRequestRematch
}) => {
  const [muted, setMuted] = React.useState(soundFx.isMuted);

  const toggleMute = () => {
    soundFx.isMuted = !soundFx.isMuted;
    setMuted(soundFx.isMuted);
  };

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?room=${state.code}`
    : `https://quien-de-aqui.app?room=${state.code}`;

  const question = state.activeQuestion?.text || '';

  return (
    <div className="w-full min-h-screen bg-[#0D0D0D] text-[#F2F2F2] p-6 sm:p-10 flex flex-col justify-between select-none relative overflow-hidden">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-50" />

      {/* TV Header Bar */}
      <div className="flex items-center justify-between border-b-4 border-[#222] pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#FF10F0] text-black border-2 border-black flex items-center justify-center font-black text-3xl shadow-[4px_4px_0px_0px_#39FF14]">
            ?
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3 uppercase">
              <span>¿Quién de aquí…?</span>
              <div className="bg-[#FFE600] text-black px-2.5 py-0.5 inline-block transform -skew-x-12">
                <span className="text-[10px] uppercase font-black tracking-widest block transform skew-x-12">
                  PANTALLA DE SALA
                </span>
              </div>
            </h1>
            <p className="text-[#39FF14] text-xs font-mono font-bold tracking-wider uppercase">Party Game Social</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-black border-4 border-[#333] px-6 py-2 flex items-center gap-3 shadow-[4px_4px_0px_0px_#FF10F0]">
            <span className="text-xs uppercase font-mono font-black text-slate-400">Código de Sala</span>
            <span className="text-4xl font-black text-[#FFE600] font-mono tracking-widest">{state.code}</span>
          </div>

          <button
            onClick={toggleMute}
            className="p-3 bg-black border-2 border-[#333] text-slate-300 hover:text-white shadow-[3px_3px_0px_0px_#000000]"
          >
            {muted ? <VolumeX size={24} /> : <Volume2 size={24} className="text-[#39FF14]" />}
          </button>
        </div>
      </div>

      {/* Main Center Stage based on current phase */}
      <div className="my-auto py-8 flex flex-col items-center justify-center max-w-5xl mx-auto w-full relative z-10">
        {state.phase === 'LOBBY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center w-full">
            {/* QR Code Card */}
            <div className="bg-black border-4 border-[#FF10F0] p-8 flex flex-col items-center text-center shadow-[10px_10px_0px_0px_#39FF14]">
              <span className="text-xs uppercase font-mono font-black tracking-widest text-[#FFE600] mb-2">
                Escanea con tu móvil para unirte
              </span>
              <div className="p-4 bg-white border-4 border-black my-3 shadow-[4px_4px_0px_0px_#000000]">
                <QRCodeSVG value={joinUrl} size={220} level="M" />
              </div>
              <div className="text-2xl font-black text-white mt-2 font-mono uppercase tracking-wider">
                {joinUrl.replace(/^https?:\/\//, '')}
              </div>
            </div>

            {/* Connected players list */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <Users className="text-[#39FF14]" size={24} />
                  <span>Jugadores Conectados ({state.players.length}/12)</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                {state.players.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-black border-2 border-[#333] flex items-center gap-3 shadow-[3px_3px_0px_0px_#000000]"
                  >
                    <AvatarBadge iconName={p.avatarIcon} color={p.avatarColor} size="md" showCrown={p.isHost} />
                    <span className="font-black text-white text-sm uppercase truncate">{p.name}</span>
                  </div>
                ))}
              </div>

              {state.players.length >= 4 ? (
                <button
                  onClick={onStartGame}
                  className="w-full mt-2 py-4 px-6 bg-[#39FF14] hover:bg-[#32e012] text-black font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_#FF10F0] transition active:scale-98"
                >
                  <Play size={20} fill="currentColor" />
                  <span>COMENZAR PARTIDA</span>
                </button>
              ) : (
                <div className="text-xs font-mono uppercase text-slate-400 text-center font-bold bg-black p-4 border-2 border-[#333]">
                  Esperando jugadores... (Mínimo 4 para iniciar)
                </div>
              )}
            </div>
          </div>
        )}

        {state.phase === 'QUESTION_CREATION' && (
          <div className="text-center max-w-2xl">
            <div className="bg-[#FFE600] text-black px-4 py-1 inline-block transform -skew-x-12 mb-4 shadow-[3px_3px_0px_0px_#000000]">
              <span className="text-xs font-mono font-black uppercase tracking-widest block transform skew-x-12">
                Tiempo de Redacción: {state.timer}s
              </span>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tight uppercase mb-4">
              Escribid vuestras preguntas en el móvil
            </h2>
            <p className="text-xl text-slate-400 mb-8 font-medium">
              Cada jugador está formulando una pregunta anónima sobre el grupo...
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              {state.players.map(p => (
                <div
                  key={p.id}
                  className={`px-4 py-2.5 border-2 flex items-center gap-2.5 transition-all ${
                    p.hasSubmittedQuestion
                      ? 'bg-[#111] border-[#39FF14] text-[#39FF14] shadow-[3px_3px_0px_0px_#39FF14]'
                      : 'bg-black border-[#333] text-slate-400'
                  }`}
                >
                  <AvatarBadge iconName={p.avatarIcon} color={p.avatarColor} size="sm" />
                  <span className="font-black uppercase text-sm">{p.name}</span>
                  <span className="text-[10px] font-mono uppercase">{p.hasSubmittedQuestion ? '✓ Listo' : 'Escribiendo...'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(state.phase === 'QUESTION_DISPLAY' || state.phase === 'VOTING') && (
          <div className="text-center max-w-3xl flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-black uppercase tracking-widest text-black bg-[#FF10F0] px-4 py-1 shadow-[2px_2px_0px_0px_#000000]">
                Ronda {state.currentRound} / {state.totalRounds}
              </span>
              <span className="text-xs font-mono font-black uppercase tracking-widest text-black bg-[#FFE600] px-4 py-1 shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1.5">
                <Clock size={14} />
                <span>{state.timer}s</span>
              </span>
            </div>

            <div className="bg-black border-4 border-[#FFE600] p-10 sm:p-14 shadow-[12px_12px_0px_0px_#FF10F0]">
              <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight uppercase">
                "{question}"
              </h2>
            </div>

            <p className="text-2xl font-black text-[#39FF14] uppercase tracking-wider animate-pulse">
              {state.phase === 'VOTING' ? '¡VOTAD AHORA EN VUESTROS MÓVILES!' : 'Leed con atención...'}
            </p>
          </div>
        )}

        {state.phase === 'VOTE_RESULT' && state.voteResult && (
          <div className="text-center max-w-3xl flex flex-col items-center gap-6">
            <div className="bg-[#FFE600] text-black px-4 py-1 inline-block transform -skew-x-12 shadow-[3px_3px_0px_0px_#000000]">
              <span className="text-xs uppercase tracking-widest font-black block transform skew-x-12">
                Resultado de la Votación
              </span>
            </div>
            <div className="text-6xl sm:text-8xl font-black text-white uppercase tracking-tight">
              {state.voteResult.mostVotedPlayerName}
            </div>
            <div className="text-3xl font-black text-black bg-[#39FF14] px-8 py-3 shadow-[6px_6px_0px_0px_#FF10F0] font-mono">
              {state.voteResult.mostVotedPercentage}% DE LA MESA
            </div>
          </div>
        )}

        {state.phase === 'DEFENSE' && state.voteResult && (
          <div className="text-center max-w-3xl flex flex-col items-center gap-6">
            <div className="text-5xl sm:text-7xl font-black text-white uppercase">
              {state.voteResult.mostVotedPlayerName}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#FF10F0] uppercase font-mono">
              {state.voteResult.mostVotedPercentage}% DE LA MESA TE VOTÓ.
            </div>
            <div className="text-4xl sm:text-6xl font-black text-[#FFE600] uppercase tracking-tight animate-bounce">
              ¡EXPLÍCATE!
            </div>
            <div className="w-32 h-32 border-4 border-[#39FF14] bg-black flex items-center justify-center text-6xl font-black text-white font-mono shadow-[6px_6px_0px_0px_#FF10F0]">
              {state.timer}
            </div>
          </div>
        )}

        {state.phase === 'AUTHOR_GUESS' && (
          <div className="text-center max-w-3xl flex flex-col items-center gap-6">
            <span className="text-xs font-mono font-black uppercase tracking-widest text-black bg-[#FFE600] px-4 py-1 shadow-[2px_2px_0px_0px_#000000]">
              Investigación ({state.timer}s)
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase">
              ¿Quién escribió esta pregunta?
            </h2>
            <p className="text-2xl text-slate-400 font-medium">
              "{question}"
            </p>
            <p className="text-lg font-black text-[#39FF14] uppercase tracking-wider">
              Seleccionad vuestro sospechoso en el móvil...
            </p>
          </div>
        )}

        {state.phase === 'SUSPICION_REVEAL' && (
          <div className="text-center max-w-3xl flex flex-col items-center gap-6">
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase">
              Sospechas de la Mesa
            </h2>
            <div className="text-2xl uppercase tracking-widest font-black text-[#FF10F0] font-mono animate-pulse">
              Revelando autor en {state.timer}...
            </div>
          </div>
        )}

        {state.phase === 'AUTHOR_REVEAL' && state.authorReveal && (
          <div className="text-center max-w-3xl flex flex-col items-center gap-6">
            <span className="text-xs uppercase tracking-widest font-black text-black bg-[#FFE600] px-4 py-1 font-mono shadow-[2px_2px_0px_0px_#000000]">
              El autor era...
            </span>
            <div className="text-6xl sm:text-8xl font-black text-[#FFE600] uppercase tracking-tight">
              {state.authorReveal.authorName}
            </div>
            <p className="text-xl text-white font-bold">
              {state.authorReveal.guesserNames.length > 0
                ? `Acertaron: ${state.authorReveal.guesserNames.join(', ')}`
                : '¡Nadie descubrió al autor! Mente Maestra 🎭'}
            </p>
          </div>
        )}

        {state.phase === 'ROUND_RESULT' && (
          <div className="w-full max-w-2xl bg-black border-4 border-[#333] p-8 text-center shadow-[10px_10px_0px_0px_#FF10F0]">
            <h3 className="text-3xl font-black text-white uppercase mb-6">Puntuaciones</h3>
            <div className="flex flex-col gap-3">
              {state.roundLeaderboard?.slice(0, 5).map((entry, i) => (
                <div key={entry.playerId} className="flex justify-between items-center p-3.5 bg-[#111] border-2 border-[#333]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-lg text-[#FFE600]">#{i + 1}</span>
                    <span className="font-black text-white text-base uppercase">{entry.name}</span>
                  </div>
                  <span className="font-mono font-black text-2xl text-[#39FF14]">{entry.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.phase === 'GAME_RESULT' && (
          <div className="text-center max-w-3xl flex flex-col items-center gap-6">
            <div className="bg-[#FFE600] text-black px-6 py-2 font-black text-base uppercase tracking-widest shadow-[4px_4px_0px_0px_#000000]">
              <div className="flex items-center gap-2">
                <Trophy size={20} />
                <span>¡FIN DE LA PARTIDA!</span>
              </div>
            </div>
            {state.gameAwards?.gameWinner && (
              <div className="text-6xl sm:text-8xl font-black text-white uppercase">
                👑 {state.gameAwards.gameWinner.name} ({state.gameAwards.gameWinner.score} pts)
              </div>
            )}
            <button
              onClick={onRequestRematch}
              className="py-5 px-10 bg-[#39FF14] hover:bg-[#32e012] text-black font-black text-2xl uppercase tracking-wider shadow-[8px_8px_0px_0px_#FF10F0] flex items-center gap-3"
            >
              <RotateCcw size={28} />
              <span>¡JUGAR OTRA!</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="text-center text-xs font-mono font-bold text-slate-500 border-t-2 border-[#222] pt-4 relative z-10 uppercase">
        ¿Quién de aquí…? · Party Game Social Web
      </div>
    </div>
  );
};
