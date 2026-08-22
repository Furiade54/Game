import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Share2, Tv } from 'lucide-react';

interface ShareModalProps {
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ roomCode, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?room=${roomCode}`
    : `https://quien-de-aqui.app?room=${roomCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '¡Únete a ¿Quién de aquí…?!',
        text: `Entra a la partida con el código ${roomCode}`,
        url: joinUrl
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-black border-4 border-[#39FF14] p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_#FF10F0] relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-[#222] transition"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="inline-flex p-3 bg-[#39FF14] text-black mb-3 shadow-[2px_2px_0px_0px_#000000]">
          <Share2 size={28} />
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight uppercase">Invitar a la Sala</h3>
        <p className="text-slate-400 text-xs mt-1 font-medium">Escanea el código QR desde tu móvil para entrar al instante</p>

        {/* QR Code Container */}
        <div className="my-5 p-4 bg-white border-4 border-black inline-block shadow-[4px_4px_0px_0px_#000000]">
          <QRCodeSVG value={joinUrl} size={180} level="M" />
        </div>

        <div className="bg-[#111] border-2 border-[#333] p-3 mb-4 shadow-[2px_2px_0px_0px_#000000]">
          <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold mb-1">Código de Sala</p>
          <div className="text-3xl font-black tracking-widest text-[#FFE600] font-mono">{roomCode}</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 px-4 bg-[#111] hover:bg-[#222] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#333] transition active:scale-95 shadow-[2px_2px_0px_0px_#000000]"
          >
            {copied ? <Check size={18} className="text-[#39FF14]" /> : <Copy size={18} />}
            <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="py-3 px-4 bg-[#FF10F0] hover:bg-[#e00dd4] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#000000] transition active:scale-95"
          >
            <Share2 size={18} />
            <span>Compartir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
