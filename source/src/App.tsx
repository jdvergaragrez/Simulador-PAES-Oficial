import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Analytics } from '@vercel/analytics/react';
import { Info, Share2, Link2, RotateCcw, Database, Check } from 'lucide-react';
import { AppState, CarreraConDetalle } from './types';
import { loadCatalogo, Catalogo } from './data';
import CatalogoCargando from './components/CatalogoCargando';
import { calculatePonderado, encodeState, decodeState, puntajePrueba, PuntajesDirectos, EstadoDecodificado, resolverCarreraLegacy } from './utils';
import { PRUEBAS_ORDEN, PruebaId, ESTADOS, estadoCorte } from './constants';

// Subcomponents
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import { NavId } from './components/navItems';
import TopBar from './components/TopBar';
import Card from './components/Card';
import GradeInputs from './components/GradeInputs';
import SlidersSection, { directoValido } from './components/SlidersSection';
import TargetSelector from './components/TargetSelector';
import HeroCard from './components/HeroCard';
import CompatibilitySection from './components/CompatibilitySection';
import ImproveSection from './components/ImproveSection';
import CompareSection from './components/CompareSection';
import BuscadorSection from './components/BuscadorSection';
import CareerDetailModal from './components/CareerDetailModal';
import EnsayosSection from './components/EnsayosSection';
import SimuladorInversoSection from './components/SimuladorInversoSection';
import TestVocacionalSection from './components/TestVocacionalSection';

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
  modoPuntaje: [],
  puntajesDirectos: {},
  targetCareer: '',
  targetCarreraId: '',
  compareSlots: ['', '', ''],
  favoritos: [],
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavId>('puntaje');
  const [detailCarrera, setDetailCarrera] = useState<CarreraConDetalle | null>(null);
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [catalogoError, setCatalogoError] = useState(false);

  // El catálogo se descarga recién cuando una sección lo necesita ("Mis ensayos" no lo usa).
  const necesitaCatalogo = activeTab !== 'ensayos';
  const cargarCatalogo = useCallback(() => {
    setCatalogoError(false);
    loadCatalogo().then(setCatalogo, () => setCatalogoError(true));
  }, []);
  useEffect(() => {
    if (necesitaCatalogo && !catalogo) cargarCatalogo();
  }, [necesitaCatalogo, catalogo, cargarCatalogo]);

  // Aplica y persiste el tema
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('paes_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  const toggleDark = useCallback(() => setDark((d) => !d), []);

  // Enlace o estado guardado con el formato antiguo (tc + tui): se traduce al id fijo
  // de la carrera en cuanto el catálogo está cargado.
  const legacyUniIndex = useRef<number | null>(null);
  const aplicarEstado = useCallback((decoded: EstadoDecodificado) => {
    const { legacyUniIndex: idx, targetUniIndex: indiceViejo, ...resto } = decoded as EstadoDecodificado & { targetUniIndex?: number };
    const indiceAntiguo = idx ?? (typeof indiceViejo === 'number' && !resto.targetCarreraId ? indiceViejo : undefined);
    if (indiceAntiguo !== undefined) legacyUniIndex.current = indiceAntiguo;
    setState((prev) => ({ ...prev, ...resto }));
  }, []);
  useEffect(() => {
    if (!catalogo || legacyUniIndex.current === null) return;
    const idx = legacyUniIndex.current;
    legacyUniIndex.current = null;
    setState((prev) => ({ ...prev, targetCarreraId: resolverCarreraLegacy(catalogo.porCategoria, prev.targetCareer, idx) }));
  }, [catalogo]);

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
        aplicarEstado(decoded);
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
          aplicarEstado(parsed);
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
  const handleModoChange = useCallback((prueba: PruebaId, puntaje: boolean) => {
    setState((prev) => ({
      ...prev,
      modoPuntaje: puntaje ? [...new Set([...prev.modoPuntaje, prueba])] : prev.modoPuntaje.filter((p) => p !== prueba),
    }));
  }, []);
  const handleDirectoChange = useCallback((prueba: PruebaId, valor: string) => {
    setState((prev) => ({ ...prev, puntajesDirectos: { ...prev.puntajesDirectos, [prueba]: valor } }));
  }, []);
  const handleCareerChange = useCallback((career: string) => setState((prev) => ({ ...prev, targetCareer: career, targetCarreraId: '' })), []);
  const handleToggleFav = useCallback((carreraId: string) => {
    setState((prev) => ({
      ...prev,
      favoritos: prev.favoritos.includes(carreraId) ? prev.favoritos.filter((id) => id !== carreraId) : [...prev.favoritos, carreraId],
    }));
  }, []);
  const handleCarreraIdChange = useCallback((id: string) => setState((prev) => ({ ...prev, targetCarreraId: id })), []);

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

  // Puntajes ingresados directo, solo para las pruebas en modo "Puntaje" y con valor válido.
  const directos = useMemo(() => {
    const out: PuntajesDirectos = {};
    for (const p of state.modoPuntaje) {
      const v = directoValido(state.puntajesDirectos[p]);
      if (v !== null) out[p] = v;
    }
    return out;
  }, [state.modoPuntaje, state.puntajesDirectos]);

  const puntajes = useMemo(() => {
    const out = {} as Record<PruebaId, number>;
    for (const p of PRUEBAS_ORDEN) out[p] = puntajePrueba(p, state.scores[p], state.cienciasModule, directos);
    return out;
  }, [state.scores, state.cienciasModule, directos]);

  const pruebaIngresada = (p: PruebaId) => (state.modoPuntaje.includes(p) ? directos[p] !== undefined : state.scores[p] > 0);

  const isEmpty = finalNemScore === 0 && finalRankingScore === 0 && !PRUEBAS_ORDEN.some(pruebaIngresada);

  // Resolve target category: fall back to the first available if the stored
  // one isn't present in the active catalog (e.g. right after switching years).
  const resolvedCareer = useMemo(() => {
    if (!catalogo) return state.targetCareer;
    return state.targetCareer && catalogo.porCategoria[state.targetCareer]
      ? state.targetCareer
      : (Object.keys(catalogo.porCategoria)[0] || '');
  }, [catalogo, state.targetCareer]);

  // Selected Target University and its weighted score calculation
  const targetUniList = catalogo?.porCategoria[resolvedCareer] ?? [];
  const targetUni = targetUniList.find((c) => c.id === state.targetCarreraId) || null;

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
        targetUni,
        directos
      )
    : null;

  const pesosObjetivo = useMemo(() => {
    const w = targetUni?.ponderacion;
    if (!w) return null;
    return {
      lectora: w.lecturaPct,
      m1: w.m1Pct,
      m2: w.m2Pct,
      ciencias: targetUni.electivaTipo === 'historia' ? 0 : w.cienciasPct,
      historia: targetUni.electivaTipo === 'ciencias' ? 0 : w.historiaPct,
    };
  }, [targetUni]);

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


  // Mini barra de puntaje en pantallas sin columna lateral: visible cuando la tarjeta de resultado sale de vista.
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const check = () => {
      const el = heroRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setHeroVisible(r.bottom > 80 && r.top < window.innerHeight - 120);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [activeTab]);

  const estadoMini = targetUni && targetPonderado !== null ? ESTADOS[estadoCorte(targetPonderado, targetUni.puntajeCorte)] : null;
  const mostrarMini = activeTab === 'puntaje' && !heroVisible && !isEmpty && targetPonderado !== null;

  const perfilProps = {
    nemScore: finalNemScore,
    rankingScore: finalRankingScore,
    lectoraCorrect: state.scores.lectora,
    m1Correct: state.scores.m1,
    m2Correct: state.scores.m2,
    cienciasCorrect: state.scores.ciencias,
    historiaCorrect: state.scores.historia,
    cienciasModule: state.cienciasModule,
    directos,
  };

  return (
    <>
      <Analytics />
      <div className="min-h-dvh bg-[#F4F3F1] font-sans text-[#0F172A] selection:bg-blue-100">
      <Sidebar active={activeTab} onChange={setActiveTab} dark={dark} onToggleDark={toggleDark} />
      <MobileNav active={activeTab} onChange={setActiveTab} dark={dark} onToggleDark={toggleDark} />
      <div className="lg:pl-64">
      <div className="max-w-[1180px] mx-auto px-4 md:px-8 pt-4 md:pt-8 pb-28 lg:pb-16 space-y-6">
        <TopBar />

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-6"
        >
          {activeTab === 'puntaje' && (
            <>
              <div className="pt-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] text-[#0F172A]">
                  Tu puntaje,<br /><span className="text-[#2563EB]">tu próximo paso.</span>
                </h1>
                <p className="text-sm text-[#64748B] mt-3 max-w-lg">
                  Calcula tu ponderado con las ponderaciones oficiales de cada carrera y mira qué tan cerca estás del corte.
                </p>
                <p className="inline-flex items-start gap-1.5 mt-3 text-xs text-[#64748B]">
                  <Info size={14} className="shrink-0 mt-px text-[#94A3B8]" />
                  <span>
                    Ponderaciones oficiales Admisión 2027
                    {catalogo && <> · {catalogo.totalUniversidades} universidades · {catalogo.totalCarreras.toLocaleString('es-CL')} carreras</>}.
                    Los cortes son los de la Admisión 2026, como referencia.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
                <div className="space-y-6 min-w-0">
                  {catalogo ? <TargetSelector
                    porCategoria={catalogo.porCategoria}
                    categoriaDisplay={catalogo.categoriaDisplay}
                    targetCareer={resolvedCareer}
                    targetCarreraId={state.targetCarreraId}
                    onChangeCareer={handleCareerChange}
                    onChangeCarreraId={handleCarreraIdChange}
                  /> : <CatalogoCargando error={catalogoError} onRetry={cargarCatalogo} />}
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
                  <SlidersSection
                    scores={state.scores}
                    cienciasModule={state.cienciasModule}
                    modoPuntaje={state.modoPuntaje}
                    puntajesDirectos={state.puntajesDirectos}
                    pesos={pesosObjetivo}
                    onChangeScores={handleScoresChange}
                    onChangeCienciasModule={handleCienciasModuleChange}
                    onChangeModo={handleModoChange}
                    onChangeDirecto={handleDirectoChange}
                  />
                </div>

                <div ref={heroRef} className="xl:sticky xl:top-6 xl:row-span-2 min-w-0">
                  {catalogo ? <HeroCard
                    score={targetPonderado}
                    targetCareer={resolvedCareer}
                    categoriaDisplay={catalogo.categoriaDisplay}
                    targetUni={targetUni}
                    isEmpty={isEmpty}
                    anioCortes={catalogo.anioCortes}
                    puntajes={puntajes}
                    m2Ingresada={pruebaIngresada('m2')}
                    nemScore={finalNemScore}
                    rankingScore={finalRankingScore}
                  /> : <CatalogoCargando error={catalogoError} onRetry={cargarCatalogo} compact />}
                </div>

                <div className="xl:col-start-1 min-w-0">
                  {catalogo && <ImproveSection
                    state={state}
                    targetCareer={resolvedCareer}
                    categoriaDisplay={catalogo.categoriaDisplay}
                    finalNemScore={finalNemScore}
                    finalRankingScore={finalRankingScore}
                    targetUni={targetUni}
                    currentPonderado={targetPonderado}
                    isEmpty={isEmpty}
                    directos={directos}
                  />}
                </div>
              </div>
            </>
          )}

          {activeTab === 'buscar' && (
            <div className="max-w-[880px]">
              {!catalogo ? <CatalogoCargando error={catalogoError} onRetry={cargarCatalogo} /> : <BuscadorSection
                carreras={catalogo.todas}
                categoriaDisplay={catalogo.categoriaDisplay}
                anioAdmision={catalogo.anio}
                tieneCortes={catalogo.tieneCortes}
                {...perfilProps}
                favoritos={state.favoritos}
                onToggleFav={handleToggleFav}
                onOpenDetail={setDetailCarrera}
              />}
            </div>
          )}

          {activeTab === 'comparar' && (
            <div className="max-w-[880px] space-y-6">
              {!catalogo ? <CatalogoCargando error={catalogoError} onRetry={cargarCatalogo} /> : <>
              <CompatibilitySection
                porCategoria={catalogo.porCategoria}
                categoriaDisplay={catalogo.categoriaDisplay}
                anioAdmision={catalogo.anio}
                {...perfilProps}
                favoritos={state.favoritos}
                onToggleFav={handleToggleFav}
                onOpenDetail={setDetailCarrera}
              />
              <CompareSection
                porCategoria={catalogo.porCategoria}
                categoriaDisplay={catalogo.categoriaDisplay}
                {...perfilProps}
                compareSlots={state.compareSlots}
                onChangeCompareSlot={handleCompareSlotChange}
                onOpenDetail={setDetailCarrera}
              />
              </>}
            </div>
          )}

          {activeTab === 'ensayos' && (
            <div className="max-w-[880px]">
              <EnsayosSection />
            </div>
          )}

          {activeTab === 'inverso' && (
            <div className="max-w-[880px]">
              {!catalogo ? <CatalogoCargando error={catalogoError} onRetry={cargarCatalogo} /> : <SimuladorInversoSection
                porCategoria={catalogo.porCategoria}
                categoriaDisplay={catalogo.categoriaDisplay}
                anioAdmision={catalogo.anio}
                {...perfilProps}
              />}
            </div>
          )}

          {activeTab === 'vocacional' && (
            <div className="max-w-[880px]">
              {!catalogo ? <CatalogoCargando error={catalogoError} onRetry={cargarCatalogo} /> : <TestVocacionalSection carreras={catalogo.todas} onOpenDetail={setDetailCarrera} />}
            </div>
          )}

          {activeTab === 'compartir' && (
            <div className="max-w-[880px] space-y-6">
              <Card id="section-guardar" className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Share2 size={18} className="text-[#64748B]" />
                    <h3 className="text-base font-semibold text-[#0F172A]">Guardar y compartir</h3>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1.5">
                    Tus datos se guardan solos en este dispositivo. Con el link puedes abrirlos en otro o compartirlos.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleShareLink}
                    className="flex-1 h-12 inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-full transition-colors active:scale-[0.99] cursor-pointer"
                  >
                    <Link2 size={17} /> Copiar link con mis datos
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 h-12 inline-flex items-center justify-center gap-2 bg-[#F4F3F1] text-[#64748B] hover:text-[#0F172A] text-sm font-semibold rounded-full transition-colors cursor-pointer"
                  >
                    <RotateCcw size={16} /> Empezar de cero
                  </button>
                </div>
              </Card>

              <Card id="section-datos" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-[#64748B]" />
                  <h3 className="text-base font-semibold text-[#0F172A]">De dónde salen los datos</h3>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#F4F3F1] p-3">
                    <dt className="text-[11px] text-[#64748B]">Ponderaciones, vacantes y mínimos</dt>
                    <dd className="text-sm font-semibold text-[#0F172A] mt-0.5">Oferta Definitiva DEMRE, Admisión 2027</dd>
                  </div>
                  <div className="rounded-xl bg-[#F4F3F1] p-3">
                    <dt className="text-[11px] text-[#64748B]">Cobertura</dt>
                    <dd className="text-sm font-semibold text-[#0F172A] mt-0.5 tabular-nums">
                      {catalogo ? `${catalogo.totalUniversidades} universidades · ${catalogo.totalCarreras.toLocaleString('es-CL')} carreras` : 'Cargando…'}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#F4F3F1] p-3">
                    <dt className="text-[11px] text-[#64748B]">Puntajes de corte</dt>
                    <dd className="text-sm font-semibold text-[#0F172A] mt-0.5">Admisión 2026, datos DEMRE</dd>
                  </div>
                </dl>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Los cortes de la Admisión 2027 se conocerán cuando termine el proceso, en enero; mientras tanto se muestran los del año anterior como referencia.
                  Tablas de conversión del proceso Admisión 2027 (PAES rendida en 2026), con Ciencias separada en sus 3 módulos y M2 con tope de 49 correctas.
                </p>
              </Card>
            </div>
          )}
        </motion.div>

        <footer className="pt-4 pb-2 text-center space-y-1">
          <p className="text-[11px] text-[#94A3B8] leading-relaxed max-w-lg mx-auto">
            Herramienta orientativa e <strong className="font-semibold text-[#64748B]">independiente del DEMRE</strong> y de las universidades.
            Los puntajes de corte son referenciales y el Ranking es una <strong className="font-semibold text-[#64748B]">aproximación</strong>, no un valor oficial.
            Verifica siempre en las fuentes oficiales antes de postular.
          </p>
          <p className="text-[10px] text-[#94A3B8]">Hecho por Juan Diego Vergara · simuladorpaes.vercel.app</p>
        </footer>

      </div>
      </div>

      {mostrarMini && estadoMini && (
        <button
          onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="xl:hidden fixed left-1/2 -translate-x-1/2 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6 z-30 flex items-center gap-3 pl-4 pr-3 h-11 rounded-full bg-[#0F172A] text-white shadow-lg cursor-pointer"
          aria-label="Ver mi resultado"
        >
          <span className="text-[11px] text-white/60">Ponderado</span>
          <span className="text-base font-bold tabular-nums">
            {targetPonderado!.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: estadoMini.tint, color: estadoMini.ink }}>
            {estadoMini.label}
          </span>
        </button>
      )}

      {detailCarrera && catalogo && (
        <CareerDetailModal
          carrera={detailCarrera}
          categoriaDisplay={catalogo.categoriaDisplay}
          {...perfilProps}
          isFav={state.favoritos.includes(detailCarrera.id)}
          onToggleFav={() => handleToggleFav(detailCarrera.id)}
          onClose={() => setDetailCarrera(null)}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 animate-fade-in flex items-center gap-1.5">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
    </>
  );
}
