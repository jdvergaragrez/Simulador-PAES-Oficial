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
  targetCarreraId: string;
  onChangeCareer: (career: string) => void;
  onChangeCarreraId: (id: string) => void;
}

function TargetSelector({
  porCategoria,
  categoriaDisplay,
  targetCareer,
  targetCarreraId,
  onChangeCareer,
  onChangeCarreraId,
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
        .filter((uni) => uni.ponderacion !== null)
        .map((uni) => ({
          value: uni.id,
          label: displayNombreUniversidad(uni),
          sublabel: uni.region || undefined,
        })),
    [currentUnis]
  );

  // Auto-correct university selection if it becomes invalid on career change
  useEffect(() => {
    if (uniOptions.length > 0) {
      const isValid = uniOptions.some((o) => o.value === targetCarreraId);
      if (!isValid) onChangeCarreraId(uniOptions[0].value);
    }
  }, [targetCareer, targetCarreraId, uniOptions]);

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
            value={targetCarreraId}
            onChange={onChangeCarreraId}
            placeholder="Busca la universidad..."
          />
        </div>
      </div>
    </Card>
  );
}

export default React.memo(TargetSelector);
