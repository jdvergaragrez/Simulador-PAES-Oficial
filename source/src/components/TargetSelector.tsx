import React, { useEffect } from 'react';
import Card from './Card';
import { universidades, careerDisplayNames } from '../data';
import { CareerKey } from '../types';

interface TargetSelectorProps {
  targetCareer: CareerKey;
  targetUniIndex: number;
  onChangeCareer: (career: CareerKey) => void;
  onChangeUniIndex: (index: number) => void;
}

export default function TargetSelector({
  targetCareer,
  targetUniIndex,
  onChangeCareer,
  onChangeUniIndex,
}: TargetSelectorProps) {
  const currentUnis = universidades[targetCareer] || [];

  // Filter universities that have non-null weights
  const validUnisWithOriginalIndex = currentUnis
    .map((uni, idx) => ({ uni, originalIndex: idx }))
    .filter((item) => item.uni.weights !== null);

  // Auto-correct university selection if it becomes invalid on career change
  useEffect(() => {
    if (validUnisWithOriginalIndex.length > 0) {
      // Check if current targetUniIndex is still in the valid list
      const isValid = validUnisWithOriginalIndex.some(
        (item) => item.originalIndex === targetUniIndex
      );
      if (!isValid) {
        onChangeUniIndex(validUnisWithOriginalIndex[0].originalIndex);
      }
    }
  }, [targetCareer, targetUniIndex, validUnisWithOriginalIndex]);

  return (
    <Card id="section-objetivo" className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
          TU OBJETIVO
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">Elige tu Meta Universitaria</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Career dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Carrera de Interés
          </label>
          <div className="relative">
            <select
              value={targetCareer}
              onChange={(e) => onChangeCareer(e.target.value as CareerKey)}
              className="w-full h-11 px-4 pr-10 bg-[#F5F7FA] text-[#0F172A] font-semibold rounded-xl appearance-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none cursor-pointer transition-all duration-200"
            >
              {Object.entries(careerDisplayNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#64748B]">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* University dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Universidad de Destino
          </label>
          <div className="relative">
            <select
              value={targetUniIndex}
              onChange={(e) => onChangeUniIndex(parseInt(e.target.value, 10))}
              className="w-full h-11 px-4 pr-10 bg-[#F5F7FA] text-[#0F172A] font-semibold rounded-xl appearance-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none cursor-pointer transition-all duration-200"
            >
              {validUnisWithOriginalIndex.map((item) => (
                <option key={item.originalIndex} value={item.originalIndex}>
                  {item.uni.nombre}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#64748B]">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
