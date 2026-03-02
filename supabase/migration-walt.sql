-- ============================================================
-- TackBird Walt v2 — Additional tables & columns
-- Run this AFTER the base schema.sql + rls.sql
-- ============================================================

-- ============================================================
-- SURPRISE DAY PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.surprise_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surprise_plans_user ON public.surprise_plans(user_id, plan_date);

-- ============================================================
-- SURPRISE DAY ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.surprise_plan_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.surprise_plans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location_name TEXT,
    time_slot TEXT NOT NULL,
    emoji TEXT DEFAULT '📍',
    category TEXT CHECK (category IN ('breakfast', 'activity', 'lunch', 'culture', 'evening')),
    order_index INTEGER DEFAULT 0,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_surprise_activities_plan ON public.surprise_plan_activities(plan_id);

-- ============================================================
-- GROUP CHAT SUPPORT (extend conversations)
-- ============================================================
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS group_emoji TEXT;

-- ============================================================
-- CONVERSATION MEMBERS (for group chats)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conv ON public.conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id);

-- ============================================================
-- SYSTEM MESSAGES SUPPORT
-- ============================================================
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================

-- Surprise Plans
ALTER TABLE public.surprise_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own plans"
    ON public.surprise_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users create own plans"
    ON public.surprise_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own plans"
    ON public.surprise_plans FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own plans"
    ON public.surprise_plans FOR DELETE
    USING (auth.uid() = user_id);

-- Surprise Plan Activities
ALTER TABLE public.surprise_plan_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own plan activities"
    ON public.surprise_plan_activities FOR SELECT
    USING (plan_id IN (SELECT id FROM public.surprise_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users create own plan activities"
    ON public.surprise_plan_activities FOR INSERT
    WITH CHECK (plan_id IN (SELECT id FROM public.surprise_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users delete own plan activities"
    ON public.surprise_plan_activities FOR DELETE
    USING (plan_id IN (SELECT id FROM public.surprise_plans WHERE user_id = auth.uid()));

-- Conversation Members
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own memberships"
    ON public.conversation_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Members view group members"
    ON public.conversation_members FOR SELECT
    USING (conversation_id IN (
        SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Members join conversations"
    ON public.conversation_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members leave conversations"
    ON public.conversation_members FOR DELETE
    USING (user_id = auth.uid());
