import React, { useEffect, useMemo, useState } from 'react';
import { Search, Star, Clock, ChevronLeft, ChevronRight, X, ListOrdered, Pencil } from 'lucide-react';
import Card from './Card';
import StepHeader from './StepHeader';
import { CarreraConDetalle, CarrerasPorCategoria } from '../types';
import { estadoCorte } from '../constants';
import { agregarReciente, agruparPorCategoria, buscarCarreras, compararPorCorte, guardarLista, leerLista } from '../busqueda';
import { EstadoBadge, Resaltado } from './BuscadorSection';

interface TargetSelectorProps {
  carreras: CarreraConDetalle[];
  porCategoria: CarrerasPorCategoria;
  categoriaDisplay: Record<string, string>;
  targetCareer: string;
  targetCarreraId: string;
  favoritos: string[];
  // Ponderado del usuario en una carrera, o null si aún no ingresa puntajes.
  ponderadoDe: (c: CarreraConDetalle) => number | null;
  onElegir: (carrera: CarreraConDetalle) => void;
}

type Modo = 'buscar' | 'pasos';

const CLAVE_RECIENTES = 'paes_objetivo_recientes';
const MAX_SUGERENCIAS = 8;
const fmt = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const filaCls =
  'w-full min-h-[44px] flex items-center justify-between gap-3 px-3 py-2.5 text-left rounded-xl hover:bg-[#F4F3F1] transition-colors cursor-pointer';

const inputCls =
  'w-full h-12 pl-11 pr-12 bg-[#F4F3F1] border border-transparent rounded-xl text-[#0F172A] font-medium focus:border-[#2563EB] focus:bg-white transition-colors duration-200 outline-none placeholder:text-[#94A3B8] placeholder:font-normal [&::-webkit-search-cancel-button]:hidden';

