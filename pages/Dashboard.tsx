import React, { useEffect, useState } from 'react';
import { User, Project, ReviewSession } from '../types';
import { db } from '../services/db';
import { Plus, Code, ArrowRight, TrendingUp, AlertTriangle, Shield, Zap, Activity, Cpu, Layers, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';

interface DashboardProps {
  user: User;
  onNavigate: (page: string, params?: any) => void;
  onCreateProject: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onCreateProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    issuesResolved: 0,
    avgScore: 0,
    recentActivity: [] as ReviewSession[]
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const userProjects = await db.getProjects(user.id);
      setProjects(userProjects);

      // Aggregate Real Stats
      let totalReviews = 0;
      let issuesResolved = 0; // Mock calculation based on score improvement or status
      let totalScore = 0;
      let scoreCount = 0;
      let allSessions: ReviewSession[] = [];

      for (const p of userProjects) {
        const sessions = await db.getSessions(p.id);
        totalReviews += sessions.length;
        allSessions = [...allSessions, ...sessions];
        
        sessions.forEach(s => {
          if (s.qualityScore) {
            totalScore += s.qualityScore;
            scoreCount++;
          }
          if (s.status === 'resolved') {
            issuesResolved++;
          }
        });
      }

      setStats({
        totalReviews,
        issuesResolved,
        avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
        recentActivity: allSessions.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)
      });

      setLoading(false);
    };

    fetchData();
  }, [user.id]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-fade-in text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 tracking-tight">
            Command Center
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            <span className="text-brand-400">User:</span> {user.name} <span className="text-slate-600">|</span> <span className="text-brand-400">Status:</span> Online
          </p>
        </div>
        <div className="flex gap-4">
          <Button 
            className="shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transition-shadow border border-brand-400/50"
            icon={<Plus size={18} />} 
            onClick={onCreateProject}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label="Total Analysis Runs" 
          value={stats.totalReviews} 
          icon={<Activity size={24} />} 
          color="blue"
          trend="+12%"
        />
        <StatsCard 
          label="Issues Solved" 
          value={stats.issuesResolved} 
          icon={<CheckCircle size={24} />} 
          color="green"
          suffix="Sessions"
        />
        <StatsCard 
          label="Avg Code Health" 
          value={stats.avgScore} 
          icon={<Shield size={24} />} 
          color={stats.avgScore > 80 ? 'green' : stats.avgScore > 50 ? 'yellow' : 'red'}
          suffix="/ 100"
        />
        <StatsCard 
          label="Active Projects" 
          value={projects.length} 
          icon={<Layers size={24} />} 
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Projects List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Cpu size={20} className="text-brand-400" /> Active Repositories
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1,2].map(i => <div key={i} className="h-40 bg-slate-900/50 rounded-2xl animate-pulse border border-white/5"></div>)
            ) : projects.length === 0 ? (
               <div className="col-span-2 py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 flex flex-col items-center justify-center text-slate-500">
                 <p className="mb-4">No projects initialized.</p>
                 <Button onClick={onCreateProject} variant="secondary">Initialize Repository</Button>
               </div>
            ) : (
              projects.map(p => (
                <div 
                  key={p.id} 
                  className="group relative bg-slate-900/40 backdrop-blur-sm border border-white/5 hover:border-brand-500/30 rounded-2xl p-6 transition-all cursor-pointer overflow-hidden"
                  onClick={() => onNavigate('projects', { projectId: p.id })}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-transparent to-transparent group-hover:from-brand-500/5 transition-all"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 bg-slate-950 rounded-xl border border-white/5 group-hover:border-brand-500/30 transition-colors">
                      <Code size={20} className="text-slate-400 group-hover:text-brand-400" />
                    </div>
                    <ArrowRight size={18} className="text-slate-600 group-hover:text-white -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                  </div>
                  
                  <h3 className="font-bold text-lg text-white mb-2 relative z-10">{p.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                    {p.techStack.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] uppercase font-bold tracking-wider bg-slate-800/50 text-slate-400 px-2 py-1 rounded border border-white/5">{t}</span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 relative z-10 font-mono">
                    <span>{p.stats.totalReviews} Scans</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span>Updated {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
            
            {/* New Project Card */}
            <button 
              onClick={onCreateProject}
              className="border border-slate-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group"
            >
              <div className="p-4 bg-slate-900 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <span className="font-medium">Initialize New Project</span>
            </button>
          </div>
        </div>

        {/* Right: Activity Feed & Chart */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 h-full flex flex-col">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-400" /> System Activity
            </h3>
            
            <div className="flex-1 relative min-h-[200px] mb-6">
              {/* Simulated Chart */}
              <div className="absolute inset-0 flex items-end justify-between px-2 gap-2">
                {[35, 45, 30, 60, 55, 70, 65, 80].map((h, i) => (
                   <motion.div 
                     key={i}
                     initial={{ height: 0 }}
                     animate={{ height: `${h}%` }}
                     transition={{ delay: i * 0.1, duration: 0.8 }}
                     className="w-full bg-gradient-to-t from-brand-500/20 to-brand-400/60 rounded-t-sm"
                   />
                ))}
              </div>
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full h-px bg-white/5"></div>
                <div className="w-full h-px bg-white/5"></div>
                <div className="w-full h-px bg-white/5"></div>
                <div className="w-full h-px bg-white/5"></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent Scans</h4>
              {stats.recentActivity.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">No recent activity</div>
              ) : (
                stats.recentActivity.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${s.qualityScore && s.qualityScore > 70 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`}></div>
                      <span className="text-slate-300 truncate max-w-[120px]">{s.title}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-500">{new Date(s.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, icon, color, trend, suffix }: any) => {
  const colors: any = {
    blue: "text-brand-400 bg-brand-500/10 border-brand-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20"
  };

  return (
    <div className={`bg-slate-900/40 backdrop-blur-sm border ${colors[color].split(' ')[2]} rounded-2xl p-6 relative overflow-hidden group hover:bg-slate-900/60 transition-colors`}>
      <div className={`absolute top-0 right-0 p-4 opacity-50 ${colors[color].split(' ')[0]}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{label}</div>
        <div className="flex items-end gap-2">
           <div className="text-3xl font-bold text-white tracking-tight">{value} <span className="text-lg text-slate-500 font-normal">{suffix}</span></div>
           {trend && <div className="text-xs font-medium text-green-400 mb-1.5">{trend}</div>}
        </div>
      </div>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${colors[color].split(' ')[1].replace('/10', '/30')}`}></div>
    </div>
  );
};