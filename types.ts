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
  didactica: string;
  recursos: string;

  // Footer/Firmas
  elaboro: string;
  reviso: string;
  pie_fecha: string;

  // Campos adicionales para funcionalidades extra (pueden mantenerse o adaptarse)
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
}

