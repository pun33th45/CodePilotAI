import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CodeViewerProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ 
  code, 
  language = 'javascript', 
  className,
  showLineNumbers = true 
}) => {
  const lines = code.split('\n');

  return (
    <div className={twMerge("font-mono text-sm leading-6 relative", className)}>
      <div className="flex min-w-full">
        {showLineNumbers && (
          <div className="flex-none w-10 py-4 pr-3 text-right text-slate-600 select-none bg-slate-900/30 border-r border-white/5">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-x-auto py-4 pl-4 text-slate-300">
          {lines.map((line, i) => (
             <div key={i} className="whitespace-pre">
               {/* Basic syntax coloring simulation for visual appeal since we don't have a full lexer */}
               {line.split(/(\s+)/).map((token, idx) => {
                 if (token.match(/^(import|export|const|let|var|function|return|if|else|for|while|class|interface|type)$/)) return <span key={idx} className="text-purple-400">{token}</span>;
                 if (token.match(/^(true|false|null|undefined)$/)) return <span key={idx} className="text-orange-400">{token}</span>;
                 if (token.match(/^(['"`]).*\1$/)) return <span key={idx} className="text-green-400">{token}</span>;
                 if (token.match(/^\d+$/)) return <span key={idx} className="text-blue-400">{token}</span>;
                 if (token.match(/\/\/.*/)) return <span key={idx} className="text-slate-500 italic">{token}</span>;
                 if (token.match(/[A-Z][a-zA-Z0-9]*/)) return <span key={idx} className="text-yellow-200">{token}</span>; // Likely types/classes
                 if (token.match(/[\{\}\(\)\[\]]/)) return <span key={idx} className="text-brand-300">{token}</span>;
                 return <span key={idx} className="text-slate-300">{token}</span>;
               })}
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};