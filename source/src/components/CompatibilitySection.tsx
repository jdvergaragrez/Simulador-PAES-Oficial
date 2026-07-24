import React, { useEffect, useMemo, useState } from 'react';
import Card from './Card';
import { displayNombreUniversidad } from '../data';
import { calculatePonderado } from '../utils';
import { CarrerasPorCategoria, CarreraConDetalle } from '../types';
import SearchableSelect from './SearchableSelect';

interface CompatibilitySectionProps {
  porCategoria: CarrerasPorCategoria;
  categoriaDisplay: Record<string, string>;
  anioAdmision: number;
  nemScore: number;
  rankingScore: number;
  lectoraCorrect: number;
  m1Correct: number;
  m2Correct: number;
  cienciasCorrect: number;
  historiaCorrect: number;
  cienciasModule: 'biologia' | 'fisica' | 'quimica';
  favoritos: string[];
  onToggleFav: (carreraId: string) => void;
  onOpenDetail: (carrera: CarreraConDetalle) => void;
}

function CompatibilitySection({
  porCategoria,
  categoriaDisplay,
  anioAdmision,
  nemScore,
  rankingScore,
  lectoraCorrect,
  m1Correct,
  m2Correct,
  cienciasCorrect,
  historiaCorrect,
  cienciasModule,
  favoritos,
  onToggleFav,
  onOpenDetail,
}: CompatibilitySectionProps) {
  const opciones = useMemo(
    () =>
      Object.keys(porCategoria)
        .map((key) => ({ value: key, label: categoriaDisplay[key] || key }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [porCategoria, categoriaDisplay]
  );

  const [selectedCareer, setSelectedCareer] = useState<string>(opciones[0]?.value || '');

  useEffect(() => {
    if (!porCategoria[selectedCareer]) setSelectedCareer(opciones[0]?.value || '');
  }, [anioAdmision]);

  const favSet = new Set(favoritos);
  const currentUnis = porCategoria[selectedCareer] || [];

  const hayPuntajes =
    nemScore > 0 || rankingScore > 0 || lectoraCorrect > 0 || m1Correct > 0 ||
    m2Correct > 0 || cienciasCorrect > 0 || historiaCorrect > 0;

  // Compute ponderado + gap for each university, sort best-fit first.
  const filas = useMemo(() => {
    const rows = currentUnis.map((uni) => {
      const ponderado = hayPuntajes
        ? calculatePonderado(nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, uni)
        : null;
      const referencia = uni.puntajeCorte ?? uni.promedioMinimo ?? null;
      const gap = ponderado !== null && referencia !== null ? ponderado - referencia : null;
      return { uni, ponderado, referencia, gap };
    });
    rows.sort((a, b) => {
      if (a.gap !== null && b.gap !== null) return b.gap - a.gap;
      if (a.ponderado !== null && b.ponderado !== null) return b.ponderado - a.ponderado;
      const ca = a.uni.puntajeCorte ?? -1, cb = b.uni.puntajeCorte ?? -1;
      return cb - ca;
    });
    return rows;
  }, [currentUnis, nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, hayPuntajes]);

  return (
    <Card id="section-compatibilidad" className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
          COMPARADOR POR UNIVERSIDAD
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">🏫 Una carrera en todas sus universidades</h3>
        <p className="text-xs text-[#64748B] mt-1">
          Busca una carrera y compara dónde te conviene postular según tu ponderado y el corte · Admisión {anioAdmision}.
        </p>
      </div>

      <SearchableSelect
        options={opciones}
        value={selectedCareer}
        onChange={setSelectedCareer}
        placeholder="Busca una carrera..."
      />

      <div className="text-xs text-[#94A3B8]">
        {filas.length} universidad{filas.length === 1 ? '' : 'es'} dicta{filas.length === 1 ? '' : 'n'} esta carrera
      </div>

      <div className="space-y-3">
        {filas.map(({ uni, ponderado, referencia, gap }) => {
          const isFav = favSet.has(uni.id);
          let barColor = 'bg-[#CBD5E1]';
          if (gap !== null) {
            if (gap >= 0) barColor = 'bg-[#10B981]';
            else if (gap >= -30) barColor = 'bg-[#3B82F6]';
            else barColor = 'bg-[#94A3B8]';
          }
          return (
            <div
              key={uni.id}
              onClick={() => onOpenDetail(uni)}
              className="relative overflow-hidden bg-white border border-[#F1F5F9] rounded-2xl p-4 pr-10 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-200 hover:shadow-md hover:border-[#E2E8F0] cursor-pointer"
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full rounded-r ${barColor}`} />
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFav(uni.id); }}
                title="Favorito"
                className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-base transition-colors ${isFav ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
              >
                {isFav ? '★' : '☆'}
              </button>
              <div className="pl-3 min-w-0 space-y-0.5">
                <div className="font-bold text-[#0F172A] text-[15px] leading-snug">{displayNombreUniversidad(uni)}</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {uni.region && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">{uni.region}</span>
                  )}
                  {uni.vacantes !== null && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">{uni.vacantes} vac.</span>
                  )}
                </div>
              </div>
              <div className="pl-3 md:pl-0 text-left md:text-right shrink-0">
                {ponderado !== null ? (
                  <>
                    <div className="text-xl font-extrabold text-[#0F172A] font-mono tabular-nums">
                      {ponderado.toFixed(2)} <span className="text-[10px] font-semibold text-[#94A3B8]">pts</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] flex items-center md:justify-end gap-1.5">
                      <span>{uni.puntajeCorte !== null ? 'Corte' : 'Mín.'}: {referencia !== null ? referencia.toFixed(2) : '—'}</span>
                      {gap !== null && (
                        <>
                          <span className="text-[#CBD5E1]">·</span>
                          <span className={`font-semibold ${gap >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {gap >= 0 ? '+' : ''}{gap.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-[#94A3B8]">
                    {uni.puntajeCorte !== null ? (
                      <>Corte: <strong className="font-semibold text-[#0F172A]">{uni.puntajeCorte.toFixed(2)}</strong></>
                    ) : uni.promedioMinimo ? (
                      <>Mín.: <strong className="font-semibold text-[#0F172A]">{uni.promedioMinimo}</strong></>
                    ) : 'Sin corte'}
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

export default React.memo(CompatibilitySection);
