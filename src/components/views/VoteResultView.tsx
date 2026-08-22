import React, { useEffect } from 'react';
import { Trophy, Award, Flame, Users } from 'lucide-react';
import { ClientRoomState } from '../../types';
import { AvatarBadge } from '../AvatarBadge';
import { soundFx } from '../../utils/audio';

interface VoteResultViewProps {
  state: ClientRoomState;
  currentPlayerId: string;
}

export const VoteResultView: React.FC<VoteResultViewProps> = ({
  state,
  currentPlayerId
}) => {
  const result = state.voteResult;
  const question = state.activeQuestion?.text || '';

  const protagonist = state.players.find(p => p.id === result?.mostVotedPlayerId);
  const isMeProtagonist = protagonist?.id === currentPlayerId;
  const didIVoteForProtagonist = result?.correctVoterIds.includes(currentPlayerId);

  useEffect(() => {
    soundFx.playDramaticReveal();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
      {/* Top Question Context */}
      <div className="text-center text-xs uppercase tracking-widest font-black text-slate-300 bg-[#111] border-2 border-[#333] px-4 py-2 shadow-[3px_3px_0px_0px_#000000]">
        "{question}"
      </div>

      {/* Main Protagonist Card */}
      <div className="w-full bg-black border-2 sm:border-4 border-[#333] p-5 sm:p-8 text-center shadow-[4px_4px_0px_0px_#FFE600] sm:shadow-[10px_10px_0px_0px_#FFE600] relative overflow-hidden">
        <div className="bg-[#FFE600] text-black px-3 py-1 inline-block transform -skew-x-12 mb-4 shadow-[2px_2px_0px_0px_#000000]">
          <div className="flex items-center gap-1.5 transform skew-x-12 text-[10px] font-black uppercase tracking-widest">
            <Flame size={14} />
            <span>El más votado por el grupo</span>
          </div>
        </div>

        {protagonist && (
          <div className="flex flex-col items-center gap-4 my-2">
            <AvatarBadge
              iconName={protagonist.avatarIcon}
              color={protagonist.avatarColor}
              size="xl"
              showCrown={protagonist.isHost}
              className="shadow-[4px_4px_0px_0px_#000000] sm:scale-105"
            />

            <div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
                {protagonist.name}
              </h2>
              {isMeProtagonist && (
                <span className="inline-block mt-2 text-xs bg-[#FF10F0] text-black px-3 py-1 font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000000]">
                  ¡Eres tú! Prepárate para defenderte
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 sm:gap-4 mt-2">
              <div className="bg-[#111] border-2 border-[#333] px-3.5 sm:px-5 py-2 sm:py-2.5 text-center shadow-[2px_2px_0px_0px_#000000]">
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#FFE600]">
                  {result?.mostVotedPercentage}%
                </span>
                <span className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  De los votos
                </span>
              </div>

              <div className="bg-[#111] border-2 border-[#333] px-3.5 sm:px-5 py-2 sm:py-2.5 text-center shadow-[2px_2px_0px_0px_#000000]">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {result?.voteCounts[protagonist.id] || 0} / {result?.totalVotes || 0}
                </span>
                <span className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Votos totales
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Voter reward */}
        {didIVoteForProtagonist && !isMeProtagonist && (
          <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 bg-[#39FF14] text-black px-3.5 sm:px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000000]">
            <Award size={16} />
            <span>+50 pts por acertar al más votado</span>
          </div>
        )}
      </div>

      {/* Vote Breakdown Bars */}
      <div className="w-full bg-black border-2 sm:border-4 border-[#333] p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(255,16,240,0.2)] sm:shadow-[8px_8px_0px_0px_rgba(255,16,240,0.2)]">
        <h3 className="text-xs uppercase tracking-widest font-black text-[#FF10F0] mb-4 flex items-center gap-2">
          <Users size={14} />
          <span>Distribución de votos</span>
        </h3>

        <div className="flex flex-col gap-3">
          {state.players.map(player => {
            const count = result?.voteCounts[player.id] || 0;
            const total = result?.totalVotes || 1;
            const pct = Math.round((count / total) * 100);

            return (
              <div key={player.id} className="flex items-center gap-3">
                <AvatarBadge iconName={player.avatarIcon} color={player.avatarColor} size="sm" />
                <span className="text-sm font-black text-white w-24 truncate uppercase">{player.name}</span>
                <div className="flex-1 h-3.5 bg-[#111] border border-[#333] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      player.id === result?.mostVotedPlayerId
                        ? 'bg-[#FFE600]'
                        : 'bg-[#FF10F0]/60'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-300 w-16 text-right">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
