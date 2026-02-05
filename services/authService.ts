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
        total: number;
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

    // --- USAGE TRACKING (STATS) ---
    logUsage: async (email: string) => {
        // 1. Local Log
        const key = `guaimaral_stats_${email.toLowerCase()}`;
        const currentLog = JSON.parse(localStorage.getItem(key) || '[]');
        currentLog.push(Date.now());
        localStorage.setItem(key, JSON.stringify(currentLog));

        // 2. Cloud Log (Supabase)
        if (supabase) {
            try {
                const { error } = await supabase.from('usage_logs').insert([
                    { user_email: email, action: 'Generó Secuencia' }
                ]);
                if (error) {
                    console.error("❌ Supabase Log Error:", error.message);
                    console.warn("Verifica que las políticas RLS y el Realtime estén activos.");
                } else {
                    console.log("✅ Actividad guardada en la nube para:", email);
                }
            } catch (e) {
                console.error("❌ System Log Error", e);
            }
        } else {
            console.warn("⚠️ Supabase no está configurado. La actividad solo se guardará localmente.");
        }
    },

    getUsageStats: async (email: string) => {
        // Prefer Cloud Data if available
        if (supabase) {
            try {
                const now = new Date();
                const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                const weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

                // Get Total
                const { count: total } = await supabase
                    .from('usage_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_email', email);

                // Get Today
                const { count: today } = await supabase
                    .from('usage_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_email', email)
                    .gte('timestamp', dayStart);

                // Get Week
                const { count: week } = await supabase
                    .from('usage_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_email', email)
                    .gte('timestamp', weekStart);

                // Get Month
                const { count: month } = await supabase
                    .from('usage_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_email', email)
                    .gte('timestamp', monthStart);

                return {
                    today: today || 0,
                    week: week || 0,
                    month: month || 0,
                    total: total || 0
                };

            } catch (e) { console.error("Cloud Stats Error", e); }
        }

        return authService.getLocalUsageStats(email);
    },

    getLocalUsageStats: (email: string) => {
        const key = `guaimaral_stats_${email.toLowerCase()}`;
        const timestamps: number[] = JSON.parse(localStorage.getItem(key) || '[]');
        const now = new Date();

        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const weekStart = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        return {
            today: timestamps.filter(t => t >= dayStart).length,
            week: timestamps.filter(t => t >= weekStart).length,
            month: timestamps.filter(t => t >= monthStart).length,
            total: timestamps.length
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
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.ROLE);
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

    getUserStorageKey: (baseKey: string): string => {
        const user = authService.getCurrentUser();
        if (!user) return baseKey;
        // Create a simple alphanumeric hash from email for the key
        const hash = user.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16);
        return `${baseKey}_${hash}`;
    }
};
