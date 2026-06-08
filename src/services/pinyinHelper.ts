import { pinyin } from 'pinyin-pro';
import type { Word } from '../types';

export function getPinyinInitials(text: string): string {
  if (!text) return '';
  const result = pinyin(text, { pattern: 'first', toneType: 'none', type: 'string' });
  return result.replace(/\s/g, '').toLowerCase();
}

export function matchByPinyin(word: Word, keyword: string): boolean {
  if (!keyword) return true;
  const lowerKeyword = keyword.toLowerCase();
  if (word.pinyin && word.pinyin.toLowerCase().includes(lowerKeyword)) {
    return true;
  }
  const generatedPinyin = getPinyinInitials(word.correct);
  if (generatedPinyin.includes(lowerKeyword)) {
    return true;
  }
  if (word.mistakes && word.mistakes.length > 0) {
    for (const mistake of word.mistakes) {
      const mistakePinyin = getPinyinInitials(mistake);
      if (mistakePinyin.includes(lowerKeyword)) {
        return true;
      }
    }
  }
  return false;
}

export function matchByKeyword(word: Word, keyword: string): boolean {
  if (!keyword) return true;
  const lowerKeyword = keyword.toLowerCase();
  if (word.correct.toLowerCase().includes(lowerKeyword)) {
    return true;
  }
  if (word.scene && word.scene.toLowerCase().includes(lowerKeyword)) {
    return true;
  }
  if (word.mistakes && word.mistakes.length > 0) {
    for (const mistake of word.mistakes) {
      if (mistake.toLowerCase().includes(lowerKeyword)) {
        return true;
      }
    }
  }
  return false;
}

export function matchWord(word: Word, keyword: string): boolean {
  if (!keyword) return true;
  return matchByKeyword(word, keyword) || matchByPinyin(word, keyword);
}
