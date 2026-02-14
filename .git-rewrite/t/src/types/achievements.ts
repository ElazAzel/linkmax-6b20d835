export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: 'blocks' | 'features' | 'milestones' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (stats: UserStats) => boolean;
}

export interface UserStats {
  blocksUsed: Set<string>;
  totalBlocks: number;
  featuresUsed: Set<string>;
  pageViews: number;
  published: boolean;
  friendsCount: number;
}

export interface UnlockedAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  created_at: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Block Usage Achievements
  {
    key: 'first_link',
    title: 'Первая ссылка',
    description: 'Добавьте свою первую ссылку',
    icon: '🔗',
    category: 'blocks',
    rarity: 'common',
    condition: (stats) => stats.blocksUsed.has('link'),
  },
  {
    key: 'social_butterfly',
    title: 'Социальная бабочка',
    description: 'Добавьте блок социальных сетей',
    icon: '🦋',
    category: 'blocks',
    rarity: 'common',
    condition: (stats) => stats.blocksUsed.has('socials'),
  },
  {
    key: 'merchant',
    title: 'Торговец',
    description: 'Добавьте первый товар в магазин',
    icon: '🛒',
    category: 'blocks',
    rarity: 'common',
    condition: (stats) => stats.blocksUsed.has('product'),
  },
  {
    key: 'content_creator',
    title: 'Создатель контента',
    description: 'Добавьте видео блок',
    icon: '🎬',
    category: 'blocks',
    rarity: 'rare',
    condition: (stats) => stats.blocksUsed.has('video'),
  },
  {
    key: 'gallery_master',
    title: 'Мастер галерей',
    description: 'Создайте карусель изображений',
    icon: '🖼️',
    category: 'blocks',
    rarity: 'rare',
    condition: (stats) => stats.blocksUsed.has('carousel'),
  },
  {
    key: 'developer',
    title: 'Разработчик',
    description: 'Используйте блок с кастомным кодом',
    icon: '👨‍💻',
    category: 'blocks',
    rarity: 'epic',
    condition: (stats) => stats.blocksUsed.has('custom_code'),
  },
  {
    key: 'communicator',
    title: 'Коммуникатор',
    description: 'Добавьте форму обратной связи',
    icon: '📬',
    category: 'blocks',
    rarity: 'rare',
    condition: (stats) => stats.blocksUsed.has('form'),
  },
  {
    key: 'search_guru',
    title: 'Гуру поиска',
    description: 'Добавьте AI Search блок',
    icon: '🔍',
    category: 'blocks',
    rarity: 'epic',
    condition: (stats) => stats.blocksUsed.has('search'),
  },
  
  // Feature Usage Achievements
  {
    key: 'ai_powered',
    title: 'AI-помощник',
    description: 'Используйте AI для генерации контента',
    icon: '🤖',
    category: 'features',
    rarity: 'rare',
    condition: (stats) => stats.featuresUsed.has('ai'),
  },
  {
    key: 'template_user',
    title: 'Быстрый старт',
    description: 'Используйте готовый шаблон',
    icon: '⚡',
    category: 'features',
    rarity: 'common',
    condition: (stats) => stats.featuresUsed.has('template'),
  },
  {
    key: 'chatbot_expert',
    title: 'Эксперт чат-ботов',
    description: 'Настройте AI чат-бота',
    icon: '💬',
    category: 'features',
    rarity: 'rare',
    condition: (stats) => stats.featuresUsed.has('chatbot'),
  },
  
  // Milestone Achievements
  {
    key: 'collector',
    title: 'Коллекционер',
    description: 'Добавьте 5 разных типов блоков',
    icon: '🎯',
    category: 'milestones',
    rarity: 'rare',
    condition: (stats) => stats.blocksUsed.size >= 5,
  },
  {
    key: 'master_builder',
    title: 'Мастер-строитель',
    description: 'Добавьте 10 блоков на страницу',
    icon: '🏗️',
    category: 'milestones',
    rarity: 'epic',
    condition: (stats) => stats.totalBlocks >= 10,
  },
  {
    key: 'completionist',
    title: 'Перфекционист',
    description: 'Используйте все типы блоков',
    icon: '💯',
    category: 'milestones',
    rarity: 'legendary',
    condition: (stats) => stats.blocksUsed.size >= 15,
  },
  
  // Social Achievements
  {
    key: 'publisher',
    title: 'Издатель',
    description: 'Опубликуйте свою первую страницу',
    icon: '📢',
    category: 'social',
    rarity: 'common',
    condition: (stats) => stats.published,
  },
  {
    key: 'popular',
    title: 'Популярный',
    description: 'Получите 100 просмотров',
    icon: '🌟',
    category: 'social',
    rarity: 'rare',
    condition: (stats) => stats.pageViews >= 100,
  },
  {
    key: 'influencer',
    title: 'Инфлюенсер',
    description: 'Получите 1000 просмотров',
    icon: '👑',
    category: 'social',
    rarity: 'legendary',
    condition: (stats) => stats.pageViews >= 1000,
  },
  
  // Friend Achievements
  {
    key: 'first_friend',
    title: 'Первый друг',
    description: 'Добавьте первого друга',
    icon: '🤝',
    category: 'social',
    rarity: 'common',
    condition: (stats) => stats.friendsCount >= 1,
  },
  {
    key: 'social_circle',
    title: 'Социальный круг',
    description: 'Добавьте 5 друзей',
    icon: '👥',
    category: 'social',
    rarity: 'rare',
    condition: (stats) => stats.friendsCount >= 5,
  },
  {
    key: 'networking_pro',
    title: 'Мастер нетворкинга',
    description: 'Добавьте 10 друзей',
    icon: '🌐',
    category: 'social',
    rarity: 'epic',
    condition: (stats) => stats.friendsCount >= 10,
  },
  {
    key: 'community_leader',
    title: 'Лидер сообщества',
    description: 'Добавьте 25 друзей',
    icon: '🎖️',
    category: 'social',
    rarity: 'legendary',
    condition: (stats) => stats.friendsCount >= 25,
  },
];

export const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600',
};

export const RARITY_LABELS: Record<Achievement['rarity'], string> = {
  common: 'Обычное',
  rare: 'Редкое',
  epic: 'Эпическое',
  legendary: 'Легендарное',
};
