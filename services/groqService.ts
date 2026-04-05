import Groq from "groq-sdk";
import { SequenceInput, DidacticSequence } from "../types";
import { supabase } from "./supabaseClient";

export let lastWorkingModel = "llama-3.3-70b-versatile";

export const modelHealthStatus: Record<string, 'online' | 'offline' | 'checking'> = {
    "llama-3.3-70b-versatile": "checking",
    "mixtral-8x7b-32768": "checking",
    "llama-3.1-70b-versatile": "checking",
};

const STORAGE_KEY = 'eduplaneacion_groq_metricsv1';

const loadMetrics = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) { console.warn("Error loading metrics:", e); }
    return {
        groq: { requests: 0, success: 0, errors: 0, lastUsed: "", label: "Groq Main" }
    };
};

export const apiMetrics = loadMetrics();

const saveMetrics = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiMetrics));
    } catch (e) { console.warn("Error saving metrics:", e); }
};

const sanitizeInput = (text: string | undefined): string => {
    if (!text) return "";
    return text.trim().replace(/['"><]/g, "");
};

/**
 * Persistencia Total: Registra cada llamada a la API con su resultado completo
 */
const logApiKeyUsage = async (status: 'success' | 'error', errorMsg?: string, modelName?: string, fullContext?: any) => {
    if (!supabase) return;
    try {
        await supabase.from('api_key_logs').insert([
            {
                key_name: "Groq",
                status,
                error_message: errorMsg || null,
                action: `Respuesta de: ${modelName}`
            }
        ]);

        if (status === 'success' && fullContext) {
            try {
                await supabase.from('ai_complete_logs').insert([{
                    model: modelName,
                    user_email: fullContext.user_email,
                    prompt_summary: fullContext.prompt_summary,
                    response_json: fullContext.response_json,
                    timestamp: new Date().toISOString()
                }]);
            } catch (e) {
                console.warn("Tabla ai_complete_logs no configurada aún o error de red:", e);
            }
        }
    } catch (e) {
        console.warn("Log error:", e);
    }
};

const getPersistentApiKey = async (): Promise<string | null> => {
    try {
        // Acceso seguro a variables de entorno en Vite
        const env = (import.meta as any).env || {};
        const proc = (typeof process !== 'undefined') ? (process as any).env : {};

        let apiKey = env.VITE_GROQ_API_KEY || proc.VITE_GROQ_API_KEY || env.GROQ_API_KEY || proc.GROQ_API_KEY;

        if (apiKey) return apiKey;

        if (supabase) {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'GROQ_API_KEY')
                .maybeSingle();

            if (data?.value) return (data.value as string);
        }
    } catch (e) {
        console.warn("Error recuperando API Key:", e);
    }

    return null;
};

// Reparador Inteligente de JSON (Anti-Pantallazos blancos)
const safeJsonParse = (text: string) => {
    if (!text) return {};
    try {
        let cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText);
    } catch(e) {
        console.warn("⚠️ [Reparador JSON] Fallo en parse inicial, activando reparación profunda...");
        try {
            let repairedText = text
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .replace(/,\s*([\]}])/g, '$1') // Eliminar trailing commas (muy común)
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Eliminar caracteres de control ocultos
                .trim();
            
            // Forzar inicio y fin válidos
            const firstBrace = repairedText.indexOf("{");
            const lastBrace = repairedText.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1) {
                repairedText = repairedText.substring(firstBrace, lastBrace + 1);
            }

            return JSON.parse(repairedText);
        } catch(finalErr) {
            console.error("❌ [Reparador JSON] Imposible reparar. Texto devuelto:", text.substring(0, 50) + "...");
            throw finalErr;
        }
    }
};

