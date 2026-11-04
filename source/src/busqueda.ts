// Búsqueda de carreras compartida por el selector principal y el buscador general.
// - Siglas de universidades ("uc", "usach"…) solo como palabra completa: filtran por universidad.
// - Abreviaturas ("ing", "ped", "psico"…) se expanden a la palabra completa.
// - Tolera errores de tipeo con distancia de edición acotada sobre un vocabulario precalculado,
//   así cada búsqueda recorre unos pocos miles de palabras y no todo el catálogo.
import { CarreraConDetalle } from './types';
import { normalizar } from './data';

// Sigla -> nombre oficial de la universidad (tal como viene en el catálogo).
export const SIGLAS_UNIVERSIDAD: Record<string, string> = {
  uc: 'Pontificia Universidad Católica de Chile',
  puc: 'Pontificia Universidad Católica de Chile',
  pucv: 'Pontificia Universidad Católica de Valparaíso',
  uchile: 'Universidad de Chile',
  usach: 'Universidad de Santiago de Chile',
  udec: 'Universidad de Concepción',
  usm: 'Universidad Técnica Federico Santa María',
  utfsm: 'Universidad Técnica Federico Santa María',
  uai: 'Universidad Adolfo Ibáñez',
  udp: 'Universidad Diego Portales',
  uandes: 'Universidad de los Andes',
  unab: 'Universidad Andrés Bello',
  udd: 'Universidad del Desarrollo',
  uach: 'Universidad Austral de Chile',
  ucn: 'Universidad Católica del Norte',
  ufro: 'Universidad de La Frontera',
  utalca: 'Universidad de Talca',
  uv: 'Universidad de Valparaíso',
  uvalpo: 'Universidad de Valparaíso',
  upla: 'Universidad de Playa Ancha',
  uss: 'Universidad San Sebastián',
  ust: 'Universidad Santo Tomás',
  umayor: 'Universidad Mayor',
  ucsc: 'Universidad Católica de la Santísima Concepción',
  uct: 'Universidad Católica de Temuco',
  ucm: 'Universidad Católica del Maule',
  ucsh: 'Universidad Católica Silva Henríquez',
  ucentral: 'Universidad Central de Chile',
  uta: 'Universidad de Tarapacá',
  uantof: 'Universidad de Antofagasta',
  uda: 'Universidad de Atacama',
  ulagos: 'Universidad de Los Lagos',
  umag: 'Universidad de Magallanes',
  uoh: "Universidad de O'Higgins",
  userena: 'Universidad de La Serena',
  uls: 'Universidad de La Serena',
  ubb: 'Universidad del Bío-Bío',
  utem: 'Universidad Tecnológica Metropolitana',
  umce: 'Universidad Metropolitana de Ciencias de la Educación',
  uah: 'Universidad Alberto Hurtado',
  uft: 'Universidad Finis Terrae',
  ugm: 'Universidad Gabriela Mistral',
  udla: 'Universidad de Las Américas',
  uautonoma: 'Universidad Autónoma de Chile',
  uaysen: 'Universidad de Aysén',
  unap: 'Universidad Arturo Prat',
  ubo: "Universidad Bernardo O'Higgins",
  uahc: 'Universidad Academia de Humanismo Cristiano',
  uvm: 'Universidad Viña del Mar',
  unach: 'Universidad Adventista de Chile',
};

// Abreviatura -> palabra completa que debe aparecer.
export const ABREVIATURAS: Record<string, string> = {
  ing: 'ingenieria',
  inge: 'ingenieria',
  ped: 'pedagogia',
  pedago: 'pedagogia',
  sico: 'psicologia',
  psico: 'psicologia',
  psi: 'psicologia',
  info: 'informatica',
  compu: 'computacion',
  comer: 'comercial',
  med: 'medicina',
  enfe: 'enfermeria',
  kine: 'kinesiologia',
  fono: 'fonoaudiologia',
  nutri: 'nutricion',
  vet: 'veterinaria',
  odonto: 'odontologia',
  arq: 'arquitectura',
  arqui: 'arquitectura',
  tec: 'tecnologia',
  admin: 'administracion',
};

