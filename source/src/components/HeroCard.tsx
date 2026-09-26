import React, { useState, useEffect, useRef } from 'react';
import { Target, Check, TriangleAlert, CircleX, Minus, GraduationCap, Building2, Info, Share2, FileText, LoaderCircle, type LucideIcon } from 'lucide-react';
import Card from './Card';
import { CarreraConDetalle } from '../types';
import { displayNombreUniversidad } from '../data';
import { ESTADOS, EstadoCorte, PRUEBAS, PruebaId, estadoCorte } from '../constants';
import { compartirResultado, ResultadoData } from '../share/resultado';

function useAnimatedNumber(target: number) {
  const [current, setCurrent] = useState(target);
  const previousRef = useRef(target);

  useEffect(() => {
    let start: number | null = null;
    const from = previousRef.current;
    let frame: number;
    const step = (t: number) => {
      if (start === null) start = t;
      const k = Math.min((t - start) / 450, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      setCurrent(from + eased * (target - from));
      if (k < 1) frame = requestAnimationFrame(step);
      else previousRef.current = target;
    };
    frame = requestAnimationFrame(step);
    // Si el navegador pausa requestAnimationFrame (pestaña en segundo plano), igual mostrar el valor final.
    const fallback = setTimeout(() => setCurrent(target), 600);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
      previousRef.current = target;
    };
  }, [target]);

  return current;
}

const fmt = (n: number, dec = 2) => n.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const ICONO_ESTADO: Record<EstadoCorte, LucideIcon> = {
  alcanzable: Check,
  limite: TriangleAlert,
  noalcanza: CircleX,
  sindato: Minus,
};

const R = 70;
const CIRC = 2 * Math.PI * R;

interface HeroCardProps {
  score: number | null;
  targetCareer: string;
  categoriaDisplay: Record<string, string>;
  targetUni: CarreraConDetalle | null;
  isEmpty: boolean;
  anioCortes: number;
  puntajes: Record<PruebaId, number>;
  m2Ingresada: boolean;
  nemScore: number;
  rankingScore: number;
}

