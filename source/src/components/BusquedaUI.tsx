// Piezas compartidas por el selector principal y el buscador general.
import React from 'react';
import { Check, TriangleAlert, CircleX, Minus, type LucideIcon } from 'lucide-react';
import { ESTADOS, EstadoCorte } from '../constants';
import { resaltar } from '../busqueda';

const ICONO_ESTADO: Record<EstadoCorte, LucideIcon> = {
  alcanzable: Check,
  limite: TriangleAlert,
  noalcanza: CircleX,
  sindato: Minus,
};

export function EstadoBadge({ estado }: { estado: EstadoCorte }) {
  const meta = ESTADOS[estado];
  const Icon = ICONO_ESTADO[estado];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: meta.tint, color: meta.ink }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

// Texto con las partes que coinciden con la búsqueda resaltadas.
export function Resaltado({ texto, query }: { texto: string; query: string }) {
  if (!query.trim()) return <>{texto}</>;
  return (
    <>
      {resaltar(texto, query).map((s, i) =>
        s.resaltado ? <mark key={i} className="bg-transparent text-[#2563EB] font-semibold">{s.texto}</mark> : <React.Fragment key={i}>{s.texto}</React.Fragment>
      )}
    </>
  );
}
