import { AppState, CarreraConDetalle, CarrerasPorCategoria, CienciasModule } from './types';
import { tablasPAES } from './data';
import { PruebaId } from './constants';
import { categoriaGenerica } from './categoriasAlias';

// Puntajes ingresados directamente (modo "Puntaje"), ya validados en rango 100–1000.
export type PuntajesDirectos = Partial<Record<PruebaId, number>>;

export function tablaPrueba(prueba: PruebaId, mod: CienciasModule): Record<number, number> {
  return prueba === 'ciencias' ? tablasPAES[`ciencias_${mod}` as const] : tablasPAES[prueba];
}

export function puntajePrueba(prueba: PruebaId, correctas: number, mod: CienciasModule, directos?: PuntajesDirectos): number {
  return directos?.[prueba] ?? tablaPrueba(prueba, mod)[correctas] ?? 100;
}

// Respuestas correctas de la tabla cuyo puntaje es el más cercano al dado.
export function correctasEquivalentes(prueba: PruebaId, puntaje: number, mod: CienciasModule): number {
  let best = 0, diff = Infinity;
  for (const [a, p] of Object.entries(tablaPrueba(prueba, mod))) {
    const d = Math.abs(p - puntaje);
    if (d < diff) { diff = d; best = Number(a); }
  }
  return best;
}

// Correctas "actuales" de una prueba: las del slider o, si está en modo puntaje, su equivalente.
export function correctasActuales(prueba: PruebaId, slider: number, mod: CienciasModule, directos: PuntajesDirectos): number {
  const d = directos[prueba];
  return d !== undefined ? correctasEquivalentes(prueba, d, mod) : slider;
}

export function sinPrueba(directos: PuntajesDirectos, prueba: PruebaId): PuntajesDirectos {
  const { [prueba]: _, ...resto } = directos;
  return resto;
}

/**
 * Calculates the weighted PAES score (Puntaje Ponderado) for a specific university admission requirement.
 * Returns null if the carrera has no ponderación defined.
 */
export function calculatePonderado(
  nem: number,
  ranking: number,
  lectoraCorrect: number,
  m1Correct: number,
  m2Correct: number,
  cienciasCorrect: number,
  historiaCorrect: number,
  cienciasModule: CienciasModule,
  carrera: CarreraConDetalle,
  directos?: PuntajesDirectos
): number | null {
  if (!carrera.ponderacion) return null;
  const w = carrera.ponderacion;

  const scoreLectora = puntajePrueba('lectora', lectoraCorrect, cienciasModule, directos);
  const scoreM1 = puntajePrueba('m1', m1Correct, cienciasModule, directos);
  const scoreM2 = puntajePrueba('m2', m2Correct, cienciasModule, directos);
  const scoreCiencias = puntajePrueba('ciencias', cienciasCorrect, cienciasModule, directos);
  const scoreHistoria = puntajePrueba('historia', historiaCorrect, cienciasModule, directos);

  // Determine elective score based on university preference
  let scoreElectivo = 100;
  let pctElectivo = 0;
  if (carrera.electivaTipo === 'ciencias') {
    scoreElectivo = scoreCiencias;
    pctElectivo = w.cienciasPct;
  } else if (carrera.electivaTipo === 'historia') {
    scoreElectivo = scoreHistoria;
    pctElectivo = w.historiaPct;
  } else if (carrera.electivaTipo === 'mejor') {
    if (scoreCiencias >= scoreHistoria) {
      scoreElectivo = scoreCiencias;
      pctElectivo = w.cienciasPct;
    } else {
      scoreElectivo = scoreHistoria;
      pctElectivo = w.historiaPct;
    }
  }

  const scoreTotal =
    nem * w.nemPct +
    ranking * w.rankingPct +
    scoreLectora * w.lecturaPct +
    scoreM1 * w.m1Pct +
    scoreM2 * w.m2Pct +
    scoreElectivo * pctElectivo;

  // Return value rounded to 2 decimal places to match Chilean admission standard format
  return Math.round(scoreTotal) / 100;
}

