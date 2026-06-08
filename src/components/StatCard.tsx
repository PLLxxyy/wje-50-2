import type { Group } from '../types';

interface StatCardProps {
  group: Group & { count: number };
  onClick?: () => void;
}

export default function StatCard({ group, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="card text-left group hover:scale-[1.02] transition-transform"
      style={{ borderLeft: `4px solid ${group.color}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl mb-2">{group.icon}</div>
          <h3 className="text-lg font-semibold text-primary mb-1">{group.name}</h3>
          <p className="text-gray-500 text-sm">
            {group.count} 个词条
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${group.color}15` }}
        >
          <span style={{ color: group.color }}>{group.count}</span>
        </div>
      </div>
    </button>
  );
}
