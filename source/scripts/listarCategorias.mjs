// Lista las categorías del catálogo 2027 (clave, nº de carreras, nombre DEMRE) sin cargar
// el archivo generado completo en el editor. Uso: node scripts/listarCategorias.mjs [filtro]
import { build } from 'esbuild';

const { outputFiles } = await build({
  entryPoints: ['src/data2027.generated.ts'],
  bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'error',
});
const d = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
const cnt = {};
for (const c of d.carreras2027) cnt[c.categoria] = (cnt[c.categoria] || 0) + 1;
const filtro = process.argv[2] || '';
for (const k of Object.keys(cnt).sort()) {
  if (k.includes(filtro)) console.log(`${k}\t${cnt[k]}\t${d.categoriaDisplay2027[k] ?? ''}`);
}
