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
                            transformation: { width: 50, height: 50 },
                            //@ts-ignore
                            type: "png"
                          }),
                        ],
                      }),
                    ] : [new Paragraph("LOGO")],
                  }),
                  createCell([
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "INSTITUCIÓN EDUCATIVA TECNICA FRANCISCO DE PAULA SANTANDER DE GALAPA", bold: true, size: 20 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PLANEACIÓN DE CLASE", bold: true, italics: true, size: 18 })] }),
                  ], { width: 85 }),
                ]
              }),

              // Row 1: Nombre/Area/Asig
              new TableRow({
                children: [
                  createCell([new Paragraph({ children: [new TextRun({ text: "NOMBRE DEL DOCENTE: ", bold: true }), new TextRun({ text: data.nombre_docente, italics: true })] })], { width: 40 }),
                  createCell([new Paragraph({ children: [new TextRun({ text: "ÁREA: ", bold: true }), new TextRun({ text: data.area, italics: true })] })], { width: 30 }),
                  createCell([new Paragraph({ children: [new TextRun({ text: "ASIGNATURA: ", bold: true }), new TextRun({ text: data.asignatura, italics: true })] })], { width: 30 }),
                ]
              }),

              // Row 2: Grado/Grupos/Fecha
              new TableRow({
                children: [
                  createCell([new Paragraph({ children: [new TextRun({ text: "GRADO: ", bold: true }), new TextRun({ text: data.grado, italics: true })] })], { width: 40 }),
                  createCell([new Paragraph({ children: [new TextRun({ text: "GRUPOS: ", bold: true }), new TextRun({ text: data.grupos || data.grado, italics: true })] })], { width: 30 }),
                  createCell([new Paragraph({ children: [new TextRun({ text: "FECHA: ", bold: true }), new TextRun({ text: data.fecha, italics: true })] })], { width: 30 }),
                ]
              }),

              // Row 3: 1.PROPOSITO
              new TableRow({
                children: [
                  createCell("1.PROPÓSITO", { width: 20, bold: true }),
                  createCell([new Paragraph({ children: [new TextRun({ text: data.proposito, italics: true, bold: true })] })], { width: 80, columnSpan: 2 }),
                ]
              }),

              // Row 4: 2.INDICADORES
              new TableRow({
                children: [
                  createCell("2.INDICADORES.", { width: 20, bold: true }),
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "COGNITIVO: ", bold: true }), new TextRun({ text: data.indicadores.cognitivo, italics: true, bold: true })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "AFECTIVO: ", bold: true }), new TextRun({ text: data.indicadores.afectivo, italics: true, bold: true })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "EXPRESIVO: ", bold: true }), new TextRun({ text: data.indicadores.expresivo, italics: true, bold: true })] }),
                  ], { width: 80, columnSpan: 2 }),
                ]
              }),

              // Row 5: 3.ENSEÑANZAS
              new TableRow({
                children: [
                  createCell("3.ENSEÑANZAS.", { width: 20, bold: true }),
                  createCell([new Paragraph({ children: [new TextRun({ text: data.ensenanzas.map(e => "• " + e).join("\n"), italics: true, bold: true })] })], { width: 80, columnSpan: 2 }),
                ]
              }),

              // Row 6: 4.SECUENCIA DIDACTICA
              new TableRow({
                children: [
                  createCell("4.SECUENCIA DIDÁCTICA", { width: 20, bold: true }),
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "MOTIVACIÓN Y ENCUADRE: ", bold: true }), new TextRun({ text: data.secuencia_didactica.motivacion_encuadre, italics: true, bold: true })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "ENUNCIACIÓN: ", bold: true }), new TextRun({ text: data.secuencia_didactica.enunciacion, italics: true, bold: true })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "MODELACIÓN: ", bold: true }), new TextRun({ text: data.secuencia_didactica.modelacion, italics: true, bold: true })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "SIMULACIÓN: ", bold: true }), new TextRun({ text: data.secuencia_didactica.simulacion, italics: true, bold: true })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "EJERCITACIÓN: ", bold: true }), new TextRun({ text: data.secuencia_didactica.ejercitacion, italics: true, bold: true })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "DEMOSTRACIÓN / TRANSFERENCIA: ", bold: true }), new TextRun({ text: data.secuencia_didactica.transferencia, italics: true, bold: true })] }),
                  ], { width: 80, columnSpan: 2 }),
                ]
              }),

              // Row 7: 5.DIDACTICA
              new TableRow({
                children: [
                  createCell("5.DIDÁCTICA", { width: 20, bold: true }),
                  createCell([new Paragraph({ children: [new TextRun({ text: data.didactica, italics: true, bold: true })] })], { width: 80, columnSpan: 2 }),
                ]
              }),

              // Row 8: 6.RECURSOS
              new TableRow({
                children: [
                  createCell("6.RECURSOS.", { width: 20, bold: true }),
                  createCell([new Paragraph({ children: [new TextRun({ text: data.recursos, italics: true, bold: true })] })], { width: 80, columnSpan: 2 }),
                ]
              }),

              // Row 9: 7.PIAR
              new TableRow({
                children: [
                  createCell("7.ADECUACIONES (PIAR)", { width: 20, bold: true }),
                  createCell([new Paragraph({ children: [new TextRun({ text: data.adecuaciones_piar || "No aplica", italics: true, bold: true })] })], { width: 80, columnSpan: 2 }),
                ]
              }),

              // Row 10: 8.OBSERVACIONES
              new TableRow({
                children: [
                  createCell("8.OBSERVACIONES Y BIBLIOGRAFÍA", { width: 20, bold: true }),
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "OBS: " + (data.observaciones || ""), italics: true, bold: true })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "BIBLIO: " + (data.bibliografia || ""), italics: true, bold: true })] }),
                  ], { width: 80, columnSpan: 2 }),
                ]
              }),

              // Footer: Elaboró/Revisó/Fecha
              new TableRow({
                children: [
                  createCell([new Paragraph({ text: "ELABORÓ:" }), new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun({ text: data.elaboro, italics: true, bold: true })] })], { width: 33 }),
                  createCell([new Paragraph({ text: "REVISÓ/APROBÓ:" }), new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun({ text: data.reviso, italics: true, bold: true })] })], { width: 33 }),
                  createCell([new Paragraph({ text: "FECHA:" }), new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun({ text: data.pie_fecha, italics: true, bold: true })] })], { width: 33 }),
                ]
              }),
            ]
          }),

          // Annexes
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [createSectionHeader("FUNDAMENTACIÓN NORMATIVA (DBA & ESTÁNDARES)", "F8FAFC")]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "DBA: ", bold: true }), new TextRun({ text: data.dba_detalle?.numero || "" })] }),
                    new Paragraph({ text: data.dba_detalle?.enunciado || "" })
                  ], { width: 50 }),
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "ESTÁNDAR: ", bold: true })] }),
                    new Paragraph({ text: data.estandar_competencia })
                  ], { width: 50 }),
                ]
              })
            ]
          }),

          // SESIONES
          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({ text: "ANEXO 1: DESGLOSE POR SESIONES", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: sesionesRows
          }),

          // RUBRICA
          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({ text: "ANEXO 2: RÚBRICA DE EVALUACIÓN SIEE", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rubricaRows
          }),

          // TALLER
          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({ text: "ANEXO 3: TALLER DE APRENDIZAJE", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "Estudiante: _________________________________________________  Grado: " + data.grado, bold: true })] }),
          ...(data.taller_imprimible ? [
            new Paragraph({ text: "" }),
            new Paragraph({ children: [new TextRun({ text: "CONTEXTO:", bold: true, underline: {} })] }),
            new Paragraph({ children: [new TextRun({ text: data.taller_imprimible.introduccion, italics: true })] }),
            new Paragraph({ text: "" }),
            new Paragraph({ children: [new TextRun({ text: "ACTIVIDADES:", bold: true, underline: {} })] }),
            ...data.taller_imprimible.ejercicios.map((ej, i) => new Paragraph({ text: `${i + 1}. ${ej}`, spacing: { before: 200 } })),
            new Paragraph({ text: "" }),
            new Paragraph({ shading: { fill: "F0FDF4" }, children: [new TextRun({ text: "RETO CREATIVO: ", bold: true }), new TextRun({ text: data.taller_imprimible.reto_creativo, italics: true })] })
          ] : []),

          // ALERTAS Y RECURSOS
          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({ text: "ANEXO 4: ALERTAS PEDAGÓGICAS Y RECURSOS", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "ALERTAS PEDAGÓGICAS:", bold: true, color: "B91C1C" })] }),
                    ...(data.alertas_generadas || []).map(a => new Paragraph({ children: [new TextRun({ text: "• " + a })] })),
                  ], { width: 50 }),
                  createCell([
                    new Paragraph({ children: [new TextRun({ text: "RECURSOS DIGITALES:", bold: true, color: "1E40AF" })] }),
                    ...(data.recursos_links || []).map(rl => new Paragraph({ children: [new TextRun({ text: `• ${rl.nombre}: ${rl.url}` })] })),
                  ], { width: 50 })
                ]
              })
            ]
          }),

          // EVALUATION
          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({ text: "ANEXO 5: EVALUACIÓN POR COMPETENCIAS (10 PREGUNTAS TIPO ICFES)", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          ...data.evaluacion.map((ev, i) => [
            new Paragraph({ children: [new TextRun({ text: `Competencia: ${ev.competencia}`, bold: true, color: "1E40AF" })], spacing: { before: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${ev.pregunta}`, bold: true })] }),
            ...(ev.opciones || []).map((opt, j) => new Paragraph({ text: `${String.fromCharCode(65 + j)}) ${opt}`, indent: { left: 400 } })),
            new Paragraph({ children: [new TextRun({ text: `RESPUESTA CORRECTA: ${ev.respuesta_correcta}`, bold: true, color: "059669" })], spacing: { before: 100 } }),
            new Paragraph({ children: [new TextRun({ text: `EXPLICACIÓN: ${ev.explicacion}`, italics: true, color: "4B5563" })] }),
            new Paragraph({ text: "" })
          ]).flat(),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Planeacion_Santander_${data.titulo_secuencia.replace(/\s+/g, '_')}.docx`;
  saveAs(blob, fileName);
};
