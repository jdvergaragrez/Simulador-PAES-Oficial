import {
  Universidad,
  Sede,
  Carrera,
  Ponderacion,
  PuntajeCorte,
  CarreraConDetalle,
  CarrerasPorCategoria,
  GrupoEducativo,
} from './types';
import { categoriasAlias, categoriaGenerica } from './categoriasAlias';

export const tablasPAES = {
  lectora: {0:100,1:149,2:172,3:193,4:214,5:234,6:253,7:269,8:284,9:298,10:313,11:330,12:347,13:361,14:373,15:383,16:393,17:404,18:417,19:432,20:447,21:461,22:472,23:480,24:487,25:495,26:504,27:516,28:531,29:546,30:560,31:571,32:580,33:587,34:594,35:603,36:614,37:629,38:644,39:659,40:671,41:680,42:689,43:699,44:711,45:725,46:741,47:758,48:772,49:786,50:799,51:814,52:832,53:852,54:871,55:892,56:913,57:936,58:963,59:991,60:1000} as Record<number, number>,
  m1: {0:100,1:173,2:196,3:216,4:236,5:255,6:273,7:290,8:305,9:318,10:331,11:345,12:360,13:375,14:389,15:399,16:408,17:417,18:426,19:438,20:452,21:467,22:480,23:490,24:498,25:504,26:511,27:519,28:530,29:543,30:558,31:571,32:582,33:590,34:597,35:603,36:611,37:622,38:635,39:650,40:664,41:676,42:685,43:694,44:704,45:716,46:730,47:746,48:761,49:775,50:789,51:804,52:821,53:840,54:860,55:880,56:903,57:927,58:955,59:986,60:1000} as Record<number, number>,
  m2: {0:100,1:204,2:231,3:255,4:278,5:298,6:317,7:336,8:354,9:371,10:386,11:399,12:412,13:426,14:441,15:456,16:470,17:481,18:491,19:501,20:512,21:525,22:540,23:553,24:565,25:574,26:583,27:592,28:603,29:616,30:630,31:644,32:656,33:666,34:676,35:687,36:699,37:714,38:729,39:744,40:757,41:770,42:785,43:801,44:819,45:837,46:856,47:876,48:898,49:1000} as Record<number, number>,
  historia: {0:100,1:132,2:158,3:181,4:203,5:224,6:244,7:263,8:279,9:294,10:308,11:324,12:341,13:357,14:372,15:383,16:393,17:402,18:413,19:426,20:441,21:457,22:471,23:482,24:490,25:497,26:504,27:513,28:525,29:539,30:555,31:569,32:581,33:590,34:597,35:604,36:612,37:623,38:637,39:653,40:668,41:681,42:692,43:701,44:711,45:722,46:736,47:753,48:770,49:785,50:799,51:814,52:829,53:848,54:868,55:888,56:910,57:932,58:957,59:985,60:1000} as Record<number, number>,
  ciencias_biologia: {0:100,1:129,2:151,3:172,4:192,5:211,6:227,7:242,8:255,9:270,10:284,11:299,12:311,13:322,14:330,15:339,16:349,17:360,18:374,19:386,20:397,21:405,22:412,23:417,24:422,25:429,26:439,27:450,28:463,29:475,30:485,31:491,32:496,33:500,34:504,35:509,36:516,37:525,38:537,39:550,40:562,41:571,42:577,43:582,44:586,45:590,46:595,47:603,48:613,49:625,50:638,51:649,52:658,53:665,54:670,55:676,56:683,57:692,58:704,59:717,60:730,61:741,62:751,63:760,64:770,65:782,66:796,67:812,68:827,69:842,70:857,71:875,72:895,73:916,74:939,75:1000} as Record<number, number>,
  ciencias_fisica: {0:100,1:126,2:149,3:169,4:189,5:208,6:224,7:239,8:253,9:267,10:281,11:296,12:309,13:320,14:328,15:337,16:346,17:358,18:371,19:384,20:395,21:404,22:410,23:416,24:421,25:427,26:436,27:448,28:460,29:473,30:483,31:490,32:495,33:499,34:503,35:508,36:514,37:523,38:535,39:548,40:560,41:569,42:576,43:581,44:585,45:589,46:594,47:601,48:611,49:623,50:636,51:648,52:657,53:664,54:669,55:675,56:682,57:691,58:703,59:716,60:729,61:740,62:750,63:759,64:769,65:781,66:796,67:811,68:826,69:841,70:857,71:874,72:894,73:915,74:939,75:1000} as Record<number, number>,
  ciencias_quimica: {0:100,1:124,2:147,3:168,4:187,5:206,6:222,7:237,8:250,9:264,10:278,11:293,12:306,13:317,14:326,15:334,16:343,17:353,18:366,19:379,20:391,21:401,22:408,23:413,24:418,25:424,26:432,27:442,28:454,29:467,30:478,31:487,32:493,33:497,34:501,35:505,36:510,37:518,38:528,39:541,40:553,41:564,42:573,43:579,44:583,45:587,46:591,47:597,48:606,49:617,50:629,51:642,52:652,53:660,54:667,55:672,56:679,57:687,58:697,59:710,60:724,61:736,62:746,63:756,64:766,65:777,66:791,67:807,68:822,69:837,70:853,71:871,72:890,73:912,74:935,75:1000} as Record<number, number>
};

