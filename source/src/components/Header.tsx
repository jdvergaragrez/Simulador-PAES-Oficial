import React from 'react';

export default function Header() {
  return (
    <header className="text-center md:text-left mb-6 py-4">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A]">
        Simulador <span className="text-[#2563EB]">PAES</span>
      </h1>
      <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mt-1">
        Hecha por Juan Diego Vergara
      </div>
      <p className="text-sm text-[#64748B] mt-2 max-w-xl">
        Calcula tu puntaje ponderado y compáralo con los cortes reales de cada universidad.
      </p>
    </header>
  );
}
