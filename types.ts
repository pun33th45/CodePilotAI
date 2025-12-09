export type UserRole = 'owner' | 'member' | 'viewer';
export type ReviewStatus = 'open' | 'in_progress' | 'resolved' | 'archived';
export type Severity = 'critical' | 'major' | 'minor' | 'info';
export type Category = 'security' | 'performance' | 'style' | 'bug' | 'refactor';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface UserPreferences {
  onboardingCompleted: boolean;
  primaryLanguages: string[];
  preferredStyle: 'strict' | 'balanced' | 'relaxed';
  theme: 'dark' | 'light';
  githubConnected?: boolean;
  githubUsername?: string;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  techStack: string[];
  styleGuide?: string; // Custom instructions for the AI
  createdAt: string;
  repoUrl?: string; // Link to GitHub repo
  stats: {
    totalReviews: number;
    issuesFixed: number;
    securityScore: number;
  };
}

export interface ReviewSession {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  code: string;
  language: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  qualityScore?: number;
  issueCount?: number;
}

export interface Comment {
  id: string;
  sessionId: string;
  lineNumber: number;
  severity: Severity;
  category: Category;
  content: string;
  suggestion?: string; // The specific code fix
  isResolved: boolean;
}

export interface AIAnalysisResponse {
  summary: string;
  score: number;
  language: string;
  comments: Array<{
    lineNumber: number;
    severity: Severity;
    category: Category;
    content: string;
    suggestion?: string;
  }>;
  refactoredCode?: string; // Full file refactor if requested
}

export interface AppSettings {
  persona: 'friendly' | 'strict' | 'teacher' | 'minimalist';
  detailLevel: 'detailed' | 'brief';
  theme: 'dark' | 'light';
}

export interface AnalysisResult {
  score: number;
  summary: string;
  issues: string[];
  correctedCode: string;
  language: string;
  complexity: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  fileName: string;
  score: number;
  snippet: string;
  language: string;
  result: AnalysisResult;
}

export enum ViewState {
  IDLE = 'idle',
  ANALYZING = 'analyzing',
  SUCCESS = 'success',
  ERROR = 'error'
}