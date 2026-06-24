import { useState } from 'react';
import { Plus, Calendar, ClipboardList } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../api/tasks';
import type { Task } from '@repo/shared';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_COLS: Task['status'][] = ['todo', 'in_progress', 'done'];

const STATUS_META: Record<Task['status'], { label: string; dot: string }> = {
  todo:        { label: 'To Do',       dot: 'bg-brand-500' },
  in_progress: { label: 'In Progress', dot: 'bg-amber-400' },
  done:        { label: 'Done',        dot: 'bg-emerald-400' },
  archived:    { label: 'Archived',    dot: 'bg-slate-600' },
};

const PRIORITY_META: Record<Task['priority'], { strip: string; badge: string; label: string }> = {
  urgent: { strip: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400',    label: 'urgent' },
  high:   { strip: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400', label: 'high' },
  medium: { strip: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-400',  label: 'medium' },
  low:    { strip: 'bg-slate-600',  badge: 'bg-slate-700 text-slate-400',   label: 'low' },
};

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  const updateTask = useUpdateTask(task.id);
  const deleteTask = useDeleteTask();
  const pm = PRIORITY_META[task.priority];

  const due = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;

  const initials = task.assigneeId
    ? task.assigneeId.slice(0, 2).toUpperCase()
    : null;

  return (
    <div className="relative bg-[#1c2030] rounded-xl border border-white/[0.06] hover:border-brand-500/40 transition-colors group overflow-hidden">
      {/* priority strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${pm.strip}`} />

      <div className="pl-4 pr-3 pt-3 pb-3">
        {/* title + delete */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[13px] font-medium text-slate-100 leading-snug">{task.title}</p>
          <button
            onClick={() => deleteTask.mutate(task.id)}
            className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex-shrink-0 mt-0.5"
            aria-label="Delete task"
          >✕</button>
        </div>

        {/* description */}
        {task.description && (
          <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* footer */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className={`text-[10px] font-mono font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${pm.badge}`}>
            {pm.label}
          </span>

          <div className="flex items-center gap-2">
            {due && (
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <Calendar size={10} />
                {due}
              </span>
            )}
            {initials && (
              <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-[9px] font-semibold text-brand-500">
                {initials}
              </div>
            )}
            <select
              value={task.status}
              onChange={(e) => updateTask.mutate({ status: e.target.value as Task['status'] })}
              className="text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-400 cursor-pointer"
            >
              {STATUS_COLS.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EmptyColumn ──────────────────────────────────────────────────────────────

function EmptyColumn({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="w-full border border-dashed border-white/[0.08] rounded-xl p-5 flex flex-col items-center gap-2 hover:border-brand-500/30 hover:bg-brand-500/[0.03] transition-all group"
    >
      <ClipboardList size={20} className="text-slate-700 group-hover:text-brand-500/50 transition-colors" />
      <span className="text-[11px] text-slate-600 group-hover:text-slate-500">Add a task</span>
    </button>
  );
}

// ─── NewTaskModal ─────────────────────────────────────────────────────────────

function NewTaskModal({
  defaultStatus,
  onClose,
}: {
  defaultStatus: Task['status'];
  onClose: () => void;
}) {
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [status, setStatus] = useState<Task['status']>(defaultStatus);

  const handleSubmit = () => {
    if (!title.trim()) return;
    createTask.mutate(
      { title: title.trim(), description: description.trim() || undefined, priority, status },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141720] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-slate-100 mb-5">New Task</h2>

        <div className="flex flex-col gap-3">
          <input
            autoFocus
            placeholder="Task title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
              >
                {(['low','medium','high','urgent'] as Task['priority'][]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
              >
                {STATUS_COLS.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || createTask.isPending}
            className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {createTask.isPending ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TaskBoard ────────────────────────────────────────────────────────────────

export function TaskBoard() {
  const { data: tasks = [], isLoading } = useTasks();
  const [modal, setModal] = useState<Task['status'] | null>(null);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
      Loading tasks…
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-lg font-semibold text-slate-100 tracking-tight">Task Board</h1>
        <button
          onClick={() => setModal('todo')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-brand-500/40 bg-brand-500/10 text-brand-500 text-[13px] font-medium hover:bg-brand-500/18 transition-colors"
        >
          <Plus size={14} />
          New task
        </button>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-3 gap-5">
        {STATUS_COLS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          const meta = STATUS_META[col];
          return (
            <div key={col} className="bg-[#141720] rounded-2xl p-4 border border-white/[0.05] flex flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    {meta.label}
                  </span>
                </div>
                <span className="text-[11px] bg-white/[0.05] text-slate-500 rounded-full px-2 py-0.5 font-medium">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              {colTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}

              {/* Empty state / add */}
              <EmptyColumn onAdd={() => setModal(col)} />
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <NewTaskModal
          defaultStatus={modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
