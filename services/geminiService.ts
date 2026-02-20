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

export const apiMetrics = {
  key1: { requests: 0, success: 0, errors: 0, lastUsed: "", label: "Laura" },
  key2: { requests: 0, success: 0, errors: 0, lastUsed: "", label: "México" },
  key3: { requests: 0, success: 0, errors: 0, lastUsed: "", label: "Yarelis" }
};

const sanitizeInput = (text: string | undefined): string => {
  if (!text) return "";
  return text.trim().replace(/['"><]/g, "");
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
        demostracion: { type: SchemaType.STRING }
      },
      required: ["motivacion_encuadre", "enunciacion", "modelacion", "simulacion", "ejercitacion", "demostracion"]
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

export const generateDidacticSequence = async (input: SequenceInput, refinementInstruction?: string): Promise<DidacticSequence> => {
  const getEnv = (key: string) => import.meta.env[key] || (process as any).env[key];
  const allKeys = [getEnv('VITE_API_KEY_1'), getEnv('VITE_API_KEY_2'), getEnv('VITE_API_KEY_3')];

  const usage = [apiMetrics.key1.requests, apiMetrics.key2.requests, apiMetrics.key3.requests];
  const sortedIndices = [0, 1, 2].sort((a, b) => usage[a] - usage[b]);

  const modelsToTry = [
    "gemini-2.0-flash", // Use 2.0 as primary
    "gemini-1.5-pro",
    "gemini-1.5-flash"
  ];

  const safeTema = sanitizeInput(input.tema);
  const areaNormativa = {
    conDBA: ['MATEMATICAS', 'LENGUAJE', 'CIENCIAS NATURALES', 'CIENCIAS SOCIALES', 'INGLES', 'FISICA', 'ESTADISTICA', 'GEOMETRIA', 'BIOLOGIA', 'QUIMICA'],
    conOrientaciones: ['EDUCACION ARTISTICA', 'EDUCACION FISICA', 'ETICA', 'VALORES', 'RELIGION', 'TECNOLOGIA', 'FILOSOFIA', 'CONVIVENCIA', 'AGROPECUARIA', 'CATEDRA DE LA PAZ']
  };

  const currentArea = input.area.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isMultigrado = input.grado.toLowerCase().includes("multigrado");
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
       - Para cada criterio, definir los niveles: "Básico" (apenas cumple), "Satisfactorio" (cumple lo esperado) y "Avanzado" (excelencia/supera).

    5. **Taller y Evaluación:**
       - Generar 10 preguntas tipo ICFES con 4 opciones. Cada una con su "competencia" (ej: Interpretativa).
       - IMPORTANTE: Para cada pregunta de evaluación, proporciona una "explicacion" pedagógica de por qué la respuesta correcta es la elegida.
       - Taller imprimible con "reto creativo" innovador.

    6. **Rúbrica de Desempeño (SIEE):**
       - Debe tener 4 niveles: Bajo, Básico, Alto, Superior.
       - Los criterios deben evaluar dimensiones Cognitivas, Procedimentales y Actitudinales.

    6. **Inclusión y Autoevaluación:**
       - "adecuaciones_piar": Estrategias específicas para estudiantes con diversas capacidades.
       - "autoevaluacion": Genera una lista de 4 preguntas reflexivas para que el estudiante evalúe su propio proceso (ej: "¿Qué fue lo que más se me dificultó?").

    7. **Administración Institucional:**
       - "control_versiones": Genera una entrada inicial de control (ej: Version 1.0, Fecha actual, "Creación de secuencia didáctica").

    7. **Recursos Digitales (PROHIBIDO YOUTUBE):**
       - Proporcionar solo links de alta calidad educativa de portales oficiales.
       - **REGLA DE ORO:** Está terminantemente PROHIBIDO incluir enlaces a YouTube o redes sociales. 
       - Solo se permiten sitios como: Colombia Aprende, Eduteka, Biblioteca Nacional, Portales Universitarios (.edu), Khan Academy (sitio web), o repositorios institucionales.

    ${refinementInstruction ? `- **COMANDO DE REFINAMIENTO PERSONALIZADO:** ${sanitizeInput(refinementInstruction)}` : ''}

    Responde exclusivamente en JSON siguiendo el esquema proporcionado.
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

        console.log(`%c[✨ ÉXITO] Respondió: ${modelName} | Llave: ${label}`, "color: #10b981; font-weight: bold;");

        const mKey = `key${i + 1}` as keyof typeof apiMetrics;
        apiMetrics[mKey].requests++;
        apiMetrics[mKey].success++;
        apiMetrics[mKey].lastUsed = new Date().toLocaleTimeString();

        modelHealthStatus[modelName] = "online";
        logApiKeyUsage(i, 'success', undefined, modelName);
        return parsed as DidacticSequence;

      } catch (err: any) {
        lastError = err;
        console.warn(`[❌ Intento Fallido] ${modelName} (${label}): ${err.message}`);
        modelHealthStatus[modelName] = "offline";
        const mKey = `key${i + 1}` as keyof typeof apiMetrics;
        apiMetrics[mKey].requests++;
        apiMetrics[mKey].errors++;
        logApiKeyUsage(i, 'error', err.message, modelName);

        if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('limit')) continue;
      }
    }
  }

  throw new Error(`[Fallo en Orquestación]: Ninguna combinación de llave y modelo tiene cuota disponible. Error final: ${lastError?.message}`);
};

export let lastWorkingModel = "gemini-2.0-flash";