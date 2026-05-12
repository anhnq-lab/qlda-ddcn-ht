const BIM_API = import.meta.env.VITE_BIM_AGENT_URL || 'http://localhost:8002';
const API_KEY = import.meta.env.VITE_BIM_AGENT_KEY || 'default-bim-secret-key-2026';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': API_KEY
});

export const bimAgentService = {
  async query(query: string, model?: string) {
    const res = await fetch(`${BIM_API}/api/bim-agent/query`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query, model }),
    });
    return res.json();
  },

  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BIM_API}/api/bim-agent/upload`, {
      method: 'POST', 
      headers: {
        'x-api-key': API_KEY
      },
      body: formData,
    });
    return res.json();
  },

  async getModels() {
    const res = await fetch(`${BIM_API}/api/bim-agent/models`, {
        headers: getHeaders(),
    });
    return res.json();
  },

  async health() {
    const res = await fetch(`${BIM_API}/health`);
    return res.json();
  },
};
