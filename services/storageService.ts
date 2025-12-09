import { HistoryItem, AppSettings, User } from '../types';

const KEYS = {
  HISTORY: 'codepilot_history_v1',
  SETTINGS: 'codepilot_settings_v1',
  USER: 'codepilot_user_v1',
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const StorageService = {
  // History Methods
  getHistory: async (): Promise<HistoryItem[]> => {
    await delay(300); // Fake DB latency
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveHistoryItem: async (item: HistoryItem): Promise<void> => {
    await delay(200);
    const history = await StorageService.getHistory();
    const updated = [item, ...history];
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  },

  clearHistory: async (): Promise<void> => {
    await delay(300);
    localStorage.removeItem(KEYS.HISTORY);
  },

  // Settings Methods
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    const defaults: AppSettings = {
      persona: 'friendly',
      detailLevel: 'detailed',
      theme: 'dark',
    };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    await delay(200);
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Auth/User Methods
  getUser: (): User | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  saveUser: async (user: User): Promise<void> => {
    await delay(500); // Simulate login time
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  logout: async (): Promise<void> => {
    await delay(200);
    localStorage.removeItem(KEYS.USER);
  }
};