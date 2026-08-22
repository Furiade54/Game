import React, { useState, useEffect } from 'react';
import {
  Play,
  Users,
  Tv,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Dice5,
  Flame
} from 'lucide-react';
import { AvatarBadge, COLOR_PALETTE, AVATAR_ICONS } from '../AvatarBadge';

interface HomeEntryViewProps {
  initialRoomCode?: string;
  onCreateRoom: (hostName: string, avatarColor: string, avatarIcon: string, isTV: boolean) => void;
  onJoinRoom: (roomCode: string, playerName: string, avatarColor: string, avatarIcon: string, isTV: boolean) => void;
}

const FUN_DEFAULT_NAMES = [
  'Carlos',
  'Sofía',
  'Lucas',
  'Elena',
  'Andrés',
  'Laura',
  'Pablo',
  'Camila',
  'Mateo',
  'Valeria'
];

export const HomeEntryView: React.FC<HomeEntryViewProps> = ({
  initialRoomCode = '',
  onCreateRoom,
  onJoinRoom
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState('smile');
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
      setTab('join');
    }
  }, [initialRoomCode]);

  const handleRandomizeName = () => {
    const random = FUN_DEFAULT_NAMES[Math.floor(Math.random() * FUN_DEFAULT_NAMES.length)];
    setName(random);
  };

  const handleRandomizeAvatar = () => {
    const iconKeys = Object.keys(AVATAR_ICONS);
    const randomIcon = iconKeys[Math.floor(Math.random() * iconKeys.length)];
    const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    setSelectedIcon(randomIcon);
    setSelectedColor(randomColor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Jugador';

    if (tab === 'create') {
      onCreateRoom(finalName, selectedColor, selectedIcon, isTV);
    } else {
      if (!roomCode.trim()) return;
      onJoinRoom(roomCode.trim().toUpperCase(), finalName, selectedColor, selectedIcon, isTV);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Brand Hero Header */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="bg-[#FF10F0] text-black p-3 mb-1 inline-block transform -skew-x-12 shadow-[4px_4px_0px_0px_#39FF14]">
          <Flame size={32} className="transform skew-x-12" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#39FF14] block mb-1">
            Party Game Sin Censura
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white uppercase">
            ¿Quién de aquí…?
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto font-medium">
            El party game donde descubres los trapos sucios del grupo y desvelas al autor de la pregunta.
          </p>
        </div>
      </div>

      {/* Main Mode Switch Tab */}
      <div className="bg-black border-2 sm:border-4 border-[#333] p-4 sm:p-8 shadow-[4px_4px_0px_0px_rgba(255,16,240,0.3)] sm:shadow-[10px_10px_0px_0px_rgba(255,16,240,0.3)] flex flex-col gap-5 sm:gap-6">
        <div className="flex bg-[#1A1A1A] p-1 border-2 border-[#333]">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-2.5 sm:py-3 font-black text-xs sm:text-sm uppercase tracking-wider transition-all ${
              tab === 'create'
                ? 'bg-[#FF10F0] text-black shadow-[2px_2px_0px_0px_#000000]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Crear Sala
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 py-2.5 sm:py-3 font-black text-xs sm:text-sm uppercase tracking-wider transition-all ${
              tab === 'join'
                ? 'bg-[#FF10F0] text-black shadow-[2px_2px_0px_0px_#000000]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unirse a Sala
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          {tab === 'join' && (
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-[#39FF14] block mb-1.5">
                Código de Sala
              </label>
              <input
                type="text"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="EJ: CASA"
                className="w-full bg-[#111] border-2 sm:border-4 border-[#333] focus:border-[#39FF14] p-3 sm:p-4 text-center font-mono text-3xl sm:text-4xl font-black tracking-widest text-[#39FF14] outline-none uppercase placeholder:text-[#444] shadow-[3px_3px_0px_0px_#000000]"
              />
            </div>
          )}

          {/* Name & Avatar customization */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-[#FF10F0]">
                Tu Nombre
              </label>
              <button
                type="button"
                onClick={handleRandomizeName}
                className="text-xs text-[#39FF14] hover:underline font-mono font-bold uppercase"
              >
                [Aleatorio]
              </button>
            </div>
            <input
              type="text"
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="¿Cómo te llamas?"
              className="w-full bg-[#111] border-2 border-[#333] focus:border-[#FF10F0] p-3 sm:p-3.5 text-white text-sm sm:text-base font-bold outline-none placeholder:text-[#555]"
            />
          </div>

          {/* Avatar Preview & Customizer */}
          <div className="bg-[#111] border-2 border-[#222] p-3 sm:p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                Avatar de Juego
              </span>
              <button
                type="button"
                onClick={handleRandomizeAvatar}
                className="text-xs text-[#FFE600] hover:underline flex items-center gap-1 font-mono font-bold uppercase"
              >
                <Dice5 size={14} />
                <span>Aleatorio</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="shrink-0 flex items-center justify-center">
                <AvatarBadge iconName={selectedIcon} color={selectedColor} size="lg" className="sm:scale-110" />
              </div>

              <div className="w-full flex-1 flex flex-col gap-2.5">
                {/* Color swatches */}
                <div className="grid grid-cols-6 gap-1.5 w-full">
                  {COLOR_PALETTE.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-7 rounded-none border-2 border-black transition-all flex items-center justify-center ${
                        selectedColor === c ? 'scale-110 ring-2 ring-white z-10' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>

                {/* Icon options */}
                <div className="grid grid-cols-5 gap-1.5 w-full">
                  {['smile', 'flame', 'cat', 'crown', 'zap'].map((iconKey) => {
                    const IconComp = AVATAR_ICONS[iconKey];
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setSelectedIcon(iconKey)}
                        className={`h-8 border-2 flex items-center justify-center transition ${
                          selectedIcon === iconKey
                            ? 'bg-[#FF10F0] border-black text-black shadow-[2px_2px_0px_0px_#000000]'
                            : 'bg-[#1A1A1A] border-[#333] text-slate-400 hover:text-white'
                        }`}
                      >
                        <IconComp size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* TV Screen Mode Option */}
          <label className="flex items-start sm:items-center gap-3 p-3 bg-[#111] border-2 border-[#333] hover:border-[#39FF14] cursor-pointer transition select-none">
            <input
              type="checkbox"
              checked={isTV}
              onChange={(e) => setIsTV(e.target.checked)}
              className="accent-[#39FF14] w-5 h-5 shrink-0 mt-0.5 sm:mt-0"
            />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Tv size={16} className="text-[#39FF14] shrink-0" />
              <span>Abrir como Pantalla de Smart TV / Proyector</span>
            </div>
          </label>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3.5 sm:py-4 px-4 sm:px-6 bg-[#39FF14] hover:bg-[#32e012] text-black font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#FF10F0] hover:shadow-[2px_2px_0px_0px_#FF10F0] active:translate-x-[2px] active:translate-y-[2px] transition"
          >
            <span>{tab === 'create' ? 'Crear Sala Ahora' : 'Entrar a la Sala'}</span>
            <ArrowRight size={18} className="shrink-0" />
          </button>
        </form>
      </div>

      {/* Rules / How it works card */}
      <div className="bg-black border-2 border-[#333] p-5 text-slate-400 text-xs">
        <h4 className="font-black text-[#FFE600] uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#FFE600]" />
          <span>Dinámica de Juego</span>
        </h4>
        <p className="leading-relaxed font-medium">
          1. Cada jugador escribe una pregunta anónima sobre el grupo.<br />
          2. Todos votan en secreto quién encaja mejor.<br />
          3. El más votado tiene 15s para defenderse ante la mesa.<br />
          4. El grupo intenta descubrir quién escribió la pregunta.
        </p>
      </div>
    </div>
  );
};
