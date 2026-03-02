-- ============================================================
-- FIX 1: Delete nappaa and tilannehuone posts
-- ============================================================
DELETE FROM public.posts WHERE type = 'nappaa';
DELETE FROM public.posts WHERE type = 'tilannehuone';

-- ============================================================
-- FIX 2: Fix ääkköset (UTF-8 encoding issues) in all tables
-- Re-insert profiles with correct encoding
-- ============================================================
UPDATE public.profiles SET
    name = 'Minna Korhonen',
    bio = 'Kahden lapsen äiti Kalliosta. Tykkään kierrättää ja auttaa naapureita!',
    naapurusto = 'Kallio'
WHERE id = 'a1111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET
    name = 'Lauri Virtanen',
    bio = 'Sörnäisten kirjaston vapaaehtoinen. Kirjat ja yhteisö lähellä sydäntä.',
    naapurusto = 'Sörnäinen'
WHERE id = 'a2222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET
    name = 'Aino Mäkelä',
    bio = 'Graafikko Vallilasta. Rakastan lähiruokaa ja kaupunkiviljelyä.',
    naapurusto = 'Vallila'
WHERE id = 'a3333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET
    name = 'Eero Nieminen',
    bio = 'Eläkkeellä oleva puuseppä. Korjaan mielelläni huonekaluja naapureille.',
    naapurusto = 'Käpylä'
WHERE id = 'a4444444-4444-4444-4444-444444444444';

UPDATE public.profiles SET
    name = 'Sofia Laine',
    bio = 'Opiskelija Töölöstä. Etsin edullisia huonekaluja ja tarjoan lastenhoitoapua.',
    naapurusto = 'Töölö'
WHERE id = 'a5555555-5555-5555-5555-555555555555';

UPDATE public.profiles SET
    name = 'Mikko Hämäläinen',
    bio = 'Freelance-valokuvaaja Punavuoresta. Voin auttaa muuttokuvauksissa ja tapahtumissa.',
    naapurusto = 'Punavuori'
WHERE id = 'a6666666-6666-6666-6666-666666666666';

-- ============================================================
-- FIX 3: Fix posts text encoding
-- ============================================================
-- tarvitsen
UPDATE public.posts SET
    title = 'Tarvitsen porakoneen viikonlopuksi',
    description = 'Pitäisi asentaa hyllyjä seinälle. Tarvitsisin iskuporakoneen la-su käyttöön. Voin hakea itse!',
    location = 'Kallio'
WHERE id = 'b0000001-0001-0001-0001-000000000001';

UPDATE public.posts SET
    title = 'Tarvitsen pyöränkorjauspumppua',
    description = 'Takarengas meni tyhjäksi eikä lähikaupasta löytynyt pumppua. Kelpaisi lainaksikin hetkeksi!',
    location = 'Töölö'
WHERE id = 'b0000001-0001-0001-0001-000000000002';

UPDATE public.posts SET
    title = 'Etsin kastelukannua ja puutarhatyökaluja',
    description = 'Aloitin parvekeviljelyn ja tarvitsisin perustyökalut alkuun. Pieni kastelukannu ja istutuslapio riittäisi.',
    location = 'Vallila'
WHERE id = 'b0000001-0001-0001-0001-000000000003';

-- tarjoan
UPDATE public.posts SET
    title = 'Tarjoan apua huonekalujen kokoamisessa',
    description = 'Olen eläkkeellä oleva puuseppä. Voin auttaa IKEA-huonekalujen tai muiden kokoamisessa. Omat työkalut mukana.',
    location = 'Käpylä'
WHERE id = 'b0000002-0002-0002-0002-000000000001';

UPDATE public.posts SET
    title = 'Tarjoan lastenhoitoapua iltaisin',
    description = 'Lastentarhanopettajaopiskelija, kokenut lastenhoitaja. Voin tulla hoitamaan lapsia arkisin klo 17 jälkeen.',
    location = 'Töölö'
WHERE id = 'b0000002-0002-0002-0002-000000000002';

