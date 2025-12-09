import { User } from '../types';
import { db } from './db';

const SESSION_KEY = 'cr_auth_session';

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      this.currentUser = JSON.parse(stored);
    }
  }

  getUser(): User | null {
    return this.currentUser;
  }

  async login(email: string): Promise<User> {
    // Simulating Auth Logic
    let user = await db.getUser(email); // Using email as ID for mock simplicity
    
    // For demo purposes, if user doesn't exist in "Login" mode, we throw error
    // (User should use Register)
    if (!user) {
      throw new Error("User not found. Please register.");
    }

    this.currentUser = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  async register(name: string, email: string): Promise<User> {
    const existing = await db.getUser(email);
    if (existing) {
      throw new Error("User already exists.");
    }

    const newUser: User = {
      id: email,
      email,
      name,
      createdAt: new Date().toISOString(),
      preferences: {
        onboardingCompleted: false,
        primaryLanguages: [],
        preferredStyle: 'balanced',
        theme: 'dark'
      }
    };

    await db.updateUser(newUser);
    this.currentUser = newUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;
  }

  async logout() {
    this.currentUser = null;
    localStorage.removeItem(SESSION_KEY);
  }

  async updateProfile(updates: Partial<User>) {
    if (!this.currentUser) return;
    const updated = { ...this.currentUser, ...updates };
    await db.updateUser(updated);
    this.currentUser = updated;
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }

  async linkGitHub(username: string) {
    if (!this.currentUser) return;
    const updated: User = { 
        ...this.currentUser, 
        preferences: { 
            ...this.currentUser.preferences, 
            githubConnected: true, 
            githubUsername: username 
        } 
    };
    await db.updateUser(updated);
    this.currentUser = updated;
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    return updated;
  }
}

export const auth = new AuthService();