import React from 'react';
import Card from './Card';
import { universidades, careerDisplayNames } from '../data';
import { calculatePonderado } from '../utils';
import { CareerKey } from '../types';

interface CompareSectionProps {
  nemScore: number;
  rankingScore: number;
  lectoraCorrect: number;
  m1Correct: number;
  m2Correct: number;
  cienciasCorrect: number;
  historiaCorrect: number;
  cienciasModule: 'biologia' | 'fisica' | 'quimica';
  compareSlots: string[]; // ["career:idx", ...]
  onChangeCompareSlot: (slotIndex: number, value: string) => void;
}

export default function CompareSection({
  nemScore,
  rankingScore,
  lectoraCorrect,
  m1Correct,
  m2Correct,
  cienciasCorrect,
  historiaCorrect,
  cienciasModule,
  compareSlots,
  onChangeCompareSlot,
}: CompareSectionProps) {
  // Collect all combos where weights is defined
  const availableCombos: { value: string; label: string; uni: any; careerKey: CareerKey; uniIndex: number }[] = [];

  Object.entries(universidades).forEach(([careerKey, list]) => {
    list.forEach((uni, idx) => {
      if (uni.weights) {
        availableCombos.push({
          value: `${careerKey}:${idx}`,
          label: `${careerDisplayNames[careerKey]} · ${uni.nombre}`,
          uni,
          careerKey: careerKey as CareerKey,
          uniIndex: idx,
        });
      }
    });
  });

  return (
    <Card id="section-comparar" className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
          COMPARAR
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">Comparativa Lado a Lado</h3>
        <p className="text-xs text-[#64748B] mt-1">
          Selecciona hasta 3 combinaciones de carrera y universidad para analizarlas simultáneamente.
        </p>
      </div>

      {/* 3 Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((slotIndex) => {
          const selectedValue = compareSlots[slotIndex] || '';
          return (
            <div key={slotIndex} className="relative">
              <select
                value={selectedValue}
                onChange={(e) => onChangeCompareSlot(slotIndex, e.target.value)}
                className="w-full h-11 px-3 pr-8 bg-[#F5F7FA] text-xs font-semibold text-[#0F172A] rounded-xl appearance-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none cursor-pointer transition-all duration-200"
              >
                <option value="">-- Comparar slot {slotIndex + 1} --</option>
                {availableCombos.map((combo) => (
                  <option key={combo.value} value={combo.value}>
                    {combo.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#64748B]">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compare results grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {[0, 1, 2].map((slotIndex) => {
          const comboVal = compareSlots[slotIndex];
          if (!comboVal) {
            return (
              <div
                key={slotIndex}
                className="border border-dashed border-[#E2E8F0] rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[140px] text-xs text-[#94A3B8]"
              >
                <span>Slot {slotIndex + 1} vacío</span>
                <span className="text-[10px] mt-1">Selecciona una opción arriba</span>
              </div>
            );
          }

          const [careerKey, uniIndexStr] = comboVal.split(':');
          const uniIndex = parseInt(uniIndexStr, 10);
          const list = universidades[careerKey as CareerKey] || [];
          const uni = list[uniIndex];

          if (!uni) return null;

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
          const gap = (ponderado !== null && hasCorte) ? ponderado - uni.corte! : null;
          const isPositive = gap !== null && gap >= 0;

          return (
            <div
              key={slotIndex}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-sm relative"
            >
              <button
                onClick={() => onChangeCompareSlot(slotIndex, '')}
                className="absolute top-3 right-3 text-xs text-[#94A3B8] hover:text-[#DC2626] transition-colors"
                title="Quitar"
              >
                ✕
              </button>

              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#94A3B8] tracking-widest">
                  {careerDisplayNames[careerKey] || careerKey}
                </div>
                <div className="text-sm font-bold text-[#0F172A] leading-snug pr-4">
                  {uni.nombre}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-[#64748B]">Tu puntaje:</span>
                  <span className="text-xl font-extrabold text-[#2563EB] font-mono">
                    {ponderado !== null ? ponderado.toFixed(2) : '—'}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-[#64748B]">Últ. Corte:</span>
                  <span className="text-xs font-semibold text-[#0F172A] font-mono">
                    {hasCorte ? uni.corte?.toFixed(2) : '—'}
                  </span>
                </div>

                {gap !== null ? (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-[#64748B]">Diferencia:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isPositive ? 'bg-[#DCFCE7] text-[#059669]' : 'bg-[#FEE2E2] text-[#DC2626]'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {gap.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-[#64748B]">Diferencia:</span>
                    <span className="text-xs font-medium text-[#94A3B8]">Sin corte</span>
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
