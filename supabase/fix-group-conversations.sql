-- TackBird: Fix RLS policies for group conversations (events chat)
-- Run this in the Supabase SQL Editor
--
-- Problem: Conversations RLS policies only check user1_id/user2_id,
-- but group conversations (event chats) use conversation_members table.
-- This causes event attendance to fail when creating/joining group chats.

-- ============================================================
-- 1. Enable RLS on conversation_members (if not already)
-- ============================================================
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Members can view conversation memberships" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_members;

-- Create conversation_members policies
CREATE POLICY "Members can view conversation memberships"
    ON public.conversation_members FOR SELECT
    USING (true);

CREATE POLICY "Users can join conversations"
    ON public.conversation_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave conversations"
    ON public.conversation_members FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- 2. Update conversations SELECT policy to include group convos
-- ============================================================
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

CREATE POLICY "Users can view own conversations"
    ON public.conversations FOR SELECT
    USING (
        auth.uid() = user1_id
        OR auth.uid() = user2_id
        OR (
            is_group = true
            AND EXISTS (
                SELECT 1 FROM public.conversation_members
                WHERE conversation_members.conversation_id = conversations.id
                AND conversation_members.user_id = auth.uid()
            )
        )
        OR (
            -- Allow finding group convos by event_id (for joining)
            is_group = true
            AND event_id IS NOT NULL
        )
    );

-- ============================================================
-- 3. Update conversations INSERT policy to allow group convos
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

CREATE POLICY "Authenticated users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (
        -- Direct conversations
        (
            is_group IS NOT TRUE
            AND (auth.uid() = user1_id OR auth.uid() = user2_id)
            AND NOT EXISTS (
                SELECT 1 FROM public.blocked_users
                WHERE (blocker_id = user1_id AND blocked_id = user2_id)
                   OR (blocker_id = user2_id AND blocked_id = user1_id)
            )
        )
        OR
        -- Group conversations (any authenticated user can create)
        (
            is_group = true
            AND auth.uid() = user1_id
        )
    );

-- ============================================================
-- 4. Update conversations UPDATE policy to include group convos
-- ============================================================
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;

CREATE POLICY "Users can update own conversations"
    ON public.conversations FOR UPDATE
    USING (
        auth.uid() = user1_id
        OR auth.uid() = user2_id
        OR (
            is_group = true
            AND EXISTS (
                SELECT 1 FROM public.conversation_members
                WHERE conversation_members.conversation_id = conversations.id
                AND conversation_members.user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 5. Update conversations DELETE policy
-- ============================================================
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

CREATE POLICY "Users can delete own conversations"
    ON public.conversations FOR DELETE
    USING (
        auth.uid() = user1_id
        OR auth.uid() = user2_id
    );

-- ============================================================
-- 6. Update messages SELECT to include group conversation messages
-- ============================================================
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;

CREATE POLICY "Users can view messages in own conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = conversation_id
            AND (
                conversations.user1_id = auth.uid()
                OR conversations.user2_id = auth.uid()
                OR (
                    conversations.is_group = true
                    AND EXISTS (
                        SELECT 1 FROM public.conversation_members
                        WHERE conversation_members.conversation_id = conversations.id
                        AND conversation_members.user_id = auth.uid()
                    )
                )
            )
        )
    );

-- ============================================================
-- 7. Update messages INSERT to include group conversations
-- ============================================================
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON public.messages;

CREATE POLICY "Users can send messages in own conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = conversation_id
            AND (
                -- Direct conversations
                (
                    (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
                    AND NOT EXISTS (
                        SELECT 1 FROM public.blocked_users bu
                        WHERE (bu.blocker_id = conversations.user1_id AND bu.blocked_id = conversations.user2_id)
                           OR (bu.blocker_id = conversations.user2_id AND bu.blocked_id = conversations.user1_id)
                    )
                )
                OR
                -- Group conversations
                (
                    conversations.is_group = true
                    AND EXISTS (
                        SELECT 1 FROM public.conversation_members
                        WHERE conversation_members.conversation_id = conversations.id
                        AND conversation_members.user_id = auth.uid()
                    )
                )
            )
        )
    );

-- ============================================================
-- 8. Update messages UPDATE to include group conversations
-- ============================================================
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = conversation_id
            AND (
                conversations.user1_id = auth.uid()
                OR conversations.user2_id = auth.uid()
                OR (
                    conversations.is_group = true
                    AND EXISTS (
                        SELECT 1 FROM public.conversation_members
                        WHERE conversation_members.conversation_id = conversations.id
                        AND conversation_members.user_id = auth.uid()
                    )
                )
            )
        )
    );

-- ============================================================
-- 9. Remove UNIQUE constraint on (user1_id, user2_id) for conversations
--    This constraint breaks group conversations where user1_id can be null
-- ============================================================
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user1_id_user2_id_key;

-- Add a partial unique constraint only for direct conversations
CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_unique
    ON public.conversations(user1_id, user2_id)
    WHERE is_group IS NOT TRUE;
