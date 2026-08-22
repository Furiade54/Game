import React from 'react';
import { AlertTriangle, Flag, X, ShieldAlert } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReport: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onConfirmReport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-black border-4 border-[#FF10F0] p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_#FFE600] relative text-center">
        <div className="inline-flex p-3 bg-[#FF10F0] text-black mb-3 shadow-[2px_2px_0px_0px_#000000]">
          <ShieldAlert size={32} />
        </div>

        <h3 className="text-xl font-black text-white uppercase tracking-tight">¿Reportar esta pregunta?</h3>
        <p className="text-slate-300 text-xs mt-2 leading-relaxed font-medium">
          Si la pregunta contiene acoso, discriminación o datos personales sensibles, será retirada inmediatamente del juego sin exponer al autor.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => {
              onConfirmReport();
              onClose();
            }}
            className="w-full py-3.5 px-4 bg-[#FF10F0] hover:bg-[#e00dd4] text-black font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000000] transition active:scale-95"
          >
            <Flag size={18} />
            <span>Retirar Pregunta</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-[#111] border-2 border-[#333] hover:bg-[#222] text-slate-300 font-bold uppercase tracking-wider transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
