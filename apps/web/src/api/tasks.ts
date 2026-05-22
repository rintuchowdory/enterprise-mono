import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from './client';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@repo/shared';

export const taskKeys = {
  all: ['tasks'] as const,
  detail: (id: string) => ['tasks', id] as const,
};

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: () => get<Task[]>('/tasks'),
    select: (res) => res.data,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => get<Task>(`/tasks/${id}`),
    select: (res) => res.data,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => post<Task>('/tasks', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskInput) => patch<Task>(`/tasks/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
