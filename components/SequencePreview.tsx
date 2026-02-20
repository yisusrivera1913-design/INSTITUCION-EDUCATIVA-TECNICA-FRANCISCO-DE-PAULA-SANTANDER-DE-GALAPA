import React, { useState } from 'react';
import { DidacticSequence, SequenceInput } from '../types';
import { Printer, CheckCircle, Sparkles, ExternalLink, Heart, GraduationCap, Lightbulb, ClipboardList, AlertTriangle } from 'lucide-react';

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

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="animate-fade-in-up pb-10">

      {/* Action Bar */}
      <div className="bg-white/95 backdrop-blur-md sticky top-20 z-40 p-4 rounded-3xl shadow-2xl border border-white/50 mb-10 no-print flex justify-between items-center transition-all hover:shadow-blue-500/10 ring-1 ring-blue-50">
        <div className="flex items-center gap-4 pl-2">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/30">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Diseño Pedagógico Platinum v5.1</h2>
            <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Francisco de Paula Santander DE GALAPA</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onReset} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold">
            Nueva
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-bold shadow-xl">
            <Printer className="h-5 w-5" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Refinement Studio */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 mb-10 no-print shadow-sm backdrop-blur-sm">
        <h3 className="text-blue-900 font-black text-lg mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
          Refinar con Master Rector AI
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={refinementText}
            onChange={(e) => setRefinementText(e.target.value)}
            placeholder="Ej: 'Incluye más actividades lúdicas' o 'Mejora el lenguaje técnico'..."
            className="flex-1 bg-white border border-blue-200 rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium"
          />
          <button
            onClick={handleRefineSubmit}
            disabled={!refinementText.trim() || isRefining}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-95"
          >
            {isRefining ? "Refinando..." : "Refinar Diseño"}
          </button>
        </div>
      </div>

      {/* DOCUMENTO INSTITUCIONAL - ÁREA DE IMPRESIÓN */}
      <div id="preview-container" className="bg-white mx-auto max-w-[21.5cm] min-h-[29.7cm] p-[1cm] text-black border shadow-2xl print:shadow-none print:border-none print:p-0 print:w-full font-serif relative">

        {/* Marca de Agua */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03] pointer-events-none z-0">
          <img src="/logo_santander.png" alt="" className="w-full h-full object-contain grayscale" />
        </div>

        <div className="relative z-10 w-full">
          {/* TABLA PRINCIPAL - FORMATO INSTITUCIONAL */}
          <div className="border-[1.5px] border-black w-full mb-8 text-black bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
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
            <div className="grid grid-cols-12 border-b border-black text-[10px]">
              <div className="col-span-6 border-r border-black p-2 flex gap-1">
                <span className="font-black uppercase shrink-0">NOMBRE DEL DOCENTE:</span>
                <span className="flex-1 italic font-medium">{editableData.nombre_docente}</span>
              </div>
              <div className="col-span-3 border-r border-black p-2 flex gap-1">
                <span className="font-black uppercase shrink-0">ÁREA:</span>
                <span className="flex-1 italic font-medium">{editableData.area}</span>
              </div>
              <div className="col-span-3 p-2 flex gap-1">
                <span className="font-black uppercase shrink-0">ASIGNATURA:</span>
                <span className="flex-1 italic font-medium">{editableData.asignatura}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 border-b border-black text-[10px]">
              <div className="col-span-4 border-r border-black p-2 flex gap-1">
                <span className="font-black uppercase shrink-0">GRADO:</span>
                <span className="flex-1 italic font-medium">{editableData.grado}</span>
              </div>
              <div className="col-span-4 border-r border-black p-2 flex gap-1">
                <span className="font-black uppercase shrink-0">GRUPOS:</span>
                <span className="flex-1 italic font-medium">{editableData.grupos}</span>
              </div>
              <div className="col-span-4 p-2 flex gap-1">
                <span className="font-black uppercase shrink-0">FECHA:</span>
                <span className="flex-1 italic font-medium">{editableData.fecha}</span>
              </div>
            </div>

            {/* 1. PROPÓSITO */}
            <div className="grid grid-cols-12 border-b border-black text-[10px]">
              <div className="col-span-2 border-r border-black p-2 bg-gray-50/50 flex items-center font-black uppercase">1.PROPÓSITO</div>
              <div className="col-span-10 p-2 italic leading-snug font-medium">{editableData.proposito}</div>
            </div>

            {/* 2. INDICADORES */}
            <div className="grid grid-cols-12 border-b border-black text-[10px] min-h-[80px]">
              <div className="col-span-2 border-r border-black p-2 bg-gray-50/50 flex items-start font-black uppercase">2.INDICADORES.</div>
              <div className="col-span-10 p-2 space-y-1">
                <div className="flex gap-2"><span className="font-black min-w-[85px] uppercase text-[9px]">COGNITIVO:</span><span className="italic font-medium">{editableData.indicadores?.cognitivo}</span></div>
                <div className="flex gap-2"><span className="font-black min-w-[85px] uppercase text-[9px]">AFECTIVO:</span><span className="italic font-medium">{editableData.indicadores?.afectivo}</span></div>
                <div className="flex gap-2"><span className="font-black min-w-[85px] uppercase text-[9px]">EXPRESIVO:</span><span className="italic font-medium">{editableData.indicadores?.expresivo}</span></div>
              </div>
            </div>

            {/* 3. ENSEÑANZAS */}
            <div className="grid grid-cols-12 border-b border-black text-[10px]">
              <div className="col-span-2 border-r border-black p-2 bg-gray-50/50 flex items-start font-black uppercase">3.ENSEÑANZAS.</div>
              <div className="col-span-10 p-2 italic font-medium leading-relaxed">
                <ul className="list-none space-y-1">
                  {Array.isArray(editableData.ensenanzas) && editableData.ensenanzas.map((e, idx) => (
                    <li key={idx} className="flex gap-1">
                      <span className="font-black">*</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. SECUENCIA DIDÁCTICA */}
            <div className="grid grid-cols-12 border-b border-black text-[10px]">
              <div className="col-span-2 border-r border-black p-2 bg-gray-50/50 flex items-start font-black uppercase">4.SECUENCIA DIDÁCTICA</div>
              <div className="col-span-10 p-2 space-y-3">
                <div className="space-y-0.5">
                  <span className="font-black uppercase text-[9px] text-slate-500">MOTIVACIÓN Y ENCUADRE:</span>
                  <p className="italic font-medium pl-2">{editableData.secuencia_didactica?.motivacion_encuadre}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-black uppercase text-[9px] text-slate-500">ENUNCIACIÓN:</span>
                  <p className="italic font-medium pl-2">{editableData.secuencia_didactica?.enunciacion}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-black uppercase text-[9px] text-slate-500">MODELACIÓN:</span>
                  <p className="italic font-medium pl-2">{editableData.secuencia_didactica?.modelacion}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-black uppercase text-[9px] text-slate-500">SIMULACIÓN:</span>
                  <p className="italic font-medium pl-2">{editableData.secuencia_didactica?.simulacion}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-black uppercase text-[9px] text-slate-500">EJERCITACIÓN:</span>
                  <p className="italic font-medium pl-2">{editableData.secuencia_didactica?.ejercitacion}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="font-black uppercase text-[9px] text-slate-500">DEMOSTRACIÓN:</span>
                  <p className="italic font-medium pl-2">{editableData.secuencia_didactica?.demostracion}</p>
                </div>
              </div>
            </div>

            {/* 5. DIDÁCTICA */}
            <div className="grid grid-cols-12 border-b border-black text-[10px]">
              <div className="col-span-2 border-r border-black p-2 bg-gray-50/50 flex items-center font-black uppercase">5.DIDÁCTICA</div>
              <div className="col-span-10 p-2 italic font-medium leading-relaxed">{editableData.didactica}</div>
            </div>

            {/* 6. RECURSOS */}
            <div className="grid grid-cols-12 border-b border-black text-[10px]">
              <div className="col-span-2 border-r border-black p-2 bg-gray-50/50 flex items-center font-black uppercase">6.RECURSOS.</div>
              <div className="col-span-10 p-2 italic font-black leading-relaxed">{editableData.recursos}</div>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-12 text-[9px] min-h-[60px]">
              <div className="col-span-4 border-r border-black p-2 flex flex-col justify-between">
                <span className="font-black uppercase">ELABORÓ:</span>
                <span className="italic font-bold text-center border-t border-black/10 pt-1">{editableData.nombre_docente}</span>
              </div>
              <div className="col-span-4 border-r border-black p-2 flex flex-col justify-between">
                <span className="font-black uppercase">REVISÓ/APROBÓ:</span>
                <div className="h-6 border-b border-black/20"></div>
              </div>
              <div className="col-span-4 p-2 flex flex-col justify-between text-center">
                <span className="font-black uppercase">FECHA:</span>
                <span className="italic font-black text-lg">{editableData.fecha}</span>
              </div>
            </div>
          </div>

          {/* ANEXOS */}
          <div className="space-y-12">
            {/* ANEXO 1: SESIONES */}
            <div className="break-before-page border-t-2 border-black pt-8">
              <div className="flex items-center gap-3 mb-6 font-black uppercase tracking-tighter italic">
                <ClipboardList size={22} />
                <h3 className="text-xl">Anexo 1: Desglose Pedagógico de Sesiones</h3>
              </div>
              <div className="space-y-6">
                {Array.isArray(editableData.sesiones_detalle) && editableData.sesiones_detalle.map((s, i) => (
                  <div key={i} className="border-2 border-black p-5 rounded-3xl relative hover:bg-slate-50 transition-colors">
                    <div className="absolute top-0 left-8 -translate-y-1/2 bg-black text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">
                      Sesión {s.numero}
                    </div>
                    <div className="flex justify-between items-center mb-4 mt-2">
                      <h4 className="text-[16px] font-black underline underline-offset-4 decoration-black/10">{s.titulo}</h4>
                      <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{s.tiempo}</span>
                    </div>
                    <p className="text-[12px] italic font-medium text-slate-700 leading-relaxed mb-4">{s.descripcion}</p>
                    <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 italic text-[11px] font-medium leading-relaxed">
                      <span className="font-black text-orange-900 uppercase block mb-1">Activación ADI / Corporiedad:</span>
                      {s.momento_adi}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ANEXO 2: RÚBRICA */}
            <div className="break-before-page border-t-2 border-black pt-8">
              <div className="flex items-center gap-3 mb-6 font-black uppercase tracking-tighter italic">
                <GraduationCap size={22} />
                <h3 className="text-xl">Anexo 2: Rúbrica de Evaluación SIEE Platinum</h3>
              </div>
              <div className="border-2 border-black rounded-[2rem] overflow-hidden bg-white shadow-xl">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-black text-white uppercase font-black">
                      <th className="p-4 text-center border-r border-white/20">Criterio</th>
                      <th className="p-4 text-center border-r border-white/20 bg-red-950/80">Bajo</th>
                      <th className="p-4 text-center border-r border-white/20 bg-orange-950/80">Básico</th>
                      <th className="p-4 text-center border-r border-white/20 bg-blue-950/80">Alto</th>
                      <th className="p-4 text-center bg-emerald-950/80">Superior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {Array.isArray(editableData.rubrica) && editableData.rubrica.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-black uppercase bg-slate-50 border-r border-black/10 text-[9px]">{r.criterio}</td>
                        <td className="p-4 italic font-medium text-slate-600 border-r border-black/10">{r.bajo}</td>
                        <td className="p-4 italic font-medium text-slate-600 border-r border-black/10">{r.basico}</td>
                        <td className="p-4 italic font-semibold text-slate-900 border-r border-black/10 bg-blue-50/20">{r.alto}</td>
                        <td className="p-4 italic font-black text-slate-900 bg-emerald-50/20">{r.superior}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ANEXO 3: TALLER */}
            {editableData.taller_imprimible && (
              <div className="break-before-page border-t-2 border-black pt-8">
                <div className="flex justify-between items-center mb-10 border-b-2 border-dashed border-slate-200 pb-8">
                  <div className="w-24 h-24 p-2 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center justify-center">
                    <img src="/logo_santander.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-center flex-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Anexo 3: Taller de Aplicación</h2>
                    <p className="text-[11px] text-gray-400 font-black uppercase tracking-[8px] mt-1">Guía del Estudiante</p>
                  </div>
                  <div className="text-right pr-4 border-r-4 border-black px-4">
                    <p className="text-[14px] font-black text-blue-900">SANTANDER</p>
                    <p className="text-[9px] font-bold text-gray-400">EXCELENCIA AI</p>
                  </div>
                </div>
                <div className="border-4 border-black rounded-[3rem] p-10 space-y-8 bg-slate-50/30">
                  <div className="grid grid-cols-2 gap-12 text-[12px] border-b-2 border-black/10 pb-10">
                    <div className="space-y-6">
                      <div className="border-b-2 border-black pb-1 italic font-bold">Estudiante: ____________________________</div>
                      <div className="grid grid-cols-3 gap-6 font-black uppercase text-[10px]">
                        <div className="border-b-2 border-black pb-1">Grado: {editableData.grado}</div>
                        <div className="border-b-2 border-black pb-1">Grupo: ____</div>
                        <div className="border-b-2 border-black pb-1">Fecha: ____</div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] italic text-[14px] text-slate-600 leading-relaxed font-medium shadow-sm border border-slate-100">
                      {editableData.taller_imprimible.introduccion}
                    </div>
                  </div>
                  <div className="space-y-12 py-6">
                    {Array.isArray(editableData.taller_imprimible.ejercicios) && editableData.taller_imprimible.ejercicios.map((ej, i) => (
                      <div key={i} className="flex gap-8 group">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-black text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-lg group-hover:scale-110 transition-all">
                          {i + 1}
                        </div>
                        <div className="flex-1 space-y-6 pt-2">
                          <p className="font-bold text-[15px] leading-snug text-slate-900">{ej}</p>
                          <div className="space-y-4 pr-10">
                            <div className="border-b-2 border-slate-200 h-1 w-full opacity-60"></div>
                            <div className="border-b-2 border-slate-200 h-1 w-full opacity-60"></div>
                            <div className="border-b-2 border-slate-200 h-1 w-full opacity-60"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-16 bg-gradient-to-br from-black to-slate-800 p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border-4 border-white/10">
                    <Lightbulb className="absolute top-0 right-0 opacity-10 -mr-16 -mt-16" size={240} />
                    <div className="relative z-10">
                      <div className="bg-white/10 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[3px] mb-6 border border-white/5">💡 RETO CREATIVO MASTER</div>
                      <p className="text-[17px] font-medium leading-relaxed italic opacity-95 pr-20">{editableData.taller_imprimible.reto_creativo}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ANEXO 4: EVALUACIÓN ICFES */}
            {Array.isArray(editableData.evaluacion) && editableData.evaluacion.length > 0 && (
              <div className="break-before-page border-t-2 border-black pt-8">
                <div className="text-center mb-12">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic underline decoration-4 decoration-black/10 underline-offset-8">Anexo 4: Banco de Evaluación por Competencias SIEE (Tipo ICFES)</h3>
                </div>
                <div className="grid grid-cols-1 gap-10">
                  {editableData.evaluacion.map((ev, i) => (
                    <div key={i} className="border-2 border-black rounded-[2.5rem] p-10 relative hover:bg-slate-50 transition-all group overflow-hidden bg-white">
                      <div className="absolute top-0 right-10 -translate-y-1/2 bg-black text-white px-8 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest shadow-xl">
                        ITEM {i + 1}
                      </div>
                      <div className="flex gap-4 mb-6">
                        <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-md">Competencia: {ev.competencia}</span>
                      </div>
                      <p className="font-bold text-[16px] leading-[1.4] mb-10 text-slate-900 border-l-4 border-black pl-6">{ev.pregunta}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
                        {(ev.opciones || []).map((opt, j) => (
                          <div key={j} className="flex items-start gap-5 p-5 border-2 border-slate-100 rounded-2xl bg-white hover:border-black transition-all group/opt shadow-sm hover:shadow-md cursor-pointer">
                            <span className="w-10 h-10 rounded-2xl bg-slate-50 group-hover/opt:bg-black group-hover/opt:text-white border border-slate-200 flex items-center justify-center font-black text-lg transition-all shrink-0">
                              {optionLetters[j]}
                            </span>
                            <span className="italic font-medium text-[14px] pt-1.5 leading-snug">{opt}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-10 pt-8 border-t-2 border-dashed border-slate-200 no-print space-y-4">
                        <div className="flex gap-4 items-center text-emerald-600 font-black">
                          <CheckCircle size={22} />
                          <span className="uppercase text-[11px] tracking-widest text-slate-400">Clave de Respuesta:</span>
                          <span className="text-2xl underline underline-offset-8 decoration-emerald-200 decoration-4 bg-emerald-50 px-4 py-1 rounded-xl">OPCIÓN {ev.respuesta_correcta}</span>
                        </div>
                        {ev.explicacion && (
                          <div className="bg-slate-50 p-6 rounded-[2rem] border-l-8 border-slate-300 italic text-slate-600 text-[12px] font-medium leading-relaxed">
                            <span className="font-black text-slate-400 uppercase text-[10px] block mb-2 tracking-[2px]">Justificación Pedagógica AI:</span>
                            {ev.explicacion}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANEXO 5: ALERTAS Y MATERIAL */}
            <div className="break-before-page border-t-2 border-black pt-8 mb-20">
              <div className="flex items-center gap-3 mb-10 font-black uppercase tracking-tighter italic">
                <AlertTriangle size={22} className="text-red-600" />
                <h3 className="text-xl">Anexo 5: Alertas Pedagógicas y Material de Apoyo Maestro</h3>
              </div>
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-8 bg-red-50/30 p-8 rounded-[3rem] border-2 border-red-100/50">
                  <h4 className="text-[13px] font-black uppercase text-red-700 flex items-center gap-3 tracking-widest">
                    <AlertTriangle size={20} /> ALERTAS RECTORÍA
                  </h4>
                  <ul className="space-y-5">
                    {Array.isArray(editableData.alertas_generated) || (Array.isArray(editableData.alertas_generadas)) ? (
                      (editableData.alertas_generadas || []).map((a, i) => (
                        <li key={i} className="text-[12px] italic font-medium text-slate-700 flex gap-4 leading-relaxed">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-400 mt-2 shrink-0 shadow-sm shadow-red-200"></span>
                          {a}
                        </li>
                      ))
                    ) : null}
                  </ul>
                </div>
                <div className="space-y-8 bg-blue-50/30 p-8 rounded-[3rem] border-2 border-blue-100/50">
                  <h4 className="text-[13px] font-black uppercase text-blue-700 flex items-center gap-3 tracking-widest">
                    <ExternalLink size={20} /> RECURSOS DIGITALES
                  </h4>
                  <div className="space-y-5">
                    {Array.isArray(editableData.recursos_links) && editableData.recursos_links.map((rl, i) => (
                      <div key={i} className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 italic transition-all hover:border-blue-300 hover:shadow-lg group shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 mb-1">{rl.tipo}: {rl.nombre}</p>
                        <p className="text-[11px] text-slate-500 leading-tight mb-4">{rl.descripcion}</p>
                        <a href={rl.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[11px] font-black text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                          Ver Material <ExternalLink size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
