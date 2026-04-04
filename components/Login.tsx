import React, { useState, useEffect } from 'react';
import { UserCircle, Lock, ArrowRight, ShieldCheck, Mail, Info, Play, School, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginProps {
    onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPasswordHint, setShowPasswordHint] = useState(false);

    // Initial state empty
    useEffect(() => {
        setEmail('');
        setPassword('');
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await performLogin(email, password);
    };

    const performLogin = async (targetEmail: string, targetPass: string) => {
        setIsLoading(true);
        setError(null);

        // Simulation of network delay for feedback
        setTimeout(async () => {
            const user = await authService.login(targetEmail, targetPass);
            if (user) {
                onLogin();
            } else {
                setError("Acceso denegado. Verifica tus credenciales.");
                setIsLoading(false);
            }
        }, 1200);
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const { error } = await authService.loginWithGoogle();
        if (error) {
            setError(error);
            setIsLoading(false);
        }
        // Redirection happens automatically via Supabase
    };

    const handleDemoAdmin = () => {
        performLogin('admin@santander.edu.co', 'admin2026');
    };

    const handleDemoDocente = () => {
        performLogin('docente.demo@santander.edu.co', 'santander2026');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-outfit p-0 sm:p-6 md:p-12 overflow-hidden selection:bg-blue-100">
            {/* Contenedor Principal con Sombra Premium */}
            <div className="w-full max-w-[1100px] h-full min-h-[600px] bg-white sm:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col md:flex-row overflow-hidden relative animate-fade-in-up">

                {/* --- COLUMNA IZQUIERDA: Branding e Ilustración --- */}
                <div className="w-full md:w-1/2 bg-[#f0f7ff] relative p-12 flex flex-col items-center justify-center overflow-hidden">
                    {/* Elementos decorativos de fondo */}
                    <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-blue-100/50 rounded-full blur-3xl"></div>
                    <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-indigo-100/40 rounded-full blur-2xl"></div>

                    <div className="relative z-10 w-full max-w-sm text-center">
                        {/* Logo Central con Efecto de Halo */}
                        <div className="relative mb-8 inline-block group">
                            <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-700"></div>
                            <div className="relative w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2.5rem] p-5 shadow-2xl overflow-hidden flex items-center justify-center transform hover:rotate-3 transition-transform cursor-pointer">
                                <Sparkles className="text-white w-16 h-16" />
                            </div>
                        </div>

                        {/* Texto de Bienvenida */}
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
                                Easy<span className="text-blue-600">Planning</span> AI
                            </h2>
                            <p className="text-slate-500 font-medium max-w-[280px] mx-auto text-sm leading-relaxed">
                                La plataforma inteligente para docentes modernos.
                            </p>
                        </div>

                        {/* Etiquetas Flotantes (Badges) */}
                        <div className="mt-12 flex gap-3 justify-center">
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

                {/* --- COLUMNA DERECHA: Formulario --- */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
                    <div className="max-w-sm mx-auto w-full">
                        <div className="mb-10 text-center md:text-left">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Ingreso de Personal</h1>
                            <p className="text-slate-400 text-sm font-medium">Usa tus credenciales oficiales para entrar.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Campo de Correo */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                    <Mail size={12} className="text-blue-500" /> Correo Institucional
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className="w-full pl-5 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 text-sm"
                                />
                            </div>

                            {/* Campo de Contraseña */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                    <Lock size={12} className="text-blue-500" /> Contraseña
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-5 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 text-sm"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 animate-shake flex items-center gap-3">
                                    <div className="bg-red-600 text-white p-1 rounded-full">
                                        <Lock size={12} />
                                    </div>
                                    {error}
                                </div>
                            )}

                            {/* Google Login Button */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full py-4 bg-white border border-slate-200 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-md active:scale-95"
                            >
                                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                                Continuar con Google
                            </button>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-slate-100"></div>
                                <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">o usa tu cuenta</span>
                                <div className="flex-grow border-t border-slate-100"></div>
                            </div>

                            {/* Botón de Acción */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isLoading
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 active:scale-95'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>Acceder al Panel <ArrowRight size={16} /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 text-center">
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

                        {/* SaaS Platform Footer */}
                        <div className="mt-12 text-center flex flex-col gap-4">
                            <div className="text-[10px] text-slate-200 font-black uppercase tracking-[3px]">
                                © {new Date().getFullYear()} EasyPlanning AI — SaaS Platform
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
