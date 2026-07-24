import React, { useEffect, useMemo, useState } from 'react';
import Card from './Card';
import { CarreraConDetalle } from '../types';
import { calculatePonderado } from '../utils';
import { displayNombreUniversidad, normalizar } from '../data';

interface BuscadorSectionProps {
  carreras: CarreraConDetalle[];
  categoriaDisplay: Record<string, string>;
  anioAdmision: number;
  tieneCortes: boolean;
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

type OrdenTipo =
  | 'alfabetico'
  | 'corte-desc'
  | 'corte-asc'
  | 'vacantes-desc'
  | 'min-asc';

const MAX_RESULTADOS = 60;

function BuscadorSection({
  carreras,
  categoriaDisplay,
  anioAdmision,
  tieneCortes,
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
}: BuscadorSectionProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [orden, setOrden] = useState<OrdenTipo>('alfabetico');
  const [soloConPonderacion, setSoloConPonderacion] = useState(true);
  const [soloConCorte, setSoloConCorte] = useState(false);
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [region, setRegion] = useState('');
  const [tipoU, setTipoU] = useState<'' | 'CRUCH' | 'PRIVADA_ADSCRITA'>('');
  const favSet = new Set(favoritos);

  // Debounce the query (200ms) per spec.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const regiones = useMemo(
    () => [...new Set(carreras.map((c) => c.region).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'es')),
    [carreras]
  );

  const hayPuntajes =
    nemScore > 0 || rankingScore > 0 || lectoraCorrect > 0 || m1Correct > 0 ||
    m2Correct > 0 || cienciasCorrect > 0 || historiaCorrect > 0;

  const resultados = useMemo(() => {
    const q = normalizar(debouncedQuery);
    const tokens = q.split(/\s+/).filter(Boolean);

    let base = carreras.filter((c) => {
      if (soloConPonderacion && !c.ponderacion) return false;
      if (soloConCorte && c.puntajeCorte === null) return false;
      if (soloFavoritas && !favSet.has(c.id)) return false;
      if (region && c.region !== region) return false;
      if (tipoU && c.universidadTipo !== tipoU) return false;
      if (tokens.length === 0) return true;
      const haystack = normalizar(
        `${c.nombre} ${c.universidadNombre} ${c.sedeNombre} ${c.region || ''} ${categoriaDisplay[c.categoria] || ''}`
      );
      return tokens.every((t) => haystack.includes(t));
    });

    const cmpNum = (a: number | null, b: number | null, dir: number) => {
      const av = a === null ? (dir > 0 ? -Infinity : Infinity) : a;
      const bv = b === null ? (dir > 0 ? -Infinity : Infinity) : b;
      return (av - bv) * dir;
    };

    base = [...base].sort((a, b) => {
      switch (orden) {
        case 'corte-desc':
          return cmpNum(a.puntajeCorte, b.puntajeCorte, -1);
        case 'corte-asc':
          return cmpNum(a.puntajeCorte, b.puntajeCorte, 1);
        case 'vacantes-desc':
          return cmpNum(a.vacantes, b.vacantes, -1);
        case 'min-asc':
          return cmpNum(a.promedioMinimo ?? null, b.promedioMinimo ?? null, 1);
        default:
          return a.nombre.localeCompare(b.nombre, 'es');
      }
    });

    return base;
  }, [carreras, debouncedQuery, orden, soloConPonderacion, soloConCorte, soloFavoritas, favoritos, region, tipoU, categoriaDisplay]);

  const visibles = resultados.slice(0, MAX_RESULTADOS);

  const ponderadoDe = (c: CarreraConDetalle) =>
    calculatePonderado(
      nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct,
      cienciasCorrect, historiaCorrect, cienciasModule, c
    );

  const opcionesOrden: { value: OrdenTipo; label: string }[] = [
    { value: 'alfabetico', label: 'Alfabético (A-Z)' },
    ...(tieneCortes
      ? ([
          { value: 'corte-desc', label: 'Corte más alto' },
          { value: 'corte-asc', label: 'Corte más bajo' },
        ] as { value: OrdenTipo; label: string }[])
      : ([{ value: 'min-asc', label: 'Menor puntaje mínimo' }] as { value: OrdenTipo; label: string }[])),
    { value: 'vacantes-desc', label: 'Más vacantes' },
  ];

