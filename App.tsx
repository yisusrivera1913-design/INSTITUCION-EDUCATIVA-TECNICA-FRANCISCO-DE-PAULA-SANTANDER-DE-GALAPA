import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { ApiStats } from './components/ApiStats';
import { SequencePreview } from './components/SequencePreview';
import { UserManagement, PasswordChange } from './components/UserManagement';
import { AdminSequenceViewer } from './components/AdminSequenceViewer';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { DidacticSequence, SequenceInput } from './types';
import { generateDidacticSequence as generateGroq } from './services/groqService';
import { generateDidacticSequence as generateGemini } from './services/geminiService';
import { GraduationCap, Loader2, AlertTriangle, LogOut, User as UserIcon, Shield, LayoutDashboard, Database, Activity, Users, Sparkles, PenTool, Globe } from 'lucide-react';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { authService, User } from './services/authService';

const initialInput: SequenceInput = {
  grado: '',
  area: '',
  asignatura: '',
  tema: '',
  dba: '',
  sesiones: 4,
  num_secuencia: 1,
  ejeCrese: 'Ciudadanía y Convivencia',
  grupos: '',
  fecha: '',
};

// Definir el usuario inicial (SaaS Direct Entry)
const SAAS_ADMIN: User = { 
  name: 'Super Admin', 
  email: 'superadmin@eduplaneacion.com', 
  role: 'super_admin' 
};

