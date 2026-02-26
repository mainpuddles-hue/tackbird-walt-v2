-- TackBird Supabase Storage Buckets + Policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('posts', 'posts', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('messages', 'messages', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('ads', 'ads', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- AVATARS — public read, authenticated upload to own folder
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- POSTS — public read, authenticated upload to own folder
CREATE POLICY "Post images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'posts');

CREATE POLICY "Users can upload post images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'posts'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "Users can delete own post images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'posts'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- MESSAGES — authenticated read for conversation participants, upload for sender
CREATE POLICY "Users can view message images in own conversations"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'messages'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can upload message images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'messages'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- ADS — public read, business users can upload
CREATE POLICY "Ad images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ads');

CREATE POLICY "Users can upload ad images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'ads'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );
