import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../types';
import { StorageService } from '../services/storageService';
import { Clock, FileCode, ChevronRight, Search, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await StorageService.getHistory();
    setHistory(data);
    setLoading(false);
  };

  const handleClear = async () => {
    if(confirm('Are you sure you want to clear all history?')) {
      await StorageService.clearHistory();
      setHistory([]);
    }
  };

  const filteredHistory = history.filter(item => 
    item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.result.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-white">Review History</h1>
           <p className="text-slate-400">Archive of previous code analyses</p>
        </div>
        <button 
          onClick={handleClear}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <Trash2 size={16} /> Clear History
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Search by filename or summary..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-900/50 rounded-xl shimmer animate-pulse"></div>)}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Clock size={48} className="mb-4 opacity-20" />
            <p>No history found</p>
          </div>
        ) : (
          <div className="space-y-3">
             <AnimatePresence>
               {filteredHistory.map((item, index) => (
                 <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, height: 0 }}
                   transition={{ delay: index * 0.05 }}
                   className="group bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-brand-500/30 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-brand-500/5"
                 >
                   <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                           item.score >= 80 ? 'bg-green-500/10 text-green-400' : 
                           item.score >= 50 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          <FileCode size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors">{item.fileName || 'Untitled Snippet'}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{item.language}</span>
                            <span>•</span>
                            <span className={`${
                               item.score >= 80 ? 'text-green-400' : 
                               item.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>Score: {item.score}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};