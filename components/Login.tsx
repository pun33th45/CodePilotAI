import React, { useState } from 'react';
import { Code2, ArrowRight, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { auth } from '../services/auth';

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Mock password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await auth.register(name, email);
      } else {
        await auth.login(email);
      }
      // Pass email up to App state
      onLogin(email);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-brand-500/30">
      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,27,0.8)_2px,transparent_2px),linear-gradient(90deg,rgba(18,18,27,0.8)_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>
      
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-500/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-500">
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 rounded-full"></div>
          <div className="relative inline-flex items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-white/10 mb-6 shadow-xl shadow-brand-500/20 group">
            <Code2 size={32} className="text-brand-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            CodePilot <span className="text-brand-400">AI</span>
          </h1>
          <p className="text-slate-400 text-sm">Next-Gen Automated Code Intelligence</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium animate-slide-up">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div className="animate-slide-up">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div className={isRegistering ? "animate-slide-up" : ""}>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
              placeholder="dev@codepilot.ai"
            />
          </div>
          
          <div className={isRegistering ? "animate-slide-up" : ""}>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full py-4 mt-4 rounded-xl font-bold tracking-wide" isLoading={isLoading}>
            {isRegistering ? 'Create Account' : 'Initialize Session'} <ArrowRight size={18} />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5">
          <button 
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
          >
            {isRegistering ? <LogIn size={16} /> : <UserPlus size={16} />}
            {isRegistering ? 'Already have an account? Sign In' : 'New User? Create Account'}
            <Sparkles size={14} className="text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
};