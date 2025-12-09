import React, { useEffect, useState } from 'react';
import { Project, ReviewSession } from '../types';
import { db } from '../services/db';
import { Button } from '../components/ui/Button';
import { Plus, FileCode, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectsProps {
  user: React.ComponentProps<any>['user'];
  initialProjectId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ user, initialProjectId, onNavigate }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<ReviewSession[]>([]);

  useEffect(() => {
    const load = async () => {
      const ps = await db.getProjects(user.id);
      setProjects(ps);
      if (initialProjectId) {
        const found = ps.find(p => p.id === initialProjectId);
        if (found) selectProject(found);
      } else if (ps.length > 0) {
        selectProject(ps[0]); // Default to first
      }
    };
    load();
  }, [user.id, initialProjectId]);

  const selectProject = async (p: Project) => {
    setSelectedProject(p);
    const s = await db.getSessions(p.id);
    setSessions(s);
  };

  const handleNewSession = () => {
    if (selectedProject) {
      onNavigate('review', { projectId: selectedProject.id });
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Project List Sidebar */}
      <div className="w-full md:w-72 bg-slate-900/30 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
           <h2 className="font-bold text-white text-sm uppercase tracking-wider">Your Projects</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => selectProject(p)}
              className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors ${
                selectedProject?.id === p.id 
                  ? 'bg-brand-500/10 text-brand-400 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {selectedProject ? (
          <>
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-white">{selectedProject.name}</h1>
                <div className="flex gap-2 mt-2">
                  {selectedProject.techStack.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded bg-slate-900 text-xs text-slate-400 border border-slate-800">{t}</span>
                  ))}
                </div>
              </div>
              <Button icon={<Plus size={16} />} onClick={handleNewSession}>New Review Session</Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Review History</h3>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No review sessions yet.</div>
                ) : (
                  sessions.map(session => (
                    <div 
                      key={session.id}
                      onClick={() => onNavigate('review', { sessionId: session.id })}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900 hover:border-brand-500/30 transition-all cursor-pointer"
                    >
                      <div className={`p-3 rounded-lg ${
                        session.status === 'resolved' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        <FileCode size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-200 truncate group-hover:text-brand-300 transition-colors">{session.title || 'Untitled Session'}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <Clock size={12} /> {formatDistanceToNow(new Date(session.updatedAt))} ago
                          <span>•</span>
                          {session.language}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {session.qualityScore && (
                          <div className={`text-sm font-bold ${
                            session.qualityScore > 80 ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            Score: {session.qualityScore}
                          </div>
                        )}
                        <ChevronRight size={18} className="text-slate-600 group-hover:text-white" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a project to view details
          </div>
        )}
      </div>
    </div>
  );
};
