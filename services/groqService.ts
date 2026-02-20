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

const logApiKeyUsage = async (status: 'success' | 'error', errorMsg?: string, modelName?: string) => {
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
    } catch (e) {
        console.warn("Log error:", e);
    }
};

export const generateDidacticSequence = async (input: SequenceInput, refinementInstruction?: string): Promise<DidacticSequence> => {
    const getEnv = (key: string) => import.meta.env[key] || (process as any).env[key];
    const apiKey = getEnv('VITE_GROQ_API_KEY');

    if (!apiKey) {
        throw new Error("VITE_GROQ_API_KEY no configurada.");
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

    1. **Derechos Básicos de Aprendizaje (DBA):**
       - Debes ser EXHAUSTIVO con el DBA.
       - "dba_utilizado": El resumen técnico (ej: "Matemáticas DBA #3").
       - "dba_detalle": Objeto con:
          - "numero": El identificador (ej: "DBA 3").
          - "enunciado": El texto literal y completo del DBA del MEN.
          - "evidencias": Lista de las evidencias de aprendizaje asociadas a ese DBA que se trabajarán.
       - "titulo_secuencia": Un título creativo y pedagógico (ej: "Explorando el Mundo de los Fraccionarios").
       - "objetivos_aprendizaje": Redactar objetivos claros que inicien con verbo en infinitivo.
       - "contenidos_desarrollar": Lista detallada de subtemas conceptuales, procedimentales y actitudinales.

    2. **Ejes Transversales y ADI:**
       - "eje_transversal_crese": Cómo se integra el componente socioemocional, ciudadano y de convivencia.
       - "corporiedad_adi": Cómo se involucra el movimiento, la expresión corporal y el bienestar físico en el aprendizaje del tema.

    3. **Sesiones Detalladas (sesiones_detalle):**
       - Debes generar exactamente ${input.sesiones} sesiones.
       - Cada sesión debe durar un tiempo coherente (ej: "90 minutos").
       - "momento_adi": Actividad específica de activación sensorial o corporal para esa sesión.
       - "descripcion": Detalle paso a paso del desarrollo pedagógico.

    4. **Rubrica de Desempeño (rubrica):**
       - Generar una rúbrica profesional con 3 criterios de evaluación.
       - Para cada criterio, definir los niveles: "Bajo", "Básico", "Alto", "Superior".

    5. **Taller y Evaluación:**
       - Generar 10 preguntas tipo ICFES con 4 opciones. Cada una con su "competencia" (ej: Interpretativa).
       - IMPORTANTE: Para cada pregunta de evaluación, proporciona una "explicacion" pedagógica de por qué la respuesta correcta es la elegida.
       - Taller imprimible con "reto creativo" innovador.

    6. **Inclusión y Autoevaluación:**
       - "adecuaciones_piar": Estrategias específicas para estudiantes con diversas capacidades.
       - "autoevaluacion": Genera una lista de 4 preguntas reflexivas para que el estudiante evalúe su propio proceso (ej: "¿Qué fue lo que más se me dificultó?").

    7. **Administración Institucional:**
       - "control_versiones": Genera una entrada inicial de control (ej: Version 1.0, Fecha actual, "Creación de secuencia didáctica").

    8. **Recursos Digitales (PROHIBIDO YOUTUBE):**
       - Proporcionar solo links de alta calidad educativa de portales oficiales.
       - **REGLA DE ORO:** Está terminantemente PROHIBIDO incluir enlaces a YouTube o redes sociales. 
       - Solo se permiten sitios como: Colombia Aprende, Eduteka, Biblioteca Nacional, Portales Universitarios (.edu), Khan Academy (sitio web), o repositorios institucionales.

    9. **Alertas de Incoherencia (alertas_generadas):**
       - Si detectas que el tema no corresponde al área o grado, genera mensajes de advertencia en este array. Si todo es correcto, deja el array vacío [].

    ${refinementInstruction ? `- **COMANDO DE REFINAMIENTO PERSONALIZADO:** ${sanitizeInput(refinementInstruction)}` : ''}

    Responde exclusivamente en JSON válido que cumpla con la interfaz DidacticSequence.
    No incluyas explicaciones fuera del JSON. 
    REGLA CRÍTICA DE ESTRUCTURA: Los siguientes campos DEBEN ser ARRAYS (listas []):
    - "rubrica": [ { "criterio": "...", "bajo": "...", "basico": "...", "alto": "...", "superior": "..." }, ... ] (Mínimo 3 criterios)
    - "contenidos_desarrollar": [ "string", "string", ... ]
    - "sesiones_detalle": [ { "numero": 1, "titulo": "...", "descripcion": "...", "tiempo": "...", "momento_adi": "..." }, ... ]
    - "evaluacion": [ { "pregunta": "...", "tipo": "...", "competencia": "...", "opciones": ["A", "B", "C", "D"], "respuesta_correcta": "A", "explicacion": "..." }, ... ] (Exactamente 10 preguntas)
    - "autoevaluacion": [ "pregunta 1", "pregunta 2", ... ]
    - "alertas_generadas": [ "string", ... ]
    - "recursos_links": [ { "tipo": "...", "nombre": "...", "url": "...", "descripcion": "..." }, ... ]
    - "control_versiones": [ { "version": "...", "fecha": "...", "descripcion": "..." } ]

    Asegúrate de que el JSON incluya TODOS los campos requeridos: institucion, formato_nombre, nombre_docente, area, asignatura, grado, grupos, fecha, num_secuencia, proposito, objetivos_aprendizaje, contenidos_desarrollar, competencias_men, estandar_competencia, dba_utilizado, dba_detalle, eje_transversal_crese, corporiedad_adi, metodologia, indicadores, ensenanzas, secuencia_didactica, sesiones_detalle, didactica, recursos, recursos_links, elaboro, reviso, pie_fecha, tema_principal, titulo_secuencia, descripcion_secuencia, evaluacion, taller_imprimible, alertas_generadas, rubrica, autoevaluacion, control_versiones.
  `;

    let lastError: any;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[🔍 Orquestador Groq] Probando ${modelName}...`);

            const response = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Eres el Agente Supremo MASTER RECTOR AI. Generas secuencias didácticas de nivel experto para la I.E.T. Francisco de Paula Santander. Tu salida debe ser exclusivamente un objeto JSON que siga estrictamente la estructura DidacticSequence. No uses markdown, no des explicaciones, solo devuelve el JSON puro."
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

            // Normalización de datos para asegurar compatibilidad con la UI
            const normalizeParsedData = (data: any): DidacticSequence => {
                const ensureArray = (field: any) => Array.isArray(field) ? field : [];

                return {
                    ...data,
                    indicadores: data.indicadores || { cognitivo: "", afectivo: "", expresivo: "" },
                    secuencia_didactica: data.secuencia_didactica || {
                        motivacion_encuadre: "",
                        enunciacion: "",
                        modelacion: "",
                        simulacion: "",
                        ejercitacion: "",
                        demostracion: ""
                    },
                    contenidos_desarrollar: ensureArray(data.contenidos_desarrollar),
                    ensenanzas: ensureArray(data.ensenanzas),
                    sesiones_detalle: ensureArray(data.sesiones_detalle),
                    recursos_links: ensureArray(data.recursos_links),
                    rubrica: ensureArray(data.rubrica),
                    autoevaluacion: ensureArray(data.autoevaluacion),
                    evaluacion: ensureArray(data.evaluacion),
                    alertas_generadas: ensureArray(data.alertas_generadas),
                    control_versiones: ensureArray(data.control_versiones)
                };
            };

            const normalized = normalizeParsedData(parsed);

            console.log(`%c[✨ ÉXITO GROQ] Respondió: ${modelName}`, "color: #10b981; font-weight: bold;");

            apiMetrics.groq.requests++;
            apiMetrics.groq.success++;
            apiMetrics.groq.lastUsed = new Date().toLocaleTimeString();

            modelHealthStatus[modelName] = "online";
            logApiKeyUsage('success', undefined, modelName);
            return normalized;

        } catch (err: any) {
            lastError = err;
            console.warn(`[❌ Intento Fallido Groq] ${modelName}: ${err.message}`);
            modelHealthStatus[modelName] = "offline";
            apiMetrics.groq.requests++;
            apiMetrics.groq.errors++;
            logApiKeyUsage('error', err.message, modelName);

            if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('limit')) continue;
        }
    }

    throw new Error(`[Fallo en Orquestación Groq]: Ningún modelo disponible en Groq. Error final: ${lastError?.message}`);
};

export let lastWorkingModel = "llama-3.3-70b-versatile";
