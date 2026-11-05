import React from 'react';
import Card from './Card';
import StepHeader from './StepHeader';
import { CienciasModule } from '../types';
import { PRUEBAS, PRUEBAS_ORDEN, PruebaId } from '../constants';
import { tablaPrueba } from '../utils';

type Scores = Record<PruebaId, number>;

interface SlidersSectionProps {
  scores: Scores;
  cienciasModule: CienciasModule;
  modoPuntaje: PruebaId[];
  puntajesDirectos: Partial<Record<PruebaId, string>>;
  // % que pondera cada prueba en la carrera objetivo (si hay una elegida)
  pesos: Partial<Record<PruebaId, number>> | null;
  onChangeScores: (scores: Scores) => void;
  onChangeCienciasModule: (mod: CienciasModule) => void;
  onChangeModo: (prueba: PruebaId, puntaje: boolean) => void;
  onChangeDirecto: (prueba: PruebaId, valor: string) => void;
}

const MODULOS: { id: CienciasModule; name: string }[] = [
  { id: 'biologia', name: 'Biología' },
  { id: 'fisica', name: 'Física' },
  { id: 'quimica', name: 'Química' },
];

export function directoValido(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(',', '.'));
  return n >= 100 && n <= 1000 ? n : null;
}

function SlidersSection({
  scores,
  cienciasModule,
  modoPuntaje,
  puntajesDirectos,
  pesos,
  onChangeScores,
  onChangeCienciasModule,
  onChangeModo,
  onChangeDirecto,
}: SlidersSectionProps) {
  return (
    <Card id="section-puntajes" className="space-y-5">
      <StepHeader
        n={3}
        title="Tus puntajes PAES"
        description="Mueve cada barra según tus respuestas correctas o escribe tu puntaje final."
      />

      <div className="space-y-3">
        {PRUEBAS_ORDEN.map((id) => {
          const p = PRUEBAS[id];
          const enPuntaje = modoPuntaje.includes(id);
          const correctas = scores[id];
          const pts = tablaPrueba(id, cienciasModule)[correctas] ?? 100;
          const peso = pesos?.[id];
          const noPondera = pesos !== null && !peso;
          const raw = puntajesDirectos[id] ?? '';
          const invalido = raw !== '' && directoValido(raw) === null;

          return (
            <div
              key={id}
              className={`rounded-2xl border border-[#E8ECF1] p-4 transition-opacity ${noPondera ? 'opacity-55' : ''}`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: p.color }} aria-hidden />
                  <span className="text-xs font-mono font-medium truncate" style={{ color: p.ink }}>
                    {p.label}
                  </span>
                  {pesos !== null && (
                    <span
                      className="shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums"
                      style={peso ? { background: p.tint, color: p.ink } : { background: '#F1F5F9', color: '#94A3B8' }}
                      title={peso ? `Pondera ${peso}% en tu carrera objetivo` : 'No pondera en tu carrera objetivo'}
                    >
                      {peso ? `${peso}%` : '0%'}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 bg-[#F2F4F7] rounded-[10px] p-0.5 text-[11px] font-medium" role="group" aria-label={`Cómo ingresar ${p.label}`}>
                  {[false, true].map((modoP) => (
                    <button
                      key={String(modoP)}
                      onClick={() => onChangeModo(id, modoP)}
                      aria-pressed={enPuntaje === modoP}
                      className={`px-3 h-7 rounded-lg transition-[color,background-color,box-shadow] cursor-pointer ${
                        enPuntaje === modoP ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.1)]' : 'text-[#64748B]'
                      }`}
                    >
                      {modoP ? 'Puntaje' : 'Respuestas'}
                    </button>
                  ))}
                </div>
              </div>

              {enPuntaje ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={raw}
                    placeholder="650"
                    onChange={(e) => onChangeDirecto(id, e.target.value.replace(/[^\d.,]/g, ''))}
                    aria-label={`Puntaje de ${p.label}`}
                    aria-invalid={invalido}
                    className={`w-24 h-11 text-center font-mono text-base font-semibold rounded-xl bg-[#F2F4F7] border outline-none focus:bg-white transition-colors ${
                      invalido ? 'border-[#DC2626]' : 'border-transparent focus:border-[#CBD5E1]'
                    }`}
                  />
                  <span className={`text-xs leading-snug ${invalido ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                    {invalido ? 'Ingresa un puntaje entre 100 y 1000' : 'Tu puntaje PAES final, sin pasar por la tabla de conversión'}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={p.max}
                    step={1}
                    value={correctas}
                    onChange={(e) => onChangeScores({ ...scores, [id]: parseInt(e.target.value, 10) })}
                    aria-label={`Respuestas correctas en ${p.label}`}
                    className="range-prueba"
                    style={{ '--c': p.color, '--p': `${(correctas / p.max) * 100}%` } as React.CSSProperties}
                  />
                  <div className="text-sm text-[#64748B] tabular-nums">
                    <span className="font-semibold text-[#0F172A]">{correctas}</span> de {p.max} correctas
                    <span className="mx-1.5 text-[#CBD5E1]">→</span>
                    <span className="font-semibold text-[#0F172A]">{pts}</span> pts
                  </div>
                </div>
              )}

              {id === 'ciencias' && (
                <div className="flex gap-1.5 mt-3">
                  {MODULOS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onChangeCienciasModule(m.id)}
                      aria-pressed={cienciasModule === m.id}
                      className={`flex-1 h-8 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        cienciasModule === m.id ? '' : 'bg-[#F2F4F7] border-transparent text-[#64748B] hover:text-[#0F172A]'
                      }`}
                      style={cienciasModule === m.id ? { background: p.tint, color: p.ink, borderColor: p.color } : undefined}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default React.memo(SlidersSection);
