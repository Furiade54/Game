import React, { useEffect } from 'react';
import { Flag, Eye, Flame } from 'lucide-react';
import { ClientRoomState } from '../../types';
import { soundFx } from '../../utils/audio';

interface QuestionDisplayViewProps {
  state: ClientRoomState;
  onOpenReport: () => void;
}

export const QuestionDisplayView: React.FC<QuestionDisplayViewProps> = ({
  state,
  onOpenReport
}) => {
  useEffect(() => {
    soundFx.playDramaticReveal();
  }, []);

  const question = state.activeQuestion?.text || '¿Quién de aquí sería el más culpable?';

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
      {/* Top details bar */}
      <div className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider px-2">
        <div className="flex items-center gap-2 bg-[#111] border-2 border-[#333] px-3.5 py-1.5 shadow-[2px_2px_0px_0px_#000000]">
          <Flame size={14} className="text-[#FF10F0]" />
          <span className="font-mono text-[#F2F2F2]">Ronda {state.currentRound} / {state.totalRounds}</span>
        </div>

        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 text-slate-400 hover:text-[#FF10F0] bg-[#111] border-2 border-[#333] hover:border-[#FF10F0] px-3 py-1.5 transition font-mono uppercase text-xs"
        >
          <Flag size={13} />
          <span>Reportar</span>
        </button>
      </div>

      {/* Hero Question Card */}
      <div className="w-full bg-black border-2 sm:border-4 border-[#FF10F0] p-5 sm:p-12 text-center shadow-[4px_4px_0px_0px_#39FF14] sm:shadow-[12px_12px_0px_0px_#39FF14] relative overflow-hidden">
        <div className="bg-[#FF10F0] text-black px-3 sm:px-4 py-1 inline-block transform -skew-x-12 mb-4 sm:mb-6 shadow-[2px_2px_0px_0px_#000000]">
          <div className="flex items-center gap-1.5 sm:gap-2 transform skew-x-12 text-[10px] sm:text-xs font-black uppercase tracking-widest">
            <Eye size={14} />
            <span>Pregunta Anónima del Grupo</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-5xl font-black text-white leading-tight tracking-tight uppercase">
          "{question}"
        </h1>

        {/* Countdown to voting indicator */}
        <div className="mt-6 sm:mt-8 flex flex-col items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FFE600]">
            La votación comienza en:
          </span>
          <div className="text-3xl sm:text-4xl font-black font-mono text-[#39FF14] animate-pulse">
            {state.timer}s
          </div>
        </div>
      </div>
    </div>
  );
};