function HeroCard({ score, targetCareer, categoriaDisplay, targetUni, isEmpty, anioCortes, puntajes, m2Ingresada, nemScore, rankingScore }: HeroCardProps) {
  const finalScore = score ?? 0;
  const animated = useAnimatedNumber(finalScore);
  const [accion, setAccion] = useState<null | 'imagen' | 'pdf'>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (isEmpty || !targetUni) {
    return (
      <Card className="border-dashed !bg-transparent text-center py-10 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
          <Target size={22} />
        </div>
        <p className="text-sm text-[#64748B] max-w-sm">
          Ingresa tus notas y puntajes para ver tu ponderado y qué tan cerca estás del corte.
        </p>
      </Card>
    );
  }

  const corte = targetUni.puntajeCorte;
  const estado = estadoCorte(finalScore, corte);
  const meta = ESTADOS[estado];
  const EstadoIcon = ICONO_ESTADO[estado];
  const delta = corte !== null ? finalScore - corte : null;
  const ringColor = estado === 'sindato' ? '#2563EB' : meta.color;
  const promedioLM1 = (puntajes.lectora + puntajes.m1) / 2;
  const minimo = targetUni.ponderadoMinimo != null
    ? { label: 'Mínimo ponderado', valor: targetUni.ponderadoMinimo, bajo: finalScore < targetUni.ponderadoMinimo }
    : targetUni.promedioMinimo != null
      ? { label: 'Mín. promedio Leng. + M1', valor: targetUni.promedioMinimo, bajo: promedioLM1 < targetUni.promedioMinimo }
      : null;

  const w = targetUni.ponderacion;
  const usaCiencias =
    targetUni.electivaTipo === 'ciencias' ||
    (targetUni.electivaTipo === 'mejor' && puntajes.ciencias >= puntajes.historia);
  const electiva: PruebaId = usaCiencias ? 'ciencias' : 'historia';
  const segmentos = w
    ? [
        { label: 'NEM', pct: w.nemPct, color: '#94A3B8', puntaje: nemScore as number | null },
        { label: 'Ranking', pct: w.rankingPct, color: '#64748B', puntaje: rankingScore },
        { label: PRUEBAS.lectora.short, pct: w.lecturaPct, color: PRUEBAS.lectora.color, puntaje: puntajes.lectora },
        { label: PRUEBAS.m1.short, pct: w.m1Pct, color: PRUEBAS.m1.color, puntaje: puntajes.m1 },
        { label: PRUEBAS.m2.short, pct: w.m2Pct, color: PRUEBAS.m2.color, puntaje: puntajes.m2 },
        {
          label: targetUni.electivaTipo === 'mejor' ? `${PRUEBAS[electiva].short} (mejor electiva)` : PRUEBAS[electiva].short,
          pct: usaCiencias ? w.cienciasPct : w.historiaPct,
          color: PRUEBAS[electiva].color,
          puntaje: puntajes[electiva],
        },
        { label: 'Prueba especial', pct: w.pruebaEspecialPct ?? 0, color: '#CBD5E1', puntaje: null },
      ].filter((s) => s.pct > 0)
    : [];

  const avisosCalculo: string[] = [];
  if (w && (w.pruebaEspecialPct ?? 0) > 0)
    avisosCalculo.push(`Esta carrera tiene una prueba especial (${w.pruebaEspecialPct}%) que no se puede simular: el ponderado real dependerá de ella.`);
  if (w && w.m2Pct > 0 && !m2Ingresada)
    avisosCalculo.push(`Esta carrera pondera M2 (${w.m2Pct}%) y no fue ingresada: el cálculo la toma con el mínimo.`);
  if (minimo?.bajo) avisosCalculo.push('El puntaje está bajo el mínimo exigido para postular a esta carrera.');

  const resultado: ResultadoData = {
    carrera: targetUni.nombre || categoriaDisplay[targetCareer] || targetCareer,
    universidad: displayNombreUniversidad(targetUni),
    puntaje: finalScore,
    corte,
    anioCortes,
    estado,
    minimo: minimo ? { label: minimo.label, valor: minimo.valor } : null,
    factores: segmentos,
    codigoDemre: targetUni.codigoDemre,
    vacantes: targetUni.vacantes,
    avisos: avisosCalculo,
  };

  const onCompartir = async () => {
    setAccion('imagen');
    setAviso(null);
    try {
      const r = await compartirResultado(resultado);
      if (r === 'descargado') setAviso('Imagen descargada. Adjúntala en WhatsApp.');
    } catch {
      setAviso('No se pudo generar la imagen.');
    } finally {
      setAccion(null);
    }
  };

  const onPdf = async () => {
    setAccion('pdf');
    setAviso(null);
    try {
      const { descargarReportePdf } = await import('../share/reportePdf');
      await descargarReportePdf(resultado);
    } catch {
      setAviso('No se pudo generar el PDF. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setAccion(null);
    }
  };

  const progreso = Math.max(0, Math.min(1, animated / 1000));
  const angCorte = corte !== null ? (corte / 1000) * 360 - 90 : null;

  return (
    <Card className="space-y-5 @container">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-[#64748B]">
          <Target size={14} /> Tu ponderado
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F4F3F1] text-[#64748B]">
          Admisión {targetUni.anioAdmision}
        </span>
      </div>

      <div className="flex flex-col @lg:flex-row items-center gap-6">
        <div className="relative w-[180px] h-[180px] shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
            <circle cx="90" cy="90" r={R} fill="none" className="stroke-[#ECEAE6]" strokeWidth="14" />
            <circle
              cx="90" cy="90" r={R} fill="none" stroke={ringColor} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - progreso)}
              style={{ transition: 'stroke 0.3s ease' }}
            />
          </svg>
          {angCorte !== null && (
            <div
              className="absolute left-1/2 top-1/2 w-[3px] h-[22px] -ml-[1.5px] -mt-[11px] rounded-full bg-[#0F172A]"
              style={{ transform: `rotate(${angCorte + 90}deg) translateY(-${R}px)` }}
              title={`Corte ${anioCortes}: ${fmt(corte!)}`}
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[34px] font-bold tabular-nums tracking-tight text-[#0F172A] leading-none">
              {fmt(animated).split(',')[0]}
              <span className="text-lg text-[#94A3B8]">,{fmt(animated).split(',')[1]}</span>
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">de 1.000</div>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: meta.tint, color: meta.ink }}
            >
              <EstadoIcon size={13} strokeWidth={2.5} />
              {meta.label}
            </span>
            {delta !== null && (
              <span className="text-sm font-semibold tabular-nums" style={{ color: meta.ink }}>
                {delta >= 0 ? '+' : '−'}{fmt(Math.abs(delta))} pts {delta >= 0 ? 'sobre' : 'bajo'} el corte
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#F4F3F1] px-3 py-2">
              <div className="text-[10px] text-[#94A3B8]">Corte {anioCortes}</div>
              <div className="text-sm font-semibold tabular-nums text-[#0F172A]">{corte !== null ? fmt(corte) : 'Sin dato'}</div>
            </div>
            <div className="rounded-xl bg-[#F4F3F1] px-3 py-2">
              <div className="text-[10px] text-[#94A3B8]">{minimo?.label ?? 'Mínimo para postular'}</div>
              <div className="text-sm font-semibold tabular-nums text-[#0F172A]">
                {minimo ? fmt(minimo.valor, 0) : '—'}
              </div>
            </div>
          </div>

          {minimo?.bajo && (
            <p className="flex items-start gap-1.5 text-xs text-[#991B1B]">
              <TriangleAlert size={14} className="shrink-0 mt-px" />
              {targetUni.ponderadoMinimo != null
                ? 'Estás bajo el puntaje ponderado mínimo para postular a esta carrera.'
                : `Tu promedio Lenguaje + M1 (${fmt(promedioLM1, 0)}) está bajo el mínimo para postular.`}
            </p>
          )}
          {w && (w.pruebaEspecialPct ?? 0) > 0 && (
            <p className="flex items-start gap-1.5 text-xs text-[#92400E]">
              <TriangleAlert size={14} className="shrink-0 mt-px" />
              Esta carrera tiene una prueba especial ({w.pruebaEspecialPct}%) que no se puede simular aquí: tu ponderado real dependerá de ella.
            </p>
          )}
          {w && w.m2Pct > 0 && !m2Ingresada && (
            <p className="flex items-start gap-1.5 text-xs text-[#92400E]">
              <TriangleAlert size={14} className="shrink-0 mt-px" />
              Esta carrera pondera M2 ({w.m2Pct}%) y aún no la ingresas: el cálculo la toma con el mínimo.
            </p>
          )}
        </div>
      </div>

      {segmentos.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-[#94A3B8]">Cómo pondera esta carrera</div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            {segmentos.map((s) => (
              <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} title={`${s.label} ${s.pct}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {segmentos.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.label} <span className="font-semibold text-[#0F172A] tabular-nums">{s.pct}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-[#E7E5E1] flex items-start gap-3">
        <GraduationCap size={18} className="text-[#94A3B8] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#0F172A]">{targetUni.nombre || categoriaDisplay[targetCareer] || targetCareer}</div>
          <div className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
            <Building2 size={12} /> {displayNombreUniversidad(targetUni)}
          </div>
          {targetUni.nota && (
            <p className="mt-2 text-xs text-[#64748B] flex items-start gap-1.5">
              <Info size={13} className="shrink-0 mt-px" /> {targetUni.nota}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-2">
          <button
            onClick={onCompartir}
            disabled={accion !== null}
            className="h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-wait"
          >
            {accion === 'imagen' ? <LoaderCircle size={16} className="animate-spin" /> : <Share2 size={16} />}
            Compartir resultado
          </button>
          <button
            onClick={onPdf}
            disabled={accion !== null}
            className="h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#F4F3F1] text-[#0F172A] text-sm font-semibold hover:bg-[#ECEAE6] transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-wait"
          >
            {accion === 'pdf' ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
            Descargar reporte PDF
          </button>
        </div>
        {aviso && <p className="text-xs text-center text-[#64748B]" role="status">{aviso}</p>}
      </div>
    </Card>
  );
}

export default React.memo(HeroCard);
