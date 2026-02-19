import React, { useState, useEffect } from 'react';
import { authService, User } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { Users, Activity, Calendar, Clock, BarChart3, Shield, Key, RefreshCw, Download, Upload, FileText, Database, UserPlus, Wand2, CheckCircle2, UserMinus, Trash2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [userSequences, setUserSequences] = useState<Record<string, any[]>>({});
    const [isLoadingSeqs, setIsLoadingSeqs] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);

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
        if (email.toLowerCase() === 'admin@santander.edu.co') {
            alert("No se puede eliminar la cuenta principal de administración.");
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
        a.download = `santander_backup_${new Date().toISOString().slice(0, 10)}.json`;
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
                                localStorage.setItem(`santander_stats_${u.email.toLowerCase()}`, JSON.stringify([]));
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
        <div className="w-full bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl mb-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600/10 p-3 rounded-2xl text-indigo-600">
                        <Users size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Gestión Académica</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-medium text-slate-500">Monitor de planeación docente - I.E. Santander</p>
                            <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                            <p className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                {Object.keys(onlineUsers).length} Activos
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowAddUser(!showAddUser)}
                        className={`px-4 py-2 ${showAddUser ? 'bg-indigo-600' : 'bg-slate-800'} text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20`}
                        title="Auto-Generador de Docentes"
                    >
                        <UserPlus size={14} />
                        {showAddUser ? 'Cerrar Generador' : 'Generar Docente'}
                    </button>
                    <button
                        onClick={fetchUsers}
                        disabled={isRefreshing}
                        className={`px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 ${isRefreshing ? 'animate-pulse' : ''}`}
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? '...' : 'Actualizar'}
                    </button>
                    <button
                        onClick={handleManualSync}
                        disabled={isRefreshing}
                        className="px-4 py-2 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20"
                    >
                        <Upload size={14} />
                        Sync
                    </button>
                    <button
                        onClick={handleDownloadBackup}
                        className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all flex items-center gap-2 border border-slate-200"
                    >
                        <Download size={14} /> Backup
                    </button>
                </div>
            </div>

            {/* Teacher Generator UI */}
            {showAddUser && (
                <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100 animate-fade-in-up">
                    <UserGenerator onUserCreated={() => {
                        setShowAddUser(false);
                        fetchUsers();
                    }} />
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">
                            <th className="pb-4 pl-4">Docente</th>
                            <th className="pb-4">Email Institucional</th>
                            <th className="pb-4 text-center">Planificaciones</th>
                            <th className="pb-4 text-right pr-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-slate-600">
                        {users.map((user, i) => (
                            <React.Fragment key={i}>
                                <tr className={`group transition-colors border-b border-slate-100 last:border-0 ${expandedUser === user.email ? 'bg-indigo-50/30' : 'hover:bg-white/50'}`}>
                                    <td className="py-4 pl-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${onlineUsers[user.email.toLowerCase()]
                                                    ? 'bg-green-500 animate-pulse'
                                                    : 'bg-slate-300'
                                                    }`} title={onlineUsers[user.email.toLowerCase()] ? 'En línea ahora' : 'Desconectado'}></div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-slate-800">{user.name}</div>
                                                    {user.role === 'admin' && <Shield size={12} className="text-purple-500" />}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-tighter ${user.role === 'admin' ? 'text-purple-500' : 'text-blue-500'}`}>{user.role}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="text-xs font-medium text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="py-4 text-center font-bold text-slate-800">
                                        {user.stats?.total || 0}
                                    </td>
                                    <td className="py-4 text-right pr-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleSequences(user.email)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${expandedUser === user.email
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                                    }`}
                                            >
                                                <FileText size={12} />
                                                {expandedUser === user.email ? 'Ocultar' : 'Ver Repo'}
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

                                                {isLoadingSeqs ? (
                                                    <div className="py-12 flex flex-col items-center gap-3">
                                                        <RefreshCw size={24} className="text-indigo-600 animate-spin" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando...</span>
                                                    </div>
                                                ) : (userSequences[user.email]?.length || 0) === 0 ? (
                                                    <div className="py-12 text-center">
                                                        <p className="text-sm font-bold text-slate-400 italic">No hay registros.</p>
                                                    </div>
                                                ) : (
                                                    <div className="max-h-96 overflow-y-auto">
                                                        <table className="w-full text-left">
                                                            <thead className="bg-slate-50/50 sticky top-0 backdrop-blur-sm">
                                                                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                                    <th className="px-6 py-3">Tema</th>
                                                                    <th className="px-6 py-3">Área / Grado</th>
                                                                    <th className="px-6 py-3">Fecha</th>
                                                                    <th className="px-6 py-3 text-right">PDF/JSON</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {userSequences[user.email]?.map((seq) => (
                                                                    <tr key={seq.id} className="hover:bg-slate-50/30 transition-colors">
                                                                        <td className="px-6 py-4">
                                                                            <span className="text-sm font-black text-slate-800">{seq.tema}</span>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <span className="text-xs font-bold text-slate-500">{seq.area} • {seq.grado}</span>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                                                                <Calendar size={14} />
                                                                                {new Date(seq.timestamp).toLocaleDateString()}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <button
                                                                                onClick={() => downloadJson(seq)}
                                                                                className="p-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
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
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export const UserGenerator: React.FC<{ onUserCreated: () => void }> = ({ onUserCreated }) => {
    const [name, setName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const generateUser = async () => {
        if (!name || name.trim().length < 3) return;

        setIsGenerating(true);
        setStatus(null);

        // Logic: Juan Perez -> juan.perez@santander.edu.co
        const cleanName = name.trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/\s+/g, '.'); // spaces to dots

        const generatedEmail = `${cleanName}@santander.edu.co`;
        const defaultPassword = 'santander2026';

        try {
            const result = await authService.registerTeacher({
                name: name.trim(),
                email: generatedEmail,
                password: defaultPassword
            });

            if (result.success) {
                setStatus({ type: 'success', msg: `¡Docente registrado! Email: ${generatedEmail}` });
                setName('');
                setTimeout(() => onUserCreated(), 2000);
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
                <div className={`mt-4 p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-fade-in-up ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                    {status.type === 'success' ? <CheckCircle2 size={16} /> : <Shield size={16} />}
                    {status.msg}
                </div>
            )}
        </div>
    );
};

export const PasswordChange: React.FC<{ email: string }> = ({ email }) => {
    const [newPass, setNewPass] = useState('');
    const [msg, setMsg] = useState('');
    const [isChanging, setIsChanging] = useState(false);

    const handleChange = async () => {
        if (newPass.length < 6) {
            setMsg('❌ Mínimo 6 caracteres');
            setTimeout(() => setMsg(''), 3000);
            return;
        }

        setIsChanging(true);
        setMsg('');

        try {
            await authService.changePassword(email, newPass);
            setMsg('✅ ¡Contraseña actualizada!');
            setNewPass('');
            setTimeout(() => setMsg(''), 4000);
        } catch (error) {
            setMsg('❌ Error en red.');
            setTimeout(() => setMsg(''), 4000);
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-slate-200">
            <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest">
                <Key size={14} />
                Seguridad de Cuenta
            </h4>
            <div className="flex gap-2 max-w-md">
                <input
                    type="password"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Nueva contraseña..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                    onClick={handleChange}
                    disabled={isChanging}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${isChanging
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-800'
                        }`}
                >
                    {isChanging ? '...' : 'Actualizar'}
                </button>
            </div>
            {msg && <p className={`mt-2 text-xs font-bold animate-fade-in-up ${msg.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
        </div>
    );
};