UPDATE public.posts SET
    title = 'Valokuvausapua tapahtumiin',
    description = 'Olen freelance-valokuvaaja ja voin kuvata paikallisia tapahtumia, kirpputoreja tai yhteisöjuttuja ilmaiseksi.',
    location = 'Punavuori'
WHERE id = 'b0000002-0002-0002-0002-000000000003';

-- ilmaista
UPDATE public.posts SET
    title = 'Ilmainen sohva — hyvässä kunnossa',
    description = 'Harmaa 3-istuttava sohva, käytetty 2 vuotta. Päällinen vähän kulunut mutta toimiva. Pitää hakea itse 3. krs.',
    location = 'Kallio, Fleminginkatu'
WHERE id = 'b0000003-0003-0003-0003-000000000001';

UPDATE public.posts SET
    title = 'Lastenvaatteita 92-110 cm',
    description = 'Puhdas kassi lastenvaatteita, sesonkivaatteet mukana. Haettavissa Vallilasta.',
    location = 'Vallila'
WHERE id = 'b0000003-0003-0003-0003-000000000002';

UPDATE public.posts SET
    title = 'Vanhoja puutyökaluja',
    description = 'Höylä, talttoja ja vanha vasara. Kaikki toimivia mutta eivät enää käytössä. Sopii aloittelijalle.',
    location = 'Käpylä'
WHERE id = 'b0000003-0003-0003-0003-000000000003';

-- lainaa
UPDATE public.posts SET
    title = 'Sähköpyörä vuokralle',
    description = 'Hyväkuntoinen sähköpyörä arkiliikkumiseen. Akku kestää ~60 km. Laina-aika maks. 7 päivää.',
    location = 'Käpylä'
WHERE id = 'b0000005-0005-0005-0005-000000000001';

UPDATE public.posts SET
    title = 'Kamera (Canon EOS R50) lainaan',
    description = 'Lainaan Canon EOS R50 -kameran viikon tai viikonlopun ajaksi. Sisältää 18-45mm objektiivin.',
    location = 'Punavuori'
WHERE id = 'b0000005-0005-0005-0005-000000000002';

UPDATE public.posts SET
    title = 'Peräkärry lainattavissa',
    description = 'Pieni peräkärry (kantavuus 300 kg) muuttoja tai isompia kuljetuksia varten. Vain perjantaista sunnuntaihin.',
    location = 'Kallio'
WHERE id = 'b0000005-0005-0005-0005-000000000003';

-- tapahtuma
UPDATE public.posts SET
    title = 'Pihakirppis lauantaina Kalliossa',
    description = 'Tule myymään tai ostamaan! Paikat ilmaisia, ota oma pöytä tai peitto mukaan. Kahvia tarjolla.',
    location = 'Kallio, Karhupuisto'
WHERE id = 'b0000006-0006-0006-0006-000000000001';

UPDATE public.posts SET
    title = 'Ilmainen korjaustyöpaja Sörnäisissä',
    description = 'Tuo rikkinäiset vaatteet, elektroniikan tai pyörän — korjataan yhdessä! Paikkana Sörnäisten kirjasto.',
    location = 'Sörnäisten kirjasto'
WHERE id = 'b0000006-0006-0006-0006-000000000002';

UPDATE public.posts SET
    title = 'Lähiruokapiirin tapaaminen',
    description = 'Vallilan lähiruokapiiri tapaa taas! Tällä kertaa teemana kesäkauden satokausi. Tervetuloa kaikki kiinnostuneet.',
    location = 'Vallila, Konepajapuisto'
WHERE id = 'b0000006-0006-0006-0006-000000000003';

-- ============================================================
-- FIX 4: Fix event icons (use emojis instead of text names)
-- ============================================================
UPDATE public.events SET
    title = 'Pihakirppis lauantaina Kalliossa',
    description = 'Tule myymään tai ostamaan! Paikat ilmaisia, ota oma pöytä tai peitto mukaan. Kahvia tarjolla.',
    location_name = 'Karhupuisto, Kallio',
    icon = '🛍️'
