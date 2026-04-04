import React from 'react';

export const Terms: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-12 md:p-24 font-outfit text-slate-800 flex flex-col items-center">
            <div className="max-w-3xl w-full bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100">
                <h1 className="text-4xl font-black mb-10 tracking-tight text-indigo-600">Términos de Servicio</h1>
                <div className="space-y-6 text-lg font-medium">
                    <p className="leading-relaxed">
                        Bienvenido a <strong>EasyPlanning AI</strong>. Al utilizar nuestra plataforma, usted acepta los siguientes términos:
                    </p>
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-2xl italic text-amber-900">
                        "El usuario es responsable de verificar la exactitud pedagógica de las secuencias generadas por la IA. El uso de la cuenta es personal e intransferible."
                    </div>
                </div>
                <div className="mt-16 text-center text-slate-400 text-xs font-bold uppercase tracking-[3px]">
                    © 2026 EasyPlanning AI — Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
};
