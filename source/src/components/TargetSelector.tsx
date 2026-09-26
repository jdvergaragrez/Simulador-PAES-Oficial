import React, { useEffect, useMemo } from 'react';
import { GraduationCap, Building2 } from 'lucide-react';
import Card from './Card';
import StepHeader from './StepHeader';
import { displayNombreUniversidad } from '../data';
import { CarrerasPorCategoria } from '../types';
import SearchableSelect from './SearchableSelect';

interface TargetSelectorProps {
  porCategoria: CarrerasPorCategoria;
  categoriaDisplay: Record<string, string>;
  targetCareer: string;
  targetUniIndex: number;
  onChangeCareer: (career: string) => void;
  onChangeUniIndex: (index: number) => void;
}

function TargetSelector({
  porCategoria,
  categoriaDisplay,
  targetCareer,
  targetUniIndex,
  onChangeCareer,
  onChangeUniIndex,
}: TargetSelectorProps) {
  const currentUnis = porCategoria[targetCareer] || [];

  const careerOptions = useMemo(
    () =>
      Object.keys(porCategoria)
        .map((key) => ({ value: key, label: categoriaDisplay[key] || key }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [porCategoria, categoriaDisplay]
  );

  // Universities offering the selected career (only those with a ponderación)
  const uniOptions = useMemo(
    () =>
      currentUnis
        .map((uni, idx) => ({ uni, idx }))
        .filter((x) => x.uni.ponderacion !== null)
        .map((x) => ({
          value: String(x.idx),
          label: displayNombreUniversidad(x.uni),
          sublabel: x.uni.region || undefined,
        })),
    [currentUnis]
  );

  // Auto-correct university selection if it becomes invalid on career change
  useEffect(() => {
    if (uniOptions.length > 0) {
      const isValid = uniOptions.some((o) => o.value === String(targetUniIndex));
      if (!isValid) onChangeUniIndex(parseInt(uniOptions[0].value, 10));
    }
  }, [targetCareer, targetUniIndex, uniOptions]);

  return (
    <Card id="section-objetivo" className="space-y-4">
      <StepHeader n={1} title="¿Dónde quieres postular?" description="Elige la carrera y la universidad que te interesan." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
            <GraduationCap size={14} /> Carrera
          </label>
          <SearchableSelect
            options={careerOptions}
            value={targetCareer}
            onChange={onChangeCareer}
            placeholder="Busca tu carrera..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
            <Building2 size={14} /> Universidad
          </label>
          <SearchableSelect
            options={uniOptions}
            value={String(targetUniIndex)}
            onChange={(v) => onChangeUniIndex(parseInt(v, 10))}
            placeholder="Busca la universidad..."
          />
        </div>
      </div>
    </Card>
  );
}

export default React.memo(TargetSelector);
