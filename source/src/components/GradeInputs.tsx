import React, { useEffect, useState } from 'react';
import Card from './Card';
import StepHeader from './StepHeader';
import { nemFromGrade, grupoEducativoOptions } from '../data';
import { GrupoEducativo } from '../types';

interface GradeInputsProps {
  g1: string;
  g2: string;
  g3: string;
  g4: string;
  manualNem: string;
  manualRanking: string;
  grupoEducativo: GrupoEducativo;
  onChangeGrades: (grades: { g1: string; g2: string; g3: string; g4: string }) => void;
  onChangeManualNem: (val: string) => void;
  onChangeManualRanking: (val: string) => void;
  onChangeGrupoEducativo: (grupo: GrupoEducativo) => void;
}

function GradeInputs({
  g1,
  g2,
  g3,
  g4,
  manualNem,
  manualRanking,
  grupoEducativo,
  onChangeGrades,
  onChangeManualNem,
  onChangeManualRanking,
  onChangeGrupoEducativo,
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

  const inputCls =
    'w-full h-11 px-3 bg-[#F2F4F7] border border-transparent rounded-xl text-[#0F172A] font-semibold tabular-nums focus:border-[#CBD5E1] focus:bg-white transition-colors outline-none placeholder:text-[#94A3B8] placeholder:font-normal';

  return (
    <Card id="section-notas" className="space-y-5">
      <StepHeader n={2} title="Tus notas y ranking" description="Con tus promedios de 1° a 4° medio calculamos tu NEM." />

      <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Grupo educativo">
        {grupoEducativoOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChangeGrupoEducativo(opt.value)}
            aria-pressed={grupoEducativo === opt.value}
            className={`px-3.5 h-9 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              grupoEducativo === opt.value
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
                : 'bg-[#F2F4F7] border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 4-column grade inputs */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { key: 'g1', label: '1° Medio' },
          { key: 'g2', label: '2° Medio' },
          { key: 'g3', label: '3° Medio' },
          { key: 'g4', label: '4° Medio' },
        ].map((item) => {
          const val = item.key === 'g1' ? g1 : item.key === 'g2' ? g2 : item.key === 'g3' ? g3 : g4;
          return (
            <div key={item.key} className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#64748B]">{item.label}</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[1-7](,[0-9]*)?"
                placeholder="6,0"
                value={val}
                onChange={(e) => handleGradeChange(item.key as 'g1' | 'g2' | 'g3' | 'g4', e.target.value)}
                aria-label={`Promedio ${item.label}`}
                className={`${inputCls} text-center`}
              />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-[11px] font-medium text-[#64748B]">
            <span>Puntaje NEM</span>
            {promedio !== null && <span className="text-[#94A3B8]">prom. {promedio.toFixed(2).replace('.', ',')}</span>}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Ej: 850"
            value={manualNem}
            onChange={(e) => handleManualNemChange(e.target.value)}
            readOnly={allGradesEntered}
            className={`${inputCls} ${allGradesEntered ? 'text-[#2563EB]' : ''}`}
          />
          <p className="text-[11px] text-[#94A3B8] leading-snug">
            {allGradesEntered ? 'Calculado desde tus notas' : 'O escríbelo directo si ya lo sabes'}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">Puntaje Ranking</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Ej: 900"
            value={manualRanking}
            onChange={(e) => handleManualRankingChange(e.target.value)}
            className={inputCls}
          />
          <p className="text-[11px] text-[#94A3B8] leading-snug">Si no lo sabes, usa el mismo valor que tu NEM</p>
        </div>
      </div>
    </Card>
  );
}

export default React.memo(GradeInputs);
