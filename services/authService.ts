import { supabase } from './supabaseClient';

/**
 * AuthService (Híbrido: Local + Supabase)
 * 1. Intenta conectar con Nube (Supabase) para estadísticas y contraseñas centralizadas.
 * 2. Si falla o no hay conexión, usa LocalStorage (Modo Offline/Privado).
 */

export const STORAGE_KEYS = {
    AUTH: 'sci_auth_v1',
    USER: 'sci_user_v1',
    ROLE: 'sci_role_v1'
};

const SALT = 'sci-2026-secure-v1';

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
    role: 'super_admin' | 'admin' | 'docente';
    // SaaS Multi-Colegio
    institucion_id?: string;
    nombre_institucion?: string;
    dominio_email?: string;
    config_visual?: {
        logo_url: string | null;
        color_primario: string;
        codigo_formato: string;
        modelo_pedagogico: string;
    };
    // Permisos académicos
    assigned_grades?: string[];
    assigned_subjects?: string[];
    session_id?: string;
    // Suscripción y Créditos
    plan_type?: 'free' | 'weekly' | 'monthly' | 'annual';
    credits?: number;
    subscription_expiry?: string;
    stats?: {
        today: number;
        week: number;
        month: number;
        year: number;
        total: number;
        saved: number;
    };
}

// Usuarios locales de respaldo (Solo si falla la nube o como root login)
export const AUTHORIZED_USERS: User[] = [
    { name: 'SCI Administrator', email: 'superadmin@sistemaclasesideal.com', role: 'super_admin' },
];

export const authService = {
    supabase, // Exponer el cliente para el listener
    STORAGE_KEYS, // Exponer llaves para consistencia
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
            const key = `sci_pwd_${lowEmail}`;
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
        const customPassEnc = localStorage.getItem(`sci_pwd_${email.toLowerCase()}`);
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
        return inputPass === '1913';
    },


    setCurrentUser: (user: User) => {
        localStorage.setItem(STORAGE_KEYS.USER, obfuscate(JSON.stringify(user)));
    },

    // --- GOOGLE OAUTH (PKCE Flow — sin hash en la URL) ---
    loginWithGoogle: async (institucionId?: string): Promise<{ error: string | null }> => {
        if (!supabase) return { error: 'Supabase no está configurado' };
        try {
            // Construir la URL de retorno: la raíz de la app actual
            const redirectTo = `${window.location.origin}/`;
            
            // Si viene de un colegio específico, guardarlo para el trigger
            if (institucionId) {
                localStorage.setItem('sci_pending_inst_id', institucionId);
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    scopes: 'email profile',
                    // Metadatos para el trigger de BD
                    queryParams: institucionId ? {
                        access_type: 'offline',
                        prompt: 'consent',
                    } : undefined
                }
            });
            
            if (error) return { error: error.message };
            return { error: null };
        } catch (e: any) {
            return { error: e.message || 'Error al iniciar sesión con Google' };
        }
    },

    login: async (email: string, password: string): Promise<User | null> => {
        let cloudUser: User | null = null;
        if (supabase) {
            try {
                // JOIN con instituciones para traer el contexto institucional completo
                const { data, error } = await supabase
                    .from('app_users')
                    .select(`
                        name, email, role, assigned_grades, assigned_subjects,
                        institucion_id, plan_type, credits, subscription_expiry,
                        instituciones (nombre, dominio_email, config_visual)
                    `)
                    .eq('email', email.toLowerCase())
                    .single();

                if (data && !error) {
                    const inst = (data as any).instituciones;
                    cloudUser = {
                        name: data.name,
                        email: data.email,
                        role: data.role as 'super_admin' | 'admin' | 'docente',
                        assigned_grades: data.assigned_grades || [],
                        assigned_subjects: data.assigned_subjects || [],
                        // Contexto institucional heredado
                        institucion_id: data.institucion_id,
                        nombre_institucion: inst?.nombre || null,
                        dominio_email: inst?.dominio_email || null,
                        config_visual: inst?.config_visual || null,
                        plan_type: (data as any).plan_type || 'free',
                        credits: (data as any).credits ?? 1,
                        subscription_expiry: (data as any).subscription_expiry || null
                    };
                }
            } catch (e) {
                console.error("Cloud login fetch error:", e);
            }
        }

        let user = cloudUser || AUTHORIZED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user) {
            const isValid = await authService.verifyPassword(email, password, user.role);
            if (isValid) {
                const newSessionId = crypto.randomUUID();
                const finalUser = { ...(cloudUser || user), session_id: newSessionId };

                if (supabase) {
                    await supabase
                        .from('app_users')
                        .update({ session_id: newSessionId })
                        .eq('email', email.toLowerCase());
                }

                localStorage.setItem(STORAGE_KEYS.AUTH, obfuscate('true'));
                localStorage.setItem(STORAGE_KEYS.USER, obfuscate(JSON.stringify(finalUser)));
                return finalUser;
            }
        }
        return null;
    },

    // SaaS: Registrar una nueva institución
    registerInstitucion: async (data: {
        nombre: string;
        slug: string;
        nit?: string;
        municipio?: string;
        dominio_email?: string;
        plan_suscripcion?: string;
    }) => {
        if (!supabase) return { success: false, message: 'Sin conexión a Supabase' };
        try {
            const { error } = await supabase
                .from('instituciones')
                .insert([{ ...data, activo: true }]);
            if (error) throw error;
            return { success: true };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    },

    // SaaS: Obtener todas las instituciones (super_admin only)
    getInstituciones: async () => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('instituciones')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching instituciones:', error);
                return [];
            }
            return data || [];
        } catch (e) {
            console.error('Error fetching instituciones:', e);
            return [];
        }
    },

    // SaaS: Buscar instituciones por nombre (Búsqueda pública)
    searchInstituciones: async (queryText: string) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('instituciones')
                .select('id, nombre, slug, config_visual')
                .eq('activo', true)
                .ilike('nombre', `%${queryText}%`)
                .limit(5);
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Error searching instituciones:', e);
            return [];
        }
    },

    // SaaS: Obtener info pública de una institución por slug o ID (para el login dinámico)
    getPublicInstitucion: async (slugOrId: string) => {
        if (!supabase) return null;
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
            const { data, error } = await supabase
                .from('instituciones')
                .select('id, nombre, config_visual, permite_autoregistro')
                .or(isUuid ? `id.eq.${slugOrId}` : `slug.eq.${slugOrId.toLowerCase()}`)
                .eq('activo', true)
                .maybeSingle();
            
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('Error fetching public inst:', e);
            return null;
        }
    },

    // SaaS: Toggle activo/inactivo de una institución
    toggleInstitucion: async (id: string, activo: boolean) => {
        if (!supabase) return { success: false };
        const { error } = await supabase.from('instituciones').update({ activo }).eq('id', id);
        return { success: !error };
    },



    handleAuthCallback: async (): Promise<User | null> => {
        if (!supabase) return null;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) return null;

        const { user } = session;
        const email = user.email?.toLowerCase() || '';
        const domain = email.split('@')[1];
        
        // 1. Intentar buscar el perfil en app_users (el trigger ya debe haberlo creado)
        let profile = null;
        let retries = 0;
        
        while (retries < 5 && !profile) {
            try {
                const { data, error } = await supabase
                    .from('app_users')
                    .select(`
                        name, email, role, assigned_grades, assigned_subjects,
                        institucion_id, plan_type, credits, subscription_expiry,
                        instituciones (nombre, dominio_email, config_visual)
                    `)
                    .eq('email', email)
                    .maybeSingle();
                
                if (error) throw error;
                profile = data;
            } catch (err) {
                console.warn(`⚠️ [Auth] Re-intentando consulta de perfil... (${retries + 1}/5)`);
            }

            if (!profile) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s
                retries++;
            }
        }

        // VALIDACIÓN ESTRICTA: Bloquear si intenta entrar a otro colegio y ya tiene uno
        const pendingInstId = localStorage.getItem('sci_pending_inst_id');
        if (profile && profile.institucion_id && pendingInstId && profile.institucion_id !== pendingInstId) {
            console.error("🚨 [Security] Intento de acceso a múltiples colegios bloqueado.");
            localStorage.removeItem('sci_pending_inst_id');
            await supabase.auth.signOut();
            throw new Error("Tu correo ya está registrado en otro colegio. Por seguridad, no puedes pertenecer a múltiples instituciones simultáneamente.");
        }

        // 2. Si el perfil existe pero no tiene institucion_id, intentar asignar por Magic Link o Dominio
        if (profile && !profile.institucion_id) {
            let matchedInstId = pendingInstId;

            // Si no hay magic link, intentar por dominio de correo
            if (!matchedInstId) {
                const { data: instByDomain } = await supabase
                    .from('instituciones')
                    .select('id')
                    .eq('dominio_email', domain)
                    .maybeSingle();
                
                if (instByDomain) {
                    matchedInstId = instByDomain.id;
                }
            }

            if (matchedInstId) {
                // Actualizar perfil con la institución detectada de forma permanente
                await supabase.from('app_users')
                    .update({ institucion_id: matchedInstId })
                    .eq('email', email);
                
                // Limpiar el localStorage ya que se guardó en BD
                localStorage.removeItem('sci_pending_inst_id');
                
                // Recargar perfil con los datos completos de la institución
                const { data: refreshed } = await supabase
                    .from('app_users')
                    .select('*, instituciones(*)')
                    .eq('email', email)
                    .single();
                profile = refreshed;
            }
        }

        // 3. GESTIÓN DE ACCESO (AUTO-REGISTRO POR CÓDIGO)
        if (!profile) {
            const autoInstId = pendingInstId || (() => {
                // Si no hay id pendiente, no podemos auto-registrar
                return null; 
            })();

            if (autoInstId) {
                // Verificar si la institución permite el autoregistro (Default: TRUE)
                const { data: instCheck } = await supabase.from('instituciones').select('permite_autoregistro, nombre').eq('id', autoInstId).maybeSingle();
                const allowsAutoReg = instCheck?.permite_autoregistro !== false; // Solo FALSE bloquea el acceso

                if (!allowsAutoReg) {
                    console.error(`🚨 [Auth] Registro bloqueado: Modo Estricto en ${instCheck?.nombre}.`);
                    localStorage.removeItem('sci_pending_inst_id');
                    if (supabase) await supabase.auth.signOut();
                    throw new Error('Este colegio requiere que el Rector registre tu cuenta manualmente antes de ingresar.');
                }

                console.log('✨ [Auth] Creando nuevo perfil docente para:', email);
                const obfuscatedDefaultPassword = btoa('sci-auto-' + Date.now());

                const { data: newProfile, error: createError } = await supabase
                    .from('app_users')
                    .insert([{
                        name: (user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0]),
                        email: email,
                        password: obfuscatedDefaultPassword,
                        role: 'docente',
                        institucion_id: autoInstId,
                        assigned_grades: [],
                        assigned_subjects: [],
                        credits: 1,
                        plan_type: 'free'
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.error("❌ [Auth] Error en auto-creación:", createError);
                    throw createError;
                }
                
                profile = newProfile;
                
                // Cargar también la info de la institución para el objeto User final
                const { data: instFull } = await supabase.from('instituciones').select('*').eq('id', autoInstId).single();
                (profile as any).instituciones = instFull;
                
                localStorage.removeItem('sci_pending_inst_id');
                console.log('✅ [Auth] Perfil creado y vinculado con éxito.');
            } else {
                console.error('🚨 [Auth] Bloqueo: Usuario no registrado y sin contexto institucional.');
                if (supabase) await supabase.auth.signOut();
                throw new Error('No estás registrado en la base de datos. Para entrar por primera vez, usa el enlace oficial y el código de tu colegio.');
            }
        }

        const inst = (profile as any).instituciones;
        const finalUser: User = {
            name: profile.name,
            email: profile.email,
            role: profile.role as 'super_admin' | 'admin' | 'docente',
            assigned_grades: profile.assigned_grades || [],
            assigned_subjects: profile.assigned_subjects || [],
            institucion_id: profile.institucion_id,
            nombre_institucion: inst?.nombre || null,
            dominio_email: inst?.dominio_email || null,
            config_visual: inst?.config_visual || null,
            session_id: session.access_token,
            credits: (profile as any).credits ?? 1,
            plan_type: (profile as any).plan_type || 'free',
            subscription_expiry: (profile as any).subscription_expiry || null
        };

        localStorage.setItem(STORAGE_KEYS.AUTH, obfuscate('true'));
        localStorage.setItem(STORAGE_KEYS.USER, obfuscate(JSON.stringify(finalUser)));
        
        // Registrar sesión activa
        await supabase.from('app_users').update({ session_id: session.access_token }).eq('email', email);

        return finalUser;
    },

    registerTeacher: async (teacher: { name: string, email: string, password?: string, assigned_grades?: string[], assigned_subjects?: string[] }) => {
        const passwordToSend = teacher.password || 'edu2026';
        const obfuscatedPassword = obfuscate(passwordToSend);

        // 1. Local Persistence (for backup)
        const key = `sci_pwd_${teacher.email.toLowerCase()}`;
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
                        assigned_subjects: teacher.assigned_subjects || [],
                        credits: 1
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
        localStorage.removeItem(`sci_pwd_${email.toLowerCase()}`);

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

    canGenerate: (user: User): boolean => {
        if (user.role === 'super_admin') return true;
        if (user.plan_type === 'annual') return true;
        
        // Verificar expiración si aplica (ej: mensual/semanal)
        if (user.subscription_expiry) {
            const expiry = new Date(user.subscription_expiry);
            if (expiry < new Date()) return false;
        }

        return (user.credits || 0) > 0;
    },

    // --- GENERATED SEQUENCES PERSISTENCE & LOGGING ---
    saveAndLogSequence: async (user: User, sequence: any, details: { grade: string, area: string, theme: string }) => {
        const email = user.email.toLowerCase().trim();
        const actionText = `Generó: ${details.theme} (${details.area} - ${details.grade})`;
        const institucionId = user.institucion_id || null;

        // 1. Respaldo Local (Inmediato)
        try {
            const statsKey = `sci_stats_${email}`;
            const seqKey = `sci_saved_sequences_${email}`;

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
            console.warn("Local storage backup failed");
        }

        // 2. Nube (con contexto institucional)
        if (supabase) {
            try {
                const { error: logErr } = await supabase.from('usage_logs').insert([{
                    user_email: email,
                    action: actionText,
                    institucion_id: institucionId
                }]);
                if (logErr) console.error("Error Log Nube:", logErr.message);

                const { error: seqErr } = await supabase.from('generated_sequences').insert([{
                    user_email: email,
                    grado: details.grade,
                    area: details.area,
                    tema: details.theme,
                    content: sequence,
                    institucion_id: institucionId,
                    is_test: true 
                }]);
                if (seqErr) console.error("Error Repositorio Nube:", seqErr.message);

                if (!logErr && !seqErr) console.log("[Sync] Éxito Total en la Nube con institucion_id:", institucionId);

                // 3. Decrementar créditos si aplica (No aplica para Super Admin o Plan Anual Ilimitado)
                if (user.role !== 'super_admin' && user.plan_type !== 'annual') {
                    const currentCredits = user.credits ?? 1;
                    if (currentCredits > 0) {
                        const newCredits = currentCredits - 1;
                        await supabase.from('app_users').update({ credits: newCredits }).eq('email', email);
                        
                        // Actualizar sesión local (Sincronización inmediata)
                        const updatedUser = { ...user, credits: newCredits };
                        localStorage.setItem(STORAGE_KEYS.USER, obfuscate(JSON.stringify(updatedUser)));
                        console.log(`📉 Crédito descontado. Restantes: ${newCredits}`);
                    }
                }
            } catch (e) {
                console.error("Fallo crítico de sincronización:", e);
            }
        }
    },

    getAllSequences: async (page: number = 1, limit: number = 0) => {
        if (!supabase) return [];
        const user = authService.getCurrentUser();
        if (!user) return [];

        try {
            let query = supabase.from('generated_sequences').select('*');

            // --- REPORTE: Privacidad Estricta ---
            // Solo Super Admin ve todo el SaaS.
            if (user.role === 'docente') {
                query = query.eq('user_email', user.email.toLowerCase());
            } else if (user.role === 'admin' && user.institucion_id) {
                query = query.eq('institucion_id', user.institucion_id);
            }

            // Paginación si se especifica limit mayor que 0
            if (limit > 0) {
                const from = (page - 1) * limit;
                const to = from + limit - 1;
                query = query.range(from, to);
            }

            const { data, error } = await query.order('timestamp', { ascending: false });

            if (error) {
                console.error("Error fetching sequences:", error);
                return [];
            }
            return data || [];
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    deleteSequence: async (sequenceId: string): Promise<boolean> => {
        if (!supabase) return false;
        const user = authService.getCurrentUser();
        if (!user) return false;

        try {
            // Eliminar solo si somos dueños o somos admins (esto lo valida también la política RLS en BD si existe)
            // Se hace un pre-chequeo aquí.
            let query = supabase.from('generated_sequences').delete().eq('id', sequenceId);

            if (user.role === 'docente') {
                query = query.eq('user_email', user.email.toLowerCase());
            } else if (user.role === 'admin' && user.institucion_id) {
                query = query.eq('institucion_id', user.institucion_id);
            } // El super admin puede eliminar cualquiera.

            const { error } = await query;
            if (error) {
                console.error("Error deleting sequence:", error.message);
                return false;
            }
            return true;
        } catch (e) {
            console.error("Exception deleting sequence:", e);
            return false;
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
        const key = `sci_stats_${email.toLowerCase()}`;
        const logs: any[] = JSON.parse(localStorage.getItem(key) || '[]');
        const now = new Date();

        const timestamps = logs.map(l => typeof l === 'number' ? l : l.timestamp);

        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const weekStart = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

        const localSavedKey = `sci_saved_sequences_${email.toLowerCase()}`;
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
        const user = authService.getCurrentUser();
        if (!user || user.role === 'docente') return []; // Docentes no ven listado completo

        let userList = [...AUTHORIZED_USERS];

        if (supabase) {
            try {
                let query = supabase.from('app_users').select('name, email, role, assigned_grades, assigned_subjects');

                // Filtro de Privacidad: Admins solo ven a su gente
                if (user.role === 'admin' && user.institucion_id) {
                    query = query.eq('institucion_id', user.institucion_id);
                }

                const { data } = await query;

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
            const seqKey = `sci_saved_sequences_${email}`;
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
                // SESSION INTEGRITY CHECK - Ignored for Super Admin
                if (current.role !== 'super_admin' && current.session_id && data.session_id && current.session_id !== data.session_id) {
                    console.warn("🚨 [Security] Sesión duplicada detectada. Cerrando esta sesión.");
                    authService.logout();
                    return null;
                }

                const updatedUser: User = {
                    ...current, // Keep institution and config
                    name: data.name,
                    email: data.email,
                    role: data.role as any,
                    assigned_grades: data.assigned_grades || [],
                    assigned_subjects: data.assigned_subjects || [],
                    session_id: data.session_id || current.session_id
                };

                // Store in memory AND local storage
                localStorage.setItem(STORAGE_KEYS.USER, obfuscate(JSON.stringify(updatedUser)));
                return updatedUser;
            }
        } catch (e) {
            console.error("Session refresh error:", e);
        }
        return current;
    },

    // New: Super Admin option to clear test data
    clearTestData: async () => {
        if (!supabase) return { success: false };
        const { error } = await supabase
            .from('generated_sequences')
            .delete()
            .eq('is_test', true);
        return { success: !error };
    },

    // --- CÓDIGO DE ACCESO DE COLEGIO ---
    // Busca el código de acceso en TODAS las instituciones activas (no depende del slug/URL)
    verifyCodigoAccesoGlobal: async (codigo: string): Promise<{ valid: boolean; message?: string; institucion?: any }> => {
        if (!supabase) return { valid: false, message: 'Sin conexión a la base de datos' };
        try {
            const { data, error } = await supabase
                .from('instituciones')
                .select('id, nombre, slug, config_visual, codigo_acceso, activo')
                .eq('activo', true)
                .not('codigo_acceso', 'is', null);

            if (error) throw error;
            if (!data || data.length === 0) return { valid: false, message: 'No hay instituciones configuradas.' };

            const match = data.find(
                (inst: any) => inst.codigo_acceso && inst.codigo_acceso.trim().toLowerCase() === codigo.trim().toLowerCase()
            );

            if (match) {
                return { valid: true, institucion: { id: match.id, nombre: match.nombre, slug: match.slug, config_visual: match.config_visual } };
            }
            return { valid: false, message: 'Código incorrecto. Verifica con tu administrador.' };
        } catch (e: any) {
            return { valid: false, message: 'Error al verificar el código' };
        }
    },

    // Verifica que el código ingresado por el docente corresponde al colegio (por ID específico)
    verifyCodigoAcceso: async (institucionId: string, codigo: string): Promise<{ valid: boolean; message?: string }> => {
        if (!supabase) return { valid: false, message: 'Sin conexión a la base de datos' };
        try {
            const { data, error } = await supabase
                .from('instituciones')
                .select('codigo_acceso, activo')
                .eq('id', institucionId)
                .maybeSingle();

            if (error) throw error;
            if (!data) return { valid: false, message: 'Institución no encontrada' };
            if (!data.activo) return { valid: false, message: 'Esta institución está inactiva' };
            if (!data.codigo_acceso) return { valid: false, message: 'Esta institución no tiene código configurado. Contacta al administrador.' };

            const isValid = data.codigo_acceso.trim().toLowerCase() === codigo.trim().toLowerCase();
            return isValid
                ? { valid: true }
                : { valid: false, message: 'Código incorrecto. Verifica con tu administrador.' };
        } catch (e: any) {
            return { valid: false, message: 'Error al verificar el código' };
        }
    },

    // Actualiza el código de acceso de una institución (solo admin del colegio o super_admin)
    updateCodigoAcceso: async (institucionId: string, nuevoCodigo: string): Promise<{ success: boolean; message?: string }> => {
        if (!supabase) return { success: false, message: 'Sin conexión a la base de datos' };
        try {
            const { error } = await supabase
                .from('instituciones')
                .update({ codigo_acceso: nuevoCodigo.trim() })
                .eq('id', institucionId);

            if (error) throw error;
            return { success: true };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    },

    // Obtiene el código de acceso de una institución (para mostrar al admin)
    getCodigoAcceso: async (institucionId: string): Promise<string | null> => {
        if (!supabase) return null;
        try {
            const { data } = await supabase
                .from('instituciones')
                .select('codigo_acceso')
                .eq('id', institucionId)
                .maybeSingle();
            return data?.codigo_acceso || null;
        } catch {
            return null;
        }
    },

    // --- MERCADO PAGO INTEGRATION ---
    // Inicia el objeto Mercado Pago con la llave pública de Sandbox
    initMercadoPago: () => {
        const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
        if (!publicKey) {
            console.error('❌ [MercadoPago] Llave pública No configurada en .env');
            return null;
        }
        // @ts-ignore
        if (typeof window.MercadoPago === 'undefined') {
            console.error('❌ [MercadoPago] SDK no cargado. Revisa index.html');
            return null;
        }
        // @ts-ignore
        return new window.MercadoPago(publicKey, { locale: 'es-CO' });
    },

    // Crea una preferencia de pago invocando a una Edge Function de Supabase
    createPreference: async (institucionId: string, userEmail: string, planName: string, amount: number) => {
        if (!supabase) return { error: 'Sin conexión a Supabase' };
        
        try {
            const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
                body: { 
                    institucionId, 
                    userEmail,
                    planName, 
                    amount,
                    domain: window.location.origin
                }
            });

            if (error) throw error;
            return { preferenceId: data.id };
        } catch (e: any) {
            console.error('❌ Error creando preferencia:', e);
            // Fallback manual para pruebas si la función no está desplegada aún
            return { error: e.message || 'Error al conectar con el servidor de pagos' };
        }
    }
};
