import { normalizar } from './data';

// Áreas de carrera: las usa el test vocacional y el tinte del encabezado en "Mi puntaje".
export type Area = 'salud' | 'ingenieria' | 'ciencias' | 'sociales' | 'arte' | 'negocios' | 'derecho' | 'educacion';

export const AREA_LABEL: Record<Area, string> = {
  salud: 'Salud', ingenieria: 'Ingeniería y Tecnología', ciencias: 'Ciencias', sociales: 'Ciencias Sociales y Humanidades',
  arte: 'Arte y Diseño', negocios: 'Negocios y Administración', derecho: 'Derecho', educacion: 'Educación',
};

export const AREA_KEYWORDS: Record<Area, string[]> = {
  salud: ['medicina', 'enfermer', 'kinesiolog', 'odontolog', 'nutricion', 'obstetricia', 'fonoaudiolog', 'tecnologia medica', 'quimica y farmacia', 'terapia'],
  ingenieria: ['ingenieria', 'informatica', 'computacion', 'construccion', 'geomensura', 'mecatronica'],
  ciencias: ['biologia', 'quimica', 'fisica', 'astronom', 'geologia', 'bioquimica', 'biotecnologia', 'matematica', 'estadistica'],
  sociales: ['sociologia', 'antropologia', 'historia', 'filosofia', 'psicologia', 'trabajo social', 'geografia', 'periodismo', 'ciencia politica', 'relaciones internacionales'],
  arte: ['arte', 'diseno', 'musica', 'teatro', 'actuacion', 'cine', 'danza', 'audiovisual', 'animacion', 'ilustracion'],
  negocios: ['comercial', 'administracion', 'contador', 'auditor', 'economia', 'negocio', 'marketing', 'finanzas', 'turismo'],
  derecho: ['derecho'],
  educacion: ['pedagogia', 'educacion parvularia', 'educacion basica', 'educacion diferencial'],
};

// Orden de prueba: lo más específico primero ("Ingeniería Comercial" es Negocios, "Pedagogía en Biología" es Educación).
const ORDEN: Area[] = ['derecho', 'educacion', 'salud', 'negocios', 'arte', 'ingenieria', 'ciencias', 'sociales'];

export function areaDeCarrera(nombre: string): Area | null {
  const n = normalizar(nombre);
  return ORDEN.find((a) => AREA_KEYWORDS[a].some((k) => n.includes(k))) ?? null;
}

// Tono suave por área para el encabezado (claro / oscuro). El color dice de qué área es la carrera.
export const AREA_TINTE: Record<Area, { claro: string; oscuro: string }> = {
  salud: { claro: '#DDF3E8', oscuro: '#0F2A22' },
  ingenieria: { claro: '#DCEBFB', oscuro: '#0F2240' },
  ciencias: { claro: '#DDF1EF', oscuro: '#0E2A2A' },
  sociales: { claro: '#ECE6F8', oscuro: '#1F1B38' },
  arte: { claro: '#F9E6EC', oscuro: '#2E1823' },
  negocios: { claro: '#FBEFD6', oscuro: '#2B2212' },
  derecho: { claro: '#F3E9DA', oscuro: '#2A2217' },
  educacion: { claro: '#FDE9DC', oscuro: '#2E1D12' },
};
