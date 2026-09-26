import React, { useEffect, useMemo, useState } from 'react';
import { Search, Star, ChevronDown, MapPin, Users, Info, Check, TriangleAlert, CircleX, Minus, type LucideIcon } from 'lucide-react';
import Card from './Card';
import { CarreraConDetalle } from '../types';
import { calculatePonderado, PuntajesDirectos } from '../utils';
import { displayNombreUniversidad, normalizar } from '../data';
import { ESTADOS, EstadoCorte, estadoCorte } from '../constants';

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
  directos: PuntajesDirectos;
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

const fmt = (n: number, dec = 2) => n.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtDelta = (d: number) => `${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))}`;

const ICONO_ESTADO: Record<EstadoCorte, LucideIcon> = {
  alcanzable: Check,
  limite: TriangleAlert,
  noalcanza: CircleX,
  sindato: Minus,
};

function EstadoBadge({ estado }: { estado: EstadoCorte }) {
  const meta = ESTADOS[estado];
  const Icon = ICONO_ESTADO[estado];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: meta.tint, color: meta.ink }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

const selectCls =
  'w-full h-10 pl-3 pr-9 bg-[#F4F3F1] text-sm font-medium text-[#0F172A] rounded-xl appearance-none border border-transparent focus:border-[#2563EB] focus:bg-white outline-none cursor-pointer transition-colors';

