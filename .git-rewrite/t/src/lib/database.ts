import { supabase } from '@/integrations/supabase/client';
import type { PageData, Block, ProfileBlock } from '@/types/page';

// Default profile block with all required fields
const createDefaultProfileBlock = (): ProfileBlock => ({
  id: 'profile-1',
  type: 'profile',
  name: 'Your Name',
  bio: 'Your bio goes here',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
  verified: false,
  avatarFrame: 'default',
  coverImage: '',
  coverGradient: 'none',
  coverHeight: 'medium',
  avatarSize: 'large',
  avatarPosition: 'center',
  shadowStyle: 'soft',
});

export interface DbPage {
  id: string;
  user_id: string;
  slug: string;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  avatar_style: any;
  theme_settings: any;
  seo_meta: any;
  is_published: boolean;
  view_count: number;
  chatbot_context: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBlock {
  id: string;
  page_id: string;
  type: string;
  position: number;
  title: string | null;
  content: any;
  style: any;
  is_premium: boolean;
  click_count: number;
  created_at: string;
}

// Save page to database
export async function savePage(
  pageData: PageData, 
  userId: string, 
  chatbotContext?: string
): Promise<{ data: DbPage | null; error: any }> {
  try {
    // Проверяем, есть ли уже страница у пользователя
    const { data: existingPage } = await supabase
      .from('pages')
      .select('id, slug')
      .eq('user_id', userId)
      .maybeSingle();

    // Получаем username из профиля
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();

    let slug = existingPage?.slug;
    
    // Если есть username, используем его как slug
    if (profile?.username) {
      slug = profile.username;
    } else if (!slug) {
      // Если нет ни username, ни slug, генерируем новый
      const baseSlug = `user-${userId.slice(0, 8)}`;
      const { data: generatedSlug } = await supabase.rpc('generate_unique_slug', { 
        base_slug: baseSlug.toLowerCase().replace(/[^a-z0-9]/g, '') 
      });
      slug = generatedSlug;
    }

    // Сохраняем или обновляем страницу
    const profileBlock = pageData.blocks.find(b => b.type === 'profile') as any;
    const pageUpdate: any = {
      user_id: userId,
      slug: slug!,
      title: profileBlock?.name || 'My Page',
      description: profileBlock?.bio,
      avatar_url: profileBlock?.avatar,
      avatar_style: profileBlock?.avatarStyle || { type: 'default', color: '#000000' },
      theme_settings: pageData.theme as any,
      seo_meta: pageData.seo as any,
      is_published: false,
      updated_at: new Date().toISOString(),
    };

    if (existingPage?.id) {
      pageUpdate.id = existingPage.id;
    }

    const { data: page, error: pageError } = await supabase
      .from('pages')
      .upsert(pageUpdate)
      .select()
      .single();

    if (pageError) return { data: null, error: pageError };

    // Удаляем старые блоки
    const { error: deleteError } = await supabase
      .from('blocks')
      .delete()
      .eq('page_id', page.id);

    if (deleteError) {
      console.error('Error deleting old blocks:', deleteError);
      return { data: null, error: deleteError };
    }

    // Сохраняем блоки
    const blocksToInsert: any[] = pageData.blocks.map((block, index) => ({
      page_id: page.id,
      type: block.type,
      position: index,
      title: 'title' in block ? block.title : null,
      content: block as any,
      style: {} as any,
      is_premium: pageData.isPremium || false,
      schedule: 'schedule' in block ? block.schedule : null,
      click_count: 0,
    }));

    if (blocksToInsert.length > 0) {
      const { error: blocksError } = await supabase
        .from('blocks')
        .insert(blocksToInsert);

      if (blocksError) {
        console.error('Error inserting blocks:', blocksError);
        return { data: null, error: blocksError };
      }
    }

    // Save chatbot context to private_page_data table
    if (chatbotContext) {
      await supabase
        .from('private_page_data')
        .upsert({
          page_id: page.id,
          chatbot_context: chatbotContext,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'page_id' });
    }

    return { data: page, error: null };
  } catch (error) {
    console.error('Error saving page:', error);
    return { data: null, error };
  }
}

// Load page by slug
export async function loadPageBySlug(slug: string): Promise<{ data: PageData | null; error: any }> {
  try {
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*, blocks(*)')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (pageError) {
      console.error('Error loading page by slug:', pageError);
      return { data: null, error: pageError };
    }
    
    if (!page) return { data: null, error: new Error('Page not found') };

    // Increment view count
    await supabase.rpc('increment_view_count', { page_slug: slug });

    // Convert to PageData format
    const pageData: PageData = {
      id: page.id,
      userId: page.user_id,
      blocks: (page.blocks as DbBlock[])
        .sort((a, b) => a.position - b.position)
        .map(block => block.content as Block),
      theme: page.theme_settings as any,
      seo: page.seo_meta as any,
      isPremium: (page.blocks as DbBlock[]).some(b => b.is_premium),
    };

    return { data: pageData, error: null };
  } catch (error) {
    console.error('Error loading page:', error);
    return { data: null, error };
  }
}

