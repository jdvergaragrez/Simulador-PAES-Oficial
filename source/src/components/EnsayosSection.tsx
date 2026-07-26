import React, { useEffect, useMemo, useRef, useState } from 'react';
import Card from './Card';
import { tablasPAES } from '../data';

type PruebaId = 'lectora' | 'm1' | 'm2' | 'ciencias' | 'historia';

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

const PRUEBAS: { id: PruebaId; label: string; color: string; max: number }[] = [
  { id: 'lectora', label: 'C. Lectora', color: '#3B82F6', max: 60 },
  { id: 'm1', label: 'M1', color: '#10B981', max: 60 },
  { id: 'm2', label: 'M2', color: '#F59E0B', max: 49 },
  { id: 'ciencias', label: 'Ciencias', color: '#8B5CF6', max: 75 },
  { id: 'historia', label: 'Historia', color: '#EC4899', max: 60 },
];

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

  const pruebaMeta = PRUEBAS.find((p) => p.id === prueba)!;
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
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">MONITOR DE ENSAYOS</div>
          <h3 className="text-lg font-bold text-[#0F172A]">📚 Registra tus ensayos</h3>
          <p className="text-xs text-[#64748B] mt-1">El puntaje se calcula automáticamente con la tabla oficial de conversión.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold uppercase text-[#94A3B8]">Prueba</label>
            <select value={prueba} onChange={(e) => setPrueba(e.target.value as PruebaId)} className="w-full h-12 mt-1 px-2 bg-[#F5F7FA] rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-[#3B82F6]">
              {PRUEBAS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          {/* Correctas (izquierda, prioritario) + Puntaje (derecha, auto) */}
          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-[#3B82F6]">Correctas / {pruebaMeta.max}</label>
              <input
                type="text" inputMode="numeric" value={aciertos}
                onChange={(e) => setAciertos(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                placeholder={`0-${pruebaMeta.max}`}
                className="w-full h-12 mt-1 px-3 bg-[#F5F7FA] rounded-lg text-base font-bold outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-[#94A3B8]">Puntaje (auto)</label>
              <div className="w-full h-12 mt-1 px-3 bg-[#F1F5F9] rounded-lg flex items-center font-bold text-base font-mono tabular-nums" aria-live="polite">
                {puntajeCalculado !== null
                  ? <span className="text-[#10B981]">{puntajeCalculado}</span>
                  : <span className="text-[#94A3B8] text-sm font-sans font-normal">—</span>}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[#94A3B8]">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full h-12 mt-1 px-2 bg-[#F5F7FA] rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-[#3B82F6]" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[#94A3B8]">Proveedor</label>
            <select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="w-full h-12 mt-1 px-2 bg-[#F5F7FA] rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-[#3B82F6]">
              {PROVEEDORES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        {prueba === 'ciencias' && (
          <p className="text-[11px] text-[#94A3B8] -mt-1">Conversión según módulo de Ciencias: {store.cienciasModule}.</p>
        )}
        {aciertos !== '' && !aciertosValidos && (
          <p className="text-[11px] text-[#EF4444] -mt-1">Ingresa un número entre 0 y {pruebaMeta.max}.</p>
        )}
        <button onClick={addEnsayo} disabled={puntajeCalculado === null} className="w-full h-12 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors active:scale-[0.99]">
          + Agregar ensayo
        </button>
      </Card>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {PRUEBAS.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-[#F1F5F9] p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-xs font-bold text-[#0F172A]">{p.label}</span>
            </div>
            <div className="text-[10px] text-[#94A3B8]">Último</div>
            <div className="text-lg font-extrabold text-[#0F172A] font-mono leading-none">{resumen[p.id].ultimo ?? '—'}</div>
            <div className="text-[10px] text-[#94A3B8] mt-1">Máximo</div>
            <div className="text-sm font-bold text-[#10B981] font-mono">{resumen[p.id].max ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0F172A]">Evolución</h3>
          <div className="bg-[#F5F7FA] p-1 rounded-lg flex gap-1">
            {(['lineas', 'barras'] as const).map((m) => (
              <button key={m} onClick={() => setChartMode(m)} className={`px-3 h-8 rounded-md text-xs font-semibold transition-all ${chartMode === m ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}>
                {m === 'lineas' ? 'Líneas' : 'Barras'}
              </button>
            ))}
          </div>
        </div>
        {!hayDatos ? (
          <div className="text-center py-10 text-sm text-[#94A3B8] bg-slate-50 rounded-2xl">⏳ Sin ensayos aún — registra uno para ver tu evolución.</div>
        ) : (
          <EnsayoChart ensayos={store.ensayos} mode={chartMode} resumen={resumen} />
        )}
        {/* Leyenda */}
        <div className="flex flex-wrap gap-3">
          {PRUEBAS.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Meta inteligente */}
      <Card className="space-y-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">META INTELIGENTE</div>
          <h3 className="text-lg font-bold text-[#0F172A]">¿Cuántas buenas te faltan?</h3>
          <p className="text-xs text-[#64748B] mt-1">Fija tu puntaje objetivo por prueba; usamos tu último ensayo y las tablas oficiales de conversión.</p>
        </div>
        {store.ensayos.some((e) => e.prueba === 'ciencias') && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B] font-medium">Módulo de Ciencias:</span>
            <select value={store.cienciasModule} onChange={(e) => setStore((s) => ({ ...s, cienciasModule: e.target.value as Store['cienciasModule'] }))} className="h-8 px-2 bg-[#F5F7FA] rounded-lg text-xs font-semibold outline-none">
              <option value="biologia">Biología</option><option value="fisica">Física</option><option value="quimica">Química</option>
            </select>
          </div>
        )}
        <div className="space-y-4">
          {PRUEBAS.map((p) => {
            const ultimo = resumen[p.id].ultimo;
            const objetivo = store.metas[p.id];
            const tabla = tablaDe(p.id, store.cienciasModule);
            let contenido: React.ReactNode = null;
            if (ultimo === null) {
              contenido = <span className="text-[11px] text-[#94A3B8]">⏳ Sin ensayos de esta prueba aún.</span>;
            } else if (objetivo && objetivo > 0) {
              const aAct = aciertosDePuntaje(tabla, ultimo);
              const aObj = aciertosParaPuntaje(tabla, objetivo);
              const faltan = Math.max(0, aObj - aAct);
              const pct = Math.min(100, Math.round((aAct / Math.max(aObj, 1)) * 100));
              contenido = (
                <>
                  <div className="text-[11px] text-[#64748B]">
                    {faltan === 0 ? (
                      <span className="text-[#10B981] font-semibold">¡Meta alcanzada! Ya llegas a {objetivo} pts.</span>
                    ) : (
                      <>Te faltan <strong className="text-[#0F172A] font-bold">+{faltan} buenas</strong> (de {p.max}) para llegar a <strong className="text-[#0F172A] font-bold">{objetivo} pts</strong>.</>
                    )}
                  </div>
                  <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden mt-1">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </>
              );
            } else {
              contenido = <span className="text-[11px] text-[#94A3B8]">Define tu puntaje objetivo →</span>;
            }
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-20 shrink-0 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-xs font-bold text-[#0F172A]">{p.label}</span>
                </div>
                <div className="flex-1 min-w-0">{contenido}</div>
                <input
                  type="text" inputMode="numeric" value={objetivo ?? ''} onChange={(e) => setMeta(p.id, e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="meta" className="w-16 h-9 px-2 bg-[#F5F7FA] rounded-lg text-sm font-semibold text-center outline-none focus:ring-2 focus:ring-[#3B82F6] shrink-0"
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Historial */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0F172A]">Historial reciente</h3>
          <div className="flex gap-2">
            <button onClick={exportJson} className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] px-2 h-8 rounded-lg border border-[#E2E8F0]">Exportar</button>
            <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] px-2 h-8 rounded-lg border border-[#E2E8F0]">Importar</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
            {hayDatos && <button onClick={clearAll} className="text-xs font-semibold text-[#EF4444] px-2 h-8 rounded-lg border border-red-100 hover:bg-red-50">🗑️ Limpiar</button>}
          </div>
        </div>
        {!hayDatos ? (
          <p className="text-sm text-[#94A3B8] py-4 text-center">Aún no registras ensayos.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {ordenados.map((e) => {
              const meta = PRUEBAS.find((p) => p.id === e.prueba)!;
              return (
                <div key={e.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#0F172A]">
                      {meta.label} · <span className="font-mono">{e.puntaje}</span>
                      {e.aciertos != null && <span className="text-[11px] text-[#94A3B8] font-normal font-mono"> ({e.aciertos}/{meta.max} correctas)</span>}
                    </div>
                    <div className="text-[11px] text-[#94A3B8]">{e.fecha} · {e.proveedor}</div>
                  </div>
                  <button onClick={() => delEnsayo(e.id)} className="text-[#CBD5E1] hover:text-[#EF4444] transition-colors shrink-0" title="Eliminar">🗑️</button>
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

  if (mode === 'barras') {
    const bars = PRUEBAS.map((p) => ({ ...p, val: resumen[p.id].ultimo }));
    const bw = (W - padL - padR) / bars.length;
    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[420px]" preserveAspectRatio="xMidYMid meet">
          {gridVals.map((g) => (
            <g key={g}><line x1={padL} y1={yToPx(g)} x2={W - padR} y2={yToPx(g)} stroke="#F1F5F9" /><text x={4} y={yToPx(g) + 3} fontSize="9" fill="#94A3B8">{g}</text></g>
          ))}
          {bars.map((b, i) => b.val !== null && (
            <g key={b.id}>
              <rect x={padL + i * bw + bw * 0.2} y={yToPx(b.val)} width={bw * 0.6} height={H - padB - yToPx(b.val)} rx={4} fill={b.color} />
              <text x={padL + i * bw + bw / 2} y={yToPx(b.val) - 4} fontSize="9" fill="#0F172A" textAnchor="middle" fontWeight="bold">{b.val}</text>
              <text x={padL + i * bw + bw / 2} y={H - 8} fontSize="9" fill="#64748B" textAnchor="middle">{b.label}</text>
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
          <g key={g}><line x1={padL} y1={yToPx(g)} x2={W - padR} y2={yToPx(g)} stroke="#F1F5F9" /><text x={4} y={yToPx(g) + 3} fontSize="9" fill="#94A3B8">{g}</text></g>
        ))}
        {PRUEBAS.map((p) => {
          const pts = ensayos.filter((e) => e.prueba === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
          if (pts.length === 0) return null;
          const d = pts.map((e, i) => `${i === 0 ? 'M' : 'L'} ${xToPx(e.fecha).toFixed(1)} ${yToPx(e.puntaje).toFixed(1)}`).join(' ');
          return (
            <g key={p.id}>
              {pts.length > 1 && <path d={d} fill="none" stroke={p.color} strokeWidth={2} strokeLinejoin="round" />}
              {pts.map((e) => <circle key={e.id} cx={xToPx(e.fecha)} cy={yToPx(e.puntaje)} r={3} fill={p.color} />)}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default React.memo(EnsayosSection);
