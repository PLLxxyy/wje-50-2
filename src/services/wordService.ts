import type { Word, Group, ImportResult } from '../types';
import { matchWord } from './pinyinHelper';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function createWord(data: Omit<Word, 'id' | 'createdAt' | 'reviewCount' | 'correctCount'>): Word {
  return {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
    reviewCount: 0,
    correctCount: 0,
  };
}

export function validateWord(data: Partial<Word>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.correct || data.correct.trim() === '') {
    errors.push('正确写法不能为空');
  }
  if (!data.groupId) {
    errors.push('请选择分组');
  }
  return { valid: errors.length === 0, errors };
}

export function searchWords(words: Word[], keyword: string): Word[] {
  if (!keyword || keyword.trim() === '') {
    return words;
  }
  const trimmedKeyword = keyword.trim().toLowerCase();
  return words.filter((word) => matchWord(word, trimmedKeyword));
}

export function getWordsByGroup(words: Word[], groupId: string): Word[] {
  if (!groupId || groupId === 'all') {
    return words;
  }
  return words.filter((word) => word.groupId === groupId);
}

export function getRandomWords(words: Word[], count: number, groupId?: string): Word[] {
  let pool = words;
  if (groupId && groupId !== 'all') {
    pool = words.filter((w) => w.groupId === groupId);
  }
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function importWords(words: Word[], importData: unknown, groups: Group[]): { words: Word[]; result: ImportResult } {
  const result: ImportResult = { success: 0, failed: 0, errors: [] };
  const newWords: Word[] = [...words];
  const groupIds = new Set(groups.map((g) => g.id));

  if (!Array.isArray(importData)) {
    result.failed = 1;
    result.errors.push('导入数据格式错误，应为数组');
    return { words, result };
  }

  importData.forEach((item, index) => {
    try {
      const { valid, errors } = validateWord(item as Partial<Word>);
      if (!valid) {
        result.failed++;
        result.errors.push(`第 ${index + 1} 条: ${errors.join(', ')}`);
        return;
      }
      if (!groupIds.has(item.groupId)) {
        result.failed++;
        result.errors.push(`第 ${index + 1} 条: 分组不存在`);
        return;
      }
      const word = createWord({
        correct: item.correct,
        mistakes: Array.isArray(item.mistakes) ? item.mistakes : [],
        pinyin: item.pinyin || '',
        scene: item.scene || '',
        groupId: item.groupId,
      });
      newWords.push(word);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`第 ${index + 1} 条: 数据格式错误`);
    }
  });

  return { words: newWords, result };
}

export function exportToJSON(words: Word[], groups: Group[]): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    groups,
    words: words.map(({ id, createdAt, reviewCount, correctCount, ...rest }) => rest),
  };
  return JSON.stringify(exportData, null, 2);
}

export function exportToText(words: Word[]): string {
  const lines = words.map((word) => {
    const mistakes = word.mistakes.length > 0 ? `(${word.mistakes.join('/')})` : '';
    const pinyin = word.pinyin ? `[${word.pinyin}]` : '';
    const scene = word.scene ? ` - ${word.scene}` : '';
    return `${word.correct}${mistakes}${pinyin}${scene}`;
  });
  return lines.join('\n');
}

export function getGroupStats(words: Word[], groups: Group[]): Array<Group & { count: number }> {
  return groups.map((group) => ({
    ...group,
    count: words.filter((w) => w.groupId === group.id).length,
  }));
}

export function getReviewStats(words: Word[]): { total: number; reviewed: number; accuracy: number } {
  const total = words.length;
  const reviewed = words.filter((w) => w.reviewCount > 0).length;
  const totalCorrect = words.reduce((sum, w) => sum + w.correctCount, 0);
  const totalReviews = words.reduce((sum, w) => sum + w.reviewCount, 0);
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
  return { total, reviewed, accuracy };
}