WHERE id = 'c0000001-0001-0001-0001-000000000001';

UPDATE public.events SET
    title = 'Ilmainen korjaustyöpaja',
    description = 'Tuo rikkinäiset vaatteet, elektroniikan tai pyörän — korjataan yhdessä!',
    location_name = 'Sörnäisten kirjasto',
    icon = '🔧'
WHERE id = 'c0000002-0002-0002-0002-000000000002';

UPDATE public.events SET
    title = 'Lähiruokapiirin tapaaminen',
    description = 'Vallilan lähiruokapiiri tapaa taas! Teemana kesäkauden satokausi.',
    location_name = 'Konepajapuisto, Vallila',
    icon = '🥕'
WHERE id = 'c0000003-0003-0003-0003-000000000003';

UPDATE public.events SET
    title = 'Käpylän ulkoilmakonsertti',
    description = 'Paikallisia muusikoita ja laulajia esiintymässä Käpylän puistossa. Tuo viltti ja eväät!',
    location_name = 'Käpylän puisto',
    icon = '🎵'
WHERE id = 'c0000004-0004-0004-0004-000000000004';

UPDATE public.events SET
    title = 'Punavuoren paikallisten taidenäyttely',
    description = 'Naapuruston taiteilijoiden teoksia esillä viikon ajan. Avajaiset perjantaina!',
    location_name = 'Galleria Punavuori, Iso Roobertinkatu',
    icon = '🎨'
WHERE id = 'c0000005-0005-0005-0005-000000000005';

-- ============================================================
-- FIX 5: Fix hub text encoding
-- ============================================================
UPDATE public.hubs SET
    name = 'Sörnäisten kirjasto',
    address = 'Sörnäisten rantatie 1, Helsinki',
    offers = 'Ilmainen noutopiste, Korjaustyöpajat, Kirjalainaus'
WHERE id = 'd0000001-0001-0001-0001-000000000001';

UPDATE public.hubs SET
    name = 'Kallio Kahvila',
    address = 'Vaasankatu 12, Helsinki',
    offers = 'Naapurialennus -10%, Noutopiste, Ilmoitustaulu'
WHERE id = 'd0000002-0002-0002-0002-000000000002';

-- ============================================================
-- FIX 6: Fix message text encoding
-- ============================================================
UPDATE public.messages SET content = 'Moi! Onko porakone vielä saatavilla? Tarvitsisin sitä ensi lauantaina.'
WHERE conversation_id = 'e0000001-0001-0001-0001-000000000001' AND sender_id = 'a5555555-5555-5555-5555-555555555555' AND content LIKE '%porakone%';

UPDATE public.messages SET content = 'Moi Sofia! Joo on, voit hakea sen perjantai-iltana jos sopii. Asun Fleminginkadulla.'
WHERE conversation_id = 'e0000001-0001-0001-0001-000000000001' AND sender_id = 'a1111111-1111-1111-1111-111111111111';

UPDATE public.messages SET content = 'Mahtavaa, kiitos! Tuun hakemaan noin klo 18. Palautusko sunnuntaina?'
WHERE conversation_id = 'e0000001-0001-0001-0001-000000000001' AND sender_id = 'a5555555-5555-5555-5555-555555555555' AND content LIKE '%18%';

UPDATE public.messages SET content = 'Hei Aino! Minulla on ylimääräisiä puutarhatyökaluja joista voisi olla sinulle hyötyä. Kiinnostaako?'
WHERE conversation_id = 'e0000002-0002-0002-0002-000000000002' AND sender_id = 'a4444444-4444-4444-4444-444444444444' AND content LIKE '%puutarha%';

UPDATE public.messages SET content = 'Tosi kiva! Ehdottomasti kiinnostaa. Onko kastelukannu mukana?'
WHERE conversation_id = 'e0000002-0002-0002-0002-000000000002' AND sender_id = 'a3333333-3333-3333-3333-333333333333';

