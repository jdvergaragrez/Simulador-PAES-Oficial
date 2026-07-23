import React, { useState } from 'react';
import Card from './Card';
import { universidades, careerDisplayNames } from '../data';
import { CareerKey, Universidad } from '../types';
import { calculatePonderado } from '../utils';

interface CompatibilitySectionProps {
  nemScore: number;
  rankingScore: number;
  lectoraCorrect: number;
  m1Correct: number;
  m2Correct: number;
  cienciasCorrect: number;
  historiaCorrect: number;
  cienciasModule: 'biologia' | 'fisica' | 'quimica';
}

export default function CompatibilitySection({
  nemScore,
  rankingScore,
  lectoraCorrect,
  m1Correct,
  m2Correct,
  cienciasCorrect,
  historiaCorrect,
  cienciasModule,
}: CompatibilitySectionProps) {
  const [selectedCareer, setSelectedCareer] = useState<CareerKey>('civil');
  const currentUnis = universidades[selectedCareer] || [];

  return (
    <Card id="section-compatibilidad" className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
          COMPATIBILIDAD POR UNIVERSIDAD
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">Simulador General por Carrera</h3>
      </div>

      {/* Career horizontal filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5 md:-mx-6 md:px-6">
        {Object.entries(careerDisplayNames).map(([key, name]) => (
          <button
            key={key}
            onClick={() => setSelectedCareer(key as CareerKey)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 outline-none ${
              selectedCareer === key
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* List of cards */}
      <div className="space-y-3.5">
        {currentUnis.map((uni, idx) => {
          const ponderado = calculatePonderado(
            nemScore,
            rankingScore,
            lectoraCorrect,
            m1Correct,
            m2Correct,
            cienciasCorrect,
            historiaCorrect,
            cienciasModule,
            uni
          );

          const hasCorte = uni.corte !== null;
          const hasWeights = uni.weights !== null;
          const isCalculable = ponderado !== null && hasCorte;

          const gap = isCalculable ? ponderado! - uni.corte! : null;

          // Determine LEFT COLOR BAR color
          let barColorClass = 'bg-[#F59E0B]'; // muted amber default for nodata/broken
          if (isCalculable && gap !== null) {
            if (gap >= 0) {
              barColorClass = 'bg-[#059669]'; // green success
            } else if (gap >= -30) {
              barColorClass = 'bg-[#2563EB]'; // blue within 30 points
            } else {
              barColorClass = 'bg-[#94A3B8]'; // gray further below
            }
          }

          // Elective Text helper
          let electiveText = '';
          if (uni.electivaTipo === 'ciencias') {
            electiveText = '(Cs)';
          } else if (uni.electivaTipo === 'historia') {
            electiveText = '(Hist)';
          } else if (uni.electivaTipo === 'mejor') {
            electiveText = '(Cs o Hist, la mejor)';
          }

          // Tier badge styling
          let tierBadgeText = 'Verificada';
          let tierBadgeStyle = 'border-emerald-200 text-emerald-600 bg-emerald-50';
          if (uni.tier === 'medium' || uni.tier === 'partial') {
            tierBadgeText = 'Referencia';
            tierBadgeStyle = 'border-blue-200 text-blue-600 bg-blue-50';
          } else if (uni.tier === 'broken') {
            tierBadgeText = 'Incompleta';
            tierBadgeStyle = 'border-amber-200 text-amber-600 bg-amber-50';
          } else if (uni.tier === 'nodata') {
            tierBadgeText = 'No disp.';
            tierBadgeStyle = 'border-slate-200 text-slate-400 bg-slate-50';
          }

          return (
            <div
              key={`${uni.nombre}-${idx}`}
              className={`relative overflow-hidden bg-white border border-[#F1F5F9] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:shadow-md ${
                !hasWeights ? 'opacity-70 bg-[#FBFBFB]' : ''
              }`}
            >
              {/* LEFT COLOR BAR */}
              <div className={`absolute top-0 left-0 w-1.5 h-full rounded-r ${barColorClass}`} />

              {/* Left Column: Info */}
              <div className="pl-3 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#0F172A] text-[15px]">{uni.nombre}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${tierBadgeStyle}`}>
                    {tierBadgeText}
                  </span>
                  {electiveText && (
                    <span className="text-[10px] font-medium text-[#94A3B8] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">
                      {electiveText}
                    </span>
                  )}
                </div>

                {uni.nota && (
                  <p className="text-xs text-[#94A3B8] font-normal italic leading-normal">
                    {uni.nota}
                  </p>
                )}
              </div>

              {/* Right Column: Score and Gap */}
              <div className="pl-3 md:pl-0 text-left md:text-right flex flex-col justify-center">
                {isCalculable && ponderado !== null ? (
                  <>
                    <div className="text-2xl font-extrabold text-[#0F172A] font-mono tabular-nums">
                      {ponderado.toFixed(2)} <span className="text-xs font-semibold text-[#94A3B8]">pts</span>
                    </div>
                    <div className="text-xs text-[#64748B] flex items-center md:justify-end gap-1.5 mt-0.5">
                      <span>Corte: {uni.corte?.toFixed(2)}</span>
                      <span className="text-[#CBD5E1]">·</span>
                      <span
                        className={`font-semibold ${
                          gap !== null && gap >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                        }`}
                      >
                        gap: {gap !== null && gap >= 0 ? '+' : ''}
                        {gap?.toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-0.5">
                    <div className="text-lg font-bold text-[#94A3B8] font-mono">—</div>
                    <div className="text-[11px] text-[#94A3B8] uppercase tracking-wider">
                      {!hasWeights ? 'Sin ponderación' : 'Sin corte'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
