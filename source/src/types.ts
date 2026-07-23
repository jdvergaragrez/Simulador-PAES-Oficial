export type CareerKey = 'civil' | 'comercial' | 'medicina' | 'derecho' | 'psicologia' | 'agronomia';

export type ElectiveType = 'ciencias' | 'historia' | 'mejor';

export type TierType = 'verified' | 'medium' | 'partial' | 'broken' | 'nodata';

export interface Weights {
  nem: number;
  ranking: number;
  lectora: number;
  m1: number;
  m2: number;
  electivo: number;
}

export interface Universidad {
  nombre: string;
  tier: TierType;
  corte: number | null;
  electivaTipo?: ElectiveType;
  weights: Weights | null;
  corteNota?: string;
  nota?: string;
}

export type UniversidadesData = Record<CareerKey, Universidad[]>;

export interface AppState {
  grades: {
    g1: string;
    g2: string;
    g3: string;
    g4: string;
  };
  manualNem: string;
  manualRanking: string;
  scores: {
    lectora: number; // 0-60
    m1: number; // 0-60
    m2: number; // 0-49
    ciencias: number; // 0-75
    historia: number; // 0-60
  };
  cienciasModule: 'biologia' | 'fisica' | 'quimica';
  targetCareer: CareerKey;
  targetUniIndex: number;
  compareSlots: string[]; // encoded strings of "careerKey:uniIndex" or ""
}
