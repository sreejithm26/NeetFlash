// For local development it falls back to the current hostname, for production use the Cloudflare worker URL
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8787/api`;

export const ApiService = {
  async fetchAll() {
    const res = await fetch(`${API_URL}/problems`);
    return res.json();
  },

  async addProblem(problem: any, flashcards: any[]) {
    await fetch(`${API_URL}/problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...problem, flashcards })
    });
  },

  async updateFlashcard(flashcardId: string, updates: any) {
    await fetch(`${API_URL}/flashcards/${flashcardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  async updateProblem(problemId: string, updates: any) {
    await fetch(`${API_URL}/problems/${problemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  async getDrawing(problemId: string) {
    const res = await fetch(`${API_URL}/problems/${problemId}/drawing`);
    return res.json();
  },

  async updateDrawing(problemId: string, strokes: any[]) {
    await fetch(`${API_URL}/problems/${problemId}/drawing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strokes })
    });
  },
  
  async deleteProblem(problemId: string) {
    await fetch(`${API_URL}/problems/${problemId}`, {
      method: 'DELETE'
    });
  },

  async fetchLeetCode(slug: string) {
    const res = await fetch(`${API_URL}/leetcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionFrontendId
              title
              content
              difficulty
            }
          }
        `,
        variables: { titleSlug: slug }
      })
    });
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    return data.data?.question;
  }
};
