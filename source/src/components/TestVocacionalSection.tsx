import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft, RotateCcw, Compass } from 'lucide-react';
import Card from './Card';
import { displayNombreUniversidad, normalizar } from '../data';
import { CarreraConDetalle } from '../types';

interface Props {
  carreras: CarreraConDetalle[];
  onOpenDetail: (c: CarreraConDetalle) => void;
}

// Inventario de intereses según el modelo RIASEC de Holland. Las actividades y los perfiles de carrera
// son propios de esta app; es una orientación, no un diagnóstico.
type Tipo = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
const TIPOS: Tipo[] = ['R', 'I', 'A', 'S', 'E', 'C'];

const TIPO_INFO: Record<Tipo, { nombre: string; desc: string; color: string }> = {
  R: { nombre: 'Realista', desc: 'Te gusta hacer cosas con las manos, usar herramientas y ver resultados concretos.', color: '#D97706' },
  I: { nombre: 'Investigador', desc: 'Te mueve entender cómo funcionan las cosas, analizar y resolver problemas.', color: '#2563EB' },
  A: { nombre: 'Artístico', desc: 'Disfrutas crear, expresarte y trabajar con ideas originales.', color: '#DB2777' },
  S: { nombre: 'Social', desc: 'Te motiva ayudar, enseñar y acompañar a otras personas.', color: '#16A34A' },
  E: { nombre: 'Emprendedor', desc: 'Te atrae liderar, convencer y sacar adelante proyectos.', color: '#7C3AED' },
  C: { nombre: 'Organizado', desc: 'Te acomoda el orden, la precisión y trabajar con datos y procesos claros.', color: '#0891B2' },
};

const ACTIVIDADES: { t: Tipo; txt: string }[] = [
  { t: 'R', txt: 'Reparar una bicicleta, un enchufe o un electrodoméstico' },
  { t: 'I', txt: 'Hacer un experimento para comprobar si una idea es cierta' },
  { t: 'A', txt: 'Diseñar un afiche, un logo o la portada de un libro' },
  { t: 'S', txt: 'Explicarle una materia a un compañero que no la entiende' },
  { t: 'E', txt: 'Vender un producto o convencer a otros de una idea' },
  { t: 'C', txt: 'Ordenar información en una planilla o una tabla' },
  { t: 'R', txt: 'Trabajar al aire libre, en terreno o con animales' },
  { t: 'I', txt: 'Resolver un problema de matemática difícil solo por el desafío' },
  { t: 'A', txt: 'Escribir un cuento, un guion o la letra de una canción' },
  { t: 'S', txt: 'Cuidar a alguien que está enfermo o lo está pasando mal' },
  { t: 'E', txt: 'Liderar un grupo para cumplir una meta' },
  { t: 'C', txt: 'Llevar las cuentas de un presupuesto' },
  { t: 'R', txt: 'Usar herramientas o máquinas para construir algo' },
  { t: 'I', txt: 'Investigar por qué aparece una enfermedad' },
  { t: 'A', txt: 'Actuar, cantar o tocar un instrumento frente a otros' },
  { t: 'S', txt: 'Escuchar a un amigo y ayudarlo a resolver un problema' },
  { t: 'E', txt: 'Crear tu propio emprendimiento' },
  { t: 'C', txt: 'Revisar un documento buscando errores' },
  { t: 'R', txt: 'Armar un circuito eléctrico o un robot simple' },
  { t: 'I', txt: 'Analizar datos para descubrir un patrón' },
  { t: 'A', txt: 'Fotografiar o grabar y editar un video' },
  { t: 'S', txt: 'Hacer voluntariado en tu comunidad' },
  { t: 'E', txt: 'Negociar un acuerdo o representar a tu curso' },
  { t: 'C', txt: 'Seguir un procedimiento paso a paso con precisión' },
  { t: 'R', txt: 'Hacer un trabajo en el que al final del día se vea lo que hiciste' },
  { t: 'I', txt: 'Leer sobre el universo, el cuerpo humano o la tecnología' },
  { t: 'A', txt: 'Decorar o diseñar cómo se ve un espacio' },
  { t: 'S', txt: 'Trabajar con niños, jóvenes o adultos mayores' },
  { t: 'E', txt: 'Organizar un evento y encargarte de que todo resulte' },
  { t: 'C', txt: 'Mantener ordenados archivos, horarios o inventarios' },
];

// Perfil RIASEC aproximado de cada tipo de carrera (las 3 letras más fuertes, en orden).
const PERFILES: { label: string; claves: string[]; codigo: string }[] = [
  { label: 'Medicina', claves: ['medicina'], codigo: 'ISR' },
  { label: 'Enfermería', claves: ['enfermer'], codigo: 'SIR' },
  { label: 'Kinesiología', claves: ['kinesiolog'], codigo: 'SRI' },
  { label: 'Odontología', claves: ['odontolog'], codigo: 'IRS' },
  { label: 'Obstetricia', claves: ['obstetricia'], codigo: 'SIR' },
  { label: 'Nutrición', claves: ['nutricion'], codigo: 'ISC' },
  { label: 'Fonoaudiología', claves: ['fonoaudiolog'], codigo: 'SIA' },
  { label: 'Terapia Ocupacional', claves: ['terapia ocupacional'], codigo: 'SRA' },
  { label: 'Tecnología Médica', claves: ['tecnologia medica'], codigo: 'IRC' },
  { label: 'Química y Farmacia', claves: ['quimica y farmacia'], codigo: 'ICS' },
  { label: 'Medicina Veterinaria', claves: ['veterinaria'], codigo: 'IRS' },
  { label: 'Psicología', claves: ['psicologia'], codigo: 'SIA' },
  { label: 'Trabajo Social', claves: ['trabajo social'], codigo: 'SEA' },
  { label: 'Pedagogía', claves: ['pedagogia'], codigo: 'SAE' },
  { label: 'Educación Parvularia', claves: ['parvularia'], codigo: 'SAC' },
  { label: 'Derecho', claves: ['derecho'], codigo: 'EIS' },
  { label: 'Periodismo', claves: ['periodismo'], codigo: 'AES' },
  { label: 'Publicidad', claves: ['publicidad'], codigo: 'AEC' },
  { label: 'Sociología', claves: ['sociologia'], codigo: 'ISA' },
  { label: 'Ciencia Política', claves: ['ciencia politica'], codigo: 'EIS' },
  { label: 'Historia', claves: ['licenciatura en historia'], codigo: 'IAS' },
  { label: 'Arquitectura', claves: ['arquitectura'], codigo: 'AIR' },
  { label: 'Diseño', claves: ['diseno'], codigo: 'AER' },
  { label: 'Artes y Música', claves: ['artes', 'musica', 'teatro', 'actuacion'], codigo: 'ASE' },
  { label: 'Cine y Audiovisual', claves: ['cine', 'audiovisual'], codigo: 'AER' },
  { label: 'Ingeniería Civil', claves: ['ingenieria civil'], codigo: 'RIC' },
  { label: 'Ingeniería Civil Industrial', claves: ['civil industrial'], codigo: 'EIC' },
  { label: 'Ingeniería Informática', claves: ['informatica', 'computacion'], codigo: 'IRC' },
  { label: 'Ingeniería Comercial', claves: ['ingenieria comercial'], codigo: 'ECI' },
  { label: 'Contador Auditor', claves: ['contador', 'auditor'], codigo: 'CEI' },
  { label: 'Administración', claves: ['administracion'], codigo: 'ECS' },
  { label: 'Economía', claves: ['economia'], codigo: 'IEC' },
  { label: 'Construcción Civil', claves: ['construccion'], codigo: 'RCE' },
  { label: 'Agronomía', claves: ['agronomia'], codigo: 'RIC' },
  { label: 'Biología y Biotecnología', claves: ['biologia', 'biotecnologia', 'bioquimica'], codigo: 'IRA' },
  { label: 'Química', claves: ['licenciatura en quimica', 'quimica industrial'], codigo: 'IRC' },
  { label: 'Física y Astronomía', claves: ['fisica', 'astronom'], codigo: 'IRA' },
  { label: 'Matemática y Estadística', claves: ['matematica', 'estadistica'], codigo: 'ICR' },
  { label: 'Geología', claves: ['geologia'], codigo: 'RIC' },
  { label: 'Turismo', claves: ['turismo'], codigo: 'ESC' },
];

const ESCALA = [1, 2, 3, 4, 5];
const STORAGE_KEY = 'paes_vocacional_v2';

