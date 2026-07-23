import React from 'react';
import Card from './Card';
import { AppState, Universidad } from '../types';
import { calculatePonderado } from '../utils';
import { careerDisplayNames } from '../data';

interface ImproveSectionProps {
  state: AppState;
  finalNemScore: number;
  finalRankingScore: number;
  targetUni: Universidad | null;
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

export default function ImproveSection({
  state,
  finalNemScore,
  finalRankingScore,
  targetUni,
  currentPonderado,
  isEmpty,
}: ImproveSectionProps) {

  // If the app is in its empty state or there is no target university selected
  if (isEmpty || !targetUni || !targetUni.weights || currentPonderado === null) {
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

  const { scores, cienciasModule, targetCareer } = state;
  const uniWeights = targetUni.weights;

  // Define candidate tests
  const candidates = [
    {
      id: 'lectora',
      name: 'Competencia Lectora',
      maxCorrect: 60,
      currentCorrect: scores.lectora,
      isActive: uniWeights.lectora > 0,
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
      isActive: uniWeights.m1 > 0,
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
      isActive: uniWeights.m2 > 0,
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
      isActive: uniWeights.electivo > 0 && (targetUni.electivaTipo === 'ciencias' || targetUni.electivaTipo === 'mejor'),
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
      isActive: uniWeights.electivo > 0 && (targetUni.electivaTipo === 'historia' || targetUni.electivaTipo === 'mejor'),
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
      const simulatedScores = cand.simulate(5);
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
          Si subieras <strong className="font-semibold text-[#0F172A]">+5 correctas</strong> en cada prueba, así cambiaría tu ponderado para{' '}
          <strong className="font-semibold text-[#2563EB]">
            {careerDisplayNames[targetCareer] || targetCareer}
          </strong>{' '}
          · <strong className="font-semibold text-[#0F172A]">{targetUni.nombre}</strong>:
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {sortedTests.map((test) => {
          // Calculate percentage width for relative gain visual indicator
          const percentageWidth = maxGain > 0 ? (test.gain / maxGain) * 100 : 0;
          const isAtMax = test.currentCorrect >= test.maxCorrect;

          return (
            <div key={test.id} className="space-y-1.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-sm font-semibold text-[#0F172A] leading-tight">
                  {test.name}
                  {isAtMax && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-2">
                      Máx alcanzado
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold text-[#2563EB] font-mono tabular-nums shrink-0">
                  +{test.gain.toFixed(2)} <span className="text-xs text-[#94A3B8] font-semibold">pts</span>
                </span>
              </div>

              {/* Progress bar representing weight / point gain influence */}
              <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentageWidth}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>Respuestas actuales: {test.currentCorrect} / {test.maxCorrect}</span>
                <span>Impacto en ponderación</span>
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
