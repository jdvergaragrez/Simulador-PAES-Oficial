import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { AppState, CarreraConDetalle } from './types';
import { getCatalogo, aniosAdmisionDisponibles } from './data';
import { calculatePonderado, encodeState, decodeState } from './utils';

// Subcomponents
import Header from './components/Header';
import Card from './components/Card';
import GradeInputs from './components/GradeInputs';
import SlidersSection from './components/SlidersSection';
import TargetSelector from './components/TargetSelector';
import HeroCard from './components/HeroCard';
import CompatibilitySection from './components/CompatibilitySection';
import ImproveSection from './components/ImproveSection';
import CompareSection from './components/CompareSection';
import BuscadorSection from './components/BuscadorSection';
import CareerDetailModal from './components/CareerDetailModal';
import CountdownBanner from './components/CountdownBanner';
import EnsayosSection from './components/EnsayosSection';
import SimuladorInversoSection from './components/SimuladorInversoSection';
import TestVocacionalSection from './components/TestVocacionalSection';
import TutorIASection from './components/TutorIASection';

const INITIAL_STATE: AppState = {
  grades: {
    g1: '',
    g2: '',
    g3: '',
    g4: '',
  },
  manualNem: '',
  manualRanking: '',
  grupoEducativo: 'CH_DIURNO',
  percentilGeneracion: '',
  scores: {
    lectora: 0,
    m1: 0,
    m2: 0,
    ciencias: 0,
    historia: 0,
  },
  cienciasModule: 'fisica',
  anioAdmision: 2026,
  targetCareer: '',
  targetUniIndex: 0,
  compareSlots: ['', '', ''],
  favoritos: [],
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'puntaje' | 'buscar' | 'comparar' | 'ensayos' | 'extras' | 'compartir'>('puntaje');
  const [detailCarrera, setDetailCarrera] = useState<CarreraConDetalle | null>(null);
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  // Aplica y persiste el tema
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('paes_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  const toggleDark = useCallback(() => setDark((d) => !d), []);

  // Load initial state from URL query or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dParam = params.get('d');

    if (dParam) {
      const decoded = decodeState(dParam);
      if (decoded) {
        if (decoded.grades) {
          decoded.grades = {
            g1: (decoded.grades.g1 || '').replace(/\./g, ','),
            g2: (decoded.grades.g2 || '').replace(/\./g, ','),
            g3: (decoded.grades.g3 || '').replace(/\./g, ','),
            g4: (decoded.grades.g4 || '').replace(/\./g, ','),
          };
        }
        setState((prev) => ({
          ...prev,
          ...decoded,
        }));
        // Clean up the URL query param for aesthetics but keep loaded state
        window.history.replaceState({}, document.title, window.location.pathname);
        showToast('Datos cargados desde el enlace compartido');
        return;
      }
    }

    // Fallback to localStorage
    const cached = localStorage.getItem('simulador_paes_state_v1');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) {
          if (parsed.grades) {
            parsed.grades = {
              g1: (parsed.grades.g1 || '').replace(/\./g, ','),
              g2: (parsed.grades.g2 || '').replace(/\./g, ','),
              g3: (parsed.grades.g3 || '').replace(/\./g, ','),
              g4: (parsed.grades.g4 || '').replace(/\./g, ','),
            };
          }
          setState((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch (e) {
        console.error('Error parsing cached state', e);
      }
    }
  }, []);

  // Sync state to localStorage, debounced (evita escribir en cada tecla/slider)
  useEffect(() => {
    if (state === INITIAL_STATE) return;
    const t = setTimeout(() => {
      try { localStorage.setItem('simulador_paes_state_v1', JSON.stringify(state)); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [state]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1800);
  }, []);

  // State modification helpers (estables vía useCallback para no re-renderizar hijos memoizados)
  const handleGradesChange = useCallback((grades: { g1: string; g2: string; g3: string; g4: string }) => {
    setState((prev) => ({ ...prev, grades }));
  }, []);
  const handleManualNemChange = useCallback((val: string) => setState((prev) => ({ ...prev, manualNem: val })), []);
  const handleManualRankingChange = useCallback((val: string) => setState((prev) => ({ ...prev, manualRanking: val })), []);
  const handleGrupoEducativoChange = useCallback((grupo: AppState['grupoEducativo']) => setState((prev) => ({ ...prev, grupoEducativo: grupo })), []);
  const handleScoresChange = useCallback((scores: { lectora: number; m1: number; m2: number; ciencias: number; historia: number }) => {
    setState((prev) => ({ ...prev, scores }));
  }, []);
  const handleCienciasModuleChange = useCallback((mod: 'biologia' | 'fisica' | 'quimica') => setState((prev) => ({ ...prev, cienciasModule: mod })), []);
  const handleCareerChange = useCallback((career: string) => setState((prev) => ({ ...prev, targetCareer: career, targetUniIndex: 0 })), []);
  const handleToggleFav = useCallback((carreraId: string) => {
    setState((prev) => ({
      ...prev,
      favoritos: prev.favoritos.includes(carreraId) ? prev.favoritos.filter((id) => id !== carreraId) : [...prev.favoritos, carreraId],
    }));
  }, []);
  const handleAnioChange = useCallback((anio: number) => {
    setState((prev) => ({ ...prev, anioAdmision: anio, targetCareer: '', targetUniIndex: 0, compareSlots: ['', '', ''] }));
  }, []);
  const handleUniIndexChange = useCallback((index: number) => setState((prev) => ({ ...prev, targetUniIndex: index })), []);

  const handleCompareSlotChange = useCallback((slotIndex: number, value: string) => {
    setState((prev) => {
      const updated = [...prev.compareSlots];
      updated[slotIndex] = value;
      return { ...prev, compareSlots: updated };
    });
  }, []);

  // Core calculations derived variables
  const finalNemScore = parseFloat(state.manualNem) || 0;
  const finalRankingScore = parseFloat(state.manualRanking) || 0;

  const totalSliders =
    state.scores.lectora +
    state.scores.m1 +
    state.scores.m2 +
    state.scores.ciencias +
    state.scores.historia;

  const isEmpty = finalNemScore === 0 && finalRankingScore === 0 && totalSliders === 0;

  // Active admission-year catalog (estable: getCatalogo devuelve objeto memoizado)
  const catalogo = useMemo(() => getCatalogo(state.anioAdmision), [state.anioAdmision]);
  // Resolve target category: fall back to the first available if the stored
  // one isn't present in the active catalog (e.g. right after switching years).
  const resolvedCareer = useMemo(
    () => (state.targetCareer && catalogo.porCategoria[state.targetCareer])
      ? state.targetCareer
      : (Object.keys(catalogo.porCategoria)[0] || ''),
    [catalogo, state.targetCareer]
  );

  // Selected Target University and its weighted score calculation
  const targetUniList = catalogo.porCategoria[resolvedCareer] || [];
  const targetUni = targetUniList[state.targetUniIndex] || null;

  const targetPonderado = targetUni
    ? calculatePonderado(
        finalNemScore,
        finalRankingScore,
        state.scores.lectora,
        state.scores.m1,
        state.scores.m2,
        state.scores.ciencias,
        state.scores.historia,
        state.cienciasModule,
        targetUni
      )
    : null;

  // Action handlers
  const handleShareLink = useCallback(() => {
    const encoded = encodeState(state);
    const shareUrl = `${window.location.origin}${window.location.pathname}?d=${encoded}`;
    navigator.clipboard.writeText(shareUrl).then(() => showToast('Link copiado'));
  }, [state, showToast]);

  const handleReset = useCallback(() => {
    localStorage.removeItem('simulador_paes_state_v1');
    window.location.href = `${window.location.origin}${window.location.pathname}`;
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#0F172A] selection:bg-blue-100 pb-16">
      {/* Centered container: max-width is beautifully optimized for desktop and mobile */}
      <div className="max-w-[720px] mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-6">
        
        {/* Header Title with Custom styling */}
        <Header dark={dark} onToggleDark={toggleDark} />

        {/* Admission-year (database) selector — both bases coexist */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
              Año de admisión
            </span>
          </div>
          <div className="bg-[#F5F7FA] p-1 rounded-xl flex gap-1 flex-1">
            {aniosAdmisionDisponibles.map((anio) => {
              const cat = getCatalogo(anio);
              const active = state.anioAdmision === anio;
              return (
                <button
                  key={anio}
                  onClick={() => handleAnioChange(anio)}
                  className={`flex-1 h-10 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex flex-col items-center justify-center leading-tight ${
                    active ? 'bg-white text-[#0F172A] shadow-[0_2px_8px_rgba(15,23,42,0.08)] border border-slate-100' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span>Admisión {anio}</span>
                  <span className="text-[9px] font-medium text-[#94A3B8]">
                    {cat.totalUniversidades} U · {cat.totalCarreras} carreras
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[#94A3B8] sm:max-w-[180px] leading-snug">
            {catalogo.fuente}
            {!catalogo.tieneCortes && ' · sin puntaje de corte publicado'}
          </p>
        </div>

        {/* Sticky Tab Bar (scrollable on mobile) */}
        <div className="sticky top-0 z-40 bg-[#F8F9FA]/90 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-transparent">
          <div className="bg-white p-1 rounded-2xl flex relative border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.02)] overflow-x-auto scrollbar-none">
            {([
              ['puntaje', 'Mi puntaje', '🎯'],
              ['buscar', 'Buscar', '🔍'],
              ['comparar', 'Comparar', '⚖️'],
              ['ensayos', 'Ensayos', '📚'],
              ['extras', 'Extras', '🛠️'],
              ['compartir', 'Compartir', '🔗'],
            ] as const).map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 min-w-[78px] h-11 text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer relative z-10 whitespace-nowrap px-2 ${
                  activeTab === id ? 'text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
                style={{ minHeight: '44px' }}
              >
                {activeTab === id && (
                  <motion.div
                    layoutId="active-tab-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-slate-100"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-20 text-[13px]" aria-hidden>{icon}</span>
                <span className="relative z-20">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-6"
        >
          {activeTab === 'puntaje' && (
            <>
              {/* Section 1: Tus notas (NEM y Ranking) */}
              <GradeInputs
                g1={state.grades.g1}
                g2={state.grades.g2}
                g3={state.grades.g3}
                g4={state.grades.g4}
                manualNem={state.manualNem}
                manualRanking={state.manualRanking}
                grupoEducativo={state.grupoEducativo}
                onChangeGrades={handleGradesChange}
                onChangeManualNem={handleManualNemChange}
                onChangeManualRanking={handleManualRankingChange}
                onChangeGrupoEducativo={handleGrupoEducativoChange}
              />

              {/* Section 2: Tus puntajes de prueba */}
              <SlidersSection
                lectora={state.scores.lectora}
                m1={state.scores.m1}
                m2={state.scores.m2}
                ciencias={state.scores.ciencias}
                historia={state.scores.historia}
                cienciasModule={state.cienciasModule}
                onChangeScores={handleScoresChange}
                onChangeCienciasModule={handleCienciasModuleChange}
              />

              {/* Section 3: Tu objetivo (Appears ABOVE the hero) */}
              <TargetSelector
                porCategoria={catalogo.porCategoria}
                categoriaDisplay={catalogo.categoriaDisplay}
                targetCareer={resolvedCareer}
                targetUniIndex={state.targetUniIndex}
                onChangeCareer={handleCareerChange}
                onChangeUniIndex={handleUniIndexChange}
              />

              {/* HERO CARD: Displays calculated score, gap, and info */}
              <HeroCard
                score={targetPonderado}
                targetCareer={resolvedCareer}
                categoriaDisplay={catalogo.categoriaDisplay}
                targetUni={targetUni}
                isEmpty={isEmpty}
              />

              {/* Section 5: Qué te conviene mejorar */}
              <ImproveSection
                state={state}
                targetCareer={resolvedCareer}
                categoriaDisplay={catalogo.categoriaDisplay}
                finalNemScore={finalNemScore}
                finalRankingScore={finalRankingScore}
                targetUni={targetUni}
                currentPonderado={targetPonderado}
                isEmpty={isEmpty}
              />
            </>
          )}

          {activeTab === 'buscar' && (
            <>
              <BuscadorSection
                carreras={catalogo.todas}
                categoriaDisplay={catalogo.categoriaDisplay}
                anioAdmision={catalogo.anio}
                tieneCortes={catalogo.tieneCortes}
                nemScore={finalNemScore}
                rankingScore={finalRankingScore}
                lectoraCorrect={state.scores.lectora}
                m1Correct={state.scores.m1}
                m2Correct={state.scores.m2}
                cienciasCorrect={state.scores.ciencias}
                historiaCorrect={state.scores.historia}
                cienciasModule={state.cienciasModule}
                favoritos={state.favoritos}
                onToggleFav={handleToggleFav}
                onOpenDetail={setDetailCarrera}
              />
            </>
          )}

          {activeTab === 'comparar' && (
            <>
              {/* Comparador por universidad: busca una carrera y compara todas las universidades que la dictan */}
              <CompatibilitySection
                porCategoria={catalogo.porCategoria}
                categoriaDisplay={catalogo.categoriaDisplay}
                anioAdmision={catalogo.anio}
                nemScore={finalNemScore}
                rankingScore={finalRankingScore}
                lectoraCorrect={state.scores.lectora}
                m1Correct={state.scores.m1}
                m2Correct={state.scores.m2}
                cienciasCorrect={state.scores.ciencias}
                historiaCorrect={state.scores.historia}
                cienciasModule={state.cienciasModule}
                favoritos={state.favoritos}
                onToggleFav={handleToggleFav}
                onOpenDetail={setDetailCarrera}
              />

              {/* Modo Versus: comparar combinaciones lado a lado */}
              <CompareSection
                porCategoria={catalogo.porCategoria}
                categoriaDisplay={catalogo.categoriaDisplay}
                nemScore={finalNemScore}
                rankingScore={finalRankingScore}
                lectoraCorrect={state.scores.lectora}
                m1Correct={state.scores.m1}
                m2Correct={state.scores.m2}
                cienciasCorrect={state.scores.ciencias}
                historiaCorrect={state.scores.historia}
                cienciasModule={state.cienciasModule}
                compareSlots={state.compareSlots}
                onChangeCompareSlot={handleCompareSlotChange}
                onOpenDetail={setDetailCarrera}
              />
            </>
          )}

          {activeTab === 'ensayos' && (
            <EnsayosSection />
          )}

          {activeTab === 'extras' && (
            <div className="space-y-6">
              <CountdownBanner />
              <SimuladorInversoSection
                porCategoria={catalogo.porCategoria}
                categoriaDisplay={catalogo.categoriaDisplay}
                anioAdmision={catalogo.anio}
                nemScore={finalNemScore}
                rankingScore={finalRankingScore}
                lectoraCorrect={state.scores.lectora}
                m1Correct={state.scores.m1}
                m2Correct={state.scores.m2}
                cienciasCorrect={state.scores.ciencias}
                historiaCorrect={state.scores.historia}
                cienciasModule={state.cienciasModule}
              />
              <TestVocacionalSection carreras={catalogo.todas} onOpenDetail={setDetailCarrera} />
              <TutorIASection />
            </div>
          )}

          {activeTab === 'compartir' && (
            <>
              {/* Section 7: Guardar y compartir */}
              <Card id="section-guardar" className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  GUARDAR Y COMPARTIR
                </div>
                <p className="text-xs text-[#64748B]">
                  Guarda tu progreso de forma segura. Puedes generar un link único con tus puntajes y configuraciones para compartirlo o abrirlo en otros dispositivos.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleShareLink}
                    className="flex-1 h-12 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer"
                  >
                    Copiar link con mis datos
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 h-12 bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    Empezar de cero
                  </button>
                </div>
              </Card>

              {/* Section 8: Estado de la data */}
              <Card id="section-estado-data" className="!bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
                    ESTADO DE LA DATA
                  </div>
                  <h4 className="text-xs font-bold text-[#64748B]">Metodología y Veracidad</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#64748B]">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 text-sm mt-[-2px]">●</span>
                    <span>
                      <strong className="font-semibold text-[#0F172A]">Verificada:</strong> confirmada en fuente oficial de la universidad.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-sm mt-[-2px]">●</span>
                    <span>
                      <strong className="font-semibold text-[#0F172A]">Referencia:</strong> reportada por búsqueda pero sin verificación cruzada directa.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 text-sm mt-[-2px]">●</span>
                    <span>
                      <strong className="font-semibold text-[#0F172A]">Incompleta:</strong> falta algún dato (usualmente ponderaciones bloqueadas por JS).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 text-sm mt-[-2px]">●</span>
                    <span>
                      <strong className="font-semibold text-[#0F172A]">No disponible:</strong> no publicado oficialmente.
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#94A3B8] leading-relaxed border-t border-slate-200/60 pt-3 space-y-2">
                  <p>
                    Tablas de conversión: proceso Admisión 2027 (PAES a rendir 2026). Ciencias separada en 3 módulos. M2 tope 49 correctas por pregunta anulada este proceso.
                  </p>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-amber-800 flex gap-2">
                    <span className="text-sm shrink-0">⚠️</span>
                    <span>
                      <strong className="font-bold">UANDES ponderaciones:</strong> el pie del sitio oficial dice "Admisión 2025" aunque el encabezado dice 2026 — posible desactualización del sitio oficial.
                    </span>
                  </div>
                </div>
              </Card>
            </>
          )}
        </motion.div>

        {/* Disclaimer legal (transversal) */}
        <footer className="pt-4 pb-2 text-center space-y-1">
          <p className="text-[11px] text-[#94A3B8] leading-relaxed max-w-lg mx-auto">
            ⚖️ Herramienta orientativa e <strong className="font-semibold text-[#64748B]">independiente del DEMRE</strong> y de las universidades.
            Los puntajes de corte son referenciales y el Ranking es una <strong className="font-semibold text-[#64748B]">aproximación por percentil</strong>, no un valor oficial.
            Verifica siempre en las fuentes oficiales antes de postular.
          </p>
          <p className="text-[10px] text-[#CBD5E1]">Hecho por Juan Diego Vergara · simuladorpaes.vercel.app</p>
        </footer>

      </div>

      {/* Career detail modal (opened from any card) */}
      {detailCarrera && (
        <CareerDetailModal
          carrera={detailCarrera}
          categoriaDisplay={catalogo.categoriaDisplay}
          nemScore={finalNemScore}
          rankingScore={finalRankingScore}
          lectoraCorrect={state.scores.lectora}
          m1Correct={state.scores.m1}
          m2Correct={state.scores.m2}
          cienciasCorrect={state.scores.ciencias}
          historiaCorrect={state.scores.historia}
          cienciasModule={state.cienciasModule}
          isFav={state.favoritos.includes(detailCarrera.id)}
          onToggleFav={() => handleToggleFav(detailCarrera.id)}
          onClose={() => setDetailCarrera(null)}
        />
      )}

      {/* Floating Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 animate-fade-in flex items-center gap-1.5 border border-slate-800">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
