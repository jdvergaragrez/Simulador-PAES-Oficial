import React from 'react';
import Card from './Card';

function TutorIASection() {
  return (
    <Card className="space-y-3 text-center py-8">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-2xl">🤖</div>
      <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">TUTOR IA</div>
      <h3 className="text-lg font-bold text-[#0F172A]">Versión no disponible todavía</h3>
      <p className="text-sm text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
        Próximamente obtendrás asesoramiento personalizado con Inteligencia Artificial.
      </p>
    </Card>
  );
}

export default React.memo(TutorIASection);
