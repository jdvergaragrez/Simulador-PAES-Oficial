import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { normalizar } from '../data';

export interface SearchOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  maxResults?: number;
}

/**
 * Accessible-ish search combobox: shows the selected label, opens a filtered
 * list on focus, filters as you type (accent-insensitive, multi-token).
 * Reused for both carrera and universidad pickers.
 */
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  emptyText = 'Sin coincidencias',
  maxResults = 50,
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const selectedLabel = selected?.label ?? '';

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const matches = useMemo(() => {
    const q = normalizar(query);
    if (!q) return options.slice(0, maxResults);
    const toks = q.split(/\s+/).filter(Boolean);
    return options
      .filter((o) => {
        const n = normalizar(`${o.label} ${o.sublabel || ''}`);
        return toks.every((t) => n.includes(t));
      })
      .slice(0, maxResults);
  }, [query, options, maxResults]);

  const pick = (v: string) => {
    onChange(v);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <Search size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden />
      <input
        type="text"
        value={open ? query : selectedLabel}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-9 bg-[#F4F3F1] text-[#0F172A] text-sm font-medium rounded-xl border border-transparent focus:border-[#2563EB] focus:bg-white outline-none transition-colors duration-200 placeholder:text-[#94A3B8] placeholder:font-normal truncate"
      />
      <ChevronDown
        size={16}
        strokeWidth={2}
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] transition-transform ${open ? 'rotate-180' : ''}`}
        aria-hidden
      />

      {open && (
        <div className="absolute z-40 left-0 right-0 mt-1.5 bg-white border border-[#E7E5E1] rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.08)] max-h-64 overflow-y-auto py-1">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-xs text-[#94A3B8]">{emptyText}</div>
          ) : (
            matches.map((o) => (
              <button
                key={o.value}
                onClick={() => pick(o.value)}
                className={`w-full text-left px-4 py-2.5 min-h-[40px] text-sm transition-colors cursor-pointer ${
                  o.value === value ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold' : 'text-[#0F172A] hover:bg-[#F4F3F1]'
                }`}
              >
                <div className="truncate">{o.label}</div>
                {o.sublabel && <div className="text-[11px] text-[#94A3B8] truncate">{o.sublabel}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(SearchableSelect);