// Load user's page
export async function loadUserPage(userId: string): Promise<{ data: PageData | null; chatbotContext: string | null; error: any }> {
  try {
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*, blocks(*), private_page_data(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (pageError) {
      // If no page exists, return empty page data
      if (pageError.code === 'PGRST116') {
        return { 
          data: {
            id: userId,
            blocks: [createDefaultProfileBlock()],
            theme: {
              backgroundColor: 'hsl(var(--background))',
              textColor: 'hsl(var(--foreground))',
              buttonStyle: 'rounded',
              fontFamily: 'sans',
            },
            seo: {
              title: 'My LinkMAX Page',
              description: 'Check out my links',
              keywords: [],
            },
          },
          chatbotContext: null,
          error: null 
        };
      }
      return { data: null, chatbotContext: null, error: pageError };
    }

    if (!page) {
      return { 
        data: {
          id: userId,
          blocks: [createDefaultProfileBlock()],
          theme: {
            backgroundColor: 'hsl(var(--background))',
            textColor: 'hsl(var(--foreground))',
            buttonStyle: 'rounded',
            fontFamily: 'sans',
          },
          seo: {
            title: 'My LinkMAX Page',
            description: 'Check out my links',
            keywords: [],
          },
        },
        chatbotContext: null,
        error: null 
      };
    }

    // Convert to PageData format
    const pageData: PageData = {
      id: page.id,
      blocks: (page.blocks as DbBlock[])
        .sort((a, b) => a.position - b.position)
        .map(block => block.content as Block),
      theme: page.theme_settings as any,
      seo: page.seo_meta as any,
      isPremium: (page.blocks as DbBlock[]).some(b => b.is_premium),
    };

    // Get chatbot context from private_page_data
    const privateData = page.private_page_data as any;
    const chatbotContext = Array.isArray(privateData) 
      ? privateData[0]?.chatbot_context 
      : privateData?.chatbot_context;

    return { data: pageData, chatbotContext: chatbotContext || null, error: null };
  } catch (error) {
    console.error('Error loading user page:', error);
    return { data: null, chatbotContext: null, error };
  }
}

// Publish page
export async function publishPage(userId: string): Promise<{ slug: string | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('pages')
      .update({ is_published: true })
      .eq('user_id', userId)
      .select('slug')
      .maybeSingle();

    if (error) return { slug: null, error };
    if (!data) return { slug: null, error: new Error('Page not found') };

    return { slug: data.slug, error: null };
  } catch (error) {
    console.error('Error publishing page:', error);
    return { slug: null, error };
  }
}

// Track analytics
export async function trackEvent(
  pageId: string, 
  eventType: 'view' | 'click' | 'share', 
  blockId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('analytics')
      .insert({
        page_id: pageId,
        block_id: blockId || null,
        event_type: eventType,
        metadata: metadata || {},
      });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}
