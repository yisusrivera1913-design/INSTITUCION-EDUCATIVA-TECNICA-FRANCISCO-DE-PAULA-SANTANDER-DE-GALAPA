import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Shield, Zap, Globe, Users, CheckCircle2, Search, GraduationCap, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

interface LandingPageProps {
    onStart: (instSlug?: string) => void;
}

interface InstPublica {
    id: string;
    nombre: string;
    slug: string;
    municipio?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allSchools, setAllSchools] = useState<InstPublica[]>([]);
    const [isLoadingSchools, setIsLoadingSchools] = useState(true);

    // Cargar colegios activos desde Supabase
    useEffect(() => {
        const loadSchools = async () => {
            setIsLoadingSchools(true);
            try {
                const data = await authService.getInstituciones();
                setAllSchools((data as any[]).filter(i => i.activo).map(i => ({
                    id: i.id,
                    nombre: i.nombre,
                    slug: i.slug,
                    municipio: i.municipio
                })));
            } catch (e) {
                // Silencioso si falla
            }
            setIsLoadingSchools(false);
        };
        loadSchools();
    }, []);

    const filteredSchools = searchTerm.length > 1
        ? allSchools.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    const handleSelectSchool = (school: InstPublica) => {
        // Redirigir con el slug para que el login cargue la identidad del colegio
        window.history.replaceState(null, '', `${window.location.pathname}?inst=${school.slug}`);
        onStart(school.slug);
    };

    return (
        <div className="min-h-screen bg-[#fcfcfd] font-outfit text-slate-900 selection:bg-blue-100 overflow-x-hidden">
            
            {/* Minimal Header */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-slate-800 uppercase">Sistema<span className="text-blue-600">Clases</span>Ideal</span>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-48 md:pt-56 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-[3px] mb-8 border border-blue-100 animate-fade-in-up">
                        <Zap size={14} fill="currentColor" /> El Futuro de la Educación
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.95] animate-fade-in-up delay-100 uppercase">
                        SISTEMA <br/>
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic">CLASES</span> <br/>
                        IDEAL
                    </h1>
                    
                    <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-12 leading-relaxed animate-fade-in-up delay-200">
                        Automatiza tus secuencias didácticas alineadas con el MEN. Ahorra hasta <span className="text-blue-600 font-bold">10 horas semanales</span> con nuestra IA pedagógica de alto rendimiento.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                        <button 
                            onClick={() => onStart()}
                            className="w-full md:w-auto px-10 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-base uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 group"
                        >
                            Comenzar Ahora <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        {/* Buscador de Colegios — Dinámico desde Supabase */}
                        <div className="relative w-full md:w-[28rem]">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                                {isLoadingSchools ? <Loader2 size={22} className="animate-spin" /> : <Search size={22} />}
                            </div>
                            <input 
                                type="text" 
                                placeholder="Busca tu Institución Educativa..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-200 rounded-[2rem] text-base font-bold shadow-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                            />
                            
                            {/* Search Results Dropdown — Colegios reales */}
                            {filteredSchools.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl border border-slate-100 shadow-2xl p-2 z-40 overflow-hidden animate-fade-in-up">
                                    {filteredSchools.map((school) => (
                                        <button 
                                            key={school.id}
                                            onClick={() => handleSelectSchool(school)}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-2xl flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="bg-blue-50 p-2 rounded-lg text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <GraduationCap size={16} />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-700 block">{school.nombre}</span>
                                                {school.municipio && (
                                                    <span className="text-[10px] text-slate-400 font-medium">{school.municipio}</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Sin resultados */}
                            {searchTerm.length > 1 && filteredSchools.length === 0 && !isLoadingSchools && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl border border-slate-100 shadow-xl p-4 z-40 text-center animate-fade-in-up">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Institución no encontrada</p>
                                    <button onClick={() => onStart()} className="mt-2 text-[11px] font-black text-blue-500 hover:underline">Ingresar de todas formas →</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Stats */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-12 text-center">
                        <div className="space-y-4">
                            <div className="text-4xl font-black text-blue-600">+1.5M</div>
                            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Planeaciones Generadas</p>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">Utilizado por las instituciones más prestigiosas del Caribe Colombiano.</p>
                        </div>
                        <div className="space-y-4 border-x border-slate-100">
                            <div className="text-4xl font-black text-indigo-600">100%</div>
                            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Cumplimiento MEN</p>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">Algoritmos entrenados bajo los últimos protocolos del Ministerio de Educación.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="text-4xl font-black text-blue-600">{allSchools.length > 0 ? `${allSchools.length}+` : '200+'}</div>
                            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Colegios SCI</p>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">Nuestra arquitectura Multi-Tenant garantiza privacidad y personalización total.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Pillars */}
            <section className="py-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="relative">
                            <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-100 blur-[8rem] opacity-50 z-0"></div>
                            <div className="relative z-10 grid grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 mt-12 hover:-translate-y-2 transition-transform">
                                    <div className="bg-orange-500/10 text-orange-600 p-4 rounded-2xl w-fit mb-6">
                                        <Zap size={28} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight leading-none">Velocidad Extrema</h3>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Genera secuencias didácticas completas en menos de 15 segundos.</p>
                                </div>
                                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                                    <div className="bg-blue-500/10 text-blue-600 p-4 rounded-2xl w-fit mb-6">
                                        <Security size={28} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight leading-none">Datos Seguros</h3>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Cumplimos con las políticas de protección de datos más estrictas.</p>
                                </div>
                                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 mt-12 hover:-translate-y-2 transition-transform">
                                    <div className="bg-indigo-500/10 text-indigo-600 p-4 rounded-2xl w-fit mb-6">
                                        <Globe size={28} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight leading-none">SCI Escalable</h3>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Arquitectura diseñada para soportar miles de usuarios concurrentes.</p>
                                </div>
                                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                                    <div className="bg-green-500/10 text-green-600 p-4 rounded-2xl w-fit mb-6">
                                        <Users size={28} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight leading-none">Multi-Colegio</h3>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Gestión independiente y privada para cada institución educativa.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 leading-snug">
                                La Herramienta que todo <br/><span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-xl shadow-sm border border-blue-100/50 inline-block mt-2">Rector y Docente</span> necesita.
                            </h2>
                            <p className="text-slate-500 text-lg leading-relaxed">
                                Hemos unificado la pedagogía clásica con los últimos avances en Modelos de Lenguaje (LLMs) para crear un orquestador capaz de entender los DBA y contextos de cada región.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Cumplimiento automático de protocolos MEN",
                                    "Ajustes de contexto regional y municipal",
                                    "Generación de indicadores por competencias",
                                    "Exportación a PDF con formato institucional"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                                        <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-slate-100 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-xl text-slate-400">
                            <Sparkles size={18} />
                        </div>
                        <span className="text-sm font-black tracking-tighter text-slate-800 uppercase">SistemaClasesIdeal — 2026</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">Términos</a>
                        <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">Privacidad</a>
                        <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">Contacto</a>
                    </div>
                </div>
            </footer>

        </div>
    );
};

// Shield alias
const Security = Shield;
