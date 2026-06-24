import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { TaskBoard } from './pages/TaskBoard';
export function App() {
    const [page, setPage] = useState('tasks');
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsxs("aside", { className: "w-56 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-1", children: [_jsxs("div", { className: "mb-6 px-2", children: [_jsx("span", { className: "text-brand-500 font-bold text-lg tracking-tight", children: "enterprise" }), _jsx("span", { className: "text-slate-400 font-mono text-xs ml-1", children: "/mono" })] }), ['tasks', 'users'].map((p) => (_jsx("button", { onClick: () => setPage(p), className: `text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${page === p
                            ? 'bg-brand-500/10 text-brand-500 font-medium'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`, children: p }, p)))] }), _jsxs("main", { className: "flex-1 p-8 overflow-auto", children: [page === 'tasks' && _jsx(TaskBoard, {}), page === 'users' && (_jsxs("div", { className: "text-slate-400", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-100 mb-2", children: "Users" }), _jsx("p", { className: "text-sm", children: "User management coming soon \u2014 same pattern as tasks." })] }))] })] }));
}
