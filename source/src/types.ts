import type { PruebaId } from './constants';

export type ElectiveType = 'ciencias' | 'historia' | 'mejor';

export type CienciasModule = 'biologia' | 'fisica' | 'quimica';

export type TierType = 'verified' | 'medium' | 'partial' | 'broken' | 'nodata';

export type GrupoEducativo = 'CH_DIURNO' | 'ADULTOS' | 'TECNICO_PROFESIONAL';

export interface Universidad {
  id: string;
  nombre: string;
  tipo: 'CRUCH' | 'PRIVADA_ADSCRITA';
}

export interface Sede {
  id: string;
  universidadId: string;
  nombre: string;
  region: string | null;
}

export interface Carrera {
  id: string;
  universidadId: string;
  sedeId: string;
  nombre: string;
  jornada: string | null;
  duracion: string | null;
  vacantes: number | null;
  anioAdmision: number;
  categoria: string;
  tier: TierType;
  electivaTipo?: ElectiveType;
  corteNota?: string;
  nota?: string;
  // Datos oficiales DEMRE: puntajes mínimos de postulación y código.
  ponderadoMinimo?: number | null;
  promedioMinimo?: number | null;
  codigoDemre?: string;
}

export interface Ponderacion {
  carreraId: string;
  anioAdmision: number;
  nemPct: number;
  rankingPct: number;
  lecturaPct: number;
  m1Pct: number;
  m2Pct: number;
  cienciasPct: number;
  historiaPct: number;
  pruebaEspecialPct?: number;
}

export interface PuntajeCorte {
  carreraId: string;
  anioAdmision: number;
  puntajeCorte: number | null;
}

// Read-model that joins Carrera + Universidad + Sede + Ponderacion + PuntajeCorte
// for convenient consumption by the UI, while the underlying data stays normalized.
export interface CarreraConDetalle {
  id: string;
  nombre: string;
  categoria: string; // categoría agrupada (ver categoriasAlias.ts)
  categoriaOriginal: string; // categoría DEMRE tal como viene en los datos
  universidadNombre: string;
  universidadTipo: 'CRUCH' | 'PRIVADA_ADSCRITA';
  sedeNombre: string;
  region: string | null;
  anioAdmision: number;
  tier: TierType;
  electivaTipo?: ElectiveType;
  corteNota?: string;
  nota?: string;
  vacantes: number | null;
  ponderadoMinimo?: number | null;
  promedioMinimo?: number | null;
  codigoDemre?: string;
  ponderacion: Ponderacion | null;
  puntajeCorte: number | null;
}

export type CarrerasPorCategoria = Record<string, CarreraConDetalle[]>;

export interface AppState {
  grades: {
    g1: string;
    g2: string;
    g3: string;
    g4: string;
  };
  manualNem: string;
  manualRanking: string;
  grupoEducativo: GrupoEducativo;
  percentilGeneracion: string;
  scores: {
    lectora: number; // 0-60
    m1: number; // 0-60
    m2: number; // 0-49
    ciencias: number; // 0-75
    historia: number; // 0-60
  };
  cienciasModule: CienciasModule;
  // Pruebas que se ingresan como puntaje final en vez de respuestas correctas.
  modoPuntaje: PruebaId[];
  puntajesDirectos: Partial<Record<PruebaId, string>>;
  targetCareer: string;
  targetCarreraId: string; // id fijo de la carrera elegida ('' = ninguna)
  compareSlots: string[]; // ids de carrera ('' = vacío; enlaces antiguos traen "categoria:indice")
  favoritos: string[]; // carrera ids marcadas como favoritas
}
