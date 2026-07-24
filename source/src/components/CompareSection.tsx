import React, { useMemo } from 'react';
import Card from './Card';
import { displayNombreUniversidad } from '../data';
import { calculatePonderado } from '../utils';
import { CarreraConDetalle, CarrerasPorCategoria } from '../types';
import SearchableSelect from './SearchableSelect';

interface CompareSectionProps {
  porCategoria: CarrerasPorCategoria;
  categoriaDisplay: Record<string, string>;
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
  onOpenDetail: (carrera: CarreraConDetalle) => void;
}

function CompareSection({
  porCategoria,
  categoriaDisplay,
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
  onOpenDetail,
}: CompareSectionProps) {
  // Options for the searchable pickers (carrera · universidad)
  const opciones = useMemo(() => {
    const out: { value: string; label: string; sublabel: string }[] = [];
    Object.entries(porCategoria).forEach(([careerKey, list]) => {
      list.forEach((uni, idx) => {
        if (!uni.ponderacion) return;
        out.push({
          value: `${careerKey}:${idx}`,
          label: categoriaDisplay[careerKey] || uni.nombre || careerKey,
          sublabel: displayNombreUniversidad(uni),
        });
      });
    });
    return out.sort((a, b) => (a.label + a.sublabel).localeCompare(b.label + b.sublabel, 'es'));
  }, [porCategoria, categoriaDisplay]);

  const resolve = (comboVal: string): CarreraConDetalle | null => {
    if (!comboVal) return null;
    const [careerKey, idxStr] = comboVal.split(':');
    return porCategoria[careerKey]?.[parseInt(idxStr, 10)] || null;
  };

  const ponderadoDe = (uni: CarreraConDetalle) =>
    calculatePonderado(nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, uni);

  return (
    <Card id="section-comparar" className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">MODO VERSUS</div>
        <h3 className="text-lg font-bold text-[#0F172A]">⚔️ Comparativa Lado a Lado</h3>
        <p className="text-xs text-[#64748B] mt-1">
          Elige hasta 3 combinaciones de carrera y universidad para compararlas al mismo tiempo.
        </p>
      </div>

      {/* Searchable pickers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((slotIndex) => (
          <div key={slotIndex}>
            <SearchableSelect
              options={opciones}
              value={compareSlots[slotIndex] || ''}
              onChange={(v) => onChangeCompareSlot(slotIndex, v)}
              placeholder={`Slot ${slotIndex + 1}...`}
            />
          </div>
        ))}
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((slotIndex) => {
          const uni = resolve(compareSlots[slotIndex]);
          if (!uni) {
            return (
              <div
                key={slotIndex}
                className="border border-dashed border-[#E2E8F0] rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[140px] text-xs text-[#94A3B8]"
              >
                <span>Slot {slotIndex + 1} vacío</span>
                <span className="text-[10px] mt-1">Búscalo arriba</span>
              </div>
            );
          }

          const ponderado = ponderadoDe(uni);
          const referencia = uni.puntajeCorte ?? uni.promedioMinimo ?? null;
          const gap = ponderado !== null && referencia !== null ? ponderado - referencia : null;
          const isPositive = gap !== null && gap >= 0;

          return (
            <div
              key={slotIndex}
              onClick={() => onOpenDetail(uni)}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-sm relative cursor-pointer hover:shadow-md hover:border-[#CBD5E1] transition-all"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onChangeCompareSlot(slotIndex, ''); }}
                className="absolute top-3 right-3 text-xs text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                title="Quitar"
              >
                ✕
              </button>

              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#94A3B8] tracking-widest flex items-center gap-1.5 pr-4">
                  <span className="truncate">{categoriaDisplay[uni.categoria] || uni.nombre}</span>
                </div>
                <div className="text-sm font-bold text-[#0F172A] leading-snug pr-4">{displayNombreUniversidad(uni)}</div>
                {uni.region && <div className="text-[11px] text-[#94A3B8]">{uni.region} · Admisión {uni.anioAdmision}</div>}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-[#64748B]">Tu puntaje:</span>
                  <span className="text-xl font-extrabold text-[#3B82F6] font-mono">{ponderado !== null ? ponderado.toFixed(2) : '—'}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-[#64748B]">{uni.puntajeCorte !== null ? 'Últ. Corte:' : 'Mín. post.:'}</span>
                  <span className="text-xs font-semibold text-[#0F172A] font-mono">{referencia !== null ? referencia.toFixed(2) : '—'}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-[#64748B]">Diferencia:</span>
                  {gap !== null ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-[#DCFCE7] text-[#10B981]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
                      {isPositive ? '+' : ''}{gap.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-[#94A3B8]">—</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default React.memo(CompareSection);
