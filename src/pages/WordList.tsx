import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import SearchBox from '../components/SearchBox';
import WordCard from '../components/WordCard';
import Modal from '../components/Modal';
import WordForm from '../components/WordForm';
import type { Word } from '../types';

export default function WordList() {
  const [searchParams] = useSearchParams();
  const { words, groups, getWordsByGroup, deleteWord } = useStore();
  const [activeGroup, setActiveGroup] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Word | null>(null);
  const [filteredWords, setFilteredWords] = useState<Word[]>(words);

  useEffect(() => {
    const groupParam = searchParams.get('group');
    if (groupParam) {
      setActiveGroup(groupParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let result = activeGroup === 'all' ? words : getWordsByGroup(activeGroup);
    
    if (searchKeyword.trim()) {
      const { searchWords } = useStore.getState();
      result = searchWords(searchKeyword);
      if (activeGroup !== 'all') {
        result = result.filter((w) => w.groupId === activeGroup);
      }
    }
    
    setFilteredWords(result);
  }, [activeGroup, searchKeyword, words, getWordsByGroup]);

  const handleSearch = (word: Word) => {
    setSearchKeyword(word.correct);
  };

  const handleEdit = (word: Word) => {
    setEditingWord(word);
  };

  const handleDelete = (word: Word) => {
    setShowDeleteConfirm(word);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteWord(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
    }
  };

  const getGroup = (id: string) => groups.find((g) => g.id === id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-primary">词条管理</h1>
          <p className="text-gray-500">共 {filteredWords.length} 个词条</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} />
          新增词条
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBox
            onSelect={handleSearch}
            placeholder="搜索词条..."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveGroup('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
            activeGroup === 'all'
              ? 'bg-primary text-white'
              : 'bg-white text-primary hover:bg-primary/10'
          }`}
        >
          全部 ({words.length})
        </button>
        {groups.map((group) => {
          const count = words.filter((w) => w.groupId === group.id).length;
          return (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
                activeGroup === group.id
                  ? 'text-white'
                  : 'bg-white text-primary hover:bg-primary/10'
              }`}
              style={{
                backgroundColor: activeGroup === group.id ? group.color : undefined,
              }}
            >
              {group.icon} {group.name} ({count})
            </button>
          );
        })}
      </div>

      {filteredWords.length > 0 ? (
        <div className="grid gap-4">
          {filteredWords.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              group={getGroup(word.groupId)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {searchKeyword ? '没有找到匹配的词条' : '该分组暂无词条'}
          </h3>
          <p className="text-gray-400 mb-4">
            {searchKeyword ? '试试其他关键词' : '点击上方按钮添加第一个词条'}
          </p>
          {!searchKeyword && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={18} />
              添加词条
            </button>
          )}
        </div>
      )}

      <Modal
        isOpen={showAddModal || !!editingWord}
        onClose={() => {
          setShowAddModal(false);
          setEditingWord(null);
        }}
        title={editingWord ? '编辑词条' : '添加新词条'}
      >
        <WordForm
          word={editingWord}
          onSubmit={() => {
            setShowAddModal(false);
            setEditingWord(null);
          }}
          onCancel={() => {
            setShowAddModal(false);
            setEditingWord(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="确认删除"
        maxWidth="max-w-md"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-warning" />
          </div>
          <p className="text-gray-600 mb-2">
            确定要删除词条 <span className="font-semibold text-primary">"{showDeleteConfirm?.correct}"</span> 吗？
          </p>
          <p className="text-sm text-gray-400 mb-6">此操作不可撤销</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="btn-outline flex-1"
            >
              取消
            </button>
            <button onClick={confirmDelete} className="btn-danger flex-1">
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
