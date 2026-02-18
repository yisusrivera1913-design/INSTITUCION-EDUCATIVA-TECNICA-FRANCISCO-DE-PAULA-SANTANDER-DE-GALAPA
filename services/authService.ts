import { supabase } from './supabaseClient';

/**
 * AuthService (Híbrido: Local + Supabase)
 * 1. Intenta conectar con Nube (Supabase) para estadísticas y contraseñas centralizadas.
 * 2. Si falla o no hay conexión, usa LocalStorage (Modo Offline/Privado).
 */

const STORAGE_KEYS = {
    AUTH: 'guaimaral_auth_v2',
    USER: 'guaimaral_user_v2',
    ROLE: 'guaimaral_role_v2'
};

const SALT = 'guaimaral-2026-secure-v2';

// Simple XOR obfuscation with UTF-8 support
const obfuscate = (text: string): string => {
    const utf8Text = unescape(encodeURIComponent(text));
    const result = utf8Text.split('').map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length))
    ).join('');
    return btoa(result);
};

const deobfuscate = (encoded: string): string => {
    try {
        const text = atob(encoded);
        const deobfuscated = text.split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length))
        ).join('');
        return decodeURIComponent(escape(deobfuscated));
    } catch (e) {
        return '';
    }
};

export interface User {
    name: string;
    email: string;
    role: 'admin' | 'docente';
    stats?: {
        today: number;
        week: number;
        month: number;
        year: number;
        total: number;
        saved: number;
    };
}

// Usuarios locales de respaldo (Solo si falla la nube)
export const AUTHORIZED_USERS: User[] = [
    // Administrador
    { name: 'Admin', email: 'admin@guaimaral.edu.co', role: 'admin' },

    // Guaimaral Bachillerato (Orden Alfabético)
    { name: 'Alex San Juan', email: 'alex.sanjuan@guaimaral.edu.co', role: 'docente' },
    { name: 'Deisy Arroyo', email: 'deisy.arroyo@guaimaral.edu.co', role: 'docente' },
    { name: 'Jairo Blanco', email: 'jairo.blanco@guaimaral.edu.co', role: 'docente' },
    { name: 'Liliana Valle', email: 'liliana.valle@guaimaral.edu.co', role: 'docente' },
    { name: 'Paula Padilla', email: 'paula.padilla@guaimaral.edu.co', role: 'docente' },
    { name: 'Rocio Ramírez', email: 'rocio.ramirez@guaimaral.edu.co', role: 'docente' },

    // Guaimaral Primaria (Orden Alfabético)
    { name: 'Aleida Lara', email: 'aleida.lara@guaimaral.edu.co', role: 'docente' },
    { name: 'Alfredo Torres', email: 'alfredo.torres@guaimaral.edu.co', role: 'docente' },
    { name: 'Asterio Torres', email: 'asterio.torres@guaimaral.edu.co', role: 'docente' },
    { name: 'Carlos Sandoval', email: 'carlos.sandoval@guaimaral.edu.co', role: 'docente' },
    { name: 'Deisy Mercado', email: 'deisy.mercado@guaimaral.edu.co', role: 'docente' },
    { name: 'Eduardo', email: 'eduardo@guaimaral.edu.co', role: 'docente' },
    { name: 'Evaristo Vertel', email: 'evaristo.vertel@guaimaral.edu.co', role: 'docente' },
    { name: 'Ibeth Charris', email: 'ibeth.charris@guaimaral.edu.co', role: 'docente' },
    { name: 'Jairo Benavides', email: 'jairo.benavides@guaimaral.edu.co', role: 'docente' },
    { name: 'Jorge de la Hoz', email: 'jorge.delahoz@guaimaral.edu.co', role: 'docente' },
    { name: 'Jorge Ferrer', email: 'jorge.ferrer@guaimaral.edu.co', role: 'docente' },
    { name: 'Leovigilda Navarro', email: 'leovigilda.navarro@guaimaral.edu.co', role: 'docente' },
    { name: 'Linda Varela', email: 'linda.varela@guaimaral.edu.co', role: 'docente' },
    { name: 'Martín Celin', email: 'martin.celin@guaimaral.edu.co', role: 'docente' },
    { name: 'Nancy Vargas', email: 'nancy.vargas@guaimaral.edu.co', role: 'docente' },
    { name: 'Pedro Arroyo', email: 'pedro.arroyo@guaimaral.edu.co', role: 'docente' },
    { name: 'Roberto Daza', email: 'roberto.daza@guaimaral.edu.co', role: 'docente' },
    { name: 'Xilena Santiago', email: 'xilena.santiago@guaimaral.edu.co', role: 'docente' }
];

