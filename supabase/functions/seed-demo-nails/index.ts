import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEMO_USER_ID = '6a7bbf2e-0db9-49d3-9f17-32c15a764e63'
const DEMO_PAGE_ID = '3229befa-752c-4032-9eac-4e4f63e7ade0'
const AVATAR_URL = 'https://pphdcfxucfndmwulpfwv.supabase.co/storage/v1/object/public/user-media/6a7bbf2e-0db9-49d3-9f17-32c15a764e63%2Favatar.jpg'

const PAGE_UPDATE = {
  slug: 'demo_nails',
  title: 'Айгерим · Маникюр Алматы',
  description: 'Маникюр, гель-лак, укрепление, дизайн. Онлайн-запись за 30 секунд 💅',
  niche: 'beauty',
  is_published: true,
  is_in_gallery: true,
  editor_mode: 'grid',
  avatar_url: AVATAR_URL,
  theme_settings: {
    backgroundColor: '#FFF5F7',
    textColor: '#1a1a2e',
    buttonStyle: 'rounded',
    fontFamily: 'sans',
    darkMode: false,
  },
  seo_meta: {
    title: 'Айгерим · Маникюр Алматы — Запись онлайн',
    description: 'Аппаратный маникюр, гель-лак, дизайн ногтей в Алматы. Прозрачные цены, онлайн-запись без звонков.',
    keywords: ['маникюр алматы', 'гель-лак алматы', 'nail master', 'запись онлайн', 'маникюр цены'],
  },
}

const PROFILE_UPDATE = {
  display_name: 'Айгерим · Маникюр',
  bio: '💅 Аппаратный маникюр и покрытие в Алматы\n📍 Алмалинский район\n🏆 4 года опыта · 1200+ клиентов\n⏰ Пн–Пт 10–19, Сб 10–16',
  avatar_url: AVATAR_URL,
  is_verified: true,
}

const BLOCKS = [
  // 0 — Profile
  {
    type: 'profile',
    position: 0,
    title: null,
    content: {
      id: 'profile-demo-nails',
      type: 'profile',
      name: 'Айгерим · Маникюр Алматы',
      bio: '💅 Аппаратный маникюр и покрытие\n📍 Алмалинский район, Алматы\n🏆 4 года · 1200+ довольных клиентов\n\nВыбирайте услугу, время — и записывайтесь 👇\nБез звонков. Без DM. За 30 секунд.',
      blockSize: 'full',
      avatarUrl: AVATAR_URL,
    },
    style: {},
    is_premium: false,
  },

  // 1 — Social links
  {
    type: 'socials',
    position: 1,
    title: null,
    content: {
      id: 'socials-demo-nails',
      type: 'socials',
      blockSize: 'full',
      links: [
        { platform: 'instagram', url: 'https://instagram.com/aigerim.nails', label: '@aigerim.nails' },
        { platform: 'tiktok', url: 'https://tiktok.com/@aigerim.nails', label: 'TikTok' },
      ],
    },
    style: {},
    is_premium: false,
  },

  // 2 — Pricing (improved)
  {
    type: 'pricing',
    position: 2,
    title: 'Услуги и цены',
    content: {
      id: 'pricing-demo-nails',
      type: 'pricing',
      blockSize: 'full',
      title: 'Услуги и цены',
      subtitle: 'Все цены фиксированные — без доплат',
      currency: 'KZT',
      items: [
        { name: 'Маникюр без покрытия', price: '3 000 ₸', description: 'Аппаратный, 45 мин' },
        { name: 'Маникюр + гель-лак', price: '5 500 ₸', description: 'Однотонное покрытие, 60 мин' },
        { name: 'Маникюр + дизайн', price: '7 000 ₸', description: 'До 4 ногтей с дизайном, 75 мин' },
        { name: 'Укрепление гелем', price: '6 500 ₸', description: 'Маникюр + укрепление + покрытие, 75 мин' },
        { name: 'Снятие чужого покрытия', price: '2 000 ₸', description: 'Аппаратное снятие, 30 мин' },
        { name: 'Комплекс «Руки + Ноги»', price: '12 000 ₸', description: 'Маникюр + педикюр + покрытие, 2 часа' },
        { name: 'Ремонт ногтя', price: '1 000 ₸', description: 'Восстановление одного ногтя, 15 мин' },
      ],
    },
    style: {},
    is_premium: true,
  },

  // 3 — Booking
  {
    type: 'booking',
    position: 3,
    title: 'Записаться онлайн',
    content: {
      id: 'booking-demo-nails',
      type: 'booking',
      blockSize: 'full',
      title: '📅 Записаться онлайн',
      subtitle: 'Выберите дату и время — подтверждение моментально',
      ctaText: 'Выбрать время',
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

  // 4 — Text block — social proof line
  {
    type: 'text',
    position: 4,
    title: null,
    content: {
      id: 'text-proof-demo-nails',
      type: 'text',
      blockSize: 'full',
      content: '✨ 1200+ процедур · 4.9 средний рейтинг · 87% клиентов возвращаются',
      style: 'body',
      alignment: 'center',
    },
    style: {},
    is_premium: false,
  },

  // 5 — Testimonial (master's own story — NOT fake client review)
  {
    type: 'testimonial',
    position: 5,
    title: 'Почему онлайн-запись',
    content: {
      id: 'testimonial-demo-nails',
      type: 'testimonial',
      blockSize: 'full',
      testimonials: [
        {
          name: 'Айгерим',
          role: 'мастер маникюра',
          text: 'Раньше клиенты писали в Direct, и я тратила час в день только на переписку. Теперь они видят цены, выбирают время и записываются сами. Я ни одного клиента не потеряла с тех пор, как перешла на онлайн-запись.',
          rating: 5,
        },
      ],
    },
    style: {},
    is_premium: true,
  },

  // 6 — FAQ (expanded)
  {
    type: 'faq',
    position: 6,
    title: 'Частые вопросы',
    content: {
      id: 'faq-demo-nails',
      type: 'faq',
      blockSize: 'full',
      items: [
        {
          question: 'Как записаться?',
          answer: 'Нажмите «Выбрать время» выше → выберите дату и слот → введите имя и телефон. Подтверждение придёт моментально.',
        },
        {
          question: 'Можно ли отменить или перенести?',
          answer: 'Да, бесплатно за 4 часа до визита. Напишите в WhatsApp — перенесу на удобное время.',
        },
        {
          question: 'Где вы находитесь?',
          answer: 'Алматы, Алмалинский район. Точный адрес отправлю в WhatsApp после подтверждения записи.',
        },
        {
          question: 'Нужна ли предоплата?',
          answer: 'Нет, предоплата не требуется. Оплата на месте — наличные или Kaspi.',
        },
        {
          question: 'Какие материалы используете?',
          answer: 'Работаю на Luxio, Kodi, E.Mi — только сертифицированные гипоаллергенные материалы.',
        },
      ],
    },
    style: {},
    is_premium: false,
  },

  // 7 — Messenger fallback
  {
    type: 'messenger',
    position: 7,
    title: 'Есть вопрос?',
    content: {
      id: 'messenger-demo-nails',
      type: 'messenger',
      blockSize: 'full',
      messengers: [
        { platform: 'whatsapp', username: '+77001234567', label: '💬 Написать в WhatsApp' },
        { platform: 'telegram', username: 'aigerim_nails', label: '✈️ Telegram' },
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

    // 2. Update page metadata + avatar
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
        message: 'demo-nails page v2 seeded successfully',
        page_url: '/demo_nails',
        blocks_count: BLOCKS.length,
        avatar: AVATAR_URL,
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
