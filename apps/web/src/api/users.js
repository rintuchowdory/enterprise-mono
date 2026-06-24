import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from './client';
export const userKeys = { all: ['users'] };
export function useUsers() {
    return useQuery({
        queryKey: userKeys.all,
        queryFn: () => get('/users'),
        select: (res) => res.data,
    });
}
export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input) => post('/users', input),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
}
