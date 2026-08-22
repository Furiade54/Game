import React, { useState } from 'react';
import {
  Users,
  Play,
  Settings,
  Tv,
  Share2,
  Bot,
  UserPlus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sliders
} from 'lucide-react';
import { ClientRoomState, Player } from '../../types';
import { AvatarBadge, COLOR_PALETTE, AVATAR_ICONS } from '../AvatarBadge';
import { soundFx } from '../../utils/audio';

interface LobbyViewProps {
  state: ClientRoomState;
  currentPlayerId: string;
  isHost: boolean;
  isTVDisplay: boolean;
  onStartGame: () => void;
  onAddBots: (count: number) => void;
  onRemoveBots: () => void;
  onUpdateSettings: (settings: Partial<ClientRoomState['settings']>) => void;
  onOpenShare: () => void;
  onToggleTVMode: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  state,
  currentPlayerId,
  isHost,
  isTVDisplay,
  onStartGame,
  onAddBots,
  onRemoveBots,
  onUpdateSettings,
  onOpenShare,
  onToggleTVMode
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [muted, setMuted] = useState(soundFx.isMuted);

  const players = state.players;
  const readyCount = players.length;
  const minPlayers = 4;
  const canStart = readyCount >= minPlayers;
  const botCount = players.filter(p => p.isBot).length;