const chipCls = 'text-[11px] font-medium text-[#64748B] bg-[#F4F3F1] px-2 py-0.5 rounded-full inline-flex items-center gap-1';

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
  directos,
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
    m2Correct > 0 || cienciasCorrect > 0 || historiaCorrect > 0 ||
    Object.keys(directos).length > 0;

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
      cienciasCorrect, historiaCorrect, cienciasModule, c, directos
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
        <div className="flex items-center gap-2">
          <Search size={18} className="text-[#64748B]" />
          <h3 className="text-base font-semibold text-[#0F172A]">Explora todo el catálogo</h3>
        </div>
        <p className="text-xs text-[#64748B] mt-1.5">
          Busca entre <strong className="font-semibold text-[#0F172A]">{carreras.length.toLocaleString('es-CL')}</strong> carreras
          por nombre, universidad, sede o región · Admisión {anioAdmision}.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search size={18} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: medicina, Universidad de Chile, Valparaíso..."
          aria-label="Buscar carrera"
          className="w-full h-12 pl-11 pr-4 bg-[#F4F3F1] border border-transparent rounded-xl text-[#0F172A] font-medium focus:border-[#2563EB] focus:bg-white transition-colors duration-200 outline-none placeholder:text-[#94A3B8] placeholder:font-normal"
        />
      </div>

      {/* Región + tipo universidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectCls} aria-label="Región">
            <option value="">Todas las regiones</option>
            {regiones.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden />
        </div>
        <div className="bg-[#F4F3F1] p-0.5 rounded-full flex gap-0.5" role="group" aria-label="Tipo de universidad">
          {([['', 'Todas'], ['CRUCH', 'CRUCH'], ['PRIVADA_ADSCRITA', 'Privadas']] as const).map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setTipoU(val)}
              aria-pressed={tipoU === val}
              className={`flex-1 h-9 rounded-full text-xs font-medium transition-all cursor-pointer ${
                tipoU === val ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.1)]' : 'text-[#64748B] hover:text-[#0F172A]'
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
          <select value={orden} onChange={(e) => setOrden(e.target.value as OrdenTipo)} className={selectCls} aria-label="Ordenar">
            {opcionesOrden.map((o) => (
              <option key={o.value} value={o.value}>Ordenar: {o.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {tieneCortes && (
            <label className="flex items-center gap-2 min-h-[40px] text-xs font-medium text-[#64748B] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soloConCorte}
                onChange={(e) => setSoloConCorte(e.target.checked)}
                className="w-4 h-4 accent-[#2563EB] cursor-pointer"
              />
              Solo con corte
            </label>
          )}
          <label className="flex items-center gap-2 min-h-[40px] text-xs font-medium text-[#64748B] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloConPonderacion}
              onChange={(e) => setSoloConPonderacion(e.target.checked)}
              className="w-4 h-4 accent-[#2563EB] cursor-pointer"
            />
            Solo con ponderación
          </label>
          <button
            onClick={() => setSoloFavoritas((v) => !v)}
            aria-pressed={soloFavoritas}
            className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 h-9 border transition-colors cursor-pointer ${
              soloFavoritas ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]' : 'border-[#E7E5E1] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Star size={14} strokeWidth={2} className={soloFavoritas ? 'fill-[#F59E0B] text-[#D97706]' : ''} />
            Favoritas
          </button>
        </div>
      </div>

      {/* Results meta */}
      <div className="text-xs text-[#94A3B8] tabular-nums">
        {resultados.length === 0
          ? 'Sin resultados. Prueba otro término.'
          : `${resultados.length.toLocaleString('es-CL')} resultado${resultados.length === 1 ? '' : 's'}${
              resultados.length > MAX_RESULTADOS ? ` · mostrando los primeros ${MAX_RESULTADOS}` : ''
            }`}
      </div>

      {/* Results list */}
      <div className="space-y-2">
        {visibles.map((c) => {
          const ponderado = hayPuntajes ? ponderadoDe(c) : null;
          const corte = c.puntajeCorte;
          const estado = ponderado !== null ? estadoCorte(ponderado, corte) : null;
          const delta = ponderado !== null && corte !== null ? ponderado - corte : null;
          const barColor = estado ? ESTADOS[estado].color : '#E7E5E1';

          let electiveText = '';
          if (c.electivaTipo === 'ciencias') electiveText = 'Ciencias';
          else if (c.electivaTipo === 'historia') electiveText = 'Historia';
          else if (c.electivaTipo === 'mejor') electiveText = 'Ciencias o Historia';

          const minimo = c.ponderadoMinimo != null
            ? { label: 'Mín. postulación', valor: c.ponderadoMinimo.toLocaleString('es-CL', { maximumFractionDigits: 2 }) }
            : c.promedioMinimo != null
              ? { label: 'Mín. prom. Leng.+M1', valor: c.promedioMinimo.toLocaleString('es-CL', { maximumFractionDigits: 2 }) }
              : null;

          const isFav = favSet.has(c.id);
          return (
            <div
              key={c.id}
              onClick={() => onOpenDetail(c)}
              className="relative overflow-hidden bg-white border border-[#E7E5E1] rounded-2xl p-4 pl-5 pr-12 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors duration-200 hover:border-[#CBD5E1] cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: barColor }} aria-hidden />
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFav(c.id); }}
                title={isFav ? 'Quitar de favoritas' : 'Agregar a favoritas'}
                aria-label={isFav ? 'Quitar de favoritas' : 'Agregar a favoritas'}
                aria-pressed={isFav}
                className="absolute top-1.5 right-1.5 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-[#F4F3F1]"
              >
                <Star size={18} strokeWidth={1.8} className={isFav ? 'fill-[#F59E0B] text-[#D97706]' : 'text-[#94A3B8]'} />
              </button>
              <div className="space-y-1 min-w-0">
                <div className="font-semibold text-[#0F172A] text-[15px] leading-snug">{c.nombre}</div>
                <div className="text-xs text-[#64748B]">{displayNombreUniversidad(c)}</div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {c.region && (
                    <span className={chipCls}><MapPin size={11} />{c.region}</span>
                  )}
                  {electiveText && <span className={chipCls}>{electiveText}</span>}
                  {c.vacantes !== null && (
                    <span className={`${chipCls} tabular-nums`}><Users size={11} />{c.vacantes} vac.</span>
                  )}
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
                    <>Corte 2026: <strong className="font-semibold text-[#0F172A]">{fmt(corte)}</strong></>
                  ) : minimo ? (
                    <>{minimo.label}: <strong className="font-semibold text-[#0F172A]">{minimo.valor}</strong></>
                  ) : (
                    <span className="text-[#94A3B8]">Sin corte 2026</span>
                  )}
                </div>
                {estado && estado !== 'sindato' && (
                  <div className="flex items-center md:justify-end gap-1.5">
                    <EstadoBadge estado={estado} />
                    {delta !== null && (
                      <span className="text-xs font-semibold tabular-nums" style={{ color: ESTADOS[estado].ink }}>
                        {fmtDelta(delta)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!hayPuntajes && resultados.length > 0 && (
        <p className="flex items-start gap-2 text-xs text-[#64748B] bg-[#F4F3F1] rounded-xl px-3 py-2.5">
          <Info size={14} className="shrink-0 mt-px text-[#94A3B8]" />
          <span>
            Ingresa tus puntajes en <strong className="font-semibold text-[#0F172A]">Mi puntaje</strong> para ver tu ponderado y la distancia al corte en cada carrera.
          </span>
        </p>
      )}
    </Card>
  );
}

export default React.memo(BuscadorSection);
