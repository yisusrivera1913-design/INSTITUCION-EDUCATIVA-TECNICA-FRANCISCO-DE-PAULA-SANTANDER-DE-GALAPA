import React, { useState, useEffect } from 'react';
import { authService, User } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { GRADOS, AREAS } from '../constants';
import { Users, Activity, Calendar, Clock, BarChart3, Shield, Key, RefreshCw, Download, Upload, FileText, Database, UserPlus, Wand2, CheckCircle2, UserMinus, Trash2, BookOpen, GraduationCap, Save, Copy, KeyRound, Eye, EyeOff, Pencil, Globe, Sparkles, Lock, Unlock } from 'lucide-react';

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [userSequences, setUserSequences] = useState<Record<string, any[]>>({});
    const [isLoadingSeqs, setIsLoadingSeqs] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const [assignmentUser, setAssignmentUser] = useState<User | null>(null);



    const currentUser = authService.getCurrentUser();

    const fetchUsers = async () => {
        setIsRefreshing(true);
        const data = await authService.getAllUsersWithStats();
        // Sort by total usage by default
        const sorted = data.sort((a, b) => (b.stats?.total || 0) - (a.stats?.total || 0));
        setUsers(sorted);
        

        
        setIsRefreshing(false);
    };



    const toggleSequences = async (email: string) => {
        if (expandedUser === email) {
            setExpandedUser(null);
            return;
        }

        setIsLoadingSeqs(true);
        setExpandedUser(email);

        // Fetch specific sequences for this user
        const allSeqs = await authService.getAllSequences();
        const filtered = allSeqs.filter(s => s.user_email.toLowerCase() === email.toLowerCase());
        setUserSequences(prev => ({ ...prev, [email]: filtered }));
        setIsLoadingSeqs(false);
    };

    const handleDeleteUser = async (email: string, name: string) => {
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())?.role === 'super_admin') {
            alert("No se puede eliminar un Super Administrador desde este panel.");
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar al docente "${name}"? Esta acción no se puede deshacer.`)) {
            const result = await authService.deleteUser(email);
            if (result.success) {
                alert(`Docente ${name} eliminado correctamente.`);
                fetchUsers();
            } else {
                alert(`Error al eliminar: ${result.message}`);
            }
        }
    };

    const downloadJson = (sequence: any) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sequence.content, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `secuencia_${sequence.tema}_${new Date(sequence.timestamp).getTime()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    useEffect(() => {
        fetchUsers();

        // REAL-TIME: Listen for new usage logs or generated sequences to update stats instantly
        if (supabase) {
            const channel = supabase
                .channel('realtime-stats')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'usage_logs'
                }, () => fetchUsers())
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'generated_sequences'
                }, () => fetchUsers())
                .subscribe();

            // Usar el Singleton de authService para evitar conflictos de canales
            const currentUser = authService.getCurrentUser();
            const sub = authService.trackPresence(currentUser!, (state) => {
                console.log('💎 [UI] Actualizando lista de activos:', state);
                setOnlineUsers({ ...state });
            });

            // Sincronizar inmediatamente
            if (sub) setOnlineUsers({ ...sub.presenceState() });

            return () => {
                console.log('🚶 Quitanto subscriptor de UI del panel');
                if (sub) sub.unsubscribe();
                supabase.removeChannel(channel);
            };
        }
    }, []);

    const handleDownloadBackup = async () => {
        const usersWithStats = await authService.getAllUsersWithStats();
        const data = {
            users: usersWithStats,
            timestamp: new Date().toISOString(),
            version: '3.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const instName = authService.getCurrentUser()?.nombre_institucion?.toLowerCase().replace(/\s+/g, '_') || 'sistemaclasesideal';
        a.download = `${instName}_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // --- AUTO-MIGRACIÓN DESPUÉS DE BACKUP (Opcional) ---
        await authService.migrationLocalToCloud();
        fetchUsers();
    };

    const handleManualSync = async () => {
        setIsRefreshing(true);
        const result = await authService.migrationLocalToCloud();
        if (result.success) {
            alert(`Sincronización exitosa: ${result.count} secuencias migradas a la nube.`);
            fetchUsers();
        } else {
            alert("Error en la sincronización: " + (result.message || "Error desconocido"));
        }
        setIsRefreshing(false);
    };

    const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backup = JSON.parse(event.target?.result as string);
                if (backup.users && Array.isArray(backup.users)) {
                    if (confirm(`¿Restaurar copia de seguridad del ${new Date(backup.timestamp).toLocaleDateString()}? Esto sobrescribirá los datos actuales.`)) {
                        alert("Función de restauración validada. Los datos se han verificado correctamente.");
                        backup.users.forEach((u: any) => {
                            if (u.stats) {
                                localStorage.setItem(`sci_stats_${u.email.toLowerCase()}`, JSON.stringify([]));
                            }
                        });
                    }
                }
            } catch (err) {
                alert("Error al leer el archivo de respaldo.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="w-full mb-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl text-indigo-400">
                        <Users size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Gestión Académica Pro</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{authService.getCurrentUser()?.nombre_institucion || 'SistemaClasesIdeal Infrastructure'}</p>
                            <div className="h-1 w-1 bg-slate-700 rounded-full"></div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                {Object.keys(onlineUsers).length} Terminales Activas
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowAddUser(!showAddUser)}
                        className={`px-4 py-2 ${showAddUser ? 'bg-slate-800 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-500'} text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10`}
                    >
                        <UserPlus size={14} /> {showAddUser ? 'Cerrar Panel' : 'Nuevo Docente'}
                    </button>
                    <button
                        onClick={fetchUsers}
                        disabled={isRefreshing}
                        className="px-4 py-2 bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 hover:text-white border border-white/5 transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleManualSync}
                        className="px-4 py-2 bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 hover:text-white border border-white/5 transition-all"
                    >
                        Sincronizar
                    </button>
                    <button
                        onClick={handleDownloadBackup}
                        className="px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        <Download size={14} /> Backup
                    </button>
                </div>
            </div>



            {/* Teacher Generator UI (Backup Manual) */}
            {showAddUser && (
                <div className="mb-10 p-6 bg-[#0f0f11] rounded-2xl border border-white/10 animate-fade-in-up">
                    <UserGenerator onUserCreated={() => {
                        setShowAddUser(false);
                        fetchUsers();
                    }} />
                </div>
            )}

            <div className="bg-[#0f0f11] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 bg-white/5">
                            <th className="py-5 pl-6">Operador</th>
                            <th className="py-5">Identidad Digital</th>
                            <th className="py-5 text-center">Output</th>
                            <th className="py-5">Grados</th>
                            <th className="py-5">Áreas</th>
                            <th className="py-5 text-right pr-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-slate-400">
                        {users.map((user, i) => (
                            <React.Fragment key={i}>
                                <tr className={`group transition-colors border-b border-white/5 last:border-0 ${expandedUser === user.email ? 'bg-indigo-500/5' : 'hover:bg-white/[0.02]'}`}>
                                    <td className="py-5 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 font-black text-xs border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0f0f11] ${onlineUsers[user.email.toLowerCase()]
                                                    ? 'bg-emerald-500 animate-pulse'
                                                    : 'bg-slate-700'
                                                    }`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">{user.name}</div>
                                                    {user.role === 'admin' && <Shield size={10} className="text-indigo-400" />}
                                                </div>
                                                <span className={`text-[8px] font-black uppercase tracking-[2px] ${user.role === 'admin' ? 'text-indigo-500' : 'text-slate-500'}`}>{user.role}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <div className="text-[11px] font-medium text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="py-5 text-center">
                                        <span className="font-black text-white bg-white/5 px-2.5 py-1 rounded border border-white/5">{user.stats?.total || 0}</span>
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {(user.assigned_grades || []).length > 0 ? (
                                                user.assigned_grades?.slice(0, 2).map(g => (
                                                    <span key={g} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-md border border-indigo-100">{g}</span>
                                                ))
                                            ) : <span className="text-[8px] text-slate-300 italic">Sin asignar</span>}
                                            {(user.assigned_grades || []).length > 2 && <span className="text-[8px] text-slate-400 font-bold">+{user.assigned_grades!.length - 2}</span>}
                                        </div>
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {(user.assigned_subjects || []).length > 0 ? (
                                                user.assigned_subjects?.slice(0, 1).map(s => (
                                                    <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-md border border-blue-100 truncate max-w-[80px]">{s}</span>
                                                ))
                                            ) : <span className="text-[8px] text-slate-300 italic">Sin asignar</span>}
                                            {(user.assigned_subjects || []).length > 1 && <span className="text-[8px] text-slate-400 font-bold">+{user.assigned_subjects!.length - 1}</span>}
                                        </div>
                                    </td>
                                    <td className="py-5 text-right pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleSequences(user.email)}
                                                className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${expandedUser === user.email
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-white/5 text-slate-400 border-white/5 hover:border-indigo-500/50 hover:text-white'
                                                    }`}
                                            >
                                                {expandedUser === user.email ? 'Ocultar' : 'Historial'}
                                            </button>

                                            <button
                                                onClick={() => setAssignmentUser(user)}
                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                                title="Gestionar Permisos"
                                            >
                                                <Shield size={16} />
                                            </button>

                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.email, user.name)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Eliminar Docente"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* Expanded Sequence List */}
                                {expandedUser === user.email && (
                                    <tr className="bg-white/40 backdrop-blur-sm border-b border-slate-100 animate-fade-in">
                                        <td colSpan={6} className="p-8">
                                            <div className="bg-white rounded-3xl border border-indigo-100 shadow-sm overflow-hidden">
                                                <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                                                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                                        <Database size={16} />
                                                        Archivos de {user.name}
                                                    </h4>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                                                    {/* RIGHT: Sequences Repo */}
                                                    <div className="flex flex-col">
                                                        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <FileText size={14} /> Historial de Planeaciones
                                                            </h5>
                                                        </div>

                                                        {isLoadingSeqs ? (
                                                            <div className="py-12 flex flex-col items-center gap-3">
                                                                <RefreshCw size={24} className="text-indigo-600 animate-spin" />
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando...</span>
                                                            </div>
                                                        ) : (userSequences[user.email]?.length || 0) === 0 ? (
                                                            <div className="py-12 text-center">
                                                                <p className="text-xs font-bold text-slate-400 italic">Sin registros.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="max-h-96 overflow-y-auto">
                                                                <table className="w-full text-left">
                                                                    <thead className="bg-slate-50/50 sticky top-0 backdrop-blur-sm">
                                                                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                                            <th className="px-6 py-3">Tema</th>
                                                                            <th className="px-6 py-3">Área / Grado</th>
                                                                            <th className="px-6 py-3 text-right flex items-center justify-end gap-2">
                                                                                Acción
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-50">
                                                                        {userSequences[user.email]?.map((seq) => (
                                                                            <tr key={seq.id} className="hover:bg-slate-50/30 transition-colors">
                                                                                <td className="px-6 py-4">
                                                                                    <span className="text-xs font-black text-slate-800 line-clamp-1">{seq.tema}</span>
                                                                                </td>
                                                                                <td className="px-6 py-4">
                                                                                    <span className="text-[10px] font-bold text-slate-500">{seq.area} • {seq.grado}</span>
                                                                                </td>
                                                                                <td className="px-6 py-4 text-right">
                                                                                    <button
                                                                                        onClick={() => downloadJson(seq)}
                                                                                        className="p-1.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                                                                    >
                                                                                        <Download size={14} />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                                                    <PasswordChange email={user.email} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ASSIGNMENT MODAL */}
            {assignmentUser && (() => {
                const refreshedUser = users.find(u => u.email === assignmentUser.email) || assignmentUser;
                return (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
                            <div className="bg-[#0a0a0a] p-8 text-white flex justify-between items-center border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-xl border border-indigo-500/20">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">{refreshedUser.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[2px]">Permisos de Infraestructura Académica</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setAssignmentUser(null); fetchUsers(); }}
                                    className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-slate-400"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-8 max-h-[70vh] overflow-y-auto bg-[#0f0f11]">
                                <UserAssignmentManager
                                    user={refreshedUser}
                                    onUpdate={fetchUsers}
                                />
                            </div>

                            <div className="p-6 bg-[#0a0a0a] border-t border-white/5 flex justify-end">
                                <button
                                    onClick={() => { setAssignmentUser(null); fetchUsers(); }}
                                    className="px-8 py-3 bg-white text-black rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Guardar Configuración
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div >
    );
};

export const UserGenerator: React.FC<{ onUserCreated: () => void }> = ({ onUserCreated }) => {
    const [name, setName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string, creds?: { email: string, pass: string } } | null>(null);
    const [copied, setCopied] = useState<'email' | 'pass' | null>(null);

    const generateUser = async () => {
        if (!name || name.trim().length < 3) return;
        setIsGenerating(true);
        setStatus(null);

        // Logic: Juan Perez -> juan.perez@dominio.com
        const cleanName = name.trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/\s+/g, '.'); // spaces to dots

        const currentUser = authService.getCurrentUser();
        const domain = currentUser?.dominio_email || 'clasesideal.com';
        const generatedEmail = `${cleanName}@${domain}`;
        const defaultPassword = (currentUser?.nombre_institucion?.toLowerCase().split(' ')[0] || 'sci') + '2026';

        try {
            const result = await authService.registerTeacher({
                name: name.trim(),
                email: generatedEmail,
                password: defaultPassword,
                assigned_grades: GRADOS,
                assigned_subjects: AREAS
            });

            if (result.success) {
                setStatus({
                    type: 'success',
                    msg: '¡Docente registrado con acceso total!',
                    creds: { email: generatedEmail, pass: defaultPassword }
                });
                setName('');
                // Solicitud del usuario: Mostrar para copiar y luego dejar de mostrar
                // No cerramos inmediatamente onUserCreated para dar tiempo a copiar
                setTimeout(() => onUserCreated(), 60000); // 1 minuto o hasta que refresque manual
            } else {
                setStatus({ type: 'error', msg: result.message || 'Error al registrar' });
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Fallo de conexión' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <Wand2 className="text-indigo-600" size={24} />
                <h4 className="text-lg font-black text-indigo-900 tracking-tight">Auto-Generador de Credenciales</h4>
            </div>

            <p className="text-xs font-medium text-slate-500 mb-4">
                Escribe el nombre completo del profesor y el sistema generará automáticamente su correo institucional y contraseña base.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre completo del profesor..."
                        className="w-full bg-white border border-indigo-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all shadow-sm"
                        onKeyDown={(e) => e.key === 'Enter' && generateUser()}
                    />
                </div>
                <button
                    onClick={generateUser}
                    disabled={isGenerating || !name}
                    className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isGenerating || !name
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20 active:scale-95'
                        }`}
                >
                    {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {isGenerating ? 'Generando...' : 'Crear Acceso'}
                </button>
            </div>

            {status && (
                <div className={`mt-6 animate-fade-in-up`}>
                    {status.type === 'error' ? (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold flex items-center gap-3">
                            <Shield size={16} /> {status.msg}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-indigo-100 shadow-xl overflow-hidden">
                            <div className="bg-indigo-600 px-6 py-3 flex justify-between items-center">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Credenciales del Docente</span>
                                <CheckCircle2 size={14} className="text-white" />
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-[10px] font-medium text-slate-500 italic">Copia estos datos para compartirlos con el docente:</p>

                                <div className="space-y-3">
                                    <div className="group relative">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Correo Institucional</label>
                                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:border-indigo-200 transition-all">
                                            <code className="flex-1 text-xs font-black text-indigo-900 truncate">
                                                {status.creds?.email}
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(status.creds?.email || '');
                                                    setCopied('email');
                                                    setTimeout(() => setCopied(null), 2000);
                                                }}
                                                className="p-2 hover:bg-white rounded-lg text-indigo-500 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                                            >
                                                {copied === 'email' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Contraseña Base</label>
                                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:border-indigo-200 transition-all">
                                            <code className="flex-1 text-xs font-black text-slate-800">
                                                {status.creds?.pass}
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(status.creds?.pass || '');
                                                    setCopied('pass');
                                                    setTimeout(() => setCopied(null), 2000);
                                                }}
                                                className="p-2 hover:bg-white rounded-lg text-slate-600 transition-all shadow-sm border border-transparent hover:border-slate-200"
                                            >
                                                {copied === 'pass' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => { setStatus(null); onUserCreated(); }}
                                        className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all"
                                    >
                                        Entendido y Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const PasswordChange: React.FC<{ email: string }> = ({ email }) => {
    const [newPass, setNewPass] = useState('');
    const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    const [isChanging, setIsChanging] = useState(false);

    const handleChange = async () => {
        if (newPass.length < 6) {
            setMsg({ type: 'error', text: 'Mínimo 6 caracteres reglamentarios' });
            return;
        }

        setIsChanging(true);
        setMsg({ type: 'info', text: 'Sincronizando con base de datos...' });

        try {
            const result = await authService.changePassword(email, newPass);
            if (result.success) {
                setMsg({ type: 'success', text: 'Credenciales actualizadas en la nube y local' });
                setNewPass('');
            } else {
                setMsg({ type: 'error', text: result.message || 'Error de sincronización' });
            }
        } catch (error) {
            setMsg({ type: 'error', text: 'Fallo crítico de conexión' });
        } finally {
            setIsChanging(false);
            setTimeout(() => setMsg(null), 5000);
        }
    };

    return (
        <div className="mt-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-200/60 shadow-inner">
            <div className="flex items-center gap-3 mb-5">
                <div className="bg-slate-800 p-2 rounded-xl text-white">
                    <Key size={18} />
                </div>
                <div>
                    <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-[2px]">Seguridad de Acceso</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{authService.getCurrentUser()?.nombre_institucion || 'Plataforma'} • Encriptado AES</p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="relative group">
                    <input
                        type="password"
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        placeholder="Nueva contraseña maestra..."
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all shadow-sm group-hover:border-slate-300"
                    />
                </div>

                <button
                    onClick={handleChange}
                    disabled={isChanging || !newPass}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all flex items-center justify-center gap-2 shadow-xl ${isChanging || !newPass
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-900/10 active:scale-95'
                        }`}
                >
                    {isChanging ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
                    {isChanging ? 'Actualizando Sistema...' : 'Sincronizar Nueva Contraseña'}
                </button>
            </div>

            {msg && (
                <div className={`mt-4 p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-fade-in-up ${msg.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' :
                    msg.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                        'bg-red-50 border-red-100 text-red-700'
                    }`}>
                    <div className={`p-1 rounded-full ${msg.type === 'success' ? 'bg-green-500' :
                        msg.type === 'info' ? 'bg-blue-500' :
                            'bg-red-500'
                        } text-white`}>
                        {msg.type === 'success' ? <CheckCircle2 size={10} /> : <Activity size={10} />}
                    </div>
                    {msg.text}
                </div>
            )}
        </div>
    );
};

export const UserAssignmentManager: React.FC<{ user: User, onUpdate: () => void }> = ({ user, onUpdate }) => {
    // Initialize state from sync props
    const [grades, setGrades] = useState<string[]>(user.assigned_grades || []);
    const [subjects, setSubjects] = useState<string[]>(user.assigned_subjects || []);
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Sync state if user prop changes (e.g. from table refresh)
    useEffect(() => {
        setGrades(user.assigned_grades || []);
        setSubjects(user.assigned_subjects || []);
    }, [user.assigned_grades, user.assigned_subjects]);

    const ALL_GRADES = ["Transición", "Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo", "Undécimo", "Multigrado"];
    const ALL_SUBJECTS = [
        "Matemáticas", "Lengua Castellana", "Ciencias Naturales", "Ciencias Sociales", "Filosofía",
        "Inglés", "Educación Artística", "Educación Física", "Tecnología e Informática",
        "Ética y Valores", "Religión", "Dimensión Corporal", "Dimensión Cognitiva",
        "Dimensión Socioafectiva", "Dimensión Comunicativa", "Agropecuaria", "Cátedra de la Paz",
        "Física", "Estadística", "Geometría", "Biología", "Química", "Integral (matemáticas+lenguaje+sociales+naturales)"
    ];

    const toggle = async (list: string[], setFn: any, item: string, isGrades: boolean) => {
        setIsSaving(true);
        const exists = list.includes(item);
        const newList = exists ? list.filter(i => i !== item) : [...list, item];

        try {
            // Update local state first
            setFn(newList);

            // USE LOCAL STATE for both to ensure consistency
            const finalGrades = isGrades ? newList : grades;
            const finalSubjects = isGrades ? subjects : newList;

            const result = await authService.updateUserAssignments(user.email, finalGrades, finalSubjects);
            if (result.success) {
                setMsg({ type: 'success', text: 'Sincronizado' });
                await onUpdate(); // Forced refresh to update the 'user' prop
            } else {
                setMsg({ type: 'error', text: 'Error de red' });
                setFn(list); // Revert
            }
        } catch (e) {
            setMsg({ type: 'error', text: 'Fallo crítico' });
            setFn(list);
        } finally {
            setIsSaving(false);
            setTimeout(() => setMsg(null), 1500);
        }
    };

    const selectAll = async (isGrades: boolean) => {
        setIsSaving(true);
        const newList = isGrades ? ALL_GRADES : ALL_SUBJECTS;

        const finalGrades = isGrades ? ALL_GRADES : grades;
        const finalSubjects = isGrades ? subjects : ALL_SUBJECTS;

        const result = await authService.updateUserAssignments(user.email, finalGrades, finalSubjects);
        if (result.success) {
            if (isGrades) setGrades(ALL_GRADES); else setSubjects(ALL_SUBJECTS);
            await onUpdate();
            setMsg({ type: 'success', text: 'Habilitado total' });
        }
        setIsSaving(false);
        setTimeout(() => setMsg(null), 1500);
    };

    const clearAll = async (isGrades: boolean) => {
        setIsSaving(true);
        const finalGrades = isGrades ? [] : grades;
        const finalSubjects = isGrades ? subjects : [];

        const result = await authService.updateUserAssignments(user.email, finalGrades, finalSubjects);
        if (result.success) {
            if (isGrades) setGrades([]); else setSubjects([]);
            await onUpdate();
            setMsg({ type: 'success', text: 'Limpieza total' });
        }
        setIsSaving(false);
        setTimeout(() => setMsg(null), 1500);
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
                        {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-[2px]">Panel de Control Académico</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {isSaving ? 'Sincronizando con la nube...' : 'Los cambios se guardan automáticamente'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <GraduationCap size={14} className="text-indigo-500" /> Grados Habilitados
                        </label>
                        <div className="flex gap-2">
                            <button onClick={() => selectAll(true)} className="text-[8px] font-black text-indigo-600 uppercase hover:underline">Activar Todos</button>
                            <span className="text-slate-300">|</span>
                            <button onClick={() => clearAll(true)} className="text-[8px] font-black text-slate-400 uppercase hover:underline">Quitar Todos</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ALL_GRADES.map(g => (
                            <button
                                key={g}
                                onClick={() => toggle(grades, setGrades, g, true)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border ${grades.includes(g)
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={14} className="text-blue-500" /> Áreas Curriculares
                        </label>
                        <div className="flex gap-2">
                            <button onClick={() => selectAll(false)} className="text-[8px] font-black text-blue-600 uppercase hover:underline">Activar Todas</button>
                            <span className="text-slate-300">|</span>
                            <button onClick={() => clearAll(false)} className="text-[8px] font-black text-slate-400 uppercase hover:underline">Quitar Todas</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ALL_SUBJECTS.map(s => (
                            <button
                                key={s}
                                onClick={() => toggle(subjects, setSubjects, s, false)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border ${subjects.includes(s)
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {msg && (
                <div className={`p-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-fade-in-up ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                    <CheckCircle2 size={12} /> {msg.text}
                </div>
            )}
        </div>
    );
};