// Join: builds the categoria -> CarreraConDetalle[] read model from the normalized seeds.
// Las categorías equivalentes se agrupan (categoriasAlias.ts). Dentro de cada grupo van primero
// las carreras de la categoría genérica y luego las unidas, para que los índices antiguos
// "categoria:indice" de la categoría genérica sigan apuntando a la misma carrera.
function buildCarrerasPorCategoria(
  universidades: Universidad[],
  sedes: Sede[],
  carreras: Carrera[],
  ponderaciones: Ponderacion[],
  puntajesCorte: PuntajeCorte[]
): CarrerasPorCategoria {
  const universidadesById = new Map(universidades.map((u) => [u.id, u]));
  const sedesById = new Map(sedes.map((s) => [s.id, s]));
  const ponderacionByCarreraId = new Map(ponderaciones.map((p) => [p.carreraId, p]));
  const corteByCarreraId = new Map(puntajesCorte.map((c) => [c.carreraId, c]));

  const porOriginal: CarrerasPorCategoria = {};

  carreras.forEach((carrera) => {
    const universidad = universidadesById.get(carrera.universidadId);
    const sede = sedesById.get(carrera.sedeId);
    const corte = corteByCarreraId.get(carrera.id);

    const view: CarreraConDetalle = {
      id: carrera.id,
      nombre: carrera.nombre,
      categoria: categoriaGenerica(carrera.categoria),
      categoriaOriginal: carrera.categoria,
      universidadNombre: universidad?.nombre ?? '—',
      universidadTipo: universidad?.tipo ?? 'PRIVADA_ADSCRITA',
      sedeNombre: sede?.nombre ?? 'Sede Principal',
      region: sede?.region ?? null,
      anioAdmision: carrera.anioAdmision,
      tier: carrera.tier,
      electivaTipo: carrera.electivaTipo,
      corteNota: carrera.corteNota,
      nota: carrera.nota,
      vacantes: carrera.vacantes ?? null,
      ponderadoMinimo: carrera.ponderadoMinimo ?? null,
      promedioMinimo: carrera.promedioMinimo ?? null,
      codigoDemre: carrera.codigoDemre,
      ponderacion: ponderacionByCarreraId.get(carrera.id) ?? null,
      puntajeCorte: corte?.puntajeCorte ?? null,
    };

    (porOriginal[carrera.categoria] ??= []).push(view);
  });

  const result: CarrerasPorCategoria = {};
  const originales = Object.keys(porOriginal);
  for (const key of originales) {
    if (categoriaGenerica(key) === key) result[key] = [...porOriginal[key]];
  }
  for (const key of originales) {
    const generica = categoriaGenerica(key);
    if (generica !== key) (result[generica] ??= []).push(...porOriginal[key]);
  }
  return result;
}

export interface Catalogo {
  anio: number;
  etiqueta: string;
  fuente: string;
  tieneCortes: boolean;
  // Proceso de admisión al que corresponden los puntajes de corte mostrados.
  anioCortes: number;
  porCategoria: CarrerasPorCategoria;
  categoriaDisplay: Record<string, string>;
  todas: CarreraConDetalle[];
  totalCarreras: number;
  totalUniversidades: number;
}

const PALABRAS_MENORES = new Set(['a', 'al', 'and', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'los', 'o', 'para', 'u', 'y']);

// "INGENIERÍA EN ALIMENTOS" -> "Ingeniería en Alimentos" (DEMRE publica las categorías en mayúsculas).
export function formatoTitulo(s: string): string {
  let primera = true;
  return s.toLocaleLowerCase('es-CL').replace(/\p{L}+/gu, (w) => {
    const menor = !primera && PALABRAS_MENORES.has(w);
    primera = false;
    return menor ? w : w[0].toLocaleUpperCase('es-CL') + w.slice(1);
  });
}

// Nombre a mostrar de cada categoría, en formato título; el de la genérica cuando agrupa variantes.
function displayAgrupado(display: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(display)) out[k] = formatoTitulo(v);
  for (const alias of Object.values(categoriasAlias)) out[alias.generica] = alias.nombre;
  return out;
}

