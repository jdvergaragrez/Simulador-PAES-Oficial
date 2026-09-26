import { Target, Undo2, Search, Scale, Compass, ChartLine, Share2, type LucideIcon } from 'lucide-react';

export type NavId = 'puntaje' | 'inverso' | 'buscar' | 'comparar' | 'vocacional' | 'ensayos' | 'compartir';

export interface NavItem {
  id: NavId;
  label: string;
  short: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<NavId, NavItem> = {
  puntaje: { id: 'puntaje', label: 'Mi puntaje', short: 'Puntaje', icon: Target },
  inverso: { id: 'inverso', label: 'Simulador inverso', short: 'Inverso', icon: Undo2 },
  buscar: { id: 'buscar', label: 'Buscar carrera', short: 'Buscar', icon: Search },
  comparar: { id: 'comparar', label: 'Comparar', short: 'Comparar', icon: Scale },
  vocacional: { id: 'vocacional', label: 'Test vocacional', short: 'Vocacional', icon: Compass },
  ensayos: { id: 'ensayos', label: 'Mis ensayos', short: 'Ensayos', icon: ChartLine },
  compartir: { id: 'compartir', label: 'Guardar y compartir', short: 'Compartir', icon: Share2 },
};

export const NAV_GRUPOS: { titulo: string; items: NavId[] }[] = [
  { titulo: 'Calcular', items: ['puntaje', 'inverso'] },
  { titulo: 'Explorar', items: ['buscar', 'comparar', 'vocacional'] },
  { titulo: 'Planificar', items: ['ensayos', 'compartir'] },
];

// Accesos fijos de la barra inferior en celular; el resto va en "Más".
export const NAV_MOVIL: NavId[] = ['puntaje', 'inverso', 'buscar'];
