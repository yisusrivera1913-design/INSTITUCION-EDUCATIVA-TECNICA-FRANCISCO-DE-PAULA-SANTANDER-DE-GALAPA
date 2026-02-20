import React, { useState } from 'react';
import { DidacticSequence, SequenceInput } from '../types';
import { generateDocx } from '../services/docxService';
import { Printer, FileDown, CheckCircle, Sparkles, Send, ExternalLink, PenTool, BookOpen, Target, BrainCircuit, Users, Heart, GraduationCap, Info, Lightbulb, ClipboardList, AlertTriangle } from 'lucide-react';

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

  const handleUpdateField = (path: string, value: any) => {
    const newData = { ...editableData };
    const keys = path.split('.');
    let current: any = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setEditableData(newData);
  };

  const handleRefineSubmit = () => {
    if (!refinementText.trim()) return;
    setIsRefining(true);
    onRefine(refinementText);
  };

  const handlePrint = () => {
    window.print();
  };

  const SectionHeader = ({ title, icon: Icon, color = "blue" }: { title: string, icon: any, color?: string }) => (
    <div className={`bg-${color}-50/50 border-y border-gray-300 p-2 flex items-center gap-2 mt-4`}>
      <Icon size={14} className={`text-${color}-700 no-print`} />
      <h3 className={`text-[10px] font-black uppercase text-${color}-900 tracking-wider`}>{title}</h3>
    </div>
  );

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
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Diseño Pedagógico v5.1</h2>
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

      {/* DOCUMENTO INSTITUCIONAL */}
      <div id="preview-container" className="bg-white mx-auto max-w-[21.5cm] min-h-[29.7cm] p-[1.2cm] text-black border shadow-2xl print:shadow-none print:border-none print:p-0 print:w-full font-serif relative overflow-hidden">

        {/* Marca de Agua Estilo Institucional */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03] pointer-events-none z-0">
          <img src="/logo_santander.png" alt="" className="w-full h-full object-contain grayscale" />
        </div>

        <div className="relative z-10">

          {/* ENCABEZADO FORMAL ESTILO GUAIMARAL/SANTANDER */}
          <div className="border-[1.5px] border-gray-800 w-full mb-1">
            <div className="flex border-b border-gray-800 h-[100px]">
              <div className="w-[110px] p-2 flex items-center justify-center border-r border-gray-800 bg-white">
                <img src="/logo_santander.png" alt="Escudo" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-2 text-center border-r border-gray-800">
                <h1 className="text-[14px] font-black uppercase leading-[1.1] tracking-tight">
                  INSTITUCIÓN EDUCATIVA TECNICA FRANCISCO DE PAULA SANTANDER DE GALAPA
                </h1>
                <p className="text-[10px] font-bold uppercase mt-1 tracking-[3px] text-gray-700">GESTIÓN ACADÉMICA - PREPARACIÓN DE CLASES</p>
                <p className="text-[9px] font-bold text-gray-500 italic mt-0.5 tracking-wider">"Calidad Humana y Excelencia Académica"</p>
              </div>
              <div className="w-[160px] flex flex-col divide-y divide-gray-800 text-[8px] uppercase font-bold bg-gray-50/30">
                <div className="flex-1 flex flex-col justify-center px-2">
                  <span className="text-[7px] text-gray-400">Versión:</span> 5.1
                </div>
                <div className="flex-1 flex flex-col justify-center px-2">
                  <span className="text-[7px] text-gray-400">Código:</span> GA-F03
                </div>
                <div className="flex-1 flex flex-col justify-center px-2">
                  <span className="text-[7px] text-gray-400">Página:</span> 1 de 1
                </div>
              </div>
            </div>

            {/* INFO BASICA GRID */}
            <div className="grid grid-cols-12 border-b border-gray-800 text-[10px] font-bold uppercase min-h-[45px]">
              <div className="col-span-5 border-r border-gray-800 flex flex-col">
                <div className="bg-gray-100/50 px-2 py-0.5 border-b border-gray-400 text-[7px] text-gray-400">TÍTULO DE LA SECUENCIA DIDÁCTICA:</div>
                <div className="flex-1 px-2 py-1 font-black text-gray-900 flex items-center">{editableData.titulo_secuencia}</div>
              </div>
              <div className="col-span-4 border-r border-gray-800 flex flex-col">
                <div className="bg-gray-100/50 px-2 py-0.5 border-b border-gray-400 text-[7px] text-gray-400">ÁREA DE CONOCIMIENTO:</div>
                <div className="flex-1 px-2 py-1 flex items-center">{editableData.area}</div>
              </div>
              <div className="col-span-3 flex flex-col text-center">
                <div className="bg-gray-100/50 px-2 py-0.5 border-b border-gray-400 text-[7px] text-gray-400">SECUENCIA N°:</div>
                <div className="flex-1 flex items-center justify-center text-[16px] font-black">{editableData.num_secuencia || 1}</div>
              </div>
            </div>

            <div className="grid grid-cols-12 border-b border-gray-800 text-[10px] font-bold uppercase min-h-[40px]">
              <div className="col-span-3 border-r border-gray-800 flex flex-col">
                <div className="bg-gray-100/50 px-2 py-0.5 border-b border-gray-400 text-[7px] text-gray-400">TEMA:</div>
                <div className="flex-1 px-2 py-1 flex items-center font-black">{editableData.tema_principal}</div>
              </div>
              <div className="col-span-2 border-r border-gray-800 flex flex-col text-center">
                <div className="bg-gray-100/50 px-2 py-0.5 border-b border-gray-400 text-[7px] text-gray-400">FECHA:</div>
                <div className="flex-1 flex items-center justify-center">{editableData.fecha}</div>
              </div>
              <div className="col-span-3 border-r border-gray-800 flex flex-col text-center">
                <div className="bg-gray-100/50 px-2 py-0.5 border-b border-gray-400 text-[7px] text-gray-400">GRADO:</div>
                <div className="flex-1 flex items-center justify-center font-black text-[12px]">{editableData.grado}</div>
              </div>
              <div className="col-span-2 border-r border-gray-800 flex flex-col text-center">
                <div className="bg-gray-100/50 px-2 py-0.5 border-b border-gray-400 text-[7px] text-gray-400">TIEMPO:</div>
                <div className="flex-1 flex items-center justify-center">{editableData.sesiones_detalle?.length} Sesiones</div>
              </div>
              <div className="col-span-2 flex flex-col text-center">
                <div className="bg-gray-100/50 px-2 py-0.5 border-b border-gray-400 text-[7px] text-gray-400">DOCENTE:</div>
                <div className="flex-1 flex items-center justify-center text-[8px] leading-tight px-1 font-black">{editableData.nombre_docente}</div>
              </div>
            </div>

            {/* CUERPO PEDAGOGICO */}
            <SectionHeader title="Descripción de la Secuencia Didáctica: Aprendizajes a Lograr" icon={Info} color="gray" />
            <div className="p-3 text-[10.5px] leading-relaxed border-b border-gray-800 italic text-gray-700 bg-white">
              {editableData.descripcion_secuencia}
            </div>

            <SectionHeader title="Objetivo de Aprendizaje" icon={Target} color="gray" />
            <div className="p-3 text-[10.5px] leading-relaxed border-b border-gray-800 font-bold bg-white">
              {editableData.objetivos_aprendizaje}
            </div>

            <div className="grid grid-cols-2 text-[9px] min-h-[120px]">
              <div className="border-r border-gray-800 flex flex-col">
                <div className="bg-gray-100/80 p-1 border-b border-gray-800 font-black uppercase text-center">Contenidos a Desarrollar</div>
                <div className="p-3 flex-1 bg-white">
                  <ul className="list-disc list-inside space-y-1.5 text-[10px]">
                    {Array.isArray(editableData.contenidos_desarrollar) && editableData.contenidos_desarrollar.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="bg-gray-100/80 p-1 border-b border-gray-800 font-black uppercase text-center">Competencias del MEN</div>
                <div className="p-3 flex-1 text-[10px] bg-white leading-relaxed">
                  {editableData.competencias_men}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-gray-800 text-[9px] min-h-[120px]">
              <div className="border-r border-gray-800 flex flex-col">
                <div className="bg-gray-100/80 p-1 border-b border-gray-800 font-black uppercase text-center">Estándar de Competencia del MEN</div>
                <div className="p-3 flex-1 text-[10px] bg-white leading-relaxed">
                  {editableData.estandar_competencia}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="bg-gray-100/80 p-1 border-b border-gray-800 font-black uppercase text-center">Derechos Básicos de Aprendizaje (DBA)</div>
                <div className="p-3 flex-1 bg-white leading-relaxed border-l-4 border-blue-600">
                  {editableData.dba_detalle ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-black text-blue-900 uppercase">{editableData.dba_detalle.numero}</p>
                      <p className="text-[10px] font-bold text-gray-900">{editableData.dba_detalle.enunciado}</p>
                      <div className="mt-2">
                        <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Evidencias de Aprendizaje:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {Array.isArray(editableData.dba_detalle.evidencias) && editableData.dba_detalle.evidencias.map((ev, i) => (
                            <li key={i} className="text-[9px] font-medium text-gray-700 leading-tight">{ev}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold">{editableData.dba_utilizado}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 flex flex-col text-[9px]">
              <div className="bg-gray-100/80 p-1 border-b border-gray-800 font-black uppercase text-center">Eje Transversal (CRESE)</div>
              <div className="p-3 flex-1 bg-white italic text-gray-800 text-[10px] border-b border-gray-800">
                {editableData.eje_transversal_crese}
              </div>
            </div>

            <div className="flex flex-col text-[9px]">
              <div className="bg-gray-100/80 p-1 border-b border-gray-800 font-black uppercase text-center">Corporiedad / ADI</div>
              <div className="p-3 flex-1 bg-white italic text-gray-800 text-[10px] border-b border-gray-800">
                {editableData.corporiedad_adi}
              </div>
            </div>

            <SectionHeader title="Metodología" icon={BrainCircuit} color="gray" />
            <div className="p-3 text-[10.5px] leading-relaxed border-b border-gray-800 bg-white">
              {editableData.metodologia}
            </div>

            {/* SECUENCIA DIDACTICA MINI-GRID */}
            <SectionHeader title="Secuencia Didáctica (Desarrollo)" icon={ClipboardList} color="gray" />
            <div className="grid grid-cols-3 divide-x divide-y divide-gray-300 border-b border-gray-800">
              {[
                { t: "1. Motivación y Encuadre", v: editableData.secuencia_didactica.motivacion_encuadre },
                { t: "2. Enunciación", v: editableData.secuencia_didactica.enunciacion },
                { t: "3. Modelación", v: editableData.secuencia_didactica.modelacion },
                { t: "4. Simulación", v: editableData.secuencia_didactica.simulacion },
                { t: "5. Ejercitación", v: editableData.secuencia_didactica.ejercitacion },
                { t: "6. Demostración", v: editableData.secuencia_didactica.demostracion }
              ].map((m, i) => (
                <div key={i} className="p-2 flex flex-col gap-1 min-h-[140px] bg-white">
                  <span className="text-[8px] font-black uppercase text-blue-800">{m.t}</span>
                  <p className="text-[10px] leading-[1.3] text-gray-700">{m.v}</p>
                </div>
              ))}
            </div>

            {/* DESGLOSE POR SESIONES - DISEÑO MEJORADO */}
            <div className="bg-gray-100 p-2 border-b border-gray-800 text-center font-black uppercase text-[10px] tracking-widest text-slate-800">
              Anexo 1: Desglose de Sesiones
            </div>
            <div className="flex flex-col divide-y divide-gray-200 bg-white">
              {Array.isArray(editableData.sesiones_detalle) && editableData.sesiones_detalle.map((s, i) => (
                <div key={i} className="p-5 flex gap-6 items-start hover:bg-slate-50 transition-colors">
                  <div className="w-[100px] shrink-0 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-lg">
                      <span className="text-[9px] uppercase font-bold opacity-60">Sesión</span>
                      <span className="text-xl font-black leading-none">{s.numero}</span>
                    </div>
                    <div className="mt-3 px-3 py-1 bg-blue-100 text-blue-900 text-[8px] font-black uppercase rounded-full tracking-wider whitespace-nowrap">
                      {s.tiempo}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 pt-1">
                    <h4 className="text-[14px] font-black text-slate-900 border-b-2 border-blue-600/10 pb-1">{s.titulo}</h4>
                    <p className="text-[11px] leading-relaxed text-slate-700 font-medium">{s.descripcion}</p>
                    <div className="bg-yellow-50 p-3 rounded-2xl border border-yellow-100 flex gap-3 items-start">
                      <Heart size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-black uppercase text-yellow-900 tracking-wider">Momento ADI (Activación Corporiedad):</span>
                        <p className="text-[10.5px] italic text-yellow-950 mt-1 font-medium leading-relaxed">{s.momento_adi}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECURSOS Y PIAR TABLES */}
          <div className="mt-4 border border-gray-800 w-full overflow-hidden bg-white">
            <div className="grid grid-cols-2 text-[9px] font-bold divide-x divide-gray-800 border-b border-gray-800">
              <div className="bg-gray-50 p-1.5 text-center uppercase tracking-wider">Bibliografía / Cibergrafía</div>
              <div className="bg-emerald-50 p-1.5 text-center uppercase tracking-wider text-emerald-950 underline underline-offset-4 decoration-emerald-200 decoration-2">Adecuaciones Curriculares (PIAR - Inclusión)</div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-800">
              <div className="p-4 bg-white text-[10px] font-medium leading-relaxed italic text-gray-600">
                {editableData.bibliografia || "Fuentes oficiales del MEN y plataformas institucionales consultadas."}
              </div>
              <div className="p-4 bg-white text-[10px] font-medium leading-relaxed border-l-4 border-emerald-500">
                {editableData.adecuaciones_piar}
              </div>
            </div>
          </div>

          {/* RUBRICA PROFESIONAL - ANEXO 2 */}
          <div className="mt-10 break-before-page">
            <div className="flex items-center gap-3 mb-6 border-l-[6px] border-slate-900 pl-4 py-1">
              <GraduationCap className="text-slate-900" size={28} />
              <div>
                <h3 className="text-xl font-black uppercase text-slate-950 tracking-tighter">Anexo 2: Rúbrica de Desempeño Escolar</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sistema de Evaluación Institucional - SIEE</p>
              </div>
            </div>
            {/* ... rest of rubric content same as before ... */}
            <div className="w-full border-[1.5px] border-slate-800 rounded-[2rem] overflow-hidden shadow-xl bg-white relative">
              <div className="grid grid-cols-5 bg-slate-900 text-white text-[9px] font-black uppercase divide-x divide-slate-700 border-b border-slate-800">
                <div className="p-4 text-center">Criterio</div>
                <div className="p-4 text-center bg-red-900/60 flex flex-col items-center gap-1">
                  <span className="text-[10px]">Bajo</span>
                  <span className="opacity-50 font-medium text-[7px] tracking-[2px]">(1.0 - 2.9)</span>
                </div>
                <div className="p-4 text-center bg-orange-900/60 flex flex-col items-center gap-1">
                  <span className="text-[10px]">Básico</span>
                  <span className="opacity-50 font-medium text-[7px] tracking-[2px]">(3.0 - 3.9)</span>
                </div>
                <div className="p-4 text-center bg-blue-900/60 flex flex-col items-center gap-1">
                  <span className="text-[10px]">Alto</span>
                  <span className="opacity-50 font-medium text-[7px] tracking-[2px]">(4.0 - 4.5)</span>
                </div>
                <div className="p-4 text-center bg-emerald-900/60 flex flex-col items-center gap-1">
                  <span className="text-[10px]">Superior</span>
                  <span className="opacity-50 font-medium text-[7px] tracking-[2px]">(4.6 - 5.0)</span>
                </div>
              </div>
            </div>
            {Array.isArray(editableData.rubrica) && editableData.rubrica.map((r, i) => (
              <div key={i} className="grid grid-cols-5 text-[9.5px] divide-x divide-slate-100 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="p-4 font-black uppercase bg-slate-50 flex items-center text-slate-900 border-r border-slate-200">{r.criterio}</div>
                <div className="p-4 text-red-900/60 italic flex items-center bg-red-50/20">{r.bajo}</div>
                <div className="p-4 text-orange-900 flex items-center bg-orange-50/20 font-medium">{r.basico}</div>
                <div className="p-4 text-blue-900 flex items-center bg-blue-50/20 font-semibold leading-relaxed">{r.alto}</div>
                <div className="p-4 text-emerald-900 flex items-center bg-emerald-50/20 font-black leading-relaxed">{r.superior}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TALLER IMPRIMIBLE - ANEXO 3 */}
        <div className="mt-[2cm] border-t-2 border-dashed border-gray-300 pt-12 break-before-page">
          <div className="flex justify-between items-center mb-10 px-4">
            <div className="w-24 h-24 p-1 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-center">
              <img src="/logo_santander.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-center flex-1">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Anexo 3: Taller de Aplicación</h2>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="h-0.5 w-6 bg-blue-600"></div>
                <p className="text-[11px] text-gray-400 font-black uppercase tracking-[5px]">Guía de Aprendizaje Institucional</p>
                <div className="h-0.5 w-6 bg-blue-600"></div>
              </div>
            </div>
            {/* ... header right part ... */}
            <div className="text-right border-r-4 border-blue-600 pr-4">
              <p className="text-[14px] font-black text-blue-900">SANTANDER</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Excelencia AI</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-[11px] mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 ring-1 ring-white">
            <div className="border-b-2 border-slate-200 pb-2 flex flex-col gap-2">
              <span className="font-black uppercase text-[8px] text-blue-600 block tracking-widest">Estudiante:</span>
              <div className="h-6"></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-b-2 border-slate-200 pb-2 text-center flex flex-col gap-1">
                <span className="font-black uppercase text-[8px] text-blue-600 block tracking-widest">Grado:</span>
                <span className="font-black">{editableData.grado}</span>
              </div>
              <div className="border-b-2 border-slate-200 pb-2 text-center flex flex-col gap-1">
                <span className="font-black uppercase text-[8px] text-blue-600 block tracking-widest">Grupo:</span>
                <span className="font-black">{editableData.grupos || "___"}</span>
              </div>
              <div className="border-b-2 border-slate-200 pb-2 text-center flex flex-col gap-1">
                <span className="font-black uppercase text-[8px] text-blue-600 block tracking-widest">Fecha:</span>
                <span className="font-black">{editableData.fecha}</span>
              </div>
            </div>
          </div>

          <div className="space-y-8 text-[11px] max-w-3xl mx-auto">
            {editableData.taller_imprimible && (
              <>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 relative">
                  <div className="absolute top-0 left-6 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/30">
                    Contexto y Motivación
                  </div>
                  <p className="italic text-slate-700 leading-loose font-medium text-[12px] pt-2">{editableData.taller_imprimible.introduccion}</p>
                </div>

                <div className="space-y-8 mt-10">
                  {Array.isArray(editableData.taller_imprimible.ejercicios) && editableData.taller_imprimible.ejercicios.map((ej, i) => (
                    <div key={i} className="group">
                      <div className="flex gap-6">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 group-hover:bg-blue-600 text-white flex items-center justify-center font-black text-lg transition-all shadow-lg shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 pt-2">
                          <p className="font-bold text-[13px] text-slate-900 leading-relaxed mb-6">{ej}</p>
                          <div className="space-y-3">
                            <div className="border-b-[1.5px] border-slate-100 w-full h-1"></div>
                            <div className="border-b-[1.5px] border-slate-100 w-full h-1"></div>
                            <div className="border-b-[1.5px] border-slate-100 w-full h-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 rounded-[3rem] mt-16 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/30 border-4 border-emerald-400/30">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Lightbulb size={200} />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-emerald-400/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[3px] mb-4 border border-white/20">
                      💡 Desafío Maestro
                    </div>
                    <h4 className="font-black uppercase text-2xl mb-3 tracking-tighter">
                      ¡Reto Creativo Final!
                    </h4>
                    <p className="text-[14px] font-medium leading-relaxed italic opacity-95">{editableData.taller_imprimible.reto_creativo}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* BANCO DE EVALUACION ICFES - ANEXO 4 */}
        {editableData.evaluacion && editableData.evaluacion.length > 0 && (
          <div className="mt-[1.5cm] break-before-page pt-12">
            <div className="text-center mb-12">
              <span className="text-[10px] font-black uppercase tracking-[8px] text-blue-600 mb-2 block">SIEE Santander</span>
              <h2 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Anexo 4: Evaluación por Competencias</h2>
              <p className="text-[12px] text-gray-500 font-bold italic mt-1 font-serif">10 Preguntas Tipo ICFES</p>
            </div>

            <div className="grid grid-cols-1 gap-8 text-[11px]">
              {Array.isArray(editableData.evaluacion) && editableData.evaluacion.map((ev, i) => (
                <div key={i} className="border-2 border-slate-100 rounded-[2.5rem] p-8 bg-white shadow-sm hover:border-blue-100 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-blue-50"></div>

                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:bg-blue-600 transition-colors">
                        {i + 1}
                      </div>
                      <div className="h-8 w-0.5 bg-slate-200"></div>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic group-hover:text-blue-500 transition-colors">Opción Múltiple</span>
                    </div>
                    {ev.competencia && (
                      <div className="bg-blue-600 text-white text-[9px] font-black uppercase px-5 py-2 rounded-2xl shadow-lg shadow-blue-500/20 tracking-tighter">
                        Competencia: {ev.competencia}
                      </div>
                    )}
                  </div>

                  <p className="font-bold text-[13px] text-slate-900 mb-8 leading-snug pl-2 relative z-10">{ev.pregunta}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-2 relative z-10">
                    {(ev.opciones || []).map((opt, j) => (
                      <div key={j} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group/opt hover:bg-white hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                        <span className="w-8 h-8 bg-white border border-slate-200 group-hover/opt:bg-blue-600 group-hover/opt:text-white group-hover/opt:border-blue-600 rounded-xl flex items-center justify-center font-black text-[12px] transition-all shrink-0 shadow-sm">{optionLetters[j]}</span>
                        <span className="text-slate-700 font-semibold group-hover/opt:text-slate-950 transition-colors leading-tight">{opt}</span>
                      </div>
                    ))}
                  </div>

                  {ev.respuesta_correcta && (
                    <div className="mt-8 border-t-2 border-slate-50 pt-5 no-print">
                      <div className="flex items-center gap-3 text-emerald-600 font-black mb-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                          <CheckCircle size={16} />
                        </div>
                        <span className="uppercase tracking-widest text-[9px] text-gray-400">Clave de Respuesta:</span>
                        <span className="text-lg bg-emerald-600 text-white px-3 py-1 rounded-lg">Opción {ev.respuesta_correcta}</span>
                      </div>
                      {ev.explicacion && (
                        <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-slate-300">
                          <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Retroalimentación para el Docente:</p>
                          <p className="text-[10.5px] italic text-slate-600 font-medium leading-relaxed">{ev.explicacion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUTOEVALUACION DEL ESTUDIANTE */}
        {editableData.autoevaluacion && (
          <div className="mt-16 bg-blue-50/30 p-8 rounded-[3rem] border-2 border-blue-100/50">
            <h3 className="text-xl font-black uppercase text-blue-900 mb-6 flex items-center gap-3">
              <Sparkles className="text-blue-600" size={24} /> Autoevaluación del Estudiante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(editableData.autoevaluacion) && editableData.autoevaluacion.map((q, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">{i + 1}</div>
                  <p className="text-[11px] font-bold text-blue-950">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALERTAS PEDAGOGICAS Y RECURSOS - ANEXO 5 */}
        <div className="mt-16 break-before-page border-t-4 border-slate-900 pt-12 mb-10">
          <h3 className="text-2xl font-black uppercase text-slate-950 tracking-tighter mb-4">Anexo 5: Alertas Pedagógicas y Recursos Digitales</h3>
          <div className="grid grid-cols-2 gap-8">
            {/* Alertas */}
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
              <h4 className="text-[12px] font-black uppercase text-red-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" /> Alertas del Rector / Coordinación
              </h4>
              <ul className="space-y-3">
                {Array.isArray(editableData.alertas_generadas) && editableData.alertas_generadas.map((a, i) => (
                  <li key={i} className="text-[11px] text-red-800 font-medium flex gap-2">
                    <span className="shrink-0 text-red-400">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            {/* Recursos */}
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <h4 className="text-[12px] font-black uppercase text-blue-900 mb-4 flex items-center gap-2">
                <ExternalLink size={16} className="text-blue-600" /> Enlaces de Profundización
              </h4>
              <div className="space-y-4">
                {Array.isArray(editableData.recursos_links) && editableData.recursos_links.map((rl, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-[10px] font-black text-blue-900 uppercase">{rl.tipo}: {rl.nombre}</p>
                    <p className="text-[9px] text-gray-500 mt-1 leading-tight">{rl.descripcion}</p>
                    <a href={rl.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-blue-600 mt-2 flex items-center gap-1 hover:underline">
                      Abrir recurso <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CONTROL DE VERSIONES Y FIRMAS FINALES */}
        <div className="mt-20 border-t-2 border-slate-100 pt-10 no-print pb-20">
          <p className="text-[8px] font-black uppercase text-slate-400 mb-4 tracking-[0.3em] text-center">Trazabilidad de Control de Calidad Académica</p>
          <div className="w-full border border-slate-200 rounded-2xl overflow-hidden text-[9px] bg-white shadow-sm">
            <div className="grid grid-cols-12 bg-slate-50 font-black uppercase border-b border-slate-200 text-slate-500 divide-x divide-slate-200">
              <div className="col-span-2 p-3 text-center">Código Versión</div>
              <div className="col-span-2 p-3 text-center">Fecha de Ajuste</div>
              <div className="col-span-8 p-3">Descripción de la Modificación Pedagógica</div>
            </div>
            {Array.isArray(editableData.control_versiones) && editableData.control_versiones.map((v, i) => (
              <div key={i} className="grid grid-cols-12 divide-x divide-slate-100 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors italic text-slate-500">
                <div className="col-span-2 p-3 text-center font-bold text-slate-900 not-italic uppercase tracking-tighter">{v.version}</div>
                <div className="col-span-2 p-3 text-center font-medium not-italic">{v.fecha}</div>
                <div className="col-span-8 p-3 font-medium leading-relaxed">{v.descripcion}</div>
              </div>
            ))}
            {!Array.isArray(editableData.control_versiones) && (
              <div className="grid grid-cols-12 divide-x divide-slate-100 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors italic text-slate-500">
                <div className="col-span-2 p-3 text-center font-bold text-slate-900 not-italic uppercase tracking-tighter">1.1</div>
                <div className="col-span-2 p-3 text-center font-medium not-italic">{editableData.fecha}</div>
                <div className="col-span-8 p-3 font-medium leading-relaxed">Generación de Diseño Pedagógico Platinum v5.1</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
