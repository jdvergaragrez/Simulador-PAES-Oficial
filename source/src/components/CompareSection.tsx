import React, { useMemo } from 'react';
import { Columns3, X, Plus, MapPin, Check, TriangleAlert, CircleX, Minus, type LucideIcon } from 'lucide-react';
import Card from './Card';
import { displayNombreUniversidad } from '../data';
import { calculatePonderado, carreraPorIndice, PuntajesDirectos } from '../utils';
import { CarreraConDetalle, CarrerasPorCategoria } from '../types';
import { ESTADOS, EstadoCorte, PRUEBAS, estadoCorte } from '../constants';
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
  directos: PuntajesDirectos;
  compareSlots: string[]; // ["career:idx", ...]
  onChangeCompareSlot: (slotIndex: number, value: string) => void;
  onOpenDetail: (carrera: CarreraConDetalle) => void;
}

const fmt = (n: number, dec = 2) => n.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtMin = (n: number) => n.toLocaleString('es-CL', { maximumFractionDigits: 2 });

const ICONO_ESTADO: Record<EstadoCorte, LucideIcon> = {
  alcanzable: Check,
  limite: TriangleAlert,
  noalcanza: CircleX,
  sindato: Minus,
};

function pesosDe(uni: CarreraConDetalle) {
  const w = uni.ponderacion;
  if (!w) return [];
  const electiva =
    uni.electivaTipo === 'historia'
      ? { label: PRUEBAS.historia.short, pct: w.historiaPct, color: PRUEBAS.historia.color }
      : uni.electivaTipo === 'mejor'
        ? { label: 'Electiva', pct: Math.max(w.cienciasPct, w.historiaPct), color: PRUEBAS.ciencias.color }
        : { label: PRUEBAS.ciencias.short, pct: w.cienciasPct, color: PRUEBAS.ciencias.color };
  return [
    { label: 'NEM', pct: w.nemPct, color: '#94A3B8' },
    { label: 'Ranking', pct: w.rankingPct, color: '#64748B' },
    { label: PRUEBAS.lectora.short, pct: w.lecturaPct, color: PRUEBAS.lectora.color },
    { label: PRUEBAS.m1.short, pct: w.m1Pct, color: PRUEBAS.m1.color },
    { label: PRUEBAS.m2.short, pct: w.m2Pct, color: PRUEBAS.m2.color },
    electiva,
    { label: 'Especial', pct: w.pruebaEspecialPct ?? 0, color: '#CBD5E1' },
  ].filter((s) => s.pct > 0);
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
  directos,
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
    return carreraPorIndice(porCategoria, careerKey, parseInt(idxStr, 10));
  };

  const ponderadoDe = (uni: CarreraConDetalle) =>
    calculatePonderado(nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, uni, directos);

  return (
    <Card id="section-comparar" className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Columns3 size={18} className="text-[#64748B]" />
          <h3 className="text-base font-semibold text-[#0F172A]">Compara lado a lado</h3>
        </div>
        <p className="text-xs text-[#64748B] mt-1.5">
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
              placeholder={`Opción ${slotIndex + 1}...`}
            />
          </div>
        ))}
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((slotIndex) => {
          const uni = resolve(compareSlots[slotIndex]);
          if (!uni) {
            return (
              <div
                key={slotIndex}
                className="border border-dashed border-[#E7E5E1] rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 min-h-[140px] text-xs text-[#94A3B8]"
              >
                <Plus size={18} strokeWidth={1.8} />
                <span>Opción {slotIndex + 1} vacía</span>
                <span className="text-[11px]">Búscala arriba</span>
              </div>
            );
          }

          const ponderado = ponderadoDe(uni);
          const corte = uni.puntajeCorte;
          const estado = ponderado !== null ? estadoCorte(ponderado, corte) : null;
          const meta = estado ? ESTADOS[estado] : null;
          const EstadoIcon = estado ? ICONO_ESTADO[estado] : null;
          const delta = ponderado !== null && corte !== null ? ponderado - corte : null;
          const minimo = uni.ponderadoMinimo != null
            ? { label: 'Mín. postulación', valor: fmtMin(uni.ponderadoMinimo) }
            : uni.promedioMinimo != null
              ? { label: 'Mín. prom. Leng.+M1', valor: fmtMin(uni.promedioMinimo) }
              : null;
          const pesos = pesosDe(uni);

          return (
            <div
              key={slotIndex}
              onClick={() => onOpenDetail(uni)}
              className="bg-white border border-[#E7E5E1] rounded-2xl p-4 flex flex-col justify-between gap-4 relative cursor-pointer hover:border-[#CBD5E1] transition-colors"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onChangeCompareSlot(slotIndex, ''); }}
                className="absolute top-1.5 right-1.5 w-10 h-10 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F4F3F1] transition-colors cursor-pointer"
                title="Quitar"
                aria-label="Quitar de la comparación"
              >
                <X size={16} strokeWidth={2} />
              </button>

              <div className="space-y-1 pr-8">
                <div className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-[#94A3B8] truncate">
                  {categoriaDisplay[uni.categoria] || uni.nombre}
                </div>
                <div className="text-sm font-semibold text-[#0F172A] leading-snug">{displayNombreUniversidad(uni)}</div>
                {uni.region && (
                  <div className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                    <MapPin size={11} /> {uni.region} · Admisión {uni.anioAdmision}
                  </div>
                )}
              </div>

              {pesos.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    {pesos.map((s) => (
                      <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} title={`${s.label} ${s.pct}%`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
                    {pesos.map((s) => (
                      <span key={s.label} className="inline-flex items-center gap-1 text-[10px] text-[#64748B]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                        {s.label} <span className="font-semibold text-[#0F172A] tabular-nums">{s.pct}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#E7E5E1] space-y-2">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-xs text-[#64748B]">Tu ponderado</span>
                  <span className="text-xl font-bold text-[#0F172A] tabular-nums">{ponderado !== null ? fmt(ponderado) : '—'}</span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-xs text-[#64748B]">{corte !== null ? 'Corte 2026' : minimo?.label ?? 'Corte 2026'}</span>
                  <span className="text-sm font-semibold text-[#0F172A] tabular-nums">
                    {corte !== null ? fmt(corte) : minimo ? minimo.valor : 'Sin dato'}
                  </span>
                </div>
                {meta && EstadoIcon && estado !== 'sindato' && (
                  <div className="flex justify-between items-center gap-2 pt-0.5">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: meta.tint, color: meta.ink }}
                    >
                      <EstadoIcon size={12} strokeWidth={2.5} />
                      {meta.label}
                    </span>
                    {delta !== null && (
                      <span className="text-sm font-semibold tabular-nums" style={{ color: meta.ink }}>
                        {delta >= 0 ? '+' : '−'}{fmt(Math.abs(delta))}
                      </span>
                    )}
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

export default React.memo(CompareSection);
