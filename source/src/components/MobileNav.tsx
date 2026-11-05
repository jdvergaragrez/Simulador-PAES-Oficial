import React, { useEffect, useState } from 'react';
import { LayoutGrid, Moon, Sun } from 'lucide-react';
import { NAV_GRUPOS, NAV_ITEMS, NAV_MOVIL, NavId } from './navItems';

interface MobileNavProps {
  active: NavId;
  onChange: (id: NavId) => void;
  dark: boolean;
  onToggleDark: () => void;
}

function MobileNav({ active, onChange, dark, onToggleDark }: MobileNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const enMas = !NAV_MOVIL.includes(active);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const elegir = (id: NavId) => {
    onChange(id);
    setSheetOpen(false);
    window.scrollTo({ top: 0 });
  };

  const tab = (isActive: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium cursor-pointer ${
      isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
    }`;

  return (
    <div className="lg:hidden">
      <div
        className={`fixed inset-0 z-40 bg-[#0B1426]/40 transition-opacity duration-300 ${sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSheetOpen(false)}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Todas las funciones"
        aria-hidden={!sheetOpen}
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl border-t border-[#E8ECF1] px-4 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-[#E2E8F0] mb-4" />
        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
          {NAV_GRUPOS.map((g) => (
            <div key={g.titulo}>
              <div className="px-1 mb-2 text-[11px] font-mono font-medium text-[#94A3B8]">{g.titulo}</div>
              <div className="grid grid-cols-3 gap-2">
                {g.items.map((id) => {
                  const { short, icon: Icon } = NAV_ITEMS[id];
                  const isActive = active === id;
                  return (
                    <button
                      key={id}
                      onClick={() => elegir(id)}
                      tabIndex={sheetOpen ? 0 : -1}
                      className={`flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border text-xs font-medium transition-colors active:scale-[0.97] cursor-pointer ${
                        isActive ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' : 'bg-[#F2F4F7] border-transparent text-[#0F172A]'
                      }`}
                    >
                      <Icon size={22} strokeWidth={1.8} className="text-[#2563EB]" />
                      {short}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={onToggleDark}
            tabIndex={sheetOpen ? 0 : -1}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#F2F4F7] text-sm font-medium text-[#0F172A] cursor-pointer"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            {dark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 vidrio border-t border-[#E8ECF1] pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {NAV_MOVIL.map((id) => {
            const { short, icon: Icon } = NAV_ITEMS[id];
            const isActive = active === id && !sheetOpen;
            return (
              <button key={id} onClick={() => elegir(id)} className={tab(isActive)} aria-current={isActive ? 'page' : undefined}>
                <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
                {short}
              </button>
            );
          })}
          <button onClick={() => setSheetOpen((o) => !o)} className={tab(sheetOpen || enMas)} aria-expanded={sheetOpen}>
            <LayoutGrid size={21} strokeWidth={sheetOpen || enMas ? 2.2 : 1.8} />
            Más
          </button>
        </div>
      </nav>
    </div>
  );
}

export default React.memo(MobileNav);
