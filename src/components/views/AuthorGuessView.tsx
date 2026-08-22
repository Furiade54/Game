import React, { useState, useEffect } from 'react';
import { Search, Clock, Check, HelpCircle } from 'lucide-react';
import { ClientRoomState, Player } from '../../types';
import { AvatarBadge } from '../AvatarBadge';
import { soundFx } from '../../utils/audio';

interface AuthorGuessViewProps {
  state: ClientRoomState;
  currentPlayerId: string;
  onGuessAuthor: (suspectedPlayerId: string) => void;
}

export const AuthorGuessView: React.FC<AuthorGuessViewProps> = ({
  state,
  currentPlayerId,
  onGuessAuthor
}) => {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const me = state.players.find(p => p.id === currentPlayerId);
  const hasGuessed = me?.hasGuessedAuthor || selectedSuspectId !== null;

  const question = state.activeQuestion?.text || '';
  const guessedCount = state.players.filter(p => p.hasGuessedAuthor).length;
  const totalCount = state.players.length;

  useEffect(() => {
    if (state.timer <= 3 && state.timer > 0) {
      soundFx.playTick();
    }
  }, [state.timer]);

  const handleSelectSuspect = (player: Player) => {
    if (hasGuessed) return;
    setSelectedSuspectId(player.id);
    soundFx.playVoteLock();
    onGuessAuthor(player.id);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in">
      {/* Question Reminder & Timer */}
      <div className="bg-black border-4 border-[#333] p-6 shadow-[8px_8px_0px_0px_#FFE600] relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <div className="bg-[#FFE600] text-black px-2.5 py-0.5 inline-block transform -skew-x-12">
            <span className="uppercase tracking-widest text-[10px] font-black flex items-center gap-1 transform skew-x-12">
              <Search size={12} />
              <span>Investigación de Autor</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] border border-[#333] text-[#FFE600] text-xs font-mono font-bold">
            <Clock size={13} />
            <span>{state.timer}s</span>
          </div>
        </div>

        <div className="text-center my-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            ¿Quién escribió esta pregunta?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1 max-w-md mx-auto">
            "{question}"
          </p>
        </div>

        <div className="mt-4 pt-3 border-t-2 border-[#222] flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase">
          <span>Sospechas enviadas</span>
          <span className="text-[#39FF14]">{guessedCount} / {totalCount}</span>
        </div>
      </div>

      {/* Suspects Selection Grid */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFE600] text-center">
          {hasGuessed ? '✓ Sospechoso seleccionado. Esperando a la mesa...' : 'Elige a quién crees que formuló la pregunta:'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {state.players.map(player => {
            const isSelected = selectedSuspectId === player.id;
            const isSelf = player.id === currentPlayerId;

            return (
              <button
                key={player.id}
                type="button"
                disabled={hasGuessed}
                onClick={() => handleSelectSuspect(player)}
                className={`p-4 border-2 flex flex-col items-center gap-2 text-center transition-all ${
                  isSelected
                    ? 'bg-[#111] border-[#FFE600] shadow-[4px_4px_0px_0px_#FFE600] scale-102'
                    : hasGuessed
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
                    {isSelf ? '(¿Fuiste tú?)' : 'Sospechoso'}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-black text-black bg-[#FFE600] px-2 py-0.5 uppercase tracking-wider shadow-[1px_1px_0px_0px_#000000]">
                    <Check size={12} strokeWidth={3} />
                    <span>Sospecha</span>
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
