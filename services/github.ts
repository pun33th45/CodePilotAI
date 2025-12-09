export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  language: string;
  updated_at: string;
}

const MOCK_REPOS: GitHubRepo[] = [
  { 
    id: 1, 
    name: 'react-ecommerce-platform', 
    full_name: 'monalisa/react-ecommerce-platform', 
    private: false, 
    html_url: 'https://github.com/monalisa/react-ecommerce-platform', 
    description: 'Modern e-commerce dashboard using Next.js and Tailwind', 
    language: 'TypeScript', 
    updated_at: new Date().toISOString() 
  },
  { 
    id: 2, 
    name: 'node-microservices-kit', 
    full_name: 'monalisa/node-microservices-kit', 
    private: true, 
    html_url: 'https://github.com/monalisa/node-microservices-kit', 
    description: 'Scalable backend scaffolding with Docker support', 
    language: 'TypeScript', 
    updated_at: new Date(Date.now() - 86400000).toISOString() 
  },
  { 
    id: 3, 
    name: 'python-data-pipeline', 
    full_name: 'monalisa/python-data-pipeline', 
    private: false, 
    html_url: 'https://github.com/monalisa/python-data-pipeline', 
    description: 'ETL pipeline for processing large datasets', 
    language: 'Python', 
    updated_at: new Date(Date.now() - 172800000).toISOString() 
  },
  { 
    id: 4, 
    name: 'go-distributed-system', 
    full_name: 'monalisa/go-distributed-system', 
    private: false, 
    html_url: 'https://github.com/monalisa/go-distributed-system', 
    description: 'Raft consensus implementation in Go', 
    language: 'Go', 
    updated_at: new Date(Date.now() - 400000000).toISOString() 
  }
];

export const githubService = {
  // Simulate OAuth Popup Flow
  connect: async (): Promise<{ username: string; token: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ username: 'monalisa_dev', token: 'gho_mock_token_12345' });
      }, 1500);
    });
  },

  getRepos: async (): Promise<GitHubRepo[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_REPOS);
      }, 800);
    });
  }
};