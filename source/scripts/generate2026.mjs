import fs from 'fs';

const CSV = 'C:/Users/juand/OneDrive/Escritorio/Base de Datos APP/Base_Datos_Admision_2026.csv';
const OUT = 'C:/Users/juand/OneDrive/Escritorio/SimuladorPAES/out/Simulador PAES/source/src/data2026.generated.ts';
const raw = fs.readFileSync(CSV, 'utf8');

function parseCSV(text){const rows=[];let row=[],field='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else q=false;}else field+=c;}else{if(c==='"')q=true;else if(c===','){row.push(field);field='';}else if(c==='\r'){}else if(c==='\n'){row.push(field);rows.push(row);row=[];field='';}else field+=c;}}if(field.length>0||row.length>0){row.push(field);rows.push(row);}return rows;}

const rows = parseCSV(raw);

// The document repeats a header block ("COD | CARRERA | ...") before each
// university/section, and the column layout VARIES (some blocks include a
// "PRUEBA ESPECIAL" column, shifting everything after it). Header labels are
// written reversed (e.g. "MEN" = NEM). We walk the rows keeping the current
// header's decoded column-index map, and attach it to each data row.
function decodeLabel(s){
  const t=(s||'').trim();
  const rev=[...t].reverse().join('');
  return rev.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().trim();
}
function buildColMap(headerRow){
  const m={};
  headerRow.forEach((cell,idx)=>{
    const d=decodeLabel(cell);
    if(d==='NEM') m.nem=idx;
    else if(d==='RANKING') m.ranking=idx;
    else if(d.includes('LECTORA')) m.lectora=idx;
    else if(d.includes('MATEMATICA 1')||d.includes('(M1)')) m.m1=idx;
    else if(d.includes('MATEMATICA 2')||d.includes('(M2)')) m.m2=idx;
    else if(d.includes('HISTORIA')) m.historia=idx;              // "CIENCIAS HISTORIA Y SOCIALES"
    else if(d==='CIENCIAS') m.ciencias=idx;                      // standalone ciencias
    else if(d.includes('PRUEBA ESPECIAL')) m.pe=idx;
    else if(d.includes('PONDERADO')&&d.includes('MINIMO')) m.pondMin=idx;
    else if(d.includes('PROMEDIO')&&d.includes('MINIMO')) m.promMin=idx;
    else if(d==='REGULAR') m.vacReg=idx;
  });
  return m;
}

// Attach the active column map to every data row
const dataRows = [];
let curMap=null;
for(const r of rows){
  if((r[0]||'').trim()==='COD'){ curMap=buildColMap(r); continue; }
  if(/^[0-9]{5}$/.test((r[0]||'').trim()) && curMap){ dataRows.push({r, map:curMap}); }
}

// prefix -> { nombre, tipo }
const UNI = {
  '11':['Universidad de Chile','CRUCH'],
  '12':['Pontificia Universidad Católica de Chile','CRUCH'],
  '13':['Universidad de Concepción','CRUCH'],
  '14':['Pontificia Universidad Católica de Valparaíso','CRUCH'],
  '15':['Universidad Técnica Federico Santa María','CRUCH'],
  '16':['Universidad de Santiago de Chile','CRUCH'],
  '17':['Universidad Austral de Chile','CRUCH'],
  '18':['Universidad Católica del Norte','CRUCH'],
  '19':['Universidad de Valparaíso','CRUCH'],
  '20':['Universidad Metropolitana de Ciencias de la Educación','CRUCH'],
  '21':['Universidad Tecnológica Metropolitana','CRUCH'],
  '22':['Universidad de Tarapacá','CRUCH'],
  '23':['Universidad Arturo Prat','CRUCH'],
  '24':['Universidad de Antofagasta','CRUCH'],
  '25':['Universidad de La Serena','CRUCH'],
  '26':['Universidad de Playa Ancha','CRUCH'],
  '27':['Universidad de Atacama','CRUCH'],
  '29':['Universidad del Bío-Bío','CRUCH'],
  '30':['Universidad de La Frontera','CRUCH'],
  '32':['Universidad de Los Lagos','CRUCH'],
  '33':['Universidad de Magallanes','CRUCH'],
  '34':['Universidad de Talca','CRUCH'],
  '35':['Universidad Católica del Maule','CRUCH'],
  '36':['Universidad Católica de la Santísima Concepción','CRUCH'],
  '37':['Universidad Católica de Temuco','CRUCH'],
  '38':['Universidad Diego Portales','PRIVADA_ADSCRITA'],
  '39':['Universidad Mayor','PRIVADA_ADSCRITA'],
  '40':['Universidad Finis Terrae','PRIVADA_ADSCRITA'],
  '41':['Universidad Andrés Bello','PRIVADA_ADSCRITA'],
  '42':['Universidad Adolfo Ibáñez','PRIVADA_ADSCRITA'],
  '43':['Universidad de los Andes','PRIVADA_ADSCRITA'],
  '44':['Universidad del Desarrollo','PRIVADA_ADSCRITA'],
  '45':['Universidad Alberto Hurtado','PRIVADA_ADSCRITA'],
  '46':['Universidad Católica Silva Henríquez','PRIVADA_ADSCRITA'],
  '47':["Universidad de O'Higgins",'CRUCH'],
  '48':['Universidad de Aysén','CRUCH'],
  '49':['Universidad Autónoma de Chile','PRIVADA_ADSCRITA'],
  '50':['Universidad San Sebastián','PRIVADA_ADSCRITA'],
  '51':['Universidad Central de Chile','PRIVADA_ADSCRITA'],
  '52':['Universidad Academia de Humanismo Cristiano','PRIVADA_ADSCRITA'],
  '53':["Universidad Bernardo O'Higgins",'PRIVADA_ADSCRITA'],
  '54':['Universidad UNIACC','PRIVADA_ADSCRITA'],
  '55':['Universidad Santo Tomás','PRIVADA_ADSCRITA'],
  '56':['Universidad de Las Américas','PRIVADA_ADSCRITA'],
  '58':['Universidad Adventista de Chile','PRIVADA_ADSCRITA'],
  '59':['Universidad de Viña del Mar','PRIVADA_ADSCRITA'],
  '60':['Universidad del Alba','PRIVADA_ADSCRITA'],
};

// city keyword -> region
const CITY_REGION = [
  ['ARICA','Arica y Parinacota'],
  ['IQUIQUE','Tarapacá'],['ALTO HOSPICIO','Tarapacá'],
  ['ANTOFAGASTA','Antofagasta'],['CALAMA','Antofagasta'],
  ['COPIAPÓ','Atacama'],['COPIAPO','Atacama'],['VALLENAR','Atacama'],
  ['LA SERENA','Coquimbo'],['COQUIMBO','Coquimbo'],['OVALLE','Coquimbo'],['GUAYACÁN','Coquimbo'],
  ['VALPARAÍSO','Valparaíso'],['VALPARAISO','Valparaíso'],['VIÑA DEL MAR','Valparaíso'],['VIÑA','Valparaíso'],['QUILLOTA','Valparaíso'],['QUILPUÉ','Valparaíso'],['QUIILPUE','Valparaíso'],['QUIILPUÉ','Valparaíso'],['SAN FELIPE','Valparaíso'],['LOS CASTAÑOS','Valparaíso'],
  ['RANCAGUA',"O'Higgins"],['COLCHAGUA',"O'Higgins"],['SAN FERNANDO',"O'Higgins"],
  ['TALCA','Maule'],['CURICÓ','Maule'],['CURICO','Maule'],['LINARES','Maule'],['LOS NICHES','Maule'],
  ['CHILLÁN','Ñuble'],['CHILLAN','Ñuble'],
  ['CONCEPCIÓN','Biobío'],['CONCEPCION','Biobío'],['LOS ÁNGELES','Biobío'],['LOS ANGELES','Biobío'],['CHACABUCO','Biobío'],['EL BOLDAL','Biobío'],
  ['TEMUCO','Araucanía'],['VICTORIA','Araucanía'],
  ['VALDIVIA','Los Ríos'],['ISLA TEJA','Los Ríos'],['MIRAFLORES','Los Ríos'],
  ['PUERTO MONTT','Los Lagos'],['OSORNO','Los Lagos'],['CASTRO','Los Lagos'],
  ['COYHAIQUE','Aysén'],['COIHAIQUE','Aysén'],
  ['PUNTA ARENAS','Magallanes'],
  ['SANTIAGO','Metropolitana'],['PROVIDENCIA','Metropolitana'],['ÑUÑOA','Metropolitana'],['MACUL','Metropolitana'],['LA FLORIDA','Metropolitana'],['MAIPÚ','Metropolitana'],['MAIPU','Metropolitana'],['MELIPILLA','Metropolitana'],['PEÑALOLÉN','Metropolitana'],['LO CAÑAS','Metropolitana'],['SAN JOAQUÍN','Metropolitana'],['VITACURA','Metropolitana'],['SAN ISIDRO','Metropolitana'],['REPÚBLICA','Metropolitana'],['CONDELL','Metropolitana'],['SERRANO','Metropolitana'],['SUBERCASEAUX','Metropolitana'],['SALVADOR SANFUENTES','Metropolitana'],['REGIÓN METROPOLITANA','Metropolitana'],['SANTIAGO CENTRO','Metropolitana'],
  ['VILLARRICA','Araucanía'],
];

// Fallback region per university (casa matriz) for ambiguous campus names.
const UNI_REGION = {
  '19':'Valparaíso','20':'Metropolitana','21':'Metropolitana','18':'Antofagasta',
};

function stripAccents(s){return s.normalize('NFD').replace(/[̀-ͯ]/g,'');}
function slug(s){return stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');}
function num(v){const t=(v||'').trim().replace(',','.');if(t===''||t==='---'||t==='—')return null;const n=parseFloat(t);return isNaN(n)?null:n;}
function cleanText(s){return (s||'').replace(/\s+/g,' ').trim();}

// Region from a lugar string by keyword match
function regionOf(lugar){
  const up = stripAccents(lugar.toUpperCase());
  for(const [kw,reg] of CITY_REGION){ if(up.includes(stripAccents(kw.toUpperCase()))) return reg; }
  return null;
}

// Normalize a career name into a grouping category + display name
function categoriaOf(nombre){
  let base = nombre;
  base = base.replace(/\([^)]*\)/g,' ');            // remove (…) footnotes
  base = base.replace(/\[[^\]]*\]/g,' ');
  base = base.split(',')[0];                          // drop ", LICENCIATURA EN …"
  base = base.replace(/\bconducente a.*$/i,' ');
  base = base.replace(/\bmenci[oó]n.*$/i,' ');
  base = base.replace(/\bvespertin[oa].*$/i,' ');
  base = base.replace(/[-–].*$/,' ');                 // drop dash suffixes like "- PERIODISMO"
  base = base.replace(/[*]/g,' ');
  base = cleanText(base);
  const s = slug(base);
  return { slug: s, display: base };
}

