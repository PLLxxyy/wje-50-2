import { create } from 'zustand';
import type { Word, Group, ReviewRecord, Question, QuestionType, ReviewSession, ImportResult } from '../types';
import { loadFromStorage, saveToStorage, clearStorage, STORAGE_KEYS } from '../services/storage';
import { createWord, validateWord, searchWords, getWordsByGroup, getRandomWords, importWords as importWordsService, exportToJSON, exportToText, getGroupStats, getReviewStats } from '../services/wordService';
import { generateQuestions, checkAnswer, createReviewRecord, updateWordStats, getWrongWords } from '../services/reviewService';
import type { WrongWord } from '../services/reviewService';
import type { ReviewMode } from '../types';
import { defaultGroups, sampleWords } from '../data/initialData';

interface AppStore {
  words: Word[];
  groups: Group[];
  reviewRecords: ReviewRecord[];
  reviewSession: ReviewSession | null;
  isInitialized: boolean;

  init: () => void;
  addWord: (word: Omit<Word, 'id' | 'createdAt' | 'reviewCount' | 'correctCount'>) => { success: boolean; errors?: string[] };
  updateWord: (id: string, updates: Partial<Word>) => { success: boolean; errors?: string[] };
  deleteWord: (id: string) => void;
  searchWords: (keyword: string) => Word[];
  getWordsByGroup: (groupId: string) => Word[];

  startReview: (count: number, type: QuestionType, groupId?: string, mode?: ReviewMode) => void;
  answerQuestion: (answer: string) => void;
  nextQuestion: () => void;
  resetReview: () => void;

  getWrongWords: () => WrongWord[];
  clearWrongRecord: (wordId: string) => void;
  clearAllWrongRecords: () => void;

  importWords: (data: unknown) => ImportResult;
  exportJSON: () => string;
  exportText: () => string;
  resetAllData: () => void;
  loadSampleData: () => void;

  getGroupStats: () => Array<Group & { count: number }>;
  getReviewStats: () => { total: number; reviewed: number; accuracy: number };
}

const initialReviewSession: ReviewSession = {
  questions: [],
  currentIndex: 0,
  correctCount: 0,
  wrongWords: [],
  isFinished: false,
};

