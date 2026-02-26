-- TackBird Row Level Security Policies
-- Run AFTER schema.sql

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================

-- Everyone can read non-hidden profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (
        profile_visibility != 'hidden'
        OR id = auth.uid()
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================================
-- USER BADGES
-- ============================================================

CREATE POLICY "Badges are viewable by everyone"
    ON public.user_badges FOR SELECT
    USING (true);

-- Only admins can manage badges (via service role)

-- ============================================================
-- POSTS
-- ============================================================

-- Active posts are viewable by everyone (filtered by blocked users)
CREATE POLICY "Active posts are viewable"
    ON public.posts FOR SELECT
    USING (
        is_active = TRUE
        AND NOT EXISTS (
            SELECT 1 FROM public.blocked_users
            WHERE (blocker_id = auth.uid() AND blocked_id = posts.user_id)
               OR (blocker_id = posts.user_id AND blocked_id = auth.uid())
        )
    );

-- Users can create posts
CREATE POLICY "Authenticated users can create posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- POST IMAGES
-- ============================================================

CREATE POLICY "Post images are viewable"
    ON public.post_images FOR SELECT
    USING (true);

CREATE POLICY "Users can add images to own posts"
    ON public.post_images FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = post_id AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own post images"
    ON public.post_images FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = post_id AND posts.user_id = auth.uid()
        )
    );

-- ============================================================
-- EVENTS
-- ============================================================

CREATE POLICY "Events are viewable by everyone"
    ON public.events FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create events"
    ON public.events FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their events"
    ON public.events FOR UPDATE
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their events"
    ON public.events FOR DELETE
    USING (auth.uid() = creator_id);

-- ============================================================
-- EVENT ATTENDEES
-- ============================================================

CREATE POLICY "Event attendees are viewable"
    ON public.event_attendees FOR SELECT
    USING (true);

CREATE POLICY "Users can attend events"
    ON public.event_attendees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events"
    ON public.event_attendees FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Authenticated users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete own conversations"
    ON public.conversations FOR DELETE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================================
-- MESSAGES
-- ============================================================

-- Users can only read messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = conversation_id
            AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in own conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = conversation_id
            AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = conversation_id
            AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
        )
    );

-- ============================================================
-- HUBS
-- ============================================================

CREATE POLICY "Active hubs are viewable"
    ON public.hubs FOR SELECT
    USING (is_active = TRUE);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Notifications are created via service role (server-side)

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != reviewed_id);

-- ============================================================
-- BLOCKED USERS
-- ============================================================

CREATE POLICY "Users can view own blocks"
    ON public.blocked_users FOR SELECT
    USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
    ON public.blocked_users FOR INSERT
    WITH CHECK (auth.uid() = blocker_id AND auth.uid() != blocked_id);

CREATE POLICY "Users can unblock"
    ON public.blocked_users FOR DELETE
    USING (auth.uid() = blocker_id);

-- ============================================================
-- SAVED POSTS
-- ============================================================

CREATE POLICY "Users can view own saved posts"
    ON public.saved_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
    ON public.saved_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
    ON public.saved_posts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================

CREATE POLICY "Users can manage own push subscriptions"
    ON public.push_subscriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RENTAL BOOKINGS
-- ============================================================

CREATE POLICY "Users can view own rental bookings"
    ON public.rental_bookings FOR SELECT
    USING (auth.uid() = lender_id OR auth.uid() = borrower_id);

CREATE POLICY "Users can create rental bookings"
    ON public.rental_bookings FOR INSERT
    WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Participants can update rental bookings"
    ON public.rental_bookings FOR UPDATE
    USING (auth.uid() = lender_id OR auth.uid() = borrower_id);

-- ============================================================
-- ADVERTISEMENTS
-- ============================================================

-- Active ads are viewable by everyone (for feed display)
CREATE POLICY "Active ads are viewable"
    ON public.advertisements FOR SELECT
    USING (
        status = 'active'
        OR advertiser_id = auth.uid()
    );

CREATE POLICY "Users can create ads"
    ON public.advertisements FOR INSERT
    WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Advertisers can update own ads"
    ON public.advertisements FOR UPDATE
    USING (auth.uid() = advertiser_id);

-- ============================================================
-- AD IMPRESSIONS
-- ============================================================

CREATE POLICY "Users can create ad impressions"
    ON public.ad_impressions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advertisers can view own ad impressions"
    ON public.ad_impressions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.advertisements
            WHERE advertisements.id = ad_id AND advertisements.advertiser_id = auth.uid()
        )
    );
