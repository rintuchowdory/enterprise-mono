import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from './client';
export const taskKeys = {
    all: ['tasks'],
    detail: (id) => ['tasks', id],
};
export function useTasks() {
    return useQuery({
        queryKey: taskKeys.all,
        queryFn: () => get('/tasks'),
        select: (res) => res.data,
    });
}
export function useTask(id) {
    return useQuery({
        queryKey: taskKeys.detail(id),
        queryFn: () => get(`/tasks/${id}`),
        select: (res) => res.data,
    });
}
export function useCreateTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input) => post('/tasks', input),
        onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    });
}
export function useUpdateTask(id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input) => patch(`/tasks/${id}`, input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: taskKeys.all });
            qc.invalidateQueries({ queryKey: taskKeys.detail(id) });
        },
    });
}
export function useDeleteTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => del(`/tasks/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    });
}
