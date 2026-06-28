import { useState } from 'react';
import { TaskBoard } from './pages/TaskBoard';
import {
  Kanban, Users, Wallet, Bot, ScrollText, ChevronRight,
} from 'lucide-react';

type Page = 'tasks' | 'users' | 'treasury' | 'agents' | 'audit';

const NAV: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'tasks',    label: 'Tasks',     icon: <Kanban size={15} /> },
  { id: 'users',    label: 'Users',     icon: <Users size={15} /> },
  { id: 'treasury', label: 'Treasury',  icon: <Wallet size={15} /> },
  { id: 'agents',   label: 'Agents',    icon: <Bot size={15} /> },
  { id: 'audit',    label: 'Audit Log', icon: <ScrollText size={15} /> },
];

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <ChevronRight size={28} className="text-slate-700" />
      <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
      <p className="text-sm text-slate-500">Coming soon — same pattern as tasks.</p>
    </div>
  );
}

export function App() {
  const [page, setPage] = useState<Page>('tasks');

  return (
    <div className="min-h-screen flex bg-[#0f1117]">
      {/* Sidebar */}
      <aside className="w-52 bg-[#0b0f1a] border-r border-white/[0.06] flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 pt-5 pb-6">
          <span className="text-brand-500 font-semibold text-[15px] tracking-tight">enterprise</span>
          <span className="text-slate-600 font-mono text-[11px] ml-1">/mono</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all text-left w-full
                ${page === id
                  ? 'bg-brand-500/10 text-brand-500 font-medium'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
            >
              {page === id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-brand-500 rounded-r-full" />
              )}
              <span className="opacity-90">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom user row */}
        <div className="mt-auto px-3 py-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-[10px] font-semibold text-brand-500 flex-shrink-0">
              RC
            </div>
            <span className="text-[12px] text-slate-500 truncate">Rintu C.</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {page === 'tasks'    && <TaskBoard />}
        {page === 'users'    && <Placeholder title="Users" />}
        {page === 'treasury' && <Placeholder title="Treasury" />}
        {page === 'agents'   && <Placeholder title="Agents" />}
        {page === 'audit'    && <Placeholder title="Audit Log" />}
      </main>
    </div>
  );
}
