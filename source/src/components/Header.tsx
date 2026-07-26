import React from 'react';

interface HeaderProps {
  dark: boolean;
  onToggleDark: () => void;
}

function Header({ dark, onToggleDark }: HeaderProps) {
  return (
    <header className="mb-6 py-4 flex items-start justify-between gap-3">
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A]">
          Simulador <span className="text-[#3B82F6]">PAES</span>
        </h1>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mt-1">
          Hecha por Juan Diego Vergara
        </div>
        <p className="text-sm text-[#64748B] mt-2 max-w-xl">
          Calcula tu puntaje ponderado y compáralo con los cortes reales de cada universidad.
        </p>
      </div>
      <button
        onClick={onToggleDark}
        aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={dark ? 'Modo claro' : 'Modo oscuro'}
        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg bg-white border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.05)] hover:shadow-md transition-all active:scale-95"
      >
        {dark ? '☀️' : '🌙'}
      </button>
    </header>
  );
}

export default React.memo(Header);
