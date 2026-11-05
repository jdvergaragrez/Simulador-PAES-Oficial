import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';

// Rendición PAES Regular, Admisión 2027 (hora local de Chile; mes 0-indexado).
const PAES = new Date(2026, 10, 30, 8, 0).getTime();

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
  const now = useNow(30000);
  const diff = PAES - now;

  if (diff <= 0) return null;

  const dias = Math.floor(diff / 86400000);
  const horas = Math.floor((diff % 86400000) / 3600000);

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 min-w-0 text-[#475569]">
        <CalendarDays size={16} className="shrink-0 text-[#94A3B8]" />
        <span className="truncate">
          Faltan <strong className="font-semibold text-[#0F172A] tabular-nums">{dias} días y {horas} h</strong> para la PAES
        </span>
      </div>
      <span className="hidden sm:block shrink-0 text-xs text-[#94A3B8] first-letter:uppercase">{FORMATO_FECHA.format(PAES)}</span>
    </div>
  );
}

export default React.memo(TopBar);
