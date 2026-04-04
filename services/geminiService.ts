import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { SequenceInput, DidacticSequence } from "../types";
import { supabase } from "./supabaseClient";

export const modelHealthStatus: Record<string, 'online' | 'offline' | 'checking'> = {
  "gemini-2.5-flash": "checking",
  "gemini-2.5-flash-8b": "checking",
  "gemini-2.0-flash": "checking",
  "gemini-1.5-flash": "checking",
  "gemini-1.5-pro": "checking",
};

const STORAGE_KEY = 'eduplaneacion_gemini_metricsv1';

const loadMetrics = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { console.warn("Error loading gemini metrics:", e); }
  return {
    key1: { requests: 0, success: 0, errors: 0, lastUsed: "", label: "Laura" },
    key2: { requests: 0, success: 0, errors: 0, lastUsed: "", label: "México" },
    key3: { requests: 0, success: 0, errors: 0, lastUsed: "", label: "Yarelis" }
  };
};

export const apiMetrics = loadMetrics();

const saveMetrics = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apiMetrics));
  } catch (e) { console.warn("Error saving gemini metrics:", e); }
};

const sanitizeInput = (text: string | undefined): string => {
  if (!text) return "";
  return text.trim().replace(/['"><]/g, "");
};

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

const logApiKeyUsage = async (idx: number, status: 'success' | 'error', errorMsg?: string, modelName?: string) => {
  if (!supabase) return;
  const labels = ["Laura", "México", "Yarelis"];
  try {
    await supabase.from('api_key_logs').insert([
      {
        key_name: labels[idx],
        status,
        error_message: errorMsg || null,
        action: `Respuesta de: ${modelName}`
      }
    ]);
  } catch (e) {
    console.warn("Log error:", e);
  }
};

const responseSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    institucion: { type: SchemaType.STRING },
    formato_nombre: { type: SchemaType.STRING },
    nombre_docente: { type: SchemaType.STRING },
    area: { type: SchemaType.STRING },
    asignatura: { type: SchemaType.STRING },
    grado: { type: SchemaType.STRING },
    grupos: { type: SchemaType.STRING },
    fecha: { type: SchemaType.STRING },
    num_secuencia: { type: SchemaType.NUMBER },
    proposito: { type: SchemaType.STRING },
    objetivos_aprendizaje: { type: SchemaType.STRING },
    contenidos_desarrollar: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    competencias_men: { type: SchemaType.STRING },
    estandar_competencia: { type: SchemaType.STRING },
    dba_utilizado: { type: SchemaType.STRING },
    dba_detalle: {
      type: SchemaType.OBJECT,
      properties: {
        numero: { type: SchemaType.STRING },
        enunciado: { type: SchemaType.STRING },
        evidencias: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      },
      required: ["numero", "enunciado", "evidencias"]
    },
    eje_transversal_crese: { type: SchemaType.STRING },
    corporiedad_adi: { type: SchemaType.STRING },
    metodologia: { type: SchemaType.STRING },
    indicadores: {
      type: SchemaType.OBJECT,
      properties: {
        cognitivo: { type: SchemaType.STRING },
        afectivo: { type: SchemaType.STRING },
        expresivo: { type: SchemaType.STRING }
      },
      required: ["cognitivo", "afectivo", "expresivo"]
    },
    ensenanzas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    secuencia_didactica: {
      type: SchemaType.OBJECT,
      properties: {
        motivacion_encuadre: { type: SchemaType.STRING },
        enunciacion: { type: SchemaType.STRING },
        modelacion: { type: SchemaType.STRING },
        simulacion: { type: SchemaType.STRING },
        ejercitacion: { type: SchemaType.STRING },
        transferencia: { type: SchemaType.STRING }
      },
      required: ["motivacion_encuadre", "enunciacion", "modelacion", "simulacion", "ejercitacion", "transferencia"]
    },
    sesiones_detalle: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          numero: { type: SchemaType.NUMBER },
          titulo: { type: SchemaType.STRING },
          descripcion: { type: SchemaType.STRING },
          tiempo: { type: SchemaType.STRING },
          momento_adi: { type: SchemaType.STRING }
        },
        required: ["numero", "titulo", "descripcion", "tiempo", "momento_adi"]
      }
    },
    didactica: { type: SchemaType.STRING },
    recursos: { type: SchemaType.STRING },
    recursos_links: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          tipo: { type: SchemaType.STRING },
          nombre: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING },
          descripcion: { type: SchemaType.STRING }
        },
        required: ["tipo", "nombre", "url", "descripcion"]
      }
    },
    bibliografia: { type: SchemaType.STRING },
    observaciones: { type: SchemaType.STRING },
    adecuaciones_piar: { type: SchemaType.STRING },
    rubrica: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          criterio: { type: SchemaType.STRING },
          bajo: { type: SchemaType.STRING },
          basico: { type: SchemaType.STRING },
          alto: { type: SchemaType.STRING },
          superior: { type: SchemaType.STRING }
        },
        required: ["criterio", "bajo", "basico", "alto", "superior"]
      }
    },
    elaboro: { type: SchemaType.STRING },
    reviso: { type: SchemaType.STRING },
    pie_fecha: { type: SchemaType.STRING },
    tema_principal: { type: SchemaType.STRING },
    titulo_secuencia: { type: SchemaType.STRING },
    descripcion_secuencia: { type: SchemaType.STRING },
    evaluacion: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          pregunta: { type: SchemaType.STRING },
          tipo: { type: SchemaType.STRING },
          competencia: { type: SchemaType.STRING },
          opciones: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          respuesta_correcta: { type: SchemaType.STRING },
          explicacion: { type: SchemaType.STRING }
        },
        required: ["pregunta", "tipo", "competencia", "opciones", "respuesta_correcta", "explicacion"]
      }
    },
    autoevaluacion: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    control_versiones: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          version: { type: SchemaType.STRING },
          fecha: { type: SchemaType.STRING },
          descripcion: { type: SchemaType.STRING }
        },
        required: ["version", "fecha", "descripcion"]
      }
    },
    taller_imprimible: {
      type: SchemaType.OBJECT,
      properties: {
        introduccion: { type: SchemaType.STRING },
        instrucciones: { type: SchemaType.STRING },
        ejercicios: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        reto_creativo: { type: SchemaType.STRING }
      },
      required: ["introduccion", "instrucciones", "ejercicios", "reto_creativo"]
    },
    alertas_generadas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
  },
  required: [
    "institucion", "formato_nombre", "nombre_docente", "area", "asignatura", "grado", "grupos", "fecha", "num_secuencia",
    "proposito", "objetivos_aprendizaje", "contenidos_desarrollar", "competencias_men", "estandar_competencia",
    "dba_utilizado", "eje_transversal_crese", "corporiedad_adi", "metodologia", "indicadores", "ensenanzas",
    "secuencia_didactica", "sesiones_detalle", "didactica", "recursos", "recursos_links",
    "elaboro", "reviso", "pie_fecha", "tema_principal", "titulo_secuencia", "descripcion_secuencia",
    "evaluacion", "taller_imprimible", "alertas_generadas", "rubrica"
  ]
};

