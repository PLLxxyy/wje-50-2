export interface Word {
  id: string;
  correct: string;
  mistakes: string[];
  pinyin: string;
  scene: string;
  groupId: string;
  createdAt: number;
  reviewCount: number;
  correctCount: number;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ReviewRecord {
  wordId: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface AppState {
  words: Word[];
  groups: Group[];
  reviewRecords: ReviewRecord[];
}

export type QuestionType = 'choice' | 'fill';

export type ReviewMode = 'normal' | 'wrong';

export interface Question {
  word: Word;
  type: QuestionType;
  options?: string[];
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface ReviewSession {
  questions: Question[];
  currentIndex: number;
  correctCount: number;
  wrongWords: Word[];
  isFinished: boolean;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
