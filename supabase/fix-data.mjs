/**
 * Fix seed data via Supabase REST API
 * Bypasses clipboard/SQL Editor UTF-8 corruption
 * Run: node supabase/fix-data.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pvvruolhaxzrfkxngpgu.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) {
  console.error('❌ Set SUPABASE_SERVICE_ROLE_KEY env var first (check .env.local)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function fixData() {
  console.log('🔧 Fixing seed data via API...\n')

  // ── FIX 1: Delete nappaa and tilannehuone posts ──
  console.log('1. Deleting nappaa and tilannehuone posts...')
  await supabase.from('posts').delete().eq('type', 'nappaa')
  await supabase.from('posts').delete().eq('type', 'tilannehuone')
  console.log('   ✅ Done\n')

  // ── FIX 2: Fix profiles ──
  console.log('2. Fixing profiles (ääkköset)...')
  const profiles = [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Minna Korhonen',
      bio: 'Kahden lapsen äiti Kalliosta. Tykkään kierrättää ja auttaa naapureita!',
      naapurusto: 'Kallio',
    },
    {
      id: 'a2222222-2222-2222-2222-222222222222',
      name: 'Lauri Virtanen',
      bio: 'Sörnäisten kirjaston vapaaehtoinen. Kirjat ja yhteisö lähellä sydäntä.',
      naapurusto: 'Sörnäinen',
    },
    {
      id: 'a3333333-3333-3333-3333-333333333333',
      name: 'Aino Mäkelä',
      bio: 'Graafikko Vallilasta. Rakastan lähiruokaa ja kaupunkiviljelyä.',
      naapurusto: 'Vallila',
    },
    {
      id: 'a4444444-4444-4444-4444-444444444444',
      name: 'Eero Nieminen',
      bio: 'Eläkkeellä oleva puuseppä. Korjaan mielelläni huonekaluja naapureille.',
      naapurusto: 'Käpylä',
    },
    {
      id: 'a5555555-5555-5555-5555-555555555555',
      name: 'Sofia Laine',
      bio: 'Opiskelija Töölöstä. Etsin edullisia huonekaluja ja tarjoan lastenhoitoapua.',
      naapurusto: 'Töölö',
    },
    {
      id: 'a6666666-6666-6666-6666-666666666666',
      name: 'Mikko Hämäläinen',
      bio: 'Freelance-valokuvaaja Punavuoresta. Voin auttaa muuttokuvauksissa ja tapahtumissa.',
      naapurusto: 'Punavuori',
    },
  ]

  for (const p of profiles) {
    const { error } = await supabase
      .from('profiles')
      .update({ name: p.name, bio: p.bio, naapurusto: p.naapurusto })
      .eq('id', p.id)
    if (error) console.log(`   ❌ Profile ${p.name}: ${error.message}`)
    else console.log(`   ✅ ${p.name}`)
  }

  // ── FIX 3: Fix posts ──
  console.log('\n3. Fixing posts (ääkköset)...')
  const posts = [
    // tarvitsen
    {
      id: 'b0000001-0001-0001-0001-000000000001',
      title: 'Tarvitsen porakoneen viikonlopuksi',
      description: 'Pitäisi asentaa hyllyjä seinälle. Tarvitsisin iskuporakoneen la-su käyttöön. Voin hakea itse!',
      location: 'Kallio',
    },
    {
      id: 'b0000001-0001-0001-0001-000000000002',
      title: 'Tarvitsen pyöränkorjauspumppua',
      description: 'Takarengas meni tyhjäksi eikä lähikaupasta löytynyt pumppua. Kelpaisi lainaksikin hetkeksi!',
      location: 'Töölö',
    },
    {
      id: 'b0000001-0001-0001-0001-000000000003',
      title: 'Etsin kastelukannua ja puutarhatyökaluja',
      description: 'Aloitin parvekeviljelyn ja tarvitsisin perustyökalut alkuun. Pieni kastelukannu ja istutuslapio riittäisi.',
      location: 'Vallila',
    },
    // tarjoan
    {
      id: 'b0000002-0002-0002-0002-000000000001',
      title: 'Tarjoan apua huonekalujen kokoamisessa',
      description: 'Olen eläkkeellä oleva puuseppä. Voin auttaa IKEA-huonekalujen tai muiden kokoamisessa. Omat työkalut mukana.',
      location: 'Käpylä',
    },
    {
      id: 'b0000002-0002-0002-0002-000000000002',
      title: 'Tarjoan lastenhoitoapua iltaisin',
      description: 'Lastentarhanopettajaopiskelija, kokenut lastenhoitaja. Voin tulla hoitamaan lapsia arkisin klo 17 jälkeen.',
      location: 'Töölö',
    },
    {
      id: 'b0000002-0002-0002-0002-000000000003',
      title: 'Valokuvausapua tapahtumiin',
      description: 'Olen freelance-valokuvaaja ja voin kuvata paikallisia tapahtumia, kirpputoreja tai yhteisöjuttuja ilmaiseksi.',
      location: 'Punavuori',
    },
    // ilmaista
    {
      id: 'b0000003-0003-0003-0003-000000000001',
      title: 'Ilmainen sohva — hyvässä kunnossa',
      description: 'Harmaa 3-istuttava sohva, käytetty 2 vuotta. Päällinen vähän kulunut mutta toimiva. Pitää hakea itse 3. krs.',
      location: 'Kallio, Fleminginkatu',
    },
    {
      id: 'b0000003-0003-0003-0003-000000000002',
      title: 'Lastenvaatteita 92-110 cm',
      description: 'Puhdas kassi lastenvaatteita, sesonkivaatteet mukana. Haettavissa Vallilasta.',
      location: 'Vallila',
    },
    {
      id: 'b0000003-0003-0003-0003-000000000003',
      title: 'Vanhoja puutyökaluja',
      description: 'Höylä, talttoja ja vanha vasara. Kaikki toimivia mutta eivät enää käytössä. Sopii aloittelijalle.',
      location: 'Käpylä',
    },
    // lainaa
    {
      id: 'b0000005-0005-0005-0005-000000000001',
      title: 'Sähköpyörä vuokralle',
      description: 'Hyväkuntoinen sähköpyörä arkiliikkumiseen. Akku kestää ~60 km. Laina-aika maks. 7 päivää.',
      location: 'Käpylä',
    },
    {
      id: 'b0000005-0005-0005-0005-000000000002',
      title: 'Kamera (Canon EOS R50) lainaan',
      description: 'Lainaan Canon EOS R50 -kameran viikon tai viikonlopun ajaksi. Sisältää 18-45mm objektiivin.',
      location: 'Punavuori',
    },
    {
      id: 'b0000005-0005-0005-0005-000000000003',
      title: 'Peräkärry lainattavissa',
      description: 'Pieni peräkärry (kantavuus 300 kg) muuttoja tai isompia kuljetuksia varten. Vain perjantaista sunnuntaihin.',
      location: 'Kallio',
    },
    // tapahtuma
    {
      id: 'b0000006-0006-0006-0006-000000000001',
      title: 'Pihakirppis lauantaina Kalliossa',
      description: 'Tule myymään tai ostamaan! Paikat ilmaisia, ota oma pöytä tai peitto mukaan. Kahvia tarjolla.',
      location: 'Kallio, Karhupuisto',
    },
    {
      id: 'b0000006-0006-0006-0006-000000000002',
      title: 'Ilmainen korjaustyöpaja Sörnäisissä',
      description: 'Tuo rikkinäiset vaatteet, elektroniikan tai pyörän — korjataan yhdessä! Paikkana Sörnäisten kirjasto.',
      location: 'Sörnäisten kirjasto',
    },
    {
      id: 'b0000006-0006-0006-0006-000000000003',
      title: 'Lähiruokapiirin tapaaminen',
      description: 'Vallilan lähiruokapiiri tapaa taas! Tällä kertaa teemana kesäkauden satokausi. Tervetuloa kaikki kiinnostuneet.',
      location: 'Vallila, Konepajapuisto',
    },
  ]

  for (const p of posts) {
    const { error } = await supabase
      .from('posts')
      .update({ title: p.title, description: p.description, location: p.location })
      .eq('id', p.id)
    if (error) console.log(`   ❌ Post ${p.id}: ${error.message}`)
    else console.log(`   ✅ ${p.title}`)
  }

  // ── FIX 4: Fix events (ääkköset + emoji icons) ──
  console.log('\n4. Fixing events (ääkköset + emoji icons)...')
  const events = [
    {
      id: 'c0000001-0001-0001-0001-000000000001',
      title: 'Pihakirppis lauantaina Kalliossa',
      description: 'Tule myymään tai ostamaan! Paikat ilmaisia, ota oma pöytä tai peitto mukaan. Kahvia tarjolla.',
      location_name: 'Karhupuisto, Kallio',
      icon: '🛍️',
    },
    {
      id: 'c0000002-0002-0002-0002-000000000002',
      title: 'Ilmainen korjaustyöpaja',
      description: 'Tuo rikkinäiset vaatteet, elektroniikan tai pyörän — korjataan yhdessä!',
      location_name: 'Sörnäisten kirjasto',
      icon: '🔧',
    },
    {
      id: 'c0000003-0003-0003-0003-000000000003',
      title: 'Lähiruokapiirin tapaaminen',
      description: 'Vallilan lähiruokapiiri tapaa taas! Teemana kesäkauden satokausi.',
      location_name: 'Konepajapuisto, Vallila',
      icon: '🥕',
    },
    {
      id: 'c0000004-0004-0004-0004-000000000004',
      title: 'Käpylän ulkoilmakonsertti',
      description: 'Paikallisia muusikoita ja laulajia esiintymässä Käpylän puistossa. Tuo viltti ja eväät!',
      location_name: 'Käpylän puisto',
      icon: '🎵',
    },
    {
      id: 'c0000005-0005-0005-0005-000000000005',
      title: 'Punavuoren paikallisten taidenäyttely',
      description: 'Naapuruston taiteilijoiden teoksia esillä viikon ajan. Avajaiset perjantaina!',
      location_name: 'Galleria Punavuori, Iso Roobertinkatu',
      icon: '🎨',
    },
  ]

  for (const e of events) {
    const { error } = await supabase
      .from('events')
      .update({
        title: e.title,
        description: e.description,
        location_name: e.location_name,
        icon: e.icon,
      })
      .eq('id', e.id)
    if (error) console.log(`   ❌ Event ${e.id}: ${error.message}`)
    else console.log(`   ✅ ${e.icon} ${e.title}`)
  }

  // ── FIX 5: Fix hubs ──
  console.log('\n5. Fixing hubs (ääkköset)...')
  const hubs = [
    {
      id: 'd0000001-0001-0001-0001-000000000001',
      name: 'Sörnäisten kirjasto',
      address: 'Sörnäisten rantatie 1, Helsinki',
      offers: 'Ilmainen noutopiste, Korjaustyöpajat, Kirjalainaus',
    },
    {
      id: 'd0000002-0002-0002-0002-000000000002',
      name: 'Kallio Kahvila',
      address: 'Vaasankatu 12, Helsinki',
      offers: 'Naapurialennus -10%, Noutopiste, Ilmoitustaulu',
    },
  ]

  for (const h of hubs) {
    const { error } = await supabase
      .from('hubs')
      .update({ name: h.name, address: h.address, offers: h.offers })
      .eq('id', h.id)
    if (error) console.log(`   ❌ Hub ${h.id}: ${error.message}`)
    else console.log(`   ✅ ${h.name}`)
  }

  // ── FIX 6: Fix messages ──
  console.log('\n6. Fixing messages (ääkköset)...')

  // Get all messages and update them by ID
  const { data: allMessages } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id')
    .order('created_at', { ascending: true })

  if (allMessages && allMessages.length > 0) {
    // Conversation 1: Minna & Sofia about drill
    const conv1Msgs = allMessages.filter(
      (m) => m.conversation_id === 'e0000001-0001-0001-0001-000000000001'
    )
    const conv1Texts = [
      'Moi! Onko porakone vielä saatavilla? Tarvitsisin sitä ensi lauantaina.',
      'Moi Sofia! Joo on, voit hakea sen perjantai-iltana jos sopii. Asun Fleminginkadulla.',
      'Mahtavaa, kiitos! Tuun hakemaan noin klo 18. Palautusko sunnuntaina?',
    ]
    for (let i = 0; i < Math.min(conv1Msgs.length, conv1Texts.length); i++) {
      const { error } = await supabase
        .from('messages')
        .update({ content: conv1Texts[i] })
        .eq('id', conv1Msgs[i].id)
      if (error) console.log(`   ❌ Msg ${conv1Msgs[i].id}: ${error.message}`)
      else console.log(`   ✅ Conv1 msg ${i + 1}`)
    }

    // Conversation 2: Eero & Aino about garden tools
    const conv2Msgs = allMessages.filter(
      (m) => m.conversation_id === 'e0000002-0002-0002-0002-000000000002'
    )
    const conv2Texts = [
      'Hei Aino! Minulla on ylimääräisiä puutarhatyökaluja joista voisi olla sinulle hyötyä. Kiinnostaako?',
      'Tosi kiva! Ehdottomasti kiinnostaa. Onko kastelukannu mukana?',
      'On joo, ja pieni istutuslapio myös. Voin tuoda ne Konepajapuistoon jos tulet sinne lähiruokapiiriin?',
    ]
    for (let i = 0; i < Math.min(conv2Msgs.length, conv2Texts.length); i++) {
      const { error } = await supabase
        .from('messages')
        .update({ content: conv2Texts[i] })
        .eq('id', conv2Msgs[i].id)
      if (error) console.log(`   ❌ Msg ${conv2Msgs[i].id}: ${error.message}`)
      else console.log(`   ✅ Conv2 msg ${i + 1}`)
    }

    // Conversation 3: Mikko & Minna about sofa
    const conv3Msgs = allMessages.filter(
      (m) => m.conversation_id === 'e0000003-0003-0003-0003-000000000003'
    )
    const conv3Texts = [
      'Hei! Onko se harmaa sohva vielä vapaana? Voisin tulla hakemaan huomenna.',
      'Moikka Mikko! On kyllä. Tarvitset tosin kaverin mukaan, painaa jonkin verran. 3. kerros ilman hissiä!',
    ]
    for (let i = 0; i < Math.min(conv3Msgs.length, conv3Texts.length); i++) {
      const { error } = await supabase
        .from('messages')
        .update({ content: conv3Texts[i] })
        .eq('id', conv3Msgs[i].id)
      if (error) console.log(`   ❌ Msg ${conv3Msgs[i].id}: ${error.message}`)
      else console.log(`   ✅ Conv3 msg ${i + 1}`)
    }
  } else {
    console.log('   ⚠️  No messages found')
  }

  // ── FIX 7: Fix notifications ──
  console.log('\n7. Fixing notifications (ääkköset)...')
  const { data: allNotifs } = await supabase
    .from('notifications')
    .select('id, type, user_id, from_user_id')
    .order('created_at', { ascending: true })

  if (allNotifs && allNotifs.length > 0) {
    const notifUpdates = [
      {
        match: (n) =>
          n.type === 'message' &&
          n.user_id === 'a1111111-1111-1111-1111-111111111111' &&
          n.from_user_id === 'a5555555-5555-5555-5555-555555555555',
        title: 'Uusi viesti Sofialta',
        body: 'Sofia Laine lähetti sinulle viestin koskien ilmoitusta "Tarvitsen porakoneen viikonlopuksi".',
      },
      {
        match: (n) =>
          n.type === 'message' &&
          n.user_id === 'a3333333-3333-3333-3333-333333333333',
        title: 'Uusi viesti Eerolta',
        body: 'Eero Nieminen tarjoutui tuomaan puutarhatyökaluja!',
      },
      {
        match: (n) =>
          n.type === 'message' &&
          n.user_id === 'a1111111-1111-1111-1111-111111111111' &&
          n.from_user_id === 'a6666666-6666-6666-6666-666666666666',
        title: 'Uusi viesti Mikolta',
        body: 'Mikko Hämäläinen on kiinnostunut sohvastasi.',
      },
      {
        match: (n) =>
          n.type === 'event' &&
          n.user_id === 'a5555555-5555-5555-5555-555555555555',
        title: 'Tapahtuma lähestyy!',
        body: 'Pihakirppis lauantaina Kalliossa on 5 päivän päästä.',
      },
      {
        match: (n) => n.type === 'event_join',
        title: 'Uusi osallistuja!',
        body: 'Eero Nieminen ilmoittautui korjaustyöpajaasi.',
      },
      {
        match: (n) => n.type === 'review',
        title: 'Sait uuden arvostelun!',
        body: 'Minna Korhonen antoi sinulle arvostelun.',
      },
    ]

    for (const upd of notifUpdates) {
      const notif = allNotifs.find(upd.match)
      if (notif) {
        const { error } = await supabase
          .from('notifications')
          .update({ title: upd.title, body: upd.body })
          .eq('id', notif.id)
        if (error) console.log(`   ❌ Notif: ${error.message}`)
        else console.log(`   ✅ ${upd.title}`)
      }
    }
  } else {
    console.log('   ⚠️  No notifications found')
  }

  // ── FIX 8: Fix reviews ──
  console.log('\n8. Fixing reviews (ääkköset)...')
  const reviews = [
    {
      reviewer_id: 'a1111111-1111-1111-1111-111111111111',
      reviewed_id: 'a6666666-6666-6666-6666-666666666666',
      comment: 'Mikko kuvasi pihakirppiksen todella hienosti! Suosittelen lämpimästi.',
    },
    {
      reviewer_id: 'a3333333-3333-3333-3333-333333333333',
      reviewed_id: 'a4444444-4444-4444-4444-444444444444',
      comment: 'Eero kokosi IKEA-hyllyn puolessa tunnissa. Tosi ammattimaista työtä!',
    },
    {
      reviewer_id: 'a5555555-5555-5555-5555-555555555555',
      reviewed_id: 'a1111111-1111-1111-1111-111111111111',
      comment: 'Sohva oli juuri niin kuin kuvauksessa. Kiitos Minna!',
    },
    {
      reviewer_id: 'a2222222-2222-2222-2222-222222222222',
      reviewed_id: 'a5555555-5555-5555-5555-555555555555',
      comment: 'Sofia on ihana lastenhoitaja! Lapset tykkäsivät kovasti.',
    },
  ]

  for (const r of reviews) {
    const { error } = await supabase
      .from('reviews')
      .update({ comment: r.comment })
      .eq('reviewer_id', r.reviewer_id)
      .eq('reviewed_id', r.reviewed_id)
    if (error) console.log(`   ❌ Review: ${error.message}`)
    else console.log(`   ✅ Review by ${r.reviewer_id.substring(0, 8)}...`)
  }

  console.log('\n🎉 All fixes applied! Refresh the app to see the changes.')
}

fixData().catch(console.error)
