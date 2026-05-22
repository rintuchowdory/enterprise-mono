import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from './client';
import type { User, CreateUserInput, UpdateUserInput } from '@repo/shared';

export const userKeys = { all: ['users'] as const };

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => get<User[]>('/users'),
    select: (res) => res.data,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => post<User>('/users', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
