import React, { useState } from 'react';
import { SequenceInput } from '../types';
import { GRADOS, AREAS, EJES_CRESE } from '../constants';
import { BookOpen, Calendar, Target, Layers, BrainCircuit, Play, Sparkles, Wand2, PenTool, ClipboardList } from 'lucide-react';

import { User } from '../services/authService';

interface InputFormProps {
  input: SequenceInput;
  setInput: React.Dispatch<React.SetStateAction<SequenceInput>>;
  onGenerate: () => void;
  isLoading: boolean;
  user?: User | null;
}

export const InputForm: React.FC<InputFormProps> = ({ input, setInput, onGenerate, isLoading, user }) => {
  const [dbaMode, setDbaMode] = useState<'manual' | 'auto'>('manual');

  const filteredGrados = GRADOS;
  const filteredAreas = AREAS;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  // Validation: Basic check
  const isFormValid = input.grado && input.area && input.tema && input.asignatura && input.grupos && input.fecha && input.ejeCrese;

  return (
    <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 mb-8 no-print relative overflow-hidden ring-1 ring-blue-50">

      {/* Decorative background element - Refined */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -mr-32 -mt-32 opacity-50 z-0 pointer-events-none blur-3xl"></div>

      <div className="relative z-10 mb-8 border-b border-gray-100/50 pb-6 flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white p-1 rounded-2xl shadow-md border border-gray-100 transform hover:scale-105 transition-transform duration-300 w-[70px] h-[70px] flex items-center justify-center">
          <img
            src="/logo_santander.png"
            alt="Escudo Francisco de Paula Santander"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center md:justify-start gap-2">
            <Layers className="text-blue-600 drop-shadow-sm" />
            Planeación de Clase Institucional
          </h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">I.E. Técnico Francisco de Paula Santander de Galapa</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-6">

        {/* Grado */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Grado</label>
          <div className="relative group transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <BookOpen className="h-5 w-5" />
            </div>
            <select
              name="grado"
              value={input.grado}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:border-blue-300 text-gray-700 font-bold"
            >
              <option value="">Seleccionar Grado</option>
              {filteredGrados.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Grupos */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Grupos</label>
          <div className="relative group transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Layers className="h-5 w-5" />
            </div>
            <input
              type="text"
              name="grupos"
              value={input.grupos}
              onChange={handleChange}
              placeholder="Ej. 101, 102"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 text-gray-700 font-bold"
            />
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Fecha / Periodo</label>
          <div className="relative group transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Calendar className="h-5 w-5" />
            </div>
            <input
              type="text"
              name="fecha"
              value={input.fecha}
              onChange={handleChange}
              placeholder="Ej. Marzo 2026"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 text-gray-700 font-bold"
            />
          </div>
        </div>

        {/* Numero de Secuencia */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">N° Secuencia</label>
          <div className="relative group transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <ClipboardList className="h-5 w-5" />
            </div>
            <input
              type="number"
              name="num_secuencia"
              value={input.num_secuencia || 1}
              onChange={(e) => setInput(prev => ({ ...prev, num_secuencia: parseInt(e.target.value) }))}
              min={1}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 text-gray-700 font-bold"
            />
          </div>
        </div>

        {/* Área */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Área</label>
          <div className="relative group transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <select
              name="area"
              value={input.area}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:border-blue-300 text-gray-700 font-bold"
            >
              <option value="">Seleccionar Área</option>
              {filteredAreas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Eje CRESE */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Eje CRESE</label>
          <div className="relative group transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Sparkles className="h-5 w-5" />
            </div>
            <select
              name="ejeCrese"
              value={input.ejeCrese}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:border-blue-300 text-gray-700 font-bold"
            >
              <option value="">Seleccionar Eje</option>
              {EJES_CRESE.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* Asignatura */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Asignatura</label>
          <div className="relative group transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <PenTool className="h-5 w-5" />
            </div>
            <input
              type="text"
              name="asignatura"
              value={input.asignatura}
              onChange={handleChange}
              placeholder="Ej. Biología"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 text-gray-700 font-bold"
            />
          </div>
        </div>

        {/* Sesiones */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Sesiones</label>
          <div className="relative group transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Target className="h-5 w-5" />
            </div>
            <input
              type="number"
              name="sesiones"
              value={input.sesiones}
              onChange={handleChange}
              min={1}
              max={15}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 text-gray-700 font-bold"
            />
          </div>
        </div>

        {/* Tema */}
        <div className="md:col-span-4">
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Tema Principal o Enseñanza</label>
          <input
            type="text"
            name="tema"
            value={input.tema}
            onChange={handleChange}
            placeholder="Ej. El Sistema Digestivo Humano..."
            className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 text-xl font-black text-slate-800 placeholder-slate-300"
          />
        </div>

        {/* DBA */}
        <div className="md:col-span-4 bg-slate-900 rounded-[2rem] p-6 shadow-2xl shadow-slate-900/20 border-4 border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 text-sm">
            <label className="block font-black text-white mb-2 sm:mb-0 uppercase tracking-widest text-[10px]">Derecho Básico de Aprendizaje (DBA)</label>
            <div className="flex bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => { setDbaMode('manual'); }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${dbaMode === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <PenTool size={14} /> MANUAL
              </button>
              <button
                onClick={() => { setDbaMode('auto'); setInput(prev => ({ ...prev, dba: '' })) }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${dbaMode === 'auto' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Wand2 size={14} /> CON INTELIGENCIA ARTIFICIAL
              </button>
            </div>
          </div>

          {dbaMode === 'manual' ? (
            <textarea
              name="dba"
              value={input.dba}
              onChange={handleChange}
              rows={3}
              placeholder="Ingrese el DBA oficial aquí..."
              className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-slate-200 font-medium placeholder-slate-600"
            />
          ) : (
            <div className="w-full px-5 py-8 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-[1.5rem] text-center group hover:border-indigo-500 transition-all cursor-default">
              <p className="text-[12px] font-black text-indigo-400 flex items-center justify-center gap-3 tracking-widest uppercase">
                <Sparkles size={20} className="animate-pulse" /> Automatización Pedagógica Activada
              </p>
            </div>
          )}
        </div>

      </div>

      <div className="relative z-10 mt-10 pt-8 border-t border-gray-100 flex justify-end">
        <button
          onClick={onGenerate}
          disabled={isLoading || !isFormValid}
          className={`group flex items-center gap-4 px-12 py-5 rounded-[2rem] text-white font-black text-xl shadow-2xl transition-all duration-300 transform ${isLoading || !isFormValid
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-slate-900 border-4 border-slate-800 hover:bg-black hover:-translate-y-2 hover:shadow-blue-500/20 active:scale-95'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              Diseñando v5.1...
            </span>
          ) : (
            <>
              <span>Diseñar Planeación Premium</span>
              <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};