-- Migration: Recurring Tasks

-- 1. Add columns to zone_tasks
ALTER TABLE public.zone_tasks
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT CHECK (recurrence_rule IN ('daily', 'weekly', 'monthly', 'yearly', 'none')),
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE;

-- 2. Function to handle task recurrence
CREATE OR REPLACE FUNCTION public.handle_recurring_task()
RETURNS TRIGGER AS $$
DECLARE
    new_due_date TIMESTAMP WITH TIME ZONE;
    interval_str TEXT;
BEGIN
    -- Only trigger if status changed to 'done' and there's a recurrence rule active
    IF (NEW.status = 'done' AND OLD.status != 'done' AND NEW.recurrence_rule IS NOT NULL AND NEW.recurrence_rule != 'none') THEN
        
        -- Determine next date
        IF NEW.recurrence_rule = 'daily' THEN interval_str := '1 day';
        ELSIF NEW.recurrence_rule = 'weekly' THEN interval_str := '1 week';
        ELSIF NEW.recurrence_rule = 'monthly' THEN interval_str := '1 month';
        ELSIF NEW.recurrence_rule = 'yearly' THEN interval_str := '1 year';
        END IF;

        IF NEW.due_date IS NOT NULL THEN
            new_due_date := NEW.due_date + interval_str::interval;
        ELSE
            new_due_date := (now() + interval_str::interval);
        END IF;

        -- Check if it exceeds end date
        IF NEW.recurrence_end_date IS NULL OR new_due_date <= NEW.recurrence_end_date THEN
            -- Insert the cloned task
            INSERT INTO public.zone_tasks (
                zone_id, deal_id, contact_id, assigned_to, title, description,
                status, priority, due_date, recurrence_rule, recurrence_end_date
            ) VALUES (
                NEW.zone_id, NEW.deal_id, NEW.contact_id, NEW.assigned_to, NEW.title, NEW.description,
                'todo', NEW.priority, new_due_date, NEW.recurrence_rule, NEW.recurrence_end_date
            );
        END IF;

        -- Remove recurrence from the currently completed task so it doesn't duplicate again if reopened
        NEW.recurrence_rule := NULL;
        NEW.recurrence_end_date := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger
DROP TRIGGER IF EXISTS trg_handle_recurring_task ON public.zone_tasks;
CREATE TRIGGER trg_handle_recurring_task
    BEFORE UPDATE ON public.zone_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_recurring_task();
