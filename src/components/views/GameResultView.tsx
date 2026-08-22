import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Sparkles,
  Flame,
  Search,
  Ghost,
  Award,
  Crown,
  Heart
} from 'lucide-react';
import { ClientRoomState } from '../../types';
import { AvatarBadge } from '../AvatarBadge';
import { soundFx } from '../../utils/audio';

interface GameResultViewProps {
  state: ClientRoomState;
  currentPlayerId: string;
  isHost: boolean;
  onRequestRematch: () => void;
}

export const GameResultView: React.FC<GameResultViewProps> = ({
  state,
  currentPlayerId,
  isHost,
  onRequestRematch
}) => {
  const awards = state.gameAwards;
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  useEffect(() => {
    soundFx.playDramaticReveal();
    // Big victory confetti blast
    const end = Date.now() + 3 * 1000;
    const interval: any = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-in zoom-in-95 duration-300">
      {/* Victory Header */}
      <div className="bg-black border-4 border-[#FFE600] p-8 text-center shadow-[12px_12px_0px_0px_#FF10F0] relative overflow-hidden flex flex-col items-center gap-4">
        <div className="bg-[#FFE600] text-black px-4 py-1 inline-block transform -skew-x-12 shadow-[3px_3px_0px_0px_#000000]">
          <div className="flex items-center gap-2 transform skew-x-12 text-xs font-black uppercase tracking-widest">
            <Trophy size={14} />
            <span>¡Fin de la Partida!</span>
          </div>
        </div>

        {winner && (
          <div className="flex flex-col items-center gap-3">
            <AvatarBadge
              iconName={winner.avatarIcon}
              color={winner.avatarColor}
              size="2xl"
              showCrown={true}
              className="shadow-[6px_6px_0px_0px_#000000] scale-110"
            />

            <div>
              <span className="text-[10px] uppercase tracking-widest font-black text-[#FFE600] font-mono block">
                Campeón Absoluto
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase">
                {winner.name}
              </h1>
              <div className="text-3xl font-black text-[#39FF14] font-mono mt-1">
                {winner.score} <span className="text-sm text-slate-400 uppercase">puntos</span>
              </div>
            </div>
          </div>
        )}

        {state.rematchCount > 0 && (
          <div className="mt-2 text-xs bg-[#FF10F0] text-black px-3 py-1 font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000000]">
            🔥 Racha de grupo: Partida #{state.rematchCount + 1}
          </div>
        )}
      </div>

      {/* Special Highlights & MVP Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {awards?.bestDetective && (
          <div className="bg-black border-2 border-[#333] p-4 flex flex-col items-center text-center gap-2 shadow-[3px_3px_0px_0px_#000000]">
            <div className="p-2.5 bg-[#39FF14] text-black">
              <Search size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">Mejor Detective</span>
              <span className="font-black text-white text-sm uppercase">{awards.bestDetective.name}</span>
              <span className="text-[11px] text-[#39FF14] block font-mono font-bold">{awards.bestDetective.count} autores descubiertos</span>
            </div>
          </div>
        )}

        {awards?.sneakAuthor && (
          <div className="bg-black border-2 border-[#333] p-4 flex flex-col items-center text-center gap-2 shadow-[3px_3px_0px_0px_#000000]">
            <div className="p-2.5 bg-[#FF10F0] text-black">
              <Ghost size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">Mente Maestra</span>
              <span className="font-black text-white text-sm uppercase">{awards.sneakAuthor.name}</span>
              <span className="text-[11px] text-[#FF10F0] block font-mono font-bold">{awards.sneakAuthor.count} veces sin descubrir</span>
            </div>
          </div>
        )}

        {awards?.mostVoted && (
          <div className="bg-black border-2 border-[#333] p-4 flex flex-col items-center text-center gap-2 shadow-[3px_3px_0px_0px_#000000]">
            <div className="p-2.5 bg-[#FFE600] text-black">
              <Flame size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">El Más Votado</span>
              <span className="font-black text-white text-sm uppercase">{awards.mostVoted.name}</span>
              <span className="text-[11px] text-[#FFE600] block font-mono font-bold">{awards.mostVoted.count} veces protagonista</span>
            </div>
          </div>
        )}
      </div>

      {/* Complete Final Rankings */}
      <div className="bg-black border-4 border-[#333] p-6 shadow-[8px_8px_0px_0px_rgba(57,255,20,0.2)] flex flex-col gap-2.5">
        <h3 className="text-xs uppercase font-black tracking-widest text-[#39FF14] mb-2 font-mono">
          Clasificación Final
        </h3>
        {sortedPlayers.map((player, idx) => {
          const isMe = player.id === currentPlayerId;
          return (
            <div
              key={player.id}
              className={`p-3 border-2 flex items-center justify-between transition ${
                isMe ? 'bg-[#1A1A1A] border-[#FF10F0] shadow-[2px_2px_0px_0px_#FF10F0]' : 'bg-[#111] border-[#333]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono font-black text-xs text-[#FFE600]">#{idx + 1}</span>
                <AvatarBadge iconName={player.avatarIcon} color={player.avatarColor} size="sm" />
                <span className="font-black text-white text-sm uppercase">
                  {player.name} {isMe && <span className="text-[#FF10F0] text-xs">(TÚ)</span>}
                </span>
              </div>
              <span className="font-mono font-black text-[#39FF14] text-sm">
                {player.score} pts
              </span>
            </div>
          );
        })}
      </div>

      {/* Rematch Button */}
      <div className="bg-black border-4 border-[#333] p-6 shadow-[10px_10px_0px_0px_#FF10F0] flex flex-col items-center gap-3 text-center">
        <h3 className="text-2xl font-black text-white uppercase tracking-tight">¿Jugamos otra ronda?</h3>
        <p className="text-slate-400 text-xs sm:text-sm max-w-sm font-medium">
          Mantén la misma sala y escribe preguntas nuevas ahora que ya conoces los secretos del grupo.
        </p>

        <button
          onClick={() => {
            soundFx.playSuccessPoints();
            onRequestRematch();
          }}
          className="w-full py-5 px-8 bg-[#39FF14] hover:bg-[#32e012] text-black font-black text-xl uppercase tracking-wider flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_#FF10F0] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-98"
        >
          <RotateCcw size={24} />
          <span>¡OTRA PARTIDA! (REVANCHA)</span>
        </button>
      </div>
    </div>
  );
};
