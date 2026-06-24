import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTasks, useUpdateTask, useDeleteTask } from '../api/tasks';
const STATUS_COLS = ['todo', 'in_progress', 'done'];
const STATUS_LABEL = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    archived: 'Archived',
};
const PRIORITY_COLOR = {
    low: 'text-slate-400',
    medium: 'text-sky-400',
    high: 'text-orange-400',
    urgent: 'text-red-500',
};
function TaskCard({ task }) {
    const updateTask = useUpdateTask(task.id);
    const deleteTask = useDeleteTask();
    return (_jsxs("div", { className: "bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-brand-500 transition-colors group", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("p", { className: "text-sm font-medium text-slate-100 leading-snug", children: task.title }), _jsx("button", { onClick: () => deleteTask.mutate(task.id), className: "text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs", children: "\u2715" })] }), task.description && (_jsx("p", { className: "text-xs text-slate-400 mt-1 line-clamp-2", children: task.description })), _jsxs("div", { className: "flex items-center justify-between mt-3", children: [_jsx("span", { className: `text-xs font-mono uppercase ${PRIORITY_COLOR[task.priority]}`, children: task.priority }), _jsx("select", { value: task.status, onChange: (e) => updateTask.mutate({ status: e.target.value }), className: "text-xs bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-slate-300 cursor-pointer", children: STATUS_COLS.map((s) => _jsx("option", { value: s, children: STATUS_LABEL[s] }, s)) })] })] }));
}
export function TaskBoard() {
    const { data: tasks = [], isLoading } = useTasks();
    if (isLoading)
        return (_jsx("div", { className: "flex items-center justify-center h-64 text-slate-400", children: "Loading..." }));
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-100 mb-6", children: "Task Board" }), _jsx("div", { className: "grid grid-cols-3 gap-6", children: STATUS_COLS.map((col) => (_jsxs("div", { className: "bg-slate-900 rounded-2xl p-4 border border-slate-800", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-300 uppercase tracking-wider", children: STATUS_LABEL[col] }), _jsx("span", { className: "text-xs bg-slate-800 text-slate-400 rounded-full px-2 py-0.5", children: tasks.filter((t) => t.status === col).length })] }), _jsx("div", { className: "space-y-3", children: tasks.filter((t) => t.status === col).map((task) => (_jsx(TaskCard, { task: task }, task.id))) })] }, col))) })] }));
}
