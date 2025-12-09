import { User, Project, ReviewSession, Comment } from '../types';

// Keys for LocalStorage
const K = {
  USERS: 'cr_users',
  PROJECTS: 'cr_projects',
  SESSIONS: 'cr_sessions',
  COMMENTS: 'cr_comments',
};

// Helper to simulate network latency
// DRASTICALLY REDUCED LATENCY for faster feel (default 50ms instead of 300ms)
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

class DatabaseService {
  // --- Generic Helpers ---
  private getTable<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveTable<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Users ---
  async getUser(id: string): Promise<User | null> {
    await delay(20);
    const users = this.getTable<User>(K.USERS);
    return users.find(u => u.id === id) || null;
  }

  async updateUser(user: User): Promise<void> {
    await delay(20);
    const users = this.getTable<User>(K.USERS);
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.saveTable(K.USERS, users);
  }

  // --- Projects ---
  async getProjects(userId: string): Promise<Project[]> {
    await delay(50);
    const projects = this.getTable<Project>(K.PROJECTS);
    return projects.filter(p => p.ownerId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createProject(project: Project): Promise<void> {
    await delay(50);
    const projects = this.getTable<Project>(K.PROJECTS);
    projects.push(project);
    this.saveTable(K.PROJECTS, projects);
  }

  // --- Sessions ---
  async getSessions(projectId: string): Promise<ReviewSession[]> {
    await delay(30);
    const sessions = this.getTable<ReviewSession>(K.SESSIONS);
    return sessions.filter(s => s.projectId === projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createSession(session: ReviewSession): Promise<void> {
    await delay(50); 
    const sessions = this.getTable<ReviewSession>(K.SESSIONS);
    sessions.push(session);
    this.saveTable(K.SESSIONS, sessions);
    
    // Update project stats (mock)
    const projects = this.getTable<Project>(K.PROJECTS);
    const pIdx = projects.findIndex(p => p.id === session.projectId);
    if (pIdx >= 0) {
      projects[pIdx].stats.totalReviews++;
      this.saveTable(K.PROJECTS, projects);
    }
  }

  async getSession(id: string): Promise<ReviewSession | null> {
    await delay(20);
    const sessions = this.getTable<ReviewSession>(K.SESSIONS);
    return sessions.find(s => s.id === id) || null;
  }

  async updateSession(id: string, updates: Partial<ReviewSession>): Promise<void> {
    await delay(30);
    const sessions = this.getTable<ReviewSession>(K.SESSIONS);
    const idx = sessions.findIndex(s => s.id === id);
    if (idx >= 0) {
      // Merge updates
      sessions[idx] = { ...sessions[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveTable(K.SESSIONS, sessions);
    }
  }

  // --- Comments ---
  async getComments(sessionId: string): Promise<Comment[]> {
    await delay(20);
    const comments = this.getTable<Comment>(K.COMMENTS);
    return comments.filter(c => c.sessionId === sessionId).sort((a, b) => a.lineNumber - b.lineNumber);
  }

  async saveComments(newComments: Comment[]): Promise<void> {
    await delay(30);
    const comments = this.getTable<Comment>(K.COMMENTS);
    
    // Remove old comments for this session first to avoid duplicates if re-analyzing
    const filtered = comments.filter(c => c.sessionId !== newComments[0]?.sessionId);
    
    this.saveTable(K.COMMENTS, [...filtered, ...newComments]);
  }

  async updateComment(commentId: string, updates: Partial<Comment>): Promise<void> {
    const comments = this.getTable<Comment>(K.COMMENTS);
    const idx = comments.findIndex(c => c.id === commentId);
    if (idx >= 0) {
      comments[idx] = { ...comments[idx], ...updates };
      this.saveTable(K.COMMENTS, comments);
    }
  }
}

export const db = new DatabaseService();