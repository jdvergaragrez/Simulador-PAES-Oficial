import React from 'react';
import Card from './Card';
import { tablasPAES } from '../data';

interface SlidersSectionProps {
  lectora: number;
  m1: number;
  m2: number;
  ciencias: number;
  historia: number;
  cienciasModule: 'biologia' | 'fisica' | 'quimica';
  onChangeScores: (scores: {
    lectora: number;
    m1: number;
    m2: number;
    ciencias: number;
    historia: number;
  }) => void;
  onChangeCienciasModule: (mod: 'biologia' | 'fisica' | 'quimica') => void;
}

export default function SlidersSection({
  lectora,
  m1,
  m2,
  ciencias,
  historia,
  cienciasModule,
  onChangeScores,
  onChangeCienciasModule,
}: SlidersSectionProps) {

  // Conversions using the EXACT lookup tables
  const scoreLectora = tablasPAES.lectora[lectora] ?? 100;
  const scoreM1 = tablasPAES.m1[m1] ?? 100;
  const scoreM2 = tablasPAES.m2[m2] ?? 100;

  const cienciasKey = `ciencias_${cienciasModule}` as 'ciencias_biologia' | 'ciencias_fisica' | 'ciencias_quimica';
  const scoreCiencias = tablasPAES[cienciasKey]?.[ciencias] ?? 100;
  const scoreHistoria = tablasPAES.historia[historia] ?? 100;

  const handleSliderChange = (key: string, val: number) => {
    onChangeScores({
      lectora: key === 'lectora' ? val : lectora,
      m1: key === 'm1' ? val : m1,
      m2: key === 'm2' ? val : m2,
      ciencias: key === 'ciencias' ? val : ciencias,
      historia: key === 'historia' ? val : historia,
    });
  };

  return (
    <Card id="section-puntajes" className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
          TUS PUNTAJES DE PRUEBA
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">Resultados Estimados de Pruebas (PAES)</h3>
      </div>

      <div className="space-y-6">
        {/* Lectora Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#0F172A]">Competencia Lectora</span>
            <span className="text-sm font-bold text-[#2563EB] font-mono tabular-nums">
              {lectora} <span className="text-[#94A3B8] font-normal font-sans text-xs">resp.</span> → {scoreLectora} <span className="text-[#94A3B8] font-normal font-sans text-xs">pts</span>
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={lectora}
              onChange={(e) => handleSliderChange('lectora', parseInt(e.target.value, 10))}
              className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB] h-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* M1 Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#0F172A]">Competencia Matemática 1 (M1)</span>
            <span className="text-sm font-bold text-[#2563EB] font-mono tabular-nums">
              {m1} <span className="text-[#94A3B8] font-normal font-sans text-xs">resp.</span> → {scoreM1} <span className="text-[#94A3B8] font-normal font-sans text-xs">pts</span>
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={m1}
              onChange={(e) => handleSliderChange('m1', parseInt(e.target.value, 10))}
              className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB] h-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* M2 Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#0F172A]">Competencia Matemática 2 (M2)</span>
            <span className="text-sm font-bold text-[#2563EB] font-mono tabular-nums">
              {m2} <span className="text-[#94A3B8] font-normal font-sans text-xs">resp.</span> → {scoreM2} <span className="text-[#94A3B8] font-normal font-sans text-xs">pts</span>
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="49"
              step="1"
              value={m2}
              onChange={(e) => handleSliderChange('m2', parseInt(e.target.value, 10))}
              className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB] h-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Ciencias Slider */}
        <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#F1F5F9]">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#0F172A]">Prueba de Ciencias</span>
            <span className="text-sm font-bold text-[#2563EB] font-mono tabular-nums">
              {ciencias} <span className="text-[#94A3B8] font-normal font-sans text-xs">resp.</span> → {scoreCiencias} <span className="text-[#94A3B8] font-normal font-sans text-xs">pts</span>
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="75"
              step="1"
              value={ciencias}
              onChange={(e) => handleSliderChange('ciencias', parseInt(e.target.value, 10))}
              className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB] h-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          
          {/* Ciencias module chips selection */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">MÓDULO DE CIENCIAS</span>
            <div className="flex gap-2">
              {[
                { id: 'biologia', name: 'Biología' },
                { id: 'fisica', name: 'Física' },
                { id: 'quimica', name: 'Química' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onChangeCienciasModule(m.id as 'biologia' | 'fisica' | 'quimica')}
                  className={`flex-1 h-9 rounded-full text-xs font-semibold transition-all duration-200 outline-none ${
                    cienciasModule === m.id
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Historia Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#0F172A]">Historia y Ciencias Sociales</span>
            <span className="text-sm font-bold text-[#2563EB] font-mono tabular-nums">
              {historia} <span className="text-[#94A3B8] font-normal font-sans text-xs">resp.</span> → {scoreHistoria} <span className="text-[#94A3B8] font-normal font-sans text-xs">pts</span>
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={historia}
              onChange={(e) => handleSliderChange('historia', parseInt(e.target.value, 10))}
              className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB] h-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
