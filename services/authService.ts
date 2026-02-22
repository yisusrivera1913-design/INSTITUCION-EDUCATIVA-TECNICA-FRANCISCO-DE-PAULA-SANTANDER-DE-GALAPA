import { supabase } from './supabaseClient';

/**
 * AuthService (Híbrido: Local + Supabase)
 * 1. Intenta conectar con Nube (Supabase) para estadísticas y contraseñas centralizadas.
 * 2. Si falla o no hay conexión, usa LocalStorage (Modo Offline/Privado).
 */

const STORAGE_KEYS = {
    AUTH: 'santander_auth_v1',
    USER: 'santander_user_v1',
    ROLE: 'santander_role_v1'
};

const SALT = 'santander-2026-secure-v1';

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
    assigned_grades?: string[];
    assigned_subjects?: string[];
    session_id?: string;
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
    { name: 'Admin Santander', email: 'admin@santander.edu.co', role: 'admin' },
    // Docente de Prueba
    { name: 'Docente Demo', email: 'docente.demo@santander.edu.co', role: 'docente' },
];

export const authService = {
    // --- PASSWORD MANAGEMENT ---
    changePassword: async (email: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
        const lowEmail = email.toLowerCase().trim();
        const obfuscatedPassword = obfuscate(newPass);

        // 1. Cloud Update (Supabase) - Priority
        if (supabase) {
            try {
                const { error } = await supabase
                    .from('app_users')
                    .update({ password: obfuscatedPassword })
                    .eq('email', lowEmail);

                if (error) {
                    console.error("Cloud Pwd Update Error:", error);
                    return { success: false, message: `Error en nube: ${error.message}` };
                }
            } catch (e: any) {
                console.error(e);
                return { success: false, message: "Fallo de conexión con la base de datos cloud." };
            }
        }

        // 2. Local Update (Fallback/Sync)
        try {
            const key = `santander_pwd_${lowEmail}`;
            localStorage.setItem(key, obfuscatedPassword);

            // Also update current session if the user is changing their own password
            const currentUser = authService.getCurrentUser();
            if (currentUser && currentUser.email.toLowerCase() === lowEmail) {
                // We keep the same user object, but we could update flags here if needed
                console.log("🔒 Password updated in current active session.");
            }

            return { success: true };
        } catch (e) {
            return { success: false, message: "Error al guardar localmente." };
        }
    },

    verifyPassword: async (email: string, inputPass: string, role?: string): Promise<boolean> => {
        // A. Check Local Overrides First
        const customPassEnc = localStorage.getItem(`santander_pwd_${email.toLowerCase()}`);
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
                } catch (e) {
                    if (data.password === inputPass) return true;
                }
            }
        }

        // C. Default Hardcoded Passwords
        if (role === 'admin') return inputPass === 'admin2026';
        return inputPass === 'santander2026';
    },


    login: async (email: string, password: string): Promise<User | null> => {
        // 1. First, check if user exists in Supabase to get the real name
        let cloudUser: User | null = null;
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('app_users')
                    .select('name, email, role, assigned_grades, assigned_subjects')
                    .eq('email', email.toLowerCase())
                    .single();

                if (data && !error) {
                    cloudUser = {
                        name: data.name,
                        email: data.email,
                        role: data.role as 'admin' | 'docente',
                        assigned_grades: data.assigned_grades || [],
                        assigned_subjects: data.assigned_subjects || []
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
                const newSessionId = crypto.randomUUID();
                const finalUser = { ...(cloudUser || user), session_id: newSessionId };

                // Update session in cloud for single-session enforcement
                if (supabase) {
                    await supabase
                        .from('app_users')
                        .update({ session_id: newSessionId })
                        .eq('email', email.toLowerCase());
                }

                localStorage.setItem(STORAGE_KEYS.AUTH, obfuscate('true'));
                localStorage.setItem(STORAGE_KEYS.USER, obfuscate(JSON.stringify(finalUser)));
                console.log('✅ Sesión única activada para:', finalUser.email);
                return finalUser;
            }
        }
        return null;
    },

    registerTeacher: async (teacher: { name: string, email: string, password?: string, assigned_grades?: string[], assigned_subjects?: string[] }) => {
        const passwordToSend = teacher.password || 'santander2026';
        const obfuscatedPassword = obfuscate(passwordToSend);

        // 1. Local Persistence (for backup)
        const key = `santander_pwd_${teacher.email.toLowerCase()}`;
        localStorage.setItem(key, obfuscatedPassword);

        // 2. Cloud Persistence (Supabase)
        if (supabase) {
            try {
                const { error } = await supabase
                    .from('app_users')
                    .upsert({
                        name: teacher.name,
                        email: teacher.email.toLowerCase(),
                        role: 'docente',
                        password: obfuscatedPassword,
                        assigned_grades: teacher.assigned_grades || [],
                        assigned_subjects: teacher.assigned_subjects || []
                    });

                if (error) throw error;
                return { success: true };
            } catch (e: any) {
                console.error("Reg Error:", e);
                return { success: false, message: e.message };
            }
        }
        return { success: true };
    },

    deleteUser: async (email: string) => {
        // 1. Local
        localStorage.removeItem(`santander_pwd_${email.toLowerCase()}`);

        // 2. Cloud (Supabase)
        if (supabase) {
            try {
                const { error } = await supabase
                    .from('app_users')
                    .delete()
                    .eq('email', email.toLowerCase());

                if (error) throw error;
                return { success: true };
            } catch (e: any) {
                console.error("Delete Error:", e);
                return { success: false, message: e.message };
            }
        }
        return { success: true };
    },

    // --- GENERATED SEQUENCES PERSISTENCE & LOGGING ---
    saveAndLogSequence: async (user: User, sequence: any, details: { grade: string, area: string, theme: string }) => {
        const email = user.email.toLowerCase().trim();
        const actionText = `Generó: ${details.theme} (${details.area} - ${details.grade})`;

        // 1. Respaldo Local (Inmediato)
        try {
            const statsKey = `santander_stats_${email}`;
            const seqKey = `santander_saved_sequences_${email}`;

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
        const key = `santander_stats_${email.toLowerCase()}`;
        const logs: any[] = JSON.parse(localStorage.getItem(key) || '[]');
        const now = new Date();

        const timestamps = logs.map(l => typeof l === 'number' ? l : l.timestamp);

        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const weekStart = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

        const localSavedKey = `santander_saved_sequences_${email.toLowerCase()}`;
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
                    .select('name, email, role, assigned_grades, assigned_subjects');

                if (data && data.length > 0) {
                    // Start with cloud users
                    const cloudUsers: User[] = data.map(u => ({
                        name: u.name,
                        email: u.email,
                        role: u.role as 'admin' | 'docente',
                        assigned_grades: u.assigned_grades || [],
                        assigned_subjects: u.assigned_subjects || []
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
            const seqKey = `santander_saved_sequences_${email}`;
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
    },

    updateUserAssignments: async (email: string, grades: string[], subjects: string[]): Promise<{ success: boolean; message?: string }> => {
        if (!supabase) return { success: false, message: "Sin conexión a la nube" };
        try {
            const { error } = await supabase
                .from('app_users')
                .update({
                    assigned_grades: grades,
                    assigned_subjects: subjects
                })
                .eq('email', email.toLowerCase());

            if (error) throw error;
            return { success: true };
        } catch (e: any) {
            console.error("Update Assignments Error:", e);
            return { success: false, message: e.message };
        }
    },

    refreshSession: async (): Promise<User | null> => {
        if (!supabase) return authService.getCurrentUser();

        const current = authService.getCurrentUser();
        if (!current) return null;

        try {
            const { data, error } = await supabase
                .from('app_users')
                .select('name, email, role, assigned_grades, assigned_subjects, session_id')
                .eq('email', current.email.toLowerCase())
                .single();

            if (data && !error) {
                // SESSION INTEGRITY CHECK
                if (current.session_id && data.session_id && current.session_id !== data.session_id) {
                    console.warn("🚨 [Security] Sesión duplicada detectada. Cerrando esta sesión.");
                    authService.logout();
                    return null;
                }

                const updatedUser: User = {
                    name: data.name,
                    email: data.email,
                    role: data.role as 'admin' | 'docente',
                    assigned_grades: data.assigned_grades || [],
                    assigned_subjects: data.assigned_subjects || [],
                    session_id: data.session_id || current.session_id
                };

                // Update local storage
                localStorage.setItem(STORAGE_KEYS.USER, obfuscate(JSON.stringify(updatedUser)));
                return updatedUser;
            }
        } catch (e) {
            console.error("Session refresh error:", e);
        }
        return current;
    }
};
