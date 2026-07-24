import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { CarreraConDetalle } from '../types';
import { displayNombreUniversidad } from '../data';

// Custom hook to animate score change over 300ms
function useAnimatedNumber(target: number) {
  const [current, setCurrent] = useState(target);
  const previousRef = useRef(target);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 300; // ms
    const startVal = previousRef.current;
    const endVal = target;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const val = startVal + progress * (endVal - startVal);
      setCurrent(val);
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        previousRef.current = endVal;
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [target]);

  return current;
}

interface HeroCardProps {
  score: number | null;
  targetCareer: string;
  categoriaDisplay: Record<string, string>;
  targetUni: CarreraConDetalle | null;
  isEmpty: boolean;
}

function HeroCard({ score, targetCareer, categoriaDisplay, targetUni, isEmpty }: HeroCardProps) {
  const finalScore = score ?? 0;
  const animatedScore = useAnimatedNumber(finalScore);

  if (isEmpty || !targetUni) {
    return (
      <Card className="border-2 border-dashed border-[#E2E8F0] !bg-transparent text-center py-10 flex flex-col items-center justify-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-xl font-bold">
          ℹ️
        </div>
        <p className="text-sm font-medium text-[#64748B] max-w-sm">
          Ingresa tus datos arriba para ver tu puntaje ponderado estimado y la brecha con el último matriculado.
        </p>
      </Card>
    );
  }

  // Gap Calculation
  const hasCorte = targetUni.puntajeCorte !== null;
  const gap = hasCorte ? finalScore - targetUni.puntajeCorte! : 0;
  const isPositive = gap >= 0;

  // Tier Badge configurations
  let tierBadgeText = 'Verificada';
  let tierBadgeStyle = 'border-emerald-200 text-emerald-600 bg-emerald-50';
  if (targetUni.tier === 'medium' || targetUni.tier === 'partial') {
    tierBadgeText = 'Referencia';
    tierBadgeStyle = 'border-blue-200 text-blue-600 bg-blue-50';
  } else if (targetUni.tier === 'broken') {
    tierBadgeText = 'Incompleta';
    tierBadgeStyle = 'border-amber-200 text-amber-600 bg-amber-50';
  } else if (targetUni.tier === 'nodata') {
    tierBadgeText = 'No disponible';
    tierBadgeStyle = 'border-slate-200 text-slate-500 bg-slate-50';
  }

  return (
    <Card className="relative overflow-hidden border-2 border-[#3B82F6] bg-gradient-to-b from-white to-[#F8FAFC]">
      {/* Decorative subtle radial glow behind the score */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#3B82F6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center text-center space-y-4">
        {/* Label and Tier Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">
            TU PUNTAJE PONDERADO
          </span>
          <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full border ${tierBadgeStyle}`}>
            {tierBadgeText}
          </span>
          <span className="text-[10px] px-2 py-0.5 font-bold rounded-full border border-slate-200 text-slate-500 bg-slate-50">
            Admisión {targetUni.anioAdmision}
          </span>
        </div>

        {/* Huge Score Display */}
        <div className="flex items-baseline justify-center">
          <span className="text-7xl md:text-8xl font-extrabold tracking-tight text-[#0F172A] font-mono tabular-nums">
            {animatedScore.toFixed(2)}
          </span>
          <span className="text-lg font-semibold text-[#94A3B8] ml-1">/1000</span>
        </div>

        {/* Medidor visual vs corte / mínimo */}
        {(() => {
          const ref = targetUni.puntajeCorte ?? targetUni.promedioMinimo ?? null;
          if (ref === null) {
            return (
              <div className="w-full text-center text-xs font-semibold text-[#64748B] bg-[#F1F5F9] rounded-full py-1.5">
                Sin corte histórico
              </div>
            );
          }
          const g = finalScore - ref;
          const color = g >= 0 ? '#10B981' : g >= -30 ? '#3B82F6' : '#EF4444';
          const lo = Math.max(0, Math.min(ref, finalScore) - 120);
          const hi = Math.min(1000, Math.max(ref, finalScore) + 120);
          const pos = (v: number) => `${Math.max(2, Math.min(98, ((v - lo) / (hi - lo)) * 100))}%`;
          const estado = g >= 0 ? 'Sobre el corte' : g >= -30 ? 'Cerca del corte' : 'Bajo el corte';
          return (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}1A`, color }}>{estado}</span>
                <span className="font-mono font-bold" style={{ color }}>{g >= 0 ? '+' : ''}{g.toFixed(2)} pts</span>
              </div>
              <div className="relative w-full h-3 rounded-full bg-[#F1F5F9] mt-1">
                {/* fill hasta tu puntaje */}
                <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-500" style={{ width: pos(finalScore), background: color }} />
                {/* marcador del corte */}
                <div className="absolute top-[-3px] h-[18px] w-[2px] bg-[#0F172A]" style={{ left: pos(ref) }} />
              </div>
              <div className="flex justify-between text-[10px] text-[#94A3B8] font-medium">
                <span>Tú: <strong className="text-[#0F172A] font-mono">{finalScore.toFixed(0)}</strong></span>
                <span>{hasCorte ? 'Corte' : 'Mín.'}: <strong className="text-[#0F172A] font-mono">{ref.toFixed(0)}</strong></span>
              </div>
            </div>
          );
        })()}

        {/* Meta */}
        <div className="w-full pt-3 border-t border-slate-100 text-left">
          <div className="text-xs font-bold text-[#94A3B8] uppercase">🎯 Meta definida</div>
          <div className="text-sm font-semibold text-[#0F172A]">
            {categoriaDisplay[targetCareer] || targetUni.nombre || targetCareer}
          </div>
          <div className="text-xs text-[#64748B]">🏫 {displayNombreUniversidad(targetUni)}</div>
          {targetUni.corteNota && (
            <span className="inline-block mt-1.5 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded text-[11px]">{targetUni.corteNota}</span>
          )}
        </div>

        {targetUni.nota && (
          <p className="text-left text-xs text-[#94A3B8] bg-slate-50 p-3 rounded-xl leading-relaxed w-full">
            💡 {targetUni.nota}
          </p>
        )}
      </div>
    </Card>
  );
}

export default React.memo(HeroCard);