  return (
    <Card id="section-buscador" className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
          BUSCADOR DE CARRERAS
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">🔍 Explora todo el catálogo</h3>
        <p className="text-xs text-[#64748B] mt-1">
          Busca entre <strong className="font-semibold text-[#0F172A]">{carreras.length.toLocaleString('es')}</strong> carreras
          por nombre, universidad, sede o región · Admisión {anioAdmision}.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm">🔎</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: medicina, Universidad de Chile, Valparaíso..."
          className="w-full h-12 pl-10 pr-4 bg-[#F5F7FA] border-0 rounded-xl text-[#0F172A] font-medium focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition-all duration-200 outline-none placeholder:text-[#94A3B8]"
        />
      </div>

      {/* Región + tipo universidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full h-10 px-3 pr-9 bg-[#F5F7FA] text-xs font-semibold text-[#0F172A] rounded-xl appearance-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white outline-none cursor-pointer transition-all duration-200"
          >
            <option value="">Todas las regiones</option>
            {regiones.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#64748B]">
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
          </div>
        </div>
        <div className="bg-[#F5F7FA] p-1 rounded-xl flex gap-1">
          {([['', 'Todas'], ['CRUCH', 'CRUCH'], ['PRIVADA_ADSCRITA', 'Privadas']] as const).map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setTipoU(val)}
              className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${
                tipoU === val ? 'bg-white text-[#0F172A] shadow-sm border border-slate-100' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as OrdenTipo)}
            className="w-full h-10 px-3 pr-9 bg-[#F5F7FA] text-xs font-semibold text-[#0F172A] rounded-xl appearance-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white outline-none cursor-pointer transition-all duration-200"
          >
            {opcionesOrden.map((o) => (
              <option key={o.value} value={o.value}>Ordenar: {o.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#64748B]">
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
          </div>
        </div>
        {tieneCortes && (
          <label className="flex items-center gap-2 text-xs font-medium text-[#64748B] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloConCorte}
              onChange={(e) => setSoloConCorte(e.target.checked)}
              className="w-4 h-4 accent-[#3B82F6] cursor-pointer"
            />
            Solo con corte
          </label>
        )}
        <label className="flex items-center gap-2 text-xs font-medium text-[#64748B] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloConPonderacion}
            onChange={(e) => setSoloConPonderacion(e.target.checked)}
            className="w-4 h-4 accent-[#3B82F6] cursor-pointer"
          />
          Solo con ponderación
        </label>
        <button
          onClick={() => setSoloFavoritas((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 h-8 transition-colors ${
            soloFavoritas ? 'bg-amber-50 border border-amber-200 text-amber-600' : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
          }`}
        >
          <span>{soloFavoritas ? '★' : '☆'}</span> Favoritas
        </button>
      </div>

      {/* Results meta */}
      <div className="text-xs text-[#94A3B8]">
        {resultados.length === 0
          ? 'Sin resultados. Prueba otro término.'
          : `${resultados.length.toLocaleString('es')} resultado${resultados.length === 1 ? '' : 's'}${
              resultados.length > MAX_RESULTADOS ? ` · mostrando los primeros ${MAX_RESULTADOS}` : ''
            }`}
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {visibles.map((c) => {
          const ponderado = hayPuntajes ? ponderadoDe(c) : null;
          const referencia = c.puntajeCorte ?? c.promedioMinimo ?? null;
          const gap = ponderado !== null && referencia !== null ? ponderado - referencia : null;

          let barColor = 'bg-[#CBD5E1]';
          if (gap !== null) {
            if (gap >= 0) barColor = 'bg-[#10B981]';
            else if (gap >= -30) barColor = 'bg-[#3B82F6]';
            else barColor = 'bg-[#94A3B8]';
          }

          let electiveText = '';
          if (c.electivaTipo === 'ciencias') electiveText = '(Cs)';
          else if (c.electivaTipo === 'historia') electiveText = '(Hist)';
          else if (c.electivaTipo === 'mejor') electiveText = '(Cs/Hist)';

          const isFav = favSet.has(c.id);
          return (
            <div
              key={c.id}
              onClick={() => onOpenDetail(c)}
              className="relative overflow-hidden bg-white border border-[#F1F5F9] rounded-2xl p-4 pr-10 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-200 hover:shadow-md hover:border-[#E2E8F0] cursor-pointer"
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full rounded-r ${barColor}`} />
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFav(c.id); }}
                title="Favorito"
                className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-base transition-colors ${isFav ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
              >
                {isFav ? '★' : '☆'}
              </button>
              <div className="pl-3 space-y-1 min-w-0">
                <div className="font-bold text-[#0F172A] text-[15px] leading-snug">{c.nombre}</div>
                <div className="text-xs text-[#64748B]">{displayNombreUniversidad(c)}</div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {c.region && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">
                      {c.region}
                    </span>
                  )}
                  {electiveText && (
                    <span className="text-[10px] font-medium text-[#94A3B8] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">
                      {electiveText}
                    </span>
                  )}
                  {c.vacantes !== null && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">
                      {c.vacantes} vac.
                    </span>
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
                      <span>{c.puntajeCorte !== null ? 'Corte' : 'Mín.'}: {referencia !== null ? referencia.toFixed(2) : '—'}</span>
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
                    {c.puntajeCorte !== null ? (
                      <>Corte: <strong className="font-semibold text-[#0F172A]">{c.puntajeCorte.toFixed(2)}</strong></>
                    ) : c.promedioMinimo ? (
                      <>Mín. postulación: <strong className="font-semibold text-[#0F172A]">{c.promedioMinimo}</strong></>
                    ) : (
                      'Sin corte histórico'
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!hayPuntajes && resultados.length > 0 && (
        <p className="text-[11px] text-[#94A3B8] bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
          💡 Ingresa tus puntajes en la pestaña <strong className="font-semibold text-[#64748B]">Mi puntaje</strong> para ver tu ponderado y la brecha con el corte en cada carrera.
        </p>
      )}
    </Card>
  );
}

export default React.memo(BuscadorSection);
