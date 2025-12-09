import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';
import { StorageService } from '../services/storageService';
import { Button } from './Button';
import { Save, UserCog, Palette, Monitor } from 'lucide-react';

interface SettingsPageProps {
  onSettingsChange: (settings: AppSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<AppSettings>({
    persona: 'friendly',
    detailLevel: 'detailed',
    theme: 'dark'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loaded = StorageService.getSettings();
    setSettings(loaded);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await StorageService.saveSettings(settings);
    onSettingsChange(settings);
    setSaving(false);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Customize your CodePilot experience</p>
      </div>

      <div className="space-y-6">
        {/* Persona Section */}
        <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <UserCog size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">AI Persona</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['friendly', 'strict', 'teacher', 'minimalist'].map((p) => (
              <div 
                key={p}
                onClick={() => setSettings({...settings, persona: p as any})}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  settings.persona === p 
                    ? 'bg-brand-500/10 border-brand-500 text-white shadow-lg shadow-brand-500/10' 
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="capitalize font-semibold mb-1">{p}</div>
                <div className="text-xs opacity-70">
                  {p === 'friendly' && 'Constructive and helpful feedback.'}
                  {p === 'strict' && 'No mercy. Focus on perfection.'}
                  {p === 'teacher' && 'Explains concepts for learning.'}
                  {p === 'minimalist' && 'Just the facts. No fluff.'}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detail Level */}
        <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
              <Monitor size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">Response Detail</h2>
          </div>

          <div className="flex gap-4">
             {['detailed', 'brief'].map((l) => (
               <button
                 key={l}
                 onClick={() => setSettings({...settings, detailLevel: l as any})}
                 className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all capitalize ${
                   settings.detailLevel === l 
                     ? 'bg-white text-slate-900 border-white' 
                     : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                 }`}
               >
                 {l}
               </button>
             ))}
          </div>
        </section>

        <div className="flex justify-end pt-4">
           <Button onClick={handleSave} isLoading={saving} className="w-full md:w-auto px-8">
             <Save size={18} /> Save Changes
           </Button>
        </div>
      </div>
    </div>
  );
};