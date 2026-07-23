import { AppState, Universidad } from './types';
import { tablasPAES } from './data';

/**
 * Calculates the weighted PAES score (Puntaje Ponderado) for a specific university admission requirement.
 * Returns null if the university has no weights defined.
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
  uni: Universidad
): number | null {
  if (!uni.weights) return null;

  // Map correct answers to PAES scores
  const scoreLectora = tablasPAES.lectora[lectoraCorrect] ?? 100;
  const scoreM1 = tablasPAES.m1[m1Correct] ?? 100;
  const scoreM2 = tablasPAES.m2[m2Correct] ?? 100;

  const cienciasKey = `ciencias_${cienciasModule}` as 'ciencias_biologia' | 'ciencias_fisica' | 'ciencias_quimica';
  const scoreCiencias = tablasPAES[cienciasKey]?.[cienciasCorrect] ?? 100;
  const scoreHistoria = tablasPAES.historia[historiaCorrect] ?? 100;

  // Determine elective score based on university preference
  let scoreElectivo = 100;
  if (uni.electivaTipo === 'ciencias') {
    scoreElectivo = scoreCiencias;
  } else if (uni.electivaTipo === 'historia') {
    scoreElectivo = scoreHistoria;
  } else if (uni.electivaTipo === 'mejor') {
    scoreElectivo = Math.max(scoreCiencias, scoreHistoria);
  }

  const { w_nem, w_ranking, w_lectora, w_m1, w_m2, w_electivo } = {
    w_nem: uni.weights.nem,
    w_ranking: uni.weights.ranking,
    w_lectora: uni.weights.lectora,
    w_m1: uni.weights.m1,
    w_m2: uni.weights.m2,
    w_electivo: uni.weights.electivo,
  };

  const scoreTotal =
    nem * w_nem +
    ranking * w_ranking +
    scoreLectora * w_lectora +
    scoreM1 * w_m1 +
    scoreM2 * w_m2 +
    scoreElectivo * w_electivo;

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
    };
  } catch (e) {
    console.error('Failed to decode state', e);
    return null;
  }
}
