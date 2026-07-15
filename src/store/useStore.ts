import { create } from 'zustand';
import type { Problem, Flashcard } from '../types';
import { ApiService } from '../services/api';

interface AppState {
  problems: Problem[];
  flashcards: Flashcard[];
  isLoading: boolean;
  
  // Actions
  fetchData: () => Promise<void>;
  addProblem: (problem: Problem, newFlashcards: Flashcard[]) => Promise<void>;
  updateFlashcardSM2: (flashcardId: string, sm2Data: any) => Promise<void>;
  updateProblemImage: (problemId: string, imageUrl: string) => Promise<void>;
  updatePatternCode: (problemId: string, patternCode: string) => Promise<void>;
  updateDrawing: (problemId: string, strokes: any[]) => Promise<void>;
  toggleFavorite: (problemId: string) => Promise<void>;
  deleteProblem: (problemId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  problems: [],
  flashcards: [],
  isLoading: true,

  fetchData: async () => {
    try {
      // 1. Check for old localStorage data to migrate
      const oldProblemsRaw = localStorage.getItem('leetflash_problems');
      const oldFlashcardsRaw = localStorage.getItem('leetflash_flashcards');
      
      if (oldProblemsRaw) {
        const oldProblems = JSON.parse(oldProblemsRaw) as Problem[];
        const oldFlashcards = oldFlashcardsRaw ? (JSON.parse(oldFlashcardsRaw) as Flashcard[]) : [];
        
        console.log("Migrating old local storage data to Cloudflare...", oldProblems.length, "problems found.");
        
        for (const problem of oldProblems) {
          const problemCards = oldFlashcards.filter(c => c.problemId === problem.id);
          // Upload problem & associated cards
          await ApiService.addProblem(problem, problemCards);
          
          // If drawing strokes exist inline, migrate them to KV
          if (problem.drawingStrokes && problem.drawingStrokes.length > 0) {
            await ApiService.updateDrawing(problem.id, problem.drawingStrokes);
          }
        }
        
        // Backup and clear the old keys to avoid re-migration
        localStorage.setItem('leetflash_problems_migrated_backup', oldProblemsRaw);
        if (oldFlashcardsRaw) {
          localStorage.setItem('leetflash_flashcards_migrated_backup', oldFlashcardsRaw);
        }
        localStorage.removeItem('leetflash_problems');
        localStorage.removeItem('leetflash_flashcards');
        console.log("Migration complete!");
      }

      // 2. Fetch from Cloudflare Worker
      const data = await ApiService.fetchAll();
      set({ problems: data.problems, flashcards: data.flashcards, isLoading: false });
    } catch (e) {
      console.error("Failed to fetch data", e);
      set({ isLoading: false });
    }
  },

  addProblem: async (problem, newFlashcards) => {
    // Optimistic update
    set((state) => ({
      problems: [...state.problems, problem],
      flashcards: [...state.flashcards, ...newFlashcards],
    }));
    await ApiService.addProblem(problem, newFlashcards);
  },

  updateFlashcardSM2: async (flashcardId, sm2Data) => {
    set((state) => ({
      flashcards: state.flashcards.map(card => 
        card.id === flashcardId ? { ...card, sm2Data } : card
      )
    }));
    await ApiService.updateFlashcard(flashcardId, { sm2Data });
  },

  updateProblemImage: async (problemId, imageUrl) => {
    set(state => ({
      problems: state.problems.map(p => 
        p.id === problemId ? { ...p, imageUrl } : p
      )
    }));
    await ApiService.updateProblem(problemId, { imageUrl });
  },

  updatePatternCode: async (problemId, patternCode) => {
    set(state => ({
      problems: state.problems.map(p => 
        p.id === problemId ? { ...p, patternCode } : p
      )
    }));
    await ApiService.updateProblem(problemId, { patternCode });
  },

  updateDrawing: async (problemId, strokes) => {
    set(state => ({
      problems: state.problems.map(p => 
        p.id === problemId ? { ...p, drawingStrokes: strokes } : p
      )
    }));
    await ApiService.updateDrawing(problemId, strokes);
  },

  toggleFavorite: async (problemId) => {
    const problem = get().problems.find(p => p.id === problemId);
    if (!problem) return;
    
    set(state => ({
      problems: state.problems.map(p => 
        p.id === problemId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    }));
    await ApiService.updateProblem(problemId, { isFavorite: !problem.isFavorite });
  },

  deleteProblem: async (problemId) => {
    set((state) => ({
      problems: state.problems.filter(p => p.id !== problemId),
      flashcards: state.flashcards.filter(c => c.problemId !== problemId)
    }));
    await ApiService.deleteProblem(problemId);
  }
}));
