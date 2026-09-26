import React, { useMemo, useState } from 'react';
import { Compass, ChevronRight, Building2, RotateCcw } from 'lucide-react';
import Card from './Card';
import { displayNombreUniversidad, normalizar } from '../data';
import { CarreraConDetalle } from '../types';

interface Props {
  carreras: CarreraConDetalle[];
  onOpenDetail: (c: CarreraConDetalle) => void;
}

type Area = 'salud' | 'ingenieria' | 'ciencias' | 'sociales' | 'arte' | 'negocios' | 'derecho' | 'educacion';

const AREA_LABEL: Record<Area, string> = {
  salud: 'Salud', ingenieria: 'Ingeniería y Tecnología', ciencias: 'Ciencias', sociales: 'Ciencias Sociales y Humanidades',
  arte: 'Arte y Diseño', negocios: 'Negocios y Administración', derecho: 'Derecho', educacion: 'Educación',
};

const AREA_KEYWORDS: Record<Area, string[]> = {
  salud: ['medicina', 'enfermer', 'kinesiolog', 'odontolog', 'nutricion', 'obstetricia', 'fonoaudiolog', 'tecnologia medica', 'quimica y farmacia', 'terapia'],
  ingenieria: ['ingenieria', 'informatica', 'computacion', 'construccion', 'geomensura', 'mecatronica'],
  ciencias: ['biologia', 'quimica', 'fisica', 'astronom', 'geologia', 'bioquimica', 'biotecnologia', 'matematica', 'estadistica'],
  sociales: ['sociologia', 'antropologia', 'historia', 'filosofia', 'psicologia', 'trabajo social', 'geografia', 'periodismo', 'ciencia politica', 'relaciones internacionales'],
  arte: ['arte', 'diseno', 'musica', 'teatro', 'actuacion', 'cine', 'danza', 'audiovisual', 'animacion', 'ilustracion'],
  negocios: ['comercial', 'administracion', 'contador', 'auditor', 'economia', 'negocio', 'marketing', 'finanzas', 'turismo'],
  derecho: ['derecho'],
  educacion: ['pedagogia', 'educacion parvularia', 'educacion basica', 'educacion diferencial'],
};

const PREGUNTAS: { q: string; opciones: { txt: string; area: Area }[] }[] = [
  { q: 'Cuando tienes tiempo libre, prefieres...', opciones: [
    { txt: 'Ayudar o cuidar a otras personas', area: 'salud' },
    { txt: 'Armar, reparar o programar cosas', area: 'ingenieria' },
    { txt: 'Leer, debatir o escribir', area: 'sociales' },
    { txt: 'Dibujar, tocar música o crear', area: 'arte' },
  ]},
  { q: 'En el colegio, la asignatura que más disfrutas es...', opciones: [
    { txt: 'Biología / Química', area: 'ciencias' },
    { txt: 'Matemática / Física', area: 'ingenieria' },
    { txt: 'Historia / Filosofía', area: 'sociales' },
    { txt: 'Artes / Música', area: 'arte' },
  ]},
  { q: '¿Qué tipo de problema te motiva más resolver?', opciones: [
    { txt: 'Mejorar la salud de las personas', area: 'salud' },
    { txt: 'Optimizar un sistema o proceso', area: 'ingenieria' },
    { txt: 'Un conflicto legal o de justicia', area: 'derecho' },
    { txt: 'Cómo hacer crecer un negocio', area: 'negocios' },
  ]},
  { q: 'Te imaginas trabajando principalmente...', opciones: [
    { txt: 'En un hospital o clínica', area: 'salud' },
    { txt: 'En un laboratorio o investigación', area: 'ciencias' },
    { txt: 'Enseñando y formando personas', area: 'educacion' },
    { txt: 'En una empresa o emprendimiento', area: 'negocios' },
  ]},
  { q: 'Una habilidad tuya que destacarías es...', opciones: [
    { txt: 'Empatía y trato con personas', area: 'salud' },
    { txt: 'Lógica y análisis', area: 'ingenieria' },
    { txt: 'Creatividad y expresión', area: 'arte' },
    { txt: 'Argumentar y convencer', area: 'derecho' },
  ]},
  { q: '¿Qué te haría sentir más realizado/a?', opciones: [
    { txt: 'Descubrir o entender algo nuevo', area: 'ciencias' },
    { txt: 'Enseñar y dejar huella en otros', area: 'educacion' },
    { txt: 'Defender causas y personas', area: 'sociales' },
    { txt: 'Liderar proyectos y equipos', area: 'negocios' },
  ]},
];

