import { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, CheckCircle, XCircle, ChevronRight, Brain, ListChecks, Edit3 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getQuestionPrompt, getMistakeHint } from '../services/reviewService';
import type { QuestionType, Word } from '../types';

export default function Review() {
  const { words, groups, startReview, reviewSession, answerQuestion, nextQuestion, resetReview } = useStore();
  const [questionType, setQuestionType] = useState<QuestionType>('choice');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [fillAnswer, setFillAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const fillInputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = reviewSession?.questions[reviewSession.currentIndex];
  const isAnswered = currentQuestion?.isCorrect !== undefined;

  useEffect(() => {
    if (currentQuestion?.type === 'fill' && !isAnswered) {
      setTimeout(() => fillInputRef.current?.focus(), 100);
    }
  }, [currentQuestion, isAnswered]);

  const handleStart = () => {
    startReview(questionCount, questionType, selectedGroup);
  };

  const handleChoiceAnswer = (option: string) => {
    if (isAnswered) return;
    answerQuestion(option);
  };

  const handleFillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !fillAnswer.trim()) return;
    answerQuestion(fillAnswer);
  };

  const handleNext = () => {
    if (reviewSession?.isFinished) {
      return;
    }
    nextQuestion();
    setFillAnswer('');
    setShowHint(false);
  };

  const handleRestart = () => {
    resetReview();
    setFillAnswer('');
    setShowHint(false);
  };

  const getGroup = (id: string) => groups.find((g) => g.id === id);

  const getOptionClass = (option: string) => {
    if (!isAnswered) {
      return 'border-2 border-gray-200 hover:border-primary hover:bg-primary/5';
    }
    if (option === currentQuestion?.word.correct) {
      return 'border-2 border-accent bg-accent/10 text-accent shadow-glow';
    }
    if (option === currentQuestion?.userAnswer && !currentQuestion?.isCorrect) {
      return 'border-2 border-warning bg-warning/10 text-warning shadow-glow-error';
    }
    return 'border-2 border-gray-200 opacity-50';
  };

  const groupWordCounts = groups.map((g) => ({
    ...g,
    count: words.filter((w) => w.groupId === g.id).length,
  }));

  if (!reviewSession) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white mx-auto mb-4">
            <Brain size={36} />
          </div>
          <h1 className="text-3xl font-bold font-serif text-primary mb-2">复习模式</h1>
          <p className="text-gray-500">通过随机测验纠正你的输入习惯</p>
        </div>

        <div className="card space-y-6">
          <div>
            <label className="label">题型选择</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setQuestionType('choice')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  questionType === 'choice'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    questionType === 'choice' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <ListChecks size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-primary">选择题</div>
                    <div className="text-sm text-gray-500">四选一，识别正确写法</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setQuestionType('fill')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  questionType === 'fill'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    questionType === 'fill' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-primary">填空题</div>
                    <div className="text-sm text-gray-500">写出正确写法</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="label">选择分组</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
                  selectedGroup === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-white text-primary hover:bg-primary/10 border border-gray-200'
                }`}
              >
                全部 ({words.length})
              </button>
              {groupWordCounts.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  disabled={group.count === 0}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
                    selectedGroup === group.id
                      ? 'text-white'
                      : group.count === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-primary hover:bg-primary/10 border border-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedGroup === group.id ? group.color : undefined,
                  }}
                >
                  {group.icon} {group.name} ({group.count})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">题目数量</label>
            <div className="flex gap-3">
              {[5, 10, 20, 30].map((count) => {
                const availableCount = selectedGroup === 'all'
                  ? words.length
                  : words.filter((w) => w.groupId === selectedGroup).length;
                const isDisabled = count > availableCount;
                return (
                  <button
                    key={count}
                    onClick={() => !isDisabled && setQuestionCount(Math.min(count, availableCount))}
                    disabled={isDisabled}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all min-h-[44px] ${
                      questionCount === count
                        ? 'bg-primary text-white'
                        : isDisabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-primary hover:border-primary'
                    }`}
                  >
                    {count > availableCount ? availableCount : count} 题
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={words.length === 0 || (selectedGroup !== 'all' && words.filter((w) => w.groupId === selectedGroup).length === 0)}
            className="btn-accent w-full text-lg py-4"
          >
            <Play size={20} />
            开始复习
          </button>
        </div>
      </div>
    );
  }

  if (reviewSession.isFinished) {
    const accuracy = reviewSession.questions.length > 0
      ? Math.round((reviewSession.correctCount / reviewSession.questions.length) * 100)
      : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="card text-center py-12">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            accuracy >= 80 ? 'bg-accent/10' : accuracy >= 60 ? 'bg-warning/10' : 'bg-red-100'
          }`}>
            <span className={`text-5xl ${
              accuracy >= 80 ? 'text-accent' : accuracy >= 60 ? 'text-warning' : 'text-red-500'
            }`}>
              {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-primary mb-2">
            {accuracy >= 80 ? '太棒了！' : accuracy >= 60 ? '不错！' : '继续加油！'}
          </h2>
          <p className="text-gray-500 mb-8">本轮复习完成</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div>
              <div className="text-3xl font-bold text-primary">
                {reviewSession.questions.length}
              </div>
              <p className="text-sm text-gray-500">总题数</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent">
                {reviewSession.correctCount}
              </div>
              <p className="text-sm text-gray-500">正确</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-warning">
                {reviewSession.wrongWords.length}
              </div>
              <p className="text-sm text-gray-500">错误</p>
            </div>
          </div>

          <div className="text-5xl font-bold text-primary mb-2">{accuracy}%</div>
          <p className="text-gray-500 mb-8">正确率</p>

          {reviewSession.wrongWords.length > 0 && (
            <div className="text-left mb-8">
              <h3 className="font-semibold text-primary mb-3">需要加强的词条：</h3>
              <div className="space-y-2">
                {reviewSession.wrongWords.map((word: Word) => {
                  const group = getGroup(word.groupId);
                  return (
                    <div
                      key={word.id}
                      className="bg-warning/5 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{group?.icon}</span>
                        <div>
                          <span className="font-medium text-primary">{word.correct}</span>
                          <span className="text-sm text-gray-500 ml-2 font-mono">
                            {word.pinyin}
                          </span>
                        </div>
                      </div>
                      {word.mistakes.length > 0 && (
                        <span className="text-xs text-warning">
                          错：{word.mistakes.join('、')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={handleRestart} className="btn-primary w-full">
            <RotateCcw size={18} />
            再来一轮
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const group = getGroup(currentQuestion.word.groupId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={handleRestart} className="btn-ghost text-sm">
          <RotateCcw size={16} />
          退出
        </button>
        <div className="flex items-center gap-2">
          <span className="text-primary font-medium">
            {reviewSession.currentIndex + 1} / {reviewSession.questions.length}
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{
                width: `${((reviewSession.currentIndex + 1) / reviewSession.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle size={16} />
          <span className="font-medium">{reviewSession.correctCount}</span>
        </div>
      </div>

      <div className="card animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          {group && (
            <span
              className="tag text-white text-xs"
              style={{ backgroundColor: group.color }}
            >
              {group.icon} {group.name}
            </span>
          )}
        </div>

        <p className="text-lg text-primary mb-6">{getQuestionPrompt(currentQuestion)}</p>

        {currentQuestion.type === 'choice' ? (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleChoiceAnswer(option)}
                disabled={isAnswered}
                className={`w-full p-4 rounded-xl text-left transition-all min-h-[56px] ${getOptionClass(option)} ${
                  !isAnswered ? 'hover:scale-[1.01]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium">{option}</span>
                  {isAnswered && option === currentQuestion.word.correct && (
                    <CheckCircle size={20} className="ml-auto text-accent" />
                  )}
                  {isAnswered && option === currentQuestion.userAnswer && !currentQuestion.isCorrect && (
                    <XCircle size={20} className="ml-auto text-warning" />
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleFillSubmit} className="space-y-4">
            <input
              ref={fillInputRef}
              type="text"
              value={fillAnswer}
              onChange={(e) => setFillAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="请输入正确写法..."
              className={`input text-lg text-center font-serif ${
                isAnswered
                  ? currentQuestion.isCorrect
                    ? 'border-accent'
                    : 'border-warning'
                  : ''
              }`}
            />
            {!isAnswered && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-sm text-gray-500 hover:text-primary min-h-[32px]"
                >
                  {showHint ? '隐藏提示' : '显示提示'}
                </button>
                {showHint && (
                  <p className="text-sm text-warning mt-2 animate-fade-in">
                    {getMistakeHint(currentQuestion.word) || `首字母: ${currentQuestion.word.pinyin}`}
                  </p>
                )}
              </div>
            )}
            {!isAnswered && (
              <button type="submit" disabled={!fillAnswer.trim()} className="btn-primary w-full">
                提交答案
              </button>
            )}
          </form>
        )}

        {isAnswered && (
          <div className={`mt-6 p-4 rounded-xl animate-slide-up ${
            currentQuestion.isCorrect ? 'bg-accent/10' : 'bg-warning/10'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {currentQuestion.isCorrect ? (
                <><CheckCircle size={20} className="text-accent" />
                <span className="font-semibold text-accent">回答正确！</span></>
              ) : (
                <><XCircle size={20} className="text-warning" />
                <span className="font-semibold text-warning">回答错误</span></>
              )}
            </div>
            {!currentQuestion.isCorrect && (
              <p className="text-primary">
                正确答案：<span className="font-semibold font-serif">{currentQuestion.word.correct}</span>
              </p>
            )}
            {currentQuestion.word.scene && (
              <p className="text-sm text-gray-500 mt-2">
                {currentQuestion.word.scene}
              </p>
            )}
            <button
              onClick={handleNext}
              className="btn-primary w-full mt-4"
            >
              {reviewSession.currentIndex < reviewSession.questions.length - 1 ? (
                <>
                  下一题
                  <ChevronRight size={18} />
                </>
              ) : (
                '查看结果'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
