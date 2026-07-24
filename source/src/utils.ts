import { AppState, CarreraConDetalle } from './types';
import { tablasPAES } from './data';

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
  cienciasModule: 'biologia' | 'fisica' | 'quimica',
  carrera: CarreraConDetalle
): number | null {
  if (!carrera.ponderacion) return null;
  const w = carrera.ponderacion;

  // Map correct answers to PAES scores
  const scoreLectora = tablasPAES.lectora[lectoraCorrect] ?? 100;
  const scoreM1 = tablasPAES.m1[m1Correct] ?? 100;
  const scoreM2 = tablasPAES.m2[m2Correct] ?? 100;

  const cienciasKey = `ciencias_${cienciasModule}` as 'ciencias_biologia' | 'ciencias_fisica' | 'ciencias_quimica';
  const scoreCiencias = tablasPAES[cienciasKey]?.[cienciasCorrect] ?? 100;
  const scoreHistoria = tablasPAES.historia[historiaCorrect] ?? 100;

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
      tui: state.targetUniIndex,
      cs: state.compareSlots,
      ge: state.grupoEducativo,
      pg: state.percentilGeneracion,
      fv: state.favoritos,
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
export function decodeState(encoded: string): Partial<AppState> | null {
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
      targetUniIndex: compactObj.tui ?? 0,
      compareSlots: compactObj.cs ?? ['', '', ''],
      grupoEducativo: compactObj.ge ?? 'CH_DIURNO',
      percentilGeneracion: compactObj.pg ?? '',
      favoritos: compactObj.fv ?? [],
    };
  } catch (e) {
    console.error('Failed to decode state', e);
    return null;
  }
}
