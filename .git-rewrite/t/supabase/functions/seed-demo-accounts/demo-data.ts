// Simplified demo accounts data - AI will generate the actual content
export const DEMO_ACCOUNTS = [
  // Beauty - 2 accounts
  {
    slug: 'anna_beauty',
    title: 'Анна Красота',
    description: 'Визажист и бровист в Алматы. Свадебный макияж, вечерний образ, коррекция бровей. Работаю с 2018 года, сертифицированный мастер.',
    niche: 'beauty',
    defaultAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    avatarStyle: { type: 'gradient', colors: ['#FF6B9D', '#C44569'] },
    themeSettings: {
      backgroundColor: '#FFF5F7',
      textColor: '#2D2D2D',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Анна Красота', bio: '💄 Визажист и бровист в Алматы' }
    ]
  },
  {
    slug: 'salon_elite',
    title: 'Салон Elite',
    description: 'Премиальный салон красоты в центре Астаны. Стрижки, окрашивание, маникюр, педикюр. Команда из 8 мастеров, работаем с 2015 года.',
    niche: 'beauty',
    defaultAvatar: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    avatarStyle: { type: 'solid', color: '#8B5CF6' },
    themeSettings: {
      backgroundColor: '#F5F3FF',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'serif'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Салон Elite', bio: '✨ Премиальный салон красоты' }
    ]
  },
  // Fitness - 2 accounts
  {
    slug: 'coach_arman',
    title: 'Тренер Арман',
    description: 'Персональный фитнес-тренер. 8 лет опыта, более 200 довольных клиентов. Трансформация тела, онлайн и офлайн тренировки, составление питания.',
    niche: 'fitness',
    defaultAvatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400',
    avatarStyle: { type: 'gradient', colors: ['#10B981', '#059669'] },
    themeSettings: {
      backgroundColor: '#ECFDF5',
      textColor: '#1F2937',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Тренер Арман', bio: '💪 Персональный фитнес-тренер' }
    ]
  },
  {
    slug: 'yoga_studio_zen',
    title: 'Йога-студия Zen',
    description: 'Уютная студия йоги в центре города. Хатха, Виньяса, медитации. Группы для начинающих и продвинутых. Индивидуальные занятия.',
    niche: 'fitness',
    defaultAvatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    avatarStyle: { type: 'solid', color: '#7C3AED' },
    themeSettings: {
      backgroundColor: '#FAF5FF',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'serif'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Йога-студия Zen', bio: '🧘‍♀️ Йога, медитация, здоровый образ жизни' }
    ]
  },
  // Food - 2 accounts
  {
    slug: 'chef_marat',
    title: 'Шеф Марат',
    description: 'Шеф-повар с 15-летним опытом. Авторская казахская и европейская кухня. Организация банкетов, кейтеринг, мастер-классы.',
    niche: 'food',
    defaultAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400',
    avatarStyle: { type: 'gradient', colors: ['#F59E0B', '#D97706'] },
    themeSettings: {
      backgroundColor: '#FFFBEB',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Шеф Марат', bio: '👨‍🍳 Авторская кухня и кейтеринг' }
    ]
  },
  {
    slug: 'homecakes_asel',
    title: 'HomeCakes Asel',
    description: 'Домашние торты и десерты на заказ. Свадебные торты, детские торты, капкейки. Только натуральные ингредиенты!',
    niche: 'food',
    defaultAvatar: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    avatarStyle: { type: 'gradient', colors: ['#EC4899', '#BE185D'] },
    themeSettings: {
      backgroundColor: '#FDF2F8',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'serif'
    },
    defaultBlocks: [
      { type: 'profile', name: 'HomeCakes Asel', bio: '🎂 Торты и десерты на заказ' }
    ]
  },
  // Education - 2 accounts
  {
    slug: 'english_pro',
    title: 'English Pro',
    description: 'Языковая школа. IELTS подготовка до 7.0+, General English, Business English. Квалифицированные преподаватели с опытом 10+ лет.',
    niche: 'education',
    defaultAvatar: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    avatarStyle: { type: 'solid', color: '#3B82F6' },
    themeSettings: {
      backgroundColor: '#EFF6FF',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'English Pro', bio: '📚 Курсы английского языка' }
    ]
  },
  {
    slug: 'math_tutor_dana',
    title: 'Репетитор Дана',
    description: 'Преподаватель математики. Подготовка к ЕНТ, олимпиадам. 95% учеников поступают в топ-вузы. Индивидуальные и групповые занятия.',
    niche: 'education',
    defaultAvatar: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400',
    avatarStyle: { type: 'gradient', colors: ['#6366F1', '#4F46E5'] },
    themeSettings: {
      backgroundColor: '#EEF2FF',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Репетитор Дана', bio: '📐 Математика для школьников' }
    ]
  },
  // Art - 2 accounts
  {
    slug: 'artist_aizhan',
    title: 'Художница Айжан',
    description: 'Профессиональный художник. Пишу портреты по фото, пейзажи, абстракции. Провожу мастер-классы для детей и взрослых.',
    niche: 'art',
    defaultAvatar: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
    avatarStyle: { type: 'gradient', colors: ['#F97316', '#EA580C'] },
    themeSettings: {
      backgroundColor: '#FFF7ED',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'serif'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Художница Айжан', bio: '🎨 Портреты на заказ, уроки живописи' }
    ]
  },
  {
    slug: 'photo_studio_light',
    title: 'Фотостудия Light',
    description: 'Современная фотостудия с 5 залами. Профессиональное оборудование, опытные фотографы. Портреты, семейные съемки, предметка.',
    niche: 'art',
    defaultAvatar: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
    avatarStyle: { type: 'solid', color: '#0F172A' },
    themeSettings: {
      backgroundColor: '#F8FAFC',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Фотостудия Light', bio: '📸 Профессиональные фотосессии' }
    ]
  },
  // Music - 2 accounts
  {
    slug: 'dj_sultan',
    title: 'DJ Sultan',
    description: 'Профессиональный диджей. 10 лет на сцене. Свадьбы, корпоративы, клубные вечеринки. Своё профессиональное оборудование.',
    niche: 'music',
    defaultAvatar: 'https://images.unsplash.com/photo-1571266028243-d220c6a8583f?w=400',
    avatarStyle: { type: 'gradient', colors: ['#8B5CF6', '#6D28D9'] },
    themeSettings: {
      backgroundColor: '#1F1F1F',
      textColor: '#FFFFFF',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'DJ Sultan', bio: '🎧 Диджей на мероприятия' }
    ]
  },
  {
    slug: 'vocal_coach_alina',
    title: 'Вокал с Алиной',
    description: 'Профессиональный преподаватель вокала. Эстрада, джаз, поп. Подготовка к конкурсам. Ученики — призеры "Голос Дети".',
    niche: 'music',
    defaultAvatar: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400',
    avatarStyle: { type: 'gradient', colors: ['#EC4899', '#DB2777'] },
    themeSettings: {
      backgroundColor: '#FDF2F8',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'serif'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Вокал с Алиной', bio: '🎤 Уроки вокала' }
    ]
  },
  // Tech - 2 accounts
  {
    slug: 'webdev_timur',
    title: 'Веб-разработчик Тимур',
    description: 'Full-stack разработчик. React, Node.js, TypeScript. Создаю сайты, веб-приложения, интернет-магазины. 5 лет опыта.',
    niche: 'tech',
    defaultAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    avatarStyle: { type: 'solid', color: '#0EA5E9' },
    themeSettings: {
      backgroundColor: '#F0F9FF',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'mono'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Веб-разработчик Тимур', bio: '💻 Создание сайтов под ключ' }
    ]
  },
  {
    slug: 'it_courses_astana',
    title: 'IT Курсы Astana',
    description: 'Обучаем программированию с нуля. Python, JavaScript, Frontend, Backend. Помощь с трудоустройством. Офис в Нурлы Тау.',
    niche: 'tech',
    defaultAvatar: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    avatarStyle: { type: 'gradient', colors: ['#22C55E', '#16A34A'] },
    themeSettings: {
      backgroundColor: '#F0FDF4',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'IT Курсы Astana', bio: '🖥️ Обучение программированию' }
    ]
  },
  // Business - 2 accounts
  {
    slug: 'marketing_agency',
    title: 'Digital Agency KZ',
    description: 'Полный цикл digital-маркетинга. SMM, таргетированная реклама, SEO, контент. Работаем с 2018 года, 100+ клиентов.',
    niche: 'business',
    defaultAvatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    avatarStyle: { type: 'solid', color: '#1E40AF' },
    themeSettings: {
      backgroundColor: '#EFF6FF',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Digital Agency KZ', bio: '📊 Маркетинг и реклама' }
    ]
  },
  {
    slug: 'accountant_aina',
    title: 'Бухгалтер Айна',
    description: 'Профессиональный бухгалтер. Ведение учета ИП и ТОО, налоговые отчеты, консультации. 12 лет опыта работы.',
    niche: 'business',
    defaultAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    avatarStyle: { type: 'solid', color: '#059669' },
    themeSettings: {
      backgroundColor: '#ECFDF5',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Бухгалтер Айна', bio: '📋 Бухгалтерские услуги' }
    ]
  },
  // Health - 2 accounts
  {
    slug: 'psychologist_laura',
    title: 'Психолог Лаура',
    description: 'Практикующий психолог. Тревожность, депрессия, отношения, самооценка. Онлайн и офлайн консультации. Бережный подход.',
    niche: 'health',
    defaultAvatar: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400',
    avatarStyle: { type: 'gradient', colors: ['#A855F7', '#7C3AED'] },
    themeSettings: {
      backgroundColor: '#FAF5FF',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'serif'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Психолог Лаура', bio: '🧠 Психологическая помощь' }
    ]
  },
  {
    slug: 'massage_studio',
    title: 'Массаж-студия Relax',
    description: 'Профессиональный массаж. Классический, спортивный, расслабляющий. Сертифицированные массажисты, уютная атмосфера.',
    niche: 'health',
    defaultAvatar: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    avatarStyle: { type: 'solid', color: '#0D9488' },
    themeSettings: {
      backgroundColor: '#F0FDFA',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Массаж-студия Relax', bio: '💆 Профессиональный массаж' }
    ]
  },
  // Fashion - 2 accounts
  {
    slug: 'stylist_kamila',
    title: 'Стилист Камила',
    description: 'Персональный стилист. Разбор гардероба, шопинг-сопровождение, создание капсульного гардероба. Работаю в Алматы и онлайн.',
    niche: 'fashion',
    defaultAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    avatarStyle: { type: 'gradient', colors: ['#F43F5E', '#E11D48'] },
    themeSettings: {
      backgroundColor: '#FFF1F2',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'serif'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Стилист Камила', bio: '👗 Персональный стилист' }
    ]
  },
  {
    slug: 'showroom_almaty',
    title: 'Showroom Almaty',
    description: 'Шоурум женской одежды. Казахстанские и турецкие бренды. Качественная одежда по доступным ценам. Доставка по Казахстану.',
    niche: 'fashion',
    defaultAvatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    avatarStyle: { type: 'solid', color: '#0F172A' },
    themeSettings: {
      backgroundColor: '#F8FAFC',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Showroom Almaty', bio: '🛍️ Женская одежда' }
    ]
  },
  // Travel - 2 accounts
  {
    slug: 'travel_with_azat',
    title: 'Гид Азат',
    description: 'Авторские туры по Алматы и области. Чарынский каньон, Кольсайские озера, Большое Алматинское озеро. Транспорт, питание, гид.',
    niche: 'travel',
    defaultAvatar: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400',
    avatarStyle: { type: 'gradient', colors: ['#0EA5E9', '#0284C7'] },
    themeSettings: {
      backgroundColor: '#F0F9FF',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Гид Азат', bio: '✈️ Туры по Казахстану' }
    ]
  },
  {
    slug: 'tour_agency_nomad',
    title: 'Nomad Tours',
    description: 'Туристическое агентство. Туры по Казахстану, визовая поддержка, бронирование отелей. Организуем индивидуальные и групповые туры.',
    niche: 'travel',
    defaultAvatar: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400',
    avatarStyle: { type: 'solid', color: '#059669' },
    themeSettings: {
      backgroundColor: '#ECFDF5',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Nomad Tours', bio: '🏔️ Туристическое агентство' }
    ]
  },
  // Realty - 2 accounts
  {
    slug: 'realtor_bekzat',
    title: 'Риелтор Бекзат',
    description: 'Профессиональный риелтор в Астане. Покупка, продажа, аренда недвижимости. Юридическое сопровождение сделок. 8 лет опыта.',
    niche: 'realty',
    defaultAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    avatarStyle: { type: 'solid', color: '#1E40AF' },
    themeSettings: {
      backgroundColor: '#EFF6FF',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Риелтор Бекзат', bio: '🏠 Недвижимость в Астане' }
    ]
  },
  {
    slug: 'realty_astana',
    title: 'Astana Realty',
    description: 'Агентство недвижимости. Новостройки от застройщиков, вторичное жильё, коммерческая недвижимость. Ипотечный брокер.',
    niche: 'realty',
    defaultAvatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
    avatarStyle: { type: 'gradient', colors: ['#6366F1', '#4F46E5'] },
    themeSettings: {
      backgroundColor: '#EEF2FF',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Astana Realty', bio: '🏢 Агентство недвижимости' }
    ]
  },
  // Events - 2 accounts
  {
    slug: 'event_planner_zhanna',
    title: 'Event-менеджер Жанна',
    description: 'Организация мероприятий под ключ. Свадьбы, корпоративы, дни рождения. Декор, программа, координация. 100+ успешных событий.',
    niche: 'events',
    defaultAvatar: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
    avatarStyle: { type: 'gradient', colors: ['#F59E0B', '#D97706'] },
    themeSettings: {
      backgroundColor: '#FFFBEB',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'serif'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Event-менеджер Жанна', bio: '🎉 Организация мероприятий' }
    ]
  },
  {
    slug: 'animator_kids',
    title: 'Аниматоры Happy Kids',
    description: 'Аниматоры на детские праздники. Персонажи, шоу-программы, аквагрим. Работаем в Алматы и пригороде. Выезд на дом.',
    niche: 'events',
    defaultAvatar: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
    avatarStyle: { type: 'gradient', colors: ['#EC4899', '#F472B6'] },
    themeSettings: {
      backgroundColor: '#FDF2F8',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Happy Kids', bio: '🎈 Аниматоры на детские праздники' }
    ]
  },
  // Services - 2 accounts
  {
    slug: 'cleaning_crystal',
    title: 'Клининг Crystal',
    description: 'Профессиональный клининг. Уборка квартир, офисов, химчистка мебели. Экологичные средства, опытные сотрудники.',
    niche: 'services',
    defaultAvatar: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    avatarStyle: { type: 'solid', color: '#0EA5E9' },
    themeSettings: {
      backgroundColor: '#F0F9FF',
      textColor: '#0F172A',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Клининг Crystal', bio: '🧹 Профессиональная уборка' }
    ]
  },
  {
    slug: 'handyman_sergey',
    title: 'Мастер Сергей',
    description: 'Мастер на все руки. Сантехника, электрика, мебель, мелкий ремонт. Выезд в течение часа. Качество и гарантия.',
    niche: 'services',
    defaultAvatar: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
    avatarStyle: { type: 'gradient', colors: ['#F59E0B', '#D97706'] },
    themeSettings: {
      backgroundColor: '#FFFBEB',
      textColor: '#1F1F1F',
      buttonStyle: 'rounded',
      fontFamily: 'sans'
    },
    defaultBlocks: [
      { type: 'profile', name: 'Мастер Сергей', bio: '🔧 Мастер на все руки' }
    ]
  }
]