function App() {
  // Auth State - Autenticación Real Forzada
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return authService.getCurrentUser();
  });
  // Si hay un hash de OAuth en la URL (#access_token=...), empezamos SÍ en carga
  // para que nunca se muestre la URL al usuario.
  const hasOAuthHash = typeof window !== 'undefined' && window.location.hash.includes('access_token');
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(hasOAuthHash || true);

  // Limpiar la URL inmediatamente si tiene el hash de OAuth (antes de cualquier render)
  if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
    window.history.replaceState(null, '', window.location.origin);
  }

  // App State
  const [input, setInput] = useState<SequenceInput>(initialInput);
  const [sequence, setSequence] = useState<DidacticSequence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Navigation State — Initialized based on current URL hash or user role
  const [currentTab, setCurrentTab] = useState<'planner' | 'history' | 'users' | 'monitor' | 'saas'>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (['planner', 'history', 'users', 'monitor', 'saas'].includes(hash)) return hash as any;
    
    // Default smart routing
    const initialUser = authService.getCurrentUser();
    return (initialUser?.role === 'super_admin' && !initialUser?.institucion_id) ? 'saas' : 'planner';
  });
  const [showProfile, setShowProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [lastGenTime, setLastGenTime] = useState(0);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  const loadingMessages = [
    "Analizando el DBA y contexto...",
    "Diseñando estrategias pedagógicas...",
    "Estructurando momentos de clase...",
    "Creando indicadores de desempeño...",
    "Finalizando planeación..."
  ];

  // Visual Confirmation on Login
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.nombre_institucion) {
          setLoginSuccess(`¡Bienvenido a ${currentUser.nombre_institucion}!`);
      } else {
          setLoginSuccess(`¡Bienvenido, ${currentUser.name}!`);
      }
      const timer = setTimeout(() => setLoginSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser?.email]);

  // 0. Loading cycle
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // 1. Initial Load & Session Refresh
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const inputKey = authService.getUserStorageKey('sci_input_v1');
      const savedInput = localStorage.getItem(inputKey);

      if (savedInput) {
        try { setInput(JSON.parse(savedInput)); } catch (e) { setInput(initialInput); }
      } else {
        setInput(initialInput);
      }

      // Track presence
      const sub = authService.trackPresence(currentUser);

      // PERIODIC REFRESH: Ensures teacher assignments stay in sync & enforces single session
      const refreshInterval = setInterval(async () => {
        const refreshed = await authService.refreshSession();
        if (refreshed) {
          if (JSON.stringify(refreshed) !== JSON.stringify(currentUser)) {
            console.log("♻️ [Session] Datos de usuario actualizados");
            setCurrentUser(refreshed);
          }
        } else if (currentUser.role !== 'super_admin') {
          // Null means session was invalidated (Identity clash) - Ignored for Super Admin
          console.error("🚨 [Security] Sesión invalidada externamente.");
          setIsAuthenticated(false);
          setCurrentUser(null);
          authService.logout();
          alert("Tu sesión ha sido abierta en otro dispositivo. Se cerrará esta sesión por seguridad.");
        }
      }, 10000);

      return () => {
        if (sub) sub.unsubscribe();
        clearInterval(refreshInterval);
      };
    }
  }, [isAuthenticated, currentUser?.email]); // Re-run if email changes or auth state changes

  // 2. Persistencia de entrada
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const inputKey = authService.getUserStorageKey('sci_input_v1');
      localStorage.setItem(inputKey, JSON.stringify(input));
    }
  }, [input, isAuthenticated, currentUser]);

  // --- NAVEGACIÓN NATIVA (Boton Atrás del Navegador) ---
  
  // Registrar historial cuando cambiamos de pantalla
  useEffect(() => {
    if (isAuthenticated && !isAuthChecking) {
      const targetHash = sequence ? '#resultado' : `#${currentTab}`;
      const currentHash = window.location.hash;
      
      if (currentHash !== targetHash) {
        // Ignorar si estamos procesando el redirect original de oauth
        if (!currentHash.includes('access_token')) {
          window.history.pushState({ tab: currentTab, hasSequence: !!sequence }, '', targetHash);
        }
      }
    }
  }, [currentTab, sequence, isAuthenticated, isAuthChecking]);

  // Manejar click en botón "Atrás" o "Adelante" del navegador
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const hash = window.location.hash.replace('#', '');
      
      // Si el usuario le da "Atrás" mientras mira el resultado, lo cerramos
      if (sequence && hash !== 'resultado') {
        setSequence(null);
      }
      
      if (['planner', 'history', 'users', 'monitor', 'saas'].includes(hash)) {
        setCurrentTab(hash as any);
      } else if (!hash) {
        // En la raíz, volver al tab predeterminado
        setCurrentTab((currentUser?.role === 'super_admin' && !currentUser?.institucion_id) ? 'saas' : 'planner');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [sequence, currentUser]);

  // 3. Centralized Auth & Callback Handler
  useEffect(() => {
    const { data: { subscription } } = (authService.supabase ? authService.supabase.auth.onAuthStateChange((event, session) => {
        console.log(`🔐 [Auth Event SCI] ${event}`);
        
        const syncSession = async () => {
            if (event === 'SIGNED_OUT') {
                setIsAuthenticated(false);
                setCurrentUser(null);
                localStorage.removeItem(authService.STORAGE_KEYS.AUTH);
                localStorage.removeItem(authService.STORAGE_KEYS.USER);
                setIsAuthChecking(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (event as any) === 'INITIAL_SESSION') {
                if (session) {
                    try {
                        const user = await authService.handleAuthCallback();
                        if (user) {
                            setIsAuthenticated(true);
                            setCurrentUser(user);
                            // Siempre limpiar el hash/query de OAuth después de procesarlo
                            if (window.location.hash || window.location.search.includes('code=') || window.location.search.includes('error=')) {
                                window.history.replaceState(null, '', window.location.origin);
                            }
                            setCurrentTab(user.role === 'super_admin' ? 'saas' : 'planner');
                        }
                    } catch (e: any) {
                        console.error("Auth Exception:", e);
                        // Mostrar el error de seguridad al usuario (Ej: intento de multi-colegio)
                        alert(e.message || "Error de seguridad durante la autenticación.");
                        authService.logout();
                        setIsAuthenticated(false);
                        setCurrentUser(null);
                        window.history.replaceState(null, '', window.location.origin);
                    }
                } else {
                    // Si no hay sesión pero estamos en carga inicial, revisar persistencia local
                    if (authService.isAuthenticated()) {
                        const user = authService.getCurrentUser();
                        setIsAuthenticated(true);
                        setCurrentUser(user);
                        setCurrentTab((user?.role === 'super_admin' && !user?.institucion_id) ? 'saas' : 'planner');
                        authService.refreshSession().then(updated => {
                          if (updated) setCurrentUser(updated);
                        });
                    }
                }
                setIsAuthChecking(false);
            }
        };

        syncSession();
    }) : { data: { subscription: { unsubscribe: () => {} } } }) as any;

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    
    // Auto-migrate local sequences to cloud on login
    if (user) {
      authService.migrationLocalToCloud().then(res => {
        if (res.success && res.count && res.count > 0) {
          console.log(`✨ [Migración] ${res.count} secuencias sincronizadas con la nube.`);
        }
      });
    }
  };

  const handleLogout = () => {
    if (confirm("¿Cerrar sesión de plataforma?")) {
      authService.logout();
      window.location.href = window.location.origin; 
    }
  };

  const handleEnterInstitucion = (inst: any) => {
    if (!currentUser) return;
    
    const impersonatedUser: User = {
      ...currentUser,
      institucion_id: inst.id,
      nombre_institucion: inst.nombre,
      config_visual: {
        logo_url: inst.config_visual?.logo_url || null,
        color_primario: inst.config_visual?.color_primario || '#1e40af',
        codigo_formato: inst.config_visual?.codigo_formato || 'F-PA-03',
        modelo_pedagogico: inst.config_visual?.modelo_pedagogico || 'ADI'
      }
    };
    
    setCurrentUser(impersonatedUser);
    authService.setCurrentUser(impersonatedUser); // Persistencia correcta
    setCurrentTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log(`📡 [SaaS] Navegando a: ${inst.nombre}`);
  };

  const handleBackToSaaS = () => {
    setCurrentTab('saas');
    setSequence(null);
    setInput(initialInput);
    setCurrentUser(SAAS_ADMIN);
    authService.setCurrentUser(SAAS_ADMIN); // Reset a Admin Global
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log("🔙 [SaaS] Regresando al Panel Principal");
  };

  const handleGenerate = async (refinementConfig?: { instruction: string }) => {
    const now = Date.now();
    if (now - lastGenTime < 8000 && !refinementConfig) {
      setError("Espera unos segundos para la siguiente generación.");
      return;
    }
    setLastGenTime(now);

    setIsLoading(true);
    setError(null);
    try {
      let result: DidacticSequence;

      // Contexto institucional completo para la IA
      const institutionContext = {
        ...input,
        docente_nombre: currentUser?.name,
        nombre_institucion: currentUser?.nombre_institucion,
        institucion_id: currentUser?.institucion_id,
        logo_url: currentUser?.config_visual?.logo_url,
        codigo_formato: currentUser?.config_visual?.codigo_formato,
        modelo_pedagogico: currentUser?.config_visual?.modelo_pedagogico,
      };

      try {
        console.log("[Orquestador] Intentando con Groq...");
        result = await generateGroq(
          institutionContext,
          refinementConfig?.instruction,
          refinementConfig ? (sequence || undefined) : undefined
        );
      } catch (groqErr) {
        console.warn("Groq falló, activando Fallback a Gemini...", groqErr);
        result = await generateGemini(
          institutionContext,
          refinementConfig?.instruction,
          refinementConfig ? (sequence || undefined) : undefined
        );
      }

      setSequence(result);

      if (currentUser) {
        await authService.saveAndLogSequence(currentUser, result, {
          theme: input.tema,
          area: input.area,
          grade: input.grado
        });
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Fallo crítico en ambos motores de IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSequence(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFullReset = () => {
    if (confirm("¿Restablecer toda la configuración?")) {
      setSequence(null);
      setInput(initialInput);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEdit = () => {
    setSequence(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleRestoreSequence = (seqContent: DidacticSequence) => {
    setSequence(seqContent);
    // Sync input form fields with restored sequence
    setInput({
      grado: seqContent.grado,
      area: seqContent.area,
      asignatura: seqContent.asignatura,
      tema: seqContent.tema_principal || '',
      dba: seqContent.dba_utilizado || '',
      sesiones: seqContent.sesiones_detalle?.length || 4,
      num_secuencia: seqContent.num_secuencia || 1,
      ejeCrese: seqContent.eje_transversal_crese || 'Ciudadanía y Convivencia',
      grupos: seqContent.grupos || '',
      fecha: seqContent.fecha || '',
    });
    setCurrentTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Eliminado el check de login para entrada directa SaaS

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-outfit">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative bg-[#111111] p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col items-center text-center max-w-xs w-full">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 rounded-[2rem] text-white shadow-2xl mb-8">
              <Loader2 size={48} className="animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Verificando<br/><span className="text-blue-500">Credenciales</span></h2>
            <div className="mt-6 flex flex-col gap-1 items-center">
               <div className="h-1 w-20 bg-blue-600/30 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/2 animate-[shimmer_2s_infinite]"></div>
               </div>
               <p className="text-slate-500 text-[9px] font-black uppercase tracking-[3px] mt-2 italic">SCI Security Shield</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    // Ruteo Inteligente: Si hay link de colegio, mostrar Login. Sino, Landing Page.
    const params = new URLSearchParams(window.location.search);
    const isInstitutionalLink = params.has('colegio') || params.has('inst');

    // MODO MEMORIA: Si el docente vuelve a la raíz pero se guardó su colegio previamente, auto-redireccionarlo.
    if (!isInstitutionalLink && !showLogin) {
        const lastSchool = localStorage.getItem('sci_last_school_slug');
        if (lastSchool) {
            window.history.replaceState(null, '', `${window.location.pathname}?inst=${lastSchool}`);
            return <Login onLogin={handleLogin} />;
        }
    }

    if (isInstitutionalLink || showLogin) {
      return <Login onLogin={handleLogin} />;
    }
    return (
      <LandingPage
        onStart={(instSlug?: string) => {
          if (instSlug) {
            // El usuario seleccionó un colegio del buscador: set URL y mostrar Login
            window.history.replaceState(null, '', `${window.location.pathname}?inst=${instSlug}`);
          }
          setShowLogin(true);
        }}
      />
    );
  }

  const isDark = currentTab === 'saas';

  return (
    <div className={`min-h-screen font-outfit pb-20 relative transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] text-slate-300 selection:bg-indigo-500/30 selection:text-indigo-200' : 'bg-[#f8fafc] text-slate-900 selection:bg-blue-100 selection:text-blue-900'}`}>

      {/* Header Ejecutivo de Navegación */}
      <header className={`relative z-40 sticky top-0 no-print transition-all duration-300 shadow-sm border-b ${isDark ? 'bg-[#0f0f11]/80 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo y Nombre */}
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => {
            if (currentUser?.role === 'super_admin' && !currentUser?.institucion_id) setCurrentTab('saas');
            else setCurrentTab('planner');
          }}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-sm group-hover:rotate-6 transition-transform w-10 h-10 flex items-center justify-center overflow-hidden">
                {currentUser?.config_visual?.logo_url ? (
                    <img src={currentUser.config_visual.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <Sparkles className="text-white" size={18} />
                )}
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {/* Si hay colegio y no es super_admin viendo el dashboard, mostrar nombre del colegio */}
                {(currentUser?.nombre_institucion && currentUser?.role !== 'super_admin') ? (
                  <>{currentUser.nombre_institucion}</>
                ) : (
                  <>SISTEMA<span className={isDark ? "text-indigo-500" : "text-blue-600"}>CLASES</span> <span className={`text-[10px] px-2 py-0.5 rounded-lg ml-1 font-black ${isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-purple-600 text-white'}`}>IDEAL</span></>
                )}
              </h1>
              <p className={`text-[9px] font-black uppercase tracking-[2px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {currentUser?.role === 'super_admin' && !currentUser?.institucion_id 
                  ? 'Panel de Control Principal' 
                  : (currentUser?.nombre_institucion 
                      ? 'Gestión Académica Institucional' 
                      : 'SistemaClasesIdeal — Gestión Académica')}
              </p>
            </div>
          </div>

          {/* Navegación por Pestañas Maestro/Admin */}
          <nav className={`flex items-center gap-2 p-1.5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
            {(currentUser?.role !== 'super_admin' || currentUser?.institucion_id) && (
              <>
                <button
                  onClick={() => setCurrentTab('planner')}
                  className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${currentTab === 'planner' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <PenTool size={14} /> <span className="hidden md:inline">Planificador Ideal</span>
                </button>
                <button
                  onClick={() => setCurrentTab('history')}
                  className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${currentTab === 'history' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Database size={14} /> <span className="hidden md:inline">Repositorio</span>
                </button>
              </>
            )}

            {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
              <>
                <div className={`h-6 w-px mx-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                {currentUser?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setCurrentTab('users')}
                      className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${currentTab === 'users' ? 'bg-white text-orange-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <Users size={14} /> <span className="hidden md:inline">Docentes</span>
                    </button>
                    <button
                      onClick={() => setCurrentTab('monitor')}
                      className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${currentTab === 'monitor' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <Activity size={14} /> <span className="hidden md:inline">Métricas</span>
                    </button>
                  </>
                )}
                {currentUser?.role === 'super_admin' && (
                  <button
                    onClick={handleBackToSaaS}
                    className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider relative group ${currentTab === 'saas' 
                      ? (isDark ? 'bg-white/10 text-indigo-400 shadow-sm border border-white/5' : 'bg-white text-purple-600 shadow-sm border border-slate-200/50') 
                      : 'bg-purple-600 text-white shadow-[0_10px_25px_-5px_rgba(147,51,234,0.4)] hover:bg-purple-700 animate-pulse-slow'}`}
                  >
                    <div className={`w-2 h-2 rounded-full absolute -top-1 -right-1 ${currentTab === 'saas' ? 'hidden' : 'bg-red-500 shadow-[0_0_10px_red]'}`}></div>
                    <Globe size={14} className={currentTab === 'saas' ? '' : 'animate-spin-slow'} /> 
                    <span className="md:inline">{currentTab === 'saas' ? 'Panel SCI Principal' : '⚠️ Salir al Dashboard SCI'}</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Menú de Usuario */}
          <div className="flex items-center gap-3 pl-2">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${isDark ? 'bg-[#0f0f11] text-slate-400 hover:text-indigo-400 border-white/5' : 'bg-white text-slate-400 hover:text-blue-600 border-slate-200'}`}
            >
              <UserIcon size={18} />
            </button>
            <button
              onClick={handleLogout}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all shadow-sm ${isDark ? 'bg-[#0f0f11] text-slate-400 hover:text-red-400 border-white/5' : 'bg-white border-slate-200 text-slate-400 hover:text-red-500'}`}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Perfil Popover */}
        {showProfile && currentUser && (
          <div className="absolute top-full right-4 mt-2 w-80 bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-fade-in-up z-50">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserIcon size={32} className="text-slate-400" />
              </div>
              <h3 className="font-black text-slate-800">{currentUser.name}</h3>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{currentUser.role}</p>
            </div>
            <PasswordChange email={currentUser.email} />
            <button onClick={() => setShowProfile(false)} className="w-full mt-4 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">
              Cerrar Panel
            </button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* VISTA: PLANIFICADOR (Creación) */}
        {currentTab === 'planner' && (
          <div className="animate-fade-in-up">
            {!sequence ? (
              <div className="space-y-12">
                <div className="max-w-4xl mx-auto text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-[3px] mb-6 shadow-sm border border-blue-100">
                    <Sparkles size={14} /> Motor de Inteligencia Pedagógica
                  </div>

                  {/* Branding dinámico de la institución */}
                  {currentUser?.nombre_institucion && (
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {currentUser.config_visual?.logo_url && (
                        <img 
                          src={currentUser.config_visual.logo_url} 
                          alt="Logo" 
                          className="w-10 h-10 rounded-xl object-contain border border-slate-200 shadow"
                        />
                      )}
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[4px]">
                        {currentUser.nombre_institucion}
                      </span>
                    </div>
                  )}

                  <h2 className="text-5xl md:text-7xl font-black text-slate-800 mb-6 tracking-tighter">
                    Crea tu <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic">Planeación</span>
                  </h2>
                  <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                    Diseña secuencias didácticas de alta calidad alineadas con el MEN. <br />
                    <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">
                      {currentUser?.nombre_institucion || 'SistemaClasesIdeal — Gestión Académica'}
                    </span>
                  </p>
                </div>

                <div className="max-w-5xl mx-auto">
                  <InputForm
                    input={input}
                    setInput={setInput}
                    onGenerate={() => handleGenerate()}
                    isLoading={isLoading}
                    user={currentUser}
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                <div className="mb-10 no-print flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
                  >
                    ← Nueva Consulta
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Secuencia Generada Correctamente</span>
                  </div>
                </div>

                <SequencePreview
                  data={sequence}
                  input={input}
                  onRefine={(instruction) => handleGenerate({ instruction })}
                  onReset={handleReset}
                />
              </div>
            )}
          </div>
        )}

        {/* VISTA: REPOSITORIO (Historial) */}
        {currentTab === 'history' && (
          <div className="animate-fade-in-up">
            <div className="mb-10 flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Repositorio Curricular</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Base de Datos de Planeaciones Institucionales</p>
              </div>
            </div>
            <AdminSequenceViewer 
              userEmail={currentUser?.role !== 'admin' ? currentUser?.email : undefined} 
              onRestore={handleRestoreSequence}
            />
          </div>
        )}

        {/* VISTA: GESTIÓN DE DOCENTES */}
        {currentTab === 'users' && currentUser?.role === 'admin' && (
          <div className="animate-fade-in-up">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-500/20">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión Docente</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Control de Acceso y Perfiles de Usuario</p>
                </div>
              </div>
              <UserManagement />
            </div>
          </div>
        )}

        {/* VISTA: MÉTRICAS DE API */}
        {currentTab === 'monitor' && currentUser?.role === 'admin' && (
          <div className="animate-fade-in-up">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                  <Activity size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Estado del Sistema</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Rendimiento de las LLaves de API y Salud de IA</p>
                </div>
              </div>
              <ApiStats />
            </div>
          </div>
        )}

        {/* VISTA: SUPER ADMIN — SaaS Colegios */}
        {currentTab === 'saas' && currentUser?.role === 'super_admin' && (
          <div className="animate-fade-in-up">
            <SuperAdminPanel onEnterInstitucion={handleEnterInstitucion} />
          </div>
        )}


        {isLoading && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-2xl text-center relative overflow-hidden animate-pulse">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 animate-pulse"></div>
                <div className="relative inline-flex bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 rounded-3xl text-white shadow-2xl">
                  <Loader2 size={40} className="animate-spin" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">IA Generando...</h3>
              <p className="text-blue-600 font-black text-xs uppercase tracking-[3px] h-4 mb-8">{loadingMessages[loadingStep]}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-1000"
                  style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast for Login Success */}
        {loginSuccess && (
          <div className="fixed top-24 right-10 z-[100] animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-5 rounded-[2rem] shadow-2xl shadow-blue-500/30 flex items-center gap-4 border border-white/20 backdrop-blur-md">
              <div className="bg-white/20 p-2 rounded-xl">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[3px] opacity-70">Acceso Exitoso</p>
                <h4 className="text-sm font-black tracking-tight">{loginSuccess}</h4>
              </div>
            </div>
          </div>
        )}

        {/* Branding Footer */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-0 opacity-20 pointer-events-none no-print">
            <p className="text-[8px] font-black uppercase tracking-[5px] text-slate-400">Powered by SCI Platform</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="fixed bottom-10 right-10 max-w-md bg-white border-l-4 border-red-500 p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in-up z-50">
            <div className="bg-red-50 text-red-500 p-2 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-slate-800 font-black text-sm uppercase">Error detectado</h4>
              <p className="text-slate-500 text-xs font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-slate-300 hover:text-slate-500 transition-colors">✕</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
