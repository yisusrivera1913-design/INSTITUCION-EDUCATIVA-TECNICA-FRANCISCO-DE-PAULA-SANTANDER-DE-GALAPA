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
            <section className="pt-32 md:pt-40 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-[3px] mb-8 border border-blue-100 animate-fade-in-up">
                        <Zap size={14} fill="currentColor" /> El Futuro de la Educación
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.85] md:leading-[0.85] animate-fade-in-up delay-100 uppercase flex flex-col items-center">
                        <span>SISTEMA</span>
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic -mt-2 md:-mt-4">CLASES</span>
                        <span className="-mt-2 md:-mt-4">IDEAL</span>
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

            {/* Pricing Section - Executive Tech Design */}
            <section id="pricing" className="py-32 bg-[#fcfcfd] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-blue-50/50 blur-[10rem] -z-10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-[3px] mb-6 border border-blue-100">
                            <Sparkles size={14} fill="currentColor" /> Planes Flexibles
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mb-6 uppercase">
                            INVIERTE EN TU <span className="text-blue-600">TIEMPO</span>
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
                            Cada docente inicia con <span className="text-blue-600 font-bold">1 Crédito GRATIS</span> para validar la potencia de nuestra IA. 
                            Sin suscripciones forzadas, paga solo por lo que usas.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-center">
                        
                        {/* Plan Semanal */}
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-[1.02] transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ideal para Emergencias</div>
                                <h3 className="text-2xl font-black text-slate-800 mb-6 uppercase">Semanal</h3>
                                <div className="flex items-end gap-1 mb-8">
                                    <span className="text-5xl font-black text-slate-900">$15k</span>
                                    <span className="text-slate-400 font-bold mb-1">/ Semanales</span>
                                </div>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                        <div className="bg-blue-100 text-blue-600 p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        10 Planeaciones IA
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                        <div className="bg-blue-100 text-blue-600 p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        Alineación MEN Total
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                        <div className="bg-blue-100 text-blue-600 p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        Soporte Prioritario
                                    </li>
                                </ul>
                                <button onClick={() => onStart()} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                                    Adquirir Ahora
                                </button>
                            </div>
                        </div>

                        {/* Plan Mensual - Destacado */}
                        <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl scale-105 border-4 border-blue-600 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest">Recomendado</div>
                            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600 blur-[8rem] opacity-20 -z-0"></div>
                            
                            <div className="relative z-10">
                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Consistencia Pedagógica</div>
                                <h3 className="text-3xl font-black text-white mb-6 uppercase">Mensual</h3>
                                <div className="flex items-end gap-1 mb-8 text-white">
                                    <span className="text-6xl font-black">$40k</span>
                                    <span className="text-slate-400 font-bold mb-2">/ Mensual</span>
                                </div>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-slate-200 font-bold text-sm">
                                        <div className="bg-blue-600 text-white p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        30 Planeaciones IA
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-200 font-bold text-sm">
                                        <div className="bg-blue-600 text-white p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        Historial Ilimitado
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-200 font-bold text-sm">
                                        <div className="bg-blue-600 text-white p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        Exportación Premium PDF
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-200 font-bold text-sm">
                                        <div className="bg-blue-600 text-white p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        Ahorro del 15%
                                    </li>
                                </ul>
                                <button onClick={() => onStart()} className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/40 group-hover:scale-105 transition-transform">
                                    Plan Business →
                                </button>
                            </div>
                        </div>

                        {/* Plan Anual - Executive */}
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-[1.02] transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Nivel Institucional</div>
                                <h3 className="text-2xl font-black text-slate-800 mb-6 uppercase">Plus Anual</h3>
                                <div className="flex items-end gap-1 mb-8">
                                    <span className="text-5xl font-black text-slate-900">$65k</span>
                                    <span className="text-slate-400 font-bold mb-1">/ Anual</span>
                                </div>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                        <div className="bg-indigo-100 text-indigo-600 p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        <span className="text-indigo-600 font-black">Planeaciones Ilimitadas</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                        <div className="bg-indigo-100 text-indigo-600 p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        Acceso a Nuevas Funciones
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                        <div className="bg-indigo-100 text-indigo-600 p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                        Soporte 24/7 VIP
                                    </li>
                                </ul>
                                <button onClick={() => onStart()} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20">
                                    Desbloquear Todo
                                </button>
                            </div>
                        </div>

                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">
                            Pagos Seguros a través de Mercado Pago & Stripe
                        </p>
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
