import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, CareerKey } from './types';
import { universidades } from './data';
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

const INITIAL_STATE: AppState = {
  grades: {
    g1: '',
    g2: '',
    g3: '',
    g4: '',
  },
  manualNem: '',
  manualRanking: '',
  scores: {
    lectora: 0,
    m1: 0,
    m2: 0,
    ciencias: 0,
    historia: 0,
  },
  cienciasModule: 'fisica',
  targetCareer: 'civil',
  targetUniIndex: 0,
  compareSlots: ['', '', ''],
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'puntaje' | 'comparar' | 'compartir'>('puntaje');

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

  // Sync state to localStorage on every change
  useEffect(() => {
    if (state !== INITIAL_STATE) {
      localStorage.setItem('simulador_paes_state_v1', JSON.stringify(state));
    }
  }, [state]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  };

  // State modification helpers
  const handleGradesChange = (grades: { g1: string; g2: string; g3: string; g4: string }) => {
    setState((prev) => ({ ...prev, grades }));
  };

  const handleManualNemChange = (val: string) => {
    setState((prev) => ({ ...prev, manualNem: val }));
  };

  const handleManualRankingChange = (val: string) => {
    setState((prev) => ({ ...prev, manualRanking: val }));
  };

  const handleScoresChange = (scores: {
    lectora: number;
    m1: number;
    m2: number;
    ciencias: number;
    historia: number;
  }) => {
    setState((prev) => ({ ...prev, scores }));
  };

  const handleCienciasModuleChange = (mod: 'biologia' | 'fisica' | 'quimica') => {
    setState((prev) => ({ ...prev, cienciasModule: mod }));
  };

  const handleCareerChange = (career: CareerKey) => {
    setState((prev) => ({ ...prev, targetCareer: career }));
  };

  const handleUniIndexChange = (index: number) => {
    setState((prev) => ({ ...prev, targetUniIndex: index }));
  };

  const handleCompareSlotChange = (slotIndex: number, value: string) => {
    setState((prev) => {
      const updated = [...prev.compareSlots];
      updated[slotIndex] = value;
      return { ...prev, compareSlots: updated };
    });
  };

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

  // Selected Target University and its weighted score calculation
  const targetUniList = universidades[state.targetCareer] || [];
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
  const handleShareLink = () => {
    const encoded = encodeState(state);
    const shareUrl = `${window.location.origin}${window.location.pathname}?d=${encoded}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Link copiado');
    });
  };

  const handleReset = () => {
    localStorage.removeItem('simulador_paes_state_v1');
    window.location.href = `${window.location.origin}${window.location.pathname}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans text-[#0F172A] selection:bg-blue-100 pb-16">
      {/* Centered container: max-width is beautifully optimized for desktop and mobile */}
      <div className="max-w-[720px] mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-6">
        
        {/* Header Title with Custom styling */}
        <Header />

        {/* Sticky Tab Bar */}
        <div className="sticky top-0 z-40 bg-[#F5F7FA]/90 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-transparent">
          <div className="bg-white p-1 rounded-2xl flex w-full relative border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
            <button
              onClick={() => setActiveTab('puntaje')}
              className={`flex-1 h-11 text-sm font-semibold rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative z-10 ${
                activeTab === 'puntaje' ? 'text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              style={{ minHeight: '44px' }}
            >
              {activeTab === 'puntaje' && (
                <motion.div
                  layoutId="active-tab-pill"
                  className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-slate-100"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-20">Mi puntaje</span>
            </button>
            <button
              onClick={() => setActiveTab('comparar')}
              className={`flex-1 h-11 text-sm font-semibold rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative z-10 ${
                activeTab === 'comparar' ? 'text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              style={{ minHeight: '44px' }}
            >
              {activeTab === 'comparar' && (
                <motion.div
                  layoutId="active-tab-pill"
                  className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-slate-100"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-20">Comparar</span>
            </button>
            <button
              onClick={() => setActiveTab('compartir')}
              className={`flex-1 h-11 text-sm font-semibold rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative z-10 ${
                activeTab === 'compartir' ? 'text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              style={{ minHeight: '44px' }}
            >
              {activeTab === 'compartir' && (
                <motion.div
                  layoutId="active-tab-pill"
                  className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-slate-100"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-20">Compartir</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'puntaje' && (
            <motion.div
              key="tab-puntaje"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Section 1: Tus notas (NEM y Ranking) */}
              <GradeInputs
                g1={state.grades.g1}
                g2={state.grades.g2}
                g3={state.grades.g3}
                g4={state.grades.g4}
                manualNem={state.manualNem}
                manualRanking={state.manualRanking}
                onChangeGrades={handleGradesChange}
                onChangeManualNem={handleManualNemChange}
                onChangeManualRanking={handleManualRankingChange}
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
                targetCareer={state.targetCareer}
                targetUniIndex={state.targetUniIndex}
                onChangeCareer={handleCareerChange}
                onChangeUniIndex={handleUniIndexChange}
              />

              {/* HERO CARD: Displays calculated score, gap, and info */}
              <HeroCard
                score={targetPonderado}
                targetCareer={state.targetCareer}
                targetUni={targetUni}
                isEmpty={isEmpty}
              />

              {/* Section 5: Qué te conviene mejorar */}
              <ImproveSection
                state={state}
                finalNemScore={finalNemScore}
                finalRankingScore={finalRankingScore}
                targetUni={targetUni}
                currentPonderado={targetPonderado}
                isEmpty={isEmpty}
              />
            </motion.div>
          )}

          {activeTab === 'comparar' && (
            <motion.div
              key="tab-comparar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Section 4: Compatibilidad por universidad */}
              <CompatibilitySection
                nemScore={finalNemScore}
                rankingScore={finalRankingScore}
                lectoraCorrect={state.scores.lectora}
                m1Correct={state.scores.m1}
                m2Correct={state.scores.m2}
                cienciasCorrect={state.scores.ciencias}
                historiaCorrect={state.scores.historia}
                cienciasModule={state.cienciasModule}
              />

              {/* Section 6: Comparar combinaciones lado a lado */}
              <CompareSection
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
              />
            </motion.div>
          )}

          {activeTab === 'compartir' && (
            <motion.div
              key="tab-compartir"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
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
                    className="flex-1 h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer"
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
            </motion.div>
          )}
        </AnimatePresence>

      </div>

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