export const generateDidacticSequence = async (input: SequenceInput, refinementInstruction?: string, currentContext?: DidacticSequence): Promise<DidacticSequence> => {
  const getEnv = (key: string) => import.meta.env[key] || (process as any).env[key];
  const allKeys = [getEnv('VITE_API_KEY_1'), getEnv('VITE_API_KEY_2'), getEnv('VITE_API_KEY_3')];

  const usage = [apiMetrics.key1.requests, apiMetrics.key2.requests, apiMetrics.key3.requests];
  const sortedIndices = [0, 1, 2].sort((a, b) => usage[a] - usage[b]);

  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
  ];

  const safeTema = sanitizeInput(input.tema);
  const areaNormativa = {
    conDBA: ['MATEMATICAS', 'LENGUAJE', 'LENGUA CASTELLANA', 'CIENCIAS NATURALES', 'CIENCIAS SOCIALES', 'INGLES', 'FISICA', 'ESTADISTICA', 'GEOMETRIA', 'BIOLOGIA', 'QUIMICA'],
    conOrientaciones: ['EDUCACION ARTISTICA', 'EDUCACION FISICA', 'ETICA', 'VALORES', 'RELIGION', 'TECNOLOGIA', 'FILOSOFIA', 'CONVIVENCIA', 'AGROPECUARIA', 'CATEDRA DE LA PAZ']
  };

  const currentArea = input.area.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isMultigrado = input.grado.toLowerCase().includes("multigrado");
  const isIntegral = input.area.toLowerCase().includes("integral");

  const hasDBA = areaNormativa.conDBA.some(a => currentArea.includes(a)) || isIntegral;

  let pedagogicalInstruction = hasDBA
    ? `- **DBA Obligatorio (MEN Colombia):** Esta área REQUIERE el uso de DBA. Debes identificar el número exacto del DBA (ej: "Matemáticas DBA #4") y transcribir su contenido literal. 
       - **Input del Usuario:** ${sanitizeInput(input.dba) || 'Sin DBA especificado'}. Si el docente no lo especificó, TÚ debes buscarlo y citar el más adecuado para el tema "${input.tema}".`
    : `- **Referencia Pedagógica:** Esta área NO utiliza DBA oficiales. Debes citar las **"Orientaciones Pedagógicas y Curriculares del MEN para ${input.area}"**.`;

  const nombreInstitucion = sanitizeInput(input.nombre_institucion) || 'la Institución Educativa';
  const codigoFormato = input.codigo_formato || 'F-PA-03';
  const modeloPedagogico = input.modelo_pedagogico || 'ADI';

  const prompt = `
    ### PERSONA: COORDINADOR PEDAGÓGICO IA
    Eres el experto en currículo de la institución educativa: **${nombreInstitucion}**. 
    Tu objetivo es generar planeaciones de clase con RIGOR ACADÉMICO y EXCELENCIA PEDAGÓGICA.
    Formato institucional de referencia: **${codigoFormato}** | Modelo pedagógico: **${modeloPedagogico}**.

    ### REGLAS DE ORO DE CALIDAD:
    1. **DBA MASTER (MEN COLOMBIA):** Tienes acceso a los Derechos Básicos de Aprendizaje (DBA) de Colombia. 
       - SIEMPRE transcribe el enunciado **LITERAL** y el **CÓDIGO/NÚMERO** oficial (ej: "Matemáticas DBA #4 - 5°").
       - SIEMPRE incluye las **EVIDENCIAS DE APRENDIZAJE** oficiales asociadas a ese DBA.
       - DIFERENCIA VERSIONES: Prioriza las versiones más recientes del MEN (V2 si aplica).
       - CAMPO OBLIGATORIO: El objeto dba_detalle NUNCA puede estar vacío para áreas básicas. Si no tienes el literal exacto, DEBES buscar el referente más cercano en los Estándares Básicos de Competencia (EBC).
    2. **EVALUACIÓN POR COMPETENCIAS (ICFES):** Genera **EXACTAMENTE 10 PREGUNTAS** de selección múltiple. CADA PREGUNTA debe basarse en una **Situación Problema** o caso de la vida real (ej: "Un agricultor en Galapa...", "En la tienda escolar...", "Juan observa que..."). 
       - PROHIBIDAS: Preguntas de memoria simple (ej: "¿Qué es...?", "¿Cuántos...?").
       - REQUERIDO: Evaluar competencias (Uso del conocimiento, Explicación de fenómenos, Indagación).
       - CADA PREGUNTA debe tener: Contexto (Situación), Enunciado preciso, 4 opciones plausibles, clave correcta y una EXPLICACIÓN PEDAGÓGICA profunda del porqué es la respuesta correcta.
    3. **INTEGRACIÓN INTELIGENTE:** Si se solicitan áreas incompatibles (ej: Religión y Geometría), NO inventes conexiones forzadas. Si no existe un puente pedagógico natural, deja los campos de integración en blanco o sepáralos estrictamente. Prioriza siempre el rigor técnico de cada área por separado.
    4. **Propósito Holístico:** Genera una síntesis que integre el saber (cognitivo), el ser (afectivo) y el hacer (expresivo).
    5. **Simplificación Institucional:** Evita términos comerciales como "Platinum", "Golden" o "Supreme". Usa un tono formal e institucional. 
    6. **Terminología:** Usa "transferencia" para la fase final. PROHIBIDO: "ABP".
    7. **LIMPIEZA TOTAL:** PROHIBIDO EL USO DE ASTERISCOS (*) EN CUALQUIER PARTE DEL TEXTO (ni siquiera para viñetas o negritas). Usa puntos o guiones si es necesario.
    8. **Limpieza:** Sin minutos en sesiones.

    ### INSTRUCCIONES DE DISEÑO ELITE:

    1. **Derechos Básicos de Aprendizaje (DBA):**
       - "dba_utilizado": El resumen técnico (ej: "Matemáticas DBA #3").
       - "dba_detalle": { "numero", "enunciado", "evidencias": [] }
       - "titulo_secuencia": Creativo y pedagógico.
       - "objetivos_aprendizaje": Verbos en infinitivo.
       - "contenidos_desarrollar": Lista detallada de subtemas.

    2. **Ejes Transversales y ADI:**
       - "eje_transversal_crese": Componente socioemocional y ciudadano.
       - "corporiedad_adi": Movimiento y expresión corporal.

    3. **Sesiones Detalladas (sesiones_detalle):**
       - Generar exactamente ${input.sesiones} sesiones.
       - "momento_adi": Actividad de activación específica.
       - "descripcion": Detalle paso a paso SIN mención a minutos.

    4. **Estructura Didáctica Profunda:**
       - "secuencia_didactica": { "motivacion_encuadre", "enunciacion", "modelacion", "simulacion", "ejercitacion", "transferencia" }
       - Cada campo de la secuencia DEBE tener al menos 2-3 líneas de texto altamente técnico y educativo, explicando la acción pedagógica específica.

    5. **Taller y Evaluación:**
       - "evaluacion": **ESTRICTAMENTE 10 PREGUNTAS** ICFES con 4 opciones. Cada una con "competencia" y "explicacion" pedagógica detallada.
       - "taller_imprimible": Con "reto creativo" de alto impacto.

    6. **Rúbrica de Desempeño (SIEE):**
       - 4 niveles: Bajo, Básico, Alto, Superior.
       - Criterios Cognitivos, Procedimentales y Actitudinales.

    7. **Recursos Digitales (PROHIBIDO YOUTUBE):**
       - Solo links oficiales: Colombia Aprende, Eduteka, Portales .edu, Khan Academy (sitio).

    ${currentContext ? `### CONTEXTO ACTUAL DE LA SECUENCIA:
    Actualmente la secuencia tiene este contenido: ${JSON.stringify(currentContext)}
    
    ### INSTRUCCIÓN DE MODIFICACIÓN DIRECTA:
    El usuario quiere cambiar lo siguiente: ${refinementInstruction}.
    POR FAVOR, SOLO MODIFICA LOS CAMPOS AFECTADOS Y MANTÉN EL RESTO IGUAL PARA AHORRAR TOKENS Y TIEMPO.
    ` : refinementInstruction ? `- **COMANDO DE REFINAMIENTO PERSONALIZADO:** ${sanitizeInput(refinementInstruction)}` : ''}

    Responde exclusivamente con el objeto JSON.
  `;


  let lastError: any;

  for (const i of sortedIndices) {
    const key = allKeys[i];
    if (!key || key.length < 20) continue;
    const label = ["Laura", "México", "Yarelis"][i];

    for (const modelName of modelsToTry) {
      try {
        console.log(`[🔍 Orquestador] Probando ${modelName} con Llave: ${label}...`);
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.1
          }
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

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

        console.log(`%c[✨ ÉXITO] Respondió: ${modelName} | Llave: ${label}`, "color: #10b981; font-weight: bold;");

        const mKey = `key${i + 1}` as keyof typeof apiMetrics;
        apiMetrics[mKey].requests++;
        apiMetrics[mKey].success++;
        apiMetrics[mKey].lastUsed = new Date().toLocaleTimeString();
        saveMetrics();

        modelHealthStatus[modelName] = "online";
        logApiKeyUsage(i, 'success', undefined, modelName);
        return deepClean(normalized);

      } catch (err: any) {
        lastError = err;
        console.warn(`[❌ Intento Fallido] ${modelName} (${label}): ${err.message}`);
        modelHealthStatus[modelName] = "offline";
        const mKey = `key${i + 1}` as keyof typeof apiMetrics;
        apiMetrics[mKey].requests++;
        apiMetrics[mKey].errors++;
        saveMetrics();
        logApiKeyUsage(i, 'error', err.message, modelName);

        if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('limit')) continue;
      }
    }
  }

  throw new Error(`[Fallo en Orquestación]: Ninguna combinación de llave y modelo tiene cuota disponible. Error final: ${lastError?.message}`);
};

export let lastWorkingModel = "gemini-2.0-flash";