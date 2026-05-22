import { useState } from 'react';
import { TaskBoard } from './pages/TaskBoard';

type Page = 'tasks' | 'users';

export function App() {
  const [page, setPage] = useState<Page>('tasks');

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-1">
        <div className="mb-6 px-2">
          <span className="text-brand-500 font-bold text-lg tracking-tight">enterprise</span>
          <span className="text-slate-400 font-mono text-xs ml-1">/mono</span>
        </div>
        {(['tasks', 'users'] as Page[]).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
              page === p
                ? 'bg-brand-500/10 text-brand-500 font-medium'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
      </aside>
      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {page === 'tasks' && <TaskBoard />}
        {page === 'users' && (
          <div className="text-slate-400">
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Users</h1>
            <p className="text-sm">User management coming soon — same pattern as tasks.</p>
          </div>
        )}
      </main>
    </div>
  );
}
