import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NotebookPen, Plus, ChartLine, Target, History, Download, Upload, Trash2, Hourglass, Check, ChevronDown } from 'lucide-react';
import Card from './Card';
import { tablasPAES } from '../data';
import { PRUEBAS as PRUEBAS_META, PRUEBAS_ORDEN, PruebaId } from '../constants';

interface Ensayo {
  id: string;
  prueba: PruebaId;
  puntaje: number;
  aciertos?: number; // respuestas correctas (si se registró por aciertos)
  fecha: string; // YYYY-MM-DD
  proveedor: string;
}

interface Store {
  ensayos: Ensayo[];
  metas: Partial<Record<PruebaId, number>>;
  cienciasModule: 'biologia' | 'fisica' | 'quimica';
}

const STORAGE_KEY = 'paes_ensayos_v1';

// Colores, etiquetas y máximos compartidos con el resto de la app.
const PRUEBAS = PRUEBAS_ORDEN.map((id) => PRUEBAS_META[id]);

const MODULO_LABEL: Record<Store['cienciasModule'], string> = { biologia: 'Biología', fisica: 'Física', quimica: 'Química' };

const PROVEEDORES = ['DEMRE', 'Puntaje Nacional', 'Preuniversitario', 'Colegio', 'Ensayos propios', 'Otro'];

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { ensayos: p.ensayos || [], metas: p.metas || {}, cienciasModule: p.cienciasModule || 'fisica' };
    }
  } catch {}
  return { ensayos: [], metas: {}, cienciasModule: 'fisica' };
}

function tablaDe(prueba: PruebaId, mod: Store['cienciasModule']): Record<number, number> {
  if (prueba === 'ciencias') return tablasPAES[`ciencias_${mod}` as 'ciencias_fisica'];
  return tablasPAES[prueba as 'lectora'];
}

// Min aciertos cuyo puntaje alcanza el objetivo
function aciertosParaPuntaje(tabla: Record<number, number>, objetivo: number): number {
  const entries = Object.entries(tabla).map(([a, p]) => [Number(a), p] as [number, number]).sort((x, y) => x[0] - y[0]);
  for (const [a, p] of entries) if (p >= objetivo) return a;
  return entries[entries.length - 1][0];
}
// Aciertos cuyo puntaje es más cercano al dado
function aciertosDePuntaje(tabla: Record<number, number>, puntaje: number): number {
  let best = 0, diff = Infinity;
  for (const [a, p] of Object.entries(tabla)) {
    const d = Math.abs(p - puntaje);
    if (d < diff) { diff = d; best = Number(a); }
  }
  return best;
}

const labelCls = 'text-[11px] font-medium text-[#64748B]';
const fieldCls =
  'w-full h-11 mt-1 px-3 bg-[#F4F3F1] rounded-xl text-sm font-medium text-[#0F172A] border border-transparent outline-none focus:border-[#2563EB] focus:bg-white transition-colors';
const btnSecCls =
  'inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] px-3 h-10 rounded-full border border-[#E7E5E1] transition-colors cursor-pointer';

