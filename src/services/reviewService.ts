import type { Word, Question, QuestionType, ReviewRecord } from '../types';

export interface WrongWord extends Word {
  wrongCount: number;
  lastWrongTime: number;
}

export function generateChoiceQuestion(word: Word, allWords: Word[]): Question {
  const otherWords = allWords.filter((w) => w.id !== word.id);
  const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 3).map((w) => w.correct);
  
  while (distractors.length < 3) {
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    if (randomWord && randomWord.id !== word.id && !distractors.includes(randomWord.correct)) {
      distractors.push(randomWord.correct);
    } else if (allWords.length < 4) {
      distractors.push(`干扰项${distractors.length + 1}`);
    }
  }
  
  const options = [word.correct, ...distractors].sort(() => Math.random() - 0.5);
  
  return {
    word,
    type: 'choice',
    options,
  };
}

export function generateFillQuestion(word: Word): Question {
  return {
    word,
    type: 'fill',
  };
}

export function generateQuestions(
  words: Word[],
  allWords: Word[],
  count: number,
  type: QuestionType
): Question[] {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const selectedWords = shuffled.slice(0, Math.min(count, shuffled.length));
  
  return selectedWords.map((word) => {
    if (type === 'choice') {
      return generateChoiceQuestion(word, allWords);
    }
    return generateFillQuestion(word);
  });
}

export function checkAnswer(question: Question, answer: string): boolean {
  const normalizedAnswer = answer.trim().toLowerCase();
  const normalizedCorrect = question.word.correct.trim().toLowerCase();
  return normalizedAnswer === normalizedCorrect;
}

export function createReviewRecord(wordId: string, isCorrect: boolean): ReviewRecord {
  return {
    wordId,
    isCorrect,
    timestamp: Date.now(),
  };
}

export function updateWordStats(word: Word, isCorrect: boolean): Word {
  return {
    ...word,
    reviewCount: word.reviewCount + 1,
    correctCount: word.correctCount + (isCorrect ? 1 : 0),
  };
}

export function getMistakeHint(word: Word): string {
  if (word.mistakes && word.mistakes.length > 0) {
    return `常见错法: ${word.mistakes.join('、')}`;
  }
  return '';
}

export function getQuestionPrompt(question: Question): string {
  if (question.type === 'choice') {
    return `请选择 "${question.word.pinyin}" 对应的正确写法:`;
  }
  if (question.word.mistakes.length > 0) {
    const mistake = question.word.mistakes[Math.floor(Math.random() * question.word.mistakes.length)];
    return `请写出 "${mistake}" 的正确写法:`;
  }
  return `请写出 "${question.word.pinyin}" 对应的正确写法:`;
}

export function getWrongWords(words: Word[], reviewRecords: ReviewRecord[]): WrongWord[] {
  const wrongMap = new Map<string, { count: number; lastTime: number }>();

  reviewRecords.forEach((record) => {
    if (!record.isCorrect) {
      const existing = wrongMap.get(record.wordId);
      if (existing) {
        wrongMap.set(record.wordId, {
          count: existing.count + 1,
          lastTime: Math.max(existing.lastTime, record.timestamp),
        });
      } else {
        wrongMap.set(record.wordId, {
          count: 1,
          lastTime: record.timestamp,
        });
      }
    }
  });

  const wrongWords: WrongWord[] = [];
  wrongMap.forEach((data, wordId) => {
    const word = words.find((w) => w.id === wordId);
    if (word) {
      wrongWords.push({
        ...word,
        wrongCount: data.count,
        lastWrongTime: data.lastTime,
      });
    }
  });

  return wrongWords.sort((a, b) => b.wrongCount - a.wrongCount || b.lastWrongTime - a.lastWrongTime);
}
