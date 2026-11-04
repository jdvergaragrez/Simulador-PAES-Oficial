import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, X, Building2, Info, TriangleAlert, Check, CircleX, Minus, ChartColumn, type LucideIcon } from 'lucide-react';
import { CarreraConDetalle } from '../types';
import { displayNombreUniversidad, normalizar } from '../data';
import { calculatePonderado, puntajePrueba, PuntajesDirectos } from '../utils';
import { ANIO_CORTES, ESTADOS, EstadoCorte, PRUEBAS, estadoCorte } from '../constants';

interface CareerDetailModalProps {
  carrera: CarreraConDetalle;
  categoriaDisplay: Record<string, string>;
  nemScore: number;
  rankingScore: number;
  lectoraCorrect: number;
  m1Correct: number;
  m2Correct: number;
  cienciasCorrect: number;
  historiaCorrect: number;
  cienciasModule: 'biologia' | 'fisica' | 'quimica';
  directos: PuntajesDirectos;
  isFav: boolean;
  onToggleFav: () => void;
  onClose: () => void;
}

const fmt = (n: number, dec = 2) => n.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
// Mínimos DEMRE: enteros normalmente, pero sin perder decimales si los hay.
const fmtMin = (n: number) => n.toLocaleString('es-CL', { maximumFractionDigits: 2 });

const ICONO_ESTADO: Record<EstadoCorte, LucideIcon> = {
  alcanzable: Check,
  limite: TriangleAlert,
  noalcanza: CircleX,
  sindato: Minus,
};

