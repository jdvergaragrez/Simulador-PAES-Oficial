import fs from 'fs';

// ---------------------------------------------------------------------------
// Genera src/data2027.generated.ts a partir del texto extraído del PDF oficial
// DEMRE "Oferta Definitiva de Carreras, Vacantes y Ponderaciones — Proceso de
// Admisión 2027" (577 páginas). La fuente es texto extraído de un PDF: el layout
// de columnas se reconstruye a partir de saltos de línea y tabs, es más
// irregular, y algunas filas envuelven el nombre de la carrera (o el lugar) en
// una segunda línea física sin código. Ver comentarios inline para el detalle
// de cada heurística.
// ---------------------------------------------------------------------------

const TXT = new URL('./data/oferta2027.raw.txt', import.meta.url);
const OUT = new URL('../src/data2027.generated.ts', import.meta.url);

const raw = fs.readFileSync(TXT, 'utf8');
const lines = raw.split('\n');

// ---------------------------------------------------------------------------
// Helpers básicos
// ---------------------------------------------------------------------------
function stripAccents(s) { return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function slug(s) { return stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function num(v) {
  const t = (v == null ? '' : String(v)).trim().replace(',', '.');
  if (t === '' || t === '---' || t === '--' || t === '—' || t === '-') return null;
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}
function cleanText(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
function minScoreOrNull(v) {
  const n = num(v);
  return (n !== null && n >= 150 && n <= 1000) ? n : null;
}

// ---------------------------------------------------------------------------
// 1) Tabla de contenidos (INDICE): 47 universidades con su página de inicio.
//    Se usa para determinar, mediante los marcadores de página "-- N of 577
//    --" que insertó nuestra extracción, en qué tramo de texto vive cada
//    universidad y así descubrir su prefijo DEMRE de 2 dígitos (los prefijos
//    de 2027 NO se asumen iguales a los de 2026: se detectan empíricamente).
// ---------------------------------------------------------------------------
const TOC = [
  ['PONTIFICIA UNIVERSIDAD CATÓLICA DE CHILE', 16],
  ['PONTIFICIA UNIVERSIDAD CATÓLICA DE VALPARAÍSO', 49],
  ['UNIVERSIDAD ACADEMIA DE HUMANISMO CRISTIANO', 61],
  ['UNIVERSIDAD ADOLFO IBÁÑEZ', 94],
  ['UNIVERSIDAD ADVENTISTA DE CHILE', 120],
  ['UNIVERSIDAD ALBERTO HURTADO', 112],
  ['UNIVERSIDAD ANDRÉS BELLO', 135],
  ['UNIVERSIDAD ARTURO PRAT', 151],
  ['UNIVERSIDAD AUSTRAL DE CHILE', 157],
  ['UNIVERSIDAD AUTÓNOMA DE CHILE', 170],
  ["UNIVERSIDAD BERNARDO O'HIGGINS", 186],
  ['UNIVERSIDAD CATÓLICA DE LA SANTÍSIMA CONCEPCIÓN', 204],
  ['UNIVERSIDAD CATÓLICA DE TEMUCO', 210],
  ['UNIVERSIDAD CATÓLICA DEL MAULE', 217],
  ['UNIVERSIDAD CATÓLICA DEL NORTE', 224],
  ['UNIVERSIDAD CATÓLICA SILVA HENRÍQUEZ', 233],
  ['UNIVERSIDAD CENTRAL DE CHILE', 240],
  ['UNIVERSIDAD DE ANTOFAGASTA', 249],
  ['UNIVERSIDAD DE ATACAMA', 257],
  ['UNIVERSIDAD DE AYSÉN', 262],
  ['UNIVERSIDAD DE CHILE', 267],
  ['UNIVERSIDAD DE CONCEPCIÓN', 294],
  ['UNIVERSIDAD DE LA FRONTERA', 304],
  ['UNIVERSIDAD DE LA SERENA', 311],
  ['UNIVERSIDAD DE LAS AMÉRICAS', 318],
  ['UNIVERSIDAD DE LOS ANDES', 329],
  ['UNIVERSIDAD DE LOS LAGOS', 343],
  ['UNIVERSIDAD DE MAGALLANES', 350],
  ["UNIVERSIDAD DE O'HIGGINS", 355],
  ['UNIVERSIDAD DE PLAYA ANCHA', 372],
  ['UNIVERSIDAD DE SANTIAGO DE CHILE', 382],
  ['UNIVERSIDAD DE TALCA', 392],
  ['UNIVERSIDAD DE TARAPACÁ', 413],
  ['UNIVERSIDAD DE VALPARAÍSO', 421],
  ['UNIVERSIDAD DEL ALBA', 428],
  ['UNIVERSIDAD DEL BÍO-BÍO', 435],
  ['UNIVERSIDAD DEL DESARROLLO', 441],
  ['UNIVERSIDAD DIEGO PORTALES', 475],
  ['UNIVERSIDAD FINIS TERRAE', 483],
  ['UNIVERSIDAD GABRIELA MISTRAL', 490],
  ['UNIVERSIDAD MAYOR', 499],
  ['UNIVERSIDAD METROPOLITANA DE CS. DE LA EDUCACIÓN', 513],
  ['UNIVERSIDAD SAN SEBASTIÁN', 521],
  ['UNIVERSIDAD SANTO TOMÁS', 532],
  ['UNIVERSIDAD TÉCNICA FEDERICO SANTA MARÍA', 551],
  ['UNIVERSIDAD TECNOLÓGICA METROPOLITANA', 565],
  ['UNIVERSIDAD VIÑA DEL MAR', 571],
];

// Nombres "bonitos" + tipo CRUCH conocidos, indexados por nombre normalizado en vez de por prefijo,
// porque los prefijos numéricos NO son estables entre procesos pero los
// nombres de las universidades sí lo son).
const KNOWN_UNIS = [
  ['Universidad de Chile', 'CRUCH'],
  ['Pontificia Universidad Católica de Chile', 'CRUCH'],
  ['Universidad de Concepción', 'CRUCH'],
  ['Pontificia Universidad Católica de Valparaíso', 'CRUCH'],
  ['Universidad Técnica Federico Santa María', 'CRUCH'],
  ['Universidad de Santiago de Chile', 'CRUCH'],
  ['Universidad Austral de Chile', 'CRUCH'],
  ['Universidad Católica del Norte', 'CRUCH'],
  ['Universidad de Valparaíso', 'CRUCH'],
  ['Universidad Metropolitana de Ciencias de la Educación', 'CRUCH'],
  ['Universidad Tecnológica Metropolitana', 'CRUCH'],
  ['Universidad de Tarapacá', 'CRUCH'],
  ['Universidad Arturo Prat', 'CRUCH'],
  ['Universidad de Antofagasta', 'CRUCH'],
  ['Universidad de La Serena', 'CRUCH'],
  ['Universidad de Playa Ancha', 'CRUCH'],
  ['Universidad de Atacama', 'CRUCH'],
  ['Universidad del Bío-Bío', 'CRUCH'],
  ['Universidad de La Frontera', 'CRUCH'],
  ['Universidad de Los Lagos', 'CRUCH'],
  ['Universidad de Magallanes', 'CRUCH'],
  ['Universidad de Talca', 'CRUCH'],
  ['Universidad Católica del Maule', 'CRUCH'],
  ['Universidad Católica de la Santísima Concepción', 'CRUCH'],
  ['Universidad Católica de Temuco', 'CRUCH'],
  ["Universidad de O'Higgins", 'CRUCH'],
  ['Universidad de Aysén', 'CRUCH'],
  ['Universidad Diego Portales', 'PRIVADA_ADSCRITA'],
  ['Universidad Mayor', 'PRIVADA_ADSCRITA'],
  ['Universidad Finis Terrae', 'PRIVADA_ADSCRITA'],
  ['Universidad Andrés Bello', 'PRIVADA_ADSCRITA'],
  ['Universidad Adolfo Ibáñez', 'PRIVADA_ADSCRITA'],
  ['Universidad de los Andes', 'PRIVADA_ADSCRITA'],
  ['Universidad del Desarrollo', 'PRIVADA_ADSCRITA'],
  ['Universidad Alberto Hurtado', 'PRIVADA_ADSCRITA'],
  ['Universidad Católica Silva Henríquez', 'PRIVADA_ADSCRITA'],
  ['Universidad Autónoma de Chile', 'PRIVADA_ADSCRITA'],
  ['Universidad San Sebastián', 'PRIVADA_ADSCRITA'],
  ['Universidad Central de Chile', 'PRIVADA_ADSCRITA'],
  ['Universidad Academia de Humanismo Cristiano', 'PRIVADA_ADSCRITA'],
  ["Universidad Bernardo O'Higgins", 'PRIVADA_ADSCRITA'],
  ['Universidad UNIACC', 'PRIVADA_ADSCRITA'],
  ['Universidad Santo Tomás', 'PRIVADA_ADSCRITA'],
  ['Universidad de Las Américas', 'PRIVADA_ADSCRITA'],
  ['Universidad Adventista de Chile', 'PRIVADA_ADSCRITA'],
  ['Universidad de Viña del Mar', 'PRIVADA_ADSCRITA'],
  ['Universidad Viña del Mar', 'PRIVADA_ADSCRITA'],
  ['Universidad del Alba', 'PRIVADA_ADSCRITA'],
  ['Universidad Gabriela Mistral', 'PRIVADA_ADSCRITA'],
];
const uniKey = (s) => stripAccents(String(s)).toLowerCase().replace(/[^a-z0-9]/g, '');
const tipoByKey = new Map(KNOWN_UNIS.map(([n, t]) => [uniKey(n), t]));
const nombreByKey = new Map(KNOWN_UNIS.map(([n]) => [uniKey(n), n]));

const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'en', 'con', 'para', 'a', 'cs']);
function titleCaseUniName(allCaps) {
  const words = allCaps.toLowerCase().split(' ');
  return words.map((w, i) => {
    if (w === '') return w;
    if (i > 0 && CONNECTORS.has(w)) return w === 'cs' ? 'Ciencias' : w;
    // capitaliza tras apóstrofes tipo o'higgins
    return w.replace(/(^|['’])([a-záéíóúñ])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  }).join(' ');
}
function displayNombreUni(tocName) {
  const expanded = tocName.replace(/\bCS\.?\b/gi, 'CIENCIAS');
  const key = uniKey(expanded);
  if (nombreByKey.has(key)) return nombreByKey.get(key);
  return titleCaseUniName(expanded);
}
function tipoDeUni(tocName) {
  const key = uniKey(tocName.replace(/\bCS\.?\b/gi, 'CIENCIAS'));
  return tipoByKey.get(key) || 'PRIVADA_ADSCRITA';
}

// El índice (TOC) está en orden ALFABÉTICO, que no necesariamente coincide
// con el orden físico en que aparecen las universidades en el documento
// (p.ej. "Adventista de Chile" p.120 aparece en el índice antes que "Alberto
// Hurtado" p.112, pero físicamente va después). Una copia ordenada por
// página SÍ coincide con el orden físico real.
const TOC_BY_PAGE = [...TOC].sort((a, b) => a[1] - b[1]);

// Detectar el prefijo DEMRE de cada universidad NO se hace recortando texto
// por rango de páginas (los números de página del índice marcan el inicio
// de la introducción en prosa de cada universidad, no el de su tabla de
// códigos — la tabla real puede empezar/terminar desplazada varias páginas,
// lo que contamina cualquier recorte por rango con filas de la universidad
// vecina). En cambio, se recorre el documento una sola vez, en el orden en
// que aparecen las filas de datos reales, y se agrupan en "tandas" de
// códigos consecutivos que comparten el mismo prefijo de 2 dígitos. Cada
// universidad imprime su tabla completa de un tirón (todas sus filas
// seguidas), así que estas tandas coinciden 1 a 1, y EN EL MISMO ORDEN, con
// las 47 universidades del índice ordenado por página. Sólo hay que
// descartar tandas espurias de largo ínfimo (p.ej. una fila suelta mal
// detectada en el texto introductorio, antes de la primera tabla real).
const codeSeq = [];
for (const line of lines) {
  const m = /^(\d{5}) *\t/.exec(line);
  if (m) codeSeq.push(m[1].slice(0, 2));
}
const rawRuns = [];
for (const p of codeSeq) {
  if (rawRuns.length && rawRuns[rawRuns.length - 1].prefix === p) rawRuns[rawRuns.length - 1].count++;
  else rawRuns.push({ prefix: p, count: 1 });
}
const RUN_NOISE_THRESHOLD = 5;
const uniRuns = rawRuns.filter((r) => r.count >= RUN_NOISE_THRESHOLD);

const UNI = {}; // prefix -> { nombre, tipo }
const prefixesPorUni = [];
if (uniRuns.length !== TOC_BY_PAGE.length) {
  console.warn(`AVISO: se detectaron ${uniRuns.length} tandas de códigos pero hay ${TOC_BY_PAGE.length} universidades en el índice — la asignación prefijo→universidad puede quedar desalineada.`);
}
for (let i = 0; i < TOC_BY_PAGE.length; i++) {
  const [tocName] = TOC_BY_PAGE[i];
  const run = uniRuns[i];
  const prefixes = run ? [run.prefix] : [];
  prefixesPorUni.push({ tocName, prefixes, count: run ? run.count : 0 });
  const nombre = displayNombreUni(tocName);
  const tipo = tipoDeUni(tocName);
  for (const p of prefixes) {
    if (!UNI[p]) UNI[p] = { nombre, tipo };
  }
}

// ---------------------------------------------------------------------------
// 2) Ciudad -> región por palabra clave de comuna/sede.
// ---------------------------------------------------------------------------
const CITY_REGION = [
  ['ARICA', 'Arica y Parinacota'],
  ['IQUIQUE', 'Tarapacá'], ['ALTO HOSPICIO', 'Tarapacá'],
  ['ANTOFAGASTA', 'Antofagasta'], ['CALAMA', 'Antofagasta'], ['TOCOPILLA', 'Antofagasta'],
  ['COPIAPÓ', 'Atacama'], ['COPIAPO', 'Atacama'], ['VALLENAR', 'Atacama'],
  ['LA SERENA', 'Coquimbo'], ['COQUIMBO', 'Coquimbo'], ['OVALLE', 'Coquimbo'], ['GUAYACÁN', 'Coquimbo'],
  ['VALPARAÍSO', 'Valparaíso'], ['VALPARAISO', 'Valparaíso'], ['VIÑA DEL MAR', 'Valparaíso'], ['VIÑA', 'Valparaíso'],
  ['QUILLOTA', 'Valparaíso'], ['QUILPUÉ', 'Valparaíso'], ['QUIILPUE', 'Valparaíso'], ['QUIILPUÉ', 'Valparaíso'],
  ['SAN FELIPE', 'Valparaíso'], ['LOS CASTAÑOS', 'Valparaíso'], ['LOS ANDES', 'Valparaíso'],
  ['RANCAGUA', "O'Higgins"], ['COLCHAGUA', "O'Higgins"], ['SAN FERNANDO', "O'Higgins"],
  ['TALCA', 'Maule'], ['CURICÓ', 'Maule'], ['CURICO', 'Maule'], ['LINARES', 'Maule'], ['LOS NICHES', 'Maule'], ['CONSTITUCIÓN', 'Maule'],
  ['CHILLÁN', 'Ñuble'], ['CHILLAN', 'Ñuble'], ['SAN CARLOS', 'Ñuble'],
  ['CONCEPCIÓN', 'Biobío'], ['CONCEPCION', 'Biobío'], ['LOS ÁNGELES', 'Biobío'], ['LOS ANGELES', 'Biobío'],
  ['CHACABUCO', 'Biobío'], ['EL BOLDAL', 'Biobío'], ['TALCAHUANO', 'Biobío'], ['CORONEL', 'Biobío'],
  ['TEMUCO', 'Araucanía'], ['VICTORIA', 'Araucanía'], ['VILLARRICA', 'Araucanía'], ['ANGOL', 'Araucanía'],
  ['VALDIVIA', 'Los Ríos'], ['ISLA TEJA', 'Los Ríos'], ['MIRAFLORES', 'Los Ríos'],
  ['PUERTO MONTT', 'Los Lagos'], ['OSORNO', 'Los Lagos'], ['CASTRO', 'Los Lagos'], ['PUERTO VARAS', 'Los Lagos'],
  ['COYHAIQUE', 'Aysén'], ['COIHAIQUE', 'Aysén'],
  ['PUNTA ARENAS', 'Magallanes'], ['PUERTO NATALES', 'Magallanes'],
  ['SANTIAGO', 'Metropolitana'], ['PROVIDENCIA', 'Metropolitana'], ['ÑUÑOA', 'Metropolitana'], ['MACUL', 'Metropolitana'],
  ['LA FLORIDA', 'Metropolitana'], ['MAIPÚ', 'Metropolitana'], ['MAIPU', 'Metropolitana'], ['MELIPILLA', 'Metropolitana'],
  ['PEÑALOLÉN', 'Metropolitana'], ['LO CAÑAS', 'Metropolitana'], ['SAN JOAQUÍN', 'Metropolitana'], ['VITACURA', 'Metropolitana'],
  ['SAN ISIDRO', 'Metropolitana'], ['REPÚBLICA', 'Metropolitana'], ['CONDELL', 'Metropolitana'], ['SERRANO', 'Metropolitana'],
  ['SUBERCASEAUX', 'Metropolitana'], ['SALVADOR SANFUENTES', 'Metropolitana'], ['REGIÓN METROPOLITANA', 'Metropolitana'],
  ['SANTIAGO CENTRO', 'Metropolitana'], ['CAMPUS CONDELL', 'Metropolitana'], ['LA REINA', 'Metropolitana'],
  ['PUENTE ALTO', 'Metropolitana'], ['QUILICURA', 'Metropolitana'], ['HUECHURABA', 'Metropolitana'],
];
function regionOf(lugar) {
  const up = stripAccents(lugar.toUpperCase());
  for (const [kw, reg] of CITY_REGION) { if (up.includes(stripAccents(kw.toUpperCase()))) return reg; }
  return null;
}

// ---------------------------------------------------------------------------
// 3) Normalización de nombre de carrera -> categoría: quita notas al pie "(...)", ", LICENCIATURA EN...",
//    "mención...", "vespertino...", sufijos con guion, y hace slug.
// ---------------------------------------------------------------------------
function categoriaOf(nombre) {
  let base = nombre;
  base = base.replace(/\([^)]*\)/g, ' ');
  base = base.replace(/\[[^\]]*\]/g, ' ');
  base = base.split(',')[0];
  base = base.replace(/\bconducente a.*$/i, ' ');
  base = base.replace(/\bmenci[oó]n.*$/i, ' ');
  base = base.replace(/\bvespertin[oa].*$/i, ' ');
  base = base.replace(/[-–].*$/, ' ');
  base = base.replace(/[*]/g, ' ');
  base = cleanText(base);
  const s = slug(base);
  return { slug: s, display: base };
}
// Nombre de despliegue de la carrera: igual que el crudo pero sin las notas
// al pie "(NN)" (que solo tienen sentido junto a la tabla de observaciones
// que DEMRE imprime después de cada universidad, no la tenemos en el modelo).
function displayNombreCarrera(nombre) {
  return cleanText(nombre.replace(/\s*\([^)]*\)\s*/g, ' '));
}

// ---------------------------------------------------------------------------
// 4) Parsing de filas. Cada fila real: COD, CARRERA, LUGAR, luego pesos
//    (NEM, RANKING, LECTORA, M1 en posiciones fijas), HISTORIA, ["o"],
//    CIENCIAS, M2, [PRUEBA ESPECIAL si la sección la tiene], PONDERADO
//    MÍNIMO, PROMEDIO MÍNIMO, y una cola de largo variable con vacantes
//    (regular por semestre / BEA / PACE / columnas propias de alguna
//    universidad) que sumamos completa como `vacantes`.
// ---------------------------------------------------------------------------
const MARKER_OR_BLANK_RE = /^(-- \d+ of 577 --|OFERTA DEFINITIVA DE CARRERAS|PROCESO DE ADMISIÓN 2027|\d{1,4})?$/;

function nextMeaningfulLineIndex(fromIdx) {
  let j = fromIdx + 1;
  while (j < lines.length) {
    const t = lines[j].trim();
    if (t === '' || MARKER_OR_BLANK_RE.test(t)) { j++; continue; }
    break;
  }
  return j;
}

const rows = []; // { fields, hasPE }
let currentHasPE = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const firstCell = line.split('\t')[0].trim();

  if (firstCell === 'COD') {
    // Mira un poco hacia adelante (dentro del bloque de encabezado, antes de
    // la primera fila de datos) para saber si esta sección tiene columna de
    // PRUEBA ESPECIAL.
    let j = i + 1, headerText = '';
    while (j < lines.length && j < i + 40 && !/^\d{5} *\t/.test(lines[j])) {
      headerText += lines[j] + '\n';
      j++;
    }
    currentHasPE = headerText.includes('PRUEBA ESPECIAL');
    continue;
  }

  if (!/^\d{5} *\t/.test(line)) continue;

  let fields = line.split('\t').map((s) => s.trim());
  let consumedUpTo = i;

  // Reconstruye filas cuyo nombre de carrera (o lugar) se envolvió en una
  // segunda línea física sin código: mientras la fila no alcance el largo
  // mínimo de una fila real (~15 campos) y la siguiente línea "con
  // contenido" no sea una nueva fila de datos, se asume continuación: el
  // último campo capturado se extiende con el primer campo de la línea
  // siguiente, y el resto de sus campos pasa a completar la fila.
  while (fields.length < 15) {
    const nextIdx = nextMeaningfulLineIndex(consumedUpTo);
    if (nextIdx >= lines.length) break;
    const nextLine = lines[nextIdx];
    if (/^\d{5} *\t/.test(nextLine)) break; // es una fila nueva, no continuación
    const nextFields = nextLine.split('\t').map((s) => s.trim());
    if (nextFields.length < 8) break; // no parece una continuación con datos
    fields[fields.length - 1] = cleanText(fields[fields.length - 1] + ' ' + nextFields[0]);
    fields = fields.concat(nextFields.slice(1));
    consumedUpTo = nextIdx;
  }
  i = consumedUpTo;

  rows.push({ fields, hasPE: currentHasPE });
}

// ---------------------------------------------------------------------------
// 4b) Puntajes de corte de referencia: Admisión 2026 (último proceso concluido).
// Fuente: "Ponderaciones y Puntajes de Corte, Admisión 2026" (Preu Filadd, datos
// DEMRE). Solo se usa el corte; las ponderaciones vienen del PDF oficial 2027.
// Se cruza por código DEMRE, que se mantiene estable entre procesos. Un código
// con dos cortes distintos en la fuente se descarta por ambiguo.
// ---------------------------------------------------------------------------
const CORTES_TXT = new URL('./data/cortes2026_filadd.raw.txt', import.meta.url);
const cortesRef = new Map();
const cortesAmbiguos = new Set();
for (const rawLine of fs.readFileSync(CORTES_TXT, 'utf8').split('\n')) {
  const line = rawLine.trim();
  const m = line.match(/^(\d{5})\s*\t/);
  if (!m) continue;
  const campos = line.split('\t').map((s) => s.trim()).filter(Boolean);
  const ultimo = campos[campos.length - 1];
  if (!/^\d{3,4}(,\d{1,2})?$/.test(ultimo)) continue;
  const corte = parseFloat(ultimo.replace(',', '.'));
  if (!(corte >= 150 && corte <= 1000)) continue;
  const prev = cortesRef.get(m[1]);
  if (prev !== undefined && Math.abs(prev - corte) > 0.01) cortesAmbiguos.add(m[1]);
  else cortesRef.set(m[1], corte);
}
for (const cod of cortesAmbiguos) cortesRef.delete(cod);

// ---------------------------------------------------------------------------
// 5) Construcción del modelo relacional
// ---------------------------------------------------------------------------
const universidades = [], sedes = [], carreras = [], ponderaciones = [], puntajesCorte = [];
const uniSeen = new Map(), sedeSeen = new Map(), codSeen = new Set();
const categoriaDisplay = {};
let skipped = 0, dupSkipped = 0, tooShort = 0, unknownPrefix = 0;

for (const { fields, hasPE } of rows) {
  if (fields.length < 15) { tooShort++; continue; }

  const cod = fields[0];
  const prefix = cod.slice(0, 2);
  const uinfo = UNI[prefix];
  if (!uinfo) { unknownPrefix++; continue; }

  const nombreRaw = cleanText(fields[1]);
  const lugarRaw = cleanText(fields[2]);

  let cursor = 3;
  const nem = num(fields[cursor++]);
  const ranking = num(fields[cursor++]);
  const lectora = num(fields[cursor++]);
  const m1 = num(fields[cursor++]);
  const historia = num(fields[cursor]); cursor++;
  if (fields[cursor] === 'o') cursor++;
  const ciencias = num(fields[cursor]); cursor++;
  const m2 = num(fields[cursor]); cursor++;

  let tail = fields.slice(cursor);
  let pe = null;
  if (hasPE) { pe = num(tail.shift()); }
  const pondMin = minScoreOrNull(tail.shift());
  const promMin = minScoreOrNull(tail.shift());
  // Todo lo que sobra en la cola son vacantes de distinto tipo (regular por
  // semestre, BEA, PACE, o columnas propias de alguna universidad): las
  // sumamos como el total de vacantes de la carrera.
  const vacantesTotal = tail.reduce((acc, v) => {
    const n = num(v);
    return acc + (n !== null ? n : 0);
  }, 0);

  const anyW = [nem, ranking, lectora, m1, historia, ciencias, m2, pe].some((x) => x !== null && x > 0);
  if (!anyW) { skipped++; continue; }

  if (codSeen.has(cod)) { dupSkipped++; continue; }
  codSeen.add(cod);

  const uid = 'u' + prefix;
  if (!uniSeen.has(uid)) { uniSeen.set(uid, true); universidades.push({ id: uid, nombre: uinfo.nombre, tipo: uinfo.tipo }); }

  const sedeNombre = lugarRaw || 'Sede Principal';
  const region = regionOf(lugarRaw);
  const sedeKey = uid + '::' + sedeNombre;
  let sid;
  if (sedeSeen.has(sedeKey)) { sid = sedeSeen.get(sedeKey); }
  else { sid = uid + '-' + slug(sedeNombre).slice(0, 40) + '-' + sedeSeen.size; sedeSeen.set(sedeKey, sid); sedes.push({ id: sid, universidadId: uid, nombre: sedeNombre, region }); }

  const cat = categoriaOf(nombreRaw);
  if (cat.slug && !categoriaDisplay[cat.slug]) categoriaDisplay[cat.slug] = cat.display;

  const hasH = historia !== null && historia > 0, hasC = ciencias !== null && ciencias > 0;
  let electivaTipo;
  if (hasH && hasC) electivaTipo = 'mejor';
  else if (hasH) electivaTipo = 'historia';
  else if (hasC) electivaTipo = 'ciencias';

  const carreraId = 'c' + cod;
  const nombre = displayNombreCarrera(nombreRaw) || nombreRaw;

  carreras.push({
    id: carreraId, universidadId: uid, sedeId: sid, nombre,
    jornada: null, duracion: null,
    vacantes: vacantesTotal > 0 ? vacantesTotal : null,
    anioAdmision: 2027, categoria: cat.slug || 'otras', tier: 'verified',
    electivaTipo, corteNota: undefined, nota: undefined,
    ponderadoMinimo: pondMin, promedioMinimo: promMin, codigoDemre: cod,
  });

  ponderaciones.push({
    carreraId, anioAdmision: 2027,
    nemPct: nem || 0, rankingPct: ranking || 0, lecturaPct: lectora || 0,
    m1Pct: m1 || 0, m2Pct: m2 || 0, cienciasPct: ciencias || 0, historiaPct: historia || 0,
    pruebaEspecialPct: pe || 0,
  });

  // No existe corte 2027 (el proceso no concluye): se usa el de la Admisión 2026.
  puntajesCorte.push({ carreraId, anioAdmision: 2027, puntajeCorte: cortesRef.get(cod) ?? null });
}

// ---------------------------------------------------------------------------
// 6) Emisión del TS
// ---------------------------------------------------------------------------
function j(o) { return JSON.stringify(o); }
let out = '';
out += '// AUTO-GENERADO desde el PDF oficial DEMRE "Oferta Definitiva de Carreras,\n';
out += '// Vacantes y Ponderaciones — Proceso de Admisión 2027" (publicación oficial\n';
out += '// Nº 2, 24-09-2026).\n';
out += '// NO EDITAR A MANO. Regenerar con scripts/generate2027.mjs si cambia la fuente.\n';
out += '// Este proceso NO tiene puntajes de corte propios todavía (se conocerán al\n';
out += '// finalizar la admisión, en 2027). puntajesCorte2027 lleva el corte de la\n';
out += '// Admisión 2026 como referencia, cruzado por código DEMRE desde\n';
out += '// scripts/data/cortes2026_filadd.raw.txt; null si la carrera no tenía corte.\n';
out += "import { Universidad, Sede, Carrera, Ponderacion, PuntajeCorte } from './types';\n\n";
out += 'export const universidades2027: Universidad[] = ' + j(universidades) + ';\n\n';
out += 'export const sedes2027: Sede[] = ' + j(sedes) + ';\n\n';
out += 'export const carreras2027: Carrera[] = ' + j(carreras) + ';\n\n';
out += 'export const ponderaciones2027: Ponderacion[] = ' + j(ponderaciones) + ';\n\n';
out += 'export const puntajesCorte2027: PuntajeCorte[] = ' + j(puntajesCorte) + ';\n\n';
out += 'export const categoriaDisplay2027: Record<string,string> = ' + j(categoriaDisplay) + ';\n';

fs.writeFileSync(OUT, out, 'utf8');

// ---------------------------------------------------------------------------
// 7) Validación / reporte
// ---------------------------------------------------------------------------
console.log('=== GENERACIÓN 2027 ===');
console.log('Universidades:', universidades.length, '/ 47 esperadas');
console.log('Sedes:', sedes.length);
console.log('Carreras:', carreras.length);
console.log('Ponderaciones:', ponderaciones.length);
console.log('Categorías distintas:', Object.keys(categoriaDisplay).length);
const conCorte = puntajesCorte.filter((p) => p.puntajeCorte !== null).length;
console.log('Cortes 2026 de referencia en la fuente:', cortesRef.size, '| ambiguos descartados:', cortesAmbiguos.size);
console.log('Carreras 2027 con corte de referencia:', conCorte, '/', carreras.length);
console.log('Filas descartadas (sin ponderación):', skipped);
console.log('Filas descartadas (código duplicado):', dupSkipped);
console.log('Filas descartadas (prefijo desconocido):', unknownPrefix);
console.log('Filas descartadas (demasiado cortas / no reconstruibles):', tooShort);
console.log('Sedes sin región:', sedes.filter((s) => !s.region).length, '→', [...new Set(sedes.filter((s) => !s.region).map((s) => s.nombre))].slice(0, 15).join(' | '));

const uniEncontradas = new Set(universidades.map((u) => uniKey(u.nombre)));
const uniFaltantes = TOC.filter(([tocName]) => !uniEncontradas.has(uniKey(displayNombreUni(tocName))));
console.log('Universidades del índice NO encontradas en los datos:', uniFaltantes.length);
if (uniFaltantes.length) console.log('  →', uniFaltantes.map(([n]) => n).join(' | '));

let badSum = 0; const badSamples = [];
for (const p of ponderaciones) {
  const s = p.nemPct + p.rankingPct + p.lecturaPct + p.m1Pct + p.m2Pct + p.pruebaEspecialPct + Math.max(p.cienciasPct, p.historiaPct);
  if (Math.abs(s - 100) > 0.5) { badSum++; if (badSamples.length < 8) badSamples.push({ c: p.carreraId, sum: s }); }
}
console.log('Ponderaciones cuya suma != 100 (nem+rank+lect+m1+m2+PE+max(cien,hist)):', badSum, '/', ponderaciones.length);
if (badSamples.length) console.log('  ejemplos:', JSON.stringify(badSamples));
console.log('Output:', OUT.pathname);
