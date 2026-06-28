import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { TaskBoard } from './pages/TaskBoard';
import { Kanban, Users, Wallet, Bot, ScrollText, ChevronRight, } from 'lucide-react';
const NAV = [
    { id: 'tasks', label: 'Tasks', icon: _jsx(Kanban, { size: 15 }) },
    { id: 'users', label: 'Users', icon: _jsx(Users, { size: 15 }) },
    { id: 'treasury', label: 'Treasury', icon: _jsx(Wallet, { size: 15 }) },
    { id: 'agents', label: 'Agents', icon: _jsx(Bot, { size: 15 }) },
    { id: 'audit', label: 'Audit Log', icon: _jsx(ScrollText, { size: 15 }) },
];
function Placeholder({ title }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-64 gap-3", children: [_jsx(ChevronRight, { size: 28, className: "text-red-400" }), _jsx("h1", { className: "text-xl font-semibold text-red-900", children: title }), _jsx("p", { className: "text-sm text-red-600", children: "Coming soon \u2014 same pattern as tasks." })] }));
}
export function App() {
    const [page, setPage] = useState('tasks');
    return (_jsxs("div", { className: "min-h-screen flex bg-gradient-to-br from-white via-red-50 to-red-100", children: [_jsxs("aside", { className: "w-52 bg-gradient-to-b from-red-900 to-red-800 border-r border-red-700 flex flex-col flex-shrink-0", children: [_jsxs("div", { className: "px-5 pt-5 pb-6", children: [_jsx("span", { className: "text-white font-semibold text-[15px] tracking-tight", children: "enterprise" }), _jsx("span", { className: "text-red-300 font-mono text-[11px] ml-1", children: "/mono" })] }), _jsx("nav", { className: "flex flex-col gap-0.5 px-2", children: NAV.map(({ id, label, icon }) => (_jsxs("button", { onClick: () => setPage(id), className: `relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all text-left w-full
                ${page === id
                                ? 'bg-white/20 text-white font-medium'
                                : 'text-red-200 hover:text-white hover:bg-white/10'}`, children: [page === id && (_jsx("span", { className: "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-white rounded-r-full" })), _jsx("span", { className: "opacity-90", children: icon }), label] }, id))) }), _jsx("div", { className: "mt-auto px-3 py-4 border-t border-red-700", children: _jsxs("div", { className: "flex items-center gap-2.5 px-2", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0", children: "RC" }), _jsx("span", { className: "text-[12px] text-red-200 truncate", children: "Rintu C." })] }) })] }), _jsxs("main", { className: "flex-1 overflow-auto", children: [page === 'tasks' && _jsx(TaskBoard, {}), page === 'users' && _jsx(Placeholder, { title: "Users" }), page === 'treasury' && _jsx(Placeholder, { title: "Treasury" }), page === 'agents' && _jsx(Placeholder, { title: "Agents" }), page === 'audit' && _jsx(Placeholder, { title: "Audit Log" })] })] }));
}
