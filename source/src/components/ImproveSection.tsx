import React from 'react';
import Card from './Card';
import { AppState, CarreraConDetalle } from '../types';
import { calculatePonderado } from '../utils';
import { displayNombreUniversidad } from '../data';

interface ImproveSectionProps {
  state: AppState;
  targetCareer: string;
  categoriaDisplay: Record<string, string>;
  finalNemScore: number;
  finalRankingScore: number;
  targetUni: CarreraConDetalle | null;
  currentPonderado: number | null;
  isEmpty: boolean;
}

interface SimulatedTest {
  id: string;
  name: string;
  currentCorrect: number;
  maxCorrect: number;
  gain: number;
}

function ImproveSection({
  state,
  targetCareer,
  categoriaDisplay,
  finalNemScore,
  finalRankingScore,
  targetUni,
  currentPonderado,
  isEmpty,
}: ImproveSectionProps) {

  // If the app is in its empty state or there is no target university selected
  if (isEmpty || !targetUni || !targetUni.ponderacion || currentPonderado === null) {
    return (
      <Card id="section-mejorar" className="space-y-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
            QUÉ TE CONVIENE MEJORAR
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">Análisis de Prioridades</h3>
        </div>
        <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-2xl">
          <p className="text-sm text-[#94A3B8]">
            Elige tu objetivo y tus puntajes arriba para ver qué te conviene mejorar.
          </p>
        </div>
      </Card>
    );
  }

  const { scores, cienciasModule } = state;
  const uniWeights = targetUni.ponderacion;

  // Define candidate tests
  const candidates = [
    {
      id: 'lectora',
      name: 'Competencia Lectora',
      maxCorrect: 60,
      currentCorrect: scores.lectora,
      isActive: uniWeights.lecturaPct > 0,
      simulate: (add: number) => ({
        ...scores,
        lectora: Math.min(scores.lectora + add, 60),
      }),
    },
    {
      id: 'm1',
      name: 'Competencia Matemática 1 (M1)',
      maxCorrect: 60,
      currentCorrect: scores.m1,
      isActive: uniWeights.m1Pct > 0,
      simulate: (add: number) => ({
        ...scores,
        m1: Math.min(scores.m1 + add, 60),
      }),
    },
    {
      id: 'm2',
      name: 'Competencia Matemática 2 (M2)',
      maxCorrect: 49,
      currentCorrect: scores.m2,
      isActive: uniWeights.m2Pct > 0,
      simulate: (add: number) => ({
        ...scores,
        m2: Math.min(scores.m2 + add, 49),
      }),
    },
    {
      id: 'ciencias',
      name: `Prueba de Ciencias (${cienciasModule.charAt(0).toUpperCase() + cienciasModule.slice(1)})`,
      maxCorrect: 75,
      currentCorrect: scores.ciencias,
      isActive: uniWeights.cienciasPct > 0 && (targetUni.electivaTipo === 'ciencias' || targetUni.electivaTipo === 'mejor'),
      simulate: (add: number) => ({
        ...scores,
        ciencias: Math.min(scores.ciencias + add, 75),
      }),
    },
    {
      id: 'historia',
      name: 'Historia y Ciencias Sociales',
      maxCorrect: 60,
      currentCorrect: scores.historia,
      isActive: uniWeights.historiaPct > 0 && (targetUni.electivaTipo === 'historia' || targetUni.electivaTipo === 'mejor'),
      simulate: (add: number) => ({
        ...scores,
        historia: Math.min(scores.historia + add, 60),
      }),
    },
  ];

  // Run simulation of +5 correct answers for each active test
  const simulatedTests: SimulatedTest[] = [];

  candidates.forEach((cand) => {
    if (cand.isActive) {
      const simulatedScores = cand.simulate(1);
      const simulatedPonderado = calculatePonderado(
        finalNemScore,
        finalRankingScore,
        simulatedScores.lectora,
        simulatedScores.m1,
        simulatedScores.m2,
        simulatedScores.ciencias,
        simulatedScores.historia,
        cienciasModule,
        targetUni
      );

      if (simulatedPonderado !== null) {
        // Point gain = new weighted score - current weighted score
        const gain = Math.max(0, simulatedPonderado - currentPonderado);
        simulatedTests.push({
          id: cand.id,
          name: cand.name,
          currentCorrect: cand.currentCorrect,
          maxCorrect: cand.maxCorrect,
          gain: parseFloat(gain.toFixed(2)),
        });
      }
    }
  });

  // Sort by gain DESCENDING (highest gain first)
  const sortedTests = [...simulatedTests].sort((a, b) => b.gain - a.gain);

  // Find max gain to scale relative horizontal bars
  const maxGain = Math.max(...sortedTests.map((t) => t.gain), 0);

  return (
    <Card id="section-mejorar" className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
          QUÉ TE CONVIENE MEJORAR
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">Prioridad de Preparación</h3>
        <p className="text-xs text-[#64748B] mt-1">
          Si subieras <strong className="font-semibold text-[#0F172A]">1 correcta</strong> en cada prueba, así cambiaría tu ponderado para{' '}
          <strong className="font-semibold text-[#3B82F6]">
            {categoriaDisplay[targetCareer] || targetUni.nombre || targetCareer}
          </strong>{' '}
          · <strong className="font-semibold text-[#0F172A]">{displayNombreUniversidad(targetUni)}</strong>:
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {sortedTests.map((test, idx) => {
          const percentageWidth = maxGain > 0 ? (test.gain / maxGain) * 100 : 0;
          const isAtMax = test.currentCorrect >= test.maxCorrect;
          // Impacto: el de mayor ganancia se resalta en verde (mejor retorno)
          const topImpact = idx === 0 && test.gain > 0;
          const accent = topImpact ? '#10B981' : '#3B82F6';

          return (
            <div
              key={test.id}
              className="card-lift flex items-center gap-3 bg-white border border-[#F1F5F9] rounded-2xl p-3.5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: topImpact ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.10)' }}
              >
                📈
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#0F172A] leading-tight">{test.name}</span>
                  {topImpact && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded-full">Mayor impacto</span>
                  )}
                  {isAtMax && (
                    <span className="text-[9px] font-bold text-[#10B981] bg-emerald-50 px-1.5 py-0.5 rounded-full">Máx</span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mt-1.5">
                  <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${percentageWidth}%`, background: accent }} />
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">{test.currentCorrect} / {test.maxCorrect} correctas</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-extrabold font-mono tabular-nums" style={{ color: accent }}>+{test.gain.toFixed(2)}</div>
                <div className="text-[10px] text-[#94A3B8] font-semibold">pts</div>
              </div>
            </div>
          );
        })}

        {sortedTests.length === 0 && (
          <p className="text-center py-6 text-sm text-[#94A3B8]">
            La universidad seleccionada no requiere pruebas PAES ponderadas activas.
          </p>
        )}
      </div>
    </Card>
  );
}

export default React.memo(ImproveSection);
