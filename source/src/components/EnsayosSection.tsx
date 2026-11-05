import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Minus, Download, Upload, Trash2, X, Target, Check, ChevronDown } from 'lucide-react';
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

// Mínimo de correctas cuyo puntaje alcanza el objetivo
function aciertosParaPuntaje(tabla: Record<number, number>, objetivo: number): number {
  const entries = Object.entries(tabla).map(([a, p]) => [Number(a), p] as [number, number]).sort((x, y) => x[0] - y[0]);
  for (const [a, p] of entries) if (p >= objetivo) return a;
  return entries[entries.length - 1][0];
}
// Correctas cuyo puntaje es el más cercano al dado
function aciertosDePuntaje(tabla: Record<number, number>, puntaje: number): number {
  let best = 0, diff = Infinity;
  for (const [a, p] of Object.entries(tabla)) {
    const d = Math.abs(p - puntaje);
    if (d < diff) { diff = d; best = Number(a); }
  }
  return best;
}

const FECHA_LARGA = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' });
const FECHA_CORTA = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });
const aFecha = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const btnSecCls = 'inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] px-3 h-10 rounded-xl hover:bg-[#F2F4F7] cursor-pointer';

function EnsayosSection() {
  const [store, setStore] = useState<Store>(loadStore);
  const [prueba, setPrueba] = useState<PruebaId>(() => {
    const ult = [...loadStore().ensayos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    return ult?.prueba ?? 'lectora';
  });
  const [registrando, setRegistrando] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
  }, [store]);

  const porPrueba = useMemo(() => {
    const r = {} as Record<PruebaId, Ensayo[]>;
    for (const p of PRUEBAS) r[p.id] = store.ensayos.filter((e) => e.prueba === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));
    return r;
  }, [store.ensayos]);

  const meta = PRUEBAS_META[prueba];
  const lista = porPrueba[prueba];
  const ultimo = lista.length ? lista[lista.length - 1] : null;
  const anterior = lista.length > 1 ? lista[lista.length - 2] : null;
  const objetivo = store.metas[prueba];
  const tabla = tablaDe(prueba, store.cienciasModule);
  const faltanBuenas = ultimo && objetivo ? Math.max(0, aciertosParaPuntaje(tabla, objetivo) - (ultimo.aciertos ?? aciertosDePuntaje(tabla, ultimo.puntaje))) : null;

  const agregar = (e: Omit<Ensayo, 'id' | 'prueba'>) => {
    setStore((s) => ({ ...s, ensayos: [...s.ensayos, { ...e, prueba, id: `${Date.now()}-${Math.round(e.puntaje)}` }] }));
  };
  const borrar = (id: string) => setStore((s) => ({ ...s, ensayos: s.ensayos.filter((e) => e.id !== id) }));
  const limpiar = () => { if (window.confirm('¿Borrar todo el historial de ensayos?')) setStore((s) => ({ ...s, ensayos: [] })); };
  const fijarMeta = (v: string) => {
    const n = parseInt(v, 10);
    setStore((s) => ({ ...s, metas: { ...s.metas, [prueba]: isNaN(n) ? undefined : Math.min(1000, n) } }));
  };

  const exportar = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mis-ensayos-paes.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const importar = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(String(reader.result));
        if (p && Array.isArray(p.ensayos)) setStore({ ensayos: p.ensayos, metas: p.metas || {}, cienciasModule: p.cienciasModule || 'fisica' });
      } catch { window.alert('Archivo inválido'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.025em] leading-tight text-[#0F172A]">Mis ensayos</h1>
        <p className="text-sm text-[#64748B] mt-1">Registra tus ensayos y mira cómo avanzas en cada prueba.</p>
      </div>

      {/* Pruebas: una tarjeta por prueba, se elige tocándola */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-5 snap-x">
        {PRUEBAS.map((p) => {
          const ens = porPrueba[p.id];
          const activo = p.id === prueba;
          return (
            <button
              key={p.id}
              onClick={() => { setPrueba(p.id); setEditandoMeta(false); }}
              aria-pressed={activo}
              className={`snap-start shrink-0 w-[132px] md:w-auto text-left rounded-2xl p-3.5 cursor-pointer border ${
                activo ? 'bg-white border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]' : 'bg-white border-[#E8ECF1] hover:bg-[#F7F8FA]'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="text-xs font-medium text-[#475569] truncate">{p.label}</span>
              </div>
              <div className="text-2xl font-semibold tabular-nums tracking-[-0.02em] text-[#0F172A] mt-2 leading-none">
                {ens.length ? ens[ens.length - 1].puntaje : '—'}
              </div>
              <div className="text-[11px] text-[#94A3B8] mt-1">{ens.length === 1 ? '1 ensayo' : `${ens.length} ensayos`}</div>
            </button>
          );
        })}
      </div>

      {/* Detalle de la prueba elegida */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-5 md:px-6 pt-5 pb-6" style={{ background: `linear-gradient(180deg, ${meta.tint} 0%, transparent 100%)` }}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-[#0F172A]">{meta.label}</div>
            <button
              onClick={() => setRegistrando(true)}
              className="inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold cursor-pointer"
            >
              <Plus size={17} strokeWidth={2.4} /> Registrar
            </button>
          </div>
          <div className="text-center mt-4">
            <div className="text-[64px] font-semibold tabular-nums tracking-[-0.04em] text-[#0F172A] leading-none" aria-live="polite">
              {ultimo ? ultimo.puntaje : '—'}
            </div>
            <div className="text-xs text-[#64748B] mt-2">
              {ultimo
                ? <>Último ensayo · {FECHA_LARGA.format(aFecha(ultimo.fecha))}{anterior && <> · <span className="font-semibold tabular-nums" style={{ color: ultimo.puntaje >= anterior.puntaje ? 'var(--e-alcanzable-ink)' : 'var(--e-noalcanza-ink)' }}>{ultimo.puntaje >= anterior.puntaje ? '+' : '−'}{Math.abs(ultimo.puntaje - anterior.puntaje)} pts</span></>}</>
                : 'Aún no registras ensayos de esta prueba'}
            </div>
          </div>
        </div>

        <div className="px-5 md:px-6 pb-5 space-y-5">
          {/* Evolución */}
          {lista.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-[#0F172A] mb-2">Tu evolución</div>
              <Evolucion lista={lista} meta={objetivo} color={meta.color} />
            </div>
          )}

          {/* Meta */}
          <div className="rounded-2xl bg-[#F2F4F7] p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2FE] text-[#2563EB] flex items-center justify-center shrink-0"><Target size={18} /></div>
            <div className="flex-1 min-w-0 text-sm">
              {editandoMeta ? (
                <input
                  autoFocus type="text" inputMode="numeric" defaultValue={objetivo ?? ''}
                  onBlur={(e) => { fijarMeta(e.target.value.replace(/[^0-9]/g, '')); setEditandoMeta(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  placeholder="Ej: 800" aria-label={`Puntaje meta en ${meta.label}`}
                  className="w-28 h-10 px-3 bg-white rounded-xl text-base font-semibold tabular-nums outline-none border border-[#2563EB]"
                />
              ) : objetivo ? (
                <>
                  <div className="text-[#0F172A]">Meta <strong className="font-semibold tabular-nums">{objetivo} pts</strong></div>
                  <div className="text-xs text-[#64748B]">
                    {faltanBuenas === null ? 'Registra un ensayo para ver cuánto te falta'
                      : faltanBuenas === 0 ? <span className="inline-flex items-center gap-1" style={{ color: 'var(--e-alcanzable-ink)' }}><Check size={12} strokeWidth={2.5} /> Ya llegas a tu meta</span>
                      : <>Te faltan <strong className="font-semibold text-[#0F172A]">{faltanBuenas} buenas</strong> más</>}
                  </div>
                </>
              ) : (
                <div className="text-[#64748B]">Define tu puntaje meta en {meta.label}</div>
              )}
            </div>
            {!editandoMeta && (
              <button onClick={() => setEditandoMeta(true)} className="text-sm font-semibold text-[#2563EB] px-2 h-10 cursor-pointer shrink-0">
                {objetivo ? 'Editar' : 'Definir'}
              </button>
            )}
          </div>

          {/* Lista de ensayos */}
          <div>
            <div className="text-sm font-semibold text-[#0F172A] mb-1">Ensayos</div>
            {lista.length === 0 ? (
              <button
                onClick={() => setRegistrando(true)}
                className="w-full rounded-2xl border border-dashed border-[#E8ECF1] py-8 text-sm text-[#64748B] hover:bg-[#F7F8FA] cursor-pointer"
              >
                Registra tu primer ensayo de {meta.label}
              </button>
            ) : (
              <ul>
                {[...lista].reverse().map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2.5 border-t border-[#EEF1F5] first:border-t-0 group">
                    <div className="w-14 h-11 rounded-xl flex items-center justify-center text-base font-semibold tabular-nums shrink-0" style={{ background: meta.tint, color: meta.ink }}>
                      {e.puntaje}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#0F172A] first-letter:uppercase">{FECHA_LARGA.format(aFecha(e.fecha))}</div>
                      <div className="text-xs text-[#94A3B8] truncate">{e.proveedor}</div>
                    </div>
                    {e.aciertos != null && <div className="text-xs text-[#64748B] tabular-nums shrink-0">{e.aciertos} correctas</div>}
                    <button
                      onClick={() => borrar(e.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] shrink-0 cursor-pointer"
                      aria-label={`Eliminar ensayo del ${FECHA_LARGA.format(aFecha(e.fecha))}`}
                    >
                      <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* Respaldo */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button onClick={exportar} className={btnSecCls}><Download size={14} /> Exportar</button>
        <button onClick={() => fileRef.current?.click()} className={btnSecCls}><Upload size={14} /> Importar</button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = ''; }} />
        {store.ensayos.length > 0 && <button onClick={limpiar} className={`${btnSecCls} !text-[#991B1B]`}><Trash2 size={14} /> Borrar todo</button>}
      </div>

      {/* Sin AnimatePresence: bajo React 19 StrictMode su salida no termina. La hoja anima su propia salida. */}
      {registrando && (
        <HojaRegistro
          prueba={prueba}
          cienciasModule={store.cienciasModule}
          onCambiarModulo={(m) => setStore((s) => ({ ...s, cienciasModule: m }))}
          onGuardar={agregar}
          onCerrar={() => setRegistrando(false)}
        />
      )}
    </div>
  );
}

// ---- Hoja para registrar un ensayo (sube desde abajo, como en iOS) ----
function HojaRegistro({ prueba, cienciasModule, onCambiarModulo, onGuardar, onCerrar }: {
  prueba: PruebaId;
  cienciasModule: Store['cienciasModule'];
  onCambiarModulo: (m: Store['cienciasModule']) => void;
  onGuardar: (e: Omit<Ensayo, 'id' | 'prueba'>) => void;
  onCerrar: () => void;
}) {
  const meta = PRUEBAS_META[prueba];
  const [correctas, setCorrectas] = useState(Math.round(meta.max * 0.6));
  const [fecha, setFecha] = useState(hoyISO);
  const [proveedor, setProveedor] = useState('DEMRE');
  const puntaje = tablaDe(prueba, cienciasModule)[correctas] ?? null;
  // Al cerrar, la hoja baja por el mismo camino por el que subió y recién ahí se desmonta.
  const [saliendo, setSaliendo] = useState(false);
  const cerrar = () => setSaliendo(true);
  // Respaldo: si el navegador pausa las animaciones (pestaña en segundo plano), igual se cierra.
  useEffect(() => {
    if (!saliendo) return;
    const t = setTimeout(onCerrar, 500);
    return () => clearTimeout(t);
  }, [saliendo, onCerrar]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSaliendo(true); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const paso = (d: number) => setCorrectas((c) => Math.max(0, Math.min(meta.max, c + d)));

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-[#0F172A]/40"
        initial={{ opacity: 0 }} animate={{ opacity: saliendo ? 0 : 1 }}
        transition={{ duration: 0.25 }}
        onClick={cerrar}
      />
      <motion.div
        role="dialog" aria-modal="true" aria-label={`Registrar ensayo de ${meta.label}`}
        className="relative w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5"
        initial={{ y: '100%' }} animate={{ y: saliendo ? '100%' : 0 }}
        transition={{ type: 'spring', bounce: 0, duration: saliendo ? 0.32 : 0.42 }}
        onAnimationComplete={() => { if (saliendo) onCerrar(); }}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-[#E2E8F0] mb-3 sm:hidden" />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#64748B]">Registrar ensayo</div>
            <div className="text-lg font-semibold text-[#0F172A]">{meta.label}</div>
          </div>
          <button onClick={cerrar} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[#64748B] cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="text-center mt-5">
          <div className="text-xs text-[#64748B]">Respuestas correctas</div>
          <div className="flex items-center justify-center gap-5 mt-2">
            <button onClick={() => paso(-1)} aria-label="Una correcta menos" className="w-12 h-12 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[#0F172A] cursor-pointer"><Minus size={20} /></button>
            <div className="min-w-[96px]">
              <div className="text-[52px] font-semibold tabular-nums tracking-[-0.03em] leading-none text-[#0F172A]">{correctas}</div>
              <div className="text-xs text-[#94A3B8] mt-1">de {meta.max}</div>
            </div>
            <button onClick={() => paso(1)} aria-label="Una correcta más" className="w-12 h-12 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[#0F172A] cursor-pointer"><Plus size={20} /></button>
          </div>
          <input
            type="range" min={0} max={meta.max} step={1} value={correctas}
            onChange={(e) => setCorrectas(Number(e.target.value))}
            aria-label="Respuestas correctas"
            className="range-prueba mt-5"
            style={{ '--c': meta.color, '--p': `${(correctas / meta.max) * 100}%` } as React.CSSProperties}
          />
          <div className="mt-4 inline-flex items-baseline gap-2 rounded-2xl px-4 py-2" style={{ background: meta.tint }}>
            <span className="text-xs" style={{ color: meta.ink }}>Puntaje</span>
            <span className="text-2xl font-semibold tabular-nums" style={{ color: meta.ink }}>{puntaje ?? '—'}</span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-1.5">Con la tabla oficial de conversión</div>
        </div>

        {prueba === 'ciencias' && (
          <div className="mt-4 flex gap-1.5 justify-center" role="group" aria-label="Módulo de Ciencias">
            {(['biologia', 'fisica', 'quimica'] as const).map((m) => (
              <button
                key={m} onClick={() => onCambiarModulo(m)} aria-pressed={cienciasModule === m}
                className={`px-3 h-9 rounded-lg text-xs font-medium cursor-pointer ${cienciasModule === m ? 'bg-[#EEF4FF] text-[#2563EB]' : 'bg-[#F2F4F7] text-[#64748B]'}`}
              >
                {MODULO_LABEL[m]}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-5">
          <label className="block">
            <span className="text-xs text-[#64748B]">Fecha</span>
            <input type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} className="w-full h-11 mt-1 px-3 bg-[#F2F4F7] rounded-xl text-sm font-medium text-[#0F172A] outline-none border border-transparent focus:border-[#2563EB]" />
          </label>
          <label className="block">
            <span className="text-xs text-[#64748B]">De dónde es</span>
            <div className="relative mt-1">
              <select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="w-full h-11 pl-3 pr-8 bg-[#F2F4F7] rounded-xl text-sm font-medium text-[#0F172A] outline-none appearance-none border border-transparent focus:border-[#2563EB] cursor-pointer">
                {PROVEEDORES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden />
            </div>
          </label>
        </div>

        <button
          onClick={() => { if (puntaje === null) return; onGuardar({ puntaje, aciertos: correctas, fecha, proveedor }); cerrar(); }}
          disabled={puntaje === null}
          className="w-full h-12 mt-5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-base font-semibold cursor-pointer"
        >
          Guardar ensayo
        </button>
      </motion.div>
    </div>
  );
}

// ---- Evolución: tus ensayos de la prueba y, si hay meta, el tramo que falta hasta ella ----
function Evolucion({ lista, meta, color }: { lista: Ensayo[]; meta?: number; color: string }) {
  const ult = lista.slice(-6);
  const W = 520, H = 150, padX = 28, padT = 26, padB = 30;
  const vals = [...ult.map((e) => e.puntaje), ...(meta ? [meta] : [])];
  const min = Math.max(100, Math.min(...vals) - 40), max = Math.min(1000, Math.max(...vals) + 40);
  const n = ult.length + (meta ? 1 : 0);
  const x = (i: number) => (n <= 1 ? W / 2 : padX + ((W - 2 * padX) * i) / (n - 1));
  const y = (v: number) => padT + (H - padT - padB) * (1 - (v - min) / Math.max(1, max - min));
  const d = ult.map((e, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(e.puntaje).toFixed(1)}`).join(' ');
  const li = ult.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Evolución de tus puntajes">
      {meta && (
        <>
          <line x1={x(li)} y1={y(ult[li].puntaje)} x2={x(n - 1)} y2={y(meta)} stroke="#CBD5E1" strokeWidth={2} strokeDasharray="4 6" strokeLinecap="round" />
          <circle cx={x(n - 1)} cy={y(meta)} r={6} fill="white" stroke="#CBD5E1" strokeWidth={2} />
          <text x={x(n - 1)} y={y(meta) - 12} textAnchor="middle" fontSize="13" fontWeight="600" fill="#94A3B8">{meta}</text>
          <text x={x(n - 1)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94A3B8">Meta</text>
        </>
      )}
      {ult.length > 1 && <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
      {ult.map((e, i) => (
        <g key={e.id}>
          <circle cx={x(i)} cy={y(e.puntaje)} r={i === li ? 7 : 4.5} fill={i === li ? color : 'white'} stroke={color} strokeWidth={2} />
          <text x={x(i)} y={y(e.puntaje) - 12} textAnchor="middle" fontSize="13" fontWeight={i === li ? 700 : 500} fill="currentColor" className={`tabular-nums ${i === li ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>{e.puntaje}</text>
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94A3B8">{i === li ? 'Último' : FECHA_CORTA.format(aFecha(e.fecha))}</text>
        </g>
      ))}
    </svg>
  );
}

export default React.memo(EnsayosSection);
