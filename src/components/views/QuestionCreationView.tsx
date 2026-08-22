import React, { useState } from 'react';
import { Sparkles, Send, CheckCircle2, Lightbulb, Clock } from 'lucide-react';
import { ClientRoomState } from '../../types';
import { soundFx } from '../../utils/audio';

const INSPIRATION_IDEAS = [
  "¿Quién sería peor compañero de piso?",
  "¿Quién volvería con su ex en un momento de debilidad?",
  "¿Quién desaparecería durante 3 días de fiesta sin avisar?",
  "¿Quién traicionaría al grupo por un millón de euros?",
  "¿Quién fingiría una urgencia para escapar de una cita mala?",
  "¿Quién se gastaría el sueldo del mes en tonterías el primer día?",
  "¿Quién moriría primero en un apocalipsis zombi?",
  "¿Quién terminaría en la cárcel por una confusión absurda?",
  "¿Quién tiene más secretos inconfesables en el teléfono?"
];

interface QuestionCreationViewProps {
  state: ClientRoomState;
  currentPlayerId: string;
  onSubmitQuestion: (text: string) => void;
}

export const QuestionCreationView: React.FC<QuestionCreationViewProps> = ({
  state,
  currentPlayerId,
  onSubmitQuestion
}) => {
  const [questionText, setQuestionText] = useState('');
  const me = state.players.find(p => p.id === currentPlayerId);
  const hasSubmitted = me?.hasSubmittedQuestion;

  const totalSubmitted = state.players.filter(p => p.hasSubmittedQuestion).length;
  const totalPlayers = state.players.length;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (questionText.trim().length >= 5) {
      soundFx.playVoteLock();
      onSubmitQuestion(questionText.trim());
    }
  };

  const handlePickIdea = (idea: string) => {
    setQuestionText(idea);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 animate-in fade-in">
      {/* Header & Timer */}
      <div className="bg-black border-4 border-[#333] p-6 shadow-[8px_8px_0px_0px_rgba(255,16,240,0.3)] text-center relative overflow-hidden">
        <div className="bg-[#FF10F0] text-black px-3 py-0.5 inline-block transform -skew-x-12 mb-2 shadow-[2px_2px_0px_0px_#000000]">
          <div className="flex items-center gap-1.5 transform skew-x-12 text-[10px] uppercase font-black tracking-widest">
            <Clock size={12} />
            <span>Fase 1: Creación Secreta ({state.timer}s)</span>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          Escribe tu pregunta
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto font-medium">
          Crea una pregunta sobre los participantes. Se guardará de forma 100% anónima.
        </p>

        {/* Progress Bar */}
        <div className="mt-5 max-w-xs mx-auto">
          <div className="flex justify-between text-xs font-mono font-bold text-slate-400 mb-1.5 uppercase">
            <span>Listos</span>
            <span className="text-[#39FF14]">{totalSubmitted} / {totalPlayers}</span>
          </div>
          <div className="w-full h-2.5 bg-[#1A1A1A] border border-[#333] overflow-hidden">
            <div
              className="h-full bg-[#39FF14] transition-all duration-300"
              style={{ width: `${(totalSubmitted / Math.max(1, totalPlayers)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Input or Submitted Status */}
      {hasSubmitted ? (
        <div className="bg-black border-4 border-[#39FF14] p-8 text-center shadow-[8px_8px_0px_0px_#39FF14] flex flex-col items-center gap-4 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-[#39FF14] text-black flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
            <CheckCircle2 size={36} strokeWidth={3} />
          </div>

          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">
              ¡Pregunta enviada!
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm font-medium">
              Tu pregunta está guardada de forma anónima en el pool. Esperando a los demás...
            </p>
          </div>

          <div className="text-xs text-[#39FF14] font-mono bg-[#111] border border-[#333] px-4 py-2 uppercase">
            "{questionText || 'Tu pregunta se mantiene en secreto'}"
          </div>
        </div>
      ) : (
        <div className="bg-black border-4 border-[#333] p-6 shadow-[8px_8px_0px_0px_rgba(57,255,20,0.2)] flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <div className="bg-[#FFE600] text-black px-2 py-0.5 inline-block transform -skew-x-12 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest block transform skew-x-12">
                  ¿Quién de aquí...?
                </span>
              </div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="...sería capaz de hacer qué cosa comprometedora o graciosa?"
                rows={3}
                className="w-full bg-[#111] border-2 border-[#333] focus:border-[#FF10F0] p-4 text-white text-base font-bold placeholder:text-[#555] outline-none resize-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={questionText.trim().length < 5}
              className={`py-4 px-6 font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98 ${
                questionText.trim().length >= 5
                  ? 'bg-[#FF10F0] hover:bg-[#e00ed4] text-black shadow-[6px_6px_0px_0px_#39FF14]'
                  : 'bg-[#1A1A1A] text-slate-600 cursor-not-allowed border border-[#333]'
              }`}
            >
              <Send size={18} />
              <span>Enviar al Pool Anónimo</span>
            </button>
          </form>

          {/* Inspiration Chips */}
          <div className="mt-2 pt-4 border-t-2 border-[#222]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FFE600] mb-2.5 uppercase tracking-wider">
              <Lightbulb size={14} />
              <span>Ideas de inspiración:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {INSPIRATION_IDEAS.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePickIdea(idea)}
                  className="text-xs bg-[#111] hover:bg-[#222] hover:text-[#39FF14] text-slate-300 border border-[#333] hover:border-[#39FF14] px-3 py-1.5 text-left transition active:scale-95 font-medium"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
