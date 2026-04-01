import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import type { ZoneTask, TaskStatus, TaskPriority, ZoneTaskChecklistItem } from '@/types/zones';
import type { Json } from '@/platform/supabase/types';

export type { TaskStatus, TaskPriority, ZoneTask };

// ─── Query Keys ───
export const zoneTasksKeys = {
  all: (zoneId: string) => ['zone-tasks', zoneId] as const,
  checklist: (zoneId: string, taskId: string) => ['zone-task-checklist', zoneId, taskId] as const,
  comments: (zoneId: string, taskId: string) => ['zone-task-comments', zoneId, taskId] as const,
};

// ─── Fetch ───
async function fetchTasks(zoneId: string): Promise<ZoneTask[]> {
  const { data, error } = await supabase
    .from('zone_tasks')
    .select('*')
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ZoneTask[];
}

async function fetchChecklist(zoneId: string, taskId: string): Promise<ZoneTaskChecklistItem[]> {
  const { data, error } = await (supabase as any)
    .from('zone_task_checklist')
    .select('*')
    .eq('task_id', taskId)
    .order('order_index');
  if (error) throw error;
  return (data || []) as ZoneTaskChecklistItem[];
}

async function fetchComments(zoneId: string, taskId: string) {
  const { data, error } = await (supabase as any)
    .from('zone_task_comments')
    .select('*, user:user_id(email, raw_user_meta_data)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ─── Hook: All Zone Tasks ───
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
      return data as unknown as ZoneTask;
    },
    onSuccess: invalidateTasks,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<ZoneTask> }) => {
      const { error } = await supabase
        .from('zone_tasks')
        .update(updates as any)
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

  const createTask = async (task: Partial<ZoneTask>) => createTaskMutation.mutateAsync(task);
  const updateTask = async (taskId: string, updates: Partial<ZoneTask>) => updateTaskMutation.mutateAsync({ taskId, updates });
  const deleteTask = async (taskId: string) => deleteTaskMutation.mutateAsync(taskId);

  return { tasks, loading, createTask, updateTask, deleteTask, refetch: invalidateTasks };
}

// ─── Hook: Task Checklist ───
export function useZoneTaskChecklist(zoneId: string | null, taskId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';
  const safeTaskId = taskId || '';

  const { data: checklist = [], isLoading: loading } = useQuery({
    queryKey: zoneTasksKeys.checklist(safeZoneId, safeTaskId),
    queryFn: () => fetchChecklist(safeZoneId, safeTaskId),
    enabled: !!zoneId && !!taskId,
    staleTime: 30_000,
  });

  const addItem = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await (supabase
        .from('zone_task_checklist' as any)
        .insert({
          task_id: taskId,
          zone_id: zoneId,
          title,
          is_done: false,
          order_index: checklist.length,
        }) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneTasksKeys.checklist(safeZoneId, safeTaskId) }),
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, is_done }: { id: string; is_done: boolean }) => {
      const { error } = await (supabase
        .from('zone_task_checklist' as any)
        .update({ is_done })
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneTasksKeys.checklist(safeZoneId, safeTaskId) }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('zone_task_checklist' as any)
        .delete()
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneTasksKeys.checklist(safeZoneId, safeTaskId) }),
  });

  return {
    checklist,
    loading,
    addItem: (title: string) => addItem.mutateAsync(title),
    toggleItem: (id: string, is_done: boolean) => toggleItem.mutateAsync({ id, is_done }),
    removeItem: (id: string) => removeItem.mutateAsync(id),
  };
}

// ─── Hook: Task Comments ───
export function useZoneTaskComments(zoneId: string | null, taskId: string | null) {
  const queryClient = useQueryClient();
  const safeZoneId = zoneId || '';
  const safeTaskId = taskId || '';

  const { data: comments = [], isLoading: loading } = useQuery({
    queryKey: zoneTasksKeys.comments(safeZoneId, safeTaskId),
    queryFn: () => fetchComments(safeZoneId, safeTaskId),
    enabled: !!zoneId && !!taskId,
    staleTime: 30_000,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!zoneId || !taskId) throw new Error('No zone or task selected');
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await (supabase
        .from('zone_task_comments' as any)
        .insert({
          zone_id: zoneId,
          task_id: taskId,
          user_id: userId,
          content,
        }) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneTasksKeys.comments(safeZoneId, safeTaskId) }),
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await (supabase
        .from('zone_task_comments' as any)
        .update({ content })
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneTasksKeys.comments(safeZoneId, safeTaskId) }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('zone_task_comments' as any)
        .delete()
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zoneTasksKeys.comments(safeZoneId, safeTaskId) }),
  });

  return {
    comments: comments as any[], // temporary any until types are exported cleanly if needed
    loading,
    addComment: async (content: string) => addCommentMutation.mutateAsync(content),
    updateComment: async (id: string, content: string) => updateCommentMutation.mutateAsync({ id, content }),
    deleteComment: async (id: string) => deleteCommentMutation.mutateAsync(id),
  };
}
