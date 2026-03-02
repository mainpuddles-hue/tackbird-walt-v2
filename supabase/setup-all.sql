-- ============================================================
-- TackBird Walt v2 — COMPLETE DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor
-- Includes: schema + RLS + Walt extras + storage
-- ============================================================

-- ============================================================
-- PART 1: SCHEMA (all tables, indexes, triggers)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    bio TEXT DEFAULT '',
    naapurusto TEXT DEFAULT '',
    response_rate INTEGER DEFAULT 100,
    is_hub BOOLEAN DEFAULT FALSE,
    is_pro BOOLEAN DEFAULT FALSE,
    pro_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_connect_account_id TEXT,
    stripe_connect_onboarded BOOLEAN DEFAULT FALSE,
    profile_visibility TEXT DEFAULT 'neighbors' CHECK (profile_visibility IN ('everyone', 'neighbors', 'hidden')),
    location_accuracy TEXT DEFAULT 'area' CHECK (location_accuracy IN ('exact', 'area', 'city')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    language TEXT DEFAULT 'fi',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_business BOOLEAN DEFAULT FALSE,
    business_name TEXT,
    business_vat_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_naapurusto ON public.profiles(naapurusto);

-- USER BADGES
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL CHECK (badge_type IN ('verified', 'pro', 'trusted', 'active')),
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- POSTS
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('tarvitsen', 'tarjoan', 'ilmaista', 'nappaa', 'lainaa', 'tapahtuma', 'tilannehuone')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    image_url TEXT,
    hub_pickup_id UUID,
    expires_at TIMESTAMPTZ,
    daily_fee NUMERIC(10, 2),
    event_date TIMESTAMPTZ,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_pro_listing BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_active ON public.posts(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_active ON public.posts(user_id, is_active);

-- POST IMAGES
CREATE TABLE IF NOT EXISTS public.post_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_post_images_post ON public.post_images(post_id);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location_name TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    icon TEXT DEFAULT 'PartyPopper',
    discount TEXT,
    max_attendees INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_creator ON public.events(creator_id);

-- EVENT ATTENDEES
CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON public.event_attendees(event_id, user_id);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    is_group BOOLEAN DEFAULT FALSE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    group_name TEXT,
    group_emoji TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(user2_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- HUBS
CREATE TABLE IF NOT EXISTS public.hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    address TEXT,
    icon TEXT DEFAULT 'MapPin',
    offers TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id),
    post_id UUID REFERENCES public.posts(id),
    user_id UUID REFERENCES public.profiles(id),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    link_type TEXT,
    link_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reviewer_id, reviewed_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON public.reviews(reviewed_id, created_at DESC);

-- BLOCKED USERS
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);

-- SAVED POSTS
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON public.saved_posts(user_id);

-- PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RENTAL BOOKINGS
CREATE TABLE IF NOT EXISTS public.rental_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    lender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL,
    daily_fee NUMERIC(10, 2) NOT NULL,
    total_fee NUMERIC(10, 2) NOT NULL,
    platform_commission NUMERIC(10, 2) NOT NULL,
    platform_commission_rate NUMERIC(4, 3) NOT NULL DEFAULT 0.10,
    stripe_payment_intent_id TEXT,
    stripe_transfer_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'completed', 'cancelled', 'disputed', 'refunded')),
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    dispute_reason TEXT,
    disputed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, borrower_id, status)
);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_post ON public.rental_bookings(post_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_lender ON public.rental_bookings(lender_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_borrower ON public.rental_bookings(borrower_id);

-- RENTAL REVIEWS
CREATE TABLE IF NOT EXISTS public.rental_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.rental_bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rental_reviews_booking ON public.rental_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_rental_reviews_reviewee ON public.rental_reviews(reviewee_id);

-- ADVERTISEMENTS
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    cta_text TEXT DEFAULT 'Lue lisää',
    target_naapurusto TEXT,
    daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 2.99,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'paused', 'completed', 'cancelled')),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_advertisements_advertiser ON public.advertisements(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_status ON public.advertisements(status, start_date, end_date);

-- AD IMPRESSIONS
CREATE TABLE IF NOT EXISTS public.ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    impression_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(ad_id, user_id, impression_date)
);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad ON public.ad_impressions(ad_id);

-- SURPRISE PLANS
CREATE TABLE IF NOT EXISTS public.surprise_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_surprise_plans_user ON public.surprise_plans(user_id, plan_date);

-- SURPRISE PLAN ACTIVITIES
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

-- CONVERSATION MEMBERS (group chats)
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
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS posts_updated_at ON public.posts;
CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- PART 2: ROW LEVEL SECURITY
-- ============================================================

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
ALTER TABLE public.surprise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprise_plan_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_reviews ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (profile_visibility != 'hidden' OR id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- USER BADGES
CREATE POLICY "Badges are viewable by everyone"
    ON public.user_badges FOR SELECT
    USING (true);

-- POSTS
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

CREATE POLICY "Authenticated users can create posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

-- POST IMAGES
CREATE POLICY "Post images are viewable"
    ON public.post_images FOR SELECT
    USING (true);

CREATE POLICY "Users can add images to own posts"
    ON public.post_images FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id AND posts.user_id = auth.uid())
    );

CREATE POLICY "Users can delete own post images"
    ON public.post_images FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id AND posts.user_id = auth.uid())
    );

-- EVENTS
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

-- EVENT ATTENDEES
CREATE POLICY "Event attendees are viewable"
    ON public.event_attendees FOR SELECT
    USING (true);

CREATE POLICY "Users can attend events"
    ON public.event_attendees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events"
    ON public.event_attendees FOR DELETE
    USING (auth.uid() = user_id);

-- CONVERSATIONS
CREATE POLICY "Users can view own conversations"
    ON public.conversations FOR SELECT
    USING (
        auth.uid() = user1_id OR auth.uid() = user2_id
        OR (is_group = TRUE AND EXISTS (
            SELECT 1 FROM public.conversation_members WHERE conversation_id = id AND user_id = auth.uid()
        ))
    );

CREATE POLICY "Authenticated users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (
        (auth.uid() = user1_id OR auth.uid() = user2_id)
        AND NOT EXISTS (
            SELECT 1 FROM public.blocked_users
            WHERE (blocker_id = user1_id AND blocked_id = user2_id)
               OR (blocker_id = user2_id AND blocked_id = user1_id)
        )
    );

CREATE POLICY "Users can update own conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete own conversations"
    ON public.conversations FOR DELETE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- MESSAGES
CREATE POLICY "Users can view messages in own conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = conversation_id
            AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = messages.conversation_id
            AND conversation_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in own conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND (
            EXISTS (
                SELECT 1 FROM public.conversations
                WHERE conversations.id = conversation_id
                AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
            )
            OR EXISTS (
                SELECT 1 FROM public.conversation_members
                WHERE conversation_members.conversation_id = messages.conversation_id
                AND conversation_members.user_id = auth.uid()
            )
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
        OR EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = messages.conversation_id
            AND conversation_members.user_id = auth.uid()
        )
    );

-- HUBS
CREATE POLICY "Active hubs are viewable"
    ON public.hubs FOR SELECT
    USING (is_active = TRUE);

-- REPORTS
CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- REVIEWS
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != reviewed_id);

-- BLOCKED USERS
CREATE POLICY "Users can view own blocks"
    ON public.blocked_users FOR SELECT
    USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
    ON public.blocked_users FOR INSERT
    WITH CHECK (auth.uid() = blocker_id AND auth.uid() != blocked_id);

CREATE POLICY "Users can unblock"
    ON public.blocked_users FOR DELETE
    USING (auth.uid() = blocker_id);

-- SAVED POSTS
CREATE POLICY "Users can view own saved posts"
    ON public.saved_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
    ON public.saved_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
    ON public.saved_posts FOR DELETE
    USING (auth.uid() = user_id);

-- PUSH SUBSCRIPTIONS
CREATE POLICY "Users can manage own push subscriptions"
    ON public.push_subscriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RENTAL BOOKINGS
CREATE POLICY "Users can view own rental bookings"
    ON public.rental_bookings FOR SELECT
    USING (auth.uid() = lender_id OR auth.uid() = borrower_id);

CREATE POLICY "Users can create rental bookings"
    ON public.rental_bookings FOR INSERT
    WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Participants can update rental bookings"
    ON public.rental_bookings FOR UPDATE
    USING (auth.uid() = lender_id OR auth.uid() = borrower_id);

-- RENTAL REVIEWS
CREATE POLICY "Rental reviews are viewable by everyone"
    ON public.rental_reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create rental reviews"
    ON public.rental_reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- ADVERTISEMENTS
CREATE POLICY "Active ads are viewable"
    ON public.advertisements FOR SELECT
    USING (status = 'active' OR advertiser_id = auth.uid());

CREATE POLICY "Users can create ads"
    ON public.advertisements FOR INSERT
    WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Advertisers can update own ads"
    ON public.advertisements FOR UPDATE
    USING (auth.uid() = advertiser_id);

-- AD IMPRESSIONS
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

-- SURPRISE PLANS
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

-- SURPRISE PLAN ACTIVITIES
CREATE POLICY "Users view own plan activities"
    ON public.surprise_plan_activities FOR SELECT
    USING (plan_id IN (SELECT id FROM public.surprise_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users create own plan activities"
    ON public.surprise_plan_activities FOR INSERT
    WITH CHECK (plan_id IN (SELECT id FROM public.surprise_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users delete own plan activities"
    ON public.surprise_plan_activities FOR DELETE
    USING (plan_id IN (SELECT id FROM public.surprise_plans WHERE user_id = auth.uid()));

-- CONVERSATION MEMBERS
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

-- ============================================================
-- PART 3: STORAGE BUCKETS + POLICIES
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('posts', 'posts', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('messages', 'messages', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('ads', 'ads', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Post images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'posts');

CREATE POLICY "Users can upload post images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Users can delete own post images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Users can view message images in own conversations"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'messages' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload message images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'messages' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Ad images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ads');

CREATE POLICY "Users can upload ad images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'ads' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- ============================================================
-- DONE! TackBird Walt v2 database is ready.
-- ============================================================
