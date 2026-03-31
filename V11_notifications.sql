-- CARENIUM: V11 — Notifications System
-- Creates table to store personalized alerts and notifications

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('critical', 'info', 'warning', 'success')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their notifications" ON public.notifications 
FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their notifications" ON public.notifications 
FOR UPDATE USING (auth.uid() = user_id);

-- System backend can insert notifications (for demo, we allow authenticated users to insert to self)
CREATE POLICY "System can insert notifications" ON public.notifications 
FOR INSERT WITH CHECK (auth.uid() = user_id);
