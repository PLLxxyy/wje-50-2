import { NavLink, Outlet } from 'react-router-dom';
import { Home, BookOpen, Brain, Database, Keyboard } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/words', icon: BookOpen, label: '词条管理' },
  { to: '/review', icon: Brain, label: '复习模式' },
  { to: '/import-export', icon: Database, label: '导入导出' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-xl">
                <Keyboard size={20} />
              </div>
              <h1 className="text-xl font-bold font-serif text-primary">
                输入法词库
              </h1>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'nav-item-active' : ''}`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-h-[44px] ${
                  isActive ? 'text-primary' : 'text-gray-400'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="container py-8 pb-24 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
