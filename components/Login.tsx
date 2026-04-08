import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, School, Sparkles, KeyRound, CheckCircle2, ArrowRight, Loader2, XCircle, Lock, Mail, Info, Search } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginProps {
    onLogin: () => void;
}

type Step = 'codigo' | 'google' | 'manual';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [step, setStep] = useState<Step>('codigo');
    const [codigoInput, setCodigoInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Manual login fallback
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPasswordHint, setShowPasswordHint] = useState(false);

    // Buscador de Colegios (Si no hay inst en URL)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [branding, setBranding] = useState<{
        title: string;
        subtitle: string;
        institucionId: string | null;
        logo_url: string | null;
    }>({
        title: 'Centro de Acceso',
        subtitle: 'Usa el enlace institucional de tu colegio.',
        institucionId: null,
        logo_url: null
    });

    useEffect(() => {
        const fetchBranding = async () => {
            setIsInitialLoading(true);
            const params = new URLSearchParams(window.location.search);
            let instParam = params.get('inst') || params.get('colegio') || '';

            // Si no hay en URL, buscar en memoria local
            if (!instParam) {
                instParam = localStorage.getItem('sci_last_school_slug') || '';
            }

            if (instParam) {
                // Sincronizar URL y localStorage
                localStorage.setItem('sci_last_school_slug', instParam);
                if (!params.get('inst')) {
                    window.history.replaceState(null, '', `?inst=${instParam}`);
                }

                const inst = await authService.getPublicInstitucion(instParam);
                if (inst) {
                    setBranding({
                        title: inst.nombre,
                        subtitle: 'Ingresa el código de acceso para continuar.',
                        institucionId: inst.id,
                        logo_url: inst.config_visual?.logo_url || null
                    });
                } else {
                    setBranding(prev => ({
                        ...prev,
                        subtitle: 'Institución no válida o inactiva.'
                    }));
                }
            }
            setIsInitialLoading(false);
        };
        fetchBranding();
    }, []);

    // Lógica de búsqueda dinámica
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                const results = await authService.searchInstituciones(searchQuery);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const selectInstitution = (inst: any) => {
        setBranding({
            title: inst.nombre,
            subtitle: 'Ingresa el código de acceso para continuar.',
            institucionId: inst.id,
            logo_url: inst.config_visual?.logo_url || null
        });
        localStorage.setItem('sci_last_school_slug', inst.slug);
        window.history.replaceState(null, '', `?inst=${inst.slug}`);
        setSearchQuery('');
        setSearchResults([]);
        setError(null);
    };

    const resetSelection = () => {
        setBranding({
            title: 'Centro de Acceso',
            subtitle: 'Busca tu institución para continuar.',
            institucionId: null,
            logo_url: null
        });
        localStorage.removeItem('sci_last_school_slug');
        window.history.replaceState(null, '', window.location.pathname);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleVerificarCodigo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branding.institucionId) {
            setError('No se detectó institución. Usa el enlace de tu colegio.');
            return;
        }
        if (!codigoInput.trim()) {
            setError('Ingresa el código de acceso.');
            return;
        }

        setIsVerifying(true);
        setError(null);

        const result = await authService.verifyCodigoAcceso(branding.institucionId, codigoInput);

        if (result.valid) {
            // Guardar el institucion_id para que el callback de Google lo use
            localStorage.setItem('sci_pending_inst_id', branding.institucionId);
            setStep('google');
        } else {
            setError(result.message || 'Código incorrecto.');
        }

        setIsVerifying(false);
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        const { error: oauthError } = await authService.loginWithGoogle(branding.institucionId || undefined);
        if (oauthError) {
            setError(oauthError);
            setIsLoading(false);
        }
        // La redirección ocurre automáticamente vía Supabase
    };

    const handleManualLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setTimeout(async () => {
            const user = await authService.login(email, password);
            if (user) {
                onLogin();
            } else {
                setError('Acceso denegado. Verifica tus credenciales.');
                setIsLoading(false);
            }
        }, 1200);
    };

    const handleGoBack = () => {
        if (step === 'google') {
            setStep('codigo');
            setCodigoInput('');
            setError(null);
            localStorage.removeItem('sci_pending_inst_id');
        } else if (step === 'manual') {
            setStep('google');
            setError(null);
        } else {
            localStorage.removeItem('sci_last_school_slug');
            window.location.href = '/';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-outfit p-0 sm:p-6 md:p-12 overflow-hidden selection:bg-blue-100">
            <div className="w-full max-w-[1100px] min-h-[600px] bg-white sm:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col md:flex-row overflow-hidden relative animate-fade-in-up">

                {/* COLUMNA IZQUIERDA: Branding */}
                <div className="w-full md:w-1/2 bg-[#f0f7ff] relative p-12 flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-blue-100/50 rounded-full blur-3xl" />
                    <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-indigo-100/40 rounded-full blur-2xl" />

                    <div className="relative z-10 w-full max-w-sm text-center">
                        <div className="relative mb-8 inline-block group">
                            <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-700" />
                            <div className="relative w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2.5rem] p-5 shadow-2xl overflow-hidden flex items-center justify-center transform hover:rotate-3 transition-transform cursor-pointer">
                                {branding.logo_url ? (
                                    <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Sparkles className="text-white w-16 h-16" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-tight uppercase">
                                SISTEMA<span className="text-blue-600">CLASES</span> IDEAL
                            </h2>
                            <p className="text-slate-500 font-medium max-w-[280px] mx-auto text-sm leading-relaxed">
                                Excelencia Pedagógica Digital.
                            </p>
                        </div>

                        {/* Indicador de pasos */}
                        <div className="mt-12 flex items-center justify-center gap-3">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow-sm border transition-all duration-500 ${step === 'codigo' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                                <KeyRound size={14} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Código</span>
                            </div>
                            <div className={`h-px w-6 transition-all duration-500 ${step === 'google' || step === 'manual' ? 'bg-blue-400' : 'bg-slate-200'}`} />
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow-sm border transition-all duration-500 ${step === 'google' || step === 'manual' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                                <ShieldCheck size={14} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Acceso</span>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 justify-center">
                            <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 animate-float">
                                <ShieldCheck size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Acceso Seguro</span>
                            </div>
                            <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 animate-float [animation-delay:1s]">
                                <School size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Plan Premium</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Formulario dinámico */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
                    <button
                        onClick={handleGoBack}
                        className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-all"
                        title="Volver"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="max-w-sm mx-auto w-full">

                        {/* ====== PASO 1: CÓDIGO DEL COLEGIO ====== */}
                        {step === 'codigo' && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl text-blue-600 text-[10px] font-black uppercase tracking-[2px] mb-4 border border-blue-100">
                                        <KeyRound size={12} /> Paso 1 de 2
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">
                                        {branding.title}
                                    </h1>
                                    <p className="text-slate-400 text-sm font-medium">{branding.subtitle}</p>
                                </div>

                                {isInitialLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4 animate-pulse">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                                            <Loader2 size={32} className="text-blue-600 animate-spin" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verificando institución...</p>
                                    </div>
                                ) : !branding.institucionId ? (
                                    // NO HAY INSTITUCIÓN (O ERROR DE CARGA)
                                    <div className="space-y-6">
                                        {branding.subtitle.includes('no válida') ? (
                                            // PANTALLA DE ERROR: ENLACE INVÁLIDO
                                            <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center space-y-5 animate-fade-in">
                                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                                    <XCircle size={32} />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-black text-red-900 uppercase">Enlace Inválido</h3>
                                                    <p className="text-xs text-red-700 font-medium leading-relaxed">
                                                        No pudimos encontrar el colegio asociado a este enlace. Verifica con tu administrador o busca manualmente.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={resetSelection}
                                                    className="w-full py-4 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Search size={14} /> Usar Buscador General
                                                </button>
                                            </div>
                                        ) : (
                                            // BUSCADOR DE COLEGIOS (ESTADO LIMPIO)
                                            <div className="space-y-6 animate-fade-in-up">
                                                <div className="bg-blue-600/5 border border-blue-600/10 rounded-2xl p-6 text-center space-y-4">
                                                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/20">
                                                        <School size={28} />
                                                    </div>
                                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-relaxed">
                                                        Busca tu Institución
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        Escribe el nombre de tu colegio para empezar.
                                                    </p>
                                                </div>

                                                <div className="relative group/search">
                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-600 transition-colors">
                                                        <Search size={18} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Ej: Francisco de Paula..."
                                                        className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-[22px] focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                                                    />
                                                    {isSearching && (
                                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                                            <Loader2 size={16} className="animate-spin text-blue-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Resultados de Búsqueda */}
                                                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {searchResults.length > 0 ? (
                                                        searchResults.map((inst) => (
                                                            <button
                                                                key={inst.id}
                                                                onClick={() => selectInstitution(inst)}
                                                                className="w-full flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all text-left animate-fade-in group"
                                                            >
                                                                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100">
                                                                    {inst.config_visual?.logo_url ? (
                                                                        <img src={inst.config_visual.logo_url} alt="" className="w-full h-full object-contain" />
                                                                    ) : (
                                                                        <Sparkles size={14} className="text-slate-300 group-hover:text-blue-400" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1 group-hover:text-blue-600 truncate">
                                                                        {inst.nombre}
                                                                    </p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">
                                                                        Acceso con Clave / Google
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))
                                                    ) : searchQuery.length >= 2 && !isSearching && (
                                                        <div className="text-center py-8">
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No se encontraron resultados</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Formulario de código (Cuando ya hay institución)
                                    <form onSubmit={handleVerificarCodigo} className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                                    <KeyRound size={12} className="text-blue-500" /> Código de Acceso
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={resetSelection}
                                                    className="text-[9px] font-bold text-blue-500 hover:underline uppercase tracking-widest"
                                                >
                                                    Cambiar Colegio
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={codigoInput}
                                                onChange={(e) => { setCodigoInput(e.target.value); setError(null); }}
                                                placeholder="Ej: galapa2026"
                                                autoComplete="off"
                                                className="w-full pl-5 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 text-lg tracking-widest text-center"
                                            />
                                            <p className="text-[10px] text-slate-300 font-bold text-center mt-2">
                                                Tu administrador te proporcionó este código
                                            </p>
                                        </div>

                                        {error && (
                                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 animate-shake flex items-center gap-3">
                                                <XCircle size={14} />
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isVerifying || !codigoInput.trim()}
                                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                        >
                                            {isVerifying ? (
                                                <><Loader2 size={16} className="animate-spin" /> Verificando...</>
                                            ) : (
                                                <>Verificar Código <ArrowRight size={16} /></>
                                            )}
                                        </button>
                                    </form>
                                )}

                                {/* Opción para administradores */}
                                <div className="pt-4 border-t border-slate-50 text-center">
                                    <button
                                        onClick={() => setStep('manual')}
                                        className="text-[10px] font-black text-slate-300 hover:text-blue-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <Lock size={12} /> Soy administrador — acceso con contraseña
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ====== PASO 2: GOOGLE ====== */}
                        {step === 'google' && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl text-emerald-600 text-[10px] font-black uppercase tracking-[2px] mb-4 border border-emerald-100">
                                        <CheckCircle2 size={12} /> Código Verificado ✓
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">
                                        ¡Código Correcto!
                                    </h1>
                                    <p className="text-slate-400 text-sm font-medium">
                                        Ahora inicia sesión con tu cuenta de Google personal para entrar a <strong>{branding.title}</strong>.
                                    </p>
                                </div>

                                {/* Checkmark animado de éxito */}
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={40} className="text-emerald-500" />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 animate-shake flex items-center gap-3">
                                        <XCircle size={14} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] text-white hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 shadow-sm active:scale-95 group disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <><Loader2 size={18} className="animate-spin" /> Conectando con Google...</>
                                    ) : (
                                        <>
                                            <div className="bg-white p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                                                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                                            </div>
                                            Continuar con Google
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                    Si no tienes cuenta de Google, puedes crearla gratis en google.com
                                </p>
                            </div>
                        )}

                        {/* ====== MANUAL: Admin con email/contraseña ====== */}
                        {step === 'manual' && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-4 border border-slate-200">
                                        <Lock size={12} /> Acceso Administrativo
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">
                                        {branding.title}
                                    </h1>
                                    <p className="text-slate-400 text-sm font-medium">Acceso exclusivo para administradores.</p>
                                </div>

                                <form onSubmit={handleManualLogin} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                            <Mail size={12} className="text-slate-400" /> Correo
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="correo@ejemplo.com"
                                            className="w-full pl-5 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                            <Lock size={12} className="text-slate-400" /> Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-5 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 text-sm"
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 animate-shake flex items-center gap-3">
                                            <Lock size={12} />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isLoading ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-black active:scale-95'}`}
                                    >
                                        {isLoading ? <><Loader2 size={14} className="animate-spin" /> Cargando...</> : 'Acceso Manual'}
                                    </button>
                                </form>

                                <div className="text-center">
                                    <button
                                        onClick={() => setShowPasswordHint(!showPasswordHint)}
                                        className="text-[10px] font-black text-slate-300 hover:text-blue-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <Info size={14} /> ¿Problemas de acceso?
                                    </button>
                                    {showPasswordHint && (
                                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl animate-fade-in-up">
                                            <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase tracking-widest">
                                                Consulta con el administrador de tu institución.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-12 text-center flex flex-col gap-4">
                            <div className="text-[10px] text-slate-200 font-black uppercase tracking-[3px]">
                                © {new Date().getFullYear()} SistemaClasesIdeal — Gestión Académica
                            </div>
                            <div className="flex gap-4 justify-center text-[9px] font-black uppercase tracking-widest text-slate-300">
                                <a href="#" className="hover:text-blue-500 transition-colors">Privacidad</a>
                                <span className="text-slate-100 opacity-20">|</span>
                                <a href="#" className="hover:text-indigo-500 transition-colors">Términos</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