// ---- Puntajes de corte 2026 (archivo aparte, join por uni+carrera+región) ----
const uniKey=(s)=>stripAccents(String(s)).toLowerCase().replace(/[^a-z0-9]/g,'');
const uniNormToUid=new Map();
for(const p of Object.keys(UNI)) uniNormToUid.set(uniKey(UNI[p][0]),'u'+p);
// Alias para nombres cortos usados en el archivo de cortes:
uniNormToUid.set('universidadcentral','u51');
uniNormToUid.set('universidaddesantotomas','u55');

let cortesRaw=[];
try { cortesRaw=JSON.parse(fs.readFileSync(new URL('./cortes2026.raw.json', import.meta.url),'utf8')); }
catch(e){ console.warn('No se pudo leer cortes2026.raw.json:', e.message); }

// index: `${uid}|${carreraSlug}` -> [{regionNorm, corte}]
const cortesIndex=new Map();
let cortesMapeadosUni=0, cortesSinUni=0;
for(const cr of cortesRaw){
  const uid=uniNormToUid.get(uniKey(cr.universidad));
  if(!uid){ cortesSinUni++; continue; }
  cortesMapeadosUni++;
  const slug=categoriaOf(cr.carrera).slug;
  const corte=Number(String(cr.corte).replace(',','.'));
  if(!isFinite(corte)) continue;
  const key=`${uid}|${slug}`;
  const regionNorm=stripAccents(String(cr.region||'')).toLowerCase().trim();
  if(!cortesIndex.has(key)) cortesIndex.set(key,[]);
  cortesIndex.get(key).push({regionNorm, corte});
}
function buscarCorte(uid, slug, region){
  const arr=cortesIndex.get(`${uid}|${slug}`);
  if(!arr || !arr.length) return null;
  const rn=stripAccents(String(region||'')).toLowerCase().trim();
  const byRegion=arr.find(x=>x.regionNorm===rn);
  if(byRegion) return byRegion.corte;
  // Sin match de región: solo asignar si hay una única entrada (evita poner el
  // corte de una región a la misma carrera en otra región).
  return arr.length===1 ? arr[0].corte : null;
}

