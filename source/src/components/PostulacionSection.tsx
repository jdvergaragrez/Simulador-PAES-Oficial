import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, X, Check, Clock, Minus, CircleX, ListOrdered, Info } from 'lucide-react';
import Card from './Card';
import SearchableSelect from './SearchableSelect';
import { CarreraConDetalle } from '../types';
import { displayNombreUniversidad } from '../data';
import { buscarIds } from '../busqueda';

interface Props {
  carreras: CarreraConDetalle[];
  categoriaDisplay: Record<string, string>;
  ponderadoDe: (c: CarreraConDetalle) => number | null;
  anioCortes: number;
  sinPuntajes: boolean;
  onOpenDetail: (c: CarreraConDetalle) => void;
}

const STORAGE_KEY = 'paes_postulacion_v1';
const MAX = 20;
// Margen bajo el corte en que lo más probable es quedar en lista de espera (estimación, no regla oficial).
const MARGEN_ESPERA = 15;

const fmt = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Estado = 'seleccionado' | 'espera' | 'noalcanza' | 'requisito' | 'sindato' | 'liberada';

const ESTADO_UI: Record<Estado, { label: string; color: string; icon: typeof Check }> = {
  seleccionado: { label: 'Quedarías seleccionado', color: 'var(--e-alcanzable-ink)', icon: Check },
  espera: { label: 'Lista de espera probable', color: 'var(--e-limite-ink)', icon: Clock },
  noalcanza: { label: 'No alcanzas el corte', color: 'var(--e-noalcanza-ink)', icon: CircleX },
  requisito: { label: 'No cumples el mínimo para postular', color: 'var(--e-noalcanza-ink)', icon: CircleX },
  sindato: { label: 'Sin corte de referencia', color: 'var(--e-sindato-ink)', icon: Minus },
  liberada: { label: 'No se usa: ya quedas en una preferencia anterior', color: 'var(--e-sindato-ink)', icon: Minus },
};