function CareerDetailModal({
  carrera,
  categoriaDisplay,
  nemScore,
  rankingScore,
  lectoraCorrect,
  m1Correct,
  m2Correct,
  cienciasCorrect,
  historiaCorrect,
  cienciasModule,
  directos,
  isFav,
  onToggleFav,
  onClose,
}: CareerDetailModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const p = carrera.ponderacion;
  const hayPuntajes =
    nemScore > 0 || rankingScore > 0 || lectoraCorrect > 0 || m1Correct > 0 ||
    m2Correct > 0 || cienciasCorrect > 0 || historiaCorrect > 0 ||
    Object.keys(directos).length > 0;

  const ponderado = hayPuntajes
    ? calculatePonderado(nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, carrera, directos)
    : null;

  const sLect = puntajePrueba('lectora', lectoraCorrect, cienciasModule, directos);
  const sM1 = puntajePrueba('m1', m1Correct, cienciasModule, directos);
  const sM2 = puntajePrueba('m2', m2Correct, cienciasModule, directos);
  const sCien = puntajePrueba('ciencias', cienciasCorrect, cienciasModule, directos);
  const sHist = puntajePrueba('historia', historiaCorrect, cienciasModule, directos);

  // Build the list of weighted factors (only those with weight > 0)
  const factores: { nombre: string; pct: number; puntaje: number | null; color: string; ink: string }[] = [];
  if (p) {
    if (p.nemPct > 0) factores.push({ nombre: 'NEM', pct: p.nemPct, puntaje: hayPuntajes ? nemScore : null, color: '#94A3B8', ink: '#475569' });
    if (p.rankingPct > 0) factores.push({ nombre: 'Ranking', pct: p.rankingPct, puntaje: hayPuntajes ? rankingScore : null, color: '#64748B', ink: '#475569' });
    if (p.lecturaPct > 0) factores.push({ nombre: PRUEBAS.lectora.label, pct: p.lecturaPct, puntaje: hayPuntajes ? sLect : null, color: PRUEBAS.lectora.color, ink: PRUEBAS.lectora.ink });
    if (p.m1Pct > 0) factores.push({ nombre: PRUEBAS.m1.label, pct: p.m1Pct, puntaje: hayPuntajes ? sM1 : null, color: PRUEBAS.m1.color, ink: PRUEBAS.m1.ink });
    if (p.m2Pct > 0) factores.push({ nombre: PRUEBAS.m2.label, pct: p.m2Pct, puntaje: hayPuntajes ? sM2 : null, color: PRUEBAS.m2.color, ink: PRUEBAS.m2.ink });
    if (carrera.electivaTipo === 'ciencias' && p.cienciasPct > 0) factores.push({ nombre: 'Ciencias', pct: p.cienciasPct, puntaje: hayPuntajes ? sCien : null, color: PRUEBAS.ciencias.color, ink: PRUEBAS.ciencias.ink });
    else if (carrera.electivaTipo === 'historia' && p.historiaPct > 0) factores.push({ nombre: 'Historia y Cs. Sociales', pct: p.historiaPct, puntaje: hayPuntajes ? sHist : null, color: PRUEBAS.historia.color, ink: PRUEBAS.historia.ink });
    else if (carrera.electivaTipo === 'mejor') {
      const usaCiencias = sCien >= sHist;
      const meta = usaCiencias ? PRUEBAS.ciencias : PRUEBAS.historia;
      factores.push({ nombre: 'Electiva (Ciencias o Historia, la mejor)', pct: Math.max(p.cienciasPct, p.historiaPct), puntaje: hayPuntajes ? Math.max(sCien, sHist) : null, color: meta.color, ink: meta.ink });
    }
    if ((p.pruebaEspecialPct ?? 0) > 0) factores.push({ nombre: 'Prueba especial', pct: p.pruebaEspecialPct!, puntaje: null, color: '#CBD5E1', ink: '#475569' });
  }
  const maxPct = Math.max(...factores.map((f) => f.pct), 1);

  const corte = carrera.puntajeCorte;
  const estado = ponderado !== null ? estadoCorte(ponderado, corte) : null;
  const estadoMeta = estado ? ESTADOS[estado] : null;
  const EstadoIcon = estado ? ICONO_ESTADO[estado] : null;
  const delta = ponderado !== null && corte !== null ? ponderado - corte : null;

  const minimo = carrera.ponderadoMinimo != null
    ? { label: 'Mín. postulación', valor: fmtMin(carrera.ponderadoMinimo) }
    : carrera.promedioMinimo != null
      ? { label: 'Mín. prom. Leng.+M1', valor: fmtMin(carrera.promedioMinimo) }
      : null;

  const statCls = 'bg-[#F4F3F1] rounded-xl px-3 py-2';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={carrera.nombre}
        className="bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[#E7E5E1]"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 pt-5 pb-4 border-b border-[#E7E5E1] flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F4F3F1] text-[#64748B]">
                Admisión {carrera.anioAdmision}
              </span>
              {categoriaDisplay[carrera.categoria] && normalizar(categoriaDisplay[carrera.categoria]) !== normalizar(carrera.nombre) && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F4F3F1] text-[#64748B] truncate max-w-[180px]">
                  {categoriaDisplay[carrera.categoria]}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A] leading-tight">{carrera.nombre}</h3>
            <p className="text-sm text-[#64748B] flex items-center gap-1 mt-0.5">
              <Building2 size={13} className="shrink-0" /> {displayNombreUniversidad(carrera)}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 -mr-1.5 -mt-1">
            <button
              onClick={onToggleFav}
              title={isFav ? 'Quitar de favoritas' : 'Agregar a favoritas'}
              aria-label={isFav ? 'Quitar de favoritas' : 'Agregar a favoritas'}
              aria-pressed={isFav}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-[#F4F3F1]"
            >
              <Star size={18} strokeWidth={1.8} className={isFav ? 'fill-[#F59E0B] text-[#D97706]' : 'text-[#94A3B8]'} />
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F4F3F1] transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Score / corte summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#F4F3F1] rounded-2xl p-3.5">
              <div className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-[#94A3B8] mb-1">Tu ponderado</div>
              <div className="text-2xl font-bold text-[#0F172A] tabular-nums leading-tight">
                {ponderado !== null ? fmt(ponderado) : '—'}
              </div>
            </div>
            <div className="bg-[#F4F3F1] rounded-2xl p-3.5">
              <div className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-[#94A3B8] mb-1">
                {corte !== null ? `Corte ${ANIO_CORTES}` : minimo?.label ?? `Corte ${ANIO_CORTES}`}
              </div>
              <div className="text-2xl font-bold text-[#0F172A] tabular-nums leading-tight">
                {corte !== null ? fmt(corte) : minimo ? minimo.valor : '—'}
              </div>
            </div>
          </div>

          {estadoMeta && EstadoIcon && estado !== 'sindato' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: estadoMeta.tint, color: estadoMeta.ink }}
              >
                <EstadoIcon size={13} strokeWidth={2.5} />
                {estadoMeta.label}
              </span>
              {delta !== null && (
                <span className="text-sm font-semibold tabular-nums" style={{ color: estadoMeta.ink }}>
                  {delta >= 0 ? '+' : '−'}{fmt(Math.abs(delta))} pts {delta >= 0 ? 'sobre' : 'bajo'} el corte {ANIO_CORTES}
                </span>
              )}
            </div>
          )}

          {/* Ponderaciones per prueba */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ChartColumn size={16} className="text-[#64748B]" />
              <div className="text-sm font-semibold text-[#0F172A]">Cómo pondera esta carrera</div>
            </div>
            {factores.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Esta carrera no tiene ponderaciones publicadas.</p>
            ) : (
              <div className="space-y-3">
                {factores.map((f) => (
                  <div key={f.nombre} className="space-y-1.5">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: f.color }} aria-hidden />
                        <span className="text-sm font-medium truncate" style={{ color: f.ink }}>{f.nombre}</span>
                      </span>
                      <span className="text-sm font-semibold text-[#0F172A] tabular-nums shrink-0">
                        {f.pct}%
                        {f.puntaje !== null && (
                          <span className="text-[11px] text-[#94A3B8] font-medium ml-1.5">· {f.puntaje.toLocaleString('es-CL', { maximumFractionDigits: 2 })} pts</span>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#ECEAE6] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(f.pct / maxPct) * 100}%`, background: f.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra facts */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {carrera.region && (
              <div className={statCls}>
                <div className="text-[#94A3B8]">Región</div>
                <div className="font-semibold text-[#0F172A]">{carrera.region}</div>
              </div>
            )}
            {carrera.vacantes !== null && (
              <div className={statCls}>
                <div className="text-[#94A3B8]">Vacantes</div>
                <div className="font-semibold text-[#0F172A] tabular-nums">{carrera.vacantes}</div>
              </div>
            )}
            {corte !== null && minimo && (
              <div className={statCls}>
                <div className="text-[#94A3B8]">{minimo.label}</div>
                <div className="font-semibold text-[#0F172A] tabular-nums">{minimo.valor}</div>
              </div>
            )}
            {carrera.codigoDemre && (
              <div className={statCls}>
                <div className="text-[#94A3B8]">Código DEMRE</div>
                <div className="font-semibold text-[#0F172A] tabular-nums">{carrera.codigoDemre}</div>
              </div>
            )}
          </div>

          {carrera.corteNota && (
            <p className="flex items-start gap-1.5 text-xs text-[#92400E] bg-[#FEF3C7] rounded-xl px-3 py-2">
              <TriangleAlert size={14} className="shrink-0 mt-px" /> {carrera.corteNota}
            </p>
          )}
          {carrera.nota && (
            <p className="flex items-start gap-1.5 text-xs text-[#64748B] bg-[#F4F3F1] rounded-xl px-3 py-2 leading-relaxed">
              <Info size={14} className="shrink-0 mt-px text-[#94A3B8]" /> {carrera.nota}
            </p>
          )}
          {!hayPuntajes && (
            <p className="flex items-start gap-1.5 text-xs text-[#64748B] bg-[#F4F3F1] rounded-xl px-3 py-2">
              <Info size={14} className="shrink-0 mt-px text-[#94A3B8]" />
              <span>Ingresa tus puntajes en <strong className="font-semibold text-[#0F172A]">Mi puntaje</strong> para ver tu ponderado y estado en esta carrera.</span>
            </p>
          )}
          {p && (p.pruebaEspecialPct ?? 0) > 0 && (
            <p className="text-xs text-[#92400E] bg-[#FEF3C7] rounded-xl px-3 py-2">
              Incluye una prueba especial ({p.pruebaEspecialPct}%) que no se puede simular aquí: tu ponderado real dependerá de ella.
            </p>
          )}
          <p className="text-[11px] text-[#94A3B8]">
            Ponderaciones Admisión {carrera.anioAdmision}. El corte es el del último seleccionado en Admisión {ANIO_CORTES}, como referencia.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default React.memo(CareerDetailModal);