export const authService = {
    // --- PASSWORD MANAGEMENT ---
    changePassword: async (email: string, newPass: string) => {
        // 1. Local
        const key = `guaimaral_pwd_${email.toLowerCase()}`;
        localStorage.setItem(key, obfuscate(newPass));

        // 2. Cloud (Supabase)
        if (supabase) {
            try {
                // Upsert user password in cloud
                const { error } = await supabase
                    .from('app_users')
                    .update({ password: obfuscate(newPass) })
                    .eq('email', email);

                if (error) console.warn("Cloud Pwd Update Error:", error);
            } catch (e) { console.error(e); }
        }
    },

    verifyPassword: async (email: string, inputPass: string, role?: string): Promise<boolean> => {
        // A. Check Local Overrides First
        const customPassEnc = localStorage.getItem(`guaimaral_pwd_${email.toLowerCase()}`);
        if (customPassEnc) {
            return deobfuscate(customPassEnc) === inputPass;
        }

        // B. Check Cloud (Supabase)
        if (supabase) {
            const { data } = await supabase
                .from('app_users')
                .select('password')
                .eq('email', email)
                .single();

            if (data && data.password) {
                // Try deobfuscate from cloud storage
                try {
                    const cloudPass = deobfuscate(data.password);
                    if (cloudPass === inputPass) return true;
                    // If obfuscation fails (maybe plaintext in db?), check direct
                    if (data.password === inputPass) return true;
                } catch (e) {
                    if (data.password === inputPass) return true;
                }
            }
        }

        // C. Default Hardcoded Passwords
        if (role === 'admin') return inputPass === 'admin2026';
        if (email === 'docente@guaimaral.edu.co') return inputPass === '123456';
        return inputPass === 'guaimaral2026';
    },

    login: async (email: string, password: string): Promise<User | null> => {
        // 1. First, check if user exists in Supabase to get the real name
        let cloudUser: User | null = null;
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('app_users')
                    .select('name, email, role')
                    .eq('email', email.toLowerCase())
                    .single();

                if (data && !error) {
                    cloudUser = {
                        name: data.name,
                        email: data.email,
                        role: data.role as 'admin' | 'docente'
                    };
                }
            } catch (e) {
                console.error("Cloud login fetch error:", e);
            }
        }

        // 2. Fallback to hardcoded list if cloud fetch fails
        let user = cloudUser || AUTHORIZED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user) {
            const isValid = await authService.verifyPassword(email, password, user.role);
            if (isValid) {
                // Ensure we use the latest name from cloud if we found one
                const finalUser = cloudUser || user;
                localStorage.setItem(STORAGE_KEYS.AUTH, obfuscate('true'));
                localStorage.setItem(STORAGE_KEYS.USER, obfuscate(JSON.stringify(finalUser)));
                console.log('✅ Sesión guardada para:', finalUser.email);
                return finalUser;
            }
        }
        return null;
    },

    // --- GENERATED SEQUENCES PERSISTENCE & LOGGING ---
    saveAndLogSequence: async (user: User, sequence: any, details: { grade: string, area: string, theme: string }) => {
        const email = user.email.toLowerCase().trim();
        const actionText = `Generó: ${details.theme} (${details.area} - ${details.grade})`;

        // 1. Respaldo Local (Inmediato)
        try {
            const statsKey = `guaimaral_stats_${email}`;
            const seqKey = `guaimaral_saved_sequences_${email}`;

            const stats = JSON.parse(localStorage.getItem(statsKey) || '[]');
            stats.push({ timestamp: Date.now(), action: actionText });
            localStorage.setItem(statsKey, JSON.stringify(stats));

            const seqs = JSON.parse(localStorage.getItem(seqKey) || '[]');
            seqs.push({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                grade: details.grade,
                area: details.area,
                theme: details.theme,
                content: sequence
            });
            localStorage.setItem(seqKey, JSON.stringify(seqs));
        } catch (e) {
            console.warn("⚠️ Local storage backup failed");
        }

        // 2. Nube (Prioridad para el Rector)
        if (supabase) {
            try {
                // A. Registro en Log de Uso (Para Hoy/Mes/Año)
                const { error: logErr } = await supabase.from('usage_logs').insert([{
                    user_email: email,
                    action: actionText
                }]);
                if (logErr) console.error("❌ Error Log Nube:", logErr.message);

                // B. Guardado en Repositorio (Para Docs Guardados)
                const { error: seqErr } = await supabase.from('generated_sequences').insert([{
                    user_email: email,
                    grado: details.grade,
                    area: details.area,
                    tema: details.theme,
                    content: sequence
                }]);
                if (seqErr) console.error("❌ Error Repositorio Nube:", seqErr.message);

                if (!logErr && !seqErr) console.log("🚀 [Sync] Éxito Total en la Nube");
            } catch (e) {
                console.error("❌ Fallo crítico de sincronización:", e);
            }
        }
    },

    getAllSequences: async () => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('generated_sequences')
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) {
                console.error("Error fetching all sequences:", error);
                return [];
            }
            return data || [];
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    getUsageStats: async (email: string) => {
        const lowEmail = email.toLowerCase().trim();

        if (supabase) {
            try {
                const now = new Date();

                // Inicios de periodos robustos
                const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

                // 1. Acumulado Histórico (Logs de actividad)
                const { count: logTotal } = await supabase.from('usage_logs').select('id', { count: 'exact', head: true }).eq('user_email', lowEmail);

                // 2. Hoy (Docs o Logs de hoy)
                const { count: todayLogs } = await supabase.from('usage_logs').select('id', { count: 'exact', head: true }).eq('user_email', lowEmail).gte('timestamp', dayStart);
                const { count: todayDocs } = await supabase.from('generated_sequences').select('id', { count: 'exact', head: true }).eq('user_email', lowEmail).gte('timestamp', dayStart);

                // 3. Mes (Logs o Docs de este mes)
                const { count: monthLogs } = await supabase.from('usage_logs').select('id', { count: 'exact', head: true }).eq('user_email', lowEmail).gte('timestamp', monthStart);
                const { count: monthDocs } = await supabase.from('generated_sequences').select('id', { count: 'exact', head: true }).eq('user_email', lowEmail).gte('timestamp', monthStart);

                // 4. Año (Histórico total en realidad para migración)
                const { count: totalDocs } = await supabase.from('generated_sequences').select('id', { count: 'exact', head: true }).eq('user_email', lowEmail);

                // 5. Acumulado Real (Suma de lo que hay en repositorio + posibles logs huérfanos)
                const finalTotal = (logTotal || 0) > (totalDocs || 0) ? (logTotal || 0) : (totalDocs || 0);

                return {
                    today: Math.max(todayLogs || 0, todayDocs || 0),
                    week: 0,
                    month: Math.max(monthLogs || 0, monthDocs || 0),
                    year: totalDocs || 0, // Migramos todo lo guardado al contador de año para que se vea
                    total: finalTotal,
                    saved: totalDocs || 0
                };
            } catch (e) { console.error("Cloud stats logic error", e); }
        }

        const local = authService.getLocalUsageStats(email);
        return {
            ...local,
            year: local.year || local.month,
            saved: local.saved || 0
        };
    },

    getLocalUsageStats: (email: string) => {
        const key = `guaimaral_stats_${email.toLowerCase()}`;
        const logs: any[] = JSON.parse(localStorage.getItem(key) || '[]');
        const now = new Date();

        const timestamps = logs.map(l => typeof l === 'number' ? l : l.timestamp);

        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const weekStart = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

        const localSavedKey = `guaimaral_saved_sequences_${email.toLowerCase()}`;
        const savedCount = JSON.parse(localStorage.getItem(localSavedKey) || '[]').length;

        return {
            today: timestamps.filter(t => t >= dayStart).length,
            week: timestamps.filter(t => t >= weekStart).length,
            month: timestamps.filter(t => t >= monthStart).length,
            year: timestamps.filter(t => t >= yearStart).length,
            total: timestamps.length,
            saved: savedCount
        };
    },

    getAllUsersWithStats: async () => {
        let userList = [...AUTHORIZED_USERS];

        if (supabase) {
            try {
                const { data } = await supabase
                    .from('app_users')
                    .select('name, email, role');

                if (data && data.length > 0) {
                    // Start with cloud users
                    const cloudUsers: User[] = data.map(u => ({
                        name: u.name,
                        email: u.email,
                        role: u.role as 'admin' | 'docente'
                    }));

                    // Merge: Keep all unique by email
                    const emailMap = new Map();
                    [...userList, ...cloudUsers].forEach(u => emailMap.set(u.email.toLowerCase(), u));
                    userList = Array.from(emailMap.values());
                }
            } catch (e) {
                console.error("Error fetching cloud users:", e);
            }
        }

        const usersWithStats = await Promise.all(userList.map(async (user) => ({
            ...user,
            stats: await authService.getUsageStats(user.email)
        })));
        return usersWithStats;
    },

    logout: () => {
        // Limpiar Presencia al salir
        if (authService._hb) clearInterval(authService._hb);
        if (authService._presenceChannel) {
            authService._presenceChannel.unsubscribe();
            authService._presenceChannel = null;
        }
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.ROLE);
        window.location.reload(); // Recarga limpia para resetear singletons
    },

    isAuthenticated: (): boolean => {
        const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        const isAuth = (auth && user) ? deobfuscate(auth) === 'true' : false;
        console.log('🔍 Verificando sesión:', isAuth ? '✅ Sesión activa' : '❌ No hay sesión');
        return isAuth;
    },

    getCurrentUser: (): User | null => {
        const userJson = localStorage.getItem(STORAGE_KEYS.USER);
        if (!userJson) return null;
        try {
            return JSON.parse(deobfuscate(userJson));
        } catch (e) {
            return null;
        }
    },

    // --- MIGRACIÓN: LOCAL -> NUBE ---
    migrationLocalToCloud: async () => {
        if (!supabase) return { success: false, message: "Sin conexión a la nube" };
        const user = authService.getCurrentUser();
        if (!user) return { success: false, message: "No hay usuario activo" };

        const email = user.email.toLowerCase();
        let syncedCount = 0;

        try {
            // A. Sincronizar Secuencias Guardadas
            const seqKey = `guaimaral_saved_sequences_${email}`;
            const localSeqs = JSON.parse(localStorage.getItem(seqKey) || '[]');

            // Ver qué hay ya en la nube para no duplicar
            const { data: cloudSeqs } = await supabase.from('generated_sequences').select('tema').eq('user_email', email);
            const cloudTemas = new Set((cloudSeqs || []).map(s => s.tema));

            for (const s of localSeqs) {
                if (!cloudTemas.has(s.theme)) {
                    await supabase.from('generated_sequences').insert([{
                        user_email: email,
                        grado: s.grade,
                        area: s.area,
                        tema: s.theme,
                        content: s.content
                    }]);

                    // También crear un log de actividad retroactivo
                    await supabase.from('usage_logs').insert([{
                        user_email: email,
                        action: `Migración Local: ${s.theme}`
                    }]);

                    syncedCount++;
                }
            }

            console.log(`✅ [Migración] ${syncedCount} secuencias sincronizadas con éxito.`);
            return { success: true, count: syncedCount };
        } catch (e) {
            console.error("❌ Error en migración:", e);
            return { success: false, message: "Fallo técnico en migración" };
        }
    },

    getUserStorageKey: (baseKey: string): string => {
        const user = authService.getCurrentUser();
        if (!user) return baseKey;
        // Create a simple alphanumeric hash from email for the key
        const hash = user.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16);
        return `${baseKey}_${hash}`;
    },

    // --- REAL-TIME PRESENCE (PRESENCE MANAGER) ---
    _presenceChannel: null as any,
    _presenceState: {} as Record<string, any>,
    _presenceListeners: [] as ((state: any) => void)[],
    _hb: null as any,

    trackPresence: (user: User, onSync?: (state: any) => void) => {
        if (!supabase) return null;
        const lowEmail = user.email.toLowerCase();

        // 1. Manejo de Listeners
        let listenerWrapper: ((state: any) => void) | null = null;
        if (onSync) {
            listenerWrapper = (state: any) => onSync(state);
            authService._presenceListeners.push(listenerWrapper);
        }

        const notifyAll = () => {
            if (!authService._presenceChannel) return;
            const state = authService._presenceChannel.presenceState();
            authService._presenceState = state;
            authService._presenceListeners.forEach(l => l(state));
        };

        // 2. Inicialización del Canal (Nuclear Singleton)
        if (!authService._presenceChannel || (authService as any)._currentEmail !== lowEmail) {
            console.log('🚀 [Presence] Reiniciando canal para:', lowEmail);

            if (authService._hb) clearInterval(authService._hb);
            if (authService._presenceChannel) authService._presenceChannel.unsubscribe();

            (authService as any)._currentEmail = lowEmail;

            const channel = supabase.channel('online-users', {
                config: { presence: { key: lowEmail } }
            });

            authService._presenceChannel = channel;

            const updateTrack = async () => {
                try {
                    await channel.track({
                        name: user.name,
                        role: user.role,
                        email: lowEmail,
                        ts: Date.now()
                    });
                } catch (e) { }
            };

            channel
                .on('presence', { event: 'sync' }, notifyAll)
                .on('presence', { event: 'join' }, ({ key }) => {
                    console.log('🟢 [Presence] Alguien entró:', key);
                    notifyAll();
                })
                .on('presence', { event: 'leave' }, ({ key }) => {
                    console.log('🔴 [Presence] Alguien salió:', key);
                    notifyAll();
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await updateTrack();
                        if (authService._hb) clearInterval(authService._hb);
                        authService._hb = setInterval(updateTrack, 15000);
                    }
                });
        } else {
            // Si ya existe el canal, notificar inmediatamente al nuevo listener
            if (onSync) onSync(authService._presenceChannel.presenceState());
        }

        // Devolver un objeto que simule el canal pero maneje el unsubscribe del listener solamente
        return {
            unsubscribe: () => {
                if (listenerWrapper) {
                    authService._presenceListeners = authService._presenceListeners.filter(l => l !== listenerWrapper);
                }
            },
            presenceState: () => authService._presenceChannel?.presenceState() || {}
        };
    }
};
