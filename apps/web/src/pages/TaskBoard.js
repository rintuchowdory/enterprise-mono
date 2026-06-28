import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus, Calendar, ClipboardList } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../api/tasks';
// ─── constants ────────────────────────────────────────────────────────────────
const STATUS_COLS = ['todo', 'in_progress', 'done'];
const STATUS_META = {
    todo: { label: 'To Do', dot: 'bg-brand-500' },
    in_progress: { label: 'In Progress', dot: 'bg-amber-400' },
    done: { label: 'Done', dot: 'bg-emerald-400' },
    archived: { label: 'Archived', dot: 'bg-slate-600' },
};
const PRIORITY_META = {
    urgent: { strip: 'bg-red-500', badge: 'bg-red-500/10 text-red-400', label: 'urgent' },
    high: { strip: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400', label: 'high' },
    medium: { strip: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400', label: 'medium' },
    low: { strip: 'bg-slate-600', badge: 'bg-slate-700 text-slate-400', label: 'low' },
};
// ─── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({ task }) {
    const updateTask = useUpdateTask(task.id);
    const deleteTask = useDeleteTask();
    const pm = PRIORITY_META[task.priority];
    const due = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : null;
    const initials = task.assigneeId
        ? task.assigneeId.slice(0, 2).toUpperCase()
        : null;
    return (_jsxs("div", { className: "relative bg-[#1c2030] rounded-xl border border-white/[0.06] hover:border-brand-500/40 transition-colors group overflow-hidden", children: [_jsx("div", { className: `absolute left-0 top-0 bottom-0 w-[3px] ${pm.strip}` }), _jsxs("div", { className: "pl-4 pr-3 pt-3 pb-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2 mb-1", children: [_jsx("p", { className: "text-[13px] font-medium text-slate-100 leading-snug", children: task.title }), _jsx("button", { onClick: () => deleteTask.mutate(task.id), className: "text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex-shrink-0 mt-0.5", "aria-label": "Delete task", children: "\u2715" })] }), task.description && (_jsx("p", { className: "text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed", children: task.description })), _jsxs("div", { className: "flex items-center justify-between mt-2 gap-2", children: [_jsx("span", { className: `text-[10px] font-mono font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${pm.badge}`, children: pm.label }), _jsxs("div", { className: "flex items-center gap-2", children: [due && (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-slate-600", children: [_jsx(Calendar, { size: 10 }), due] })), initials && (_jsx("div", { className: "w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-[9px] font-semibold text-brand-500", children: initials })), _jsx("select", { value: task.status, onChange: (e) => updateTask.mutate({ status: e.target.value }), className: "text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-400 cursor-pointer", children: STATUS_COLS.map((s) => (_jsx("option", { value: s, children: STATUS_META[s].label }, s))) })] })] })] })] }));
}
// ─── EmptyColumn ──────────────────────────────────────────────────────────────
function EmptyColumn({ onAdd }) {
    return (_jsxs("button", { onClick: onAdd, className: "w-full border border-dashed border-white/[0.08] rounded-xl p-5 flex flex-col items-center gap-2 hover:border-brand-500/30 hover:bg-brand-500/[0.03] transition-all group", children: [_jsx(ClipboardList, { size: 20, className: "text-slate-700 group-hover:text-brand-500/50 transition-colors" }), _jsx("span", { className: "text-[11px] text-slate-600 group-hover:text-slate-500", children: "Add a task" })] }));
}
// ─── NewTaskModal ─────────────────────────────────────────────────────────────
function NewTaskModal({ defaultStatus, onClose, }) {
    const createTask = useCreateTask();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState(defaultStatus);
    const handleSubmit = () => {
        if (!title.trim())
            return;
        createTask.mutate({ title: title.trim(), description: description.trim() || undefined, priority, status, assigneeId: null, dueDate: null }, { onSuccess: onClose });
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-[#141720] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl", children: [_jsx("h2", { className: "text-base font-semibold text-slate-100 mb-5", children: "New Task" }), _jsxs("div", { className: "flex flex-col gap-3", children: [_jsx("input", { autoFocus: true, placeholder: "Task title *", value: title, onChange: (e) => setTitle(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSubmit(), className: "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500" }), _jsx("textarea", { placeholder: "Description (optional)", value: description, onChange: (e) => setDescription(e.target.value), rows: 2, className: "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 resize-none" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] text-slate-500 mb-1 block", children: "Priority" }), _jsx("select", { value: priority, onChange: (e) => setPriority(e.target.value), className: "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500", children: ['low', 'medium', 'high', 'urgent'].map((p) => (_jsx("option", { value: p, children: p }, p))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] text-slate-500 mb-1 block", children: "Status" }), _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500", children: STATUS_COLS.map((s) => (_jsx("option", { value: s, children: STATUS_META[s].label }, s))) })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2 mt-5", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors", children: "Cancel" }), _jsx("button", { onClick: handleSubmit, disabled: !title.trim() || createTask.isPending, className: "px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50", children: createTask.isPending ? 'Creating…' : 'Create task' })] })] }) }));
}
// ─── TaskBoard ────────────────────────────────────────────────────────────────
export function TaskBoard() {
    const { data: tasks = [], isLoading } = useTasks();
    const [modal, setModal] = useState(null);
    if (isLoading)
        return (_jsx("div", { className: "flex items-center justify-center h-64 text-slate-600 text-sm", children: "Loading tasks\u2026" }));
    return (_jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-7", children: [_jsx("h1", { className: "text-lg font-semibold text-slate-100 tracking-tight", children: "Task Board" }), _jsxs("button", { onClick: () => setModal('todo'), className: "flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-brand-500/40 bg-brand-500/10 text-brand-500 text-[13px] font-medium hover:bg-brand-500/18 transition-colors", children: [_jsx(Plus, { size: 14 }), "New task"] })] }), _jsx("div", { className: "grid grid-cols-3 gap-5", children: STATUS_COLS.map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col);
                    const meta = STATUS_META[col];
                    return (_jsxs("div", { className: "bg-[#141720] rounded-2xl p-4 border border-white/[0.05] flex flex-col gap-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${meta.dot}` }), _jsx("span", { className: "text-[11px] font-semibold uppercase tracking-widest text-slate-500", children: meta.label })] }), _jsx("span", { className: "text-[11px] bg-white/[0.05] text-slate-500 rounded-full px-2 py-0.5 font-medium", children: colTasks.length })] }), colTasks.map((task) => (_jsx(TaskCard, { task: task }, task.id))), _jsx(EmptyColumn, { onAdd: () => setModal(col) })] }, col));
                }) }), modal && (_jsx(NewTaskModal, { defaultStatus: modal, onClose: () => setModal(null) }))] }));
}
