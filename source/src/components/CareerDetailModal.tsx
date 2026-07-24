import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CarreraConDetalle } from '../types';
import { tablasPAES, displayNombreUniversidad } from '../data';
import { calculatePonderado } from '../utils';

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
  isFav: boolean;
  onToggleFav: () => void;
  onClose: () => void;
}

const tierInfo: Record<string, { text: string; cls: string }> = {
  verified: { text: 'Verificada', cls: 'border-emerald-200 text-emerald-600 bg-emerald-50' },
  medium: { text: 'Referencia', cls: 'border-blue-200 text-blue-600 bg-blue-50' },
  partial: { text: 'Referencia', cls: 'border-blue-200 text-blue-600 bg-blue-50' },
  broken: { text: 'Incompleta', cls: 'border-amber-200 text-amber-600 bg-amber-50' },
  nodata: { text: 'No disp.', cls: 'border-slate-200 text-slate-400 bg-slate-50' },
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
    m2Correct > 0 || cienciasCorrect > 0 || historiaCorrect > 0;

  const ponderado = hayPuntajes
    ? calculatePonderado(nemScore, rankingScore, lectoraCorrect, m1Correct, m2Correct, cienciasCorrect, historiaCorrect, cienciasModule, carrera)
    : null;

  const cienciasKey = `ciencias_${cienciasModule}` as 'ciencias_biologia' | 'ciencias_fisica' | 'ciencias_quimica';
  const sLect = tablasPAES.lectora[lectoraCorrect] ?? 100;
  const sM1 = tablasPAES.m1[m1Correct] ?? 100;
  const sM2 = tablasPAES.m2[m2Correct] ?? 100;
  const sCien = tablasPAES[cienciasKey]?.[cienciasCorrect] ?? 100;
  const sHist = tablasPAES.historia[historiaCorrect] ?? 100;

  // Build the list of weighted factors (only those with weight > 0)
  const factores: { nombre: string; pct: number; puntaje: number | null }[] = [];
  if (p) {
    if (p.nemPct > 0) factores.push({ nombre: 'NEM', pct: p.nemPct, puntaje: hayPuntajes ? nemScore : null });
    if (p.rankingPct > 0) factores.push({ nombre: 'Ranking', pct: p.rankingPct, puntaje: hayPuntajes ? rankingScore : null });
    if (p.lecturaPct > 0) factores.push({ nombre: 'Competencia Lectora', pct: p.lecturaPct, puntaje: hayPuntajes ? sLect : null });
    if (p.m1Pct > 0) factores.push({ nombre: 'Matemática M1', pct: p.m1Pct, puntaje: hayPuntajes ? sM1 : null });
    if (p.m2Pct > 0) factores.push({ nombre: 'Matemática M2', pct: p.m2Pct, puntaje: hayPuntajes ? sM2 : null });
    if (carrera.electivaTipo === 'ciencias' && p.cienciasPct > 0) factores.push({ nombre: 'Ciencias', pct: p.cienciasPct, puntaje: hayPuntajes ? sCien : null });
    else if (carrera.electivaTipo === 'historia' && p.historiaPct > 0) factores.push({ nombre: 'Historia y Cs. Sociales', pct: p.historiaPct, puntaje: hayPuntajes ? sHist : null });
    else if (carrera.electivaTipo === 'mejor') factores.push({ nombre: 'Electivo (Cs o Historia, la mejor)', pct: Math.max(p.cienciasPct, p.historiaPct), puntaje: hayPuntajes ? Math.max(sCien, sHist) : null });
    if ((p.pruebaEspecialPct ?? 0) > 0) factores.push({ nombre: 'Prueba especial', pct: p.pruebaEspecialPct!, puntaje: null });
  }
  const maxPct = Math.max(...factores.map((f) => f.pct), 1);

  const referencia = carrera.puntajeCorte ?? carrera.promedioMinimo ?? null;
  const gap = ponderado !== null && referencia !== null ? ponderado - referencia : null;
  const tb = tierInfo[carrera.tier] || tierInfo.verified;

  let estadoBadge: { text: string; cls: string } | null = null;
  if (gap !== null) {
    if (gap >= 0) estadoBadge = { text: 'Sobre el corte', cls: 'bg-[#DCFCE7] text-[#10B981]' };
    else if (gap >= -30) estadoBadge = { text: 'Cerca del corte', cls: 'bg-[#DBEAFE] text-[#3B82F6]' };
    else estadoBadge = { text: 'Bajo el corte', cls: 'bg-[#FEE2E2] text-[#EF4444]' };
  }

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
        className="bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 pt-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full border ${tb.cls}`}>{tb.text}</span>
              <span className="text-[10px] px-2 py-0.5 font-bold rounded-full border border-slate-200 text-slate-500 bg-slate-50">
                Admisión {carrera.anioAdmision}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] leading-tight">{carrera.nombre}</h3>
            <p className="text-sm text-[#64748B]">{displayNombreUniversidad(carrera)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleFav}
              title="Favorito"
              className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-colors ${isFav ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
            >
              {isFav ? '★' : '☆'}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Score / corte summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-3.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">Tu ponderado</div>
              <div className="text-2xl font-extrabold text-[#0F172A] font-mono tabular-nums">
                {ponderado !== null ? ponderado.toFixed(2) : '—'}
              </div>
            </div>
            <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-3.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
                {carrera.puntajeCorte !== null ? 'Corte oficial' : 'Mín. postulación'}
              </div>
              <div className="text-2xl font-extrabold text-[#0F172A] font-mono tabular-nums">
                {referencia !== null ? referencia.toFixed(2) : '—'}
              </div>
            </div>
          </div>

          {estadoBadge && (
            <div className="flex items-center justify-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${estadoBadge.cls}`}>{estadoBadge.text}</span>
              <span className="text-xs text-[#64748B] font-mono">
                {gap! >= 0 ? '+' : ''}{gap!.toFixed(2)} pts
              </span>
            </div>
          )}

          {/* Ponderaciones per prueba */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-3">Ponderaciones por prueba</div>
            {factores.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Esta carrera no tiene ponderaciones publicadas.</p>
            ) : (
              <div className="space-y-3">
                {factores.map((f) => (
                  <div key={f.nombre} className="space-y-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-sm font-semibold text-[#0F172A]">{f.nombre}</span>
                      <span className="text-sm font-bold text-[#3B82F6] font-mono tabular-nums shrink-0">
                        {f.pct}%
                        {f.puntaje !== null && (
                          <span className="text-[11px] text-[#94A3B8] font-semibold ml-1.5">· {f.puntaje} pts</span>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#3B82F6] rounded-full transition-all duration-500" style={{ width: `${(f.pct / maxPct) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra facts */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {carrera.region && (
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl px-3 py-2">
                <div className="text-[#94A3B8] font-medium">Región</div>
                <div className="font-semibold text-[#0F172A]">{carrera.region}</div>
              </div>
            )}
            {carrera.vacantes !== null && (
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl px-3 py-2">
                <div className="text-[#94A3B8] font-medium">Vacantes</div>
                <div className="font-semibold text-[#0F172A]">{carrera.vacantes}</div>
              </div>
            )}
            {carrera.ponderadoMinimo != null && (
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl px-3 py-2">
                <div className="text-[#94A3B8] font-medium">Ponderado mínimo</div>
                <div className="font-semibold text-[#0F172A]">{carrera.ponderadoMinimo}</div>
              </div>
            )}
            {carrera.codigoDemre && (
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl px-3 py-2">
                <div className="text-[#94A3B8] font-medium">Código DEMRE</div>
                <div className="font-semibold text-[#0F172A]">{carrera.codigoDemre}</div>
              </div>
            )}
          </div>

          {carrera.corteNota && (
            <p className="text-[11px] text-amber-700 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">{carrera.corteNota}</p>
          )}
          {carrera.nota && (
            <p className="text-xs text-[#94A3B8] bg-slate-50 rounded-xl px-3 py-2 leading-relaxed">💡 {carrera.nota}</p>
          )}
          {!hayPuntajes && (
            <p className="text-[11px] text-[#94A3B8] bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
              Ingresa tus puntajes en <strong className="font-semibold text-[#64748B]">Mi puntaje</strong> para ver tu ponderado y estado en esta carrera.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default React.memo(CareerDetailModal);
