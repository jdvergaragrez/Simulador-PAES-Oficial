import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';

interface Hito {
  label: string;
  // mes 0-indexado, hora local de Chile
  date: [number, number, number, number, number];
}

const HITOS: Hito[] = [
  { label: 'Oferta Definitiva 2027', date: [2026, 8, 24, 0, 0] },
  { label: 'Servicios y Beneficios', date: [2026, 10, 19, 0, 0] },
  { label: 'Rendición PAES Regular', date: [2026, 10, 30, 8, 0] },
  { label: 'Publicación de puntajes PAES', date: [2027, 0, 4, 8, 0] },
  { label: 'Inicio de postulaciones', date: [2027, 0, 4, 9, 0] },
  { label: 'Resultados de selección', date: [2027, 0, 18, 12, 0] },
];

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function TopBar() {
  const now = useNow(1000);

  const proximo = useMemo(() => {
    const conFecha = HITOS.map((h) => {
      const [y, mo, d, hh, mi] = h.date;
      return { ...h, ts: new Date(y, mo, d, hh, mi).getTime() };
    });
    return conFecha.find((h) => h.ts > now) ?? null;
  }, [now]);

  const diff = proximo ? proximo.ts - now : 0;
  const unidades = [
    { v: Math.floor(diff / 86400000), l: 'días' },
    { v: Math.floor((diff % 86400000) / 3600000), l: 'hrs' },
    { v: Math.floor((diff % 3600000) / 60000), l: 'min' },
    { v: Math.floor((diff % 60000) / 1000), l: 'seg' },
  ];

  if (!proximo) return null;

  return (
        <div className="bg-white border border-[#E7E5E1] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex shrink-0 w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-[#94A3B8]">Admisión 2027</div>
              <div className="text-sm font-semibold text-[#0F172A] truncate">{proximo.label}</div>
              <div className="hidden sm:block text-xs text-[#64748B] first-letter:uppercase">{FORMATO_FECHA.format(proximo.ts)}</div>
            </div>
          </div>
          <div className="flex items-end gap-3 sm:gap-4 shrink-0">
            {unidades.map((u, i) => (
              <div key={u.l} className={`text-center ${i === 3 ? 'hidden sm:block' : ''}`}>
                <div className="text-lg sm:text-2xl font-bold tabular-nums text-[#0F172A] leading-none">{String(u.v).padStart(2, '0')}</div>
                <div className="text-[10px] text-[#94A3B8] mt-1">{u.l}</div>
              </div>
            ))}
          </div>
        </div>
  );
}

export default React.memo(TopBar);
