import React from 'react';
import { Trophy, ArrowRight, Award, Flame, FastForward } from 'lucide-react';
import { ClientRoomState } from '../../types';
import { AvatarBadge } from '../AvatarBadge';

interface RoundResultViewProps {
  state: ClientRoomState;
  currentPlayerId: string;
  isHost: boolean;
  onNextPhase: () => void;
}

export const RoundResultView: React.FC<RoundResultViewProps> = ({
  state,
  currentPlayerId,
  isHost,
  onNextPhase
}) => {
  const leaderboard = state.roundLeaderboard || [];
  const isFinalRound = state.currentRound >= state.totalRounds;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-black border-4 border-[#333] p-6 shadow-[8px_8px_0px_0px_#FF10F0] text-center relative overflow-hidden">
        <div className="bg-[#FF10F0] text-black px-3 py-1 inline-block transform -skew-x-12 mb-2 shadow-[2px_2px_0px_0px_#000000]">
          <div className="flex items-center gap-1.5 transform skew-x-12 text-[10px] font-black uppercase tracking-widest">
            <Trophy size={14} />
            <span>Resumen de Ronda {state.currentRound} de {state.totalRounds}</span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          Tabla de Puntuación
        </h2>
        <p className="text-slate-400 text-xs font-mono mt-1 uppercase">
          +50 por acertar al más votado · +50 por adivinar al autor
        </p>

        <div className="mt-3 text-xs text-[#39FF14] font-mono font-bold uppercase">
          {isFinalRound ? '¡Ronda final! Calculando podio...' : `Siguiente ronda en ${state.timer}s`}
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="bg-black border-4 border-[#333] p-6 shadow-[8px_8px_0px_0px_rgba(57,255,20,0.2)] flex flex-col gap-3">
        {leaderboard.map((entry, index) => {
          const isMe = entry.playerId === currentPlayerId;

          return (
            <div
              key={entry.playerId}
              className={`p-3.5 border-2 flex items-center gap-4 transition-all ${
                isMe
                  ? 'bg-[#1A1A1A] border-[#FF10F0] shadow-[3px_3px_0px_0px_#FF10F0]'
                  : 'bg-[#111] border-[#333]'
              }`}
            >
              {/* Rank Position */}
              <div className="w-7 text-center font-mono font-black text-lg text-[#FFE600]">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>

              <AvatarBadge
                iconName={entry.avatarIcon}
                color={entry.avatarColor}
                size="md"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm uppercase truncate">
                    {entry.name} {isMe && <span className="text-[#FF10F0] text-xs">(TÚ)</span>}
                  </span>
                  <span className="text-xl font-black text-[#39FF14] font-mono">
                    {entry.score} <span className="text-[10px] text-slate-400 font-mono uppercase">pts</span>
                  </span>
                </div>

                {/* Round Gains breakdown */}
                {entry.roundPoints > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {entry.breakdown.map((b, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-black uppercase bg-[#39FF14] text-black px-2 py-0.5 shadow-[1px_1px_0px_0px_#000000]"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5 uppercase">
                    +0 pts en esta ronda
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isHost && (
        <button
          onClick={onNextPhase}
          className="w-full py-4 px-6 bg-[#39FF14] hover:bg-[#32e012] text-black font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_#FF10F0] transition active:scale-98"
        >
          <span>{isFinalRound ? 'Ver Resultados Finales' : 'Siguiente Ronda Inmediatamente'}</span>
          <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
};
