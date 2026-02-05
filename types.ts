export interface SequenceInput {
  grado: string;
  area: string;
  tema: string;
  dba: string; // Derecho Básico de Aprendizaje
  sesiones: number;
  ejeCrese: string;
}

export interface Activity {
  sesion: number;
  descripcion: string;
  materiales: string[];
  tiempo: string;
  imprimibles: string;
  adi_especifico?: string; // Momento ADI/CRESE específico de la sesión
}

export interface RubricCriteria {
  criterio: string;
  basico: string;
  satisfactorio: string;
  avanzado: string;
  retroalimentacion: string;
}

export interface EvaluationItem {
  pregunta: string;
  tipo: string;
}

export interface Resource {
  nombre: string;
  descripcion: string;
}

export interface DidacticSequence {
  tema_principal: string;
  objetivo_aprendizaje: string;
  contenidos: string[];
  competencias_men: string;
  estandar: string;
  metodologia: string;
  corporiedad_adi: string; // Specific institutional field
  actividades: Activity[];
  rubrica: RubricCriteria[];
  evaluacion: EvaluationItem[];
  recursos: Resource[];
  alertas_generadas?: string[]; // Para mensajes de incoherencia (Ej: "DBA corregido...")
  dba_utilizado?: string; // El DBA que realmente usó la IA

  // Nuevos campos formato institucional
  titulo_secuencia: string;
  descripcion_secuencia: string;
  productos_asociados: string;
  instrumentos_evaluacion: string;
  bibliografia: string; // Puede ser string largo o array, usaremos string con saltos por simplicidad visual
  observaciones: string;
  adecuaciones_piar: string;
  eje_crese_utilizado?: string; // El eje CRESE seleccionado por la IA
  // Nuevos campos para facilitar la vida al docente
  taller_imprimible: {
    introduccion: string;
    instrucciones: string;
    ejercicios: string[];
    reto_creativo: string;
  };
}
