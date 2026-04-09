import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Shield, Zap, Globe, Users, CheckCircle2, Search, GraduationCap, Loader2, Key } from 'lucide-react';
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
        <div className="min-h-screen bg-[#fcfcfd] font-outfit text-slate-900 selection:bg-blue-100 overflow-x-hidden relative">
            
            {/* Background Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 blur-[120px] rounded-full animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/40 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
            </div>

            {/* Minimal Navigation */}
            <nav className="fixed top-0 w-full z-50 px-8 h-24 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                    {/* Empty or very subtle branding if needed, but the hero has it all */}
                </div>
            </nav>

            {/* main Executive Hero */}
            <section className="relative pt-20 md:pt-32 pb-20 px-6 flex flex-col items-center justify-center min-h-[90vh]">
                <div className="max-w-4xl mx-auto text-center space-y-12 animate-fade-in-up">
                    
                    {/* Centralized Institutional Logo */}
                    <div className="relative inline-block group">
                        <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-20 scale-150 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100/50 flex items-center justify-center w-48 h-48 md:w-56 md:h-56 transform transition-transform group-hover:scale-105 duration-700">
                            <img 
                                src="/logo_santander.png" 
                                alt="Institución Educativa Francisco de Paula Santander" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Main Branding */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                            SISTEMA<span className="text-blue-600">CLASES</span>
                            <br />
                            <span className="text-slate-800">IDEAL</span>
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl font-medium tracking-tight">
                            Excelencia Pedagógica Digital.
                        </p>
                    </div>

                    {/* Primary Action Row */}
                    <div className="flex items-center justify-center gap-6 pt-8">
                        {/* Search/Code Field */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                <Key size={20} />
                            </div>
                            <input 
                                type="text"
                                placeholder="CÓDIGO"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-full text-sm font-black uppercase tracking-widest shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none w-48 transition-all"
                            />
                        </div>

                        {/* Divider Line */}
                        <div className="w-12 h-[1px] bg-blue-200"></div>

                        {/* main Access Button */}
                        <button 
                            onClick={() => onStart()}
                            className="bg-blue-600 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all flex items-center gap-3 active:scale-95"
                        >
                            <Shield size={18} />
                            ACCESO
                        </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        <button className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <CheckCircle2 size={16} />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Acceso Seguro</span>
                        </button>
                        
                        <button className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Sparkles size={16} />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Plan Premium</span>
                        </button>
                    </div>

                    {/* Search Results Dropdown Overlay */}
                    {filteredSchools.length > 0 && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-full max-w-sm mt-4 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 shadow-2xl p-4 z-50 overflow-hidden animate-scale-in">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-4 px-4 text-left">Instituciones Disponibles</p>
                                {filteredSchools.map((school) => (
                                    <button 
                                        key={school.id}
                                        onClick={() => handleSelectSchool(school)}
                                        className="w-full text-left px-4 py-4 hover:bg-blue-600 group rounded-2xl flex items-center gap-4 transition-all"
                                    >
                                        <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                            <GraduationCap size={20} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-slate-800 group-hover:text-white block uppercase tracking-tight">{school.nombre}</span>
                                            {school.municipio && (
                                                <span className="text-[9px] text-slate-400 group-hover:text-blue-100 font-bold uppercase tracking-widest">{school.municipio}</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Executive Footer */}
            <footer className="py-20 border-t border-slate-100/50 bg-white relative z-10">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start opacity-70">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Shield size={20} />
                                <span className="font-black uppercase tracking-widest text-xs">I.E. Santander</span>
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed text-slate-400 max-w-xs uppercase tracking-tight">
                                Plataforma de planeación pedagógica avanzada con inteligencia artificial integrada.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-[4px]">Enlaces</span>
                            <div className="flex flex-col gap-2">
                                <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Soporte Técnico</a>
                                <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Guía de Usuario</a>
                            </div>
                        </div>
                        <div className="space-y-4 md:text-right flex flex-col md:items-end">
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-[4px]">Status</span>
                            <div className="flex items-center gap-2 text-emerald-500">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Sistemas Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-16 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-300">
                            <Sparkles size={14} />
                            <span className="text-[9px] font-black uppercase tracking-[5px]">SistemaClasesIdeal — © 2026 — Galapa, Atlántico</span>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

// Shield alias
const Security = Shield;
