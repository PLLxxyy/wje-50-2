import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStore } from './useStore';
import type { Word, ReviewRecord } from '../types';
import { STORAGE_KEYS } from '../services/storage';

const createMockWord = (id: string, correct: string, groupId: string = 'group1'): Word => ({
  id,
  correct,
  mistakes: [],
  pinyin: 'pinyin',
  scene: '',
  groupId,
  createdAt: Date.now(),
  reviewCount: 0,
  correctCount: 0,
});

describe('useStore - 错题本功能', () => {
  const initialState = useStore.getState();

  beforeEach(() => {
    window.localStorage.clear();
    useStore.setState({
      words: [],
      reviewRecords: [],
      reviewSession: null,
    });
  });

  afterEach(() => {
    useStore.setState(initialState);
  });

  describe('getWrongWords', () => {
    it('应该从 reviewRecords 中正确汇总历次答错的词条', () => {
      const words: Word[] = [
        createMockWord('word1', '正确1'),
        createMockWord('word2', '正确2'),
        createMockWord('word3', '正确3'),
      ];

      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: false, timestamp: 1000 },
        { wordId: 'word1', isCorrect: false, timestamp: 1001 },
        { wordId: 'word2', isCorrect: true, timestamp: 1002 },
        { wordId: 'word3', isCorrect: false, timestamp: 1003 },
        { wordId: 'word3', isCorrect: false, timestamp: 1004 },
        { wordId: 'word3', isCorrect: false, timestamp: 1005 },
      ];

      useStore.setState({ words, reviewRecords });

      const wrongWords = useStore.getState().getWrongWords();

      expect(wrongWords).toHaveLength(2);
      expect(wrongWords[0].id).toBe('word3');
      expect(wrongWords[0].wrongCount).toBe(3);
      expect(wrongWords[1].id).toBe('word1');
      expect(wrongWords[1].wrongCount).toBe(2);
    });

    it('应该返回空数组当没有错题时', () => {
      const words: Word[] = [createMockWord('word1', '正确1')];
      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: true, timestamp: 1000 },
      ];

      useStore.setState({ words, reviewRecords });

      const wrongWords = useStore.getState().getWrongWords();

      expect(wrongWords).toEqual([]);
    });

    it('应该按错误次数排序', () => {
      const words: Word[] = [
        createMockWord('word1', '正确1'),
        createMockWord('word2', '正确2'),
        createMockWord('word3', '正确3'),
      ];

      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: false, timestamp: 1000 },
        { wordId: 'word2', isCorrect: false, timestamp: 1001 },
        { wordId: 'word2', isCorrect: false, timestamp: 1002 },
        { wordId: 'word3', isCorrect: false, timestamp: 1003 },
        { wordId: 'word3', isCorrect: false, timestamp: 1004 },
        { wordId: 'word3', isCorrect: false, timestamp: 1005 },
      ];

      useStore.setState({ words, reviewRecords });

      const wrongWords = useStore.getState().getWrongWords();

      expect(wrongWords.map((w) => w.id)).toEqual(['word3', 'word2', 'word1']);
      expect(wrongWords.map((w) => w.wrongCount)).toEqual([3, 2, 1]);
    });
  });

  describe('clearWrongRecord', () => {
    it('应该只清除指定词条的错题记录，保留其他错题', () => {
      const words: Word[] = [
        createMockWord('word1', '正确1'),
        createMockWord('word2', '正确2'),
        createMockWord('word3', '正确3'),
      ];

      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: false, timestamp: 1000 },
        { wordId: 'word1', isCorrect: false, timestamp: 1001 },
        { wordId: 'word2', isCorrect: false, timestamp: 1002 },
        { wordId: 'word3', isCorrect: true, timestamp: 1003 },
      ];

      useStore.setState({ words, reviewRecords });

      expect(useStore.getState().getWrongWords().map((w) => w.id)).toEqual(['word1', 'word2']);

      useStore.getState().clearWrongRecord('word1');

      const wrongWordsAfter = useStore.getState().getWrongWords();
      expect(wrongWordsAfter.map((w) => w.id)).toEqual(['word2']);
      expect(wrongWordsAfter).toHaveLength(1);

      const recordsAfter = useStore.getState().reviewRecords;
      expect(recordsAfter.some((r) => r.wordId === 'word1' && !r.isCorrect)).toBe(false);
      expect(recordsAfter.some((r) => r.wordId === 'word2' && !r.isCorrect)).toBe(true);
      expect(recordsAfter.some((r) => r.wordId === 'word3' && r.isCorrect)).toBe(true);
    });

    it('应该保留指定词条的正确记录', () => {
      const words: Word[] = [createMockWord('word1', '正确1')];
      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: false, timestamp: 1000 },
        { wordId: 'word1', isCorrect: true, timestamp: 1001 },
        { wordId: 'word1', isCorrect: false, timestamp: 1002 },
        { wordId: 'word1', isCorrect: true, timestamp: 1003 },
      ];

      useStore.setState({ words, reviewRecords });

      useStore.getState().clearWrongRecord('word1');

      const recordsAfter = useStore.getState().reviewRecords;
      expect(recordsAfter).toHaveLength(2);
      expect(recordsAfter.every((r) => r.isCorrect)).toBe(true);
    });

    it('应该同步更新 localStorage', () => {
      const words: Word[] = [
        createMockWord('word1', '正确1'),
        createMockWord('word2', '正确2'),
      ];
      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: false, timestamp: 1000 },
        { wordId: 'word2', isCorrect: false, timestamp: 1001 },
      ];

      useStore.setState({ words, reviewRecords });

      useStore.getState().clearWrongRecord('word1');

      const storedRecords = JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.REVIEW_RECORDS) || '[]'
      );
      expect(storedRecords.some((r: ReviewRecord) => r.wordId === 'word1' && !r.isCorrect)).toBe(false);
      expect(storedRecords.some((r: ReviewRecord) => r.wordId === 'word2' && !r.isCorrect)).toBe(true);
    });
  });

  describe('clearAllWrongRecords', () => {
    it('应该清除所有错题记录，保留全部正确记录', () => {
      const words: Word[] = [
        createMockWord('word1', '正确1'),
        createMockWord('word2', '正确2'),
        createMockWord('word3', '正确3'),
      ];

      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: false, timestamp: 1000 },
        { wordId: 'word1', isCorrect: true, timestamp: 1001 },
        { wordId: 'word2', isCorrect: false, timestamp: 1002 },
        { wordId: 'word3', isCorrect: true, timestamp: 1003 },
        { wordId: 'word3', isCorrect: false, timestamp: 1004 },
      ];

      useStore.setState({ words, reviewRecords });

      expect(useStore.getState().getWrongWords()).toHaveLength(3);

      useStore.getState().clearAllWrongRecords();

      const wrongWordsAfter = useStore.getState().getWrongWords();
      expect(wrongWordsAfter).toEqual([]);

      const recordsAfter = useStore.getState().reviewRecords;
      expect(recordsAfter).toHaveLength(2);
      expect(recordsAfter.every((r) => r.isCorrect)).toBe(true);
      expect(recordsAfter.map((r) => r.wordId)).toEqual(expect.arrayContaining(['word1', 'word3']));
    });

    it('清空后错题本应该为空', () => {
      const words: Word[] = [createMockWord('word1', '正确1')];
      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: false, timestamp: 1000 },
      ];

      useStore.setState({ words, reviewRecords });

      useStore.getState().clearAllWrongRecords();

      expect(useStore.getState().getWrongWords()).toEqual([]);
      expect(useStore.getState().reviewRecords).toEqual([]);
    });

    it('应该同步更新 localStorage', () => {
      const words: Word[] = [
        createMockWord('word1', '正确1'),
        createMockWord('word2', '正确2'),
      ];
      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: false, timestamp: 1000 },
        { wordId: 'word1', isCorrect: true, timestamp: 1001 },
        { wordId: 'word2', isCorrect: false, timestamp: 1002 },
      ];

      useStore.setState({ words, reviewRecords });

      useStore.getState().clearAllWrongRecords();

      const storedRecords = JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.REVIEW_RECORDS) || '[]'
      );
      expect(storedRecords).toHaveLength(1);
      expect(storedRecords[0].wordId).toBe('word1');
      expect(storedRecords[0].isCorrect).toBe(true);
    });
  });

  describe('startReview - 错题模式', () => {
    it('错题模式应该只从答错的词条中抽题', () => {
      const words: Word[] = [
        createMockWord('word1', '正确1'),
        createMockWord('word2', '正确2'),
        createMockWord('word3', '正确3'),
        createMockWord('word4', '正确4'),
        createMockWord('word5', '正确5'),
      ];

      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word2', isCorrect: false, timestamp: 1000 },
        { wordId: 'word2', isCorrect: false, timestamp: 1001 },
        { wordId: 'word4', isCorrect: false, timestamp: 1002 },
        { wordId: 'word1', isCorrect: true, timestamp: 1003 },
        { wordId: 'word3', isCorrect: true, timestamp: 1004 },
      ];

      useStore.setState({ words, reviewRecords });

      useStore.getState().startReview(10, 'choice', 'all', 'wrong');

      const session = useStore.getState().reviewSession;
      expect(session).not.toBeNull();
      expect(session?.questions).toHaveLength(2);

      const questionWordIds = session?.questions.map((q) => q.word.id);
      expect(questionWordIds).toEqual(expect.arrayContaining(['word2', 'word4']));
      expect(questionWordIds).not.toContain('word1');
      expect(questionWordIds).not.toContain('word3');
      expect(questionWordIds).not.toContain('word5');
    });

    it('错题模式忽略分组选择参数', () => {
      const words: Word[] = [
        createMockWord('word1', '正确1', 'group1'),
        createMockWord('word2', '正确2', 'group1'),
        createMockWord('word3', '正确3', 'group2'),
      ];

      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: false, timestamp: 1000 },
        { wordId: 'word3', isCorrect: false, timestamp: 1001 },
      ];

      useStore.setState({ words, reviewRecords });

      useStore.getState().startReview(10, 'choice', 'group1', 'wrong');

      const session = useStore.getState().reviewSession;
      const questionWordIds = session?.questions.map((q) => q.word.id);

      expect(questionWordIds).toEqual(expect.arrayContaining(['word1', 'word3']));
      expect(questionWordIds).not.toContain('word2');
    });

    it('没有错题时不创建复习会话', () => {
      const words: Word[] = [createMockWord('word1', '正确1')];
      const reviewRecords: ReviewRecord[] = [
        { wordId: 'word1', isCorrect: true, timestamp: 1000 },
      ];

      useStore.setState({ words, reviewRecords });

      useStore.getState().startReview(10, 'choice', 'all', 'wrong');

      expect(useStore.getState().reviewSession).toBeNull();
    });

    it('答题后错题自动添加到错题本', () => {
      const words: Word[] = [createMockWord('word1', '正确1')];

      useStore.setState({ words, reviewRecords: [] });

      useStore.getState().startReview(1, 'choice', 'all', 'normal');

      useStore.getState().answerQuestion('错误答案');

      const wrongWords = useStore.getState().getWrongWords();

      expect(wrongWords).toHaveLength(1);
      expect(wrongWords[0].id).toBe('word1');
      expect(wrongWords[0].wrongCount).toBe(1);
    });
  });
});
