import React, { useEffect, useState } from 'react';
import Card from './Card';
import { nemFromGrade, rankingFromPercentil, grupoEducativoOptions, percentilOptions } from '../data';
import { GrupoEducativo } from '../types';

interface GradeInputsProps {
  g1: string;
  g2: string;
  g3: string;
  g4: string;
  manualNem: string;
  manualRanking: string;
  grupoEducativo: GrupoEducativo;
  percentilGeneracion: string;
  onChangeGrades: (grades: { g1: string; g2: string; g3: string; g4: string }) => void;
  onChangeManualNem: (val: string) => void;
  onChangeManualRanking: (val: string) => void;
  onChangeGrupoEducativo: (grupo: GrupoEducativo) => void;
  onChangePercentil: (val: string) => void;
}

function GradeInputs({
  g1,
  g2,
  g3,
  g4,
  manualNem,
  manualRanking,
  grupoEducativo,
  percentilGeneracion,
  onChangeGrades,
  onChangeManualNem,
  onChangeManualRanking,
  onChangeGrupoEducativo,
  onChangePercentil,
}: GradeInputsProps) {
  // Parse inputs to numbers if possible
  const f1 = parseFloat((g1 || '').replace(',', '.'));
  const f2 = parseFloat((g2 || '').replace(',', '.'));
  const f3 = parseFloat((g3 || '').replace(',', '.'));
  const f4 = parseFloat((g4 || '').replace(',', '.'));

  const allGradesEntered = !isNaN(f1) && !isNaN(f2) && !isNaN(f3) && !isNaN(f4) &&
    f1 >= 1.0 && f1 <= 7.0 &&
    f2 >= 1.0 && f2 <= 7.0 &&
    f3 >= 1.0 && f3 <= 7.0 &&
    f4 >= 1.0 && f4 <= 7.0;

  const promedio = allGradesEntered ? (f1 + f2 + f3 + f4) / 4 : null;
  const calculatedNemScore = promedio !== null ? nemFromGrade(promedio, grupoEducativo) : null;

  const percentilNum = parseInt(percentilGeneracion, 10);
  const calculatedRankingScore =
    calculatedNemScore !== null && !isNaN(percentilNum)
      ? rankingFromPercentil(calculatedNemScore, percentilNum, grupoEducativo)
      : null;

  // Keep the manual NEM field in sync with the grades-based calculation.
  // While the 4 grades are complete, the calculated NEM always drives the
  // field (grades take precedence over any manual value).
  useEffect(() => {
    if (allGradesEntered && calculatedNemScore !== null) {
      const asStr = calculatedNemScore.toString();
      if (manualNem !== asStr) {
        onChangeManualNem(asStr);
      }
    }
  }, [allGradesEntered, calculatedNemScore]);

  // Keep the manual Ranking field in sync with the percentil-based estimate.
  useEffect(() => {
    if (calculatedRankingScore !== null) {
      const asStr = calculatedRankingScore.toString();
      if (manualRanking !== asStr) {
        onChangeManualRanking(asStr);
      }
    }
  }, [calculatedRankingScore]);

  const handleGradeChange = (key: 'g1' | 'g2' | 'g3' | 'g4', value: string) => {
    // Sanitize input: allow empty, or float up to 7.0
    if (value === '') {
      onChangeGrades({ g1, g2, g3, g4, [key]: '' });
      return;
    }
    
    // Replace dots with commas to enforce comma styling
    let sanitized = value.replace(/\./g, ',');
    // Allow only digits and a single comma
    sanitized = sanitized.replace(/[^0-9,]/g, '');
    
    // Make sure we only have at most one comma
    const parts = sanitized.split(',');
    if (parts.length > 2) {
      sanitized = parts[0] + ',' + parts.slice(1).join('');
    }

    const num = parseFloat(sanitized.replace(',', '.'));
    if (!isNaN(num) && num > 7.0) {
      onChangeGrades({ g1, g2, g3, g4, [key]: '7,0' });
    } else {
      onChangeGrades({ g1, g2, g3, g4, [key]: sanitized });
    }
  };

  const handleManualNemChange = (val: string) => {
    const sanitized = val.replace(/[^0-9]/g, '');
    const num = parseInt(sanitized, 10);
    if (!isNaN(num) && num > 1000) {
      onChangeManualNem('1000');
    } else {
      onChangeManualNem(sanitized);
    }
  };

  const handleManualRankingChange = (val: string) => {
    const sanitized = val.replace(/[^0-9]/g, '');
    const num = parseInt(sanitized, 10);
    if (!isNaN(num) && num > 1000) {
      onChangeManualRanking('1000');
    } else {
      onChangeManualRanking(sanitized);
    }
  };

  return (
    <Card id="section-notas" className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
          TUS NOTAS DE ENSEÑANZA MEDIA
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">🎓 Notas de Enseñanza Media (NEM)</h3>
      </div>

      {/* Grupo educativo selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
          Grupo Educativo
        </label>
        <div className="flex gap-2 flex-wrap">
          {grupoEducativoOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChangeGrupoEducativo(opt.value)}
              className={`px-3.5 h-9 rounded-full text-xs font-semibold transition-all duration-200 outline-none ${
                grupoEducativo === opt.value
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4-column grade inputs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'g1', label: '1° Medio' },
          { key: 'g2', label: '2° Medio' },
          { key: 'g3', label: '3° Medio' },
          { key: 'g4', label: '4° Medio' },
        ].map((item) => {
          const val = item.key === 'g1' ? g1 : item.key === 'g2' ? g2 : item.key === 'g3' ? g3 : g4;
          return (
            <div key={item.key} className="space-y-1.5">
              <label className="text-xs font-medium text-[#64748B]">{item.label}</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[1-7](,[0-9]*)?"
                placeholder="6,0"
                value={val}
                onChange={(e) => handleGradeChange(item.key as 'g1' | 'g2' | 'g3' | 'g4', e.target.value)}
                className="w-full h-11 px-3 bg-[#F5F7FA] border-0 rounded-xl text-[#0F172A] font-semibold text-center focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition-all duration-200 outline-none placeholder:text-[#94A3B8]"
              />
            </div>
          );
        })}
      </div>

      {/* Result Strip */}
      <div className="bg-[#F8FAFC] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-2 border border-[#F1F5F9]">
        <span className="text-sm text-[#64748B]">Cálculo de NEM automático</span>
        <div className="text-sm font-semibold text-[#0F172A]">
          {promedio !== null && calculatedNemScore !== null ? (
            <>
              Promedio: <span className="font-mono text-[#3B82F6]">{promedio.toFixed(2).replace('.', ',')}</span>
              {' · '}
              NEM: <span className="font-mono text-[#3B82F6] font-bold">{calculatedNemScore} pts</span>
            </>
          ) : (
            <span className="text-[#94A3B8] font-normal">Ingresa los 4 promedios para autocompletar</span>
          )}
        </div>
      </div>

      {/* Ranking approximation */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
          Posición aproximada en tu generación (para estimar el Ranking)
        </label>
        <div className="relative">
          <select
            value={percentilGeneracion}
            onChange={(e) => onChangePercentil(e.target.value)}
            className="w-full h-11 px-4 pr-10 bg-[#F5F7FA] text-[#0F172A] font-semibold rounded-xl appearance-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white outline-none cursor-pointer transition-all duration-200"
          >
            <option value="">-- Selecciona --</option>
            {percentilOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#64748B]">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {calculatedRankingScore !== null && (
          <p className="text-xs text-[#64748B]">
            Ranking estimado: <span className="font-mono font-bold text-[#3B82F6]">{calculatedRankingScore} pts</span>
          </p>
        )}
        <p className="text-[11px] text-amber-700 bg-amber-50/60 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-relaxed">
          ⚠️ Estimación no oficial: DEMRE no publica una tabla pública de Ranking. Usa el campo manual de abajo si conoces tu puntaje real.
        </p>
      </div>

      {/* Manual Overrides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            NEM (puntaje manual)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Ej: 922"
            value={manualNem}
            onChange={(e) => handleManualNemChange(e.target.value)}
            className="w-full h-11 px-4 bg-[#F5F7FA] border-0 rounded-xl text-[#0F172A] font-bold text-left focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition-all duration-200 outline-none placeholder:text-[#94A3B8]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Ranking (puntaje manual)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Ej: 922"
            value={manualRanking}
            onChange={(e) => handleManualRankingChange(e.target.value)}
            className="w-full h-11 px-4 bg-[#F5F7FA] border-0 rounded-xl text-[#0F172A] font-bold text-left focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition-all duration-200 outline-none placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] leading-relaxed">
        * Ranking depende de la curva de tu colegio, no hay tabla pública. Si no sabes, usa el mismo valor que tu NEM.
      </p>
    </Card>
  );
}

export default React.memo(GradeInputs);
