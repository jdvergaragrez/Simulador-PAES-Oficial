import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Undo2, Check, TriangleAlert, Flag } from 'lucide-react';
import Card from './Card';
import { displayNombreUniversidad } from '../data';
import { calculatePonderado, correctasActuales, sinPrueba, tablaPrueba, PuntajesDirectos } from '../utils';
import { CarrerasPorCategoria, CarreraConDetalle } from '../types';
import { PRUEBAS, PruebaId } from '../constants';
import SearchableSelect from './SearchableSelect';
import { buscarCategorias, buscarIds, compararPorCorte } from '../busqueda';

interface Props {
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
}

type PruebaVar = PruebaId;

const fmt = (n: number, dec = 2) => n.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const labelCls = 'text-[11px] font-medium text-[#64748B]';

function SimuladorInversoSection({
  porCategoria, categoriaDisplay, anioAdmision,
  nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, directos,
}: Props) {
  const opciones = useMemo(
    () => Object.keys(porCategoria).map((k) => ({ value: k, label: categoriaDisplay[k] || k })).sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [porCategoria, categoriaDisplay]
  );
  const [career, setCareer] = useState(opciones[0]?.value || '');
  const [uniId, setUniId] = useState('');
  const [variable, setVariable] = useState<PruebaVar>('m1');

  useEffect(() => { if (!porCategoria[career]) setCareer(opciones[0]?.value || ''); }, [anioAdmision]);

  const todas = useMemo(() => Object.values(porCategoria).flat(), [porCategoria]);
  const buscarCarrera = useCallback((q: string) => buscarCategorias(todas, categoriaDisplay, q), [todas, categoriaDisplay]);
  const unis = useMemo(() => (porCategoria[career] || []).filter((u) => u.ponderacion).sort(compararPorCorte), [porCategoria, career]);
  const buscarUni = useCallback((q: string) => buscarIds(unis, categoriaDisplay, q), [unis, categoriaDisplay]);
  const uniOptions = unis.map((u) => ({ value: u.id, label: displayNombreUniversidad(u), sublabel: u.region || undefined }));
  const carrera: CarreraConDetalle | undefined = unis.find((u) => u.id === uniId) ?? unis[0];

  // Pruebas que la carrera pondera (candidatas a resolver)
  const pruebasDisponibles = useMemo(() => {
    if (!carrera?.ponderacion) return [] as PruebaVar[];
    const p = carrera.ponderacion;
    const arr: PruebaVar[] = [];
    if (p.lecturaPct > 0) arr.push('lectora');
    if (p.m1Pct > 0) arr.push('m1');
    if (p.m2Pct > 0) arr.push('m2');
    if (carrera.electivaTipo === 'ciencias' || carrera.electivaTipo === 'mejor') arr.push('ciencias');
    if (carrera.electivaTipo === 'historia' || carrera.electivaTipo === 'mejor') arr.push('historia');
    return arr;
  }, [carrera]);

  useEffect(() => {
    if (pruebasDisponibles.length && !pruebasDisponibles.includes(variable)) setVariable(pruebasDisponibles[0]);
  }, [pruebasDisponibles]);

  // Meta: corte 2026; si no hay, el ponderado mínimo de postulación (misma escala que el ponderado).
  const target = carrera ? (carrera.puntajeCorte ?? carrera.ponderadoMinimo ?? null) : null;
  const targetLabel = carrera?.puntajeCorte != null ? 'Corte 2026' : 'Mín. postulación';

  // Escanea aciertos 0..max de la prueba variable (resto fijo) hasta alcanzar el target
  const resultado = useMemo(() => {
    if (!carrera?.ponderacion || target === null) return null;
    const max = PRUEBAS[variable].max;
    const scores = { lectora: lectoraCorrect, m1: m1Correct, m2: m2Correct, ciencias: cienciasCorrect, historia: historiaCorrect };
    const actual = correctasActuales(variable, scores[variable], cienciasModule, directos);
    const otros = sinPrueba(directos, variable);
    for (let a = 0; a <= max; a++) {
      const s = { ...scores, [variable]: a };
      const pond = calculatePonderado(nemScore, rankingScore, s.lectora, s.m1, s.m2, s.ciencias, s.historia, cienciasModule, carrera, otros);
      if (pond !== null && pond >= target) {
        return { alcanzable: true, aciertos: a, max, puntaje: tablaPrueba(variable, cienciasModule)[a] ?? 0, actual };
      }
    }
    return { alcanzable: false, aciertos: max, max, puntaje: 0, actual };
  }, [carrera, target, variable, nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, directos]);

  const faltan = resultado ? Math.max(0, resultado.aciertos - resultado.actual) : 0;
  const pv = PRUEBAS[variable];

  return (
    <Card className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Undo2 size={18} className="text-[#64748B]" />
          <h3 className="text-base font-semibold text-[#0F172A]">Cuánto necesitas para tu meta</h3>
        </div>
        <p className="text-xs text-[#64748B] mt-1.5">
          Elige tu carrera meta y una prueba a resolver. Fijamos tus notas y el resto de tus puntajes actuales (Mi puntaje) y calculamos lo que te falta · Admisión {anioAdmision}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <span className={labelCls}>Carrera meta</span>
          <div className="mt-1"><SearchableSelect options={opciones} value={career} onChange={(v) => { setCareer(v); setUniId(''); }} buscar={buscarCarrera} placeholder="Busca tu carrera..." /></div>
        </div>
        <div>
          <span className={labelCls}>Universidad</span>
          <div className="mt-1"><SearchableSelect options={uniOptions} value={carrera?.id ?? ''} onChange={setUniId} buscar={buscarUni} placeholder="Busca la universidad (ej: uc, usach)..." /></div>
        </div>
      </div>

      {carrera && (
        <>
          <div>
            <span className={labelCls}>Prueba a resolver</span>
            <div className="flex flex-wrap gap-1.5 mt-1" role="group" aria-label="Prueba a resolver">
              {pruebasDisponibles.map((id) => {
                const p = PRUEBAS[id];
                const activo = variable === id;
                return (
                  <button
                    key={id}
                    onClick={() => setVariable(id)}
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

          {target === null ? (
            <div className="bg-[#F4F3F1] rounded-2xl p-4 text-sm text-[#94A3B8] text-center">
              Esta carrera no tiene corte 2026 ni mínimo publicado para calcular la meta.
            </div>
          ) : resultado && (
            <div className="rounded-2xl border border-[#E7E5E1] p-5 space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-[#64748B]">
                <Flag size={13} /> Meta · {targetLabel} <span className="tabular-nums normal-case tracking-normal font-sans font-semibold text-[#0F172A]">{fmt(target)}</span>
              </div>
              {resultado.alcanzable ? (
                <>
                  <div className="text-sm text-[#0F172A]">
                    En <strong className="font-semibold" style={{ color: pv.ink }}>{pv.label}</strong> necesitas al menos
                  </div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <div className="text-4xl font-bold text-[#0F172A] tabular-nums leading-none">
                      {resultado.aciertos}<span className="text-lg font-semibold text-[#94A3B8]"> / {resultado.max}</span>
                    </div>
                    <div className="text-sm text-[#64748B]">
                      respuestas correctas (~<strong className="text-[#0F172A] font-semibold tabular-nums">{resultado.puntaje} pts</strong>)
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#ECEAE6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(resultado.aciertos / resultado.max) * 100}%`, background: pv.color }} />
                  </div>
                  <div className="text-xs text-[#64748B]">
                    {faltan === 0
                      ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#166534]">
                          <Check size={13} strokeWidth={2.5} /> Con tu puntaje actual ya alcanzas la meta
                        </span>
                      )
                      : <>Desde tu nivel actual ({resultado.actual} correctas) te faltan <strong className="text-[#0F172A] font-semibold">+{faltan} buenas</strong>.</>}
                  </div>
                </>
              ) : (
                <p className="flex items-start gap-2 text-sm text-[#92400E] bg-[#FEF3C7] rounded-xl px-3 py-2.5">
                  <TriangleAlert size={16} className="shrink-0 mt-0.5" />
                  <span>Aunque logres el máximo en <strong className="font-semibold">{pv.label}</strong>, no alcanzas la meta solo con esa prueba. Necesitas subir también en las demás.</span>
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default React.memo(SimuladorInversoSection);