const universidades=[], sedes=[], carreras=[], ponderaciones=[], puntajesCorte=[];
const uniSeen=new Map(), sedeSeen=new Map(), codSeen=new Set();
const categoriaDisplay={};
let skipped=0, dupSkipped=0, cortesAsignados=0;

for(const {r, map} of dataRows){
  const cod=r[0].trim();
  const prefix=cod.slice(0,2);
  const uinfo=UNI[prefix];
  if(!uinfo){skipped++;continue;}

  const nombre=cleanText(r[1]);
  const lugarRaw=cleanText(r[2]);

  // Weights sit at FIXED data-row positions in every block (the reversed,
  // sometimes line-wrapped header labels are unreliable for indexing, but the
  // data columns are consistent): NEM=3, RANKING=4, LECTORA=5, M1=6,
  // HISTORIA=7, (sep/"o"=8), CIENCIAS=9, M2=10.
  const nem=num(r[3]), ranking=num(r[4]), lectora=num(r[5]), m1=num(r[6]);
  const historia=num(r[7]);
  const ciencias=num(r[9]), m2=num(r[10]);

  // Secondary metadata lives in the variable tail (indices 11+): an optional
  // PRUEBA ESPECIAL weight, then PONDERADO MÍNIMO and PROMEDIO MÍNIMO (min
  // application scores, ~150–1000), then vacantes. Use the header map when it
  // resolves, and validate min-scores by range so a wrapped header can't put
  // a weight/vacante into a min-score field.
  const minScore=(k)=>{ if(map[k]==null) return null; const v=num(r[map[k]]); return (v!==null && v>=150 && v<=1000) ? v : null; };
  const smallW=(k)=>{ if(map[k]==null) return null; const v=num(r[map[k]]); return (v!==null && v>=0 && v<=100) ? v : null; };
  const pe=smallW('pe');
  const pondMin=minScore('pondMin'), promMin=minScore('promMin');
  const vac1 = map.vacReg!=null ? num(r[map.vacReg]) : null;
  const vac2 = map.vacReg!=null ? num(r[map.vacReg+1]) : null; // 2º semestre, columna contigua

  // Skip rows with no weighting at all (secondary-admission % entries etc.)
  const anyW=[nem,ranking,lectora,m1,historia,ciencias,m2,pe].some(x=>x!==null && x>0);
  if(!anyW){skipped++;continue;}

  // Dedupe by DEMRE code among real carrera rows (the source repeats some
  // codes, e.g. an illustrative example row near the top of the document).
  if(codSeen.has(cod)){dupSkipped++;continue;}
  codSeen.add(cod);

  // University
  const uid='u'+prefix;
  if(!uniSeen.has(uid)){uniSeen.set(uid,true);universidades.push({id:uid,nombre:uinfo[0],tipo:uinfo[1]});}

  // Sede
  const sedeNombre = lugarRaw || 'Sede Principal';
  const region = regionOf(lugarRaw) || UNI_REGION[prefix] || null;
  const sedeKey = uid+'::'+sedeNombre;
  let sid;
  if(sedeSeen.has(sedeKey)){sid=sedeSeen.get(sedeKey);}
  else{sid=uid+'-'+slug(sedeNombre).slice(0,40)+'-'+sedeSeen.size;sedeSeen.set(sedeKey,sid);sedes.push({id:sid,universidadId:uid,nombre:sedeNombre,region});}

  // Categoria
  const cat=categoriaOf(nombre);
  if(cat.slug && !categoriaDisplay[cat.slug]) categoriaDisplay[cat.slug]=cat.display;

  // Elective type
  const hasH=historia!==null&&historia>0, hasC=ciencias!==null&&ciencias>0;
  let electivaTipo;
  if(hasH&&hasC) electivaTipo='mejor';
  else if(hasH) electivaTipo='historia';
  else if(hasC) electivaTipo='ciencias';

  const carreraId='c'+cod;
  const vacantes = (vac1!==null?vac1:0) + (vac2!==null?vac2:0) || (vac1!==null?vac1:(vac2!==null?vac2:null));

  carreras.push({
    id:carreraId, universidadId:uid, sedeId:sid, nombre,
    jornada:null, duracion:null, vacantes: (vac1!==null||vac2!==null)?((vac1||0)+(vac2||0)):null,
    anioAdmision:2026, categoria:cat.slug||'otras', tier:'verified',
    electivaTipo, corteNota:undefined, nota:undefined,
    ponderadoMinimo: pondMin, promedioMinimo: promMin, codigoDemre: cod,
  });

  ponderaciones.push({
    carreraId, anioAdmision:2026,
    nemPct:nem||0, rankingPct:ranking||0, lecturaPct:lectora||0,
    m1Pct:m1||0, m2Pct:m2||0, cienciasPct:ciencias||0, historiaPct:historia||0,
    pruebaEspecialPct: pe||0,
  });

  const corte = buscarCorte(uid, cat.slug, region);
  if(corte!==null) cortesAsignados++;
  puntajesCorte.push({ carreraId, anioAdmision:2026, puntajeCorte: corte });
}

