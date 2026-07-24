import React, { useEffect, useMemo, useState } from 'react';
import Card from './Card';

interface Hito {
  id: string;
  label: string;
  // month is 0-indexed
  date: [number, number, number, number, number];
}

// Calendario oficial Admisión 2027 (fechas en hora local de Chile)
const HITOS: Hito[] = [
  { id: 'paes', label: '🎯 Rendición PAES Regular', date: [2026, 10, 30, 8, 0] },
  { id: 'ponderaciones', label: '📋 Oferta Definitiva 2027', date: [2026, 8, 24, 0, 0] },
  { id: 'simulador', label: '🧭 Apertura Simulador DEMRE', date: [2026, 9, 13, 12, 0] },
  { id: 'beneficios', label: '💰 Servicios y Beneficios', date: [2026, 10, 19, 0, 0] },
  { id: 'cierre-sim', label: '🔒 Cierre Simulador DEMRE', date: [2026, 11, 15, 12, 0] },
  { id: 'puntajes', label: '📊 Publicación de Puntajes PAES', date: [2027, 0, 4, 8, 0] },
  { id: 'postulaciones', label: '📝 Inicio de Postulaciones', date: [2027, 0, 4, 9, 0] },
  { id: 'seleccion', label: '🎓 Resultados de Selección', date: [2027, 0, 18, 12, 0] },
];

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function CountdownBanner() {
  const [hitoId, setHitoId] = useState('paes');
  const now = useNow();
  const hito = HITOS.find((h) => h.id === hitoId) || HITOS[0];

  const target = useMemo(() => {
    const [y, mo, d, h, mi] = hito.date;
    return new Date(y, mo, d, h, mi, 0).getTime();
  }, [hito]);

  const diff = Math.max(0, target - now);
  const dias = Math.floor(diff / 86400000);
  const horas = Math.floor((diff % 86400000) / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const seg = Math.floor((diff % 60000) / 1000);
  const pasado = diff === 0;

  const cell = (v: number, l: string) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/15 rounded-xl w-full min-w-[52px] py-2 text-center">
        <span className="text-2xl md:text-3xl font-extrabold tabular-nums">{String(v).padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/70">{l}</span>
    </div>
  );

  return (
    <Card id="section-countdown" className="!bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] text-white space-y-4 border-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Cuenta regresiva · Admisión 2027</div>
          <h3 className="text-base font-bold">{hito.label}</h3>
        </div>
      </div>

      {pasado ? (
        <div className="bg-white/15 rounded-xl py-4 text-center font-semibold">¡Este hito ya ocurrió! 🎉</div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {cell(dias, 'Días')}
          {cell(horas, 'Horas')}
          {cell(min, 'Min')}
          {cell(seg, 'Seg')}
        </div>
      )}

      <div className="relative">
        <select
          value={hitoId}
          onChange={(e) => setHitoId(e.target.value)}
          className="w-full h-10 px-3 pr-9 bg-white/15 text-white text-xs font-semibold rounded-xl appearance-none outline-none cursor-pointer border border-white/20 focus:bg-white/20"
        >
          {HITOS.map((h) => (
            <option key={h.id} value={h.id} className="text-[#0F172A]">{h.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/70">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
        </div>
      </div>
    </Card>
  );
}

export default React.memo(CountdownBanner);
