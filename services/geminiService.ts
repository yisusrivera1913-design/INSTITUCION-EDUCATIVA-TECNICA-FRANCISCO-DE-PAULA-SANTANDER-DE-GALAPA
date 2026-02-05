import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { SequenceInput, DidacticSequence } from "../types";
import { supabase } from "./supabaseClient";

export const modelHealthStatus: Record<string, 'online' | 'offline' | 'checking'> = {
  "gemini-2.5-flash": "checking",
  "gemini-2.0-flash": "checking",
  "gemini-1.5-flash": "checking",
  "gemini-1.5-pro": "checking",
  "gemini-2.0-flash-lite-preview-02-05": "checking"
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
    tema_principal: { type: SchemaType.STRING },
    titulo_secuencia: { type: SchemaType.STRING },
    descripcion_secuencia: { type: SchemaType.STRING },
    objetivo_aprendizaje: { type: SchemaType.STRING },
    contenidos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    competencias_men: { type: SchemaType.STRING },
    estandar: { type: SchemaType.STRING },
    metodologia: { type: SchemaType.STRING },
    corporiedad_adi: { type: SchemaType.STRING },
    actividades: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          sesion: { type: SchemaType.NUMBER },
          descripcion: { type: SchemaType.STRING },
          materiales: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          tiempo: { type: SchemaType.STRING },
          imprimibles: { type: SchemaType.STRING },
          adi_especifico: { type: SchemaType.STRING }
        },
        required: ["sesion", "descripcion", "materiales", "tiempo", "imprimibles", "adi_especifico"]
      }
    },
    rubrica: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          criterio: { type: SchemaType.STRING },
          basico: { type: SchemaType.STRING },
          satisfactorio: { type: SchemaType.STRING },
          avanzado: { type: SchemaType.STRING },
          retroalimentacion: { type: SchemaType.STRING }
        },
        required: ["criterio", "basico", "satisfactorio", "avanzado", "retroalimentacion"]
      }
    },
    evaluacion: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: { pregunta: { type: SchemaType.STRING }, tipo: { type: SchemaType.STRING } },
        required: ["pregunta", "tipo"]
      }
    },
    recursos: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: { nombre: { type: SchemaType.STRING }, descripcion: { type: SchemaType.STRING } },
        required: ["nombre", "descripcion"]
      }
    },
    productos_asociados: { type: SchemaType.STRING },
    instrumentos_evaluacion: { type: SchemaType.STRING },
    bibliografia: { type: SchemaType.STRING },
    observaciones: { type: SchemaType.STRING },
    adecuaciones_piar: { type: SchemaType.STRING },
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
    dba_utilizado: { type: SchemaType.STRING },
    eje_crese_utilizado: { type: SchemaType.STRING }
  },
  required: [
    "tema_principal", "titulo_secuencia", "descripcion_secuencia", "objetivo_aprendizaje",
    "contenidos", "competencias_men", "estandar", "metodologia", "corporiedad_adi",
    "actividades", "rubrica", "evaluacion", "recursos", "productos_asociados",
    "instrumentos_evaluacion", "bibliografia", "observaciones", "adecuaciones_piar",
    "eje_crese_utilizado", "taller_imprimible", "alertas_generadas", "dba_utilizado"
  ]
};

export const generateDidacticSequence = async (input: SequenceInput, refinementInstruction?: string): Promise<DidacticSequence> => {
  const getEnv = (key: string) => import.meta.env[key] || (process as any).env[key];
  const allKeys = [getEnv('VITE_API_KEY_1'), getEnv('VITE_API_KEY_2'), getEnv('VITE_API_KEY_3')];

  const usage = [apiMetrics.key1.requests, apiMetrics.key2.requests, apiMetrics.key3.requests];
  const sortedIndices = [0, 1, 2].sort((a, b) => usage[a] - usage[b]);

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite-preview-02-05"
  ];

  const safeTema = sanitizeInput(input.tema);
  const prompt = `
    Contexto: Eres un experto pedagógico del Ministerio de Educación Nacional de Colombia (MEN) asignado a la Institución Educativa Guaimaral.
    
    Tarea: Generar una Secuencia Didáctica de alta calidad para:
    Grado: ${input.grado}, Área: ${input.area}, Tema: ${safeTema}, Sesiones: ${input.sesiones}.
    DBA: ${sanitizeInput(input.dba)}.
    Eje CRESE: ${input.ejeCrese || 'Pertinente al tema'}.
    ${refinementInstruction ? `Instrucción de ajuste: ${sanitizeInput(refinementInstruction)}` : ''}

    Requisitos Críticos:
    1. Generar exactamente ${input.sesiones} sesiones detalladas.
    2. Rúbrica con 4 niveles (Superior, Alto, Básico, Bajo).
    3. Evaluación con preguntas tipo saber (5 por sesión).
    4. Taller imprimible con reto creativo.
    5. Adecuaciones PIAR para inclusión educativa.
    
    Responde estrictamente en formato JSON válido según el esquema.
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
            temperature: 0.7
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