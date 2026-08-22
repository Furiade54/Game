import React, { useState, useEffect } from 'react';
import { Clock, Check, Flag, Users } from 'lucide-react';
import { ClientRoomState, Player } from '../../types';
import { AvatarBadge } from '../AvatarBadge';
import { soundFx } from '../../utils/audio';

interface VotingViewProps {
  state: ClientRoomState;
  currentPlayerId: string;
  onCastVote: (targetPlayerId: string) => void;
  onOpenReport: () => void;
}

export const VotingView: React.FC<VotingViewProps> = ({
  state,
  currentPlayerId,
  onCastVote,
  onOpenReport
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const me = state.players.find(p => p.id === currentPlayerId);
  const hasVoted = me?.hasVoted || selectedTargetId !== null;

  const question = state.activeQuestion?.text || '¿Quién de aquí sería el más culpable?';
  const votedCount = state.players.filter(p => p.hasVoted).length;
  const totalCount = state.players.length;

  useEffect(() => {
    if (state.timer <= 3 && state.timer > 0) {
      soundFx.playTick();
    }
  }, [state.timer]);

  const handleVote = (target: Player) => {
    if (hasVoted) return;
    setSelectedTargetId(target.id);
    soundFx.playVoteLock();
    onCastVote(target.id);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in">
      {/* Top Question Header */}
      <div className="bg-black border-4 border-[#333] p-6 shadow-[8px_8px_0px_0px_rgba(255,16,240,0.3)] relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-3">
          <div className="bg-[#FF10F0] text-black px-2.5 py-0.5 inline-block transform -skew-x-12">
            <span className="uppercase tracking-widest text-[10px] font-black block transform skew-x-12">
              ¿Quién encaja mejor?
            </span>
          </div>
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1 text-slate-400 hover:text-[#FF10F0] transition font-mono uppercase text-xs"
          >
            <Flag size={12} />
            <span>Reportar</span>
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white text-center tracking-tight uppercase">
          "{question}"
        </h2>

        {/* Timer Bar */}
        <div className="mt-4 pt-3 border-t-2 border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase">
            <Users size={14} className="text-[#39FF14]" />
            <span>Votos: <b className="text-[#39FF14]">{votedCount}</b> / {totalCount}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-black ${
            state.timer <= 3
              ? 'bg-[#FF10F0] text-black animate-pulse shadow-[2px_2px_0px_0px_#000000]'
              : 'bg-[#1A1A1A] border border-[#333] text-[#FFE600]'
          }`}>
            <Clock size={14} />
            <span>{state.timer}s</span>
          </div>
        </div>
      </div>

      {/* Voting Target Grid */}
      <div className="flex flex-col gap-3">
        <div className="text-center">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#39FF14]">
            {hasVoted ? '✓ Tu voto secreto ha sido guardado' : 'Selecciona a un jugador:'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {state.players.map((player) => {
            const isSelected = selectedTargetId === player.id;
            const isSelf = player.id === currentPlayerId;

            return (
              <button
                key={player.id}
                type="button"
                disabled={hasVoted}
                onClick={() => handleVote(player)}
                className={`p-4 border-2 flex flex-col items-center gap-2 text-center transition-all ${
                  isSelected
                    ? 'bg-[#111] border-[#39FF14] shadow-[4px_4px_0px_0px_#39FF14] scale-102'
                    : hasVoted
                    ? 'bg-[#0D0D0D] border-[#222] opacity-50 cursor-not-allowed'
                    : 'bg-[#111] border-[#333] hover:border-[#FF10F0] hover:bg-[#181818] active:scale-95 shadow-[3px_3px_0px_0px_#000000]'
                }`}
              >
                <AvatarBadge
                  iconName={player.avatarIcon}
                  color={player.avatarColor}
                  size="lg"
                  showCrown={player.isHost}
                />
                <div className="min-w-0 w-full">
                  <span className="font-black text-white text-sm block truncate uppercase">
                    {player.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {isSelf ? '(Tú mismo)' : 'Candidato'}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-black text-black bg-[#39FF14] px-2 py-0.5 uppercase tracking-wider shadow-[1px_1px_0px_0px_#000000]">
                    <Check size={12} strokeWidth={3} />
                    <span>Tu voto</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
