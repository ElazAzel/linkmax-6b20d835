/**
 * Hook: Manage tasks for a zone (React Query)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';

// ─── Types ───
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ZoneTask {
  id: string;
  zone_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  contact_id: string | null;
  deal_id: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Query Keys ───
export const zoneTasksKeys = {
  all: (zoneId: string) => ['zone-tasks', zoneId] as const,
};

// ─── Fetch ───
async function fetchTasks(zoneId: string): Promise<ZoneTask[]> {
  const { data, error } = await supabase
    .from('zone_tasks')
    .select('*')
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ZoneTask[];
}

// ─── Hook ───
export function useZoneTasks(zoneId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: zoneTasksKeys.all(safeZoneId),
    queryFn: () => fetchTasks(safeZoneId),
    enabled: !!zoneId,
    staleTime: 15_000,
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: zoneTasksKeys.all(safeZoneId) });
  };

  const createTaskMutation = useMutation({
    mutationFn: async (task: Partial<ZoneTask>) => {
      if (!zoneId) throw new Error('No zone selected');
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('zone_tasks')
        .insert({
          ...task,
          zone_id: zoneId,
          created_by: userId || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
        })
        .select()
        .single();
      if (error) throw error;
      return data as ZoneTask;
    },
    onSuccess: invalidateTasks,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<ZoneTask> }) => {
      const { error } = await supabase
        .from('zone_tasks')
        .update(updates)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: invalidateTasks,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('zone_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: invalidateTasks,
  });

  // Backward-compatible API
  const createTask = async (task: Partial<ZoneTask>) => createTaskMutation.mutateAsync(task);
  const updateTask = async (taskId: string, updates: Partial<ZoneTask>) => updateTaskMutation.mutateAsync({ taskId, updates });
  const deleteTask = async (taskId: string) => deleteTaskMutation.mutateAsync(taskId);

  return { tasks, loading, createTask, updateTask, deleteTask, refetch: invalidateTasks };
}
