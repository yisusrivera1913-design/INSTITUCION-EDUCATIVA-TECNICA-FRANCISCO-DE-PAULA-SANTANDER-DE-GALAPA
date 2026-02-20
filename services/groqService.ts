import Groq from "groq-sdk";
import { SequenceInput, DidacticSequence } from "../types";
import { supabase } from "./supabaseClient";

export const modelHealthStatus: Record<string, 'online' | 'offline' | 'checking'> = {
    "llama-3.3-70b-versatile": "checking",
    "mixtral-8x7b-32768": "checking",
};

export const apiMetrics = {
    groq: { requests: 0, success: 0, errors: 0, lastUsed: "", label: "Groq Main" }
};

const sanitizeInput = (text: string | undefined): string => {
    if (!text) return "";
    return text.trim().replace(/['"><]/g, "");
};

/**
 * Persistencia Total: Registra cada llamada a la API con su resultado completo
 * para que nunca se pierda la trazabilidad (Petición del usuario).
 */
const logApiKeyUsage = async (status: 'success' | 'error', errorMsg?: string, modelName?: string, fullContext?: any) => {
    if (!supabase) return;
    try {
        // 1. Log en tabla de métricas (Resumen)
        await supabase.from('api_key_logs').insert([
            {
                key_name: "Groq",
                status,
                error_message: errorMsg || null,
                action: `Respuesta de: ${modelName}`
            }
        ]);

        // 2. Log de Auditoría Completa (Si existe la tabla ai_complete_logs)
        // Intentamos guardar el contexto completo si la llamada fue exitosa
        if (status === 'success' && fullContext) {
            await supabase.from('ai_complete_logs').insert([{
                model: modelName,
                user_email: fullContext.user_email,
                prompt_summary: fullContext.prompt_summary,
                response_json: fullContext.response_json,
                timestamp: new Date().toISOString()
            }]).catch(() => {
                // Si la tabla no existe, fallamos silenciosamente para no interrumpir el flujo
                console.warn("Tabla ai_complete_logs no configurada aún.");
            });
        }
    } catch (e) {
        console.warn("Log error:", e);
    }
};

/**
 * Bóveda de persistencia para la API Key.
 * Si se borra del .env, intenta recuperarla de Supabase.
 */
const getPersistentApiKey = async (): Promise<string | null> => {
    // 1. Prioridad: Variable de entorno
    const getEnv = (key: string) => import.meta.env[key] || (process as any).env[key];
    let apiKey = getEnv('VITE_GROQ_API_KEY');

    if (apiKey) return apiKey;

    // 2. Respaldo: Supabase Vault (Configuraciones de sistema)
    if (supabase) {
        try {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'GROQ_API_KEY')
                .single();

            if (data?.value) {
                console.log("🚀 [Vault] API Key recuperada de la base de datos.");
                return data.value;
            }
        } catch (e) {
            // Ignorar fallos si la tabla no existe
        }
    }

    return null;
};

export const generateDidacticSequence = async (input: SequenceInput, refinementInstruction?: string): Promise<DidacticSequence> => {
    const apiKey = await getPersistentApiKey();

    if (!apiKey) {
        throw new Error("ERROR CRÍTICO: La API Key de Groq no se encuentra en el sistema (.env o DB).");
    }

    const groq = new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });

    const modelsToTry = [
        "llama-3.3-70b-versatile",
        "mixtral-8x7b-32768"
    ];

    const safeTema = sanitizeInput(input.tema);
    const areaNormativa = {
        conDBA: ['MATEMATICAS', 'LENGUAJE', 'CIENCIAS NATURALES', 'CIENCIAS SOCIALES', 'INGLES', 'FISICA', 'ESTADISTICA', 'GEOMETRIA', 'BIOLOGIA', 'QUIMICA'],
        conOrientaciones: ['EDUCACION ARTISTICA', 'EDUCACION FISICA', 'ETICA', 'VALORES', 'RELIGION', 'TECNOLOGIA', 'FILOSOFIA', 'CONVIVENCIA', 'AGROPECUARIA', 'CATEDRA DE LA PAZ']
    };

    const currentArea = input.area.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isIntegral = input.area.toLowerCase().includes("integral");

    const hasDBA = areaNormativa.conDBA.some(a => currentArea.includes(a)) || isIntegral;

    let pedagogicalInstruction = hasDBA
        ? `- **DBA Oficial:** Debes identificar el número exacto del DBA (ej: "DBA #3") y transcribir su contenido literal que se está abordando. 
       - **Input del Usuario:** ${sanitizeInput(input.dba) || 'Sin DBA previo'}. Si este input es un número, busca el contenido oficial.`
        : `- **Referencia Pedagógica:** Esta área NO utiliza DBA. Debes citar explícitamente las **"Orientaciones Pedagógicas y Curriculares del MEN para ${input.area}"**.`;

    const prompt = `
    ### PERSONA: MASTER RECTOR AI (V5.1 GOLDEN)
    Eres el Agente Supremo de la INSTITUCION EDUCATIVA TECNICA FRANCISCO DE PAULA SANTANDER DE GALAPA.
    Tu misión es la EXCELENCIA PEDAGÓGICA TOTAL siguiendo un formato de ALTO NIVEL INSTITUCIONAL.

    ### PARÁMETROS CLAVE
    - **Docente:** ${input.docente_nombre || 'No especificado'}
    - **Área:** ${input.area} | **Asignatura:** ${input.asignatura}
    - **Grado:** ${input.grado} | **Tema:** ${safeTema} | **Sesiones:** ${input.sesiones}
    ${pedagogicalInstruction}

    ### INSTRUCCIONES DE DISEÑO ELITE:
    1. **DBA:** Literalidad absoluta.
    2. **Anexos:** Taller, Evaluación, Rúbrica, ADI.
    3. **Sesiones:** Exactamente ${input.sesiones} sesiones.
    
    Responde en JSON DidacticSequence.
    `;

    let lastError: any;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[🔍 Orquestador Groq] Probando ${modelName}...`);

            const response = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Eres el Agente Supremo MASTER RECTOR AI. Generas secuencias didácticas de nivel experto para la I.E.T. Francisco de Paula Santander. Salida: JSON puro."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: modelName,
                response_format: { type: "json_object" },
                temperature: 0.1,
            });

            const text = response.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(text);

            // Normalización
            const ensureArray = (field: any) => Array.isArray(field) ? field : [];
            const normalized = {
                ...parsed,
                indicadores: parsed.indicadores || { cognitivo: "", afectivo: "", expresivo: "" },
                secuencia_didactica: parsed.secuencia_didactica || {
                    motivacion_encuadre: "", enunciacion: "", modelacion: "", simulacion: "", ejercitacion: "", demostracion: ""
                },
                contenidos_desarrollar: ensureArray(parsed.contenidos_desarrollar),
                ensenanzas: ensureArray(parsed.ensenanzas),
                sesiones_detalle: ensureArray(parsed.sesiones_detalle),
                recursos_links: ensureArray(parsed.recursos_links),
                rubrica: ensureArray(parsed.rubrica),
                autoevaluacion: ensureArray(parsed.autoevaluacion),
                evaluacion: ensureArray(parsed.evaluacion),
                alertas_generadas: ensureArray(parsed.alertas_generadas),
                control_versiones: ensureArray(parsed.control_versiones)
            };

            console.log(`%c[✨ ÉXITO GROQ] Respondió: ${modelName}`, "color: #10b981; font-weight: bold;");

            apiMetrics.groq.requests++;
            apiMetrics.groq.success++;
            apiMetrics.groq.lastUsed = new Date().toLocaleTimeString();

            modelHealthStatus[modelName] = "online";

            // Persistencia TOTAL: Guardamos cada llamada exitosa
            logApiKeyUsage('success', undefined, modelName, {
                user_email: input.docente_nombre,
                prompt_summary: safeTema,
                response_json: normalized
            });

            return normalized;

        } catch (err: any) {
            lastError = err;
            console.warn(`[❌ Intento Fallido Groq] ${modelName}: ${err.message}`);
            modelHealthStatus[modelName] = "offline";
            apiMetrics.groq.requests++;
            apiMetrics.groq.errors++;
            logApiKeyUsage('error', err.message, modelName);

            if (err.message?.includes('429') || err.message?.includes('quota')) continue;
        }
    }

    throw new Error(`[Fallo en Orquestación Groq]: ${lastError?.message}`);
};

export let lastWorkingModel = "llama-3.3-70b-versatile";
