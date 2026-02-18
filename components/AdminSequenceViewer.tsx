import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { Database, FileText, Download, Calendar, User, Search, Trash2, Activity, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { User as UserType } from '../services/authService';

export const AdminSequenceViewer: React.FC<{ userEmail?: string }> = ({ userEmail }) => {
    const [sequences, setSequences] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState<any>(null);

    const loadData = async () => {
        setIsLoading(true);
        let seqData = await authService.getAllSequences();

        if (userEmail) {
            seqData = seqData.filter(s => s.user_email.toLowerCase() === userEmail.toLowerCase());
            // Cargar estadísticas también
            const s = await authService.getUsageStats(userEmail);
            setStats(s);
        }

        setSequences(seqData);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();

        // Realtime subscription para cambios en secuencias y logs
        if (supabase) {
            const channel = supabase
                .channel('admin-sequences')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_sequences' }, () => {
                    loadData();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'usage_logs' }, () => {
                    loadData();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, []);

    const filteredSequences = sequences.filter(s =>
        s.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.grado.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const downloadJson = (sequence: any) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sequence.content, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `secuencia_${sequence.tema}_${sequence.timestamp}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="w-full bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl mb-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
                        <Database size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">
                            {userEmail ? 'Mis Secuencias Guardadas' : 'Repositorio de Secuencias'}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            {userEmail ? 'Historial Personal' : 'Control Admin - Historial Global'}
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por profe o tema..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Teacher Stats Bar - Visible only when viewing personal history */}
            {userEmail && stats && (
                <div className="flex justify-center mb-10">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm flex items-center gap-6">
                        <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-200">
                            <Activity size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block mb-1">Total Secuencias Realizadas</span>
                            <div className="text-4xl font-black text-slate-800 tracking-tighter">{stats.total}</div>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredSequences.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold">No hay secuencias registradas aún.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Docente</th>
                                <th className="pb-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Tema / Área</th>
                                <th className="pb-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="pb-4 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredSequences.map((seq) => (
                                <tr key={seq.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <User size={14} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{seq.user_email}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{seq.tema}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{seq.grado} • {seq.area}</p>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-xs font-medium">{new Date(seq.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button
                                            onClick={() => downloadJson(seq)}
                                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm group-hover:scale-110"
                                            title="Descargar JSON"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Total Secuencias: {filteredSequences.length}</span>
                <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Sincronizado con Repositorio Central
                </span>
            </div>
        </div>
    );
};
