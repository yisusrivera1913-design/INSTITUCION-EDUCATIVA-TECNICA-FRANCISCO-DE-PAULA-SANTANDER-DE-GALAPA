import React, { useState } from 'react';
import { DidacticSequence, SequenceInput } from '../types';
import { Printer, CheckCircle, Sparkles, ExternalLink, Heart, GraduationCap, Lightbulb, ClipboardList, AlertTriangle, PenTool, BookOpen } from 'lucide-react';

interface SequencePreviewProps {
  data: DidacticSequence;
  input: SequenceInput;
  onRefine: (instruction: string) => void;
  onReset: () => void;
}

export const SequencePreview: React.FC<SequencePreviewProps> = ({ data, input, onRefine, onReset }) => {
  const [refinementText, setRefinementText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [editableData, setEditableData] = useState<DidacticSequence>(() => ({
    ...data
  }));

  React.useEffect(() => {
    setEditableData({ ...data });
  }, [data]);

  const handleRefineSubmit = () => {
    if (!refinementText.trim()) return;
    setIsRefining(true);
    onRefine(refinementText);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateField = (path: string, value: any) => {
    const newData = { ...editableData };
    const keys = path.split('.');
    let current: any = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // Handle array indices like "sesiones_detalle.0.titulo"
      if (!isNaN(Number(keys[i + 1]))) {
        if (!Array.isArray(current[key])) current[key] = [];
      } else {
        if (!current[key]) current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    setEditableData(newData);
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  const EditableSpan = ({ path, value, className = "" }: { path: string, value: string, className?: string }) => (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => handleUpdateField(path, e.currentTarget.innerText)}
      className={`hover:bg-yellow-50/50 hover:outline hover:outline-1 hover:outline-blue-200 rounded px-1 transition-all cursor-text min-w-[20px] inline-block ${className}`}
    >
      {value}
    </span>
  );

  const EditableDiv = ({ path, value, className = "" }: { path: string, value: string, className?: string }) => (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => handleUpdateField(path, e.currentTarget.innerText)}
      className={`hover:bg-yellow-50/50 hover:outline hover:outline-1 hover:outline-blue-200 rounded p-1 transition-all cursor-text min-h-[1em] ${className}`}
    >
      {value}
    </div>
  );

  return (
    <div className="animate-fade-in-up pb-10">

      {/* Action Bar - Simplified */}
      <div className="bg-white sticky top-20 z-40 p-5 rounded-2xl shadow-md border border-slate-200 mb-8 no-print flex justify-between items-center transition-all">
        <div className="flex items-center gap-4 pl-2">
          <div className="bg-slate-800 p-2.5 rounded-xl text-white">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Formato Institucional de Planeación v5.3</h2>
            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Francisco de Paula Santander DE GALAPA</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onReset} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-bold text-sm">
            Nueva
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-black transition-all font-bold text-sm shadow-sm">
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Refinement Studio - Professional Executive Design */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-10 no-print overflow-hidden transition-all hover:shadow-xl">
        <div className="bg-slate-800 px-5 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold text-[11px] flex items-center gap-2 uppercase tracking-[0.2em]">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Estudio de Refinamiento Curricular Directo
          </h3>
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Motor de Optimización IA</span>
        </div>
        <div className="p-6 flex gap-3 items-center bg-gray-50/50">
          <div className="flex-1 relative">
            <input
              type="text"
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
              placeholder="Ej: 'Aumenta el nivel técnico de las preguntas' o 'Ajusta el propósito pedagógico'..."
              className="w-full bg-white border border-slate-300 rounded-lg pl-4 pr-12 py-3 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all text-[13px] shadow-sm font-medium"
            />
            <PenTool className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <button
            onClick={handleRefineSubmit}
            disabled={!refinementText.trim() || isRefining}
            className="bg-slate-800 text-white px-8 py-3 rounded-lg font-black disabled:opacity-50 text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            {isRefining ? (
              <>
                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : "Actualizar Secuencia"}
          </button>
        </div>
        <div className="px-6 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-4">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter italic">Sugerencia:</span>
          <div className="flex gap-4">
            {['Profundizar Actividades', 'Mejorar Evaluación', 'Ajustar DBA'].map(tag => (
              <button
                key={tag}
                onClick={() => setRefinementText(tag)}
                className="text-[9px] text-slate-400 font-bold hover:text-slate-800 transition-colors uppercase cursor-pointer"
              >
                #{tag.replace(/\s+/g, '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DOCUMENTO INSTITUCIONAL - ÁREA DE IMPRESIÓN */}
      <div id="preview-container" className="bg-white mx-auto max-w-[21.5cm] min-h-[29.7cm] p-[1.5cm] text-black border border-slate-300 shadow-xl print:shadow-none print:border-none print:p-0 print:w-full font-serif relative">

        {/* Marca de Agua - Muy Sutil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.02] pointer-events-none z-0">
          <img src="/logo_santander.png" alt="" className="w-full h-full object-contain grayscale" />
        </div>

        <div className="relative z-10 w-full">
          {/* TABLA PRINCIPAL - FORMATO INSTITUCIONAL */}
          <div className="border-[1px] border-black w-full mb-8 text-black bg-white">
            {/* Cabecera */}
            <div className="flex border-b border-black h-[100px]">
              <div className="w-[120px] p-2 flex items-center justify-center border-r border-black">
                <img src="/logo_santander.png" alt="Escudo" className="w-[90px] h-auto object-contain" />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                <h1 className="text-[14px] font-black uppercase leading-tight">
                  INSTITUCION EDUCATIVA TECNICA FRANCISCO DE PAULA SANTANDER DE GALAPA.
                </h1>
                <h2 className="text-[13px] font-black uppercase tracking-widest italic mt-2">PLANEACIÓN DE CLASE.</h2>
              </div>
            </div>

            {/* Datos Generales */}
            <div className="grid grid-cols-12 border-b border-black text-[10px] font-black">
              <div className="col-span-6 border-r border-black p-2 flex gap-1 uppercase">
                <span className="shrink-0">NOMBRE DEL DOCENTE:</span>
                <EditableSpan path="nombre_docente" value={editableData.nombre_docente} className="flex-1 italic font-medium" />
              </div>
              <div className="col-span-3 border-r border-black p-2 flex gap-1 uppercase">
                <span className="shrink-0">ÁREA:</span>
                <EditableSpan path="area" value={editableData.area} className="flex-1 italic font-medium" />
              </div>
              <div className="col-span-3 p-2 flex gap-1 uppercase">
                <span className="shrink-0">ASIGNATURA:</span>
                <EditableSpan path="asignatura" value={editableData.asignatura} className="flex-1 italic font-medium" />
              </div>
            </div>

            <div className="grid grid-cols-12 border-b border-black text-[10px] font-black">
              <div className="col-span-4 border-r border-black p-2 flex gap-1 uppercase">
                <span className="shrink-0">GRADO:</span>
                <EditableSpan path="grado" value={editableData.grado} className="flex-1 italic font-medium" />
              </div>
              <div className="col-span-4 border-r border-black p-2 flex gap-1 uppercase">
                <span className="shrink-0">GRUPOS:</span>
                <EditableSpan path="grupos" value={editableData.grupos} className="flex-1 italic font-medium" />
              </div>
              <div className="col-span-4 p-2 flex gap-1 uppercase">
                <span className="shrink-0">FECHA:</span>
                <EditableSpan path="fecha" value={editableData.fecha} className="flex-1 italic font-medium" />
              </div>
            </div>

            {/* 1. PROPÓSITO */}
            <div className="grid grid-cols-12 border-b border-black text-[11px]">
              <div className="col-span-2 border-r border-black p-2 flex items-center font-black uppercase">1.PROPÓSITO</div>
              <div className="col-span-10 p-2 italic font-black text-justify">
                <EditableDiv path="proposito" value={editableData.proposito} />
              </div>
            </div>

            {/* 2. INDICADORES */}
            <div className="grid grid-cols-12 border-b border-black text-[11px] font-black">
              <div className="col-span-2 border-r border-black p-2 flex items-start uppercase">2.INDICADORES.</div>
              <div className="col-span-10 p-2 space-y-4">
                <div className="flex gap-2">
                  <span className="min-w-[85px] uppercase shrink-0">COGNITIVO:</span>
                  <EditableDiv path="indicadores.cognitivo" value={editableData.indicadores?.cognitivo} className="flex-1 italic text-justify font-black" />
                </div>
                <div className="flex gap-2">
                  <span className="min-w-[85px] uppercase shrink-0">AFECTIVO:</span>
                  <EditableDiv path="indicadores.afectivo" value={editableData.indicadores?.afectivo} className="flex-1 italic text-justify font-black" />
                </div>
                <div className="flex gap-2">
                  <span className="min-w-[85px] uppercase shrink-0">EXPRESIVO:</span>
                  <EditableDiv path="indicadores.expresivo" value={editableData.indicadores?.expresivo} className="flex-1 italic text-justify font-black" />
                </div>
              </div>
            </div>

            {/* 3. ENSEÑANZAS */}
            <div className="grid grid-cols-12 border-b border-black text-[11px] font-black">
              <div className="col-span-2 border-r border-black p-2 flex items-center uppercase">3.ENSEÑANZAS.</div>
              <div className="col-span-10 p-2">
                <ul className="space-y-1">
                  {editableData.ensenanzas?.map((ens, idx) => (
                    <li key={idx} className="italic flex gap-2">
                      <span>•</span>
                      <EditableSpan path={`ensenanzas.${idx}`} value={ens} />
                    </li>
                  ))}
                  {(!editableData.ensenanzas || editableData.ensenanzas.length === 0) && (
                    <li className="italic text-gray-400">Sin enseñanzas definidas</li>
                  )}
                </ul>
              </div>
            </div>

            {/* 4. SECUENCIA DIDÁCTICA */}
            <div className="grid grid-cols-12 border-b border-black text-[11px] font-black">
              <div className="col-span-2 border-r border-black p-2 flex items-start uppercase">4.SECUENCIA DIDÁCTICA</div>
              <div className="col-span-10 p-2 space-y-4">
                <div>
                  <span className="uppercase block mb-1">MOTIVACIÓN Y ENCUADRE:</span>
                  <EditableDiv path="secuencia_didactica.motivacion_encuadre" value={editableData.secuencia_didactica?.motivacion_encuadre} className="italic text-justify font-black" />
                </div>
                <div>
                  <span className="uppercase block mb-1">ENUNCIACIÓN:</span>
                  <EditableDiv path="secuencia_didactica.enunciacion" value={editableData.secuencia_didactica?.enunciacion} className="italic text-justify font-black" />
                </div>
                <div>
                  <span className="uppercase block mb-1">MODELACIÓN:</span>
                  <EditableDiv path="secuencia_didactica.modelacion" value={editableData.secuencia_didactica?.modelacion} className="italic text-justify font-black" />
                </div>
                <div>
                  <span className="uppercase block mb-1">SIMULACIÓN:</span>
                  <EditableDiv path="secuencia_didactica.simulacion" value={editableData.secuencia_didactica?.simulacion} className="italic text-justify font-black" />
                </div>
                <div>
                  <span className="uppercase block mb-1">EJERCITACIÓN:</span>
                  <EditableDiv path="secuencia_didactica.ejercitacion" value={editableData.secuencia_didactica?.ejercitacion} className="italic text-justify font-black" />
                </div>
                <div>
                  <span className="uppercase block mb-1">DEMOSTRACIÓN / TRANSFERENCIA:</span>
                  <EditableDiv path="secuencia_didactica.transferencia" value={editableData.secuencia_didactica?.transferencia} className="italic text-justify font-black" />
                </div>
              </div>
            </div>

            {/* 5. DIDÁCTICA */}
            <div className="grid grid-cols-12 border-b border-black text-[11px] font-black">
              <div className="col-span-2 border-r border-black p-2 flex items-center uppercase">5.DIDÁCTICA</div>
              <div className="col-span-10 p-2 italic text-justify font-black">
                <EditableDiv path="didactica" value={editableData.didactica} />
              </div>
            </div>

            {/* 6. RECURSOS */}
            <div className="grid grid-cols-12 border-b border-black text-[11px] font-black">
              <div className="col-span-2 border-r border-black p-2 flex items-center uppercase">6.RECURSOS.</div>
              <div className="col-span-10 p-2 italic text-justify font-black">
                <EditableDiv path="recursos" value={editableData.recursos} />
              </div>
            </div>

            {/* 7. ADECUACIONES (PIAR) */}
            <div className="grid grid-cols-12 border-b border-black text-[11px] font-black">
              <div className="col-span-2 border-r border-black p-2 flex items-center uppercase text-[9px]">7.ADECUACIONES (PIAR)</div>
              <div className="col-span-10 p-2 italic text-justify font-black min-h-[40px]">
                <EditableDiv path="adecuaciones_piar" value={editableData.adecuaciones_piar || "No aplica"} />
              </div>
            </div>

            {/* 8. OBSERVACIONES Y BIBLIOGRAFÍA */}
            <div className="grid grid-cols-12 border-b border-black text-[11px] font-black">
              <div className="col-span-2 border-r border-black p-2 flex items-center uppercase text-[9px]">8.OBSERVACIONES Y BIBLIOGRAFÍA</div>
              <div className="col-span-5 border-r border-black p-2 italic text-justify font-black min-h-[40px]">
                <EditableDiv path="observaciones" value={editableData.observaciones} />
              </div>
              <div className="col-span-5 p-2 italic text-justify font-black min-h-[40px]">
                <EditableDiv path="bibliografia" value={editableData.bibliografia} />
              </div>
            </div>

            {/* FOOTER FIRMAS */}
            <div className="grid grid-cols-12 text-[10px] font-black min-h-[70px]">
              <div className="col-span-4 border-r border-black p-2 flex flex-col justify-between">
                <span className="uppercase">ELABORÓ:</span>
                <EditableSpan path="elaboro" value={editableData.elaboro} className="italic text-center border-t border-black/10 pt-2" />
              </div>
              <div className="col-span-4 border-r border-black p-2 flex flex-col justify-between">
                <span className="uppercase">REVISÓ/APROBÓ:</span>
                <EditableSpan path="reviso" value={editableData.reviso} className="italic text-center border-t border-black/10 pt-2" />
              </div>
              <div className="col-span-4 p-2 flex flex-col justify-between">
                <span className="uppercase">FECHA:</span>
                <EditableSpan path="pie_fecha" value={editableData.pie_fecha} className="italic text-center border-t border-black/10 pt-2" />
              </div>
            </div>
          </div>
        </div>

        {/* ANEXOS DEL SISTEMA (Standards, DBA, Sessions, etc.) */}
        <div className="mt-8 space-y-12">
          {/* DBA REFORZADO */}
          <div className="border border-black p-4 bg-gray-50/30">
            <h4 className="text-[12px] font-black uppercase border-b border-black mb-2 flex items-center gap-2">
              <BookOpen size={16} /> Fundamentación Normativa (DBA & Estándares)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-[10px]">
              <div>
                <span className="font-black uppercase block underline mb-1">Derechos Básicos (DBA):</span>
                <div className="bg-white p-2 border border-black italic">
                  <p className="font-black">{editableData.dba_detalle?.numero}</p>
                  <p>{editableData.dba_detalle?.enunciado}</p>
                </div>
              </div>
              <div>
                <span className="font-black uppercase block underline mb-1">Estándar de Competencia:</span>
                <div className="bg-white p-2 border border-black italic">
                  <p>{editableData.estandar_competencia}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ANEXO 1: SESIONES */}
          <div className="break-before-page border-t-2 border-black pt-8">
            <div className="flex items-center gap-3 mb-6 font-black uppercase tracking-tight">
              <ClipboardList size={20} className="text-black" />
              <h3 className="text-lg">Anexo 1: Desglose Pedagógico de Sesiones</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.isArray(editableData.sesiones_detalle) && editableData.sesiones_detalle.map((s, i) => (
                <div key={i} className="border border-black p-4 bg-white">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase">SESIÓN {s.numero}</span>
                    <EditableSpan path={`sesiones_detalle.${i}.tiempo`} value={s.tiempo} className="text-[9px] italic text-gray-400" />
                  </div>
                  <h4 className="text-[12px] font-black mb-1 uppercase tracking-tight">
                    <EditableSpan path={`sesiones_detalle.${i}.titulo`} value={s.titulo} />
                  </h4>
                  <EditableDiv path={`sesiones_detalle.${i}.descripcion`} value={s.descripcion} className="text-[10px] text-gray-700 leading-normal mb-3 text-justify" />
                  <div className="bg-gray-50 p-2 border border-gray-200 italic text-[9px] text-gray-500">
                    <span className="font-black text-gray-700 uppercase block mb-0.5">ACCIÓN DE ACTIVACIÓN (ADI):</span>
                    <EditableDiv path={`sesiones_detalle.${i}.momento_adi`} value={s.momento_adi} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ANEXO 2: RÚBRICA - Simplified */}
          <div className="break-before-page border-t-2 border-black pt-8 mt-12">
            <div className="flex items-center gap-3 mb-6 font-black uppercase tracking-tight">
              <GraduationCap size={20} className="text-slate-800" />
              <h3 className="text-lg">Anexo 2: Rúbrica de Evaluación SIEE</h3>
            </div>
            <div className="border border-black overflow-hidden bg-white">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-black uppercase font-black">
                    <th className="p-3 text-left border-r border-black w-[15%]">CRITERIO</th>
                    <th className="p-3 text-center border-r border-black w-[21%]">BAJO</th>
                    <th className="p-3 text-center border-r border-black w-[21%]">BÁSICO</th>
                    <th className="p-3 text-center border-r border-black w-[21%] text-slate-900 bg-slate-50">ALTO</th>
                    <th className="p-3 text-center w-[21%] text-slate-900 bg-gray-50">SUPERIOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {Array.isArray(editableData.rubrica) && editableData.rubrica.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-black uppercase bg-gray-50 border-r border-black text-[9px]">
                        <EditableSpan path={`rubrica.${i}.criterio`} value={r.criterio} />
                      </td>
                      <td className="p-3 italic font-medium text-slate-600 border-r border-black leading-tight text-justify">
                        <EditableDiv path={`rubrica.${i}.bajo`} value={r.bajo} />
                      </td>
                      <td className="p-3 italic font-medium text-slate-600 border-r border-black leading-tight text-justify">
                        <EditableDiv path={`rubrica.${i}.basico`} value={r.basico} />
                      </td>
                      <td className="p-3 italic font-semibold text-slate-800 border-r border-black bg-slate-50/50 leading-tight text-justify">
                        <EditableDiv path={`rubrica.${i}.alto`} value={r.alto} />
                      </td>
                      <td className="p-3 italic font-black text-slate-900 leading-tight text-justify">
                        <EditableDiv path={`rubrica.${i}.superior`} value={r.superior} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ANEXO 3: TALLER - Simplified */}
          {editableData.taller_imprimible && (
            <div className="break-before-page border-t-2 border-black pt-8 mt-12">
              <div className="flex justify-between items-center mb-6">
                <div className="w-16 h-16 border border-black p-2 bg-white">
                  <img src="/logo_santander.png" alt="Logo" className="w-full h-full object-contain grayscale" />
                </div>
                <div className="text-center flex-1">
                  <h2 className="text-xl font-black uppercase tracking-tight">Anexo 3: Taller de Aplicación</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Instrumento de Aprendizaje Institucional</p>
                </div>
                <div className="text-right border-l border-black pl-4">
                  <p className="text-[12px] font-black uppercase">F-PA-03</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Santander AI</p>
                </div>
              </div>

              <div className="border border-black p-8 space-y-6">
                <div className="grid grid-cols-2 gap-8 text-[11px] border-b border-black pb-6">
                  <div className="space-y-4">
                    <div className="border-b border-black pb-1 italic font-bold">Estudiante: ____________________________</div>
                    <div className="grid grid-cols-3 gap-4 font-black uppercase text-[9px]">
                      <div className="border-b border-black pb-1">Grado: {editableData.grado}</div>
                      <div className="border-b border-black pb-1">Grupo: ____</div>
                      <div className="border-b border-black pb-1">Fecha: ____</div>
                    </div>
                  </div>
                  <EditableDiv path="taller_imprimible.introduccion" value={editableData.taller_imprimible.introduccion} className="bg-gray-50 p-4 border border-slate-200 italic text-[11px] text-slate-700 leading-relaxed font-medium" />
                </div>

                <div className="space-y-8 py-4">
                  {Array.isArray(editableData.taller_imprimible.ejercicios) && editableData.taller_imprimible.ejercicios.map((ej, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="w-10 h-10 border border-black flex items-center justify-center font-black text-lg bg-white shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 space-y-4 pt-1">
                        <EditableDiv path={`taller_imprimible.ejercicios.${i}`} value={ej} className="font-bold text-[13px] leading-snug text-slate-900 w-full" />
                        <div className="space-y-4 pr-10 opacity-30">
                          <div className="border-b border-slate-400 h-1 w-full"></div>
                          <div className="border-b border-slate-400 h-1 w-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-slate-900 p-8 text-white relative border-4 border-slate-200">
                  <div className="relative z-10">
                    <div className="inline-block border border-white/50 px-3 py-1 text-[9px] font-black uppercase tracking-widest mb-4">RETO CREATIVO INSTITUCIONAL</div>
                    <EditableDiv path="taller_imprimible.reto_creativo" value={editableData.taller_imprimible.reto_creativo} className="text-[14px] font-medium leading-relaxed italic opacity-95 pr-10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANEXO 5: ALERTAS Y MATERIAL - Simplified */}
          <div className="break-before-page border-t-2 border-black pt-8">
            <div className="flex items-center gap-3 mb-6 font-black uppercase tracking-tight">
              <AlertTriangle size={20} className="text-slate-800" />
              <h3 className="text-lg">Anexo 4: Alertas Pedagógicas y Material de Apoyo Maestro</h3>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6 border border-black p-6 bg-slate-50">
                <h4 className="text-[11px] font-black uppercase text-slate-900 border-b border-black pb-2 flex items-center gap-2">
                  <AlertTriangle size={16} /> ALERTAS PEDAGÓGICAS
                </h4>
                <ul className="space-y-4">
                  {Array.isArray(editableData.alertas_generadas) && (
                    editableData.alertas_generadas.map((a, i) => (
                      <li key={i} className="text-[11px] italic font-medium text-slate-700 flex gap-3 leading-relaxed">
                        <span className="font-black">•</span>
                        <EditableSpan path={`alertas_generadas.${i}`} value={a} className="flex-1" />
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="space-y-6 border border-black p-6 bg-white">
                <h4 className="text-[11px] font-black uppercase text-slate-900 border-b border-black pb-2 flex items-center gap-2">
                  <ExternalLink size={16} /> RECURSOS DIGITALES
                </h4>
                <div className="space-y-4">
                  {Array.isArray(editableData.recursos_links) && editableData.recursos_links.map((rl, i) => (
                    <div key={i} className="border-b border-gray-100 last:border-0 pb-4 italic">
                      <p className="text-[10px] font-black uppercase text-slate-900">
                        <EditableSpan path={`recursos_links.${i}.tipo`} value={rl.tipo} />: <EditableSpan path={`recursos_links.${i}.nombre`} value={rl.nombre} />
                      </p>
                      <EditableDiv path={`recursos_links.${i}.descripcion`} value={rl.descripcion} className="text-[10px] text-slate-500 leading-snug my-2" />
                      <div className="flex items-center gap-2">
                        <EditableSpan path={`recursos_links.${i}.url`} value={rl.url} className="text-[9px] text-blue-800 underline flex-1 truncate" />
                        <a href={rl.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-800 no-print underline">
                          Link
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ANEXO 5: EVALUACIÓN ICFES - Simplified */}
          {Array.isArray(editableData.evaluacion) && editableData.evaluacion.length > 0 && (
            <div className="break-before-page border-t-2 border-black pt-8 mt-12 mb-20">
              <div className="text-center mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight">Anexo 5: Banco de Evaluación por Competencias SIEE (Tipo ICFES)</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Validación Nacional por Competencias (10 PREGUNTAS)</p>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {editableData.evaluacion.map((ev, i) => (
                  <div key={i} className="border border-black p-8 relative bg-white">
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-slate-800 text-white px-3 py-1 font-bold text-[9px] uppercase tracking-widest border border-black">
                      ITEM No. {i + 1}
                    </div>
                    <div className="mb-4">
                      <span className="text-slate-500 text-[10px] font-bold uppercase">COMPETENCIA: <EditableSpan path={`evaluacion.${i}.competencia`} value={ev.competencia} /></span>
                    </div>
                    <div className="bg-gray-50 border-l border-black p-4 mb-6">
                      <EditableDiv path={`evaluacion.${i}.pregunta`} value={ev.pregunta} className="font-bold text-[14px] leading-relaxed text-slate-900" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                      {(ev.opciones || []).map((opt, j) => (
                        <div key={j} className="flex items-start gap-4">
                          <span className="w-8 h-8 border border-black flex items-center justify-center font-black text-sm shrink-0">
                            {optionLetters[j]}
                          </span>
                          <EditableSpan path={`evaluacion.${i}.opciones.${j}`} value={opt} className="italic font-medium text-[12px] pt-1 leading-snug flex-1" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-dashed border-slate-300 no-print">
                      <div className="flex gap-4 items-center mb-4">
                        <span className="uppercase text-[10px] font-black text-slate-400">CLAVE:</span>
                        <span className="text-xl font-black border-b-2 border-black inline-block px-2">
                          OPCIÓN <EditableSpan path={`evaluacion.${i}.respuesta_correcta`} value={ev.respuesta_correcta} />
                        </span>
                      </div>
                      {ev.explicacion && (
                        <div className="bg-gray-50 p-4 border border-slate-200 italic text-slate-600 text-[11px] font-medium leading-relaxed">
                          <span className="font-black text-slate-500 uppercase text-[9px] block mb-1 underline">Justificación Pedagógica:</span>
                          <EditableDiv path={`evaluacion.${i}.explicacion`} value={ev.explicacion} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
