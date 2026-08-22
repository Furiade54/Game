import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Award, CheckCircle2, Ghost, ShieldAlert } from 'lucide-react';
import { ClientRoomState } from '../../types';
import { AvatarBadge } from '../AvatarBadge';
import { soundFx } from '../../utils/audio';

interface AuthorRevealViewProps {
  state: ClientRoomState;
  currentPlayerId: string;
}

export const AuthorRevealView: React.FC<AuthorRevealViewProps> = ({
  state,
  currentPlayerId
}) => {
  const authorData = state.authorReveal;
  const author = state.players.find(p => p.id === authorData?.authorId);
  const isMeAuthor = author?.id === currentPlayerId;
  const didIGuessAuthor = authorData?.correctGuesserIds.includes(currentPlayerId);

  useEffect(() => {
    soundFx.playDramaticReveal();
    // Fire festive celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const guessers = authorData?.guesserNames || [];
  const undiscovered = guessers.length === 0;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 animate-in zoom-in-90 duration-300 text-center">
      {/* Top Banner */}
      <div className="bg-[#FFE600] text-black px-4 py-1 inline-block transform -skew-x-12 shadow-[3px_3px_0px_0px_#000000]">
        <div className="flex items-center gap-2 transform skew-x-12 text-xs font-black uppercase tracking-widest">
          <Sparkles size={14} />
          <span>¡Misterio Resuelto!</span>
        </div>
      </div>

      {/* Main Author Spotlight Card */}
      <div className="w-full bg-black border-4 border-[#FF10F0] p-8 sm:p-10 shadow-[12px_12px_0px_0px_#39FF14] relative overflow-hidden flex flex-col items-center gap-4">
        <div className="text-xs uppercase tracking-widest font-black text-slate-400 font-mono">
          Esta pregunta fue escrita por...
        </div>

        {author ? (
          <AvatarBadge
            iconName={author.avatarIcon}
            color={author.avatarColor}
            size="2xl"
            showCrown={author.isHost}
            className="shadow-[6px_6px_0px_0px_#000000] scale-110 my-2"
          />
        ) : (
          <div className="w-24 h-24 border-4 border-[#333] bg-[#111] flex items-center justify-center text-4xl font-black text-white">
            ?
          </div>
        )}

        <div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase">
            {authorData?.authorName || 'Anónimo'}
          </h1>
          {isMeAuthor && (
            <span className="inline-block mt-2 text-xs bg-[#FF10F0] text-black px-3 py-1 font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000000]">
              ¡Fuiste tú! Explica al grupo por qué hiciste esa pregunta 😏
            </span>
          )}
        </div>

        {/* Sneaky / Detective achievements */}
        {undiscovered ? (
          <div className="bg-[#111] border-2 border-[#333] p-4 flex items-center gap-3 text-left max-w-md mt-2 shadow-[3px_3px_0px_0px_#000000]">
            <div className="p-2 bg-[#FF10F0] text-black">
              <Ghost size={24} />
            </div>
            <div>
              <span className="font-black text-white text-sm uppercase block">¡Mente Maestra!</span>
              <span className="text-xs text-slate-400 font-medium">
                Nadie en la mesa fue capaz de adivinar quién escribió la pregunta.
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full bg-[#111] border-2 border-[#333] p-4 mt-2">
            <span className="text-xs uppercase tracking-widest font-black text-[#39FF14] block mb-2 font-mono">
              Detectives que acertaron (+50 pts):
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {guessers.map((name, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-[#39FF14] text-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000000]"
                >
                  <CheckCircle2 size={13} />
                  <span>{name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Current user reward callout */}
        {didIGuessAuthor && !isMeAuthor && (
          <div className="inline-flex items-center gap-2 bg-[#39FF14] text-black px-4 py-2 text-xs font-black uppercase tracking-wider animate-pulse shadow-[3px_3px_0px_0px_#000000]">
            <Award size={16} />
            <span>¡+50 PUNTOS POR DESCUBRIR AL AUTOR!</span>
          </div>
        )}
      </div>
    </div>
  );
};
