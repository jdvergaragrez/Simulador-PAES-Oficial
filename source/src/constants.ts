export type PruebaId = 'lectora' | 'm1' | 'm2' | 'ciencias' | 'historia';

// `tint`/`ink` son variables CSS (definidas en index.css, con variante :root.dark) para usar en
// estilos inline. `hex` guarda los valores de modo claro para canvas/PDF, donde no hay CSS.
export interface Tono {
  color: string;
  tint: string;
  ink: string;
  hex: { tint: string; ink: string };
}

export interface PruebaMeta extends Tono {
  id: PruebaId;
  label: string;
  short: string;
  max: number;
}

const tono = (nombre: string, color: string, tint: string, ink: string): Tono => ({
  color,
  tint: `var(--${nombre}-tint)`,
  ink: `var(--${nombre}-ink)`,
  hex: { tint, ink },
});

export const PRUEBAS: Record<PruebaId, PruebaMeta> = {
  lectora: { id: 'lectora', label: 'Lenguaje', short: 'Lenguaje', max: 60, ...tono('p-lectora', '#E11D48', '#FFE4E6', '#9F1239') },
  m1: { id: 'm1', label: 'Matemática 1', short: 'M1', max: 60, ...tono('p-m1', '#2563EB', '#DBEAFE', '#1E40AF') },
  m2: { id: 'm2', label: 'Matemática 2', short: 'M2', max: 49, ...tono('p-m2', '#D97706', '#FEF3C7', '#92400E') },
  ciencias: { id: 'ciencias', label: 'Ciencias', short: 'Ciencias', max: 75, ...tono('p-ciencias', '#22C55E', '#DCFCE7', '#166534') },
  historia: { id: 'historia', label: 'Historia', short: 'Historia', max: 60, ...tono('p-historia', '#166534', '#D1FAE5', '#14532D') },
};

export const PRUEBAS_ORDEN: PruebaId[] = ['lectora', 'm1', 'm2', 'ciencias', 'historia'];

export type EstadoCorte = 'alcanzable' | 'limite' | 'noalcanza' | 'sindato';

// Margen en puntos bajo el corte que todavía se considera "al límite".
export const MARGEN_LIMITE = 10;

export function estadoCorte(puntaje: number, corte: number | null): EstadoCorte {
  if (corte === null) return 'sindato';
  const d = puntaje - corte;
  if (d >= 0) return 'alcanzable';
  if (d >= -MARGEN_LIMITE) return 'limite';
  return 'noalcanza';
}

export const ESTADOS: Record<EstadoCorte, Tono & { label: string }> = {
  alcanzable: { label: 'Alcanzable', ...tono('e-alcanzable', '#16A34A', '#DCFCE7', '#166534') },
  limite: { label: 'Al límite', ...tono('e-limite', '#D97706', '#FEF3C7', '#92400E') },
  noalcanza: { label: 'No alcanzas', ...tono('e-noalcanza', '#DC2626', '#FEE2E2', '#991B1B') },
  sindato: { label: 'Sin corte', ...tono('e-sindato', '#94A3B8', '#F1F5F9', '#475569') },
};
