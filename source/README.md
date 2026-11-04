# Simulador PAES

Simulador de puntaje ponderado para la Admisión 2027: calcula tu ponderado con las ponderaciones oficiales de cada carrera y compáralo con el puntaje de corte de referencia.

Producción: https://simuladorpaes.vercel.app

## Correr localmente

Requisitos: Node.js 20+.

```bash
npm install
npm run dev
```

La app queda en http://localhost:3000. `npm run lint` corre el typecheck y `npm run build` genera la versión de producción en `dist/`.

## Datos

- **Ponderaciones, vacantes y mínimos:** Oferta Definitiva DEMRE, Proceso de Admisión 2027 (24-09-2026). Texto fuente en `scripts/data/oferta2027.raw.txt`.
- **Puntajes de corte:** Admisión 2026 como referencia, cruzados por código DEMRE. El texto fuente (`scripts/data/cortes2026_filadd.raw.txt`) es de una publicación de terceros y no se versiona; se mantiene solo en local.

`src/data2027.generated.ts` se genera a partir de esos textos; no se edita a mano. Para regenerarlo (requiere ambos textos fuente):

```bash
node scripts/generate2027.mjs
```

## Actualizar puntajes de corte

Hoy la app muestra los cortes de la Admisión 2026 como referencia. Cuando DEMRE publique los de un proceso nuevo (los de la Admisión 2027 salen a comienzos de 2027):

1. Guarda el texto de la publicación de cortes en `scripts/data/` (por ejemplo `cortes2027.raw.txt`). Debe tener una fila por carrera con el **código DEMRE de 5 dígitos al inicio** y el **puntaje de corte en la última columna**, separados por tabs. Si el formato es distinto, ajusta la sección "4b" de `scripts/generate2027.mjs`.
2. Regenera los datos (requiere también `scripts/data/oferta2027.raw.txt`):

   ```bash
   node scripts/generate2027.mjs --cortes scripts/data/cortes2027.raw.txt
   ```

   El script imprime cuántos códigos leyó. Compáralo con el total de carreras: si es muy bajo, revisa el formato del archivo.
3. Cambia `ANIO_CORTES` en `src/constants.ts` al año nuevo. Todos los textos de la app ("Corte ref. 2026", "Admisión 2026"…) lo toman de ahí.
4. Corre `npm run lint`, `npm test` y `npm run build`, revisa un par de carreras conocidas en la app y publica.
