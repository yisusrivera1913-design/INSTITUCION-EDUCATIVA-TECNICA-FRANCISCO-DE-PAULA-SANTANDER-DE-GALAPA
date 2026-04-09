import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Building2, Users, FileText, Activity, Power, RefreshCw, Plus, Zap, CheckCircle2, XCircle, Globe, Sparkles, KeyRound, Eye, EyeOff, Copy, Pencil, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Institucion {
    id: string;
    nombre: string;
    slug: string;
    municipio?: string;
    plan_suscripcion: string;
    activo: boolean;
    created_at: string;
    codigo_acceso?: string | null;
    app_users?: [{ count: number }];
    generated_sequences?: [{ count: number }];
    permite_autoregistro?: boolean;
}

interface SuperAdminPanelProps {
    onEnterInstitucion: (inst: any) => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onEnterInstitucion }) => {
    const [instituciones, setInstituciones] = useState<Institucion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showRegForm, setShowRegForm] = useState(false);
    const [toggling, setToggling] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    // Estado para gestión de códigos de acceso
    const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
    const [newCodeInput, setNewCodeInput] = useState('');
    const [savingCode, setSavingCode] = useState(false);
    const [showCodeId, setShowCodeId] = useState<string | null>(null);
    const [codeSavedId, setCodeSavedId] = useState<string | null>(null);

    const [form, setForm] = useState({
        nombre: '', slug: '', municipio: '', nit: '',
        dominio_email: '', plan_suscripcion: 'bronce'
    });

    const load = async () => {
        setIsLoading(true);
        const data = await authService.getInstituciones();
        setInstituciones(data as Institucion[]);
        setIsLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleToggle = async (id: string, current: boolean) => {
        setToggling(id);
        await authService.toggleInstitucion(id, !current);
        await load();
        setToggling(null);
    };

    const handleRegister = async () => {
        if (!form.nombre || !form.slug) return;
        const slug = form.slug.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const result = await authService.registerInstitucion({ ...form, slug });
        if (result.success) {
            setShowRegForm(false);
            setForm({ nombre: '', slug: '', municipio: '', nit: '', dominio_email: '', plan_suscripcion: 'bronce' });
            load();
        } else {
            alert('Error: ' + result.message);
        }
    };

    const handleCopyLink = (slug: string, id: string) => {
        const url = `${window.location.origin}?inst=${slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSaveCode = async (instId: string) => {
        if (!newCodeInput.trim()) return;
        setSavingCode(true);
        const result = await authService.updateCodigoAcceso(instId, newCodeInput.trim());
        if (result.success) {
            // Actualizar localmente
            setInstituciones(prev => prev.map(i =>
                i.id === instId ? { ...i, codigo_acceso: newCodeInput.trim() } : i
            ));
            setEditingCodeId(null);
            setNewCodeInput('');
            setCodeSavedId(instId);
            setTimeout(() => setCodeSavedId(null), 3000);
        } else {
            alert('Error guardando código: ' + result.message);
        }
        setSavingCode(false);
    };

    const handlePay = async (inst: Institucion) => {
        const mp = authService.initMercadoPago();
        if (!mp) {
            alert("Error al iniciar Mercado Pago. Verifica la llave pública en el .env");
            return;
        }

        const user = authService.getCurrentUser();
        const email = user?.email || 'admin@sistemaclasesideal.com';

        try {
            const res = await authService.createPreference(inst.id, email, "Plan PRO - SCI", 20000);
            if (res.preferenceId) {
                mp.checkout({
                    preference: {
                        id: res.preferenceId
                    },
                    autoOpen: true
                });
            } else {
                alert("Error: " + (res.error || "No se pudo obtener el ID de preferencia"));
            }
        } catch (e) {
            console.error(e);
            alert("Fallo en la conexión con el servidor de pagos.");
        }
    };

    const planColors: Record<string, string> = {
        bronce: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
        plata: 'text-slate-300 bg-slate-300/10 border-slate-300/20',
        oro: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    };
    const planLabels: Record<string, string> = { bronce: 'Tier 1 - Bronce', plata: 'Tier 2 - Plata', oro: 'Tier 3 - Oro' };

    return (
        <div className="w-full mb-20 animate-fade-in-up">
            
            {/* Alerta de Conexión (SaaS Control) */}
            {!supabase && (
                <div className="mb-10 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4 animate-pulse">
                    <div className="bg-red-500 p-2 rounded-xl text-white">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <h4 className="text-red-400 font-black text-sm uppercase tracking-widest">Error de Conexión a la Nube</h4>
                        <p className="text-red-500/70 text-[10px] font-bold">Las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están configuradas en Vercel.</p>
                    </div>
                </div>
            )}
            
            {/* Main Hero & Dashboard Stats */}
            <div className="relative mb-16">
                <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] rounded-full -z-10"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[2px] mb-4">
                            <Activity size={12} /> Red Global SistemaClasesIdeal
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">
                            Centro de Mando <span className="text-blue-500 italic">SCI</span>
                        </h2>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">
                            Gestión centralizada de instituciones, despliegue de nodos académicos y monitoreo de recursos pedagógicos.
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <button onClick={async () => {
                            if (confirm('¿Borrar TODAS las secuencias de prueba? Esta acción es irreversible.')) {
                                const res = await authService.clearTestData();
                                if (res.success) alert('Datos de prueba eliminados.');
                                else alert('Error al limpiar datos.');
                                load();
                            }
                        }} className="h-12 px-6 bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white border border-red-500/20 transition-all flex items-center gap-3">
                            <XCircle size={14} /> 
                            <span>Limpiar Pruebas</span>
                        </button>
                        <button onClick={load} className="h-12 px-6 bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 hover:text-white border border-white/5 transition-all flex items-center gap-3">
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> 
                            <span>Sincronizar</span>
                        </button>
                        <button onClick={() => setShowRegForm(!showRegForm)}
                            className={`h-12 px-6 rounded-xl transition-all flex items-center gap-3 shadow-2xl text-[10px] font-black uppercase tracking-widest ${showRegForm ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-600 text-white border border-blue-500/50 hover:bg-blue-500 shadow-blue-500/20'}`}>
                            {showRegForm ? <XCircle size={16} /> : <Plus size={16} />} 
                            {showRegForm ? 'Cancelar' : 'Registrar Colegio'}
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Instancias Totales', val: instituciones.length, icon: Building2, color: 'text-indigo-400', bg: 'bg-indigo-400/5' },
                        { label: 'Nodos Operativos', val: instituciones.filter(i => i.activo).length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
                        { label: 'Tier 3 (Enterprise)', val: instituciones.filter(i => i.plan_suscripcion === 'oro').length, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/5' },
                        {
                            label: 'Secuencias IA', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-400/5',
                            val: instituciones.reduce((acc, i) => acc + (i.generated_sequences?.[0]?.count || 0), 0)
                        },
                    ].map((s, idx) => (
                        <div key={idx} className={`${s.bg} border border-white/5 rounded-2xl p-6 shadow-saas relative overflow-hidden group hover:border-white/10 transition-all`}>
                            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <s.icon size={110} className={s.color} />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${s.bg} border border-white/10`}>
                                    <s.icon size={16} className={s.color} />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
                            </div>
                            <div className="text-4xl font-black text-white tracking-tighter">{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Registration Wizard (Modo Oscuro Profundo) */}
            {showRegForm && (
                <div className="mb-20 p-8 bg-[#0a0a0b] border border-indigo-500/30 rounded-[2rem] animate-fade-in-up shadow-[0_0_80px_-20px_rgba(99,102,241,0.2)]">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/40">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Provisionamiento de Nodo</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Entorno Virtual Aislado para Institución</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { label: 'Nombre Institucional', key: 'nombre', placeholder: 'P. ej. Colegio Bilingüe del Norte' },
                            { label: 'Slug del Sistema (URL)', key: 'slug', placeholder: 'colegio-norte' },
                            { label: 'Identificación Tributaria', key: 'nit', placeholder: 'NIT 900.000.000-1' },
                            { label: 'Sede / Municipio', key: 'municipio', placeholder: 'Barranquilla, ATL' },
                            { label: 'Restricción de Dominio', key: 'dominio_email', placeholder: 'colegionorte.edu.co' },
                        ].map((f) => (
                            <div key={f.key} className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                                <input
                                    type="text"
                                    value={(form as any)[f.key]}
                                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    placeholder={f.placeholder}
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-700 hover:bg-white/[0.07]"
                                />
                            </div>
                        ))}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan de Suscripción (SLA)</label>
                            <select
                                value={form.plan_suscripcion}
                                onChange={e => setForm(prev => ({ ...prev, plan_suscripcion: e.target.value }))}
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer hover:bg-white/[0.07]"
                            >
                                <option value="bronce" className="bg-[#0a0a0b]">Bronce - Escuelas Chicas</option>
                                <option value="plata" className="bg-[#0a0a0b]">Plata - Instituciones Medias</option>
                                <option value="oro" className="bg-[#0a0a0b]">Oro - Corporaciones / Mega-Colegios</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="mt-12 flex justify-end items-center gap-6 border-t border-white/5 pt-8">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-xs text-right">
                            Al provisionar, se creará un entorno de base de datos único para este nodo.
                        </p>
                        <button onClick={handleRegister}
                            className="h-14 px-10 bg-white text-black text-[11px] font-black uppercase tracking-[2px] rounded-2xl hover:bg-indigo-400 hover:text-white transition-all shadow-xl flex items-center gap-3 group">
                            <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" /> 
                            Confirmar Despliegue
                        </button>
                    </div>
                </div>
            )}

            {/* Nodes Directory Header */}
            <div className="flex items-center gap-4 mb-8">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[4px]">Directorio de Instancias</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>

            {/* Institutions Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white/5 rounded-3xl border border-white/5 animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {instituciones.map((inst) => (
                        <div key={inst.id} className="saas-card group hover:border-indigo-500/30 hover:bg-[#151518] transition-all duration-500 shadow-saas">
                            
                            {/* Card Header & Status */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-indigo-500/10 border border-white/5 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 ring-4 ring-transparent group-hover:ring-indigo-500/20">
                                    <Building2 size={28} />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${inst.activo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        <div className={`w-1 h-1 rounded-full ${inst.activo ? 'bg-emerald-400' : 'bg-red-400'} ${inst.activo ? 'animate-pulse' : ''}`} />
                                        {inst.activo ? 'Activo' : 'Offline'}
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${inst.permite_autoregistro !== false ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                        {inst.permite_autoregistro !== false ? 'Registro Abierto' : 'Modo Estricto'}
                                    </div>
                                    <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">ID: {inst.id.substring(0, 8)}</div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{inst.nombre}</h4>
                                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                    <Globe size={11} className="text-indigo-500/50" /> {inst.municipio || 'Servidor Global'}
                                </div>
                            </div>

                            {/* Plan Pill */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${planColors[inst.plan_suscripcion] || ''}`}>
                                    {planLabels[inst.plan_suscripcion]}
                                </span>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>

                            {/* Resource Metrics */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Docentes</div>
                                    <div className="text-xl font-black text-white">{(inst as any).app_users?.[0]?.count ?? '0'}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Carga IA</div>
                                    <div className="text-xl font-black text-white">{(inst as any).generated_sequences?.[0]?.count ?? '0'}</div>
                                </div>
                            </div>

                            {/* === CÓDIGO DE ACCESO (KEY FEATURE) === */}
                            <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <KeyRound size={13} className="text-indigo-400" />
                                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Código de Acceso Docentes</span>
                                    </div>
                                    {codeSavedId === inst.id && (
                                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1">
                                            <ShieldCheck size={11} /> Guardado
                                        </span>
                                    )}
                                </div>

                                {editingCodeId === inst.id ? (
                                    // Modo edición
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCodeInput}
                                            onChange={e => setNewCodeInput(e.target.value)}
                                            placeholder="ej: galapa2026"
                                            className="flex-1 h-9 bg-white/5 border border-indigo-400/30 rounded-lg px-3 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-700 tracking-wider"
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && handleSaveCode(inst.id)}
                                        />
                                        <button
                                            onClick={() => handleSaveCode(inst.id)}
                                            disabled={savingCode || !newCodeInput.trim()}
                                            className="h-9 px-4 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {savingCode ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                            {savingCode ? '' : 'OK'}
                                        </button>
                                        <button
                                            onClick={() => { setEditingCodeId(null); setNewCodeInput(''); }}
                                            className="h-9 w-9 bg-white/5 text-slate-400 text-[10px] font-black rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center"
                                        >
                                            <XCircle size={13} />
                                        </button>
                                    </div>
                                ) : (
                                    // Vista del código
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-9 bg-black/20 border border-white/5 rounded-lg px-3 flex items-center">
                                            {inst.codigo_acceso ? (
                                                <span className="text-sm font-black tracking-[4px] text-white">
                                                    {showCodeId === inst.id ? inst.codigo_acceso : '••••••••'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-600 font-bold italic">Sin código configurado</span>
                                            )}
                                        </div>
                                        {inst.codigo_acceso && (
                                            <button
                                                onClick={() => setShowCodeId(showCodeId === inst.id ? null : inst.id)}
                                                className="h-9 w-9 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 hover:text-white transition-all flex items-center justify-center border border-white/5"
                                                title={showCodeId === inst.id ? 'Ocultar' : 'Ver código'}
                                            >
                                                {showCodeId === inst.id ? <EyeOff size={13} /> : <Eye size={13} />}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setEditingCodeId(inst.id); setNewCodeInput(inst.codigo_acceso || ''); }}
                                            className="h-9 w-9 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-indigo-500/20"
                                            title="Editar código"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Core Actions */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => onEnterInstitucion(inst)}
                                        className="flex-1 h-12 bg-white text-black font-black text-[10px] uppercase tracking-[3px] rounded-xl hover:bg-blue-600 hover:text-white hover:-translate-y-1 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 ring-2 ring-transparent hover:ring-blue-500/50"
                                    >
                                        <Sparkles size={14} className="text-blue-500 group-hover:text-white" /> Gestionar Colegio
                                    </button>

                                    <button 
                                        onClick={() => handleToggle(inst.id, inst.activo)}
                                        disabled={toggling === inst.id}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border ${
                                            inst.activo 
                                            ? 'bg-emerald-500/5 text-emerald-500/50 border-white/5 hover:bg-red-500 hover:text-white' 
                                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-emerald-500 hover:text-white'
                                        }`}
                                        title={inst.activo ? "Desactivar" : "Activar"}
                                    >
                                        {toggling === inst.id ? <RefreshCw size={18} className="animate-spin" /> : <Power size={18} />}
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => handleCopyLink(inst.slug, inst.id)}
                                        className={`w-full h-10 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                                            copiedId === inst.id 
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {copiedId === inst.id ? <CheckCircle2 size={12} /> : <Globe size={12} />}
                                        {copiedId === inst.id ? '¡Enlace Copiado!' : 'Copiar Enlace Docentes'}
                                    </button>

                                    {/* BOTÓN DE PAGO (SANDBOX) */}
                                    <button 
                                        onClick={() => handlePay(inst)}
                                        className="w-full h-10 bg-indigo-600/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <Zap size={12} /> Pagar Plan PRO (Sandbox)
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {instituciones.length === 0 && !isLoading && (
                      <div className="col-span-full py-24 text-center bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10">
                        <Building2 size={48} className="mx-auto text-slate-700 mb-6" />
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[4px]">Estructura de Red no Inicializada</p>
                        <p className="text-slate-600 text-xs mt-2">Proceda a crear el primer nodo de la infraestructura educativa.</p>
                      </div>
                    )}
                </div>
            )}
        </div>
    );
};
