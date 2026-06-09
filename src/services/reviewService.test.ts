import { describe, it, expect } from 'vitest';
import { getWrongWords, generateQuestions, checkAnswer } from './reviewService';
import type { Word, ReviewRecord, QuestionType } from '../types';

const createMockWord = (id: string, correct: string): Word => ({
  id,
  correct,
  mistakes: [],
  pinyin: 'pinyin',
  scene: '',
  groupId: 'group1',
  createdAt: Date.now(),
  reviewCount: 0,
  correctCount: 0,
});

const createMockRecord = (
  wordId: string,
  isCorrect: boolean,
  timestamp: number
): ReviewRecord => ({
  wordId,
  isCorrect,
  timestamp,
});

describe('reviewService - getWrongWords', () => {
  const words: Word[] = [
    createMockWord('word1', '正确写法1'),
    createMockWord('word2', '正确写法2'),
    createMockWord('word3', '正确写法3'),
    createMockWord('word4', '正确写法4'),
  ];

  it('应该返回空数组当没有错题记录时', () => {
    const records: ReviewRecord[] = [];
    const result = getWrongWords(words, records);
    expect(result).toEqual([]);
  });

  it('应该只返回答错的词条，不包含答对的', () => {
    const records: ReviewRecord[] = [
      createMockRecord('word1', false, 1000),
      createMockRecord('word2', true, 1001),
      createMockRecord('word3', false, 1002),
    ];

    const result = getWrongWords(words, records);

    expect(result).toHaveLength(2);
    expect(result.map((w) => w.id)).toEqual(expect.arrayContaining(['word1', 'word3']));
    expect(result.map((w) => w.id)).not.toContain('word2');
  });

  it('应该正确统计每个词条的错误次数', () => {
    const records: ReviewRecord[] = [
      createMockRecord('word1', false, 1000),
      createMockRecord('word1', false, 1001),
      createMockRecord('word1', false, 1002),
      createMockRecord('word2', false, 1003),
      createMockRecord('word2', true, 1004),
    ];

    const result = getWrongWords(words, records);

    const word1 = result.find((w) => w.id === 'word1');
    const word2 = result.find((w) => w.id === 'word2');

    expect(word1?.wrongCount).toBe(3);
    expect(word2?.wrongCount).toBe(1);
  });

  it('应该按错误次数降序排序，次数相同时按最后错误时间降序', () => {
    const records: ReviewRecord[] = [
      createMockRecord('word1', false, 1000),
      createMockRecord('word1', false, 1001),
      createMockRecord('word2', false, 2000),
      createMockRecord('word3', false, 1500),
      createMockRecord('word3', false, 1501),
    ];

    const result = getWrongWords(words, records);

    expect(result.map((w) => w.id)).toEqual(['word3', 'word1', 'word2']);
    expect(result[0].wrongCount).toBe(2);
    expect(result[1].wrongCount).toBe(2);
    expect(result[0].lastWrongTime).toBe(1501);
    expect(result[1].lastWrongTime).toBe(1001);
  });

  it('应该记录最后一次错误的时间', () => {
    const records: ReviewRecord[] = [
      createMockRecord('word1', false, 1000),
      createMockRecord('word1', true, 1500),
      createMockRecord('word1', false, 2000),
    ];

    const result = getWrongWords(words, records);
    const word1 = result.find((w) => w.id === 'word1');

    expect(word1?.lastWrongTime).toBe(2000);
    expect(word1?.wrongCount).toBe(2);
  });

  it('应该忽略已删除的词条（有错误记录但词条不存在）', () => {
    const records: ReviewRecord[] = [
      createMockRecord('word1', false, 1000),
      createMockRecord('deleted-word', false, 1001),
    ];

    const result = getWrongWords(words, records);

    expect(result.map((w) => w.id)).toEqual(['word1']);
    expect(result).toHaveLength(1);
  });

  it('答对的记录不影响错误次数统计', () => {
    const records: ReviewRecord[] = [
      createMockRecord('word1', false, 1000),
      createMockRecord('word1', true, 1001),
      createMockRecord('word1', true, 1002),
      createMockRecord('word1', true, 1003),
    ];

    const result = getWrongWords(words, records);
    const word1 = result.find((w) => w.id === 'word1');

    expect(word1?.wrongCount).toBe(1);
  });

  it('应该返回包含完整词条信息的 WrongWord 对象', () => {
    const records: ReviewRecord[] = [createMockRecord('word1', false, 1000)];

    const result = getWrongWords(words, records);
    const word1 = result[0];

    expect(word1).toHaveProperty('wrongCount');
    expect(word1).toHaveProperty('lastWrongTime');
    expect(word1.correct).toBe('正确写法1');
    expect(word1.pinyin).toBe('pinyin');
    expect(word1.groupId).toBe('group1');
    expect(typeof word1.wrongCount).toBe('number');
    expect(typeof word1.lastWrongTime).toBe('number');
  });
});

describe('reviewService - generateQuestions (错题模式)', () => {
  const allWords: Word[] = [
    createMockWord('word1', '正确1'),
    createMockWord('word2', '正确2'),
    createMockWord('word3', '正确3'),
    createMockWord('word4', '正确4'),
    createMockWord('word5', '正确5'),
  ];

  it('错题模式应该只从提供的错题池中抽题', () => {
    const wrongWords: Word[] = [allWords[0], allWords[2]];

    const questions = generateQuestions(wrongWords, allWords, 10, 'choice');

    const questionWordIds = questions.map((q) => q.word.id);
    expect(questionWordIds).toEqual(expect.arrayContaining(['word1', 'word3']));
    expect(questionWordIds).not.toContain('word2');
    expect(questionWordIds).not.toContain('word4');
    expect(questionWordIds).not.toContain('word5');
  });

  it('当错题数少于请求题数时，只返回所有错题', () => {
    const wrongWords: Word[] = [allWords[0], allWords[1]];

    const questions = generateQuestions(wrongWords, allWords, 10, 'choice');

    expect(questions).toHaveLength(2);
  });

  it('支持选择题型和填空题型', () => {
    const wrongWords: Word[] = [allWords[0]];

    const choiceQuestions = generateQuestions(wrongWords, allWords, 5, 'choice');
    const fillQuestions = generateQuestions(wrongWords, allWords, 5, 'fill');

    expect(choiceQuestions[0].type).toBe('choice');
    expect(choiceQuestions[0].options).toBeDefined();
    expect(choiceQuestions[0].options?.length).toBe(4);

    expect(fillQuestions[0].type).toBe('fill');
    expect(fillQuestions[0].options).toBeUndefined();
  });
});

describe('reviewService - checkAnswer', () => {
  const word = createMockWord('word1', '正确写法');
  const question = {
    word,
    type: 'choice' as QuestionType,
    options: ['正确写法', '错误1', '错误2', '错误3'],
  };

  it('应该正确判断相同答案为正确', () => {
    expect(checkAnswer(question, '正确写法')).toBe(true);
  });

  it('应该忽略前后空白字符', () => {
    expect(checkAnswer(question, '  正确写法  ')).toBe(true);
  });

  it('应该不区分大小写', () => {
    const englishWord = createMockWord('word2', 'Hello');
    const englishQuestion = {
      ...question,
      word: englishWord,
    };
    expect(checkAnswer(englishQuestion, 'hello')).toBe(true);
    expect(checkAnswer(englishQuestion, 'HELLO')).toBe(true);
  });

  it('应该正确判断错误答案', () => {
    expect(checkAnswer(question, '错误写法')).toBe(false);
    expect(checkAnswer(question, '')).toBe(false);
  });
});
