import React, { useEffect, useMemo, useState } from 'react';
import { Search, Star, ChevronDown, MapPin, Users, Info, Check, Clock, TrendingUp, X, Landmark } from 'lucide-react';
import { EstadoBadge, Resaltado } from './BusquedaUI';
import Card from './Card';
import { CarreraConDetalle } from '../types';
import { calculatePonderado, PuntajesDirectos } from '../utils';
import { displayNombreUniversidad } from '../data';
import { ANIO_CORTES, ESTADOS, estadoCorte } from '../constants';
import {
  agregarReciente, agruparPorCategoria, buscarCarreras, CATEGORIAS_POPULARES, compararPorCorte,
  guardarLista, leerLista, UNIVERSIDADES_ESTATALES,
} from '../busqueda';

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

const MAX_GRUPOS = 30;
const CLAVE_RECIENTES = 'paes_buscador_recientes';
const CLAVE_REGION = 'paes_mi_region';

const fmt = (n: number, dec = 2) => n.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtDelta = (d: number) => `${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))}`;

const selectCls =
  'w-full h-11 pl-3 pr-9 bg-[#F2F4F7] text-sm font-medium text-[#0F172A] rounded-xl appearance-none border border-transparent focus:border-[#2563EB] focus:bg-white outline-none cursor-pointer transition-colors';

const chipCls = 'text-[11px] font-medium text-[#64748B] bg-[#F2F4F7] px-2 py-0.5 rounded-md inline-flex items-center gap-1';

const filtroCls = (activo: boolean) =>
  `flex items-center gap-1.5 text-xs font-medium rounded-[10px] px-3.5 h-11 border transition-colors cursor-pointer ${
    activo ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' : 'border-[#E8ECF1] text-[#64748B] hover:text-[#0F172A]'
  }`;