function TestVocacionalSection({ carreras, onOpenDetail }: Props) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<Area, number>>({} as Record<Area, number>);
  const [done, setDone] = useState(false);

  const answer = (area: Area) => {
    setScores((s) => ({ ...s, [area]: (s[area] || 0) + 1 }));
    if (step + 1 >= PREGUNTAS.length) setDone(true);
    else setStep(step + 1);
  };
  const reset = () => { setStep(0); setScores({} as Record<Area, number>); setDone(false); };

  const topArea = useMemo<Area | null>(() => {
    const entries = Object.entries(scores) as [Area, number][];
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [scores]);

  const sugerencias = useMemo(() => {
    if (!topArea) return [];
    const kws = AREA_KEYWORDS[topArea];
    const seen = new Set<string>();
    const out: CarreraConDetalle[] = [];
    for (const c of carreras) {
      if (!c.ponderacion) continue;
      const n = normalizar(c.nombre);
      if (kws.some((k) => n.includes(k)) && !seen.has(c.categoria)) {
        seen.add(c.categoria);
        out.push(c);
      }
      if (out.length >= 8) break;
    }
    return out;
  }, [topArea, carreras]);

  return (
    <Card className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Compass size={18} className="text-[#64748B]" />
          <h3 className="text-base font-semibold text-[#0F172A]">Descubre tu área</h3>
        </div>
        <p className="text-xs text-[#64748B] mt-1.5">
          Responde {PREGUNTAS.length} preguntas breves y te sugerimos carreras del catálogo según tu área de mayor afinidad.
        </p>
      </div>

      {!done ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[#ECEAE6] rounded-full overflow-hidden">
              <div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: `${(step / PREGUNTAS.length) * 100}%` }} />
            </div>
            <span className="text-[11px] text-[#94A3B8] font-medium tabular-nums">{step + 1} de {PREGUNTAS.length}</span>
          </div>
          <div className="text-base font-semibold text-[#0F172A]">{PREGUNTAS[step].q}</div>
          <div className="grid grid-cols-1 gap-2">
            {PREGUNTAS[step].opciones.map((o, i) => (
              <button
                key={i}
                onClick={() => answer(o.area)}
                className="group flex items-center justify-between gap-3 text-left px-4 min-h-[48px] py-3 rounded-xl border border-[#E7E5E1] text-sm font-medium text-[#0F172A] hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
              >
                {o.txt}
                <ChevronRight size={16} className="shrink-0 text-[#94A3B8] group-hover:text-[#2563EB]" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#EFF6FF] rounded-2xl p-5 text-center">
            <div className="text-xs font-medium text-[#64748B]">Tu área de mayor afinidad es</div>
            <div className="text-2xl font-bold text-[#2563EB] mt-1">{topArea ? AREA_LABEL[topArea] : '—'}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-[#94A3B8] mb-2">Carreras sugeridas del catálogo</div>
            <div className="space-y-2">
              {sugerencias.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onOpenDetail(c)}
                  className="w-full flex items-center justify-between gap-3 text-left bg-white border border-[#E7E5E1] rounded-xl p-3 hover:border-[#CBD5E1] transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0F172A]">{c.nombre}</div>
                    <div className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                      <Building2 size={12} className="shrink-0" /> {displayNombreUniversidad(c)}
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[#94A3B8]" />
                </button>
              ))}
              {sugerencias.length === 0 && <p className="text-sm text-[#94A3B8]">No encontramos coincidencias en este año de admisión.</p>}
            </div>
          </div>
          <button
            onClick={reset}
            className="w-full h-11 inline-flex items-center justify-center gap-1.5 border border-[#E7E5E1] text-[#64748B] text-sm font-medium rounded-xl hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <RotateCcw size={15} /> Repetir test
          </button>
        </div>
      )}
    </Card>
  );
}

export default React.memo(TestVocacionalSection);