function CampoBusqueda({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative">
      <Search size={18} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        enterKeyHint="search"
        className={inputCls}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Borrar búsqueda"
          className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

function TargetSelector({
  carreras,
  porCategoria,
  categoriaDisplay,
  targetCareer,
  targetCarreraId,
  favoritos,
  ponderadoDe,
  onElegir,
}: TargetSelectorProps) {
  const elegida = useMemo(() => carreras.find((c) => c.id === targetCarreraId) ?? null, [carreras, targetCarreraId]);
  // Carrera guardada sin universidad (p. ej. un enlace antiguo): se abre directo en el paso 2.
  const carreraPendiente = !elegida && porCategoria[targetCareer] ? targetCareer : '';
  const [abierto, setAbierto] = useState(!elegida);
  const [modo, setModo] = useState<Modo>(carreraPendiente ? 'pasos' : 'buscar');
  const [carreraPaso, setCarreraPaso] = useState(carreraPendiente);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [queryCarrera, setQueryCarrera] = useState('');
  const [recientes, setRecientes] = useState(() => leerLista(CLAVE_RECIENTES));

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  // Sin carrera elegida el selector queda abierto; nunca se elige una por el usuario.
  useEffect(() => {
    setAbierto(!elegida);
    if (carreraPendiente) {
      setModo('pasos');
      setCarreraPaso(carreraPendiente);
    }
  }, [elegida, carreraPendiente]);

  const conPonderacion = useMemo(() => carreras.filter((c) => c.ponderacion), [carreras]);
  const porId = useMemo(() => new Map(conPonderacion.map((c) => [c.id, c])), [conPonderacion]);
  const nombreCategoria = (cat: string) => categoriaDisplay[cat] || cat;

  const elegir = (c: CarreraConDetalle) => {
    onElegir(c);
    const next = agregarReciente(recientes, c.id);
    setRecientes(next);
    guardarLista(CLAVE_RECIENTES, next);
    setQuery('');
    setDebounced('');
    setQueryCarrera('');
    setAbierto(false);
  };

  const irAPaso2 = (cat: string) => {
    setCarreraPaso(cat);
    setModo('pasos');
    setQueryCarrera('');
  };

  // Modo buscar: carrera + universidad en un toque.
  const busqueda = useMemo(() => buscarCarreras(conPonderacion, categoriaDisplay, debounced), [conPonderacion, categoriaDisplay, debounced]);
  const sugerencias = busqueda.resultados.slice(0, MAX_SUGERENCIAS).map((r) => r.carrera);
  const gruposSugeridos = useMemo(
    () => agruparPorCategoria(busqueda.resultados).filter((g) => g.carreras.length > 1).slice(0, 3),
    [busqueda]
  );

  // Modo por pasos: 1) carrera, 2) universidad.
  const paso = carreraPaso && porCategoria[carreraPaso] ? 2 : 1;
  const categorias = useMemo(() => {
    const q = queryCarrera.trim();
    if (q) {
      return agruparPorCategoria(buscarCarreras(conPonderacion, categoriaDisplay, q).resultados)
        .map((g) => ({ categoria: g.categoria, n: g.carreras.length }));
    }
    const cuenta = new Map<string, number>();
    for (const c of conPonderacion) cuenta.set(c.categoria, (cuenta.get(c.categoria) ?? 0) + 1);
    const nombre = (cat: string) => categoriaDisplay[cat] || cat;
    return [...cuenta.entries()]
      .map(([categoria, n]) => ({ categoria, n }))
      .sort((a, b) => nombre(a.categoria).localeCompare(nombre(b.categoria), 'es'));
  }, [queryCarrera, conPonderacion, categoriaDisplay]);
  const universidades = useMemo(
    () => (porCategoria[carreraPaso] ?? []).filter((c) => c.ponderacion).sort(compararPorCorte),
    [porCategoria, carreraPaso]
  );

  const favoritas = favoritos.map((id) => porId.get(id)).filter((c): c is CarreraConDetalle => !!c);
  const ultimas = recientes.map((id) => porId.get(id)).filter((c): c is CarreraConDetalle => !!c);

  // Corte de referencia + compatibilidad (misma lógica que el resto de la app).
  const corte = (c: CarreraConDetalle) => {
    const p = ponderadoDe(c);
    const estado = p !== null ? estadoCorte(p, c.puntajeCorte) : null;
    return (
      <span className="shrink-0 flex flex-col items-end gap-1 text-[11px] text-[#64748B] tabular-nums text-right">
        {c.puntajeCorte !== null
          ? <span>Corte ref. 2026: <strong className="font-semibold text-[#0F172A]">{fmt(c.puntajeCorte)}</strong></span>
          : <span className="text-[#94A3B8]">Sin corte 2026</span>}
        {estado && estado !== 'sindato' && <EstadoBadge estado={estado} />}
      </span>
    );
  };

  // Fila "Carrera · Universidad · Sede" para elegir en un toque.
  const filaCarrera = (c: CarreraConDetalle, q = '') => (
    <li key={c.id}>
      <button onClick={() => elegir(c)} className={filaCls} aria-label={`Elegir ${nombreCategoria(c.categoria)} en ${c.universidadNombre}, sede ${c.sedeNombre}`}>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#0F172A] leading-snug">
            <Resaltado texto={nombreCategoria(c.categoria)} query={q} />
            <span className="font-normal text-[#64748B]"> · <Resaltado texto={c.universidadNombre} query={q} /> · {c.sedeNombre}</span>
          </span>
          {c.nombre.toLowerCase() !== nombreCategoria(c.categoria).toLowerCase() && (
            <span className="block text-[11px] text-[#94A3B8] mt-0.5">{c.nombre}</span>
          )}
        </span>
        {corte(c)}
      </button>
    </li>
  );

  const lista = (titulo: string, icono: React.ReactNode, items: CarreraConDetalle[]) =>
    items.length > 0 && (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-[#64748B]">{icono} {titulo}</div>
        <ul className="-mx-1" aria-label={titulo}>{items.map((c) => filaCarrera(c))}</ul>
      </div>
    );

  return (
    <Card id="section-objetivo" className="space-y-4">
      <StepHeader n={1} title="¿Dónde quieres postular?" description="Escribe carrera y universidad (ej: medicina uc) o elígelas por pasos." />

      {elegida && !abierto && (
        <div className="flex items-center justify-between gap-3 bg-[#F4F3F1] rounded-xl px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#0F172A] leading-snug">
              {nombreCategoria(elegida.categoria)} · {elegida.universidadNombre} · {elegida.sedeNombre}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-0.5">{elegida.nombre}</div>
          </div>
          <button
            onClick={() => setAbierto(true)}
            aria-label="Cambiar carrera y universidad"
            className="shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-medium text-[#2563EB] hover:bg-white cursor-pointer"
          >
            <Pencil size={14} /> Cambiar
          </button>
        </div>
      )}

      {abierto && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#F4F3F1] p-0.5 rounded-full flex gap-0.5" role="tablist" aria-label="Forma de elegir">
              {([['buscar', 'Buscar', Search], ['pasos', 'Por pasos', ListOrdered]] as const).map(([val, lbl, Icon]) => (
                <button
                  key={val}
                  role="tab"
                  aria-selected={modo === val}
                  onClick={() => setModo(val)}
                  className={`flex-1 h-11 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    modo === val ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.1)]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon size={14} /> {lbl}
                </button>
              ))}
            </div>
            {elegida && (
              <button onClick={() => setAbierto(false)} aria-label="Cerrar sin cambiar" className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F4F3F1] cursor-pointer">
                <X size={18} />
              </button>
            )}
          </div>

          {modo === 'buscar' && (
            <div className="space-y-3">
              <CampoBusqueda value={query} onChange={setQuery} placeholder="Ej: medicina uc, ing civil usach…" label="Buscar carrera y universidad" />
              {!debounced.trim() ? (
                <>
                  {lista('Favoritas', <Star size={14} />, favoritas)}
                  {lista('Últimas elecciones', <Clock size={14} />, ultimas)}
                  {!favoritas.length && !ultimas.length && (
                    <p className="px-1 text-xs text-[#94A3B8]">Escribe la carrera y, si quieres, la universidad o su sigla (uc, uchile, usach, udec…).</p>
                  )}
                </>
              ) : sugerencias.length === 0 ? (
                <p className="px-1 text-xs text-[#94A3B8]" aria-live="polite">
                  {busqueda.sugerencia ? (
                    <>Sin resultados. ¿Quisiste decir{' '}
                      <button onClick={() => setQuery(busqueda.sugerencia!)} className="min-h-[44px] font-semibold text-[#2563EB] underline underline-offset-2 cursor-pointer">{busqueda.sugerencia}</button>?
                    </>
                  ) : 'Sin resultados. Prueba con otro nombre o elige por pasos.'}
                </p>
              ) : (
                <>
                  <ul className="-mx-1" aria-label="Sugerencias">{sugerencias.map((c) => filaCarrera(c, debounced))}</ul>
                  {gruposSugeridos.length > 0 && (
                    <ul className="-mx-1 border-t border-[#E7E5E1] pt-2" aria-label="Ver todas las universidades de una carrera">
                      {gruposSugeridos.map((g) => (
                        <li key={g.categoria}>
                          <button onClick={() => irAPaso2(g.categoria)} className={filaCls}>
                            <span className="text-sm text-[#0F172A]">
                              <span className="font-semibold"><Resaltado texto={nombreCategoria(g.categoria)} query={debounced} /></span>
                              <span className="text-[#64748B]"> · {g.carreras.length} universidades</span>
                            </span>
                            <ChevronRight size={16} className="shrink-0 text-[#94A3B8]" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {modo === 'pasos' && paso === 1 && (
            <div className="space-y-3">
              <div className="px-1 text-xs font-medium text-[#64748B]">Paso 1 de 2 · Elige la carrera</div>
              <CampoBusqueda value={queryCarrera} onChange={setQueryCarrera} placeholder="Busca la carrera…" label="Buscar carrera" />
              <ul className="-mx-1 max-h-80 overflow-y-auto" aria-label="Carreras">
                {categorias.slice(0, 120).map(({ categoria, n }) => (
                  <li key={categoria}>
                    <button onClick={() => irAPaso2(categoria)} className={filaCls}>
                      <span className="text-sm text-[#0F172A]">
                        <span className="font-semibold"><Resaltado texto={nombreCategoria(categoria)} query={queryCarrera} /></span>
                        <span className="text-[#64748B]"> · {n} universidad{n === 1 ? '' : 'es'}</span>
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-[#94A3B8]" aria-hidden />
                    </button>
                  </li>
                ))}
                {categorias.length === 0 && <li className="px-3 py-2 text-xs text-[#94A3B8]">Sin resultados.</li>}
              </ul>
            </div>
          )}

          {modo === 'pasos' && paso === 2 && (
            <div className="space-y-3">
              <button onClick={() => setCarreraPaso('')} className="inline-flex items-center gap-1 min-h-[44px] pr-3 text-sm font-medium text-[#2563EB] cursor-pointer" aria-label="Volver a elegir carrera">
                <ChevronLeft size={16} /> {nombreCategoria(carreraPaso)}
              </button>
              <div className="px-1 text-xs font-medium text-[#64748B]">Paso 2 de 2 · Elige la universidad (de corte más alto a más bajo)</div>
              <ul className="-mx-1 max-h-96 overflow-y-auto" aria-label="Universidades">
                {universidades.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => elegir(c)} className={filaCls} aria-label={`Elegir ${c.universidadNombre}, sede ${c.sedeNombre}`}>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0F172A] leading-snug">{c.universidadNombre}</span>
                        <span className="block text-[11px] text-[#94A3B8] mt-0.5">{c.sedeNombre} · {c.nombre}</span>
                      </span>
                      {corte(c)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="px-1 text-[11px] text-[#94A3B8]">Los cortes son de la Admisión 2026 y sirven solo como referencia.</p>
        </div>
      )}
    </Card>
  );
}

export default React.memo(TargetSelector);
