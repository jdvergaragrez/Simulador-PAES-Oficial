import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { NAV_GRUPOS, NAV_ITEMS, NavId } from './navItems';

interface SidebarProps {
  active: NavId;
  onChange: (id: NavId) => void;
  dark: boolean;
  onToggleDark: () => void;
}

function Sidebar({ active, onChange, dark, onToggleDark }: SidebarProps) {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E8ECF1] text-[#475569] flex-col">
      <div className="px-5 pt-6 pb-5">
        <div className="text-lg font-semibold tracking-tight text-[#0F172A]">
          Simulador <span className="text-[#2563EB]">PAES</span>
        </div>
        <div className="text-xs text-[#94A3B8] mt-0.5">por Juan Diego Vergara</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-5">
        {NAV_GRUPOS.map((g) => (
          <div key={g.titulo}>
            <div className="px-3 mb-1.5 text-xs font-medium text-[#94A3B8]">{g.titulo}</div>
            <div className="space-y-0.5">
              {g.items.map((id) => {
                const { label, icon: Icon } = NAV_ITEMS[id];
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    onClick={() => onChange(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium cursor-pointer ${
                      isActive ? 'bg-[#EEF4FF] text-[#2563EB]' : 'hover:bg-[#F2F4F7] hover:text-[#0F172A]'
                    }`}
                  >
                    <Icon size={17} strokeWidth={1.9} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-[#E8ECF1]">
        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium hover:bg-[#F2F4F7] hover:text-[#0F172A] cursor-pointer"
        >
          {dark ? <Sun size={17} strokeWidth={1.9} /> : <Moon size={17} strokeWidth={1.9} />}
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>
      </div>
    </aside>
  );
}

export default React.memo(Sidebar);
