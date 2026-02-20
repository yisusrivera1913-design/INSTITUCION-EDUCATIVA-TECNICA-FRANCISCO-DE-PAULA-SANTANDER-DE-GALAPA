import React, { useState } from 'react';
import { DidacticSequence, SequenceInput } from '../types';
import { generateDocx } from '../services/docxService';
import { Printer, FileDown, CheckCircle, Sparkles, Send, ExternalLink, PenTool } from 'lucide-react';

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

  const EditableContent = ({
    value,
    onSave,
    className = "",
    label = ""
  }: {
    value: string,
    onSave: (val: string) => void,
    className?: string,
    label?: string
  }) => (
    <div className={`p-2 border-l border-gray-400 h-full flex flex-col ${className}`}>
      {label && <span className="text-[9px] font-bold text-gray-500 uppercase mb-1 no-print">{label}</span>}
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onSave(e.currentTarget.innerText)}
        className="text-[11px] text-gray-900 outline-none focus:bg-blue-50/50 transition-colors cursor-text min-h-[1em]"
      >
        {value}
      </div>
    </div>
  );

  // Opciones de respuesta: A, B, C, D
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="animate-fade-in-up pb-10">

      {/* Action Bar */}
      <div className="bg-white/90 backdrop-blur-md sticky top-20 z-40 p-3 rounded-2xl shadow-lg border border-white/50 mb-8 no-print flex justify-between items-center transition-all hover:shadow-xl ring-1 ring-blue-50">
        <div className="flex items-center gap-4 pl-2">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Cruce Institucional</h2>
            <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Francisco de Paula Santander</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onReset} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold">
            <span className="text-lg"> Nueva</span>
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all font-bold shadow-lg">
            <Printer className="h-5 w-5" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Refinement Studio */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10 no-print shadow-sm">
        <h3 className="text-blue-900 font-black text-lg mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Refinar con IA v5.0
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={refinementText}
            onChange={(e) => setRefinementText(e.target.value)}
            placeholder="Ej: 'Profundiza más en la modelación'..."
            className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-2 outline-none"
          />
          <button
            onClick={handleRefineSubmit}
            disabled={!refinementText.trim() || isRefining}
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {isRefining ? "Cargando..." : "Refinar"}
          </button>
        </div>
      </div>

      {/* DOCUMENTO INSTITUCIONAL */}
      <div id="preview-container" className="bg-white mx-auto max-w-[21.5cm] min-h-[29.7cm] p-[1.5cm] text-black border shadow-2xl print:shadow-none print:border-none print:p-0 print:w-full">

        {/* TABLA PRINCIPAL */}
        <div className="border border-gray-400 w-full mb-1">

          {/* Header: Logo + Title */}
          <div className="flex border-b border-gray-400">
            <div className="w-[90px] h-[90px] p-1 flex items-center justify-center border-r border-gray-400 bg-white">
              <img
                src="/logo_santander.png"
                alt="Escudo Institución Educativa Técnica Francisco de Paula Santander"
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
              <h1 className="text-[12px] font-black uppercase leading-tight">
                INSTITUCION EDUCATIVA TECNICA FRANCISCO DE PAULA SANTANDER DE GALAPA
              </h1>
              <p className="text-[10px] font-bold uppercase mt-1">PLANEACIÓN DE CLASE</p>
            </div>
          </div>

          {/* Row 1: Teacher, Area, Asignatura */}
          <div className="flex border-b border-gray-400 min-h-[40px]">
            <div className="w-1/3 flex border-r border-gray-400">
              <div className="w-[80px] p-1 text-[9px] font-bold uppercase flex items-center bg-gray-50/30">DOCENTE:</div>
              <div className="flex-1">
                <EditableContent
                  value={editableData.nombre_docente}
                  onSave={(val) => handleUpdateField('nombre_docente', val)}
                  className="border-l-0"
                />
              </div>
            </div>
            <div className="w-1/3 flex border-r border-gray-400">
              <div className="w-[50px] p-1 text-[9px] font-bold uppercase flex items-center bg-gray-50/30">ÁREA:</div>
              <div className="flex-1">
                <EditableContent
                  value={editableData.area}
                  onSave={(val) => handleUpdateField('area', val)}
                  className="border-l-0"
                />
              </div>
            </div>
            <div className="w-1/3 flex">
              <div className="w-[80px] p-1 text-[9px] font-bold uppercase flex items-center bg-gray-50/30">ASIGNATURA:</div>
              <div className="flex-1">
                <EditableContent
                  value={editableData.asignatura}
                  onSave={(val) => handleUpdateField('asignatura', val)}
                  className="border-l-0"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Grade, Group, Date */}
          <div className="flex border-b border-gray-400 min-h-[40px]">
            <div className="w-1/3 flex border-r border-gray-400">
              <div className="w-[80px] p-1 text-[9px] font-bold uppercase flex items-center bg-gray-50/30">GRADO:</div>
              <div className="flex-1 text-[11px] p-2">{editableData.grado}</div>
            </div>
            <div className="w-1/3 flex border-r border-gray-400">
              <div className="w-[50px] p-1 text-[9px] font-bold uppercase flex items-center bg-gray-50/30">GRUPOS:</div>
              <div className="flex-1">
                <EditableContent
                  value={editableData.grupos}
                  onSave={(val) => handleUpdateField('grupos', val)}
                  className="border-l-0"
                />
              </div>
            </div>
            <div className="w-1/3 flex">
              <div className="w-[80px] p-1 text-[9px] font-bold uppercase flex items-center bg-gray-50/30">FECHA:</div>
              <div className="flex-1 text-[11px] p-2">{editableData.fecha}</div>
            </div>
          </div>

          {/* Row 3: Purpose */}
          <div className="flex border-b border-gray-400 min-h-[50px]">
            <div className="w-[120px] p-2 text-[10px] font-bold uppercase bg-gray-50/30">1. PROPÓSITO:</div>
            <div className="flex-1">
              <EditableContent
                value={editableData.proposito}
                onSave={(val) => handleUpdateField('proposito', val)}
              />
            </div>
          </div>

          {/* Row 4: Indicators */}
          <div className="flex border-b border-gray-400">
            <div className="w-[120px] p-2 text-[10px] font-bold uppercase bg-gray-50/30 border-r border-gray-400">2. INDICADORES:</div>
            <div className="flex-1 flex flex-col">
              <div className="flex border-b border-gray-400">
                <div className="w-[80px] p-1 text-[9px] font-bold uppercase bg-gray-50/10">COGNITIVO:</div>
                <div className="flex-1">
                  <EditableContent
                    value={editableData.indicadores.cognitivo}
                    onSave={(val) => handleUpdateField('indicadores.cognitivo', val)}
                  />
                </div>
              </div>
              <div className="flex border-b border-gray-400">
                <div className="w-[80px] p-1 text-[9px] font-bold uppercase bg-gray-50/10">AFECTIVO:</div>
                <div className="flex-1">
                  <EditableContent
                    value={editableData.indicadores.afectivo}
                    onSave={(val) => handleUpdateField('indicadores.afectivo', val)}
                  />
                </div>
              </div>
              <div className="flex">
                <div className="w-[80px] p-1 text-[9px] font-bold uppercase bg-gray-50/10">EXPRESIVO:</div>
                <div className="flex-1">
                  <EditableContent
                    value={editableData.indicadores.expresivo}
                    onSave={(val) => handleUpdateField('indicadores.expresivo', val)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Teachings */}
          <div className="flex border-b border-gray-400 min-h-[60px]">
            <div className="w-[120px] p-2 text-[10px] font-bold uppercase bg-gray-50/30 border-r border-gray-400">3. ENSEÑANZAS:</div>
            <div className="flex-1 p-2 text-[11px]">
              <ul className="list-disc list-inside space-y-1">
                {editableData.ensenanzas.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Row 6: Didactic Sequence */}
          <div className="flex border-b border-gray-400">
            <div className="w-[120px] p-2 text-[10px] font-bold uppercase bg-gray-50/30 border-r border-gray-400">4. SECUENCIA DIDÁCTICA:</div>
            <div className="flex-1 flex flex-col">
              <div className="border-b border-gray-400">
                <div className="p-1 px-2 text-[9px] font-bold uppercase bg-gray-50/10 border-b border-gray-400">MOTIVACIÓN Y ENCUADRE:</div>
                <EditableContent
                  value={editableData.secuencia_didactica.motivacion_encuadre}
                  onSave={(val) => handleUpdateField('secuencia_didactica.motivacion_encuadre', val)}
                  className="border-l-0 min-h-[40px]"
                />
              </div>
              <div className="border-b border-gray-400">
                <div className="p-1 px-2 text-[9px] font-bold uppercase bg-gray-50/10 border-b border-gray-400">ENUNCIACIÓN:</div>
                <EditableContent
                  value={editableData.secuencia_didactica.enunciacion}
                  onSave={(val) => handleUpdateField('secuencia_didactica.enunciacion', val)}
                  className="border-l-0 min-h-[40px]"
                />
              </div>
              <div className="border-b border-gray-400">
                <div className="p-1 px-2 text-[9px] font-bold uppercase bg-gray-50/10 border-b border-gray-400">MODELACIÓN:</div>
                <EditableContent
                  value={editableData.secuencia_didactica.modelacion}
                  onSave={(val) => handleUpdateField('secuencia_didactica.modelacion', val)}
                  className="border-l-0 min-h-[40px]"
                />
              </div>
              <div className="border-b border-gray-400">
                <div className="p-1 px-2 text-[9px] font-bold uppercase bg-gray-50/10 border-b border-gray-400">SIMULACIÓN:</div>
                <EditableContent
                  value={editableData.secuencia_didactica.simulacion}
                  onSave={(val) => handleUpdateField('secuencia_didactica.simulacion', val)}
                  className="border-l-0 min-h-[40px]"
                />
              </div>
              <div className="border-b border-gray-400">
                <div className="p-1 px-2 text-[9px] font-bold uppercase bg-gray-50/10 border-b border-gray-400">EJERCITACIÓN:</div>
                <EditableContent
                  value={editableData.secuencia_didactica.ejercitacion}
                  onSave={(val) => handleUpdateField('secuencia_didactica.ejercitacion', val)}
                  className="border-l-0 min-h-[60px]"
                />
              </div>
              <div>
                <div className="p-1 px-2 text-[9px] font-bold uppercase bg-gray-50/10 border-b border-gray-400">DEMOSTRACIÓN:</div>
                <EditableContent
                  value={editableData.secuencia_didactica.demostracion}
                  onSave={(val) => handleUpdateField('secuencia_didactica.demostracion', val)}
                  className="border-l-0 min-h-[40px]"
                />
              </div>
            </div>
          </div>

          {/* NUEVO: Row 6B - Plan detallado por sesión */}
          {editableData.sesiones_detalle && editableData.sesiones_detalle.length > 0 && (
            <div className="flex border-b border-gray-400">
              <div className="w-[120px] p-2 text-[10px] font-bold uppercase bg-blue-50/60 border-r border-gray-400 text-blue-900">5. PLAN POR SESIÓN:</div>
              <div className="flex-1 flex flex-col divide-y divide-gray-200">
                {editableData.sesiones_detalle.map((sesion, i) => (
                  <div key={i} className="p-2">
                    <p className="text-[10px] font-black uppercase text-blue-800 mb-1">
                      Sesión {sesion.numero}: {sesion.titulo}
                    </p>
                    <p className="text-[10px] text-gray-700 leading-relaxed">{sesion.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 7: Didactica */}
          <div className="flex border-b border-gray-400 min-h-[50px]">
            <div className="w-[120px] p-2 text-[10px] font-bold uppercase bg-gray-50/30 border-r border-gray-400">6. DIDÁCTICA:</div>
            <div className="flex-1">
              <EditableContent
                value={editableData.didactica}
                onSave={(val) => handleUpdateField('didactica', val)}
                className="border-l-0"
              />
            </div>
          </div>

          {/* Row 8: Resources */}
          <div className="flex border-b border-gray-400 min-h-[50px]">
            <div className="w-[120px] p-2 text-[10px] font-bold uppercase bg-gray-50/30 border-r border-gray-400">7. RECURSOS:</div>
            <div className="flex-1">
              <EditableContent
                value={editableData.recursos}
                onSave={(val) => handleUpdateField('recursos', val)}
                className="border-l-0"
              />
            </div>
          </div>

          {/* NUEVO: Row 8B - Recursos con links */}
          {editableData.recursos_links && editableData.recursos_links.length > 0 && (
            <div className="flex min-h-[50px]">
              <div className="w-[120px] p-2 text-[10px] font-bold uppercase bg-green-50/60 border-r border-gray-400 text-green-900">8. RECURSOS DIGITALES:</div>
              <div className="flex-1 p-2 space-y-1">
                {editableData.recursos_links.map((recurso, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px]">
                    <span className="font-bold text-gray-600 shrink-0 uppercase bg-gray-100 px-1 py-0.5 rounded text-[8px]">
                      {recurso.tipo}
                    </span>
                    <span className="font-medium text-gray-800 shrink-0">{recurso.nombre}:</span>
                    <a
                      href={recurso.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-all hover:text-blue-800 no-print"
                    >
                      {recurso.url}
                    </a>
                    <span className="print-only text-gray-700 break-all">{recurso.url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER FIRMAS */}
        <div className="border border-gray-400 w-full flex text-[10px] font-bold uppercase mt-2">
          <div className="flex-1 flex border-r border-gray-400">
            <div className="p-2 border-r border-gray-400 bg-gray-50/20">ELABORO:</div>
            <div className="flex-1 p-2 bg-white">
              <EditableContent
                value={editableData.elaboro}
                onSave={(val) => handleUpdateField('elaboro', val)}
                className="border-l-0 p-0"
              />
            </div>
          </div>
          <div className="flex-1 flex border-r border-gray-400">
            <div className="p-2 border-r border-gray-400 bg-gray-50/20">REVISÓ:</div>
            <div className="flex-1 p-2 bg-white">
              <EditableContent
                value={editableData.reviso}
                onSave={(val) => handleUpdateField('reviso', val)}
                className="border-l-0 p-0"
              />
            </div>
          </div>
          <div className="flex-1 flex">
            <div className="p-2 border-r border-gray-400 bg-gray-50/20">FECHA:</div>
            <div className="flex-1 p-2 bg-white">
              <EditableContent
                value={editableData.pie_fecha}
                onSave={(val) => handleUpdateField('pie_fecha', val)}
                className="border-l-0 p-0"
              />
            </div>
          </div>
        </div>

        {/* TALLER IMPRIMIBLE (ANEXO) */}
        <div className="mt-[2cm] border-t-2 border-dashed border-gray-300 pt-4 break-before-page">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black uppercase">Taller de Aplicación</h2>
            <p className="text-[10px] text-gray-500 font-bold italic">Francisco de Paula Santander - Galapa</p>
          </div>
          <div className="space-y-4 text-[11px]">
            <div className="border-b border-gray-200 pb-2">
              <span className="font-bold">Nombre:</span> _________________________________________________
            </div>
            {editableData.taller_imprimible && (
              <>
                <div>
                  <h4 className="font-bold underline mb-1">Introducción:</h4>
                  <p className="italic text-gray-700">{editableData.taller_imprimible.introduccion}</p>
                </div>
                <div>
                  <h4 className="font-bold underline mb-1">Instrucciones:</h4>
                  <p>{editableData.taller_imprimible.instrucciones}</p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold underline mb-1">Actividades:</h4>
                  {editableData.taller_imprimible.ejercicios.map((ej, i) => (
                    <div key={i} className="pl-2">
                      <p className="font-medium">{i + 1}. {ej}</p>
                      <div className="mt-4 border-b border-dotted border-gray-300 h-10"></div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-3 rounded mt-4 border border-gray-100">
                  <h4 className="font-bold underline mb-1">Reto Creativo:</h4>
                  <p className="italic">{editableData.taller_imprimible.reto_creativo}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* BANCO DE PREGUNTAS POR COMPETENCIAS - NUEVO DISEÑO */}
        {editableData.evaluacion && editableData.evaluacion.length > 0 && (
          <div className="mt-[1cm] break-before-page border-t-2 border-dashed border-gray-300 pt-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-black uppercase">Evaluación por Competencias</h2>
              <p className="text-[10px] text-gray-500 font-bold italic">
                10 Preguntas Tipo ICFES — Francisco de Paula Santander - Galapa
              </p>
            </div>

            {/* Info del estudiante */}
            <div className="grid grid-cols-2 gap-4 text-[11px] mb-4">
              <div className="border-b border-gray-300 pb-1">
                <span className="font-bold">Nombre:</span> ___________________________________
              </div>
              <div className="border-b border-gray-300 pb-1">
                <span className="font-bold">Grado:</span> _____________ <span className="font-bold ml-4">Grupo:</span> _____________
              </div>
              <div className="border-b border-gray-300 pb-1">
                <span className="font-bold">Área:</span> {editableData.area}
              </div>
              <div className="border-b border-gray-300 pb-1">
                <span className="font-bold">Fecha:</span> ___________________________________
              </div>
            </div>

            <div className="space-y-5 text-[11px]">
              {editableData.evaluacion.map((ev, i) => (
                <div key={i} className="border border-gray-200 rounded p-3 bg-gray-50/30">
                  {/* Competencia badge */}
                  {ev.competencia && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-[8px] font-black uppercase px-2 py-0.5 rounded mb-1">
                      Competencia: {ev.competencia}
                    </span>
                  )}
                  <p className="font-bold mb-2 leading-snug">{i + 1}. {ev.pregunta}</p>
                  <div className="grid grid-cols-2 gap-1 ml-2">
                    {(ev.opciones || []).map((opt, j) => (
                      <div key={j} className="flex items-start gap-1">
                        <span className="font-bold text-gray-600 shrink-0">{optionLetters[j]})</span>
                        <span className="text-gray-800">{opt}</span>
                      </div>
                    ))}
                  </div>
                  {ev.respuesta_correcta && (
                    <div className="mt-2 text-[9px] text-green-700 font-bold border-t border-green-100 pt-1 no-print">
                      ✓ Respuesta: {ev.respuesta_correcta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};