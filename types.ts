export interface SequenceInput {
  grado: string;
  area: string;
  asignatura: string;
  tema: string;
  dba: string; // Derecho Básico de Aprendizaje
  sesiones: number;
  ejeCrese: string;
  grupos: string;
  fecha: string;
  docente_nombre?: string;
}

export interface SesionDetalle {
  numero: number;
  titulo: string;
  descripcion: string;
}

export interface RecursoLink {
  tipo: string; // "Video", "Material didáctico", "Libro", "Sitio web", etc.
  nombre: string;
  url: string;
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

  // Secciones Principales
  proposito: string;
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
    demostracion: string;
  };

  // NUEVO: Plan por sesión
  sesiones_detalle?: SesionDetalle[];

  didactica: string;
  recursos: string;

  // NUEVO: Recursos con links
  recursos_links?: RecursoLink[];

  // Footer/Firmas
  elaboro: string;
  reviso: string;
  pie_fecha: string;

  // Campos adicionales para funcionalidades extra
  tema_principal: string;
  titulo_secuencia: string;
  descripcion_secuencia: string;
  evaluacion: EvaluationItem[];
  alertas_generadas?: string[];
  dba_utilizado?: string;
  taller_imprimible?: {
    introduccion: string;
    instrucciones: string;
    ejercicios: string[];
    reto_creativo: string;
  };
}

export interface EvaluationItem {
  pregunta: string;
  tipo: string;
  opciones?: string[];
  respuesta_correcta?: string;
  competencia?: string;
}
