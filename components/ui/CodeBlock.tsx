import React from 'react';
import { Comment } from '../../types';
import { AlertTriangle, Shield, Zap, Info, Bug, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface CodeBlockProps {
  code: string;
  comments: Comment[];
  onCommentClick?: (comment: Comment) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, comments, onCommentClick }) => {
  const lines = code.split('\n');

  const getCommentsForLine = (lineNum: number) => 
    comments.filter(c => c.lineNumber === lineNum);

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'major': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'minor': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getIcon = (category: string) => {
    switch(category) {
      case 'security': return <Shield size={14} />;
      case 'performance': return <Zap size={14} />;
      case 'bug': return <Bug size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="font-mono text-sm leading-6 bg-slate-950 min-h-full">
      {lines.map((line, i) => {
        const lineNum = i + 1;
        const lineComments = getCommentsForLine(lineNum);
        const hasCritical = lineComments.some(c => c.severity === 'critical');

        return (
          <div key={i} className="group relative">
            {/* Line Content */}
            <div className={clsx(
              "flex code-line-hover transition-colors duration-150",
              hasCritical && "bg-red-500/5"
            )}>
              <div className="flex-none w-12 text-right pr-4 py-0.5 text-slate-600 select-none border-r border-white/5 text-xs bg-slate-900/30">
                {lineNum}
              </div>
              <div className="flex-1 pl-4 py-0.5 whitespace-pre text-slate-300 overflow-x-auto">
                 {/* Simple Syntax Highlighting */}
                 {line.split(/(\s+|[{}(),;])/).map((token, idx) => {
                    if (token.match(/^(const|let|var|function|return|import|export|if|else)$/)) return <span key={idx} className="text-purple-400">{token}</span>;
                    if (token.match(/^(['"`]).*\1$/)) return <span key={idx} className="text-green-400">{token}</span>;
                    if (token.match(/^[A-Z][a-zA-Z0-9]*$/)) return <span key={idx} className="text-yellow-200">{token}</span>;
                    if (token.match(/\/\/.*/)) return <span key={idx} className="text-slate-500 italic">{token}</span>;
                    return <span key={idx}>{token}</span>;
                 })}
              </div>
            </div>

            {/* Inline Annotations */}
            {lineComments.length > 0 && (
              <div className="pl-12 pr-4 py-2 bg-slate-900/50 border-y border-white/5">
                <div className="space-y-2">
                  {lineComments.map(comment => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={clsx(
                        "rounded-lg p-3 border text-sm flex gap-3 cursor-pointer hover:brightness-110 transition-all",
                        getSeverityColor(comment.severity)
                      )}
                      onClick={() => onCommentClick?.(comment)}
                    >
                      <div className="mt-0.5 shrink-0">{getIcon(comment.category)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold uppercase text-[10px] tracking-wider opacity-80">{comment.category} • {comment.severity}</span>
                        </div>
                        <p>{comment.content}</p>
                        {comment.suggestion && (
                          <div className="mt-2 bg-slate-950/50 p-2 rounded font-mono text-xs border border-white/5">
                            <span className="text-green-400">+ {comment.suggestion}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
