import React from 'react';
import { Sparkles, Database, Users, Activity, Settings, ArrowRight, ChevronRight, Info } from 'lucide-react';
import { User } from '../services/authService';

interface ModuleCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    badge?: string;
    stats?: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, icon, color, onClick, badge, stats }) => (
    <button 
        onClick={onClick}
        className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 text-left transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 overflow-hidden flex flex-col h-full"
    >
        {/* Background glow effect */}
        <div className={`absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br ${color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity blur-3xl`} />
        
        {/* Icon & Badge */}
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-3xl bg-gradient-to-br ${color} text-white shadow-xl shadow-indigo-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                {icon}
            </div>
            {badge && (
                <span className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-slate-100">
                    {badge}
                </span>
            )}
        </div>

        {/* Text Content */}
        <div className="flex-grow">
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">
                {title}
            </h3>
            <p className="text-sm font-medium text-slate-400 leading-relaxed mb-4">
                {description}
            </p>
        </div>

        {/* Stats & Footer */}
        <div className="mt-6 flex items-center justify-between">
            {stats ? (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                    <span className="text-sm font-bold text-slate-700">{stats}</span>
                </div>
            ) : <div />}
            <div className="bg-slate-50 p-2.5 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <ArrowRight size={18} />
            </div>
        </div>
    </button>
);

interface SchoolDashboardProps {
    user: User;
    onNavigate: (tab: 'planner' | 'history' | 'users' | 'monitor') => void;
    summaryStats?: {
        sequences: number;
        teachers: number;
    };
}

export const SchoolDashboard: React.FC<SchoolDashboardProps> = ({ user, onNavigate, summaryStats }) => {
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    return (
        <div className="space-y-12 animate-fade-in-up">
            {/* School Hero Header */}
            <div className="relative bg-white/60 backdrop-blur-xl border border-white/60 rounded-[3rem] p-12 overflow-hidden shadow-2xl">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-50 -mr-48 -mt-48" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    {/* Logo / Icon */}
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 group hover:rotate-6 transition-all duration-500">
                        {user.config_visual?.logo_url ? (
                            <img src={user.config_visual.logo_url} alt="Logo" className="w-20 h-20 object-contain p-2" />
                        ) : (
                            <Sparkles size={48} className="group-hover:scale-110 transition-transform" />
                        )}
                    </div>

                    <div className="flex-grow text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-[3px] mb-4">
                            <Info size={14} /> Panel Institucional Activo
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter mb-4">
                            {user.nombre_institucion || 'Panel de Gestión'}
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed">
                            Bienvenido al centro de inteligencia pedagógica. <br />
                            <span className="text-indigo-600 font-bold">Has iniciado sesión como {user.name}</span>
                        </p>
                    </div>

                    {/* Quick Info Stats */}
                    {summaryStats && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center min-w-[140px]">
                                <div className="text-3xl font-black text-slate-800">{summaryStats.sequences}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Planeaciones</div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center min-w-[140px]">
                                <div className="text-3xl font-black text-slate-800">{summaryStats.teachers}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Docentes</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ModuleCard 
                    title="Planificador Inteligente"
                    description="Diseña secuencias didácticas de alta calidad alineadas con el MEN usando IA de última generación."
                    icon={<Sparkles size={28} />}
                    color="from-blue-600 to-indigo-600"
                    onClick={() => onNavigate('planner')}
                    badge="RECOMENDADO"
                    stats="IA v5.1 Platinum"
                />
                
                <ModuleCard 
                    title="Repositorio Curricular"
                    description="Accede al histórico de planeaciones, planeaciones por área y bancos de recursos institucionales."
                    icon={<Database size={28} />}
                    color="from-indigo-600 to-purple-600"
                    onClick={() => onNavigate('history')}
                    stats="Biblioteca Digital"
                />

                {isAdmin && (
                    <>
                        <ModuleCard 
                            title="Gestión de Docentes"
                            description="Administra perfiles de usuario, asignaciones académicas y controla el acceso a la plataforma."
                            icon={<Users size={28} />}
                            color="from-orange-500 to-red-500"
                            onClick={() => onNavigate('users')}
                            badge="ADMIN"
                            stats="Santuario Docente"
                        />

                        <ModuleCard 
                            title="Métricas de Calidad"
                            description="Analiza el rendimiento académico, el uso de créditos de IA y la efectuividad pedagógica."
                            icon={<Activity size={28} />}
                            color="from-emerald-500 to-teal-500"
                            onClick={() => onNavigate('monitor')}
                            badge="MONITOREO"
                            stats="Sincronizado"
                        />
                    </>
                )}
            </div>

            {/* Footer / Settings Shortcut */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-10 py-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-slate-400">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800">Parámetros Institucionales</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configura logos, formatos y sellos de calidad</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 text-indigo-600 font-black text-[12px] uppercase tracking-widest hover:translate-x-1 transition-transform">
                    Ir a Configuración <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
