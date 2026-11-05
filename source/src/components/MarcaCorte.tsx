import React from 'react';

// Marca de corte: el detalle propio del simulador. El corte siempre queda en
// la misma posición (60 % del ancho) y la barra muestra dónde cae tu ponderado
// respecto de él, en una ventana de 150 pts bajo el corte y 100 pts sobre él.
const BAJO = 150;
const SOBRE = 100;
const POS_CORTE = BAJO / (BAJO + SOBRE);

interface MarcaCorteProps {
  ponderado: number;
  corte: number;
  color: string;
  anio: number;
  className?: string;
}

function MarcaCorte({ ponderado, corte, color, anio, className = '' }: MarcaCorteProps) {
  const k = Math.max(0, Math.min(1, (ponderado - (corte - BAJO)) / (BAJO + SOBRE)));
  return (
    <div className={`pt-5 ${className}`} role="img" aria-label={`Tu ponderado frente al corte ${anio}`}>
      <div className="relative h-1.5">
        <div className="absolute inset-0 rounded-full bg-[#EBEEF2] overflow-hidden">
          <div
            className="h-full w-full origin-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `scaleX(${k})`, background: color }}
          />
        </div>
        <div
          className="absolute -top-1 h-3.5 w-0.5 -ml-px rounded-full bg-current text-[#0F172A]"
          style={{ left: `${POS_CORTE * 100}%` }}
        />
        <div
          className="absolute -top-5 -translate-x-1/2 text-[11px] font-mono leading-none text-[#64748B] whitespace-nowrap"
          style={{ left: `${POS_CORTE * 100}%` }}
        >
          corte {anio}
        </div>
      </div>
    </div>
  );
}

export default React.memo(MarcaCorte);