function cargar(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function PostulacionSection({ carreras, categoriaDisplay, ponderadoDe, anioCortes, sinPuntajes, onOpenDetail }: Props) {
  const [ids, setIds] = useState<string[]>(cargar);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
  }, [ids]);

  const porId = useMemo(() => new Map(carreras.map((c) => [c.id, c])), [carreras]);
  const opciones = useMemo(
    () => carreras.filter((c) => c.ponderacion && !ids.includes(c.id)).map((c) => ({ value: c.id, label: c.nombre, sublabel: displayNombreUniversidad(c) })),
    [carreras, ids]
  );
  const buscar = useCallback((q: string) => buscarIds(carreras, categoriaDisplay, q).filter((id) => !ids.includes(id)), [carreras, categoriaDisplay, ids]);

  const agregar = (id: string) => { if (id && !ids.includes(id) && ids.length < MAX) setIds((l) => [...l, id]); };
  const quitar = (id: string) => setIds((l) => l.filter((x) => x !== id));
  const mover = (i: number, d: -1 | 1) => setIds((l) => {
    const j = i + d;
    if (j < 0 || j >= l.length) return l;
    const n = [...l];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });

  // Igual que en el sistema de admisión: quedas en la preferencia más alta donde alcanzas,
  // y las de más abajo se liberan. En las de más arriba puedes quedar en lista de espera.
  const filas = useMemo(() => {
    let yaSeleccionado = false;
    return ids.map((id) => porId.get(id)).filter((c): c is CarreraConDetalle => !!c).map((c) => {
      const p = ponderadoDe(c);
      const corte = c.puntajeCorte;
      let estado: Estado;
      if (yaSeleccionado) estado = 'liberada';
      else if (p === null) estado = 'sindato';
      else if (c.ponderadoMinimo != null && p < c.ponderadoMinimo) estado = 'requisito';
      else if (corte === null) estado = 'sindato';
      else if (p >= corte) { estado = 'seleccionado'; yaSeleccionado = true; }
      else if (corte - p <= MARGEN_ESPERA) estado = 'espera';
      else estado = 'noalcanza';
      return { c, p, corte, estado };
    });
  }, [ids, porId, ponderadoDe]);

  const elegida = filas.findIndex((f) => f.estado === 'seleccionado');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.025em] leading-tight text-[#0F172A]">Mi postulación</h1>
        <p className="text-sm text-[#64748B] mt-1 max-w-xl">
          Ordena hasta {MAX} carreras como las pondrías en tu postulación y mira en cuál quedarías con tus puntajes.
        </p>
      </div>

      {/* Resumen */}
      {filas.length > 0 && !sinPuntajes && (
        <Card className="text-center">
          {elegida >= 0 ? (
            <>
              <div className="text-xs text-[#64748B]">Con tus puntajes quedarías en tu preferencia {elegida + 1}</div>
              <div className="text-xl font-semibold tracking-[-0.01em] text-[#0F172A] mt-1">{filas[elegida].c.nombre}</div>
              <div className="text-sm text-[#64748B]">{displayNombreUniversidad(filas[elegida].c)}</div>
              <div className="text-sm mt-2 tabular-nums" style={{ color: 'var(--e-alcanzable-ink)' }}>
                {fmt(filas[elegida].p! - filas[elegida].corte!)} pts sobre el corte {anioCortes}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-[#64748B]">Con tus puntajes</div>
              <div className="text-xl font-semibold tracking-[-0.01em] text-[#0F172A] mt-1">Todavía no quedas en ninguna</div>
              <div className="text-sm text-[#64748B] mt-1">Agrega opciones con cortes más cercanos a tu ponderado para asegurar un lugar.</div>
            </>
          )}
        </Card>
      )}

      {sinPuntajes && (
        <div className="rounded-2xl bg-[#EEF4FF] text-[#1E40AF] text-sm px-4 py-3 flex items-start gap-2">
          <Info size={16} className="shrink-0 mt-0.5" />
          Ingresa tus notas y puntajes en "Mi puntaje" para ver en cuál quedarías. Igual puedes armar tu lista.
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2FE] text-[#2563EB] flex items-center justify-center"><ListOrdered size={18} /></div>
            <div>
              <div className="text-base font-semibold text-[#0F172A]">Tus preferencias</div>
              <div className="text-xs text-[#64748B] tabular-nums">{ids.length} de {MAX}</div>
            </div>
          </div>
        </div>

        {ids.length < MAX && (
          <SearchableSelect
            options={opciones}
            value=""
            onChange={agregar}
            buscar={buscar}
            placeholder="Agregar carrera: medicina uc, ing civil usach…"
            ariaLabel="Agregar carrera a tu postulación"
          />
        )}

        {filas.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-6">Busca y agrega la carrera que pondrías en primer lugar.</p>
        ) : (
          <ol>
            {filas.map(({ c, p, corte, estado }, i) => {
              const ui = ESTADO_UI[estado];
              const Icon = ui.icon;
              const destacada = estado === 'seleccionado';
              return (
                <li
                  key={c.id}
                  className={`flex items-center gap-3 py-3 border-t border-[#EEF1F5] first:border-t-0 ${destacada ? 'bg-[#F0FBF4] -mx-5 md:-mx-6 px-5 md:px-6' : ''} ${estado === 'liberada' ? 'opacity-55' : ''}`}
                >
                  <div className="w-7 text-center text-sm font-semibold tabular-nums text-[#94A3B8] shrink-0">{i + 1}</div>
                  <button onClick={() => onOpenDetail(c)} className="flex-1 min-w-0 text-left cursor-pointer">
                    <div className="text-sm font-medium text-[#0F172A] truncate">{c.nombre}</div>
                    <div className="text-xs text-[#64748B] truncate">{displayNombreUniversidad(c)}</div>
                    {!sinPuntajes && (
                      <div className="text-xs mt-0.5 inline-flex items-center gap-1" style={{ color: ui.color }}>
                        <Icon size={12} strokeWidth={2.4} /> {ui.label}
                      </div>
                    )}
                  </button>
                  <div className="text-right shrink-0 tabular-nums hidden sm:block">
                    {p !== null && <div className="text-sm font-semibold text-[#0F172A]">{fmt(p)}</div>}
                    <div className="text-[11px] text-[#94A3B8]">{corte !== null ? `corte ${fmt(corte)}` : 'sin corte'}</div>
                  </div>
                  <div className="flex flex-col shrink-0">
                    <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${c.nombre}`} className="w-8 h-6 flex items-center justify-center text-[#64748B] disabled:opacity-25 cursor-pointer"><ChevronUp size={16} /></button>
                    <button onClick={() => mover(i, 1)} disabled={i === filas.length - 1} aria-label={`Bajar ${c.nombre}`} className="w-8 h-6 flex items-center justify-center text-[#64748B] disabled:opacity-25 cursor-pointer"><ChevronDown size={16} /></button>
                  </div>
                  <button onClick={() => quitar(c.id)} aria-label={`Quitar ${c.nombre}`} className="w-9 h-9 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] shrink-0 cursor-pointer">
                    <X size={16} />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <p className="text-xs text-[#64748B] leading-relaxed">
        Estimación con los cortes {anioCortes}: quedas en la preferencia más alta donde superas el corte y las de más abajo no se usan.
        "Lista de espera probable" significa que estás a menos de {MARGEN_ESPERA} pts del corte. Los cortes reales de este año se conocen al publicarse los resultados.
      </p>
    </div>
  );
}

export default React.memo(PostulacionSection);
