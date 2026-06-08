import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Brain, Database, Target, TrendingUp, BookOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import SearchBox from '../components/SearchBox';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import WordForm from '../components/WordForm';
import type { Word } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { getGroupStats, getReviewStats, words } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const groupStats = getGroupStats();
  const reviewStats = getReviewStats();

  const handleSearchSelect = (word: Word) => {
    setSelectedWord(word);
  };

  const quickActions = [
    { icon: Plus, label: '新增词条', onClick: () => setShowAddModal(true), color: 'bg-accent' },
    { icon: Brain, label: '开始复习', onClick: () => navigate('/review'), color: 'bg-primary' },
    { icon: Database, label: '导入导出', onClick: () => navigate('/import-export'), color: 'bg-warning' },
    { icon: BookOpen, label: '词条管理', onClick: () => navigate('/words'), color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-serif text-primary mb-3">
          输入法词库管理工具
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          收录你容易打错的词、行业术语、朋友昵称，通过复习纠正输入习惯
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <SearchBox onSelect={handleSearchSelect} placeholder="输入拼音或关键词快速搜索..." />
      </div>

      {selectedWord && (
        <div className="max-w-2xl mx-auto animate-slide-up">
          <div className="card border-l-4 border-accent">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold font-serif text-primary">
                    {selectedWord.correct}
                  </h3>
                  <span className="font-mono text-sm text-gray-500">
                    {selectedWord.pinyin}
                  </span>
                </div>
                {selectedWord.mistakes.length > 0 && (
                  <p className="text-warning text-sm mb-2">
                    常见错法：{selectedWord.mistakes.join('、')}
                  </p>
                )}
                {selectedWord.scene && (
                  <p className="text-gray-600 text-sm">{selectedWord.scene}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedWord(null)}
                className="text-gray-400 hover:text-primary transition-colors p-2"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="card text-center group hover:scale-[1.02] transition-all"
          >
            <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon size={24} />
            </div>
            <span className="font-medium text-primary">{action.label}</span>
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold font-serif text-primary mb-4 flex items-center gap-2">
          <Target size={20} />
          词库概览
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupStats.map((group) => (
            <StatCard
              key={group.id}
              group={group}
              onClick={() => navigate(`/words?group=${group.id}`)}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold font-serif text-primary mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          复习统计
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary mb-1">
              {reviewStats.total}
            </div>
            <p className="text-gray-500">总词条数</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-accent mb-1">
              {reviewStats.reviewed}
            </div>
            <p className="text-gray-500">已复习</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-warning mb-1">
              {reviewStats.accuracy}%
            </div>
            <p className="text-gray-500">正确率</p>
          </div>
        </div>
      </div>

      {words.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold font-serif text-primary mb-4">
            最近添加
          </h2>
          <div className="grid gap-3">
            {[...words]
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 5)
              .map((word) => {
                const group = groupStats.find((g) => g.id === word.groupId);
                return (
                  <div
                    key={word.id}
                    className="card py-4 cursor-pointer hover:scale-[1.01] transition-transform"
                    onClick={() => setSelectedWord(word)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{group?.icon}</span>
                        <div>
                          <div className="font-semibold text-primary">
                            {word.correct}
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            {word.pinyin}
                          </div>
                        </div>
                      </div>
                      {word.mistakes.length > 0 && (
                        <span className="text-xs text-warning">
                          易错词
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加新词条"
      >
        <WordForm
          onSubmit={() => setShowAddModal(false)}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  );
}