const STOPWORDS = new Set(['de', 'del', 'en', 'la', 'las', 'el', 'los', 'y', 'e', 'con', 'para', 'a']);

const palabras = (s: string) => normalizar(s).split(/[^a-z0-9ñ]+/).filter(Boolean);

// Distancia Damerau-Levenshtein (transposiciones adyacentes) con corte: devuelve max + 1 si la supera.
export function distancia(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let minFila = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      if (v < minFila) minFila = v;
    }
    if (minFila > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

// Errores de tipeo tolerados según el largo de la palabra (las cortas deben ir exactas).
const tolerancia = (len: number) => (len >= 8 ? 2 : len >= 4 ? 1 : 0);

interface IndiceBusqueda {
  vocab: string[]; // palabras únicas del catálogo
  frecuencia: Map<string, number>;
  carrera: Set<string>[]; // palabras de la carrera (nombre oficial + categoría)
  lugar: Set<string>[]; // palabras de universidad, sede y región
}

const indices = new WeakMap<CarreraConDetalle[], IndiceBusqueda>();

function indice(carreras: CarreraConDetalle[], categoriaDisplay: Record<string, string>): IndiceBusqueda {
  const cache = indices.get(carreras);
  if (cache) return cache;
  const frecuencia = new Map<string, number>();
  const contar = (set: Set<string>) => set.forEach((w) => frecuencia.set(w, (frecuencia.get(w) ?? 0) + 1));
  const carrera: Set<string>[] = [];
  const lugar: Set<string>[] = [];
  for (const c of carreras) {
    const a = new Set([...palabras(c.nombre), ...palabras(categoriaDisplay[c.categoria] ?? '')]);
    const b = new Set([...palabras(c.universidadNombre), ...palabras(c.sedeNombre), ...palabras(c.region ?? '')]);
    contar(a);
    contar(b);
    carrera.push(a);
    lugar.push(b);
  }
  const idx = { vocab: [...frecuencia.keys()], frecuencia, carrera, lugar };
  indices.set(carreras, idx);
  return idx;
}

export interface Termino {
  texto: string; // palabra a buscar (ya expandida si era abreviatura)
  original: string; // tal como la escribió el usuario (normalizada)
}

export interface ConsultaInterpretada {
  terminos: Termino[];
  universidades: string[]; // nombres oficiales filtrados por sigla
}

export function interpretar(query: string): ConsultaInterpretada {
  const tokens = palabras(query);
  const sinStop = tokens.filter((t) => !STOPWORDS.has(t));
  const terminos: Termino[] = [];
  const universidades: string[] = [];
  for (const t of sinStop.length ? sinStop : tokens) {
    const uni = SIGLAS_UNIVERSIDAD[t];
    if (uni) {
      if (!universidades.includes(uni)) universidades.push(uni);
      continue;
    }
    terminos.push({ texto: ABREVIATURAS[t] ?? t, original: t });
  }
  return { terminos, universidades };
}

// Palabras del vocabulario que calzan con un término, con su puntaje (exacta > prefijo > con errores).
function coincidencias(idx: IndiceBusqueda, texto: string): Map<string, number> {
  const out = new Map<string, number>();
  const tol = tolerancia(texto.length);
  for (const w of idx.vocab) {
    if (w === texto) out.set(w, 3);
    else if (texto.length >= 2 && w.startsWith(texto)) out.set(w, 2);
    else if (tol > 0) {
      if (distancia(texto, w, tol) <= tol) out.set(w, 1.5);
      // Mientras escribe: "ingene" ≈ "ingeni…"
      else if (w.length > texto.length && distancia(texto, w.slice(0, texto.length), 1) <= 1) out.set(w, 1);
    }
  }
  return out;
}

export interface ResultadoCarrera {
  carrera: CarreraConDetalle;
  puntaje: number;
}

export interface ResultadoBusqueda {
  resultados: ResultadoCarrera[];
  sugerencia: string | null; // "¿Quisiste decir…?" cuando no hay resultados
}

function puntuar(
  carreras: CarreraConDetalle[],
  idx: IndiceBusqueda,
  consulta: ConsultaInterpretada
): ResultadoCarrera[] {
  const porTermino = consulta.terminos.map((t) => coincidencias(idx, t.texto));
  const unis = consulta.universidades.length ? new Set(consulta.universidades) : null;
  const out: ResultadoCarrera[] = [];
  carreras.forEach((c, i) => {
    if (unis && !unis.has(c.universidadNombre)) return;
    let total = 0;
    for (const m of porTermino) {
      let mejor = 0;
      for (const [w, p] of m) {
        if (idx.carrera[i].has(w)) mejor = Math.max(mejor, p);
        else if (idx.lugar[i].has(w)) mejor = Math.max(mejor, p * 0.6);
        if (mejor === 3) break;
      }
      if (mejor === 0) return;
      total += mejor;
    }
    // A igual coincidencia, gana la carrera con nombre más corto (la más "exacta").
    total -= idx.carrera[i].size * 0.01;
    out.push({ carrera: c, puntaje: total });
  });
  return out.sort((a, b) => b.puntaje - a.puntaje);
}

// Corrige cada término a la palabra más frecuente del vocabulario con distancia ≤ 2.
function corregir(idx: IndiceBusqueda, consulta: ConsultaInterpretada, query: string): string | null {
  let cambio = false;
  const partes = palabras(query).map((t) => {
    if (SIGLAS_UNIVERSIDAD[t] || STOPWORDS.has(t)) return t;
    const texto = ABREVIATURAS[t] ?? t;
    if (idx.frecuencia.has(texto) || t.length < 3) return t;
    let mejor: string | null = null;
    let mejorD = 3;
    for (const w of idx.vocab) {
      const d = distancia(texto, w, 2);
      if (d < mejorD || (d === mejorD && mejor && (idx.frecuencia.get(w) ?? 0) > (idx.frecuencia.get(mejor) ?? 0))) {
        mejor = w;
        mejorD = d;
      }
    }
    if (mejor && mejorD <= 2) {
      cambio = true;
      return mejor;
    }
    return t;
  });
  return cambio && consulta.terminos.length ? partes.join(' ') : null;
}

export function buscarCarreras(
  carreras: CarreraConDetalle[],
  categoriaDisplay: Record<string, string>,
  query: string
): ResultadoBusqueda {
  const consulta = interpretar(query);
  if (!consulta.terminos.length && !consulta.universidades.length) return { resultados: [], sugerencia: null };
  const idx = indice(carreras, categoriaDisplay);
  const resultados = puntuar(carreras, idx, consulta);
  if (resultados.length) return { resultados, sugerencia: null };
  const corregida = corregir(idx, consulta, query);
  const sugerencia = corregida && puntuar(carreras, idx, interpretar(corregida)).length ? corregida : null;
  return { resultados, sugerencia };
}

// Universidades de una carrera: de corte más alto a más bajo, las sin corte al final.
export function compararPorCorte(a: CarreraConDetalle, b: CarreraConDetalle): number {
  if (a.puntajeCorte === null && b.puntajeCorte === null) return 0;
  if (a.puntajeCorte === null) return 1;
  if (b.puntajeCorte === null) return -1;
  return b.puntajeCorte - a.puntajeCorte;
}

export interface GrupoCarrera {
  categoria: string;
  carreras: CarreraConDetalle[]; // ordenadas por corte
  puntaje: number;
}

// Agrupa resultados por categoría: grupos por relevancia y, dentro, universidades por corte.
export function agruparPorCategoria(resultados: ResultadoCarrera[]): GrupoCarrera[] {
  const grupos = new Map<string, GrupoCarrera>();
  for (const r of resultados) {
    const g = grupos.get(r.carrera.categoria);
    if (g) {
      g.carreras.push(r.carrera);
      g.puntaje = Math.max(g.puntaje, r.puntaje);
    } else grupos.set(r.carrera.categoria, { categoria: r.carrera.categoria, carreras: [r.carrera], puntaje: r.puntaje });
  }
  const out = [...grupos.values()];
  out.forEach((g) => g.carreras.sort(compararPorCorte));
  return out.sort((a, b) => b.puntaje - a.puntaje || b.carreras.length - a.carreras.length);
}

export interface Segmento {
  texto: string;
  resaltado: boolean;
}

// Parte un texto en segmentos marcando los comienzos de palabra que calzan con la búsqueda.
export function resaltar(texto: string, query: string): Segmento[] {
  const { terminos } = interpretar(query);
  const buscados = terminos.flatMap((t) => [t.texto, t.original]).filter((t) => t.length >= 2);
  if (!buscados.length) return [{ texto, resaltado: false }];
  // Texto normalizado carácter a carácter, para mapear posiciones al original.
  const norm = [...texto].map((ch) => normalizar(ch) || ch.toLowerCase());
  const marcado = new Array(norm.length).fill(false);
  const plano = norm.join('');
  const inicio: number[] = []; // posición en el original de cada carácter de `plano`
  norm.forEach((n, i) => { for (let k = 0; k < n.length; k++) inicio.push(i); });
  const re = /[a-z0-9ñ]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(plano))) {
    const w = m[0];
    const largo = Math.max(...buscados.map((b) => (w.startsWith(b) ? b.length : 0)));
    for (let k = 0; k < largo; k++) marcado[inicio[m.index + k]] = true;
  }
  const out: Segmento[] = [];
  [...texto].forEach((ch, i) => {
    const last = out[out.length - 1];
    if (last && last.resaltado === marcado[i]) last.texto += ch;
    else out.push({ texto: ch, resaltado: marcado[i] });
  });
  return out;
}

