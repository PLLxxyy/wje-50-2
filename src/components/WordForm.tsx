import { useState, useEffect } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getPinyinInitials } from '../services/pinyinHelper';
import type { Word } from '../types';

interface WordFormProps {
  word?: Word | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function WordForm({ word, onSubmit, onCancel }: WordFormProps) {
  const { groups, addWord, updateWord } = useStore();
  const [formData, setFormData] = useState({
    correct: '',
    mistakes: [''],
    pinyin: '',
    scene: '',
    groupId: 'work',
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (word) {
      setFormData({
        correct: word.correct,
        mistakes: word.mistakes.length > 0 ? word.mistakes : [''],
        pinyin: word.pinyin,
        scene: word.scene,
        groupId: word.groupId,
      });
    }
  }, [word]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleMistakeChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newMistakes = [...prev.mistakes];
      newMistakes[index] = value;
      return { ...prev, mistakes: newMistakes };
    });
  };

  const addMistake = () => {
    setFormData((prev) => ({
      ...prev,
      mistakes: [...prev.mistakes, ''],
    }));
  };

  const removeMistake = (index: number) => {
    if (formData.mistakes.length > 1) {
      setFormData((prev) => ({
        ...prev,
        mistakes: prev.mistakes.filter((_, i) => i !== index),
      }));
    }
  };

  const generatePinyin = () => {
    if (formData.correct) {
      const pinyin = getPinyinInitials(formData.correct);
      setFormData((prev) => ({ ...prev, pinyin }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wordData = {
      ...formData,
      mistakes: formData.mistakes.filter((m) => m.trim() !== ''),
    };

    let result;
    if (word) {
      result = updateWord(word.id, wordData);
    } else {
      result = addWord(wordData);
    }

    if (result.success) {
      onSubmit();
    } else {
      setErrors(result.errors || []);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          {errors.map((error, index) => (
            <p key={index} className="text-warning text-sm">
              {error}
            </p>
          ))}
        </div>
      )}

      <div>
        <label className="label">正确写法 *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.correct}
            onChange={(e) => handleChange('correct', e.target.value)}
            placeholder="输入正确的写法"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={generatePinyin}
            className="btn-outline px-4 flex-shrink-0"
            title="自动生成拼音首字母"
          >
            <Sparkles size={18} />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">常见错法</label>
          <button
            type="button"
            onClick={addMistake}
            className="text-sm text-accent hover:text-accent-dark flex items-center gap-1 min-h-[32px] px-2"
          >
            <Plus size={16} /> 添加
          </button>
        </div>
        <div className="space-y-2">
          {formData.mistakes.map((mistake, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={mistake}
                onChange={(e) => handleMistakeChange(index, e.target.value)}
                placeholder={`常见错法 ${index + 1}`}
                className="input flex-1"
              />
              {formData.mistakes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMistake(index)}
                  className="p-2 text-gray-400 hover:text-warning transition-colors min-h-[44px] min-w-[44px]"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="label">拼音首字母</label>
        <input
          type="text"
          value={formData.pinyin}
          onChange={(e) => handleChange('pinyin', e.target.value)}
          placeholder="如：zgrm（中华人民共和国）"
          className="input font-mono"
        />
      </div>

      <div>
        <label className="label">使用场景</label>
        <textarea
          value={formData.scene}
          onChange={(e) => handleChange('scene', e.target.value)}
          placeholder="描述这个词的使用场景或记忆方法"
          rows={3}
          className="input resize-none"
        />
      </div>

      <div>
        <label className="label">分组 *</label>
        <div className="grid grid-cols-2 gap-3">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => handleChange('groupId', group.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                formData.groupId === group.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{group.icon}</span>
                <span className="font-medium">{group.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-outline flex-1">
          取消
        </button>
        <button type="submit" className="btn-primary flex-1">
          {word ? '保存修改' : '添加词条'}
        </button>
      </div>
    </form>
  );
}
