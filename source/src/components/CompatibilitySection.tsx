import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { School, Star, MapPin, Users, Check, TriangleAlert, CircleX, Minus, type LucideIcon } from 'lucide-react';
import Card from './Card';
import { displayNombreUniversidad } from '../data';
import { calculatePonderado, PuntajesDirectos } from '../utils';
import { CarrerasPorCategoria, CarreraConDetalle } from '../types';
import { ANIO_CORTES, ESTADOS, EstadoCorte, estadoCorte } from '../constants';
import SearchableSelect from './SearchableSelect';
import { buscarCategorias } from '../busqueda';

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
  directos: PuntajesDirectos;
  favoritos: string[];
  onToggleFav: (carreraId: string) => void;
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

const chipCls = 'text-[11px] font-medium text-[#64748B] bg-[#F4F3F1] px-2 py-0.5 rounded-full inline-flex items-center gap-1';

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
  directos,
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

  const carreras = useMemo(() => Object.values(porCategoria).flat(), [porCategoria]);
  const buscar = useCallback((q: string) => buscarCategorias(carreras, categoriaDisplay, q), [carreras, categoriaDisplay]);

  const [selectedCareer, setSelectedCareer] = useState<string>(opciones[0]?.value || '');

  useEffect(() => {
    if (!porCategoria[selectedCareer]) setSelectedCareer(opciones[0]?.value || '');
  }, [anioAdmision]);

  const favSet = new Set(favoritos);
  const currentUnis = porCategoria[selectedCareer] || [];

  const hayPuntajes =
    nemScore > 0 || rankingScore > 0 || lectoraCorrect > 0 || m1Correct > 0 ||
    m2Correct > 0 || cienciasCorrect > 0 || historiaCorrect > 0 ||
    Object.keys(directos).length > 0;

  // Compute ponderado + gap vs corte de referencia for each university, sort best-fit first.
  const filas = useMemo(() => {
    const rows = currentUnis.map((uni) => {
      const ponderado = hayPuntajes
        ? calculatePonderado(nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, uni, directos)
        : null;
      const corte = uni.puntajeCorte;
      const gap = ponderado !== null && corte !== null ? ponderado - corte : null;
      return { uni, ponderado, corte, gap };
    });
    rows.sort((a, b) => {
      if (a.gap !== null && b.gap !== null) return b.gap - a.gap;
      if (a.gap !== null) return -1;
      if (b.gap !== null) return 1;
      if (a.ponderado !== null && b.ponderado !== null) return b.ponderado - a.ponderado;
      const ca = a.uni.puntajeCorte ?? -1, cb = b.uni.puntajeCorte ?? -1;
      return cb - ca;
    });
    return rows;
  }, [currentUnis, nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, directos, hayPuntajes]);

  return (
    <Card id="section-compatibilidad" className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <School size={18} className="text-[#64748B]" />
          <h3 className="text-base font-semibold text-[#0F172A]">Una carrera en todas sus universidades</h3>
        </div>
        <p className="text-xs text-[#64748B] mt-1.5">
          Busca una carrera y compara dónde te conviene postular según tu ponderado y el corte {ANIO_CORTES} · Admisión {anioAdmision}.
        </p>
      </div>

      <SearchableSelect
        options={opciones}
        value={selectedCareer}
        onChange={setSelectedCareer}
        buscar={buscar}
        placeholder="Busca una carrera (ej: ing comercial)..."
      />

      <div className="text-xs text-[#94A3B8] tabular-nums">
        {filas.length} universidad{filas.length === 1 ? '' : 'es'} dicta{filas.length === 1 ? '' : 'n'} esta carrera
      </div>

      <div className="space-y-2">
        {filas.map(({ uni, ponderado, corte, gap }) => {
          const isFav = favSet.has(uni.id);
          const estado = ponderado !== null ? estadoCorte(ponderado, corte) : null;
          const meta = estado ? ESTADOS[estado] : null;
          const EstadoIcon = estado ? ICONO_ESTADO[estado] : null;
          const minimo = uni.ponderadoMinimo != null
            ? { label: 'Mín. postulación', valor: fmtMin(uni.ponderadoMinimo) }
            : uni.promedioMinimo != null
              ? { label: 'Mín. prom. Leng.+M1', valor: fmtMin(uni.promedioMinimo) }
              : null;
          return (
            <div
              key={uni.id}
              onClick={() => onOpenDetail(uni)}
              className="relative overflow-hidden bg-white border border-[#E7E5E1] rounded-2xl p-4 pl-5 pr-12 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors duration-200 hover:border-[#CBD5E1] cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: meta ? meta.color : '#E7E5E1' }} aria-hidden />
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFav(uni.id); }}
                title={isFav ? 'Quitar de favoritas' : 'Agregar a favoritas'}
                aria-label={isFav ? 'Quitar de favoritas' : 'Agregar a favoritas'}
                aria-pressed={isFav}
                className="absolute top-1.5 right-1.5 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-[#F4F3F1]"
              >
                <Star size={18} strokeWidth={1.8} className={isFav ? 'fill-[#F59E0B] text-[#D97706]' : 'text-[#94A3B8]'} />
              </button>
              <div className="min-w-0 space-y-1">
                <div className="font-semibold text-[#0F172A] text-[15px] leading-snug">{displayNombreUniversidad(uni)}</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {uni.region && <span className={chipCls}><MapPin size={11} />{uni.region}</span>}
                  {uni.vacantes !== null && <span className={`${chipCls} tabular-nums`}><Users size={11} />{uni.vacantes} vac.</span>}
                </div>
              </div>
              <div className="text-left md:text-right shrink-0 space-y-1">
                {ponderado !== null && (
                  <div className="text-xl font-bold text-[#0F172A] tabular-nums leading-none">
                    {fmt(ponderado)} <span className="text-[11px] font-medium text-[#94A3B8]">pts</span>
                  </div>
                )}
                <div className="text-[11px] text-[#64748B] tabular-nums">
                  {corte !== null ? (
                    <>Corte {ANIO_CORTES}: <strong className="font-semibold text-[#0F172A]">{fmt(corte)}</strong></>
                  ) : minimo ? (
                    <>{minimo.label}: <strong className="font-semibold text-[#0F172A]">{minimo.valor}</strong></>
                  ) : (
                    <span className="text-[#94A3B8]">Sin corte {ANIO_CORTES}</span>
                  )}
                </div>
                {meta && EstadoIcon && estado !== 'sindato' && (
                  <div className="flex items-center md:justify-end gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: meta.tint, color: meta.ink }}
                    >
                      <EstadoIcon size={12} strokeWidth={2.5} />
                      {meta.label}
                    </span>
                    {gap !== null && (
                      <span className="text-xs font-semibold tabular-nums" style={{ color: meta.ink }}>
                        {gap >= 0 ? '+' : '−'}{fmt(Math.abs(gap))}
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

export default React.memo(CompatibilitySection);