const sugerenciaCls =
  'inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-[10px] bg-[#F2F4F7] text-sm font-medium text-[#0F172A] hover:bg-[#EBEEF2] transition-colors cursor-pointer';

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
  const [miRegion, setMiRegion] = useState(() => leerLista(CLAVE_REGION)[0] ?? '');
  const [soloMiRegion, setSoloMiRegion] = useState(false);
  const [soloEstatales, setSoloEstatales] = useState(false);
  const [soloSobreCorte, setSoloSobreCorte] = useState(false);
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [recientes, setRecientes] = useState(() => leerLista(CLAVE_RECIENTES));
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const favSet = useMemo(() => new Set(favoritos), [favoritos]);

  // Debounce de la búsqueda (200 ms).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Guarda como reciente lo que el usuario dejó escrito por un momento.
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => {
      setRecientes((prev) => {
        const next = agregarReciente(prev, q);
        guardarLista(CLAVE_RECIENTES, next);
        return next;
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [debouncedQuery]);

  useEffect(() => setAbiertos(new Set()), [debouncedQuery]);

  const regiones = useMemo(
    () => [...new Set(carreras.map((c) => c.region).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'es')),
    [carreras]
  );

  const hayPuntajes =
    nemScore > 0 || rankingScore > 0 || lectoraCorrect > 0 || m1Correct > 0 ||
    m2Correct > 0 || cienciasCorrect > 0 || historiaCorrect > 0 ||
    Object.keys(directos).length > 0;

  const ponderadoDe = (c: CarreraConDetalle) =>
    calculatePonderado(
      nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct,
      cienciasCorrect, historiaCorrect, cienciasModule, c, directos
    );

  const conPonderacion = useMemo(() => carreras.filter((c) => c.ponderacion), [carreras]);
  const busqueda = useMemo(
    () => buscarCarreras(conPonderacion, categoriaDisplay, debouncedQuery),
    [conPonderacion, categoriaDisplay, debouncedQuery]
  );

  const hayTexto = debouncedQuery.trim().length > 0;
  const hayFiltros = (soloMiRegion && !!miRegion) || soloEstatales || soloSobreCorte || soloFavoritas;

  const grupos = useMemo(() => {
    const pasa = (c: CarreraConDetalle) => {
      if (soloMiRegion && miRegion && c.region !== miRegion) return false;
      if (soloEstatales && !UNIVERSIDADES_ESTATALES.has(c.universidadNombre)) return false;
      if (soloFavoritas && !favSet.has(c.id)) return false;
      if (soloSobreCorte) {
        const p = hayPuntajes ? ponderadoDe(c) : null;
        if (p === null || estadoCorte(p, c.puntajeCorte) !== 'alcanzable') return false;
      }
      return true;
    };
    if (hayTexto) return agruparPorCategoria(busqueda.resultados.filter((r) => pasa(r.carrera)));
    if (!hayFiltros) return [];
    // Sin texto pero con filtros: todas las carreras que pasan, agrupadas alfabéticamente.
    const porCat = new Map<string, CarreraConDetalle[]>();
    for (const c of conPonderacion) if (pasa(c)) (porCat.get(c.categoria) ?? porCat.set(c.categoria, []).get(c.categoria)!).push(c);
    return [...porCat.entries()]
      .map(([categoria, lista]) => ({ categoria, carreras: lista.sort(compararPorCorte), puntaje: 0 }))
      .sort((a, b) => (categoriaDisplay[a.categoria] ?? a.categoria).localeCompare(categoriaDisplay[b.categoria] ?? b.categoria, 'es'));
  }, [busqueda, hayTexto, hayFiltros, conPonderacion, soloMiRegion, miRegion, soloEstatales, soloSobreCorte, soloFavoritas, favSet, hayPuntajes, nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, directos, categoriaDisplay]);

  const visibles = grupos.slice(0, MAX_GRUPOS);
  // El primer grupo se muestra abierto; el resto se abre con un toque.
  const estaAbierto = (cat: string, i: number) => abiertos.has(cat) !== (i === 0);
  const alternar = (cat: string) =>
    setAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });

  const nombreCategoria = (cat: string) => categoriaDisplay[cat] || cat;
  const populares = CATEGORIAS_POPULARES.filter((k) => conPonderacion.some((c) => c.categoria === k));
  const borrarRecientes = () => {
    setRecientes([]);
    guardarLista(CLAVE_RECIENTES, []);
  };
  const elegirRegion = (r: string) => {
    setMiRegion(r);
    setSoloMiRegion(!!r);
    guardarLista(CLAVE_REGION, r ? [r] : []);
  };

  const renderCarrera = (c: CarreraConDetalle) => {
    const ponderado = hayPuntajes ? ponderadoDe(c) : null;
    const corte = c.puntajeCorte;
    const estado = ponderado !== null ? estadoCorte(ponderado, corte) : null;
    const delta = ponderado !== null && corte !== null ? ponderado - corte : null;
    const barColor = estado ? ESTADOS[estado].color : '#E8ECF1';

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
        role="button"
        tabIndex={0}
        aria-label={`${c.nombre}, ${displayNombreUniversidad(c)}. Ver detalle`}
        onClick={() => onOpenDetail(c)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail(c); } }}
        className="relative overflow-hidden bg-white border border-[#E8ECF1] rounded-2xl p-4 pl-5 pr-12 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors duration-200 hover:border-[#CBD5E1] cursor-pointer outline-none focus-visible:border-[#2563EB]"
      >
        <div className="absolute top-0 left-0 w-1 h-full" style={{ background: barColor }} aria-hidden />
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(c.id); }}
          title={isFav ? 'Quitar de favoritas' : 'Agregar a favoritas'}
          aria-label={isFav ? `Quitar ${c.nombre} de favoritas` : `Agregar ${c.nombre} a favoritas`}
          aria-pressed={isFav}
          className="absolute top-1 right-1 w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-[#F2F4F7]"
        >
          <Star size={18} strokeWidth={1.8} className={isFav ? 'fill-[#F59E0B] text-[#D97706]' : 'text-[#94A3B8]'} />
        </button>
        <div className="space-y-1 min-w-0">
          <div className="font-semibold text-[#0F172A] text-[15px] leading-snug"><Resaltado texto={c.nombre} query={debouncedQuery} /></div>
          <div className="text-xs text-[#64748B]"><Resaltado texto={displayNombreUniversidad(c)} query={debouncedQuery} /></div>
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
            <div className="text-xl font-semibold text-[#0F172A] tabular-nums leading-none">
              {fmt(ponderado)} <span className="text-[11px] font-medium text-[#94A3B8]">pts</span>
            </div>
          )}
          <div className="text-[11px] text-[#64748B] tabular-nums">
            {corte !== null ? (
              <>Corte ref. {ANIO_CORTES}: <strong className="font-semibold text-[#0F172A]">{fmt(corte)}</strong></>
            ) : minimo ? (
              <>{minimo.label}: <strong className="font-semibold text-[#0F172A]">{minimo.valor}</strong></>
            ) : (
              <span className="text-[#94A3B8]">Sin corte {ANIO_CORTES}</span>
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
  };

  return (
    <Card id="section-buscador" className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Search size={18} className="text-[#64748B]" />
          <h3 className="text-base font-semibold text-[#0F172A]">Explora todo el catálogo</h3>
        </div>
        <p className="text-xs text-[#64748B] mt-1.5">
          Busca entre <strong className="font-semibold text-[#0F172A]">{conPonderacion.length.toLocaleString('es-CL')}</strong> carreras
          por nombre, universidad o sigla (uc, usach, udec…) · Admisión {anioAdmision}.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search size={18} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: medicina uc, ing civil usach…"
          aria-label="Buscar carrera o universidad"
          autoComplete="off"
          enterKeyHint="search"
          className="w-full h-12 pl-11 pr-12 bg-[#F2F4F7] border border-transparent rounded-xl text-[#0F172A] font-medium focus:border-[#2563EB] focus:bg-white transition-colors duration-200 outline-none placeholder:text-[#94A3B8] placeholder:font-normal [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setDebouncedQuery(''); }}
            aria-label="Borrar búsqueda"
            className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Chips de filtro */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros">
        <button onClick={() => (miRegion ? setSoloMiRegion((v) => !v) : setSoloMiRegion(true))} aria-pressed={soloMiRegion && !!miRegion} className={filtroCls(soloMiRegion && !!miRegion)}>
          <MapPin size={14} /> {miRegion && soloMiRegion ? miRegion : 'Mi región'}
        </button>
        <button onClick={() => setSoloEstatales((v) => !v)} aria-pressed={soloEstatales} className={filtroCls(soloEstatales)}>
          <Landmark size={14} /> Estatales
        </button>
        {tieneCortes && (
          <button
            onClick={() => setSoloSobreCorte((v) => !v)}
            aria-pressed={soloSobreCorte}
            disabled={!hayPuntajes}
            title={hayPuntajes ? undefined : 'Ingresa tus puntajes para usar este filtro'}
            className={`${filtroCls(soloSobreCorte)} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Check size={14} /> Sobre el corte
          </button>
        )}
        <button
          onClick={() => setSoloFavoritas((v) => !v)}
          aria-pressed={soloFavoritas}
          className={`flex items-center gap-1.5 text-xs font-medium rounded-[10px] px-3.5 h-11 border transition-colors cursor-pointer ${
            soloFavoritas ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]' : 'border-[#E8ECF1] text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Star size={14} strokeWidth={2} className={soloFavoritas ? 'fill-[#F59E0B] text-[#D97706]' : ''} />
          Favoritas
        </button>
      </div>
      {soloMiRegion && (
        <div className="relative max-w-xs">
          <select value={miRegion} onChange={(e) => elegirRegion(e.target.value)} className={selectCls} aria-label="Mi región">
            <option value="">Elige tu región…</option>
            {regiones.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden />
        </div>
      )}

      {/* Sin texto ni filtros: populares y recientes */}
      {!hayTexto && !hayFiltros && (
        <div className="space-y-4">
          {recientes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]"><Clock size={14} /> Búsquedas recientes</span>
                <button onClick={borrarRecientes} className="min-h-[44px] px-2 text-xs text-[#94A3B8] hover:text-[#0F172A] cursor-pointer">Borrar</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recientes.map((r) => (
                  <button key={r} onClick={() => setQuery(r)} className={sugerenciaCls} aria-label={`Buscar ${r}`}>{r}</button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]"><TrendingUp size={14} /> Populares</span>
            <div className="flex flex-wrap gap-2">
              {populares.map((k) => (
                <button key={k} onClick={() => setQuery(nombreCategoria(k))} className={sugerenciaCls} aria-label={`Buscar ${nombreCategoria(k)}`}>
                  {nombreCategoria(k)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resultados agrupados por carrera */}
      {(hayTexto || hayFiltros) && (
        <>
          <div className="text-xs text-[#94A3B8] tabular-nums" aria-live="polite">
            {grupos.length === 0 ? (
              busqueda.sugerencia ? (
                <span>
                  Sin resultados. ¿Quisiste decir{' '}
                  <button onClick={() => setQuery(busqueda.sugerencia!)} className="min-h-[44px] font-semibold text-[#2563EB] underline underline-offset-2 cursor-pointer">
                    {busqueda.sugerencia}
                  </button>
                  ?
                </span>
              ) : 'Sin resultados. Prueba otro término o quita filtros.'
            ) : (
              `${grupos.length.toLocaleString('es-CL')} carrera${grupos.length === 1 ? '' : 's'}${
                grupos.length > MAX_GRUPOS ? ` · mostrando las primeras ${MAX_GRUPOS}` : ''
              } · universidades de corte más alto a más bajo`
            )}
          </div>

          <div className="space-y-3">
            {visibles.map((g, i) => {
              const abierto = estaAbierto(g.categoria, i);
              const n = g.carreras.length;
              return (
                <div key={g.categoria} className="space-y-2">
                  <button
                    onClick={() => alternar(g.categoria)}
                    aria-expanded={abierto}
                    className="w-full min-h-[44px] flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[#F2F4F7] hover:bg-[#EBEEF2] text-left cursor-pointer transition-colors"
                  >
                    <span className="text-sm text-[#0F172A] min-w-0">
                      <span className="font-semibold"><Resaltado texto={nombreCategoria(g.categoria)} query={debouncedQuery} /></span>
                      <span className="text-[#64748B]"> · {n} universidad{n === 1 ? '' : 'es'}</span>
                    </span>
                    <ChevronDown size={16} className={`shrink-0 text-[#64748B] transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden />
                  </button>
                  {abierto && <div className="space-y-2">{g.carreras.map(renderCarrera)}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tieneCortes && (hayTexto || hayFiltros) && grupos.length > 0 && (
        <p className="flex items-start gap-2 text-xs text-[#64748B] bg-[#F2F4F7] rounded-xl px-3 py-2.5">
          <Info size={14} className="shrink-0 mt-px text-[#94A3B8]" />
          <span>
            {hayPuntajes
              ? `El corte es de referencia (Admisión ${ANIO_CORTES}): el de ${anioAdmision} se conocerá al terminar el proceso.`
              : <>El corte es de referencia (Admisión {ANIO_CORTES}). Ingresa tus puntajes en <strong className="font-semibold text-[#0F172A]">Mi puntaje</strong> para ver tu ponderado y la distancia al corte.</>}
          </span>
        </p>
      )}
    </Card>
  );
}

export default React.memo(BuscadorSection);