function puntajes(resp: (number | null)[]): Record<Tipo, number> {
  const r = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } as Record<Tipo, number>;
  ACTIVIDADES.forEach((a, i) => { r[a.t] += resp[i] ?? 0; });
  // 5 actividades por tipo, de 1 a 5: se lleva a 0-1
  TIPOS.forEach((t) => { r[t] = Math.max(0, (r[t] - 5) / 20); });
  return r;
}

function afinidad(codigo: string, p: Record<Tipo, number>): number {
  const pesos = [3, 2, 1];
  return codigo.split('').reduce((a, l, i) => a + pesos[i] * p[l as Tipo], 0) / 6;
}

function TestVocacionalSection({ carreras, onOpenDetail }: Props) {
  const [resp, setResp] = useState<(number | null)[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(v) && v.length === ACTIVIDADES.length) return v;
    } catch {}
    return Array(ACTIVIDADES.length).fill(null);
  });
  const [paso, setPaso] = useState(() => { const i = resp.indexOf(null); return i === -1 ? ACTIVIDADES.length : i; });
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(resp)); } catch {} }, [resp]);

  const terminado = paso >= ACTIVIDADES.length;
  const responder = (v: number) => {
    setResp((r) => { const n = [...r]; n[paso] = v; return n; });
    setPaso((p) => p + 1);
  };
  const reiniciar = () => { setResp(Array(ACTIVIDADES.length).fill(null)); setPaso(0); setAbierto(null); };

  const perfil = useMemo(() => puntajes(resp), [resp]);
  const codigo = useMemo(() => [...TIPOS].sort((a, b) => perfil[b] - perfil[a]).slice(0, 3), [perfil]);

  const sugeridas = useMemo(() => {
    if (!terminado) return [];
    const nombres = carreras.map((c) => ({ c, n: normalizar(c.nombre) }));
    return PERFILES.map((pf) => ({
      ...pf,
      af: afinidad(pf.codigo, perfil),
      programas: nombres.filter(({ n }) => pf.claves.some((k) => n.includes(k))).map(({ c }) => c),
    }))
      .filter((x) => x.programas.length > 0)
      .sort((a, b) => b.af - a.af)
      .slice(0, 8);
  }, [terminado, carreras, perfil]);

  const encabezado = (
    <div>
      <h1 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.025em] leading-tight text-[#0F172A]">Test vocacional</h1>
      <p className="text-sm text-[#64748B] mt-1 max-w-xl">
        30 actividades basadas en el modelo de intereses de Holland (RIASEC). Responde cuánto te gustaría hacer cada una y mira qué carreras van con tu perfil.
      </p>
    </div>
  );

  if (!terminado) {
    const act = ACTIVIDADES[paso];
    return (
      <div className="space-y-6">
        {encabezado}
        <Card className="space-y-6">
          <div>
            <div className="flex justify-between text-xs text-[#64748B] tabular-nums">
              <span>Actividad {paso + 1} de {ACTIVIDADES.length}</span>
              <span>{Math.round((paso / ACTIVIDADES.length) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#EBEEF2] mt-2 overflow-hidden">
              <div className="h-full w-full bg-[#2563EB] origin-left transition-transform duration-300 ease-out" style={{ transform: `scaleX(${paso / ACTIVIDADES.length})` }} />
            </div>
          </div>

          <div key={paso} className="entrada-seccion text-center py-2">
            <div className="text-xs text-[#64748B]">¿Cuánto te gustaría hacer esto?</div>
            <p className="text-xl md:text-2xl font-semibold tracking-[-0.015em] text-[#0F172A] mt-3 text-balance max-w-lg mx-auto">{act.txt}</p>
            <p className="text-xs text-[#94A3B8] mt-3">Piensa solo en si te gustaría, no en si sabes hacerlo.</p>
          </div>

          <div>
            <div className="grid grid-cols-5 gap-2">
              {ESCALA.map((v) => (
                <button
                  key={v}
                  onClick={() => responder(v)}
                  aria-label={`${v} de 5`}
                  className={`h-14 rounded-2xl text-lg font-semibold tabular-nums cursor-pointer ${resp[paso] === v ? 'bg-[#2563EB] text-white' : 'bg-[#F2F4F7] text-[#0F172A] hover:bg-[#EAF2FE]'}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-[#94A3B8] mt-2"><span>Nada</span><span>Mucho</span></div>
          </div>

          {paso > 0 && (
            <button onClick={() => setPaso((p) => p - 1)} className="inline-flex items-center gap-1 text-sm text-[#64748B] hover:text-[#0F172A] cursor-pointer">
              <ChevronLeft size={16} /> Anterior
            </button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {encabezado}

      <Card className="space-y-5">
        <div className="text-center">
          <div className="text-xs text-[#64748B]">Tu código Holland</div>
          <div className="flex justify-center gap-2 mt-3">
            {codigo.map((t) => (
              <div key={t} className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-semibold text-white" style={{ background: TIPO_INFO[t].color }}>
                {t}
              </div>
            ))}
          </div>
          <div className="text-lg font-semibold text-[#0F172A] mt-3">{codigo.map((t) => TIPO_INFO[t].nombre).join(' · ')}</div>
          <p className="text-sm text-[#64748B] mt-1 max-w-md mx-auto">{TIPO_INFO[codigo[0]].desc}</p>
        </div>

        <div className="space-y-2.5">
          {[...TIPOS].sort((a, b) => perfil[b] - perfil[a]).map((t) => (
            <div key={t} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-[#475569]">{TIPO_INFO[t].nombre}</span>
              <div className="flex-1 h-2 rounded-full bg-[#EBEEF2] overflow-hidden">
                <div className="h-full w-full origin-left rounded-full transition-transform duration-500 ease-out" style={{ transform: `scaleX(${perfil[t]})`, background: TIPO_INFO[t].color }} />
              </div>
              <span className="w-10 text-right tabular-nums font-semibold text-[#0F172A]">{Math.round(perfil[t] * 100)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="px-5 md:px-6 pt-5 pb-2">
          <h3 className="text-base font-semibold text-[#0F172A]">Carreras que van con tu perfil</h3>
          <p className="text-xs text-[#64748B] mt-0.5">Ordenadas por afinidad. Toca una para ver dónde se imparte.</p>
        </div>
        <ul>
          {sugeridas.map((s) => {
            const abiertaEsta = abierto === s.label;
            const programas = [...s.programas].sort((a, b) => (b.puntajeCorte ?? 0) - (a.puntajeCorte ?? 0)).slice(0, 6);
            return (
              <li key={s.label} className="border-t border-[#EEF1F5] first:border-t-0">
                <button
                  onClick={() => setAbierto(abiertaEsta ? null : s.label)}
                  aria-expanded={abiertaEsta}
                  className="w-full flex items-center gap-3 px-5 md:px-6 py-3 text-left hover:bg-[#F7F8FA] cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#0F172A]">{s.label}</div>
                    <div className="text-xs text-[#64748B]">{s.programas.length} programas · perfil {s.codigo}</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-[#2563EB]">{Math.round(s.af * 100)}%</div>
                  <ChevronRight size={16} className={`text-[#94A3B8] transition-transform duration-200 ${abiertaEsta ? 'rotate-90' : ''}`} />
                </button>
                {abiertaEsta && (
                  <ul className="pb-2">
                    {programas.map((c) => (
                      <li key={c.id}>
                        <button onClick={() => onOpenDetail(c)} className="w-full flex items-center gap-3 pl-9 md:pl-10 pr-5 md:pr-6 py-2 text-left hover:bg-[#F7F8FA] cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[#0F172A] truncate">{c.nombre}</div>
                            <div className="text-xs text-[#64748B] truncate">{displayNombreUniversidad(c)}</div>
                          </div>
                          <div className="text-xs text-[#94A3B8] tabular-nums shrink-0">
                            {c.puntajeCorte != null ? `corte ${c.puntajeCorte.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'sin corte'}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="flex flex-col items-center gap-2">
        <button onClick={reiniciar} className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] px-3 h-10 rounded-xl hover:bg-[#F2F4F7] cursor-pointer">
          <RotateCcw size={15} /> Hacer el test de nuevo
        </button>
        <p className="text-xs text-[#94A3B8] flex items-center gap-1.5"><Compass size={13} /> Es una orientación según tus intereses, no un diagnóstico.</p>
      </div>
    </div>
  );
}

export default React.memo(TestVocacionalSection);
