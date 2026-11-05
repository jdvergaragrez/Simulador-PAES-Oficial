import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import Card from './Card';
import { CarreraConDetalle } from '../types';
import { displayNombreUniversidad } from '../data';
import { areaDeCarrera, AREA_LABEL, Area } from '../areas';

interface Props {
  carreras: CarreraConDetalle[];
  target: CarreraConDetalle;
  ponderadoDe: (c: CarreraConDetalle) => number | null;
  anioCortes: number;
  onOpenDetail: (c: CarreraConDetalle) => void;
}

const fmt = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MAX = 5;

// "También te alcanza": carreras de la misma área cuyo corte ya superas, de la más exigente a la menos.
function AlternativasCard({ carreras, target, ponderadoDe, anioCortes, onOpenDetail }: Props) {
  const porArea = useMemo(() => {
    const m = new Map<Area, CarreraConDetalle[]>();
    for (const c of carreras) {
      if (c.puntajeCorte == null) continue;
      const a = areaDeCarrera(c.nombre);
      if (!a) continue;
      const lista = m.get(a);
      if (lista) lista.push(c);
      else m.set(a, [c]);
    }
    return m;
  }, [carreras]);

  const area = areaDeCarrera(target.nombre);

  const opciones = useMemo(() => {
    if (!area) return [];
    const res: { c: CarreraConDetalle; p: number; margen: number }[] = [];
    for (const c of porArea.get(area) ?? []) {
      if (c.id === target.id) continue;
      const p = ponderadoDe(c);
      if (p === null || p < c.puntajeCorte!) continue;
      res.push({ c, p, margen: p - c.puntajeCorte! });
    }
    return res.sort((x, y) => y.c.puntajeCorte! - x.c.puntajeCorte!).slice(0, MAX);
  }, [area, porArea, target.id, ponderadoDe]);

  if (!area || opciones.length === 0) return null;

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-5 pt-5 pb-2">
        <h3 className="text-base font-semibold text-[#0F172A]">También te alcanza</h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          Carreras de {AREA_LABEL[area]} donde ya superas el corte {anioCortes}
        </p>
      </div>
      <ul>
        {opciones.map(({ c, margen }) => (
          <li key={c.id} className="border-t border-[#EEF1F5] first:border-t-0">
            <button
              onClick={() => onOpenDetail(c)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#F2F4F7] cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#0F172A] truncate">{c.nombre}</div>
                <div className="text-xs text-[#64748B] truncate">{displayNombreUniversidad(c)}</div>
              </div>
              <div className="text-right shrink-0 tabular-nums">
                <div className="text-sm font-semibold" style={{ color: 'var(--e-alcanzable-ink)' }}>+{fmt(margen)}</div>
                <div className="text-[11px] text-[#94A3B8]">corte {fmt(c.puntajeCorte!)}</div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-[#94A3B8]" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default React.memo(AlternativasCard);
