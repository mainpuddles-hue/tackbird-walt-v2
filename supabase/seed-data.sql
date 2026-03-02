-- ============================================================
-- TackBird Walt v2 — Seed Data
-- Run this in Supabase SQL Editor (service role bypasses RLS)
--
-- NOTE: profiles.id has a FK to auth.users(id), so we must
-- temporarily drop that constraint, insert profiles with fake
-- UUIDs, then re-add the constraint. This is safe for dev/seed.
-- ============================================================

BEGIN;

-- ============================================================
-- 0. Temporarily drop the FK from profiles → auth.users
--    so we can insert profiles without auth.users rows
-- ============================================================
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- ============================================================
-- 1. PROFILES — 6 fake users with Finnish names
-- ============================================================
-- We use fixed UUIDs so we can reference them throughout the seed.
-- Generated offline; safe for repeated runs with ON CONFLICT.

INSERT INTO public.profiles (id, email, name, avatar_url, bio, naapurusto, response_rate, is_hub, is_pro, pro_expires_at, onboarding_completed, language, created_at)
VALUES
    -- User 1: Minna Korhonen (Kallio) — Pro user
    ('a1111111-1111-1111-1111-111111111111',
     'minna.korhonen@example.com',
     'Minna Korhonen',
     NULL,
     'Kahden lapsen äiti Kalliosta. Tykkään kierrättää ja auttaa naapureita!',
     'Kallio',
     95,
     FALSE,
     TRUE,
     NOW() + INTERVAL '6 months',
     TRUE,
     'fi',
     NOW() - INTERVAL '3 months'),

    -- User 2: Lauri Virtanen (Sörnäinen) — Hub user
    ('a2222222-2222-2222-2222-222222222222',
     'lauri.virtanen@example.com',
     'Lauri Virtanen',
     NULL,
     'Sörnäisten kirjaston vapaaehtoinen. Kirjat ja yhteisö lähellä sydäntä.',
     'Sörnäinen',
     88,
     TRUE,
     FALSE,
     NULL,
     TRUE,
     'fi',
     NOW() - INTERVAL '5 months'),

    -- User 3: Aino Mäkelä (Vallila)
    ('a3333333-3333-3333-3333-333333333333',
     'aino.makela@example.com',
     'Aino Mäkelä',
     NULL,
     'Graafikko Vallilasta. Rakastan lähiruokaa ja kaupunkiviljelyä.',
     'Vallila',
     92,
     FALSE,
     FALSE,
     NULL,
     TRUE,
     'fi',
     NOW() - INTERVAL '2 months'),

    -- User 4: Eero Nieminen (Käpylä)
    ('a4444444-4444-4444-4444-444444444444',
     'eero.nieminen@example.com',
     'Eero Nieminen',
     NULL,
     'Eläkkeellä oleva puuseppä. Korjaan mielelläni huonekaluja naapureille.',
     'Käpylä',
     100,
     FALSE,
     FALSE,
     NULL,
     TRUE,
     'fi',
     NOW() - INTERVAL '4 months'),

    -- User 5: Sofia Laine (Töölö)
    ('a5555555-5555-5555-5555-555555555555',
     'sofia.laine@example.com',
     'Sofia Laine',
     NULL,
     'Opiskelija Töölöstä. Etsin edullisia huonekaluja ja tarjoan lastenhoitoapua.',
     'Töölö',
     85,
     FALSE,
     FALSE,
     NULL,
     TRUE,
     'fi',
     NOW() - INTERVAL '1 month'),

    -- User 6: Mikko Hämäläinen (Punavuori)
    ('a6666666-6666-6666-6666-666666666666',
     'mikko.hamalainen@example.com',
     'Mikko Hämäläinen',
     NULL,
     'Freelance-valokuvaaja Punavuoresta. Voin auttaa muuttokuvauksissa ja tapahtumissa.',
     'Punavuori',
     90,
     FALSE,
     FALSE,
     NULL,
     TRUE,
     'fi',
     NOW() - INTERVAL '6 months')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. USER BADGES
