import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Word, Group } from '../types';

interface SearchBoxProps {
  onSelect?: (word: Word) => void;
  placeholder?: string;
}

export default function SearchBox({ onSelect, placeholder = '输入拼音或关键词搜索...' }: SearchBoxProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Word[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { searchWords, groups } = useStore();

  const getGroupById = (id: string): Group | undefined => {
    return groups.find((g) => g.id === id);
  };

  const handleSearch = useCallback(
    (value: string) => {
      setKeyword(value);
      if (value.trim()) {
        const found = searchWords(value);
        setResults(found.slice(0, 8));
        setShowDropdown(found.length > 0);
        setSelectedIndex(-1);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    },
    [searchWords]
  );

  const handleSelect = (word: Word) => {
    setKeyword(word.correct);
    setShowDropdown(false);
    onSelect?.(word);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearSearch = () => {
    setKeyword('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => keyword.trim() && results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="input pl-12 pr-12 text-lg rounded-2xl h-14"
        />
        {keyword && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-card-hover overflow-hidden z-50 animate-fade-in">
          {results.map((word, index) => {
            const group = getGroupById(word.groupId);
            return (
              <button
                key={word.id}
                onClick={() => handleSelect(word)}
                className={`w-full px-4 py-3 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-primary/5'
                    : 'hover:bg-gray-50'
                } ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{word.correct}</span>
                      {group && (
                        <span
                          className="tag text-white"
                          style={{ backgroundColor: group.color }}
                        >
                          {group.icon} {group.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="font-mono">{word.pinyin}</span>
                      {word.mistakes.length > 0 && (
                        <span className="text-warning">
                          错: {word.mistakes.join('、')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
