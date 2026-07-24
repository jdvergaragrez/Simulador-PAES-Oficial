import React, { useEffect, useMemo, useState } from 'react';
import Card from './Card';
import { displayNombreUniversidad, tablasPAES } from '../data';
import { calculatePonderado } from '../utils';
import { CarrerasPorCategoria, CarreraConDetalle } from '../types';
import SearchableSelect from './SearchableSelect';

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
}

type PruebaVar = 'lectora' | 'm1' | 'm2' | 'ciencias' | 'historia';
const PRUEBA_META: Record<PruebaVar, { label: string; max: number }> = {
  lectora: { label: 'Competencia Lectora', max: 60 },
  m1: { label: 'Matemática M1', max: 60 },
  m2: { label: 'Matemática M2', max: 49 },
  ciencias: { label: 'Ciencias', max: 75 },
  historia: { label: 'Historia y Cs. Sociales', max: 60 },
};

function SimuladorInversoSection({
  porCategoria, categoriaDisplay, anioAdmision,
  nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule,
}: Props) {
  const opciones = useMemo(
    () => Object.keys(porCategoria).map((k) => ({ value: k, label: categoriaDisplay[k] || k })).sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [porCategoria, categoriaDisplay]
  );
  const [career, setCareer] = useState(opciones[0]?.value || '');
  const [uniIdx, setUniIdx] = useState(0);
  const [variable, setVariable] = useState<PruebaVar>('m1');

  useEffect(() => { if (!porCategoria[career]) setCareer(opciones[0]?.value || ''); }, [anioAdmision]);

  const unis = (porCategoria[career] || []).filter((u) => u.ponderacion);
  const uniOptions = unis.map((u, i) => ({ value: String(i), label: displayNombreUniversidad(u), sublabel: u.region || undefined }));
  const carrera: CarreraConDetalle | undefined = unis[uniIdx];

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

  const target = carrera ? (carrera.puntajeCorte ?? carrera.promedioMinimo ?? null) : null;

  // Escanea aciertos 0..max de la prueba variable (resto fijo) hasta alcanzar el target
  const resultado = useMemo(() => {
    if (!carrera?.ponderacion || target === null) return null;
    const max = PRUEBA_META[variable].max;
    const scores = { lectora: lectoraCorrect, m1: m1Correct, m2: m2Correct, ciencias: cienciasCorrect, historia: historiaCorrect };
    for (let a = 0; a <= max; a++) {
      const s = { ...scores, [variable]: a };
      const pond = calculatePonderado(nemScore, rankingScore, s.lectora, s.m1, s.m2, s.ciencias, s.historia, cienciasModule, carrera);
      if (pond !== null && pond >= target) {
        const tabla = variable === 'ciencias' ? tablasPAES[`ciencias_${cienciasModule}` as 'ciencias_fisica'] : tablasPAES[variable as 'lectora'];
        return { alcanzable: true, aciertos: a, max, puntaje: tabla[a] ?? 0, actual: scores[variable] };
      }
    }
    return { alcanzable: false, aciertos: max, max, puntaje: 0, actual: scores[variable] };
  }, [carrera, target, variable, nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule]);

  const faltan = resultado ? Math.max(0, resultado.aciertos - resultado.actual) : 0;

  return (
    <Card className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">SIMULADOR INVERSO</div>
        <h3 className="text-lg font-bold text-[#0F172A]">🎯 ¿Cuánto necesito para mi meta?</h3>
        <p className="text-xs text-[#64748B] mt-1">
          Elige tu carrera meta y una prueba a resolver. Fijamos tus notas y el resto de tus puntajes actuales (pestaña Mi puntaje) y calculamos lo que te falta · Admisión {anioAdmision}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase text-[#94A3B8]">Carrera meta</label>
          <div className="mt-1"><SearchableSelect options={opciones} value={career} onChange={(v) => { setCareer(v); setUniIdx(0); }} placeholder="Busca tu carrera..." /></div>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-[#94A3B8]">Universidad</label>
          <div className="mt-1"><SearchableSelect options={uniOptions} value={String(uniIdx)} onChange={(v) => setUniIdx(parseInt(v, 10))} placeholder="Busca la universidad..." /></div>
        </div>
      </div>

      {carrera && (
        <>
          <div>
            <label className="text-[10px] font-bold uppercase text-[#94A3B8]">Prueba a resolver</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {pruebasDisponibles.map((pv) => (
                <button key={pv} onClick={() => setVariable(pv)} className={`px-3 h-9 rounded-full text-xs font-semibold transition-all ${variable === pv ? 'bg-[#3B82F6] text-white shadow-sm' : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'}`}>
                  {PRUEBA_META[pv].label}
                </button>
              ))}
            </div>
          </div>

          {target === null ? (
            <div className="bg-slate-50 rounded-2xl p-4 text-sm text-[#94A3B8] text-center">Esta carrera no tiene corte ni mínimo publicado para calcular la meta.</div>
          ) : resultado && (
            <div className={`rounded-2xl p-5 border-2 ${resultado.alcanzable ? 'border-[#3B82F6] bg-gradient-to-b from-white to-[#F8FAFC]' : 'border-amber-200 bg-amber-50/50'}`}>
              <div className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2">
                Meta: {carrera.puntajeCorte !== null ? 'corte' : 'mínimo'} {target.toFixed(2)} pts
              </div>
              {resultado.alcanzable ? (
                <>
                  <div className="text-sm text-[#0F172A]">
                    En <strong className="font-bold">{PRUEBA_META[variable].label}</strong> necesitas al menos:
                  </div>
                  <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                    <div className="text-4xl font-extrabold text-[#3B82F6] font-mono tabular-nums">{resultado.aciertos}<span className="text-lg text-[#94A3B8]"> / {resultado.max}</span></div>
                    <div className="text-sm text-[#64748B]">respuestas correctas (~<strong className="text-[#0F172A] font-bold">{resultado.puntaje} pts</strong>)</div>
                  </div>
                  <div className="text-xs text-[#64748B] mt-2">
                    {faltan === 0
                      ? <span className="text-[#10B981] font-semibold">✓ Con tu puntaje actual ya alcanzas la meta.</span>
                      : <>Desde tu nivel actual ({resultado.actual} correctas) te faltan <strong className="text-[#0F172A] font-bold">+{faltan} buenas</strong>.</>}
                  </div>
                </>
              ) : (
                <div className="text-sm text-[#0F172A]">
                  Aunque logres el máximo en <strong>{PRUEBA_META[variable].label}</strong>, no alcanzas la meta solo con esa prueba. Necesitas subir también en las demás.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default React.memo(SimuladorInversoSection);
