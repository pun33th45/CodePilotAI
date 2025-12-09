import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ReviewWorkspace } from './pages/ReviewWorkspace';
import { Login } from './components/Login';
import { auth } from './services/auth';
import { db } from './services/db';
import { User, Project } from './types';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { Folder } from 'lucide-react';
import { clsx } from 'clsx';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageParams, setPageParams] = useState<any>({});
  
  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  
  // Manual Form
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    const u = auth.getUser();
    if (u) setUser(u);
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string) => {
    const u = await auth.login(email);
    setUser(u);
  };

  const handleLogout = async () => {
    await auth.logout();
    setUser(null);
  };

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const handleCreateProject = async () => {
    if (!user) return;
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: crypto.randomUUID(),
      ownerId: user.id,
      name: newProjectName,
      description: 'New software project',
      techStack: user.preferences.primaryLanguages,
      createdAt: new Date().toISOString(),
      stats: { totalReviews: 0, issuesFixed: 0, securityScore: 100 }
    };

    await db.createProject(newProject);
    
    // Reset Form
    setNewProjectName('');
    setIsProjectModalOpen(false);
    
    // Auto navigate to the new project
    handleNavigate('projects', { projectId: newProject.id });
  };

  if (isLoading) return <div className="h-screen bg-dark-950 text-white flex items-center justify-center">Initializing...</div>;

  if (!user) return <Login onLogin={handleLogin} />;

  if (!user.preferences.onboardingCompleted) {
    return <Onboarding user={user} onComplete={async (prefs) => {
      await auth.updateProfile({ preferences: prefs });
      setUser((prev) => prev ? ({ ...prev, preferences: prefs }) : null);
    }} />;
  }

  return (
    <Layout 
      user={user} 
      currentPage={currentPage} 
      onNavigate={handleNavigate} 
      onLogout={handleLogout}
      onCreateProject={() => {
        setIsProjectModalOpen(true);
      }}
    >
      {currentPage === 'dashboard' && (
        <Dashboard user={user} onNavigate={handleNavigate} onCreateProject={() => {
          setIsProjectModalOpen(true);
        }} />
      )}
      {currentPage === 'projects' && (
        <Projects user={user} onNavigate={handleNavigate} initialProjectId={pageParams.projectId} />
      )}
      {currentPage === 'review' && (
        <ReviewWorkspace 
          user={user} 
          onNavigate={handleNavigate} 
          projectId={pageParams.projectId} 
          sessionId={pageParams.sessionId} 
        />
      )}

      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Create New Project">
         <div className="space-y-4">
           {/* Simple Project Create Form */}
           <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 flex items-center gap-3 mb-2">
              <div className="bg-brand-500/20 p-2 rounded-lg text-brand-400">
                <Folder size={20} />
              </div>
              <div className="text-sm text-slate-400">
                Create a new manual project to start analyzing code snippets or files.
              </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
             <input 
               value={newProjectName}
               onChange={e => setNewProjectName(e.target.value)}
               className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
               placeholder="e.g. Payment Service"
               autoFocus
               onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
             />
           </div>

           <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-4">
             <Button variant="ghost" onClick={() => setIsProjectModalOpen(false)}>Cancel</Button>
             <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
               Create Project
             </Button>
           </div>
         </div>
      </Modal>
    </Layout>
  );
}