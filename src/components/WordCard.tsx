import { Edit2, Trash2 } from 'lucide-react';
import type { Word, Group } from '../types';

interface WordCardProps {
  word: Word;
  group?: Group;
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
}

export default function WordCard({ word, group, onEdit, onDelete }: WordCardProps) {
  const accuracy = word.reviewCount > 0
    ? Math.round((word.correctCount / word.reviewCount) * 100)
    : 0;

  return (
    <div className="card group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-xl font-semibold text-primary font-serif">
              {word.correct}
            </h3>
            {group && (
              <span
                className="tag text-white text-xs"
                style={{ backgroundColor: group.color }}
              >
                {group.icon} {group.name}
              </span>
            )}
            <span className="font-mono text-sm text-gray-500">
              {word.pinyin}
            </span>
          </div>

          {word.mistakes.length > 0 && (
            <div className="mb-2">
              <span className="text-sm text-warning">
                常见错法：{word.mistakes.join('、')}
              </span>
            </div>
          )}

          {word.scene && (
            <p className="text-sm text-gray-600 mb-3">{word.scene}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>复习 {word.reviewCount} 次</span>
            <span>正确率 {accuracy}%</span>
            <span>
              创建于 {new Date(word.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(word)}
            className="p-2 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors min-h-[40px] min-w-[40px]"
            title="编辑"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(word)}
            className="p-2 rounded-lg hover:bg-warning/10 text-gray-400 hover:text-warning transition-colors min-h-[40px] min-w-[40px]"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