  const toggleMute = () => {
    soundFx.isMuted = !soundFx.isMuted;
    setMuted(soundFx.isMuted);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-300">
      {/* Top Banner / Room Header */}
      <div className="bg-black border-2 sm:border-4 border-[#333] p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(255,16,240,0.3)] sm:shadow-[10px_10px_0px_0px_rgba(255,16,240,0.3)] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="bg-[#FF10F0] text-black px-2.5 py-0.5 mb-1.5 inline-block transform -skew-x-12 shadow-[2px_2px_0px_0px_#000000]">
              <span className="text-[10px] uppercase font-black tracking-widest block transform skew-x-12">
                Código de Sala
              </span>
            </div>
            <div className="text-4xl sm:text-6xl font-black font-mono tracking-widest text-[#39FF14]">
              {state.code}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={toggleMute}
              className="p-2.5 sm:p-3 bg-[#1A1A1A] border-2 border-[#333] hover:border-[#39FF14] text-[#F2F2F2] transition active:scale-95 shadow-[2px_2px_0px_0px_#000000]"
              title={muted ? 'Activar Sonido' : 'Silenciar'}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-[#39FF14]" />}
            </button>

            <button
              onClick={onOpenShare}
              className="py-2.5 sm:py-3 px-3 sm:px-4 bg-[#1A1A1A] hover:bg-[#222] text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-2 border-[#333] hover:border-[#FF10F0] transition active:scale-95 shadow-[2px_2px_0px_0px_#000000]"
            >
              <Share2 size={16} className="text-[#FF10F0]" />
              <span className="inline">Compartir / QR</span>
            </button>

            <button
              onClick={onToggleTVMode}
              className={`p-2.5 sm:p-3 border-2 transition active:scale-95 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000000] ${
                isTVDisplay
                  ? 'bg-[#FFE600] text-black border-black font-bold'
                  : 'bg-[#1A1A1A] text-slate-300 border-[#333] hover:border-[#FFE600]'
              }`}
              title="Modo Pantalla TV / Proyector"
            >
              <Tv size={18} />
              <span className="text-xs font-black uppercase hidden md:inline">TV</span>
            </button>
          </div>
        </div>

        {/* Players count status */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t-2 border-[#222] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider">
            <Users size={16} className="text-[#39FF14]" />
            <span>Jugadores: <b className="text-[#39FF14] font-mono text-sm">{readyCount}</b> / 12</span>
            {!canStart && (
              <span className="text-[10px] bg-[#FF10F0]/10 text-[#FF10F0] border border-[#FF10F0]/40 px-2 py-0.5 font-bold uppercase tracking-wider">
                Mínimo {minPlayers}
              </span>
            )}
          </div>

          <div className="text-slate-400 text-xs font-mono uppercase tracking-widest">
            {state.settings.totalRounds} rondas
          </div>
        </div>
      </div>

      {/* Players List Grid */}
      <div className="bg-black border-2 sm:border-4 border-[#333] p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(57,255,20,0.2)] sm:shadow-[8px_8px_0px_0px_rgba(57,255,20,0.2)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>En la mesa</span>
            <span className="text-xs font-mono font-bold bg-[#1A1A1A] border border-[#444] text-[#39FF14] px-2 py-0.5">
              {players.length}
            </span>
          </h3>

          {isHost && (
            <div className="flex items-center gap-2">
              {botCount > 0 ? (
                <button
                  onClick={onRemoveBots}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold uppercase py-1 px-2.5 bg-rose-950/40 border border-rose-800 transition"
                >
                  <Trash2 size={13} />
                  <span>Quitar bots</span>
                </button>
              ) : (
                <button
                  onClick={() => onAddBots(4 - players.length > 0 ? 4 - players.length : 1)}
                  className="text-xs text-black font-black uppercase py-1 px-3 bg-[#FFE600] hover:bg-[#ebd300] border-2 border-black shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1 transition"
                >
                  <Bot size={14} />
                  <span>+ Bots Demo</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {players.map((p) => {
            const isMe = p.id === currentPlayerId;
            return (
              <div
                key={p.id}
                className={`p-3 flex items-center gap-3 border-2 transition-all ${
                  isMe
                    ? 'bg-[#1A1A1A] border-[#FF10F0] shadow-[3px_3px_0px_0px_#FF10F0]'
                    : 'bg-[#111] border-[#333]'
                }`}
              >
                <AvatarBadge
                  iconName={p.avatarIcon}
                  color={p.avatarColor}
                  size="md"
                  showCrown={p.isHost}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white text-sm truncate uppercase">{p.name}</span>
                    {p.isBot && (
                      <span className="text-[9px] bg-[#222] text-[#FFE600] border border-[#444] px-1 py-0.2 font-mono">
                        BOT
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {isMe ? '(TÚ)' : p.isHost ? 'ANFITRIÓN' : 'CONECTADO'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Empty slot placeholders */}
          {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, idx) => (
            <div
              key={`empty_${idx}`}
              className="p-3 border-2 border-dashed border-[#333] flex items-center gap-3 bg-[#0A0A0A] text-slate-600"
            >
              <div className="w-10 h-10 border-2 border-dashed border-[#333] flex items-center justify-center">
                <UserPlus size={18} />
              </div>
              <span className="text-xs font-mono font-bold uppercase text-slate-500">Esperando...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Host Settings & Controls */}
      {isHost ? (
        <div className="bg-black border-4 border-[#333] p-6 shadow-[8px_8px_0px_0px_rgba(255,16,240,0.3)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs font-black uppercase tracking-wider text-[#39FF14] hover:underline flex items-center gap-2 transition"
            >
              <Sliders size={16} />
              <span>Configuración de Partida [{showSettings ? 'OCULTAR' : 'AJUSTAR'}]</span>
            </button>
          </div>

          {showSettings && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t-2 border-[#222] animate-in fade-in">
              <div className="bg-[#111] p-4 border-2 border-[#333]">
                <label className="text-xs font-black uppercase tracking-widest text-slate-300 block mb-2">
                  Rondas: <b className="text-[#FF10F0] font-mono text-sm">{state.settings.totalRounds}</b>
                </label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="1"
                  value={state.settings.totalRounds}
                  onChange={(e) => onUpdateSettings({ totalRounds: parseInt(e.target.value) })}
                  className="w-full accent-[#FF10F0] h-2 bg-[#222] rounded-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 uppercase">
                  <span>3 Rápida</span>
                  <span>5 Normal</span>
                  <span>12 Épica</span>
                </div>
              </div>

              <div className="bg-[#111] p-4 border-2 border-[#333]">
                <label className="text-xs font-black uppercase tracking-widest text-slate-300 block mb-2">
                  Tiempo de Defensa: <b className="text-[#39FF14] font-mono text-sm">{state.settings.defenseTimeSec}s</b>
                </label>
                <div className="flex gap-2">
                  {[10, 15, 20].map((t) => (
                    <button
                      key={t}
                      onClick={() => onUpdateSettings({ defenseTimeSec: t })}
                      className={`flex-1 py-2 text-xs font-black border-2 transition ${
                        state.settings.defenseTimeSec === t
                          ? 'bg-[#39FF14] text-black border-black shadow-[2px_2px_0px_0px_#000000]'
                          : 'bg-[#1A1A1A] text-slate-400 border-[#333] hover:text-white'
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Big Start Button */}
          <button
            onClick={() => {
              soundFx.playSuccessPoints();
              onStartGame();
            }}
            className={`w-full py-4.5 px-6 font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all active:scale-98 ${
              canStart
                ? 'bg-[#39FF14] hover:bg-[#32e012] text-black shadow-[6px_6px_0px_0px_#FF10F0] hover:translate-x-[2px] hover:translate-y-[2px]'
                : 'bg-[#1A1A1A] hover:bg-[#222] text-[#FFE600] border-2 border-[#FFE600]'
            }`}
          >
            <Play size={22} fill="currentColor" />
            <span>
              {canStart
                ? '¡COMENZAR PARTIDA!'
                : `Comenzar Partida (Se añadirán ${minPlayers - readyCount} bots)`}
            </span>
          </button>
        </div>
      ) : (
        <div className="bg-black border-2 border-[#333] p-6 text-center text-slate-400 shadow-lg flex items-center justify-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#39FF14] animate-ping" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#39FF14]">
            Esperando a que el anfitrión inicie la partida...
          </span>
        </div>
      )}
    </div>
  );
};
