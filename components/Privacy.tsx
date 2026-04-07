import React from 'react';

export const Privacy: React.FC = () => {
    return (
        <div className="min-h-screen bg-white p-12 md:p-24 font-outfit text-slate-800 flex flex-col items-center">
            <div className="max-w-3xl w-full">
                <h1 className="text-4xl font-black mb-8 tracking-tight text-blue-600">Política de Privacidad</h1>
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
                    <p className="text-xl leading-relaxed font-medium">
                        Recopilamos su nombre y correo de Google para identificar sus planeaciones en la plataforma <strong>SistemaClasesIdeal</strong>. 
                    </p>
                    <div className="h-px bg-slate-200 my-8"></div>
                    <ul className="space-y-4 text-slate-600 italic">
                        <li>• No compartimos sus datos con terceros bajo ninguna circunstancia.</li>
                        <li>• Usamos infraestructura de Supabase con Row Level Security (RLS) para proteger su información.</li>
                        <li>• Sus datos se usan únicamente para fines de gestión académica personalizada.</li>
                    </ul>
                </div>
                <div className="mt-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Última actualización: 30 de marzo, 2026
                </div>
            </div>
        </div>
    );
};
