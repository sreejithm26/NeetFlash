import type { Problem, Flashcard } from '../types';

export const StorageService = {
  getProblems: (): Problem[] => {
    const data = localStorage.getItem('leetflash_problems');
    return data ? JSON.parse(data) : [];
  },

  saveProblems: (problems: Problem[]): void => {
    localStorage.setItem('leetflash_problems', JSON.stringify(problems));
  },

  getFlashcards: (): Flashcard[] => {
    const data = localStorage.getItem('leetflash_flashcards');
    return data ? JSON.parse(data) : [];
  },

  saveFlashcards: (flashcards: Flashcard[]): void => {
    localStorage.setItem('leetflash_flashcards', JSON.stringify(flashcards));
  },

  getSettings: () => {
    const data = localStorage.getItem('leetflash_settings');
    return data ? JSON.parse(data) : { llmProvider: 'gemini', apiKey: '' };
  },

  saveSettings: (settings: any): void => {
    localStorage.setItem('leetflash_settings', JSON.stringify(settings));
  }
};
