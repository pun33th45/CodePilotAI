import React, { useState, useCallback, useEffect } from 'react';
import { Play, Copy, Check, AlertTriangle, Bug, Sparkles, FileDiff, Code, Maximize2, Download } from 'lucide-react';
import { Button } from './Button';
import { analyzeCode } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { AnalysisResult, ViewState, AppSettings } from '../types';
import { CodeViewer } from './CodeViewer';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export const ReviewPage: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState('snippet.js');
  const [viewState, setViewState] = useState<ViewState>(ViewState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'diff' | 'raw'>('editor');
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());

  useEffect(() => {
    // Load default placeholder if empty
    if (!code) {
      setCode(`// Paste your code here to analyze...

function calculateTotal(items) {
  let total = 0;
  for(let i=0; i<items.length; i++) {
    total += items[i].price;
  }
  return total;
}`);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    setViewState(ViewState.ANALYZING);
    try {
      // Get fresh settings
      const currentSettings = StorageService.getSettings();
      setSettings(currentSettings);

      const data = await analyzeCode(code, currentSettings);
      setResult(data);
      
      // Save to history
      await StorageService.saveHistoryItem({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        fileName,
        score: data.score,
        snippet: code.substring(0, 100),
        language: data.language,
        result: data
      });

      setViewState(ViewState.SUCCESS);
      setActiveTab('diff'); // Switch to diff view automatically
    } catch (error) {
      setViewState(ViewState.ERROR);
    }
  };

  const copyToClipboard = useCallback(() => {
    if (result?.correctedCode) {
      navigator.clipboard.writeText(result.correctedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([`# Code Review for ${fileName}\n\n## Summary\n${result.summary}\n\n## Issues\n${result.issues.map(i => `- ${i}`).join('\n')}\n\n## Corrected Code\n\`\`\`${result.language.toLowerCase()}\n${result.correctedCode}\n\`\`\``], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-${fileName}.md`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col max-w-[1600px] mx-auto">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Code Review <Sparkles size={18} className="text-brand-400" />
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <input 
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-transparent border-none text-slate-400 text-sm focus:text-white focus:outline-none focus:ring-0 p-0 hover:underline decoration-slate-600 underline-offset-4"
            />
            <span className="text-slate-600">|</span>
            <span className="text-slate-500 text-xs uppercase tracking-wider">{result?.language || 'Auto-detect'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          {viewState === ViewState.SUCCESS && (
             <Button variant="secondary" onClick={handleDownload} title="Export Report">
                <Download size={16} />
             </Button>
          )}
          <Button 
            variant="secondary" 
            onClick={() => { setCode(''); setResult(null); setViewState(ViewState.IDLE); setActiveTab('editor'); }} 
            disabled={viewState === ViewState.ANALYZING}
          >
            Clear
          </Button>
          <Button 
            onClick={handleAnalyze} 
            isLoading={viewState === ViewState.ANALYZING}
            className="min-w-[140px]"
          >
            <Play size={16} className={viewState === ViewState.ANALYZING ? 'hidden' : ''} /> 
            {viewState === ViewState.ANALYZING ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Panel: Editor / Visualizer */}
        <div className={clsx(
          "flex flex-col bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm shadow-xl transition-all duration-500",
          viewState === ViewState.SUCCESS ? "lg:col-span-8" : "lg:col-span-12"
        )}>
          
          {/* Editor Tabs */}
          <div className="h-12 bg-slate-900 border-b border-white/5 flex items-center px-4 justify-between">
            <div className="flex gap-1 h-full pt-2">
              <button 
                onClick={() => setActiveTab('editor')}
                className={clsx(
                  "px-4 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-2 border-t border-x",
                  activeTab === 'editor' 
                    ? "bg-slate-800 border-white/10 text-white" 
                    : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                <Code size={14} /> Source
              </button>
              {result && (
                <button 
                  onClick={() => setActiveTab('diff')}
                  className={clsx(
                    "px-4 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-2 border-t border-x",
                    activeTab === 'diff' 
                      ? "bg-slate-800 border-white/10 text-brand-400" 
                      : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                  )}
                >
                  <FileDiff size={14} /> Diff / Fix
                </button>
              )}
            </div>
            
            {result && activeTab === 'diff' && (
               <button 
                 onClick={copyToClipboard}
                 className="text-xs flex items-center gap-1.5 text-brand-400 hover:text-white transition-colors"
               >
                 {copied ? <Check size={14} /> : <Copy size={14} />}
                 {copied ? 'Copied' : 'Copy Fixed Code'}
               </button>
            )}
          </div>

          <div className="flex-1 bg-slate-950 relative overflow-hidden group">
             {activeTab === 'editor' && (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full bg-slate-950 p-6 font-mono text-sm text-slate-300 focus:outline-none resize-none placeholder-slate-700 leading-6"
                  spellCheck={false}
                  placeholder="Paste your code here..."
                />
             )}

             {activeTab === 'diff' && result && (
               <div className="absolute inset-0 grid grid-cols-2 divide-x divide-white/5">
                 <div className="overflow-auto bg-red-950/5">
                   <div className="sticky top-0 bg-slate-900/80 backdrop-blur text-xs px-4 py-2 text-red-400 border-b border-white/5 font-mono z-10">Original</div>
                   <CodeViewer code={code} className="p-4 opacity-70" />
                 </div>
                 <div className="overflow-auto bg-green-950/5">
                    <div className="sticky top-0 bg-slate-900/80 backdrop-blur text-xs px-4 py-2 text-green-400 border-b border-white/5 font-mono z-10">Optimized</div>
                    <CodeViewer code={result.correctedCode} className="p-4" />
                 </div>
               </div>
             )}

             {/* Loading Overlay */}
             {viewState === ViewState.ANALYZING && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                   <div className="relative mb-6">
                      <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                      <Code2Loader />
                   </div>
                   <p className="text-brand-400 font-medium animate-pulse">Analyzing logic & structure...</p>
                </div>
             )}
          </div>
        </div>

        {/* Right Panel: Results Analysis */}
        {viewState === ViewState.SUCCESS && result && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar"
          >
            {/* Score Card */}
            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 backdrop-blur-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>
               <h3 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4">Quality Score</h3>
               <div className="flex items-end gap-2">
                 <span className={clsx(
                   "text-6xl font-black tracking-tighter",
                   result.score >= 80 ? "text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-green-600" :
                   result.score >= 50 ? "text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-yellow-600" :
                   "text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-600"
                 )}>
                   {result.score}
                 </span>
                 <span className="text-xl text-slate-600 font-medium mb-2">/ 100</span>
               </div>
               
               <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${result.score}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   className={clsx(
                     "h-full rounded-full",
                     result.score >= 80 ? "bg-green-500" :
                     result.score >= 50 ? "bg-yellow-500" :
                     "bg-red-500"
                   )}
                 />
               </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-3">Executive Summary</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
            </div>

            {/* Issues */}
            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 backdrop-blur-sm flex-1">
              <h3 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4 flex items-center justify-between">
                <span>Critical Issues</span>
                <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold">{result.issues.length}</span>
              </h3>
              <div className="space-y-3">
                {result.issues.map((issue, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-3 items-start p-3 rounded-lg bg-slate-950/50 border border-white/5 hover:border-red-500/30 transition-colors group"
                  >
                    <Bug size={16} className="text-red-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-slate-300">{issue}</span>
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
};

// Fancy Animated Loader
const Code2Loader = () => (
  <svg className="animate-spin text-brand-500" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);