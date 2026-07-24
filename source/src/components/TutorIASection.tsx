import React, { useState } from 'react';
import Card from './Card';

interface Msg { role: 'user' | 'model'; text: string; }

const SYSTEM = `Eres un tutor experto en el proceso de Admisión universitaria en Chile (PAES/DEMRE).
Ayudas a estudiantes con dudas sobre postulación, ponderaciones, puntajes de corte, NEM, ranking,
becas, gratuidad y estrategia de postulación. Responde en español, claro y breve, con datos generales
y recordando que las cifras exactas dependen de cada universidad y del proceso oficial DEMRE. No inventes cortes exactos.`;

const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;

export default function TutorIASection() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    if (!API_KEY) { setError('nokey'); return; }
    setInput('');
    setError(null);
    const nextMsgs = [...msgs, { role: 'user' as const, text: q }];
    setMsgs(nextMsgs);
    setLoading(true);
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const historial = nextMsgs.map((m) => `${m.role === 'user' ? 'Estudiante' : 'Tutor'}: ${m.text}`).join('\n');
      const res: any = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${SYSTEM}\n\n${historial}\nTutor:`,
      });
      const text = res?.text ?? res?.response?.text?.() ?? 'No pude generar una respuesta.';
      setMsgs((m) => [...m, { role: 'model', text: String(text) }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: 'model', text: 'Ocurrió un error al consultar la IA. Revisa tu conexión o la API key.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1">TUTOR IA</div>
        <h3 className="text-lg font-bold text-[#0F172A]">Resuelve tus dudas de admisión</h3>
        <p className="text-xs text-[#64748B] mt-1">Pregunta sobre ponderaciones, becas, gratuidad, estrategia de postulación y más.</p>
      </div>

      {!API_KEY && (
        <div className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-100 rounded-xl px-3 py-2 leading-relaxed">
          ⚙️ El Tutor IA requiere una API key de Google Gemini. Agrega <code className="font-mono bg-amber-100 px-1 rounded">VITE_GEMINI_API_KEY</code> en tu archivo <code className="font-mono bg-amber-100 px-1 rounded">.env</code> y reinicia el servidor para activarlo.
        </div>
      )}

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {msgs.length === 0 && (
          <div className="text-xs text-[#94A3B8] space-y-1.5">
            <div className="font-semibold text-[#64748B]">Ejemplos:</div>
            {['¿Qué es el puntaje ponderado?', '¿Cómo funciona la gratuidad?', '¿Conviene rendir M2?'].map((s) => (
              <button key={s} onClick={() => setInput(s)} className="block text-left text-[#3B82F6] hover:underline">• {s}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#3B82F6] text-white rounded-br-md' : 'bg-[#F1F5F9] text-[#0F172A] rounded-bl-md'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-[#94A3B8] animate-pulse">El tutor está escribiendo…</div>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Escribe tu pregunta..."
          className="flex-1 h-11 px-4 bg-[#F5F7FA] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]"
        />
        <button onClick={send} disabled={loading} className="px-4 h-11 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
          Enviar
        </button>
      </div>
      <p className="text-[10px] text-[#94A3B8]">Respuestas generadas por IA; pueden contener errores. Verifica siempre en fuentes oficiales (DEMRE y cada universidad).</p>
    </Card>
  );
}