-- ============================================================
INSERT INTO public.user_badges (user_id, badge_type)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'pro'),
    ('a1111111-1111-1111-1111-111111111111', 'verified'),
    ('a2222222-2222-2222-2222-222222222222', 'verified'),
    ('a2222222-2222-2222-2222-222222222222', 'trusted'),
    ('a4444444-4444-4444-4444-444444444444', 'trusted'),
    ('a6666666-6666-6666-6666-666666666666', 'active')
ON CONFLICT (user_id, badge_type) DO NOTHING;


-- ============================================================
-- 3. POSTS — 18 posts (3 per type, except tapahtuma gets 3 too)
--    We use fixed UUIDs so events and conversations can reference them.
-- ============================================================

INSERT INTO public.posts (id, user_id, type, title, description, location, latitude, longitude, expires_at, daily_fee, event_date, is_active, created_at)
VALUES
    -- ─── TARVITSEN (3) ──────────────────────────────────────
    ('b0000001-0001-0001-0001-000000000001',
     'a1111111-1111-1111-1111-111111111111',
     'tarvitsen',
     'Tarvitsen porakoneen viikonlopuksi',
     'Pitäisi asentaa hyllyjä seinälle. Tarvitsisin iskuporakoneen la-su käyttöön. Voin hakea itse!',
     'Kallio',
     60.1841, 24.9514,
     NOW() + INTERVAL '30 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '2 days'),

    ('b0000001-0001-0001-0001-000000000002',
     'a5555555-5555-5555-5555-555555555555',
     'tarvitsen',
     'Tarvitsen pyöränkorjauspumppua',
     'Takarengas meni tyhjäksi eikä lähikaupasta löytynyt pumppua. Kelpaisi lainaksikin hetkeksi!',
     'Töölö',
     60.1756, 24.9211,
     NOW() + INTERVAL '14 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '1 day'),

    ('b0000001-0001-0001-0001-000000000003',
     'a3333333-3333-3333-3333-333333333333',
     'tarvitsen',
     'Etsin kastelukannua ja puutarhatyökaluja',
     'Aloitin parvekeviljelyn ja tarvitsisin perustyökalut alkuun. Pieni kastelukannu ja istutuslapio riittäisi.',
     'Vallila',
     60.1912, 24.9543,
     NOW() + INTERVAL '30 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '5 hours'),

    -- ─── TARJOAN (3) ────────────────────────────────────────
    ('b0000002-0002-0002-0002-000000000001',
     'a4444444-4444-4444-4444-444444444444',
     'tarjoan',
     'Tarjoan apua huonekalujen kokoamisessa',
     'Olen eläkkeellä oleva puuseppä. Voin auttaa IKEA-huonekalujen tai muiden kokoamisessa. Omat työkalut mukana.',
     'Käpylä',
     60.2095, 24.9524,
     NOW() + INTERVAL '60 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '3 days'),

    ('b0000002-0002-0002-0002-000000000002',
     'a5555555-5555-5555-5555-555555555555',
     'tarjoan',
     'Tarjoan lastenhoitoapua iltaisin',
     'Lastentarhanopettajaopiskelija, kokenut lastenhoitaja. Voin tulla hoitamaan lapsia arkisin klo 17 jälkeen.',
     'Töölö',
     60.1749, 24.9198,
     NOW() + INTERVAL '30 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '1 day'),

    ('b0000002-0002-0002-0002-000000000003',
     'a6666666-6666-6666-6666-666666666666',
     'tarjoan',
     'Valokuvausapua tapahtumiin',
     'Olen freelance-valokuvaaja ja voin kuvata paikallisia tapahtumia, kirpputoreja tai yhteisöjuttuja ilmaiseksi.',
     'Punavuori',
     60.1627, 24.9389,
     NOW() + INTERVAL '30 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '6 hours'),

    -- ─── ILMAISTA (3) ───────────────────────────────────────
    ('b0000003-0003-0003-0003-000000000001',
     'a1111111-1111-1111-1111-111111111111',
     'ilmaista',
     'Ilmainen sohva — hyvässä kunnossa',
     'Harmaa 3-istuttava sohva, käytetty 2 vuotta. Päällinen vähän kulunut mutta toimiva. Pitää hakea itse 3. krs.',
     'Kallio, Fleminginkatu',
     60.1835, 24.9488,
     NOW() + INTERVAL '7 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '4 days'),

    ('b0000003-0003-0003-0003-000000000002',
     'a3333333-3333-3333-3333-333333333333',
     'ilmaista',
     'Lastenvaatteita 92-110 cm',
     'Puhdas kassi lastenvaatteita, sesonkivaatteet mukana. Haettavissa Vallilasta.',
     'Vallila',
     60.1921, 24.9567,
     NOW() + INTERVAL '14 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '2 days'),

    ('b0000003-0003-0003-0003-000000000003',
     'a4444444-4444-4444-4444-444444444444',
     'ilmaista',
     'Vanhoja puutyökaluja',
     'Höylä, talttoja ja vanha vasara. Kaikki toimivia mutta eivät enää käytössä. Sopii aloittelijalle.',
     'Käpylä',
     60.2088, 24.9510,
     NOW() + INTERVAL '14 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '1 day'),

    -- ─── NAPPAA (3) ─────────────────────────────────────────
    ('b0000004-0004-0004-0004-000000000001',
     'a2222222-2222-2222-2222-222222222222',
     'nappaa',
     'Kirjahylly — ensimmäiselle hakijalle!',
     'Koivuinen kirjahylly, 180 cm korkea. Pitää hakea tänään tai huomenna.',
     'Sörnäinen',
     60.1873, 24.9631,
     NOW() + INTERVAL '2 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '3 hours'),

    ('b0000004-0004-0004-0004-000000000002',
     'a6666666-6666-6666-6666-666666666666',
     'nappaa',
     'Kukkia parvekkeelta — tule hakemaan!',
     'Ylijäämä kesäkukkia: petunioita ja pelargonioita. Nappaa ennen kuin menevät hukkaan!',
     'Punavuori',
     60.1631, 24.9401,
     NOW() + INTERVAL '1 day', NULL, NULL, TRUE,
     NOW() - INTERVAL '1 hour'),

    ('b0000004-0004-0004-0004-000000000003',
     'a1111111-1111-1111-1111-111111111111',
     'nappaa',
     'Laatikollinen keittiötarvikkeita',
     'Muutan pienempään ja näistä pitää päästä eroon: paistinpannu, kattiloita, leikkuulautoja. Kaikki kerralla.',
     'Kallio',
     60.1847, 24.9501,
     NOW() + INTERVAL '3 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '5 hours'),

    -- ─── LAINAA (3) ─────────────────────────────────────────
    ('b0000005-0005-0005-0005-000000000001',
     'a4444444-4444-4444-4444-444444444444',
     'lainaa',
     'Sähköpyörä vuokralle',
     'Hyväkuntoinen sähköpyörä arkiliikkumiseen. Akku kestää ~60 km. Laina-aika maks. 7 päivää.',
     'Käpylä',
     60.2091, 24.9518,
     NOW() + INTERVAL '60 days', 8.00, NULL, TRUE,
     NOW() - INTERVAL '1 week'),

    ('b0000005-0005-0005-0005-000000000002',
     'a6666666-6666-6666-6666-666666666666',
     'lainaa',
     'Kamera (Canon EOS R50) lainaan',
     'Lainaan Canon EOS R50 -kameran viikon tai viikonlopun ajaksi. Sisältää 18-45mm objektiivin.',
     'Punavuori',
     60.1633, 24.9395,
     NOW() + INTERVAL '30 days', 15.00, NULL, TRUE,
     NOW() - INTERVAL '3 days'),

    ('b0000005-0005-0005-0005-000000000003',
     'a1111111-1111-1111-1111-111111111111',
     'lainaa',
     'Peräkärry lainattavissa',
     'Pieni peräkärry (kantavuus 300 kg) muuttoja tai isompia kuljetuksia varten. Vain perjantaista sunnuntaihin.',
     'Kallio',
     60.1839, 24.9520,
     NOW() + INTERVAL '30 days', 12.00, NULL, TRUE,
     NOW() - INTERVAL '5 days'),

    -- ─── TAPAHTUMA (3) ──────────────────────────────────────
    ('b0000006-0006-0006-0006-000000000001',
     'a1111111-1111-1111-1111-111111111111',
     'tapahtuma',
     'Pihakirppis lauantaina Kalliossa',
     'Tule myymään tai ostamaan! Paikat ilmaisia, ota oma pöytä tai peitto mukaan. Kahvia tarjolla.',
     'Kallio, Karhupuisto',
     60.1841, 24.9520,
     NULL, NULL,
     NOW() + INTERVAL '5 days',
     TRUE,
     NOW() - INTERVAL '3 days'),

    ('b0000006-0006-0006-0006-000000000002',
     'a2222222-2222-2222-2222-222222222222',
     'tapahtuma',
     'Ilmainen korjaustyöpaja Sörnäisissä',
     'Tuo rikkinäiset vaatteet, elektroniikan tai pyörän — korjataan yhdessä! Paikkana Sörnäisten kirjasto.',
     'Sörnäisten kirjasto',
     60.1878, 24.9639,
     NULL, NULL,
     NOW() + INTERVAL '12 days',
     TRUE,
     NOW() - INTERVAL '2 days'),

    ('b0000006-0006-0006-0006-000000000003',
     'a3333333-3333-3333-3333-333333333333',
     'tapahtuma',
     'Lähiruokapiirin tapaaminen',
     'Vallilan lähiruokapiiri tapaa taas! Tällä kertaa teemana kesäkauden satokausi. Tervetuloa kaikki kiinnostuneet.',
     'Vallila, Konepajapuisto',
     60.1915, 24.9550,
     NULL, NULL,
     NOW() + INTERVAL '8 days',
     TRUE,
     NOW() - INTERVAL '1 day'),

    -- ─── TILANNEHUONE (3) ───────────────────────────────────
    ('b0000007-0007-0007-0007-000000000001',
     'a2222222-2222-2222-2222-222222222222',
     'tilannehuone',
     'Vesikatko Sörnäisissä — tänään klo 10-16',
     'HSY ilmoitti vesikatkosta Sörnäisten alueella huoltotöiden takia. Varatkaa vettä etukäteen!',
     'Sörnäinen',
     60.1870, 24.9625,
     NOW() + INTERVAL '1 day', NULL, NULL, TRUE,
     NOW() - INTERVAL '4 hours'),

    ('b0000007-0007-0007-0007-000000000002',
     'a1111111-1111-1111-1111-111111111111',
     'tilannehuone',
     'Sähkökatkos Kallion alueella',
     'Helen ilmoitti sähkökatkoksesta Hämeentie-Fleminginkatu alueella. Arvioitu kesto 2 tuntia.',
     'Kallio',
     60.1838, 24.9495,
     NOW() + INTERVAL '12 hours', NULL, NULL, TRUE,
     NOW() - INTERVAL '1 hour'),

    ('b0000007-0007-0007-0007-000000000003',
     'a5555555-5555-5555-5555-555555555555',
     'tilannehuone',
     'Liikennekatko Mannerheimintie — raitiovaunu ei kulje',
     'Raitiovaunulinjat 4 ja 10 eivät kulje Töölön kohdalla putkirikon takia. Korvaavat bussit käytössä.',
     'Töölö',
     60.1755, 24.9215,
     NOW() + INTERVAL '2 days', NULL, NULL, TRUE,
     NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. EVENTS — 5 events (3 linked to tapahtuma posts, 2 standalone)
-- ============================================================
INSERT INTO public.events (id, post_id, creator_id, title, description, event_date, location_name, location_lat, location_lng, icon, max_attendees)
VALUES
    -- Event 1: linked to pihakirppis post
    ('c0000001-0001-0001-0001-000000000001',
     'b0000006-0006-0006-0006-000000000001',
     'a1111111-1111-1111-1111-111111111111',
     'Pihakirppis lauantaina Kalliossa',
     'Tule myymään tai ostamaan! Paikat ilmaisia, ota oma pöytä tai peitto mukaan. Kahvia tarjolla.',
     NOW() + INTERVAL '5 days',
     'Karhupuisto, Kallio',
     60.1841, 24.9520,
     'ShoppingBag',
     30),

    -- Event 2: linked to korjaustyöpaja post
    ('c0000002-0002-0002-0002-000000000002',
     'b0000006-0006-0006-0006-000000000002',
     'a2222222-2222-2222-2222-222222222222',
     'Ilmainen korjaustyöpaja',
     'Tuo rikkinäiset vaatteet, elektroniikan tai pyörän — korjataan yhdessä!',
     NOW() + INTERVAL '12 days',
     'Sörnäisten kirjasto',
     60.1878, 24.9639,
     'Wrench',
     20),

    -- Event 3: linked to lähiruokapiiri post
    ('c0000003-0003-0003-0003-000000000003',
     'b0000006-0006-0006-0006-000000000003',
     'a3333333-3333-3333-3333-333333333333',
     'Lähiruokapiirin tapaaminen',
     'Vallilan lähiruokapiiri tapaa taas! Teemana kesäkauden satokausi.',
     NOW() + INTERVAL '8 days',
     'Konepajapuisto, Vallila',
     60.1915, 24.9550,
     'Carrot',
     15),

    -- Event 4: standalone — Käpylän ulkoilmakonsertit
    ('c0000004-0004-0004-0004-000000000004',
     NULL,
     'a4444444-4444-4444-4444-444444444444',
     'Käpylän ulkoilmakonsertti',
     'Paikallisia muusikoita ja laulajia esiintymässä Käpylän puistossa. Tuo viltti ja eväät!',
     NOW() + INTERVAL '14 days',
     'Käpylän puisto',
     60.2100, 24.9530,
     'Music',
     50),

    -- Event 5: standalone — Punavuoren taidenäyttely
    ('c0000005-0005-0005-0005-000000000005',
     NULL,
     'a6666666-6666-6666-6666-666666666666',
     'Punavuoren paikallisten taidenäyttely',
     'Naapuruston taiteilijoiden teoksia esillä viikon ajan. Avajaiset perjantaina!',
     NOW() + INTERVAL '10 days',
     'Galleria Punavuori, Iso Roobertinkatu',
     60.1628, 24.9385,
     'Palette',
     40)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. EVENT ATTENDEES — 3-4 per event
-- ============================================================
INSERT INTO public.event_attendees (event_id, user_id)
VALUES
    -- Event 1: Pihakirppis
    ('c0000001-0001-0001-0001-000000000001', 'a1111111-1111-1111-1111-111111111111'),
    ('c0000001-0001-0001-0001-000000000001', 'a3333333-3333-3333-3333-333333333333'),
    ('c0000001-0001-0001-0001-000000000001', 'a5555555-5555-5555-5555-555555555555'),
    ('c0000001-0001-0001-0001-000000000001', 'a6666666-6666-6666-6666-666666666666'),

    -- Event 2: Korjaustyöpaja
    ('c0000002-0002-0002-0002-000000000002', 'a2222222-2222-2222-2222-222222222222'),
    ('c0000002-0002-0002-0002-000000000002', 'a4444444-4444-4444-4444-444444444444'),
    ('c0000002-0002-0002-0002-000000000002', 'a1111111-1111-1111-1111-111111111111'),

    -- Event 3: Lähiruokapiiri
    ('c0000003-0003-0003-0003-000000000003', 'a3333333-3333-3333-3333-333333333333'),
    ('c0000003-0003-0003-0003-000000000003', 'a1111111-1111-1111-1111-111111111111'),
    ('c0000003-0003-0003-0003-000000000003', 'a4444444-4444-4444-4444-444444444444'),
    ('c0000003-0003-0003-0003-000000000003', 'a5555555-5555-5555-5555-555555555555'),

    -- Event 4: Ulkoilmakonsertti
    ('c0000004-0004-0004-0004-000000000004', 'a4444444-4444-4444-4444-444444444444'),
    ('c0000004-0004-0004-0004-000000000004', 'a1111111-1111-1111-1111-111111111111'),
    ('c0000004-0004-0004-0004-000000000004', 'a6666666-6666-6666-6666-666666666666'),

    -- Event 5: Taidenäyttely
    ('c0000005-0005-0005-0005-000000000005', 'a6666666-6666-6666-6666-666666666666'),
    ('c0000005-0005-0005-0005-000000000005', 'a3333333-3333-3333-3333-333333333333'),
    ('c0000005-0005-0005-0005-000000000005', 'a5555555-5555-5555-5555-555555555555'),
    ('c0000005-0005-0005-0005-000000000005', 'a2222222-2222-2222-2222-222222222222')
ON CONFLICT (event_id, user_id) DO NOTHING;


-- ============================================================
-- 6. HUBS — 2 local businesses
-- ============================================================
INSERT INTO public.hubs (id, user_id, name, type, address, icon, offers, lat, lng, is_active)
VALUES
    ('d0000001-0001-0001-0001-000000000001',
     'a2222222-2222-2222-2222-222222222222',
     'Sörnäisten kirjasto',
     'kirjasto',
     'Sörnäisten rantatie 1, Helsinki',
     'Library',
     'Ilmainen noutopiste, Korjaustyöpajat, Kirjalainaus',
     60.1878, 24.9639,
     TRUE),

    ('d0000002-0002-0002-0002-000000000002',
     NULL,
     'Kallio Kahvila',
     'kahvila',
     'Vaasankatu 12, Helsinki',
     'Coffee',
     'Naapurialennus -10%, Noutopiste, Ilmoitustaulu',
     60.1845, 24.9500,
     TRUE)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 7. CONVERSATIONS — 3 conversations with messages
-- ============================================================
INSERT INTO public.conversations (id, user1_id, user2_id, post_id, is_group, created_at, updated_at)
VALUES
    -- Conversation 1: Sofia asks Minna about the drill
    ('e0000001-0001-0001-0001-000000000001',
     'a5555555-5555-5555-5555-555555555555',
     'a1111111-1111-1111-1111-111111111111',
     'b0000001-0001-0001-0001-000000000001',
     FALSE,
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '30 minutes'),

    -- Conversation 2: Eero contacts Aino about gardening tools
    ('e0000002-0002-0002-0002-000000000002',
     'a4444444-4444-4444-4444-444444444444',
     'a3333333-3333-3333-3333-333333333333',
     'b0000001-0001-0001-0001-000000000003',
     FALSE,
     NOW() - INTERVAL '4 hours',
     NOW() - INTERVAL '2 hours'),

    -- Conversation 3: Mikko contacts Minna about the sofa
    ('e0000003-0003-0003-0003-000000000003',
     'a6666666-6666-6666-6666-666666666666',
     'a1111111-1111-1111-1111-111111111111',
     'b0000003-0003-0003-0003-000000000001',
     FALSE,
     NOW() - INTERVAL '3 days',
     NOW() - INTERVAL '2 days')
ON CONFLICT (user1_id, user2_id) DO NOTHING;


-- ============================================================
-- 8. MESSAGES
-- ============================================================
INSERT INTO public.messages (conversation_id, sender_id, content, is_read, created_at)
VALUES
    -- Conversation 1: About the drill
    ('e0000001-0001-0001-0001-000000000001',
     'a5555555-5555-5555-5555-555555555555',
     'Moi! Onko porakone vielä saatavilla? Tarvitsisin sitä ensi lauantaina.',
     TRUE,
     NOW() - INTERVAL '1 day'),

    ('e0000001-0001-0001-0001-000000000001',
     'a1111111-1111-1111-1111-111111111111',
     'Moi Sofia! Joo on, voit hakea sen perjantai-iltana jos sopii. Asun Fleminginkadulla.',
     TRUE,
     NOW() - INTERVAL '23 hours'),

    ('e0000001-0001-0001-0001-000000000001',
     'a5555555-5555-5555-5555-555555555555',
     'Mahtavaa, kiitos! Tuun hakemaan noin klo 18. Palautusko sunnuntaina?',
     FALSE,
     NOW() - INTERVAL '30 minutes'),

    -- Conversation 2: About gardening tools
    ('e0000002-0002-0002-0002-000000000002',
     'a4444444-4444-4444-4444-444444444444',
     'Hei Aino! Minulla on ylimääräisiä puutarhatyökaluja joista voisi olla sinulle hyötyä. Kiinnostaako?',
     TRUE,
     NOW() - INTERVAL '4 hours'),

    ('e0000002-0002-0002-0002-000000000002',
     'a3333333-3333-3333-3333-333333333333',
     'Tosi kiva! Ehdottomasti kiinnostaa. Onko kastelukannu mukana?',
     TRUE,
     NOW() - INTERVAL '3 hours'),

    ('e0000002-0002-0002-0002-000000000002',
     'a4444444-4444-4444-4444-444444444444',
     'On joo, ja pieni istutuslapio myös. Voin tuoda ne Konepajapuistoon jos tulet sinne lähiruokapiiriin?',
     FALSE,
     NOW() - INTERVAL '2 hours'),

    -- Conversation 3: About the sofa
    ('e0000003-0003-0003-0003-000000000003',
     'a6666666-6666-6666-6666-666666666666',
     'Hei! Onko se harmaa sohva vielä vapaana? Voisin tulla hakemaan huomenna.',
     TRUE,
     NOW() - INTERVAL '3 days'),

    ('e0000003-0003-0003-0003-000000000003',
     'a1111111-1111-1111-1111-111111111111',
     'Moikka Mikko! On kyllä. Tarvitset tosin kaverin mukaan, painaa jonkin verran. 3. kerros ilman hissiä!',
     TRUE,
     NOW() - INTERVAL '2 days' - INTERVAL '20 hours')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 9. NOTIFICATIONS — 6 notifications
-- ============================================================
INSERT INTO public.notifications (user_id, from_user_id, type, title, body, link_type, link_id, is_read, created_at)
VALUES
    ('a1111111-1111-1111-1111-111111111111',
     'a5555555-5555-5555-5555-555555555555',
     'message',
     'Uusi viesti Sofialta',
     'Sofia Laine lähetti sinulle viestin koskien ilmoitusta "Tarvitsen porakoneen viikonlopuksi".',
     'conversation',
     'e0000001-0001-0001-0001-000000000001',
     FALSE,
     NOW() - INTERVAL '30 minutes'),

    ('a3333333-3333-3333-3333-333333333333',
     'a4444444-4444-4444-4444-444444444444',
     'message',
     'Uusi viesti Eerolta',
     'Eero Nieminen tarjoutui tuomaan puutarhatyökaluja!',
     'conversation',
     'e0000002-0002-0002-0002-000000000002',
     FALSE,
     NOW() - INTERVAL '2 hours'),

    ('a1111111-1111-1111-1111-111111111111',
     'a6666666-6666-6666-6666-666666666666',
     'message',
     'Uusi viesti Mikolta',
     'Mikko Hämäläinen on kiinnostunut sohvastasi.',
     'conversation',
     'e0000003-0003-0003-0003-000000000003',
     TRUE,
     NOW() - INTERVAL '3 days'),

    ('a5555555-5555-5555-5555-555555555555',
     NULL,
     'event',
     'Tapahtuma lähestyy!',
     'Pihakirppis lauantaina Kalliossa on 5 päivän päästä.',
     'event',
     'c0000001-0001-0001-0001-000000000001',
     FALSE,
     NOW() - INTERVAL '1 hour'),

    ('a2222222-2222-2222-2222-222222222222',
     'a4444444-4444-4444-4444-444444444444',
     'event_join',
     'Uusi osallistuja!',
     'Eero Nieminen ilmoittautui korjaustyöpajaasi.',
     'event',
     'c0000002-0002-0002-0002-000000000002',
     TRUE,
     NOW() - INTERVAL '1 day'),

    ('a6666666-6666-6666-6666-666666666666',
     'a1111111-1111-1111-1111-111111111111',
     'review',
     'Sait uuden arvostelun!',
     'Minna Korhonen antoi sinulle arvostelun.',
     'profile',
     'a6666666-6666-6666-6666-666666666666',
     FALSE,
     NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 10. REVIEWS — 4 reviews between users
-- ============================================================
INSERT INTO public.reviews (reviewer_id, reviewed_id, post_id, rating, comment, created_at)
VALUES
    ('a1111111-1111-1111-1111-111111111111',
     'a6666666-6666-6666-6666-666666666666',
     'b0000002-0002-0002-0002-000000000003',
     5,
     'Mikko kuvasi pihakirppiksen todella hienosti! Suosittelen lämpimästi.',
     NOW() - INTERVAL '2 days'),

    ('a3333333-3333-3333-3333-333333333333',
     'a4444444-4444-4444-4444-444444444444',
     'b0000002-0002-0002-0002-000000000001',
     5,
     'Eero kokosi IKEA-hyllyn puolessa tunnissa. Tosi ammattimaista työtä!',
     NOW() - INTERVAL '1 week'),

    ('a5555555-5555-5555-5555-555555555555',
     'a1111111-1111-1111-1111-111111111111',
     'b0000003-0003-0003-0003-000000000001',
     4,
     'Sohva oli juuri niin kuin kuvauksessa. Kiitos Minna!',
     NOW() - INTERVAL '3 days'),

    ('a2222222-2222-2222-2222-222222222222',
     'a5555555-5555-5555-5555-555555555555',
     'b0000002-0002-0002-0002-000000000002',
     5,
     'Sofia on ihana lastenhoitaja! Lapset tykkäsivät kovasti.',
     NOW() - INTERVAL '5 days')
ON CONFLICT (reviewer_id, reviewed_id, post_id) DO NOTHING;


-- ============================================================
-- 11. SAVED POSTS — a few saved posts
-- ============================================================
INSERT INTO public.saved_posts (user_id, post_id)
VALUES
    ('a5555555-5555-5555-5555-555555555555', 'b0000003-0003-0003-0003-000000000001'),
    ('a5555555-5555-5555-5555-555555555555', 'b0000005-0005-0005-0005-000000000001'),
    ('a3333333-3333-3333-3333-333333333333', 'b0000002-0002-0002-0002-000000000001'),
    ('a6666666-6666-6666-6666-666666666666', 'b0000006-0006-0006-0006-000000000001'),
    ('a1111111-1111-1111-1111-111111111111', 'b0000006-0006-0006-0006-000000000002')
ON CONFLICT (user_id, post_id) DO NOTHING;


-- ============================================================
-- 12. Re-add the FK constraint from profiles → auth.users
--     This will fail if auth.users rows don't exist, which
--     is expected for seed data. Comment out if you want to
--     keep profiles without matching auth.users.
-- ============================================================
-- Uncomment the line below ONLY if you have matching auth.users rows:
-- ALTER TABLE public.profiles
--     ADD CONSTRAINT profiles_id_fkey
--     FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- DONE! Seed data inserted.
-- To re-enable the FK after creating real auth users, run:
--
--   ALTER TABLE public.profiles
--       ADD CONSTRAINT profiles_id_fkey
--       FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- ============================================================

COMMIT;