// Emit TS
function j(o){return JSON.stringify(o);}
let out='';
out+='// AUTO-GENERADO desde Base_Datos_Admision_2026.csv (Oferta Definitiva DEMRE, 25-09-2025).\n';
out+='// NO EDITAR A MANO. Regenerar con scripts/generate2026.mjs si cambia la fuente.\n';
out+='// Ponderaciones/vacantes/mínimos: Oferta Definitiva DEMRE.\n';
out+='// Puntajes de corte 2026: join desde cortes2026.raw.json (solo carreras con dato,\n';
out+='// el resto queda con puntajeCorte=null y la UI muestra el mínimo de postulación).\n';
out+="import { Universidad, Sede, Carrera, Ponderacion, PuntajeCorte } from './types';\n\n";
out+='export const universidades2026: Universidad[] = '+j(universidades)+';\n\n';
out+='export const sedes2026: Sede[] = '+j(sedes)+';\n\n';
out+='export const carreras2026: Carrera[] = '+j(carreras)+';\n\n';
out+='export const ponderaciones2026: Ponderacion[] = '+j(ponderaciones)+';\n\n';
out+='export const puntajesCorte2026: PuntajeCorte[] = '+j(puntajesCorte)+';\n\n';
out+='export const categoriaDisplay2026: Record<string,string> = '+j(categoriaDisplay)+';\n';

