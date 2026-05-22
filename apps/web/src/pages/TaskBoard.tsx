import { useTasks, useUpdateTask, useDeleteTask } from '../api/tasks';
import type { Task } from '@repo/shared';

const STATUS_COLS: Task['status'][] = ['todo', 'in_progress', 'done'];
const STATUS_LABEL: Record<Task['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  archived: 'Archived',
};
const PRIORITY_COLOR: Record<Task['priority'], string> = {
  low: 'text-slate-400',
  medium: 'text-sky-400',
  high: 'text-orange-400',
  urgent: 'text-red-500',
};

function TaskCard({ task }: { task: Task }) {
  const updateTask = useUpdateTask(task.id);
  const deleteTask = useDeleteTask();

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-brand-500 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-100 leading-snug">{task.title}</p>
        <button
          onClick={() => deleteTask.mutate(task.id)}
          className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
        >✕</button>
      </div>
      {task.description && (
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs font-mono uppercase ${PRIORITY_COLOR[task.priority]}`}>
          {task.priority}
        </span>
        <select
          value={task.status}
          onChange={(e) => updateTask.mutate({ status: e.target.value as Task['status'] })}
          className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-slate-300 cursor-pointer"
        >
          {STATUS_COLS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>
    </div>
  );
}

export function TaskBoard() {
  const { data: tasks = [], isLoading } = useTasks();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Task Board</h1>
      <div className="grid grid-cols-3 gap-6">
        {STATUS_COLS.map((col) => (
          <div key={col} className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                {STATUS_LABEL[col]}
              </h2>
              <span className="text-xs bg-slate-800 text-slate-400 rounded-full px-2 py-0.5">
                {tasks.filter((t) => t.status === col).length}
              </span>
            </div>
            <div className="space-y-3">
              {tasks.filter((t) => t.status === col).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
