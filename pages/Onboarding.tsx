import React, { useState } from 'react';
import { User, UserPreferences } from '../types';
import { Button } from '../components/ui/Button';
import { Check, Code2 } from 'lucide-react';

interface OnboardingProps {
  user: User;
  onComplete: (prefs: UserPreferences) => Promise<void> | void;
}

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 
  'React', 'Vue', 'Angular', 'C#', '.NET', 'PHP', 'Ruby', 'Swift', 
  'Kotlin', 'Dart', 'Scala', 'Elixir', 'Haskell', 'SQL', 'Terraform'
];

export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [langs, setLangs] = useState<string[]>([]);
  const [style, setStyle] = useState<'strict' | 'balanced' | 'relaxed'>('balanced');
  const [isSaving, setIsSaving] = useState(false);

  const toggleLang = (l: string) => {
    setLangs(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    await onComplete({
      onboardingCompleted: true,
      primaryLanguages: langs,
      preferredStyle: style,
      theme: 'dark'
    });
  };

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4 selection:bg-brand-500/30">
      <div className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
           <div 
             className="h-full bg-brand-500 transition-all duration-500" 
             style={{ width: step === 1 ? '50%' : '100%' }}
           ></div>
        </div>

        <div className="mb-8 text-center pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 mb-4 border border-brand-500/20">
             <Code2 size={24} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Configure Your Assistant</h1>
          <p className="text-slate-400">Personalize CodePilot AI to match your workflow.</p>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-4 uppercase tracking-wider text-center">Select Primary Tech Stack</label>
              <div className="flex flex-wrap justify-center gap-3">
                {LANGUAGES.map(l => (
                  <button
                    key={l}
                    onClick={() => toggleLang(l)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                      langs.includes(l) 
                        ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-8">
              <Button onClick={() => setStep(2)} disabled={langs.length === 0} className="w-full md:w-auto">Next Step</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-4 uppercase tracking-wider text-center">Review Intensity Level</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'relaxed', label: 'Relaxed', desc: 'Minimal noise. Focus only on critical bugs and major flaws.' },
                  { id: 'balanced', label: 'Balanced', desc: 'The gold standard. Checks logic, style, and performance.' },
                  { id: 'strict', label: 'Strict', desc: 'No mercy. Pedantic checks for typing, complexity, and security.' },
                ].map((opt) => (
                  <div 
                    key={opt.id}
                    onClick={() => setStyle(opt.id as any)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      style === opt.id 
                        ? 'bg-brand-500/10 border-brand-500 ring-1 ring-brand-500 shadow-[0_0_20px_rgba(14,165,233,0.1)]' 
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-white mb-2 flex justify-between items-center text-lg">
                      {opt.label}
                      {style === opt.id && <Check size={18} className="text-brand-400" />}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-8 gap-4">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={isSaving}>Back</Button>
              <Button onClick={handleFinish} isLoading={isSaving} className="flex-1">Complete Setup</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};