export const generateDidacticSequence = async (input: SequenceInput, refinementInstruction?: string, currentContext?: DidacticSequence): Promise<DidacticSequence> => {
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
        "mixtral-8x7b-32768",
        "llama-3.1-70b-versatile"
    ];

    const safeTema = sanitizeInput(input.tema);
    const areaNormativa = {
        conDBA: ['MATEMATICAS', 'LENGUAJE', 'LENGUA CASTELLANA', 'CIENCIAS NATURALES', 'CIENCIAS SOCIALES', 'INGLES', 'FISICA', 'ESTADISTICA', 'GEOMETRIA', 'BIOLOGIA', 'QUIMICA'],
        conOrientaciones: ['EDUCACION ARTISTICA', 'EDUCACION FISICA', 'ETICA', 'VALORES', 'RELIGION', 'TECNOLOGIA', 'FILOSOFIA', 'CONVIVENCIA', 'AGROPECUARIA', 'CATEDRA DE LA PAZ']
    };

    const currentArea = input.area.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isIntegral = input.area.toLowerCase().includes("integral");
    const hasDBA = areaNormativa.conDBA.some(a => currentArea.includes(a)) || isIntegral;

    let pedagogicalInstruction = hasDBA
        ? `- **DBA Obligatorio (MEN Colombia):** Esta área REQUIERE DBA. Debes identificar el código/número exacto del DBA y transcribir su enunciado LITERAL oficial. 
       - **Input:** ${sanitizeInput(input.dba) || 'Docente no especificó DBA'}. Si está vacío, búscalo en tu base de conocimientos para el tema "${input.tema}".`
        : `- **Referencia Curricular:** Citar las Orientaciones Pedagógicas del MEN para el área de ${input.area}.`;

    // Función de limpieza institucional
    const cleanText = (text: any): string => {
        if (typeof text !== 'string') return String(text || "");
        return text.replace(/\*/g, "").trim();
    };

    // Limpieza recursiva profunda para garantizar CERO asteriscos
    const deepClean = (obj: any): any => {
        if (Array.isArray(obj)) {
            return obj.map(item => deepClean(item));
        } else if (obj !== null && typeof obj === 'object') {
            const cleaned: any = {};
            for (const key in obj) {
                cleaned[key] = deepClean(obj[key]);
            }
            return cleaned;
        } else if (typeof obj === 'string') {
            return cleanText(obj);
        }
        return obj;
    };

    const nombreInstitucion = input.nombre_institucion || 'la Institución Educativa';
    const codigoFormato = input.codigo_formato || 'F-PA-03';
    const modeloPedagogico = input.modelo_pedagogico || 'ADI';

    const prompt = `
    ### PERSONA: COORDINADOR PEDAGÓGICO IA
    Eres el experto en currículo de la institución educativa: **${nombreInstitucion}**. 
    Tu objetivo es generar planeaciones de clase con RIGOR ACADÉMICO y EXCELENCIA PEDAGÓGICA.
    Formato institucional: **${codigoFormato}** | Modelo pedagógico: **${modeloPedagogico}**.

    ### PARÁMETROS:
    - **Docente:** ${input.docente_nombre || 'Docente'} | **Área:** ${input.area}
    - **Grado:** ${input.grado} | **Tema:** ${safeTema} | **Sesiones:** ${input.sesiones}
    ${pedagogicalInstruction}

    ### REGLAS ORO DE CALIDAD:
    1. **DBA MASTER (MEN COLOMBIA):** Eres un experto en los Derechos Básicos de Aprendizaje de Colombia.
       - OBLIGATORIO: Transcribir el enunciado **LITERAL** y el **NÚMERO** oficial (ej: "DBA 2 - Grado 4").
       - OBLIGATORIO: Incluir las **EVIDENCIAS DE APRENDIZAJE** oficiales del MEN.
       - Si no encuentras el DBA literal, usa los Estándares Básicos de Competencia (EBC) pero cítalos como tal. El campo dba_detalle es CRÍTICO para la validez legal de la planeación.
    2. **EVALUACIÓN POR COMPETENCIAS (ICFES):** Genera **EXACTAMENTE 10 PREGUNTAS** de selección múltiple con única respuesta siguiendo el modelo ICFES. CADA PREGUNTA DEBE partir de una **Situación Problema** o contexto real (ej: "Un ingeniero construye...", "En el ecosistema local...", "María analiza..."). 
       - PROHIBIDO: Preguntas de definiciones o memoria simple (ej: "¿Qué es...?", "¿Quién fue...?").
       - CADA PREGUNTA debe tener: Contexto claro, Enunciado preciso, 4 Opciones, Clave y una EXPLICACIÓN PEDAGÓGICA detallada. Ni una pregunta más, ni una menos.
    3. **INTEGRACIÓN INTELIGENTE:** Si se solicitan áreas incompatibles (ej: Religión y Geometría), NO inventes conexiones forzadas. Si no existe un puente pedagógico natural, deja los campos de integración en blanco o sepáralos estrictamente. Prioriza siempre el rigor técnico de cada área por separado.
    4. **Propósito Holístico:** Síntesis clara de Saber (Cognitivo), Ser (Afectivo) y Hacer (Expresivo).
    5. **Terminología Institucional:** Fase final: "transferencia". PROHIBIDO: "ABP".
    6. **Sin Tiempos Rígidos:** No incluyas minutos en las sesiones.
    7. **LIMPIEZA TOTAL:** PROHIBIDO EL USO DE ASTERISCOS (*) EN CUALQUIER PARTE DEL TEXTO (ni siquiera para viñetas o negritas). Usa puntos o guiones si es necesario.
    8. **Formato Sobrio:** Evita el marketing ("Platinum", "Supreme"). Usa lenguaje institucional formal.

    ### ESTRUCTURA JSON OBLIGATORIA (DidacticSequence):
    - "institucion": "Nombre de la Institución"
    - "formato_nombre": "Planeación de Clase Institucional"
    - "nombre_docente": "${input.docente_nombre || 'Docente'}"
    - "area", "asignatura", "grado", "grupos", "fecha", "num_secuencia": (del input)
    - "proposito": (Suma de indicadores Cognitivo + Afectivo + Expresivo)
    - "objetivos_aprendizaje", "contenidos_desarrollar": (lista de subtemas)
    - "competencias_men", "estandar_competencia", "dba_utilizado".
    - "dba_detalle": { "numero", "enunciado", "evidencias": [] }
    - "eje_transversal_crese", "corporiedad_adi", "metodologia".
    - "indicadores": { "cognitivo", "afectivo", "expresivo" }
    - "ensenanzas": (lista de conceptos clave SIN asteriscos)
    - "secuencia_didactica": { "motivacion_encuadre", "enunciacion", "modelacion", "simulacion", "ejercitacion", "transferencia" } (Cada campo DEBE tener al menos 2-3 líneas de contenido altamente educativo y detallado, explicando la acción pedagógica técnica).
    - "sesiones_detalle": [ { "numero", "titulo", "descripcion", "momento_adi" } ]
    - "didactica", "recursos", "recursos_links": [ { "tipo", "nombre", "url", "descripcion" } ]
    - "taller_imprimible": { "introduccion", "instrucciones", "ejercicios": [], "reto_creativo" }
    - "evaluacion": **LISTA DE EXACTAMENTE 10 PREGUNTAS** ICFES con { "pregunta", "tipo": "multiple_choice", "opciones": [], "respuesta_correcta", "competencia", "explicacion" }
    - "rubrica": [ { "criterio", "bajo", "basico", "alto", "superior" } ]
    - "autoevaluacion": [], "control_versiones": [], "alertas_generadas": []
    - "bibliografia": (Fuentes citadas)
    - "observaciones": (Notas pedagógicas)
    - "adecuaciones_piar": (Ajustes razonables si aplica)
    - "elaboro": "${input.docente_nombre || 'Docente'}", "reviso": "Coordinación Académica", "pie_fecha": "${new Date().toLocaleDateString()}"
    - "tema_principal", "titulo_secuencia", "descripcion_secuencia"

    ${currentContext ? `### CONTEXTO ACTUAL (MODIFICACIÓN DIRECTA):
    JSON ACTUAL: ${JSON.stringify(currentContext)}
    INSTRUCCIÓN ESPECÍFICA: ${refinementInstruction}
    REGLA: Solo modifica lo solicitado en la instrucción. Mantén el resto idéntico. Ahorra tokens.
    ` : refinementInstruction ? `### REFINAMIENTO PERSONALIZADO: ${refinementInstruction}` : ''}
    
    RESPONDE EXCLUSIVAMENTE CON EL OBJETO JSON.
    `;

    let lastError: any;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[🔍 Groq] Probando ${modelName}...`);

            const response = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Eres un Coordinador Pedagógico Institucional. Generas planeaciones profesionales en JSON puro. Sin avisos, sin asteriscos, solo el objeto JSON."
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
            const parsed = safeJsonParse(text);

            // Normalización Robusta Platinum
            const ensureArray = (field: any) => Array.isArray(field) ? field : [];
            const normalized: DidacticSequence = {
                institucion: cleanText(parsed.institucion) || "Institución Educativa",
                formato_nombre: "Planeación de Clase Institucional v5.3",
                nombre_docente: cleanText(parsed.nombre_docente) || input.docente_nombre || "Docente",
                area: cleanText(parsed.area) || input.area,
                asignatura: cleanText(parsed.asignatura) || input.asignatura,
                grado: cleanText(parsed.grado) || input.grado,
                grupos: cleanText(parsed.grupos) || input.grupos || "",
                fecha: cleanText(parsed.fecha) || input.fecha || new Date().toLocaleDateString(),
                num_secuencia: Number(parsed.num_secuencia || input.num_secuencia || 1),
                proposito: cleanText(parsed.proposito),
                objetivos_aprendizaje: cleanText(parsed.objetivos_aprendizaje || parsed.objetivo_aprendizaje),
                contenidos_desarrollar: ensureArray(parsed.contenidos_desarrollar).map(cleanText),
                competencias_men: cleanText(parsed.competencias_men),
                estandar_competencia: cleanText(parsed.estandar_competencia),
                dba_utilizado: cleanText(parsed.dba_utilizado),
                dba_detalle: {
                    numero: cleanText(parsed.dba_detalle?.numero),
                    enunciado: cleanText(parsed.dba_detalle?.enunciado),
                    evidencias: ensureArray(parsed.dba_detalle?.evidencias).map(cleanText)
                },
                eje_transversal_crese: cleanText(parsed.eje_transversal_crese),
                corporiedad_adi: cleanText(parsed.corporiedad_adi),
                metodologia: cleanText(parsed.metodologia),
                indicadores: {
                    cognitivo: cleanText(parsed.indicadores?.cognitivo),
                    afectivo: cleanText(parsed.indicadores?.afectivo),
                    expresivo: cleanText(parsed.indicadores?.expresivo)
                },
                ensenanzas: ensureArray(parsed.ensenanzas).map(cleanText),
                secuencia_didactica: {
                    motivacion_encuadre: cleanText(parsed.secuencia_didactica?.motivacion_encuadre),
                    enunciacion: cleanText(parsed.secuencia_didactica?.enunciacion),
                    modelacion: cleanText(parsed.secuencia_didactica?.modelacion),
                    simulacion: cleanText(parsed.secuencia_didactica?.simulacion),
                    ejercitacion: cleanText(parsed.secuencia_didactica?.ejercitacion),
                    transferencia: cleanText(parsed.secuencia_didactica?.transferencia || parsed.secuencia_didactica?.demostracion)
                },
                sesiones_detalle: ensureArray(parsed.sesiones_detalle).map((s: any) => ({
                    numero: Number(s.numero) || 1,
                    titulo: cleanText(s.titulo),
                    descripcion: cleanText(s.descripcion),
                    tiempo: cleanText(s.tiempo) || "Sesión Completa",
                    momento_adi: cleanText(s.momento_adi)
                })),
                didactica: cleanText(parsed.didactica),
                recursos: cleanText(parsed.recursos),
                recursos_links: ensureArray(parsed.recursos_links || parsed.recursos_digitales).map((l: any) => ({
                    tipo: cleanText(l.tipo || "Link"),
                    nombre: cleanText(l.nombre || "Recurso"),
                    url: cleanText(l.url),
                    descripcion: cleanText(l.descripcion)
                })),
                rubrica: ensureArray(parsed.rubrica).map((r: any) => ({
                    criterio: cleanText(r.criterio),
                    bajo: cleanText(r.bajo),
                    basico: cleanText(r.basico),
                    alto: cleanText(r.alto),
                    superior: cleanText(r.superior)
                })),
                autoevaluacion: ensureArray(parsed.autoevaluacion).map(cleanText),
                evaluacion: ensureArray(parsed.evaluacion).map((ev: any) => ({
                    pregunta: cleanText(ev.pregunta),
                    tipo: cleanText(ev.tipo || "multiple_choice"),
                    opciones: ensureArray(ev.opciones).map(cleanText),
                    respuesta_correcta: cleanText(ev.respuesta_correcta),
                    competencia: cleanText(ev.competencia),
                    explicacion: cleanText(ev.explicacion)
                })),
                alertas_generadas: ensureArray(parsed.alertas_generadas).map(cleanText),
                control_versiones: ensureArray(parsed.control_versiones).map((cv: any) => ({
                    version: cleanText(cv.version || "1.0"),
                    fecha: cleanText(cv.fecha || new Date().toLocaleDateString()),
                    descripcion: cleanText(cv.descripcion || "Generación")
                })),
                bibliografia: cleanText(parsed.bibliografia),
                observaciones: cleanText(parsed.observaciones),
                adecuaciones_piar: cleanText(parsed.adecuaciones_piar),
                elaboro: cleanText(parsed.elaboro) || input.docente_nombre || "Docente",
                reviso: cleanText(parsed.reviso) || "Coordinación Académica",
                pie_fecha: cleanText(parsed.pie_fecha) || new Date().toLocaleDateString(),
                tema_principal: cleanText(parsed.tema_principal) || safeTema,
                titulo_secuencia: cleanText(parsed.titulo_secuencia) || safeTema,
                descripcion_secuencia: cleanText(parsed.descripcion_secuencia),
                taller_imprimible: {
                    introduccion: cleanText(parsed.taller_imprimible?.introduccion),
                    instrucciones: cleanText(parsed.taller_imprimible?.instrucciones),
                    ejercicios: ensureArray(parsed.taller_imprimible?.ejercicios).map(cleanText),
                    reto_creativo: cleanText(parsed.taller_imprimible?.reto_creativo)
                }
            };

            console.log(`%c[✨ EXITO GROQ] ${modelName}`, "color: #10b981; font-weight: bold;");

            apiMetrics.groq.requests++;
            apiMetrics.groq.success++;
            apiMetrics.groq.lastUsed = new Date().toLocaleTimeString();
            saveMetrics();
            modelHealthStatus[modelName] = "online";
            lastWorkingModel = modelName;

            logApiKeyUsage('success', undefined, modelName, {
                user_email: input.docente_nombre,
                prompt_summary: safeTema,
                response_json: deepClean(normalized)
            });

            return deepClean(normalized);

        } catch (err: any) {
            lastError = err;
            console.warn(`[❌ Fallo Groq] ${modelName}: ${err.message}`);
            modelHealthStatus[modelName] = "offline";
            apiMetrics.groq.requests++;
            apiMetrics.groq.errors++;
            saveMetrics();
            logApiKeyUsage('error', err.message, modelName);

            if (err.message?.includes('429') || err.message?.includes('quota')) continue;
            // Si el error es de JSON parse, reintentar con el siguiente modelo
            if (err instanceof SyntaxError) continue;
        }
    }

    throw new Error(`[Fallo en Orquestación Groq]: ${lastError?.message}`);
};


