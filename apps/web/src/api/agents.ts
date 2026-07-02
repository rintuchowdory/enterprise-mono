import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from './client';

export interface Agent {
  id: string;
  name: string;
  publicKey: string;
  description: string | null;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  version?: string;
}

export const agentKeys = {
  all: ['agents'] as const,
  detail: (id: string) => ['agents', id] as const,
};

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.all,
    queryFn: () => get<Agent[]>('/agents'),
    select: (res) => res.data,
    refetchInterval: 10_000,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgentInput) => post<Agent>('/agents', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.all }),
  });
}

export function useToggleAgent(id: string, isActive: boolean) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => patch<Agent>(`/agents/${id}`, { isActive: !isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.all }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/agents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.all }),
  });
}
