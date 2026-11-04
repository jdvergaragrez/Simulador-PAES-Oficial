import { beforeAll, describe, expect, it } from 'vitest';
import { loadCatalogo, Catalogo } from './data';
import { agruparPorCategoria, buscarCarreras, distancia, resaltar, SIGLAS_UNIVERSIDAD } from './busqueda';

let cat: Catalogo;
beforeAll(async () => {
  cat = await loadCatalogo();
});

const buscar = (q: string) => buscarCarreras(cat.todas, cat.categoriaDisplay, q);
const primera = (q: string) => buscar(q).resultados[0]?.carrera;

describe('buscarCarreras', () => {
  it('todas las siglas apuntan a una universidad del catálogo', () => {
    const nombres = new Set(cat.todas.map((c) => c.universidadNombre));
    for (const [sigla, nombre] of Object.entries(SIGLAS_UNIVERSIDAD)) expect(nombres.has(nombre), sigla).toBe(true);
  });

  it('"medicina uc" -> Medicina en la Pontificia Universidad Católica', () => {
    const { resultados } = buscar('medicina uc');
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados.every((r) => r.carrera.universidadNombre === 'Pontificia Universidad Católica de Chile')).toBe(true);
    expect(primera('medicina uc').categoria).toBe('medicina');
  });

  it('"uc" es sigla completa, no un pedazo de "educación"', () => {
    const { resultados } = buscar('educacion uc');
    expect(resultados.every((r) => r.carrera.universidadNombre === 'Pontificia Universidad Católica de Chile')).toBe(true);
    const soloUc = buscar('uc').resultados;
    expect(soloUc.length).toBeGreaterThan(0);
    expect(soloUc.every((r) => r.carrera.universidadNombre === 'Pontificia Universidad Católica de Chile')).toBe(true);
  });

  it('"ing civil usach" -> Ingeniería Civil en la Universidad de Santiago', () => {
    const r = buscar('ing civil usach').resultados;
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.carrera.universidadNombre === 'Universidad de Santiago de Chile')).toBe(true);
    expect(r[0].carrera.categoria.startsWith('ingenieria-civil')).toBe(true);
  });

  it('"ingeneria comercial" tolera el error de tipeo', () => {
    expect(primera('ingeneria comercial').categoria).toBe('ingenieria-comercial');
  });

  it('"psicologia uchile" -> Psicología en la Universidad de Chile', () => {
    const c = primera('psicologia uchile');
    expect(c.categoria).toBe('psicologia');
    expect(c.universidadNombre).toBe('Universidad de Chile');
    expect(primera('psico uchile').id).toBe(c.id);
  });

  it('"civil informatica" -> Ingeniería Civil Informática primero', () => {
    const grupos = agruparPorCategoria(buscar('civil informatica').resultados);
    expect(grupos[0].categoria).toBe('ingenieria-civil-informatica');
  });

  it('sugiere "¿Quisiste decir…?" cuando no hay resultados', () => {
    expect(buscar('medisina usach').resultados.length).toBeGreaterThan(0); // 1 error: se tolera
    const r = buscar('drecoh uchile'); // 2 errores en palabra corta: no calza, pero se sugiere
    expect(r.resultados).toHaveLength(0);
    expect(r.sugerencia).toBe('derecho uchile');
    expect(buscar('xqzwv').sugerencia).toBeNull();
  });

  it('dentro de cada carrera ordena por corte, sin corte al final', () => {
    for (const g of agruparPorCategoria(buscar('medicina').resultados)) {
      const cortes = g.carreras.map((c) => c.puntajeCorte);
      const conCorte = cortes.filter((x): x is number => x !== null);
      expect(conCorte).toEqual([...conCorte].sort((a, b) => b - a));
      expect(cortes.slice(conCorte.length).every((x) => x === null)).toBe(true);
    }
  });

  it('responde rápido (apto para celular)', () => {
    buscar('a'); // construye el índice
    const t = performance.now();
    for (const q of ['ingeneria comercial', 'psicologia uchile', 'medicina uc', 'pedagogia en matematica']) buscar(q);
    expect((performance.now() - t) / 4).toBeLessThan(50);
  });
});

describe('utilidades', () => {
  it('distancia con transposición y corte', () => {
    expect(distancia('ingeneria', 'ingenieria', 2)).toBe(1);
    expect(distancia('psicolgoia', 'psicologia', 2)).toBe(1);
    expect(distancia('abc', 'xyz12', 1)).toBe(2);
  });

  it('resaltar marca el comienzo coincidente respetando tildes', () => {
    expect(resaltar('Psicología', 'psic')).toEqual([
      { texto: 'Psic', resaltado: true },
      { texto: 'ología', resaltado: false },
    ]);
    expect(resaltar('Ingeniería Civil', 'ing civil').filter((s) => s.resaltado).map((s) => s.texto)).toEqual(['Ingeniería', 'Civil']);
  });
});