fs.writeFileSync(OUT, out, 'utf8');

console.log('=== GENERACIÓN 2026 ===');
console.log('Universidades:', universidades.length);
console.log('Sedes:', sedes.length);
console.log('Carreras:', carreras.length);
console.log('Ponderaciones:', ponderaciones.length);
console.log('Categorías distintas:', Object.keys(categoriaDisplay).length);
console.log('Filas saltadas (sin ponderación / prefijo desconocido):', skipped);
console.log('Filas saltadas (código duplicado):', dupSkipped);
console.log('Cortes 2026 en archivo:', cortesRaw.length, '| uni mapeadas:', cortesMapeadosUni, '| uni sin mapear:', cortesSinUni);
console.log('Carreras con puntaje de corte asignado:', cortesAsignados);
console.log('Sedes sin región:', sedes.filter(s=>!s.region).length, '→', [...new Set(sedes.filter(s=>!s.region).map(s=>s.nombre))].slice(0,10).join(' | '));
// sanity: weight sums
let badSum=0; const badSamples=[];
for(const p of ponderaciones){
  const s=p.nemPct+p.rankingPct+p.lecturaPct+p.m1Pct+p.m2Pct+p.pruebaEspecialPct+Math.max(p.cienciasPct,p.historiaPct);
  if(Math.abs(s-100)>0.5){badSum++;if(badSamples.length<8)badSamples.push({c:p.carreraId,sum:s,p});}
}
console.log('Ponderaciones cuya suma != 100 (nem+rank+lect+m1+m2+PE+max(cien,hist)):', badSum, '/', ponderaciones.length);
if(badSamples.length) console.log('  ejemplos:', JSON.stringify(badSamples.map(b=>({c:b.c,sum:b.sum}))));
console.log('Output:', OUT);
