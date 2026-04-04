import { Cpu, Zap, Info, BarChart } from 'lucide-react';
import { modelHealthStatus as groqHealth, apiMetrics as groqMetrics } from '../services/groqService';
import { modelHealthStatus as geminiHealth, apiMetrics as geminiMetrics } from '../services/geminiService';
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const ApiStats: React.FC = () => {
    // Combine health status and metrics
    const modelHealthStatus = { ...groqHealth, ...geminiHealth };
    const apiMetrics = { ...groqMetrics, ...geminiMetrics };

    // Force re-render periodically for local metrics
    const [, setTick] = useState(0);
    const [cloudMetrics, setCloudMetrics] = useState<any>(null);

    const fetchGlobalMetrics = async () => {
        if (!supabase) return;

        try {
            const labels = ["Groq", "Laura", "México", "Yarelis"];
            const newCloudMetrics: any = {};
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

            for (const label of labels) {
                // Total success
                const { count: success } = await supabase
                    .from('api_key_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('key_name', label)
                    .eq('status', 'success');

                // Total errors
                const { count: errors } = await supabase
                    .from('api_key_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('key_name', label)
                    .eq('status', 'error');

                // Today success
                const { count: todaySuccess } = await supabase
                    .from('api_key_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('key_name', label)
                    .eq('status', 'success')
                    .gte('timestamp', todayStart);

                // Last Action
                const { data: lastActionData } = await supabase
                    .from('api_key_logs')
                    .select('timestamp, action')
                    .eq('key_name', label)
                    .order('timestamp', { ascending: false })
                    .limit(1)
                    .single();

                newCloudMetrics[label] = {
                    success: success || 0,
                    errors: errors || 0,
                    today: todaySuccess || 0,
                    requests: (success || 0) + (errors || 0),
                    lastUsed: lastActionData ? new Date(lastActionData.timestamp).toLocaleTimeString() : "---",
                    lastAction: lastActionData?.action || "---"
                };
            }
            setCloudMetrics(newCloudMetrics);
        } catch (e) {
            console.error("Error fetching global API metrics:", e);
        }
    };

    useEffect(() => {
        fetchGlobalMetrics();
        const interval = setInterval(() => setTick(t => t + 1), 5000);

        if (supabase) {
            const channel = supabase
                .channel('api-monitor')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'api_key_logs' }, () => {
                    fetchGlobalMetrics();
                })
                .subscribe();

            return () => {
                clearInterval(interval);
                supabase.removeChannel(channel);
            };
        }

        return () => clearInterval(interval);
    }, []);

    const keys = Object.keys(apiMetrics) as (keyof typeof apiMetrics)[];
    const labels = ["Groq Main", "Laura", "México", "Yarelis"];

    return (
        <div className="w-full mb-12 animate-fade-in-up relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-indigo-400 shadow-xl group-hover:border-indigo-500/30 transition-all duration-500">
                        <Cpu size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-white tracking-tight leading-none">Monitor Neuronal Pro</h3>
                            <div className="bg-indigo-500/10 text-indigo-400 text-[9px] font-black px-2.5 py-1 rounded border border-indigo-500/20 animate-pulse uppercase tracking-[2px]">Real-time Status</div>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                            {Object.entries(modelHealthStatus).map(([name, status]) => (
                                <div key={name} className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{name.split('-').slice(1).join('-')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 px-5 py-3 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-right">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Capa de Servicio</div>
                        <div className="text-[11px] font-black text-emerald-400">OPERATIVO</div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10 mb-12">
                {keys.map((keyName, i) => {
                    const label = labels[i];
                    const metrics = (cloudMetrics && cloudMetrics[label]) ? cloudMetrics[label] : { ...apiMetrics[keyName], today: 0, lastAction: "---" };
                    const successRate = metrics.requests > 0 ? (metrics.success / metrics.requests) * 100 : 0;

                    return (
                        <div key={i} className="bg-[#0f0f11] border border-white/5 p-6 rounded-xl hover:border-white/20 transition-all duration-300 group/card relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[2px]">Engine: {labels[i]}</span>
                                <Zap size={14} className={metrics.errors > 2 ? "text-red-500" : "text-indigo-400"} />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Éxitos [Today]</span>
                                    <div className="text-3xl font-black text-white lining-nums">{metrics.today}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-0.5">Total Hist.</span>
                                        <div className="text-sm font-bold text-slate-300">{metrics.success}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-0.5">Uptime %</span>
                                        <div className="text-sm font-bold text-indigo-400">{successRate.toFixed(1)}%</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                                <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <BarChart size={10} /> {metrics.requests} Req
                                </span>
                                <span className="text-[8px] font-bold text-indigo-500">{metrics.lastUsed || "---"}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-[2px] bg-white/5 px-4 py-2 rounded border border-white/5">
                    <Info size={14} className="text-indigo-400" />
                    <span>Persistencia Global (Supabase Realtime Synchronization)</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">System Health:</span>
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-4 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                                <div className="w-full h-full bg-emerald-500 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
