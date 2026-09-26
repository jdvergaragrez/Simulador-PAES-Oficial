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