export const useStore = create<AppStore>((set, get) => ({
  words: [],
  groups: defaultGroups,
  reviewRecords: [],
  reviewSession: null,
  isInitialized: false,

  init: () => {
    const storedWords = loadFromStorage<Word[]>(STORAGE_KEYS.WORDS, []);
    const storedGroups = loadFromStorage<Group[]>(STORAGE_KEYS.GROUPS, defaultGroups);
    const storedRecords = loadFromStorage<ReviewRecord[]>(STORAGE_KEYS.REVIEW_RECORDS, []);

    const words = storedWords.length > 0 ? storedWords : sampleWords;
    const groups = storedGroups.length > 0 ? storedGroups : defaultGroups;

    set({
      words,
      groups,
      reviewRecords: storedRecords,
      isInitialized: true,
    });

    if (storedWords.length === 0) {
      saveToStorage(STORAGE_KEYS.WORDS, words);
    }
    if (storedGroups.length === 0) {
      saveToStorage(STORAGE_KEYS.GROUPS, groups);
    }
  },

  addWord: (wordData) => {
    const { valid, errors } = validateWord(wordData);
    if (!valid) {
      return { success: false, errors };
    }
    const newWord = createWord(wordData);
    set((state) => {
      const words = [...state.words, newWord];
      saveToStorage(STORAGE_KEYS.WORDS, words);
      return { words };
    });
    return { success: true };
  },

  updateWord: (id, updates) => {
    const { valid, errors } = validateWord(updates);
    if (!valid) {
      return { success: false, errors };
    }
    set((state) => {
      const words = state.words.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      );
      saveToStorage(STORAGE_KEYS.WORDS, words);
      return { words };
    });
    return { success: true };
  },

  deleteWord: (id) => {
    set((state) => {
      const words = state.words.filter((w) => w.id !== id);
      saveToStorage(STORAGE_KEYS.WORDS, words);
      return { words };
    });
  },

  searchWords: (keyword) => {
    return searchWords(get().words, keyword);
  },

  getWordsByGroup: (groupId) => {
    return getWordsByGroup(get().words, groupId);
  },

  startReview: (count, type, groupId, mode = 'normal') => {
    const { words, reviewRecords } = get();
    let pool = words;
    
    if (mode === 'wrong') {
      const wrongWords = getWrongWords(words, reviewRecords);
      pool = wrongWords as Word[];
    } else if (groupId && groupId !== 'all') {
      pool = words.filter((w) => w.groupId === groupId);
    }
    
    if (pool.length === 0) {
      return;
    }
    const questions = generateQuestions(pool, words, count, type);
    set({
      reviewSession: {
        ...initialReviewSession,
        questions,
      },
    });
  },

  answerQuestion: (answer) => {
    const session = get().reviewSession;
    if (!session || session.isFinished) return;

    const currentQuestion = session.questions[session.currentIndex];
    if (!currentQuestion) return;

    const isCorrect = checkAnswer(currentQuestion, answer);
    const updatedQuestion: Question = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect,
    };

    const updatedQuestions = [...session.questions];
    updatedQuestions[session.currentIndex] = updatedQuestion;

    set((state) => {
      const words = state.words.map((w) =>
        w.id === currentQuestion.word.id
          ? updateWordStats(w, isCorrect)
          : w
      );
      saveToStorage(STORAGE_KEYS.WORDS, words);

      const record = createReviewRecord(currentQuestion.word.id, isCorrect);
      const reviewRecords = [...state.reviewRecords, record];
      saveToStorage(STORAGE_KEYS.REVIEW_RECORDS, reviewRecords);

      const wrongWords = isCorrect
        ? session.wrongWords
        : [...session.wrongWords, currentQuestion.word];

      const isFinished = session.currentIndex >= session.questions.length - 1;

      return {
        words,
        reviewRecords,
        reviewSession: {
          ...session,
          questions: updatedQuestions,
          correctCount: session.correctCount + (isCorrect ? 1 : 0),
          wrongWords,
          isFinished,
        },
      };
    });
  },

  nextQuestion: () => {
    set((state) => {
      if (!state.reviewSession) return state;
      const nextIndex = Math.min(
        state.reviewSession.currentIndex + 1,
        state.reviewSession.questions.length - 1
      );
      return {
        reviewSession: {
          ...state.reviewSession,
          currentIndex: nextIndex,
          isFinished: nextIndex >= state.reviewSession.questions.length - 1 &&
            state.reviewSession.questions[nextIndex]?.isCorrect !== undefined,
        },
      };
    });
  },

  resetReview: () => {
    set({ reviewSession: null });
  },

  importWords: (data) => {
    const { words, groups } = get();
    const { words: newWords, result } = importWordsService(words, data, groups);
    set({ words: newWords });
    saveToStorage(STORAGE_KEYS.WORDS, newWords);
    return result;
  },

  exportJSON: () => {
    const { words, groups } = get();
    return exportToJSON(words, groups);
  },

  exportText: () => {
    const { words } = get();
    return exportToText(words);
  },

  resetAllData: () => {
    clearStorage();
    set({
      words: sampleWords,
      groups: defaultGroups,
      reviewRecords: [],
      reviewSession: null,
    });
    saveToStorage(STORAGE_KEYS.WORDS, sampleWords);
    saveToStorage(STORAGE_KEYS.GROUPS, defaultGroups);
    saveToStorage(STORAGE_KEYS.REVIEW_RECORDS, []);
  },

  loadSampleData: () => {
    set({ words: sampleWords });
    saveToStorage(STORAGE_KEYS.WORDS, sampleWords);
  },

  getGroupStats: () => {
    return getGroupStats(get().words, get().groups);
  },

  getReviewStats: () => {
    return getReviewStats(get().words);
  },

  getWrongWords: () => {
    const { words, reviewRecords } = get();
    return getWrongWords(words, reviewRecords);
  },

  clearWrongRecord: (wordId) => {
    set((state) => {
      const reviewRecords = state.reviewRecords.filter((r) => r.wordId !== wordId || r.isCorrect);
      saveToStorage(STORAGE_KEYS.REVIEW_RECORDS, reviewRecords);
      return { reviewRecords };
    });
  },

  clearAllWrongRecords: () => {
    set((state) => {
      const reviewRecords = state.reviewRecords.filter((r) => r.isCorrect);
      saveToStorage(STORAGE_KEYS.REVIEW_RECORDS, reviewRecords);
      return { reviewRecords };
    });
  },
}));
