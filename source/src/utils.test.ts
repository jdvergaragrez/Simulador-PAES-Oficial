import { describe, expect, it } from 'vitest';
import { calculatePonderado, correctasEquivalentes, puntajePrueba } from './utils';
import { tablasPAES } from './data';
import { CarreraConDetalle, ElectiveType, Ponderacion } from './types';

function carrera(electivaTipo: ElectiveType, w: Partial<Ponderacion>): CarreraConDetalle {
  return {
    id: 'test',
    nombre: 'Carrera de prueba',
    categoria: 'test',
    universidadNombre: 'Universidad de prueba',
    universidadTipo: 'CRUCH',
    sedeNombre: 'Sede Principal',
    region: null,
    anioAdmision: 2027,
    tier: 'verified',
    electivaTipo,
    vacantes: null,
    puntajeCorte: null,
    ponderacion: {
      carreraId: 'test',
      anioAdmision: 2027,
      nemPct: 10,
      rankingPct: 20,
      lecturaPct: 20,
      m1Pct: 30,
      m2Pct: 0,
      cienciasPct: 20,
      historiaPct: 20,
      ...w,
    },
  };
}

// Correctas usadas en todos los casos: lectora 40, m1 40, m2 20, ciencias 50, historia 30.
const L = tablasPAES.lectora[40]; // 671
const M1 = tablasPAES.m1[40]; // 664
const M2 = tablasPAES.m2[20]; // 512
const CI = tablasPAES.ciencias_biologia[50]; // 638
const HI = tablasPAES.historia[30]; // 555

const pond = (c: CarreraConDetalle, directos = {}) =>
  calculatePonderado(700, 750, 40, 40, 20, 50, 30, 'biologia', c, directos);

const esperado = (parts: [number, number][]) =>
  Math.round(parts.reduce((s, [p, pct]) => s + p * pct, 0)) / 100;

describe('calculatePonderado', () => {
  it('usa ciencias cuando la electiva es ciencias', () => {
    expect(pond(carrera('ciencias', {}))).toBe(
      esperado([[700, 10], [750, 20], [L, 20], [M1, 30], [CI, 20]])
    );
  });

  it('usa historia cuando la electiva es historia', () => {
    expect(pond(carrera('historia', {}))).toBe(
      esperado([[700, 10], [750, 20], [L, 20], [M1, 30], [HI, 20]])
    );
  });

  it('con electiva "mejor" toma la prueba de mayor puntaje', () => {
    const c = carrera('mejor', {});
    expect(pond(c)).toBe(pond(carrera('ciencias', {}))); // ciencias 638 > historia 555
    const conHistoriaAlta = calculatePonderado(700, 750, 40, 40, 20, 0, 60, 'biologia', c);
    expect(conHistoriaAlta).toBe(
      esperado([[700, 10], [750, 20], [L, 20], [M1, 30], [tablasPAES.historia[60], 20]])
    );
  });

  it('suma M2 cuando la carrera la pondera', () => {
    const c = carrera('ciencias', { m1Pct: 20, m2Pct: 10 });
    expect(pond(c)).toBe(esperado([[700, 10], [750, 20], [L, 20], [M1, 20], [M2, 10], [CI, 20]]));
  });

  it('la prueba especial no se simula: su porcentaje no suma puntaje', () => {
    const c = carrera('ciencias', { nemPct: 10, rankingPct: 10, lecturaPct: 10, m1Pct: 10, cienciasPct: 10, pruebaEspecialPct: 50 });
    expect(pond(c)).toBe(esperado([[700, 10], [750, 10], [L, 10], [M1, 10], [CI, 10]]));
  });

  it('respeta los puntajes ingresados directamente', () => {
    const c = carrera('ciencias', {});
    expect(pond(c, { lectora: 900 })).toBe(
      esperado([[700, 10], [750, 20], [900, 20], [M1, 30], [CI, 20]])
    );
  });

  it('devuelve null sin ponderación', () => {
    expect(pond({ ...carrera('ciencias', {}), ponderacion: null })).toBeNull();
  });
});

describe('conversión de correctas a puntaje', () => {
  it('lee la tabla oficial de cada prueba', () => {
    expect(puntajePrueba('lectora', 0, 'fisica')).toBe(100);
    expect(puntajePrueba('lectora', 60, 'fisica')).toBe(1000);
    expect(puntajePrueba('m1', 40, 'fisica')).toBe(664);
    expect(puntajePrueba('m2', 49, 'fisica')).toBe(1000);
  });

  it('ciencias usa la tabla del módulo elegido', () => {
    expect(puntajePrueba('ciencias', 50, 'biologia')).toBe(638);
    expect(puntajePrueba('ciencias', 50, 'fisica')).toBe(636);
    expect(puntajePrueba('ciencias', 50, 'quimica')).toBe(629);
  });

  it('correctasEquivalentes es la inversa aproximada', () => {
    expect(correctasEquivalentes('m1', 664, 'fisica')).toBe(40);
    expect(correctasEquivalentes('m1', 665, 'fisica')).toBe(40);
  });
});