function Encabezado({ icon: Icon, titulo, children, extra }: { icon: typeof Plus; titulo: string; children?: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-[#64748B]" />
          <h3 className="text-base font-semibold text-[#0F172A]">{titulo}</h3>
        </div>
        {children}
      </div>
      {extra}
    </div>
  );
}

function EnsayosSection() {
  const [store, setStore] = useState<Store>(loadStore);
  const [prueba, setPrueba] = useState<PruebaId>('lectora');
  const [aciertos, setAciertos] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [proveedor, setProveedor] = useState('DEMRE');
  const [chartMode, setChartMode] = useState<'lineas' | 'barras'>('lineas');
  const fileRef = useRef<HTMLInputElement>(null);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
  }, [store]);

  const pruebaMeta = PRUEBAS_META[prueba];
  // Puntaje calculado automáticamente desde las respuestas correctas
  // (misma tabla oficial que el simulador principal).
  const aciertosNum = parseInt(aciertos, 10);
  const aciertosValidos = !isNaN(aciertosNum) && aciertosNum >= 0 && aciertosNum <= pruebaMeta.max;
  const puntajeCalculado = aciertosValidos ? (tablaDe(prueba, store.cienciasModule)[aciertosNum] ?? null) : null;

  const addEnsayo = () => {
    if (puntajeCalculado === null) return;
    const e: Ensayo = { id: `${Date.now()}-${Math.round(puntajeCalculado)}`, prueba, puntaje: puntajeCalculado, aciertos: aciertosNum, fecha, proveedor };
    setStore((s) => ({ ...s, ensayos: [...s.ensayos, e] }));
    setAciertos('');
  };

  const delEnsayo = (id: string) => setStore((s) => ({ ...s, ensayos: s.ensayos.filter((e) => e.id !== id) }));
  const clearAll = () => { if (window.confirm('¿Borrar todo el historial de ensayos?')) setStore((s) => ({ ...s, ensayos: [] })); };
  const setMeta = (p: PruebaId, v: string) => {
    const n = parseInt(v, 10);
    setStore((s) => ({ ...s, metas: { ...s.metas, [p]: isNaN(n) ? undefined : n } }));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mis-ensayos-paes.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(String(reader.result));
        if (p && Array.isArray(p.ensayos)) setStore({ ensayos: p.ensayos, metas: p.metas || {}, cienciasModule: p.cienciasModule || 'fisica' });
      } catch { window.alert('Archivo inválido'); }
    };
    reader.readAsText(file);
  };

  // Resumen por prueba
  const resumen = useMemo(() => {
    const r: Record<PruebaId, { ultimo: number | null; max: number | null }> = {} as any;
    for (const p of PRUEBAS) {
      const list = store.ensayos.filter((e) => e.prueba === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
      r[p.id] = { ultimo: list.length ? list[list.length - 1].puntaje : null, max: list.length ? Math.max(...list.map((e) => e.puntaje)) : null };
    }
    return r;
  }, [store.ensayos]);

  const ordenados = [...store.ensayos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
  const hayDatos = store.ensayos.length > 0;

  return (
    <div className="space-y-6">
      {/* Registro */}
      <Card className="space-y-4">
        <Encabezado icon={NotebookPen} titulo="Registra tus ensayos">
          <p className="text-xs text-[#64748B] mt-1.5">El puntaje se calcula automáticamente con la tabla oficial de conversión.</p>
        </Encabezado>

        <div>
          <span className={labelCls}>Prueba</span>
          <div className="flex flex-wrap gap-1.5 mt-1" role="group" aria-label="Prueba">
            {PRUEBAS.map((p) => {
              const activo = prueba === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPrueba(p.id)}
                  aria-pressed={activo}
                  className={`inline-flex items-center gap-1.5 px-3 h-10 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    activo ? '' : 'bg-[#F4F3F1] border-transparent text-[#64748B] hover:text-[#0F172A]'
                  }`}
                  style={activo ? { background: p.tint, color: p.ink, borderColor: p.color } : undefined}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} aria-hidden />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Correctas (prioritario) + Puntaje (auto) */}
          <div>
            <label htmlFor="ensayo-correctas" className={labelCls}>Correctas (de {pruebaMeta.max})</label>
            <input
              id="ensayo-correctas"
              type="text" inputMode="numeric" value={aciertos}
              onChange={(e) => setAciertos(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder={`0-${pruebaMeta.max}`}
              aria-invalid={aciertos !== '' && !aciertosValidos}
              className={`${fieldCls} text-base font-semibold tabular-nums`}
            />
          </div>
          <div>
            <span className={labelCls}>Puntaje (auto)</span>
            <div className="w-full h-11 mt-1 px-3 border border-[#E7E5E1] rounded-xl flex items-center text-base font-bold tabular-nums" aria-live="polite">
              {puntajeCalculado !== null
                ? <span className="text-[#0F172A]">{puntajeCalculado}</span>
                : <span className="text-[#94A3B8] text-sm font-normal">—</span>}
            </div>
          </div>
          <div>
            <label htmlFor="ensayo-fecha" className={labelCls}>Fecha</label>
            <input id="ensayo-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="ensayo-proveedor" className={labelCls}>Proveedor</label>
            <div className="relative mt-1">
              <select id="ensayo-proveedor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} className={`${fieldCls} !mt-0 appearance-none pr-8 cursor-pointer`}>
                {PROVEEDORES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden />
            </div>
          </div>
        </div>
        {prueba === 'ciencias' && (
          <p className="text-[11px] text-[#94A3B8] -mt-1">Conversión según módulo de Ciencias: {MODULO_LABEL[store.cienciasModule]}.</p>
        )}
        {aciertos !== '' && !aciertosValidos && (
          <p className="text-[11px] text-[#DC2626] -mt-1">Ingresa un número entre 0 y {pruebaMeta.max}.</p>
        )}
        <button
          onClick={addEnsayo}
          disabled={puntajeCalculado === null}
          className="w-full h-11 inline-flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.2} /> Agregar ensayo
        </button>
      </Card>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {PRUEBAS.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-[#E7E5E1] p-3.5">
            <div className="flex items-center gap-1.5 mb-2 min-w-0">
              <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-xs font-medium truncate" style={{ color: p.ink }}>{p.label}</span>
            </div>
            <div className="text-[10px] text-[#94A3B8]">Último</div>
            <div className="text-lg font-bold text-[#0F172A] tabular-nums leading-tight">{resumen[p.id].ultimo ?? '—'}</div>
            <div className="text-[10px] text-[#94A3B8] mt-1">Máximo</div>
            <div className="text-sm font-semibold text-[#0F172A] tabular-nums">{resumen[p.id].max ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <Card className="space-y-4">
        <Encabezado
          icon={ChartLine}
          titulo="Evolución"
          extra={
            <div className="bg-[#F4F3F1] p-0.5 rounded-full flex gap-0.5 text-[11px] font-medium" role="group" aria-label="Tipo de gráfico">
              {(['lineas', 'barras'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMode(m)}
                  aria-pressed={chartMode === m}
                  className={`px-3 h-8 rounded-full transition-all cursor-pointer ${chartMode === m ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.1)]' : 'text-[#64748B]'}`}
                >
                  {m === 'lineas' ? 'Líneas' : 'Barras'}
                </button>
              ))}
            </div>
          }
        />
        {!hayDatos ? (
          <div className="flex flex-col items-center gap-2 text-center py-10 text-sm text-[#94A3B8] bg-[#F4F3F1] rounded-2xl">
            <Hourglass size={18} strokeWidth={1.8} />
            Sin ensayos aún. Registra uno para ver tu evolución.
          </div>
        ) : (
          <EnsayoChart ensayos={store.ensayos} mode={chartMode} resumen={resumen} />
        )}
        {/* Leyenda */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {PRUEBAS.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: p.ink }}>
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Meta inteligente */}
      <Card className="space-y-4">
        <Encabezado icon={Target} titulo="Cuántas buenas te faltan">
          <p className="text-xs text-[#64748B] mt-1.5">Fija tu puntaje objetivo por prueba; usamos tu último ensayo y las tablas oficiales de conversión.</p>
        </Encabezado>
        {store.ensayos.some((e) => e.prueba === 'ciencias') && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B] font-medium">Módulo de Ciencias</span>
            <div className="relative">
              <select
                value={store.cienciasModule}
                onChange={(e) => setStore((s) => ({ ...s, cienciasModule: e.target.value as Store['cienciasModule'] }))}
                className="h-10 pl-3 pr-8 bg-[#F4F3F1] rounded-xl text-xs font-medium text-[#0F172A] outline-none appearance-none cursor-pointer border border-transparent focus:border-[#2563EB]"
              >
                <option value="biologia">Biología</option><option value="fisica">Física</option><option value="quimica">Química</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden />
            </div>
          </div>
        )}
        <div className="space-y-2">
          {PRUEBAS.map((p) => {
            const ultimo = resumen[p.id].ultimo;
            const objetivo = store.metas[p.id];
            const tabla = tablaDe(p.id, store.cienciasModule);
            let contenido: React.ReactNode = null;
            if (ultimo === null) {
              contenido = <span className="text-[11px] text-[#94A3B8]">Sin ensayos de esta prueba aún.</span>;
            } else if (objetivo && objetivo > 0) {
              const aAct = aciertosDePuntaje(tabla, ultimo);
              const aObj = aciertosParaPuntaje(tabla, objetivo);
              const faltan = Math.max(0, aObj - aAct);
              const pct = Math.min(100, Math.round((aAct / Math.max(aObj, 1)) * 100));
              contenido = (
                <>
                  <div className="text-[11px] text-[#64748B]">
                    {faltan === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#166534] font-semibold">
                        <Check size={12} strokeWidth={2.5} /> Meta alcanzada: ya llegas a {objetivo} pts.
                      </span>
                    ) : (
                      <>Te faltan <strong className="text-[#0F172A] font-semibold">+{faltan} buenas</strong> (de {p.max}) para llegar a <strong className="text-[#0F172A] font-semibold tabular-nums">{objetivo} pts</strong>.</>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-[#ECEAE6] rounded-full overflow-hidden mt-1.5">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </>
              );
            } else {
              contenido = <span className="text-[11px] text-[#94A3B8]">Define tu puntaje objetivo.</span>;
            }
            return (
              <div key={p.id} className="rounded-2xl border border-[#E7E5E1] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-xs font-medium truncate" style={{ color: p.ink }}>{p.label}</span>
                  </div>
                  <input
                    type="text" inputMode="numeric" value={objetivo ?? ''} onChange={(e) => setMeta(p.id, e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                    placeholder="Meta" aria-label={`Puntaje meta en ${p.label}`}
                    className="w-20 h-10 px-2 bg-[#F4F3F1] rounded-xl text-sm font-semibold text-center tabular-nums outline-none border border-transparent focus:border-[#2563EB] focus:bg-white shrink-0"
                  />
                </div>
                <div className="mt-1.5 min-w-0">{contenido}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Historial */}
      <Card className="space-y-3">
        <Encabezado
          icon={History}
          titulo="Historial reciente"
          extra={
            <div className="flex flex-wrap gap-2">
              <button onClick={exportJson} className={btnSecCls}><Download size={14} /> Exportar</button>
              <button onClick={() => fileRef.current?.click()} className={btnSecCls}><Upload size={14} /> Importar</button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
              {hayDatos && (
                <button onClick={clearAll} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#991B1B] px-3 h-10 rounded-full border border-[#FECACA] hover:bg-[#FEE2E2] transition-colors cursor-pointer">
                  <Trash2 size={14} /> Limpiar
                </button>
              )}
            </div>
          }
        />
        {!hayDatos ? (
          <p className="text-sm text-[#94A3B8] py-4 text-center">Aún no registras ensayos.</p>
        ) : (
          <div className="divide-y divide-[#E7E5E1]">
            {ordenados.map((e) => {
              const meta = PRUEBAS_META[e.prueba];
              return (
                <div key={e.id} className="flex items-center gap-3 py-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#0F172A]">
                      <span className="font-medium" style={{ color: meta.ink }}>{meta.label}</span>
                      <span className="text-[#94A3B8]"> · </span>
                      <span className="font-bold tabular-nums">{e.puntaje}</span>
                      {e.aciertos != null && <span className="text-[11px] text-[#94A3B8] tabular-nums"> ({e.aciertos}/{meta.max} correctas)</span>}
                    </div>
                    <div className="text-[11px] text-[#94A3B8] tabular-nums">{e.fecha} · {e.proveedor}</div>
                  </div>
                  <button
                    onClick={() => delEnsayo(e.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors shrink-0 cursor-pointer"
                    title="Eliminar"
                    aria-label="Eliminar ensayo"
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- Lightweight SVG chart (no external deps) ----
function EnsayoChart({ ensayos, mode, resumen }: { ensayos: Ensayo[]; mode: 'lineas' | 'barras'; resumen: Record<PruebaId, { ultimo: number | null; max: number | null }> }) {
  const W = 520, H = 200, padL = 34, padB = 22, padT = 10, padR = 10;
  const yMin = 100, yMax = 1000;
  const yToPx = (v: number) => padT + (H - padT - padB) * (1 - (v - yMin) / (yMax - yMin));
  const gridVals = [100, 300, 500, 700, 900];
  const gridStroke = 'rgba(148,163,184,0.25)';

  if (mode === 'barras') {
    const bars = PRUEBAS.map((p) => ({ ...p, val: resumen[p.id].ultimo }));
    const bw = (W - padL - padR) / bars.length;
    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[420px]" preserveAspectRatio="xMidYMid meet">
          {gridVals.map((g) => (
            <g key={g}><line x1={padL} y1={yToPx(g)} x2={W - padR} y2={yToPx(g)} stroke={gridStroke} /><text x={4} y={yToPx(g) + 3} fontSize="9" fill="#94A3B8">{g}</text></g>
          ))}
          {bars.map((b, i) => b.val !== null && (
            <g key={b.id}>
              <rect x={padL + i * bw + bw * 0.2} y={yToPx(b.val)} width={bw * 0.6} height={H - padB - yToPx(b.val)} rx={4} fill={b.color} />
              <text x={padL + i * bw + bw / 2} y={yToPx(b.val) - 4} fontSize="9" fill="currentColor" className="text-[#0F172A]" textAnchor="middle" fontWeight="bold">{b.val}</text>
              <text x={padL + i * bw + bw / 2} y={H - 8} fontSize="9" fill="#64748B" textAnchor="middle">{b.short}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  // Líneas: por prueba, ordenado por fecha
  const fechas = [...new Set(ensayos.map((e) => e.fecha))].sort();
  const xToPx = (fecha: string) => {
    if (fechas.length <= 1) return padL + (W - padL - padR) / 2;
    const i = fechas.indexOf(fecha);
    return padL + (W - padL - padR) * (i / (fechas.length - 1));
  };
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[420px]" preserveAspectRatio="xMidYMid meet">
        {gridVals.map((g) => (
          <g key={g}><line x1={padL} y1={yToPx(g)} x2={W - padR} y2={yToPx(g)} stroke={gridStroke} /><text x={4} y={yToPx(g) + 3} fontSize="9" fill="#94A3B8">{g}</text></g>
        ))}
        {PRUEBAS.map((p) => {
          const pts = ensayos.filter((e) => e.prueba === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
          if (pts.length === 0) return null;
          const d = pts.map((e, i) => `${i === 0 ? 'M' : 'L'} ${xToPx(e.fecha).toFixed(1)} ${yToPx(e.puntaje).toFixed(1)}`).join(' ');
          return (
            <g key={p.id}>
              {pts.length > 1 && <path d={d} fill="none" stroke={p.color} strokeWidth={2} strokeLinejoin="round" />}
              {pts.map((e) => <circle key={e.id} cx={xToPx(e.fecha)} cy={yToPx(e.puntaje)} r={3.5} fill={p.color} />)}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default React.memo(EnsayosSection);
