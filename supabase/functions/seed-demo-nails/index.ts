import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEMO_USER_ID = '6a7bbf2e-0db9-49d3-9f17-32c15a764e63'
const DEMO_PAGE_ID = '3229befa-752c-4032-9eac-4e4f63e7ade0'

const PAGE_UPDATE = {
  slug: 'demo_nails',
  title: 'Айгерим · Маникюр Алматы',
  description: 'Маникюр, покрытие гель-лак, укрепление. Запись онлайн 💅',
  niche: 'beauty',
  is_published: true,
  is_in_gallery: true,
  editor_mode: 'grid',
  theme_settings: {
    backgroundColor: '#FFF5F7',
    textColor: '#1a1a2e',
    buttonStyle: 'rounded',
    fontFamily: 'sans',
    darkMode: false,
  },
  seo_meta: {
    title: 'Айгерим · Маникюр Алматы — Запись онлайн',
    description: 'Маникюр, покрытие гель-лак, укрепление ногтей в Алматы. Запись онлайн без звонков.',
    keywords: ['маникюр алматы', 'гель-лак', 'nail master', 'запись онлайн'],
  },
}

const PROFILE_UPDATE = {
  display_name: 'Айгерим · Маникюр',
  bio: '💅 Маникюр и покрытие в Алматы\n📍 Алмалинский район\n⏰ Пн-Пт 10:00–19:00, Сб 10:00–16:00',
}

const BLOCKS = [
  {
    type: 'profile',
    position: 0,
    title: null,
    content: {
      id: 'profile-demo-nails',
      type: 'profile',
      name: 'Айгерим · Маникюр Алматы',
      bio: '💅 Маникюр и покрытие в Алматы\n📍 Алмалинский район\n⏰ Пн–Пт 10:00–19:00, Сб 10:00–16:00\n\nЗаписывайтесь онлайн — без звонков и DM 👇',
      blockSize: 'full',
    },
    style: {},
    is_premium: false,
  },
  {
    type: 'pricing',
    position: 1,
    title: 'Услуги и цены',
    content: {
      id: 'pricing-demo-nails',
      type: 'pricing',
      blockSize: 'full',
      title: 'Услуги и цены',
      currency: 'KZT',
      items: [
        { name: 'Маникюр без покрытия', price: '3 000 ₸', description: 'Аппаратный маникюр' },
        { name: 'Маникюр + гель-лак', price: '5 500 ₸', description: 'Однотонное покрытие' },
        { name: 'Маникюр + дизайн', price: '7 000 ₸', description: 'До 4 ногтей с дизайном' },
        { name: 'Укрепление гелем', price: '6 500 ₸', description: 'Маникюр + укрепление + покрытие' },
        { name: 'Снятие чужого покрытия', price: '2 000 ₸', description: 'Аппаратное снятие' },
        { name: 'Комплекс «Всё включено»', price: '12 000 ₸', description: 'Маникюр + педикюр + покрытие' },
      ],
    },
    style: {},
    is_premium: true,
  },
  {
    type: 'booking',
    position: 2,
    title: 'Записаться онлайн',
    content: {
      id: 'booking-demo-nails',
      type: 'booking',
      blockSize: 'full',
      title: 'Записаться онлайн',
      subtitle: 'Выберите удобное время — подтверждение придёт сразу',
      ctaText: 'Записаться онлайн',
      slotDuration: 90,
      requirePrepayment: false,
      schedule: {
        monday: { enabled: true, start: '10:00', end: '19:00' },
        tuesday: { enabled: true, start: '10:00', end: '19:00' },
        wednesday: { enabled: true, start: '10:00', end: '19:00' },
        thursday: { enabled: true, start: '10:00', end: '19:00' },
        friday: { enabled: true, start: '10:00', end: '19:00' },
        saturday: { enabled: true, start: '10:00', end: '16:00' },
        sunday: { enabled: false, start: '10:00', end: '16:00' },
      },
    },
    style: {},
    is_premium: true,
  },
  {
    type: 'testimonial',
    position: 3,
    title: 'Почему онлайн-запись',
    content: {
      id: 'testimonial-demo-nails',
      type: 'testimonial',
      blockSize: 'full',
      testimonials: [
        {
          name: 'Айгерим',
          role: 'мастер маникюра',
          text: 'Раньше вела запись через DM — путалась, забывала, теряла клиентов. Сейчас клиенты записываются сами, я вижу расписание и ничего не теряю. Это экономит мне час в день.',
          rating: 5,
        },
      ],
    },
    style: {},
    is_premium: true,
  },
  {
    type: 'faq',
    position: 4,
    title: 'Частые вопросы',
    content: {
      id: 'faq-demo-nails',
      type: 'faq',
      blockSize: 'full',
      items: [
        {
          question: 'Как записаться?',
          answer: 'Нажмите кнопку «Записаться онлайн» выше, выберите дату и время. Подтверждение придёт сразу.',
        },
        {
          question: 'Можно ли отменить запись?',
          answer: 'Да, отмена бесплатна за 4 часа до визита. Напишите в WhatsApp или отмените в подтверждении.',
        },
        {
          question: 'Где вы находитесь?',
          answer: 'Алматы, Алмалинский район. Точный адрес отправлю после подтверждения записи.',
        },
      ],
    },
    style: {},
    is_premium: false,
  },
  {
    type: 'messenger',
    position: 5,
    title: 'Написать в WhatsApp',
    content: {
      id: 'messenger-demo-nails',
      type: 'messenger',
      blockSize: 'half',
      messengers: [
        { platform: 'whatsapp', username: '+77001234567', label: 'Написать в WhatsApp' },
      ],
    },
    style: {},
    is_premium: false,
  },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 1. Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(PROFILE_UPDATE)
      .eq('id', DEMO_USER_ID)

    if (profileError) throw new Error(`Profile update failed: ${profileError.message}`)

    // 2. Update page metadata
    const { error: pageError } = await supabase
      .from('pages')
      .update(PAGE_UPDATE)
      .eq('id', DEMO_PAGE_ID)

    if (pageError) throw new Error(`Page update failed: ${pageError.message}`)

    // 3. Delete existing blocks
    const { error: deleteError } = await supabase
      .from('blocks')
      .delete()
      .eq('page_id', DEMO_PAGE_ID)

    if (deleteError) throw new Error(`Block delete failed: ${deleteError.message}`)

    // 4. Insert new blocks
    const blocksToInsert = BLOCKS.map((block) => ({
      page_id: DEMO_PAGE_ID,
      type: block.type,
      position: block.position,
      title: block.title,
      content: block.content,
      style: block.style,
      is_premium: block.is_premium,
      click_count: 0,
    }))

    const { error: insertError } = await supabase
      .from('blocks')
      .insert(blocksToInsert)

    if (insertError) throw new Error(`Block insert failed: ${insertError.message}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'demo-nails page seeded successfully',
        page_url: '/demo_nails',
        blocks_count: BLOCKS.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Seed error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
