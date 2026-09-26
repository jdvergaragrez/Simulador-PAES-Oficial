import React from 'react';
import { TrendingUp } from 'lucide-react';
import Card from './Card';
import { AppState, CarreraConDetalle } from '../types';
import { calculatePonderado, correctasActuales, sinPrueba, PuntajesDirectos } from '../utils';
import { displayNombreUniversidad } from '../data';
import { PRUEBAS, PRUEBAS_ORDEN, PruebaId } from '../constants';

interface ImproveSectionProps {
  state: AppState;
  targetCareer: string;
  categoriaDisplay: Record<string, string>;
  finalNemScore: number;
  finalRankingScore: number;
  targetUni: CarreraConDetalle | null;
  currentPonderado: number | null;
  isEmpty: boolean;
  directos: PuntajesDirectos;
}

function Encabezado({ children }: { children?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-[#64748B]" />
        <h3 className="text-base font-semibold text-[#0F172A]">Qué te conviene mejorar</h3>
      </div>
      {children}
    </div>
  );
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
  directos,
}: ImproveSectionProps) {
  if (isEmpty || !targetUni || !targetUni.ponderacion || currentPonderado === null) {
    return (
      <Card id="section-mejorar" className="space-y-4">
        <Encabezado />
        <p className="text-sm text-[#94A3B8] text-center py-6 bg-[#F4F3F1] rounded-2xl">
          Elige tu objetivo e ingresa tus puntajes para ver qué prueba te conviene subir.
        </p>
      </Card>
    );
  }

  const { scores, cienciasModule } = state;
  const w = targetUni.ponderacion;
  const pondera: Record<PruebaId, boolean> = {
    lectora: w.lecturaPct > 0,
    m1: w.m1Pct > 0,
    m2: w.m2Pct > 0,
    ciencias: w.cienciasPct > 0 && targetUni.electivaTipo !== 'historia',
    historia: w.historiaPct > 0 && targetUni.electivaTipo !== 'ciencias',
  };

  const filas = PRUEBAS_ORDEN.filter((id) => pondera[id]).map((id) => {
    const actual = correctasActuales(id, scores[id], cienciasModule, directos);
    const max = PRUEBAS[id].max;
    const sim = { ...scores, [id]: Math.min(actual + 1, max) };
    const nuevo = calculatePonderado(
      finalNemScore, finalRankingScore,
      sim.lectora, sim.m1, sim.m2, sim.ciencias, sim.historia,
      cienciasModule, targetUni, sinPrueba(directos, id)
    );
    const gain = nuevo !== null ? Math.max(0, nuevo - currentPonderado) : 0;
    return { id, actual, max, gain: parseFloat(gain.toFixed(2)) };
  }).sort((a, b) => b.gain - a.gain);

  const maxGain = Math.max(...filas.map((f) => f.gain), 0);

  return (
    <Card id="section-mejorar" className="space-y-4">
      <Encabezado>
        <p className="text-xs text-[#64748B] mt-1.5">
          Si subieras <strong className="font-semibold text-[#0F172A]">1 respuesta correcta</strong> en cada prueba, así cambiaría tu ponderado en{' '}
          <strong className="font-semibold text-[#0F172A]">{targetUni.nombre || categoriaDisplay[targetCareer]}</strong> · {displayNombreUniversidad(targetUni)}.
        </p>
      </Encabezado>

      <div className="space-y-2">
        {filas.map((f, idx) => {
          const p = PRUEBAS[f.id];
          const top = idx === 0 && f.gain > 0;
          return (
            <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-[#E7E5E1] p-3.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-sm font-semibold text-[#0F172A]">{p.label}</span>
                  {top && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">Mayor impacto</span>
                  )}
                  {f.actual >= f.max && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">Al máximo</span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-[#ECEAE6] rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${maxGain > 0 ? (f.gain / maxGain) * 100 : 0}%`, background: p.color }}
                  />
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-1 tabular-nums">
                  {f.actual} de {f.max} correctas{directos[f.id] !== undefined ? ' (equivalente a tu puntaje)' : ''}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-bold tabular-nums" style={{ color: top ? '#166534' : '#0F172A' }}>
                  +{f.gain.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-[#94A3B8]">pts</div>
              </div>
            </div>
          );
        })}

        {filas.length === 0 && (
          <p className="text-center py-6 text-sm text-[#94A3B8]">Esta carrera no pondera pruebas PAES.</p>
        )}
      </div>
    </Card>
  );
}

export default React.memo(ImproveSection);
