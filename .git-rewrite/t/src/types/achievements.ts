export interface Achievement {
  key: string;
  titleKey: string;
  descriptionKey: string;
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
    titleKey: 'achievements.items.firstLink.title',
    descriptionKey: 'achievements.items.firstLink.description',
    icon: '🔗',
    category: 'blocks',
    rarity: 'common',
    condition: (stats) => stats.blocksUsed.has('link'),
  },
  {
    key: 'social_butterfly',
    titleKey: 'achievements.items.socialButterfly.title',
    descriptionKey: 'achievements.items.socialButterfly.description',
    icon: '🦋',
    category: 'blocks',
    rarity: 'common',
    condition: (stats) => stats.blocksUsed.has('socials'),
  },
  {
    key: 'merchant',
    titleKey: 'achievements.items.merchant.title',
    descriptionKey: 'achievements.items.merchant.description',
    icon: '🛒',
    category: 'blocks',
    rarity: 'common',
    condition: (stats) => stats.blocksUsed.has('product'),
  },
  {
    key: 'content_creator',
    titleKey: 'achievements.items.contentCreator.title',
    descriptionKey: 'achievements.items.contentCreator.description',
    icon: '🎬',
    category: 'blocks',
    rarity: 'rare',
    condition: (stats) => stats.blocksUsed.has('video'),
  },
  {
    key: 'gallery_master',
    titleKey: 'achievements.items.galleryMaster.title',
    descriptionKey: 'achievements.items.galleryMaster.description',
    icon: '🖼️',
    category: 'blocks',
    rarity: 'rare',
    condition: (stats) => stats.blocksUsed.has('carousel'),
  },
  {
    key: 'developer',
    titleKey: 'achievements.items.developer.title',
    descriptionKey: 'achievements.items.developer.description',
    icon: '👨‍💻',
    category: 'blocks',
    rarity: 'epic',
    condition: (stats) => stats.blocksUsed.has('custom_code'),
  },
  {
    key: 'communicator',
    titleKey: 'achievements.items.communicator.title',
    descriptionKey: 'achievements.items.communicator.description',
    icon: '📬',
    category: 'blocks',
    rarity: 'rare',
    condition: (stats) => stats.blocksUsed.has('form'),
  },
  {
    key: 'search_guru',
    titleKey: 'achievements.items.searchGuru.title',
    descriptionKey: 'achievements.items.searchGuru.description',
    icon: '🔍',
    category: 'blocks',
    rarity: 'epic',
    condition: (stats) => stats.blocksUsed.has('search'),
  },
  
  // Feature Usage Achievements
  {
    key: 'ai_powered',
    titleKey: 'achievements.items.aiPowered.title',
    descriptionKey: 'achievements.items.aiPowered.description',
    icon: '🤖',
    category: 'features',
    rarity: 'rare',
    condition: (stats) => stats.featuresUsed.has('ai'),
  },
  {
    key: 'template_user',
    titleKey: 'achievements.items.templateUser.title',
    descriptionKey: 'achievements.items.templateUser.description',
    icon: '⚡',
    category: 'features',
    rarity: 'common',
    condition: (stats) => stats.featuresUsed.has('template'),
  },
  {
    key: 'chatbot_expert',
    titleKey: 'achievements.items.chatbotExpert.title',
    descriptionKey: 'achievements.items.chatbotExpert.description',
    icon: '💬',
    category: 'features',
    rarity: 'rare',
    condition: (stats) => stats.featuresUsed.has('chatbot'),
  },
  
  // Milestone Achievements
  {
    key: 'collector',
    titleKey: 'achievements.items.collector.title',
    descriptionKey: 'achievements.items.collector.description',
    icon: '🎯',
    category: 'milestones',
    rarity: 'rare',
    condition: (stats) => stats.blocksUsed.size >= 5,
  },
  {
    key: 'master_builder',
    titleKey: 'achievements.items.masterBuilder.title',
    descriptionKey: 'achievements.items.masterBuilder.description',
    icon: '🏗️',
    category: 'milestones',
    rarity: 'epic',
    condition: (stats) => stats.totalBlocks >= 10,
  },
  {
    key: 'completionist',
    titleKey: 'achievements.items.completionist.title',
    descriptionKey: 'achievements.items.completionist.description',
    icon: '💯',
    category: 'milestones',
    rarity: 'legendary',
    condition: (stats) => stats.blocksUsed.size >= 15,
  },
  
  // Social Achievements
  {
    key: 'publisher',
    titleKey: 'achievements.items.publisher.title',
    descriptionKey: 'achievements.items.publisher.description',
    icon: '📢',
    category: 'social',
    rarity: 'common',
    condition: (stats) => stats.published,
  },
  {
    key: 'popular',
    titleKey: 'achievements.items.popular.title',
    descriptionKey: 'achievements.items.popular.description',
    icon: '🌟',
    category: 'social',
    rarity: 'rare',
    condition: (stats) => stats.pageViews >= 100,
  },
  {
    key: 'influencer',
    titleKey: 'achievements.items.influencer.title',
    descriptionKey: 'achievements.items.influencer.description',
    icon: '👑',
    category: 'social',
    rarity: 'legendary',
    condition: (stats) => stats.pageViews >= 1000,
  },
  
  // Friend Achievements
  {
    key: 'first_friend',
    titleKey: 'achievements.items.firstFriend.title',
    descriptionKey: 'achievements.items.firstFriend.description',
    icon: '🤝',
    category: 'social',
    rarity: 'common',
    condition: (stats) => stats.friendsCount >= 1,
  },
  {
    key: 'social_circle',
    titleKey: 'achievements.items.socialCircle.title',
    descriptionKey: 'achievements.items.socialCircle.description',
    icon: '👥',
    category: 'social',
    rarity: 'rare',
    condition: (stats) => stats.friendsCount >= 5,
  },
  {
    key: 'networking_pro',
    titleKey: 'achievements.items.networkingPro.title',
    descriptionKey: 'achievements.items.networkingPro.description',
    icon: '🌐',
    category: 'social',
    rarity: 'epic',
    condition: (stats) => stats.friendsCount >= 10,
  },
  {
    key: 'community_leader',
    titleKey: 'achievements.items.communityLeader.title',
    descriptionKey: 'achievements.items.communityLeader.description',
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
