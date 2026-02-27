/**
 * Hook: Manage tasks for a zone
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';

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
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  deal_id: string | null;
  contact_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  assignee_name?: string;
  creator_name?: string;
}

export function useZoneTasks(zoneId: string | null) {
  const [tasks, setTasks] = useState<ZoneTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('zone_tasks')
        .select('*')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false });
      setTasks((data as ZoneTask[]) || []);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = useCallback(async (task: Partial<ZoneTask>) => {
    if (!zoneId) throw new Error('No zone');
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('zone_tasks')
      .insert({ ...task, zone_id: zoneId, created_by: userId } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchTasks();
    return data;
  }, [zoneId, fetchTasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<ZoneTask>) => {
    const finalUpdates = { ...updates } as any;
    if (updates.status === 'done' && !updates.completed_at) {
      finalUpdates.completed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from('zone_tasks')
      .update(finalUpdates)
      .eq('id', id);
    if (error) throw error;
    await fetchTasks();
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('zone_tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, createTask, updateTask, deleteTask, refetch: fetchTasks };
}
