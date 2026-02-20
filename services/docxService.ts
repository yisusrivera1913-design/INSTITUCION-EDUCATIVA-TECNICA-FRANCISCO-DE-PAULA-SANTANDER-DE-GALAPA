/**
 * @file docxService.ts
 * @description Service for generating and downloading Microsoft Word (.docx) documents 
 * from the generated didactic sequences. Uses the 'docx' and 'file-saver' libraries.
 * Updated to Platinum v5.1 Institutional Format with Logo integration.
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ImageRun, VerticalAlign } from "docx";
import { saveAs } from "file-saver";
import { DidacticSequence, SequenceInput } from "../types";

/**
 * Generates a formal .docx document based on the AI response.
 * Follows the institutional format of Francisco de Paula Santander.
 */
export const generateDocx = async (data: DidacticSequence, input: SequenceInput) => {
  // Fetch logo as array buffer
  let logoData: ArrayBuffer | null = null;
  try {
    const response = await fetch('/logo_santander.png');
    logoData = await response.arrayBuffer();
  } catch (error) {
    console.error("Error loading logo for docx:", error);
  }

  const createCell = (content: string | (Paragraph | Table)[], options: any = {}) => {
    return new TableCell({
      width: { size: options.width || 100, type: WidthType.PERCENTAGE },
      shading: options.shading ? { fill: options.shading } : undefined,
      columnSpan: options.columnSpan,
      verticalAlign: options.verticalAlign || VerticalAlign.CENTER,
      children: typeof content === 'string'
        ? [new Paragraph({ children: [new TextRun({ text: content, bold: options.bold, size: options.size || 20, color: options.color })], alignment: options.align })]
        : content,
    });
  };

  const createSectionHeader = (text: string, fill: string = "E2E8F0") => {
    return new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          shading: { fill },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: true, size: 22, color: "0F172A" })],
            }),
          ],
        }),
      ],
    });
  };

  // --- Sesiones Detalle rows ---
  const sesionesRows: TableRow[] = [];
  if (data.sesiones_detalle && data.sesiones_detalle.length > 0) {
    data.sesiones_detalle.forEach((sesion) => {
      sesionesRows.push(
        new TableRow({
          children: [
            createCell(`Sesión ${sesion.numero}\n(${sesion.tiempo})`, { width: 20, bold: true, shading: "F1F5F9" }),
            createCell([
              new Paragraph({ children: [new TextRun({ text: sesion.titulo, bold: true, size: 22, color: "1E40AF" })] }),
              new Paragraph({ text: "" }),
              new Paragraph({ children: [new TextRun({ text: sesion.descripcion, size: 20 })] }),
              new Paragraph({ text: "" }),
              new Paragraph({ children: [new TextRun({ text: "MOMENTO ADI: ", bold: true, size: 18, color: "9A3412" }), new TextRun({ text: sesion.momento_adi, italics: true, size: 18, color: "9A3412" })] })
            ], { width: 80, columnSpan: 3 })
          ]
        })
      );
    });
  }

  // --- Rubrica rows ---
  const rubricaRows: TableRow[] = [];
  if (data.rubrica) {
    rubricaRows.push(
      new TableRow({
        children: [
          createCell("Criterio", { width: 20, bold: true, shading: "0F172A", size: 18, color: "FFFFFF" }),
          createCell("Bajo (1.0-2.9)", { width: 20, bold: true, shading: "7F1D1D", size: 18, color: "FFFFFF" }),
          createCell("Básico (3.0-3.9)", { width: 20, bold: true, shading: "C2410C", size: 18, color: "FFFFFF" }),
          createCell("Alto (4.0-4.5)", { width: 20, bold: true, shading: "1E3A8A", size: 18, color: "FFFFFF" }),
          createCell("Superior (4.6-5.0)", { width: 20, bold: true, shading: "064E3B", size: 18, color: "FFFFFF" }),
        ]
      })
    );
    data.rubrica.forEach(r => {
      rubricaRows.push(new TableRow({
        children: [
          createCell(r.criterio, { bold: true, shading: "F8FAFC" }),
          createCell(r.bajo, { size: 16 }),
          createCell(r.basico, { size: 16 }),
          createCell(r.alto, { size: 16 }),
          createCell(r.superior, { size: 16 }),
        ]
      }));
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          }
        },
        children: [
          // Header Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: logoData ? [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new ImageRun({
                            data: logoData,
                            transformation: { width: 60, height: 60 },
                            //@ts-ignore - fixing type mismatch
                            type: "png"
                          }),
                        ],
                      }),
                    ] : [new Paragraph("LOGO")],
                  }),
                  createCell([
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "INSTITUCIÓN EDUCATIVA TECNICA FRANCISCO DE PAULA SANTANDER DE GALAPA", bold: true, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "GESTIÓN ACADÉMICA - PREPARACIÓN DE CLASES", bold: true, size: 16, color: "4B5563" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\"Calidad Humana y Excelencia Académica\"", italics: true, size: 14, color: "6B7280" })] }),
                  ], { width: 70 }),
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "VERSIÓN: 5.1", size: 14 })] }),
                    new Paragraph({ children: [new TextRun({ text: "CÓDIGO: GA-F03", size: 14 })] }),
                    new Paragraph({ children: [new TextRun({ text: "PÁGINA: 1 de 1", size: 14 })] }),
                  ], { width: 15 }),
                ]
              }),

              new TableRow({
                children: [
                  createCell("TÍTULO DE LA SECUENCIA:", { bold: true, shading: "F8FAFC" }),
                  createCell(data.titulo_secuencia, { columnSpan: 2, bold: true, size: 24 }),
                  createCell([
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SECUENCIA N°:", size: 14, color: "6B7280" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.num_secuencia || 1), bold: true, size: 28 })] }),
                  ], { width: 15 }),
                ]
              }),

              new TableRow({
                children: [
                  createCell("ÁREA:", { bold: true, shading: "F8FAFC" }),
                  createCell(data.area),
                  createCell("ASIGNATURA:", { bold: true, shading: "F8FAFC" }),
                  createCell(data.asignatura)
                ]
              }),
              new TableRow({
                children: [
                  createCell("GRADO:", { bold: true, shading: "F8FAFC" }),
                  createCell(data.grado),
                  createCell("FECHA:", { bold: true, shading: "F8FAFC" }),
                  createCell(data.fecha)
                ]
              }),
              new TableRow({
                children: [
                  createCell("DOCENTE:", { bold: true, shading: "F8FAFC" }),
                  createCell(data.nombre_docente, { columnSpan: 3 })
                ]
              }),

              createSectionHeader("DESCRIPCIÓN DE LA SECUENCIA DIDÁCTICA"),
              new TableRow({ children: [createCell(data.descripcion_secuencia, { columnSpan: 4, italics: true })] }),

              createSectionHeader("OBJETIVO DE APRENDIZAJE", "ECFDFE"),
              new TableRow({ children: [createCell(data.objetivos_aprendizaje, { columnSpan: 4, bold: true })] }),

              new TableRow({
                children: [
                  createCell("CONTENIDOS A DESARROLLAR", { bold: true, shading: "F8FAFC", columnSpan: 2 }),
                  createCell("COMPETENCIAS DEL MEN", { bold: true, shading: "F8FAFC", columnSpan: 2 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell(data.contenidos_desarrollar.join("\n• "), { columnSpan: 2 }),
                  createCell(data.competencias_men, { columnSpan: 2 }),
                ]
              }),

              new TableRow({
                children: [
                  createCell("ESTÁNDAR DE COMPETENCIA", { bold: true, shading: "F8FAFC", columnSpan: 2 }),
                  createCell("DERECHOS BÁSICOS DE APRENDIZAJE (DBA)", { bold: true, shading: "F8FAFC", columnSpan: 2 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell(data.estandar_competencia, { columnSpan: 2 }),
                  createCell(
                    data.dba_detalle
                      ? [
                        new Paragraph({ children: [new TextRun({ text: data.dba_detalle.numero, bold: true, size: 20, color: "1E40AF" })] }),
                        new Paragraph({ children: [new TextRun({ text: data.dba_detalle.enunciado, bold: true, size: 18 })] }),
                        new Paragraph({ children: [new TextRun({ text: "EVIDENCIAS DE APRENDIZAJE:", bold: true, size: 14, color: "64748B" })], spacing: { before: 120 } }),
                        ...data.dba_detalle.evidencias.map(ev => new Paragraph({ children: [new TextRun({ text: "• " + ev, size: 16 })] }))
                      ]
                      : data.dba_utilizado,
                    { columnSpan: 2, bold: true }
                  ),
                ]
              }),

              new TableRow({
                children: [
                  createCell("EJE TRANSVERSAL (CRESE)", { bold: true, shading: "EEF2FF", columnSpan: 2 }),
                  createCell("CORPORIEDAD / ADI", { bold: true, shading: "FFF7ED", columnSpan: 2 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell(data.eje_transversal_crese, { columnSpan: 2, italics: true }),
                  createCell(data.corporiedad_adi, { columnSpan: 2, italics: true }),
                ]
              }),

              createSectionHeader("METODOLOGÍA", "F5F3FF"),
              new TableRow({ children: [createCell(data.metodologia, { columnSpan: 4 })] }),

              createSectionHeader("ANEXO 1: DESGLOSE POR SESIONES", "DBEAFE"),
              ...sesionesRows,

              createSectionHeader("ANEXO 2: RÚBRICA DE DESEMPEÑO", "F1F5F9"),
              ...rubricaRows,

              createSectionHeader("ADECUACIONES CURRICULARES (PIAR)", "ECFDF5"),
              new TableRow({ children: [createCell(data.adecuaciones_piar || "No se requieren adecuaciones específicas.", { columnSpan: 4 })] }),

              createSectionHeader("ANEXO 5: ALERTAS Y RECURSOS DIGITALES", "EEF2FF"),
              new TableRow({
                children: [
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "ALERTAS PEDAGÓGICAS:", bold: true, size: 18, color: "B91C1C" })] }),
                    ...(data.alertas_generadas || []).map(a => new Paragraph({ children: [new TextRun({ text: "• " + a, size: 16 })] })),
                  ], { columnSpan: 2, width: 50 }),
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "RECURSOS DE PROFUNDIZACIÓN:", bold: true, size: 18, color: "1E40AF" })] }),
                    ...(data.recursos_links || []).map(rl => new Paragraph({ children: [new TextRun({ text: `• ${rl.nombre}: ${rl.url}`, size: 16 })] })),
                  ], { columnSpan: 2, width: 50 })
                ]
              }),

              createSectionHeader("TRAZABILIDAD Y CONTROL DE VERSIONES", "F8FAFC"),
              ...(data.control_versiones || [{ version: "1.1", fecha: data.fecha, descripcion: "Generación Platinum v5.1" }]).map(v => new TableRow({
                children: [
                  createCell("V: " + v.version, { width: 15 }),
                  createCell(v.fecha, { width: 15 }),
                  createCell(v.descripcion, { columnSpan: 2, width: 70, italics: true })
                ]
              }))
            ]
          }),

          new Paragraph({ text: "" }),

          // Signatures
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell("ELABORÓ: " + data.elaboro, { bold: true }),
                  createCell("REVISÓ: " + data.reviso, { bold: true }),
                  createCell("FECHA: " + data.pie_fecha, { bold: true })
                ]
              })
            ]
          }),

          // TALLER SECTION
          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({ text: "ANEXO 3: TALLER DE APLICACIÓN", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "Guía de Aprendizaje Institucional - Francisco de Paula Santander", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "Estudiante: _________________________________________________  Grado: " + data.grado, bold: true })] }),
          new Paragraph({ text: "" }),

          ...(data.taller_imprimible ? [
            new Paragraph({ children: [new TextRun({ text: "CONTEXTO:", bold: true, underline: {} })] }),
            new Paragraph({ children: [new TextRun({ text: data.taller_imprimible.introduccion, italics: true })] }),
            new Paragraph({ text: "" }),
            new Paragraph({ children: [new TextRun({ text: "ACTIVIDADES:", bold: true, underline: {} })] }),
            ...data.taller_imprimible.ejercicios.map((ej, i) => new Paragraph({ text: `${i + 1}. ${ej}`, spacing: { before: 200, after: 400 } })),
            new Paragraph({ text: "" }),
            new Paragraph({ shading: { fill: "F0FDF4" }, children: [new TextRun({ text: "RETO CREATIVO: ", bold: true }), new TextRun({ text: data.taller_imprimible.reto_creativo, italics: true })] })
          ] : []),

          // EVALUATION SECTION
          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({ text: "ANEXO 4: EVALUACIÓN POR COMPETENCIAS", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "10 Preguntas Tipo ICFES", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "" }),

          ...data.evaluacion.map((ev, i) => [
            new Paragraph({ children: [new TextRun({ text: `Competencia: ${ev.competencia}`, bold: true, color: "1E40AF" })], spacing: { before: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${ev.pregunta}`, bold: true })] }),
            ...(ev.opciones || []).map((opt, j) => new Paragraph({ text: `${String.fromCharCode(65 + j)}) ${opt}`, indent: { left: 400 } })),
            new Paragraph({ children: [new TextRun({ text: `RESPUESTA CORRECTA: ${ev.respuesta_correcta}`, bold: true, color: "059669" })], spacing: { before: 100 } }),
            new Paragraph({ children: [new TextRun({ text: `EXPLICACIÓN: ${ev.explicacion}`, italics: true, color: "4B5563" })] }),
            new Paragraph({ text: "" })
          ]).flat(),

          // AUTOEVALUATION
          new Paragraph({ text: "AUTOEVALUACIÓN DEL ESTUDIANTE", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
          ...(data.autoevaluacion || []).map((q, i) => new Paragraph({ text: `${i + 1}. ${q}`, spacing: { before: 100 } }))
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Planeacion_Santander_${data.titulo_secuencia.replace(/\s+/g, '_')}.docx`;
  saveAs(blob, fileName);
};
