-- Migration: Task Comments

CREATE TABLE IF NOT EXISTS public.zone_task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.zone_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zone_task_comments_zone_id ON public.zone_task_comments(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_task_comments_task_id ON public.zone_task_comments(task_id);

-- RLS
ALTER TABLE public.zone_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view task comments"
    ON public.zone_task_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM zone_members
            WHERE zone_members.zone_id = zone_task_comments.zone_id
            AND zone_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Zone members can insert task comments"
    ON public.zone_task_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM zone_members
            WHERE zone_members.zone_id = zone_task_comments.zone_id
            AND zone_members.user_id = auth.uid()
        ) AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own task comments"
    ON public.zone_task_comments FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own task comments"
    ON public.zone_task_comments FOR DELETE
    USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_zone_task_comments_updated_at
    BEFORE UPDATE ON public.zone_task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
