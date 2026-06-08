import { useState, useRef } from 'react';
import { Upload, Download, FileJson, FileText, Database, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { importTemplate } from '../data/initialData';
import type { ImportResult } from '../types';

export default function ImportExport() {
  const { importWords, exportJSON, exportText, resetAllData, loadSampleData, words } = useStore();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let data: unknown;
        
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          data = Array.isArray(parsed) ? parsed : parsed.words;
        } else {
          const lines = content.split('\n').filter((l) => l.trim());
          data = lines.map((line) => ({
            correct: line.trim(),
            mistakes: [],
            pinyin: '',
            scene: '',
            groupId: 'work',
          }));
        }

        const result = importWords(data);
        setImportResult(result);
      } catch (error) {
        setImportResult({
          success: 0,
          failed: 1,
          errors: ['文件解析失败，请检查文件格式'],
        });
      }
    };
    reader.readAsText(file);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const content = exportJSON();
    const filename = `word-library-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(content, filename, 'application/json');
  };

  const handleExportText = () => {
    const content = exportText();
    const filename = `word-library-${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(content, filename, 'text/plain');
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(importTemplate);
  };

  const handleReset = () => {
    resetAllData();
    setShowResetConfirm(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 bg-warning rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
          <Database size={28} />
        </div>
        <h1 className="text-2xl font-bold font-serif text-primary mb-2">导入导出</h1>
        <p className="text-gray-500">批量管理你的词库数据</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Upload size={20} />
          批量导入
        </h2>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-accent bg-accent/5'
              : 'border-gray-300 hover:border-primary hover:bg-primary/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-primary font-medium mb-1">
            拖拽文件到这里，或点击选择文件
          </p>
          <p className="text-sm text-gray-500">支持 JSON 和 TXT 格式</p>
        </div>

        {importResult && (
          <div className={`mt-4 p-4 rounded-xl animate-slide-up ${
            importResult.failed === 0
              ? 'bg-accent/10 border border-accent/30'
              : importResult.success === 0
              ? 'bg-warning/10 border border-warning/30'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {importResult.failed === 0 ? (
                <CheckCircle size={20} className="text-accent" />
              ) : (
                <AlertTriangle size={20} className="text-warning" />
              )}
              <span className="font-medium">
                导入完成：成功 {importResult.success} 条，失败 {importResult.failed} 条
              </span>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {importResult.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircle size={14} className="text-warning mt-0.5 flex-shrink-0" />
                    {error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">JSON 导入格式模板</span>
            <button
              onClick={handleCopyTemplate}
              className="text-sm text-accent hover:text-accent-dark min-h-[32px]"
            >
              复制模板
            </button>
          </div>
          <pre className="text-xs text-gray-600 bg-white p-3 rounded-lg overflow-x-auto scrollbar-thin">
            {importTemplate}
          </pre>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Download size={20} />
          数据导出
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportJSON}
            disabled={words.length === 0}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileJson size={24} className="text-primary" />
              </div>
              <div>
                <div className="font-medium text-primary">导出 JSON</div>
                <div className="text-sm text-gray-500">完整数据备份，可用于恢复</div>
              </div>
            </div>
          </button>
          <button
            onClick={handleExportText}
            disabled={words.length === 0}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-accent" />
              </div>
              <div>
                <div className="font-medium text-primary">导出词库文本</div>
                <div className="text-sm text-gray-500">纯文本格式，可导入输入法</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-warning" />
          数据管理
        </h2>
        <div className="space-y-4">
          <button
            onClick={() => loadSampleData()}
            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-accent hover:bg-accent/5 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-accent" />
              </div>
              <div>
                <div className="font-medium text-primary">加载示例数据</div>
                <div className="text-sm text-gray-500">添加预设的示例词条</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full p-4 rounded-xl border-2 border-warning/30 hover:border-warning hover:bg-warning/5 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <XCircle size={20} className="text-warning" />
              </div>
              <div>
                <div className="font-medium text-warning">重置所有数据</div>
                <div className="text-sm text-gray-500">清空所有词条，恢复初始状态</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative glass-modal w-full max-w-md p-6 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">确认重置</h3>
              <p className="text-gray-600 mb-2">
                确定要清空所有数据吗？
              </p>
              <p className="text-sm text-gray-400 mb-6">
                所有词条将被删除，此操作不可撤销
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-outline flex-1"
                >
                  取消
                </button>
                <button onClick={handleReset} className="btn-danger flex-1">
                  确认重置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
