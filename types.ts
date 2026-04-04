// ==============================================================================
// EDUPLAENACIÓN AI — SaaS Multi-Colegio v2.0 — Types & Interfaces
// ==============================================================================

export interface Institucion {
  id: string;
  nombre: string;
  slug: string;
  nit?: string;
  municipio?: string;
  dominio_email?: string;
  config_visual: {
    logo_url: string | null;
    color_primario: string;
    codigo_formato: string;
    modelo_pedagogico: string;
  };
  plan_suscripcion: 'bronce' | 'plata' | 'oro';
  creditos_usados: number;
  activo: boolean;
  created_at?: string;
}

export interface SequenceInput {
  grado: string;
  area: string;
  asignatura: string;
  tema: string;
  dba: string; // Derecho Básico de Aprendizaje
  sesiones: number;
  num_secuencia: number;
  ejeCrese: string;
  grupos: string;
  fecha: string;
  docente_nombre?: string;
  // SaaS Multi-Colegio: Contexto institucional dinámico
  nombre_institucion?: string;
  institucion_id?: string;
  logo_url?: string | null;
  codigo_formato?: string;
  modelo_pedagogico?: string;
  municipio?: string;
}

export interface SesionDetalle {
  numero: number;
  titulo: string;
  descripcion: string;
  tiempo: string;
  momento_adi: string;
}

export interface RecursoLink {
  tipo: string;
  nombre: string;
  url: string;
  descripcion?: string;
}

export interface RubricaCriterio {
  criterio: string;
  bajo: string;
  basico: string;
  alto: string;
  superior: string;
}

export interface EvaluationItem {
  pregunta: string;
  tipo: string;
  opciones?: string[];
  respuesta_correcta?: string;
  competencia?: string;
  explicacion?: string;
}

export interface DbaDetalle {
  numero: string;
  enunciado: string;
  evidencias: string[];
}

export interface DidacticSequence {
  // Encabezado
  institucion: string;
  formato_nombre: string;
  nombre_docente: string;
  area: string;
  asignatura: string;
  grado: string;
  grupos: string;
  fecha: string;
  num_secuencia: number;

  // Secciones Principales
  proposito: string;
  objetivos_aprendizaje: string;
  contenidos_desarrollar: string[];
  competencias_men: string;
  estandar_competencia: string;
  dba_utilizado: string;
  dba_detalle?: DbaDetalle;
  eje_transversal_crese: string;
  corporiedad_adi: string;
  metodologia: string;

  indicadores: {
    cognitivo: string;
    afectivo: string;
    expresivo: string;
  };

  ensenanzas: string[];
  secuencia_didactica: {
    motivacion_encuadre: string;
    enunciacion: string;
    modelacion: string;
    simulacion: string;
    ejercitacion: string;
    transferencia: string;
  };

  sesiones_detalle: SesionDetalle[];

  didactica: string;
  recursos: string;
  recursos_links?: RecursoLink[];
  bibliografia?: string;
  observaciones?: string;
  adecuaciones_piar?: string;
  rubrica?: RubricaCriterio[];

  // Footer/Firmas
  elaboro: string;
  reviso: string;
  pie_fecha: string;

  // Extensiones pedagógicas
  autoevaluacion?: string[];
  control_versiones?: {
    version: string;
    fecha: string;
    descripcion: string;
  }[];

  // Otros
  tema_principal: string;
  titulo_secuencia: string;
  descripcion_secuencia: string;
  evaluacion: EvaluationItem[];
  alertas_generadas?: string[];
  taller_imprimible?: {
    introduccion: string;
    instrucciones: string;
    ejercicios: string[];
    reto_creativo: string;
  };
}