// Universidades del Estado (Ley 21.094).
export const UNIVERSIDADES_ESTATALES = new Set([
  'Universidad de Chile', 'Universidad de Santiago de Chile', 'Universidad de Valparaíso',
  'Universidad de Antofagasta', 'Universidad de La Serena', 'Universidad del Bío-Bío',
  'Universidad de La Frontera', 'Universidad de Magallanes', 'Universidad de Talca',
  'Universidad de Atacama', 'Universidad de Tarapacá', 'Universidad Arturo Prat',
  'Universidad de Los Lagos', 'Universidad de Playa Ancha', 'Universidad Tecnológica Metropolitana',
  'Universidad Metropolitana de Ciencias de la Educación', "Universidad de O'Higgins", 'Universidad de Aysén',
]);

// Carreras sugeridas cuando el buscador está vacío.
export const CATEGORIAS_POPULARES = [
  'medicina', 'psicologia', 'derecho', 'ingenieria-comercial', 'ingenieria-civil-industrial',
  'enfermeria', 'ingenieria-civil', 'arquitectura',
];

// Listas cortas en localStorage (recientes, región). Nunca rompen si el almacenamiento falla.
export function leerLista(clave: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(clave) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function guardarLista(clave: string, lista: string[]): void {
  try { localStorage.setItem(clave, JSON.stringify(lista)); } catch {}
}

// Agrega al comienzo sin repetir y deja como máximo `max` elementos.
export function agregarReciente(lista: string[], valor: string, max = 5): string[] {
  return [valor, ...lista.filter((x) => x !== valor)].slice(0, max);
}

// Categorías que calzan con la búsqueda, por relevancia (para listas de "elige una carrera").
export function buscarCategorias(carreras: CarreraConDetalle[], categoriaDisplay: Record<string, string>, query: string): string[] {
  return agruparPorCategoria(buscarCarreras(carreras, categoriaDisplay, query).resultados).map((g) => g.categoria);
}

// Ids de las carreras que calzan con la búsqueda, por relevancia.
export function buscarIds(carreras: CarreraConDetalle[], categoriaDisplay: Record<string, string>, query: string): string[] {
  return buscarCarreras(carreras, categoriaDisplay, query).resultados.map((r) => r.carrera.id);
}