UPDATE public.messages SET content = 'On joo, ja pieni istutuslapio myös. Voin tuoda ne Konepajapuistoon jos tulet sinne lähiruokapiiriin?'
WHERE conversation_id = 'e0000002-0002-0002-0002-000000000002' AND sender_id = 'a4444444-4444-4444-4444-444444444444' AND content LIKE '%istutus%';

UPDATE public.messages SET content = 'Hei! Onko se harmaa sohva vielä vapaana? Voisin tulla hakemaan huomenna.'
WHERE conversation_id = 'e0000003-0003-0003-0003-000000000003' AND sender_id = 'a6666666-6666-6666-6666-666666666666';

UPDATE public.messages SET content = 'Moikka Mikko! On kyllä. Tarvitset tosin kaverin mukaan, painaa jonkin verran. 3. kerros ilman hissiä!'
WHERE conversation_id = 'e0000003-0003-0003-0003-000000000003' AND sender_id = 'a1111111-1111-1111-1111-111111111111';

-- ============================================================
-- FIX 7: Fix notification text encoding
-- ============================================================
UPDATE public.notifications SET
    title = 'Uusi viesti Sofialta',
    body = 'Sofia Laine lähetti sinulle viestin koskien ilmoitusta "Tarvitsen porakoneen viikonlopuksi".'
WHERE user_id = 'a1111111-1111-1111-1111-111111111111' AND type = 'message' AND from_user_id = 'a5555555-5555-5555-5555-555555555555';

UPDATE public.notifications SET
    title = 'Uusi viesti Eerolta',
    body = 'Eero Nieminen tarjoutui tuomaan puutarhatyökaluja!'
WHERE user_id = 'a3333333-3333-3333-3333-333333333333' AND type = 'message';

UPDATE public.notifications SET
    title = 'Uusi viesti Mikolta',
    body = 'Mikko Hämäläinen on kiinnostunut sohvastasi.'
WHERE user_id = 'a1111111-1111-1111-1111-111111111111' AND type = 'message' AND from_user_id = 'a6666666-6666-6666-6666-666666666666';

UPDATE public.notifications SET
    title = 'Tapahtuma lähestyy!',
    body = 'Pihakirppis lauantaina Kalliossa on 5 päivän päästä.'
WHERE type = 'event' AND user_id = 'a5555555-5555-5555-5555-555555555555';

UPDATE public.notifications SET
    title = 'Uusi osallistuja!',
    body = 'Eero Nieminen ilmoittautui korjaustyöpajaasi.'
WHERE type = 'event_join';

UPDATE public.notifications SET
    title = 'Sait uuden arvostelun!',
    body = 'Minna Korhonen antoi sinulle arvostelun.'
WHERE type = 'review';

-- ============================================================
-- FIX 8: Fix review text encoding
-- ============================================================
UPDATE public.reviews SET comment = 'Mikko kuvasi pihakirppiksen todella hienosti! Suosittelen lämpimästi.'
WHERE reviewer_id = 'a1111111-1111-1111-1111-111111111111' AND reviewed_id = 'a6666666-6666-6666-6666-666666666666';

UPDATE public.reviews SET comment = 'Eero kokosi IKEA-hyllyn puolessa tunnissa. Tosi ammattimaista työtä!'
WHERE reviewer_id = 'a3333333-3333-3333-3333-333333333333' AND reviewed_id = 'a4444444-4444-4444-4444-444444444444';

UPDATE public.reviews SET comment = 'Sohva oli juuri niin kuin kuvauksessa. Kiitos Minna!'
WHERE reviewer_id = 'a5555555-5555-5555-5555-555555555555' AND reviewed_id = 'a1111111-1111-1111-1111-111111111111';

UPDATE public.reviews SET comment = 'Sofia on ihana lastenhoitaja! Lapset tykkäsivät kovasti.'
WHERE reviewer_id = 'a2222222-2222-2222-2222-222222222222' AND reviewed_id = 'a5555555-5555-5555-5555-555555555555';
