import React, { useEffect } from 'react';
import { HelpCircle, Eye, Sparkles } from 'lucide-react';
import { ClientRoomState } from '../../types';
import { AvatarBadge } from '../AvatarBadge';
import { soundFx } from '../../utils/audio';

interface SuspicionRevealViewProps {
  state: ClientRoomState;
}

export const SuspicionRevealView: React.FC<SuspicionRevealViewProps> = ({ state }) => {
  const suspicions = state.suspicions?.suspectCounts || {};
  const total = state.suspicions?.totalGuesses || 1;

  useEffect(() => {
    soundFx.playTick();
  }, [state.timer]);

  // Sort players by highest suspicion count
  const sortedPlayers = [...state.players].sort((a, b) => {
    const countA = suspicions[a.id] || 0;
    const countB = suspicions[b.id] || 0;
    return countB - countA;
  });

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
      {/* Suspense Header */}
      <div className="text-center">
        <div className="bg-[#FFE600] text-black px-3 py-1 inline-block transform -skew-x-12 mb-2 shadow-[2px_2px_0px_0px_#000000]">
          <div className="flex items-center gap-1.5 transform skew-x-12 text-[10px] font-black uppercase tracking-widest">
            <Eye size={14} />
            <span>Sospechas de la Mesa</span>
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
          ¿En quién desconfió el grupo?
        </h2>
      </div>

      {/* Suspicions Breakdown Table */}
      <div className="w-full bg-black border-4 border-[#333] p-6 sm:p-8 shadow-[10px_10px_0px_0px_#FF10F0]">
        <div className="flex flex-col gap-3">
          {sortedPlayers.map((player, index) => {
            const count = suspicions[player.id] || 0;
            const pct = Math.round((count / Math.max(1, total)) * 100);
            const isTopSuspect = index === 0 && count > 0;

            return (
              <div
                key={player.id}
                className={`p-3 border-2 flex items-center gap-3 transition-all ${
                  isTopSuspect
                    ? 'bg-[#1A1A1A] border-[#FFE600] shadow-[2px_2px_0px_0px_#FFE600]'
                    : 'bg-[#111] border-[#333]'
                }`}
              >
                <AvatarBadge iconName={player.avatarIcon} color={player.avatarColor} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-white text-sm uppercase truncate">{player.name}</span>
                    <span className="font-mono font-black text-xs text-[#FFE600]">
                      {count} {count === 1 ? 'SOSPECHA' : 'SOSPECHAS'}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-[#111] border border-[#333] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isTopSuspect ? 'bg-[#FFE600]' : 'bg-[#FF10F0]/60'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dramatic countdown countdown banner */}
        <div className="mt-8 pt-6 border-t-2 border-[#222] text-center flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest font-black text-[#FF10F0] font-mono animate-pulse">
            EL VERDADERO AUTOR SE REVELA EN...
          </span>
          <div className="text-4xl font-black text-black bg-[#39FF14] px-6 py-2 shadow-[4px_4px_0px_0px_#FF10F0] font-mono">
            {state.timer}
          </div>
        </div>
      </div>
    </div>
  );
};
