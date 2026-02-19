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
  return text.trim().replace(/['"<>]/g, "");
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
    proposito: { type: SchemaType.STRING },
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
    didactica: { type: SchemaType.STRING },
    recursos: { type: SchemaType.STRING },
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
          opciones: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          respuesta_correcta: { type: SchemaType.STRING }
        },
        required: ["pregunta", "tipo", "opciones", "respuesta_correcta"]
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
    alertas_generadas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    dba_utilizado: { type: SchemaType.STRING }
  },
  required: [
    "institucion", "formato_nombre", "nombre_docente", "area", "asignatura", "grado", "grupos", "fecha",
    "proposito", "indicadores", "ensenanzas", "secuencia_didactica", "didactica", "recursos",
    "elaboro", "reviso", "pie_fecha", "tema_principal", "titulo_secuencia", "descripcion_secuencia",
    "evaluacion", "taller_imprimible", "alertas_generadas", "dba_utilizado"
  ]
};

export const generateDidacticSequence = async (input: SequenceInput, refinementInstruction?: string): Promise<DidacticSequence> => {
  const getEnv = (key: string) => import.meta.env[key] || (process as any).env[key];
  const allKeys = [getEnv('VITE_API_KEY_1'), getEnv('VITE_API_KEY_2'), getEnv('VITE_API_KEY_3')];

  const usage = [apiMetrics.key1.requests, apiMetrics.key2.requests, apiMetrics.key3.requests];
  const sortedIndices = [0, 1, 2].sort((a, b) => usage[a] - usage[b]);

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-8b",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
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
       - **Input del Usuario:** ${sanitizeInput(input.dba) || 'Sin DBA previo'}. Si este input es un número, busca el contenido oficial. Si es texto, valida su correspondencia con el número.`
    : `- **Referencia Pedagógica:** Esta área NO utiliza DBA. Debes citar explícitamente las **"Orientaciones Pedagógicas y Curriculares del MEN para ${input.area}"**. 
       - **Instrucción Especial:** En la casilla de DBA, debes colocar: "Tomado de las Orientaciones Pedagógicas del MEN: [Citar el eje o lineamiento específico usado]". NO inventes un número de DBA.`;

  if (isMultigrado) {
    pedagogicalInstruction += `
    - **INSTRUCCIÓN ESPECIAL MULTIGRADO:** Esta secuencia es para un aula MULTIGRADO. Debes especificar acciones y niveles de complejidad diferenciados para cada grado: **Transición, 1°, 2°, 3°, 4° y 5°**. 
    - **Enfoque Integrador:** Debes fusionar de manera coherente las 4 áreas básicas (Lenguaje, Matemáticas, Sociales y Naturales) en una sola secuencia didáctica funcional.`;
  }

  const prompt = `
    ### PERSONA: MASTER RECTOR AI (V5.0 PLATINUM)
    Eres el Agente Supremo de la INSTITUCION EDUCATIVA TECNICA FRANCISCO DE PAULA SANTANDER DE GALAPA.
    Tu misión es la perfección absoluta en cada letra y estructura, siguiendo el formato de PLANEACIÓN DE CLASE institucional.

    ### PARÁMETROS DE LA SECUENCIA
    - **Docente:** ${input.docente_nombre || 'No especificado'}
    - **Área:** ${input.area} | **Asignatura:** ${input.asignatura}
    - **Grado:** ${input.grado} | **Grupos:** ${input.grupos}
    - **Tema:** ${safeTema} | **Fecha:** ${input.fecha} | **Sesiones:** ${input.sesiones}
    ${pedagogicalInstruction}
    - **Banco de Evaluación:** Generar obligatoriamente **10 preguntas** de selección múltiple tipo ICFES con 4 opciones.
    - **Integración Transversal:** ${input.ejeCrese || 'Fusión socioemocional y ciudadana de alto impacto.'}
    ${refinementInstruction ? `- **COMANDO DE REFINAMIENTO MAESTRO:** ${sanitizeInput(refinementInstruction)}` : ''}

    ### ESTRUCTURA REQUERIDA (JSON)
    Debes completar los siguientes campos basándote en la imagen institucional:
    1. **institucion**: "INSTITUCION EDUCATIVA TECNICA FRANCISCO DE PAULA SANTANDER DE GALAPA"
    2. **formato_nombre**: "PLANEACIÓN DE CLASE"
    3. **proposito**: El objetivo principal de la planeación.
    4. **indicadores**: Objeto con subcampos 'cognitivo', 'afectivo' y 'expresivo'.
    5. **ensenanzas**: Lista de temas o conceptos a enseñar (usar asteriscos en la descripción literal).
    6. **secuencia_didactica**: Objeto con los 6 momentos: 'motivacion_encuadre', 'enunciacion', 'modelacion', 'simulacion', 'ejercitacion', 'demostracion'.
    7. **didactica**: Descripción de la metodología activa (ej: actividad de comprensión, narraciones, etc.)
    8. **recursos**: Texto con los materiales necesarios.
    9. **elaboro**: Nombre del docente (${input.docente_nombre || '...'}).
    10. **reviso**: Nombre del coordinador o rector (dejar en blanco o poner "Coordinación Académica").
    11. **pie_fecha**: Fecha de elaboración.

    Responde únicamente con el JSON validado.
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
            temperature: 0.1 // Reducimos temperatura para máxima precisión y menos alucinación
          }
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        console.log(`% c[✨ ÉXITO]Respondió: ${modelName} | Llave: ${label} `, "color: #10b981; font-weight: bold;");

        const mKey = `key${i + 1}` as keyof typeof apiMetrics;
        apiMetrics[mKey].requests++;
        apiMetrics[mKey].success++;
        apiMetrics[mKey].lastUsed = new Date().toLocaleTimeString();

        modelHealthStatus[modelName] = "online";
        logApiKeyUsage(i, 'success', undefined, modelName);
        return parsed as DidacticSequence;

      } catch (err: any) {
        lastError = err;
        console.warn(`[❌ Intento Fallido] ${modelName} (${label}): ${err.message} `);
        modelHealthStatus[modelName] = "offline";
        const mKey = `key${i + 1}` as keyof typeof apiMetrics;
        apiMetrics[mKey].requests++;
        apiMetrics[mKey].errors++;
        logApiKeyUsage(i, 'error', err.message, modelName);

        if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('limit')) continue;
      }
    }
  }

  throw new Error(`[Fallo en Orquestación]: Ninguna combinación de llave y modelo tiene cuota disponible.Error final: ${lastError?.message} `);
};

export let lastWorkingModel = "gemini-2.0-flash";