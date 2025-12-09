
import React, { useEffect, useState, useRef } from 'react';
import { Project, ReviewSession, Comment, User, Severity } from '../types';
import { db } from '../services/db';
import { gemini } from '../services/gemini';
import { Button } from '../components/ui/Button';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Play, Loader2, Save, FileDiff, ArrowLeft, AlertCircle, Upload, Check, Copy, RefreshCw, Trash2, CheckCircle2, Trophy, Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewWorkspaceProps {
  user: User;
  projectId?: string;
  sessionId?: string;
  onNavigate: (page: string) => void;
}

export const ReviewWorkspace: React.FC<ReviewWorkspaceProps> = ({ user, projectId, sessionId, onNavigate }) => {
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [code, setCode] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'review' | 'diff'>('edit');
  const [refactoredCode, setRefactoredCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [qualityScore, setQualityScore] = useState<number>(0);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing session or setup new one
  useEffect(() => {
    const init = async () => {
      try {
        if (sessionId) {
          // Mode: Loading existing session
          const s = await db.getSession(sessionId);
          if (s) {
            setSession(s);
            setCode(s.code);
            const c = await db.getComments(s.id);
            setComments(c);
            
            // If session is resolved/high score, we might want to show success
            if (s.qualityScore === 100 && c.length === 0) {
               setShowSuccessModal(true);
            }

            setQualityScore(s.qualityScore || 0);
            
            const ps = await db.getProjects(user.id);
            const p = ps.find(proj => proj.id === s.projectId);
            setProject(p || null);
          }
        } else if (projectId) {
          // Mode: New Session in a Project
          const ps = await db.getProjects(user.id);
          const p = ps.find(proj => proj.id === projectId);
          if (p) {
            setProject(p);
            // Default placeholder
            setCode(`// ${p.name} - New Snippet\n// Paste your code here to analyze...\n\nfunction processData(input) {\n  // TODO: Implement logic\n  return input;\n}`);
          }
        }
      } catch (err) {
        console.error("Failed to initialize workspace", err);
        setError("Failed to load session data");
      }
    };
    init();
  }, [sessionId, projectId, user.id]);

  // Handle Code Change: Clear stale comments/analysis immediately
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (comments.length > 0 || showSuccessModal || refactoredCode) {
      setComments([]); // Clear errors immediately on edit
      setRefactoredCode(null); // Clear old fix
      setShowSuccessModal(false); // Hide success modal if user starts typing again
      setQualityScore(0);
      setIsApplied(false);
    }
  };

  const handleClearCode = () => {
    setCode('');
    setComments([]);
    setRefactoredCode(null);
    setError(null);
    setShowSuccessModal(false);
    setQualityScore(0);
    setActiveTab('edit'); // Always switch back to editor to allow typing
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleCodeChange(content);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError("Please enter some code to analyze.");
      return;
    }
    if (!project) {
      setError("Project context is missing. Please restart the session.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setComments([]); // Clear previous results before starting
    setShowSuccessModal(false);

    try {
      // 1. Create session object if it doesn't exist yet
      let currentSession = session;
      if (!currentSession) {
        const newSession: ReviewSession = {
          id: crypto.randomUUID(),
          projectId: project.id,
          userId: user.id,
          title: `Review ${new Date().toLocaleTimeString()}`,
          code: code,
          language: 'typescript', // Detection would happen in AI service
          status: 'in_progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.createSession(newSession);
        currentSession = newSession;
        setSession(newSession);
      } else {
        // Update existing code
        await db.updateSession(currentSession.id, { code });
      }

      // 2. Call Gemini API
      const result = await gemini.analyze(code, user.preferences, project.styleGuide);

      // 3. Process Results
      const newComments: Comment[] = result.comments.map(c => ({
        id: crypto.randomUUID(),
        sessionId: currentSession!.id,
        lineNumber: c.lineNumber,
        severity: c.severity as Severity,
        category: c.category as any,
        content: c.content,
        suggestion: c.suggestion,
        isResolved: false
      }));

      // 4. Update State
      setComments(newComments);
      setQualityScore(result.score);
      setRefactoredCode(result.refactoredCode || null);
      
      // 5. Check for Perfection (Success Modal)
      const isPerfect = result.score === 100 || newComments.length === 0;

      if (isPerfect) {
        setShowSuccessModal(true);
        setActiveTab('edit');
      } else {
        // Keep user on their current tab or switch? 
        // Better to stay on Edit or show Review? 
        // Let's default to Review if they are on edit
        if (activeTab === 'edit') setActiveTab('review');
      }

      // 6. Save to DB
      await db.saveComments(newComments);
      await db.updateSession(currentSession.id, {
        language: result.language,
        summary: result.summary,
        qualityScore: result.score,
        status: isPerfect ? 'resolved' : 'open',
        updatedAt: new Date().toISOString(),
        issueCount: newComments.length
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFix = async () => {
    if (!refactoredCode || !session) return;
    
    // Apply the code
    setCode(refactoredCode);
    
    // Clear issues locally
    setComments([]);
    setRefactoredCode(null);
    setQualityScore(100);
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 3000);
    
    // Switch to edit tab
    setActiveTab('edit');

    // Update DB
    await db.updateSession(session.id, {
      code: refactoredCode,
      status: 'resolved',
      qualityScore: 100,
      issueCount: 0,
      updatedAt: new Date().toISOString()
    });
    
    // Also clear comments in DB (optional, or mark resolved)
    await db.saveComments([]); // Clearing them implies they are fixed
    
    // Show success modal to confirm everything is clean
    setShowSuccessModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeTab === 'diff' ? (refactoredCode || '') : code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Determine if sidebar should be visible
  // Show if: analyzing, or (has results AND (tab is review/diff OR explicitly showing it))
  // For simplicity, we show sidebar if we have comments OR refactored code, regardless of tab,
  // unless user manually collapsed it (future feature).
  const showSidebar = comments.length > 0 || !!refactoredCode;

  return (
    <div className="h-full flex flex-col bg-slate-950 relative">
      {/* Navigation Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 shrink-0 backdrop-blur-sm z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('projects')}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              {project?.name || 'Loading...'}
              <span className="text-slate-600">/</span>
              <span className="text-brand-400">{session?.title || 'New Review'}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toolbar Actions */}
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 mr-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors relative"
              title="Upload File"
            >
              {uploadSuccess ? <Check size={18} className="text-green-400" /> : <Upload size={18} />}
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileUpload} 
                accept=".js,.ts,.py,.java,.go,.rs,.cpp,.c,.html,.css,.json"
              />
            </button>
            <div className="w-px h-4 bg-slate-800 mx-1"></div>
            <button 
              onClick={handleClearCode}
              className="p-2 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors"
              title="Clear Editor"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <Button 
            variant="primary" 
            isLoading={isAnalyzing} 
            onClick={handleAnalyze}
            icon={<Play size={16} fill="currentColor" />}
          >
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex">
        
        {/* Left Pane: Code Editor */}
        <div className={clsx(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          showSidebar ? "lg:w-2/3" : "w-full"
        )}>
          {/* Tabs */}
          <div className="flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/30">
            <div className="flex">
              <button
                onClick={() => setActiveTab('edit')}
                className={clsx(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'edit' ? "border-brand-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                Editor
              </button>
              {comments.length > 0 && (
                <button
                  onClick={() => setActiveTab('review')}
                  className={clsx(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                    activeTab === 'review' ? "border-brand-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"
                  )}
                >
                  <AlertCircle size={14} /> Review Issues
                </button>
              )}
              {refactoredCode && (
                <button
                  onClick={() => setActiveTab('diff')}
                  className={clsx(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                    activeTab === 'diff' ? "border-brand-500 text-brand-400" : "border-transparent text-slate-500 hover:text-slate-300"
                  )}
                >
                  <FileDiff size={14} /> Fix & Diff
                </button>
              )}
            </div>
            
            <button 
              onClick={copyToClipboard}
              className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              {isCopied ? 'Copied' : 'Copy Code'}
            </button>
          </div>

          <div className="flex-1 relative bg-slate-950 overflow-hidden">
            {activeTab === 'edit' && (
              <textarea 
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full h-full bg-slate-950 text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none"
                spellCheck={false}
                placeholder="// Start typing or paste code here..."
              />
            )}

            {activeTab === 'review' && (
              <div className="h-full overflow-auto custom-scrollbar">
                <CodeBlock 
                  code={code} 
                  comments={comments} 
                />
              </div>
            )}

            {activeTab === 'diff' && refactoredCode && (
              <div className="h-full flex flex-col">
                 <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800">
                    <div className="overflow-auto bg-red-500/5">
                      <div className="sticky top-0 bg-slate-900/90 backdrop-blur px-3 py-1 text-xs text-red-400 font-mono border-b border-red-500/20">Original</div>
                      <div className="p-4 text-sm font-mono text-slate-400 whitespace-pre opacity-70">{code}</div>
                    </div>
                    <div className="overflow-auto bg-green-500/5">
                      <div className="sticky top-0 bg-slate-900/90 backdrop-blur px-3 py-1 text-xs text-green-400 font-mono border-b border-green-500/20">Proposed Fix</div>
                      <div className="p-4 text-sm font-mono text-slate-300 whitespace-pre">{refactoredCode}</div>
                    </div>
                 </div>
                 <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                   <Button variant="ghost" onClick={() => setActiveTab('review')}>Cancel</Button>
                   <Button 
                     onClick={handleApplyFix}
                     icon={isApplied ? <CheckCircle2 size={16} /> : <RefreshCw size={16} />}
                     className={isApplied ? "bg-green-600 hover:bg-green-500" : ""}
                   >
                     {isApplied ? 'Applied Successfully' : 'Apply Fix to Editor'}
                   </Button>
                 </div>
              </div>
            )}
            
            {/* Success Modal Overlay */}
            <AnimatePresence>
              {showSuccessModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    className="bg-slate-900 border border-brand-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(14,165,233,0.2)] text-center max-w-md mx-4 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 to-transparent pointer-events-none"></div>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full text-green-400 mb-6 relative z-10">
                      <Trophy size={40} className="drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-dashed border-green-500/30 rounded-full" 
                      />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Excellent Code!</h2>
                    <p className="text-slate-400 mb-6 relative z-10">
                      The analysis found 0 issues. Your code is clean, secure, and optimized. Keep up the great work!
                    </p>
                    <Button 
                      onClick={() => setShowSuccessModal(false)}
                      className="w-full relative z-10"
                    >
                      Continue Editing
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Right Pane: Issues List & AI Actions */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '33.333333%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-slate-800 bg-slate-900/30 flex flex-col hidden lg:flex"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-semibold text-slate-200">Analysis Results</h3>
                <span className={clsx(
                  "px-2 py-0.5 rounded text-xs font-bold",
                  qualityScore >= 80 ? "bg-green-500/10 text-green-400" :
                  qualityScore >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-red-500/10 text-red-400"
                )}>
                  Score: {qualityScore}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* AI Fix Card - Visible if Fix is Available */}
                {refactoredCode && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.1)] relative overflow-hidden"
                  >
                     <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/20 blur-2xl rounded-full pointer-events-none"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-brand-400 font-bold text-sm">
                           <Sparkles size={16} className="animate-pulse-slow" /> AI Optimization Ready
                        </div>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                           The AI has generated a fixed version of this code resolving {comments.length} detected issues.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                           <Button 
                             size="sm" 
                             variant="secondary" 
                             onClick={() => setActiveTab('diff')}
                             className="text-xs"
                           >
                              Preview Diff
                           </Button>
                           <Button 
                             size="sm" 
                             onClick={handleApplyFix}
                             icon={<CheckCircle2 size={14} />}
                             className="text-xs bg-brand-600 hover:bg-brand-500"
                           >
                              Apply Fix Now
                           </Button>
                        </div>
                     </div>
                  </motion.div>
                )}

                {/* Issue List */}
                <div className="space-y-3">
                  {comments.map((comment, idx) => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-brand-500/30 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-2">
                         <span className={clsx("w-2 h-2 rounded-full", 
                           comment.severity === 'critical' ? "bg-red-500" :
                           comment.severity === 'major' ? "bg-orange-500" : "bg-blue-500"
                         )} />
                         <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">{comment.category}</span>
                         <span className="ml-auto text-xs text-slate-600 font-mono">Line {comment.lineNumber}</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-3">{comment.content}</p>
                      {comment.suggestion && (
                        <div className="bg-slate-950/50 p-2 rounded border border-white/5 text-xs font-mono text-green-400 overflow-x-auto">
                          {comment.suggestion}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-xl text-sm animate-slide-up flex items-center gap-2 backdrop-blur z-50">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
};