// Estado parcial leído de un enlace o del localStorage. legacyUniIndex viene del formato
// antiguo (tc + tui) y se traduce a targetCarreraId cuando el catálogo está cargado.
export type EstadoDecodificado = Partial<AppState> & { legacyUniIndex?: number };

// Carrera guardada como "categoría + índice". Si la categoría es una variante que hoy se agrupa
// en otra (categoriasAlias.ts), el índice se cuenta dentro de esa variante, como antes de agrupar.
export function carreraPorIndice(porCategoria: CarrerasPorCategoria, categoria: string, indice: number): CarreraConDetalle | null {
  const generica = categoriaGenerica(categoria);
  const lista = porCategoria[generica] ?? [];
  if (generica === categoria) return lista[indice] ?? null;
  return lista.filter((c) => c.categoriaOriginal === categoria)[indice] ?? null;
}

// Traduce el formato antiguo (categoría + índice de universidad) al id fijo de la carrera.
export function resolverCarreraLegacy(porCategoria: CarrerasPorCategoria, categoria: string, uniIndex: number): string {
  return carreraPorIndice(porCategoria, categoria, uniIndex)?.id ?? '';
}

/**
 * Encodes AppState to base64 compact representation for clean URLs
 */
export function encodeState(state: AppState): string {
  try {
    const compactObj = {
      g: [state.grades.g1, state.grades.g2, state.grades.g3, state.grades.g4],
      mn: state.manualNem,
      mr: state.manualRanking,
      s: [
        state.scores.lectora,
        state.scores.m1,
        state.scores.m2,
        state.scores.ciencias,
        state.scores.historia,
      ],
      cm: state.cienciasModule,
      tc: state.targetCareer,
      tid: state.targetCarreraId,
      cs: state.compareSlots,
      ge: state.grupoEducativo,
      pg: state.percentilGeneracion,
      fv: state.favoritos,
      mp: state.modoPuntaje,
      pd: state.puntajesDirectos,
    };
    const jsonStr = JSON.stringify(compactObj);
    // Use btoa safely for unicode or base64 representation
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch (e) {
    console.error('Failed to encode state', e);
    return '';
  }
}

/**
 * Decodes base64 string to partial AppState
 */
export function decodeState(encoded: string): EstadoDecodificado | null {
  try {
    const jsonStr = decodeURIComponent(escape(atob(encoded)));
    const compactObj = JSON.parse(jsonStr);
    if (!compactObj) return null;

    return {
      grades: {
        g1: compactObj.g?.[0] ?? '',
        g2: compactObj.g?.[1] ?? '',
        g3: compactObj.g?.[2] ?? '',
        g4: compactObj.g?.[3] ?? '',
      },
      manualNem: compactObj.mn ?? '',
      manualRanking: compactObj.mr ?? '',
      scores: {
        lectora: compactObj.s?.[0] ?? 0,
        m1: compactObj.s?.[1] ?? 0,
        m2: compactObj.s?.[2] ?? 0,
        ciencias: compactObj.s?.[3] ?? 0,
        historia: compactObj.s?.[4] ?? 0,
      },
      cienciasModule: compactObj.cm ?? 'fisica',
      targetCareer: compactObj.tc ?? 'civil',
      targetCarreraId: typeof compactObj.tid === 'string' ? compactObj.tid : '',
      // Enlaces antiguos guardaban la posición de la universidad dentro de la categoría.
      legacyUniIndex: typeof compactObj.tid !== 'string' && typeof compactObj.tui === 'number' ? compactObj.tui : undefined,
      compareSlots: compactObj.cs ?? ['', '', ''],
      grupoEducativo: compactObj.ge ?? 'CH_DIURNO',
      percentilGeneracion: compactObj.pg ?? '',
      favoritos: compactObj.fv ?? [],
      modoPuntaje: compactObj.mp ?? [],
      puntajesDirectos: compactObj.pd ?? {},
    };
  } catch (e) {
    console.error('Failed to decode state', e);
    return null;
  }
}
