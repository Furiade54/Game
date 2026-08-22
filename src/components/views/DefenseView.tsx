import React, { useEffect } from 'react';
import { Mic, FastForward, MessageSquare, AlertCircle } from 'lucide-react';
import { ClientRoomState } from '../../types';
import { AvatarBadge } from '../AvatarBadge';
import { soundFx } from '../../utils/audio';

interface DefenseViewProps {
  state: ClientRoomState;
  currentPlayerId: string;
  isHost: boolean;
  onNextPhase: () => void;
}

export const DefenseView: React.FC<DefenseViewProps> = ({
  state,
  currentPlayerId,
  isHost,
  onNextPhase
}) => {
  const result = state.voteResult;
  const protagonist = state.players.find(p => p.id === result?.mostVotedPlayerId);
  const isMe = protagonist?.id === currentPlayerId;

  useEffect(() => {
    soundFx.playDefenseAlarm();
  }, []);

  useEffect(() => {
    if (state.timer <= 5 && state.timer > 0) {
      soundFx.playTick();
    }
  }, [state.timer]);

  const percentage = result?.mostVotedPercentage || 67;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200 text-center">
      {/* Top Banner */}
      <div className="bg-[#FF10F0] text-black px-4 py-1 inline-block transform -skew-x-12 shadow-[3px_3px_0px_0px_#39FF14]">
        <div className="flex items-center gap-2 transform skew-x-12 text-xs font-black uppercase tracking-widest">
          <Mic size={14} />
          <span>Fase de Defensa ({state.settings.defenseTimeSec} Segundos)</span>
        </div>
      </div>

      {/* Main Defense Card */}
      <div className="w-full bg-black border-2 sm:border-4 border-[#FF10F0] p-5 sm:p-12 shadow-[4px_4px_0px_0px_#39FF14] sm:shadow-[12px_12px_0px_0px_#39FF14] relative overflow-hidden flex flex-col items-center gap-5 sm:gap-6">
        {protagonist && (
          <AvatarBadge
            iconName={protagonist.avatarIcon}
            color={protagonist.avatarColor}
            size="xl"
            showCrown={protagonist.isHost}
            className="sm:scale-125 shadow-[4px_4px_0px_0px_#000000]"
          />
        )}

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight uppercase">
            {protagonist?.name || 'JUGADOR'}
          </h1>
          <p className="text-lg sm:text-2xl font-black text-[#39FF14] tracking-wide uppercase font-mono">
            {percentage}% DE LA MESA TE VOTÓ
          </p>
          <div className="text-2xl sm:text-5xl font-black text-[#FFE600] tracking-widest mt-1 sm:mt-2 uppercase">
            ¡EXPLÍCATE!
          </div>
        </div>

        {/* Big Timer */}
        <div className="w-24 h-24 border-4 border-[#39FF14] bg-[#111] flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_#000000] my-2">
          <span className="text-4xl sm:text-5xl font-black text-white font-mono">
            {state.timer}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-[#39FF14]">
            Segundos
          </span>
        </div>

        <p className="text-slate-400 text-xs sm:text-sm max-w-md font-medium">
          {isMe
            ? '¡Tienes unos segundos para dar tu mejor excusa o confesar ante el grupo!'
            : `Escucha a ${protagonist?.name || 'él'} defenderse antes de sospechar quién formuló la pregunta.`}
        </p>

        {isHost && (
          <button
            onClick={onNextPhase}
            className="mt-2 text-xs font-black uppercase text-black bg-[#FFE600] hover:bg-[#ebd300] flex items-center gap-1.5 px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition"
          >
            <FastForward size={14} />
            <span>Saltar al autor</span>
          </button>
        )}
      </div>
    </div>
  );
};
