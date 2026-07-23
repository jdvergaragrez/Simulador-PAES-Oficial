import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { Universidad } from '../types';
import { careerDisplayNames } from '../data';

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
  targetUni: Universidad | null;
  isEmpty: boolean;
}

export default function HeroCard({ score, targetCareer, targetUni, isEmpty }: HeroCardProps) {
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
  const hasCorte = targetUni.corte !== null;
  const gap = hasCorte ? finalScore - targetUni.corte! : 0;
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
    <Card className="relative overflow-hidden border-2 border-[#2563EB] bg-gradient-to-b from-white to-[#F8FAFC]">
      {/* Decorative subtle radial glow behind the score */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#2563EB]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center text-center space-y-4">
        {/* Label and Tier Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">
            TU PUNTAJE PONDERADO
          </span>
          <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full border ${tierBadgeStyle}`}>
            {tierBadgeText}
          </span>
        </div>

        {/* Huge Score Display */}
        <div className="flex items-baseline justify-center">
          <span className="text-7xl md:text-8xl font-extrabold tracking-tight text-[#0F172A] font-mono tabular-nums">
            {animatedScore.toFixed(2)}
          </span>
          <span className="text-lg font-semibold text-[#94A3B8] ml-1">/1000</span>
        </div>

        {/* Target metadata & gap indicator */}
        <div className="w-full pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <div className="text-xs font-bold text-[#94A3B8] uppercase">META DEFINIDA</div>
            <div className="text-sm font-semibold text-[#0F172A]">
              {careerDisplayNames[targetCareer] || targetCareer}
            </div>
            <div className="text-xs text-[#64748B]">{targetUni.nombre}</div>
          </div>

          <div>
            {hasCorte ? (
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  isPositive ? 'bg-[#DCFCE7] text-[#059669]' : 'bg-[#FEE2E2] text-[#DC2626]'
                }`}
              >
                {isPositive ? '+' : ''}
                {gap.toFixed(2)} vs corte
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B]">
                Sin corte publicado
              </div>
            )}
          </div>
        </div>

        {/* Cutoff footnote details */}
        {hasCorte && (
          <div className="w-full text-left bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 flex justify-between items-center text-xs">
            <span className="text-[#64748B]">
              Corte oficial: <strong className="font-semibold text-[#0F172A]">{targetUni.corte?.toFixed(2)} pts</strong>
            </span>
            {targetUni.corteNota && (
              <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                {targetUni.corteNota}
              </span>
            )}
          </div>
        )}

        {targetUni.nota && (
          <p className="text-left text-xs text-[#94A3B8] bg-slate-50 p-3 rounded-xl leading-relaxed w-full">
            💡 {targetUni.nota}
          </p>
        )}
      </div>
    </Card>
  );
}
