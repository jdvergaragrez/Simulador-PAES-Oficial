import React from 'react';
import { LoaderCircle, WifiOff, RotateCcw } from 'lucide-react';
import Card from './Card';

interface CatalogoCargandoProps {
  error: boolean;
  onRetry: () => void;
  compact?: boolean;
}

function CatalogoCargando({ error, onRetry, compact = false }: CatalogoCargandoProps) {
  if (error) {
    return (
      <Card className="flex flex-col items-center text-center gap-3 py-8">
        <WifiOff size={22} className="text-[#94A3B8]" />
        <p className="text-sm text-[#64748B] max-w-xs">No pudimos cargar el catálogo de carreras. Revisa tu conexión e intenta de nuevo.</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#2563EB] text-white text-sm font-semibold cursor-pointer"
        >
          <RotateCcw size={15} /> Reintentar
        </button>
      </Card>
    );
  }

  return (
    <Card className={`space-y-3 ${compact ? '' : 'py-6'}`} aria-busy="true">
      <div className="flex items-center gap-2 text-sm text-[#64748B]" role="status">
        <LoaderCircle size={16} className="animate-spin text-[#2563EB]" />
        Cargando el catálogo de carreras…
      </div>
      <div className="space-y-2 animate-pulse" aria-hidden>
        <div className="h-10 rounded-xl bg-[#F4F3F1]" />
        {!compact && <div className="h-10 rounded-xl bg-[#F4F3F1] w-2/3" />}
      </div>
    </Card>
  );
}

export default React.memo(CatalogoCargando);