// Flattens the categoria map into a single list for global search.
function flattenCatalogo(porCategoria: CarrerasPorCategoria): CarreraConDetalle[] {
  const out: CarreraConDetalle[] = [];
  for (const key of Object.keys(porCategoria)) {
    for (const c of porCategoria[key]) out.push(c);
  }
  return out;
}

// El catálogo (~1 MB) se descarga en un chunk aparte vía import() dinámico, para que la app
// pinte antes. La promesa se cachea: todas las llamadas comparten la misma descarga.
let catalogoPromise: Promise<Catalogo> | null = null;

export function loadCatalogo(): Promise<Catalogo> {
  if (!catalogoPromise) {
    catalogoPromise = import('./data2027.generated')
      .then((d) => {
        const porCategoria = buildCarrerasPorCategoria(
          d.universidades2027,
          d.sedes2027,
          d.carreras2027,
          d.ponderaciones2027,
          d.puntajesCorte2027
        );
        return {
          anio: 2027,
          etiqueta: 'Admisión 2027',
          fuente: 'Ponderaciones DEMRE 2027 + cortes 2026',
          tieneCortes: true,
          anioCortes: 2026,
          porCategoria,
          categoriaDisplay: displayAgrupado(d.categoriaDisplay2027),
          todas: flattenCatalogo(porCategoria),
          totalCarreras: d.carreras2027.length,
          totalUniversidades: d.universidades2027.length,
        };
      })
      .catch((err) => {
        catalogoPromise = null; // permite reintentar si falló la red
        throw err;
      });
  }
  return catalogoPromise;
}

// Display label for a CarreraConDetalle, mirroring the old "nombre" field
// (base university name + sede annotation when it's not the default sede).
export function displayNombreUniversidad(carrera: CarreraConDetalle): string {
  return carrera.sedeNombre === 'Sede Principal'
    ? carrera.universidadNombre
    : `${carrera.universidadNombre} (${carrera.sedeNombre})`;
}

// Accent/case-insensitive normalization for text search.
export function normalizar(s: string): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const nemAnchors = [[4.0,100],[5.0,450],[6.0,700],[6.4,828],[6.7,914],[6.9,970],[7.0,1000]];

export function nemFromGrade(g: number, _grupo: GrupoEducativo = 'CH_DIURNO'): number {
  if (isNaN(g) || g < 1.0) return 100;
  if (g <= 4.0) return 100;
  if (g >= 7.0) return 1000;
  for (let i = 0; i < nemAnchors.length - 1; i++) {
    const [g1, p1] = nemAnchors[i];
    const [g2, p2] = nemAnchors[i + 1];
    if (g >= g1 && g <= g2) {
      return Math.round(p1 + ((p2 - p1) * (g - g1)) / (g2 - g1));
    }
  }
  return 100;
}

// Bonus curve (in points, added on top of the NEM score) based on the
// student's approximate percentile within their graduating class.
// NOTE: esto es una aproximación no oficial. El Ranking real de DEMRE
// depende del desempeño histórico de cada colegio y no está publicado
// como tabla pública — falta verificar/calibrar contra fuente oficial.
const rankingBonusAnchors: [number, number][] = [
  [1, 100], [5, 90], [10, 75], [20, 55], [30, 35], [50, 10], [70, -20], [100, -60],
];

export const percentilOptions: { value: string; label: string }[] = [
  { value: '1', label: 'Top 1% de mi generación' },
  { value: '5', label: 'Top 5%' },
  { value: '10', label: 'Top 10%' },
  { value: '20', label: 'Top 20%' },
  { value: '30', label: 'Top 30%' },
  { value: '50', label: 'Top 50%' },
  { value: '70', label: 'Top 70%' },
  { value: '100', label: 'No lo sé / resto de la generación' },
];

export function rankingFromPercentil(nemScore: number, percentil: number, _grupo: GrupoEducativo = 'CH_DIURNO'): number {
  let bonus = rankingBonusAnchors[rankingBonusAnchors.length - 1][1];
  for (let i = 0; i < rankingBonusAnchors.length - 1; i++) {
    const [p1, b1] = rankingBonusAnchors[i];
    const [p2, b2] = rankingBonusAnchors[i + 1];
    if (percentil >= p1 && percentil <= p2) {
      bonus = b1 + ((b2 - b1) * (percentil - p1)) / (p2 - p1);
      break;
    }
  }
  return Math.max(100, Math.min(1000, Math.round(nemScore + bonus)));
}

export const grupoEducativoOptions: { value: GrupoEducativo; label: string }[] = [
  { value: 'CH_DIURNO', label: 'Científico-Humanista Diurno' },
  { value: 'ADULTOS', label: 'Educación de Adultos' },
  { value: 'TECNICO_PROFESIONAL', label: 'Técnico-Profesional' },
];
