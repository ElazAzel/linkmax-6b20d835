import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BlockRenderer } from '@/components/BlockRenderer';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { Block, PageTheme } from '@/types/page';

interface BlockSettings {
  requester_blocks: string[];
  target_blocks: string[];
  show_all: boolean;
}

interface CollabPageData {
  id: string;
  collab_slug: string;
  requester_id: string;
  target_id: string;
  requester_page_id: string;
  target_page_id: string | null;
  requester: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  target: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  blocks: Block[];
  theme: PageTheme;
  block_settings: BlockSettings;
}

async function fetchCollabPage(collabSlug: string): Promise<CollabPageData | null> {
  // Get collaboration by slug
  const { data: collab, error } = await supabase
    .from('collaborations')
    .select('id, collab_slug, requester_id, target_id, requester_page_id, target_page_id, block_settings')
    .eq('collab_slug', collabSlug)
    .eq('status', 'accepted')
    .maybeSingle();

  if (error || !collab) return null;

  const rawSettings = collab.block_settings as unknown as BlockSettings | null;
  const blockSettings: BlockSettings = rawSettings || {
    requester_blocks: [],
    target_blocks: [],
    show_all: true,
  };

  // Fetch user profiles
  const userIds = [collab.requester_id, collab.target_id];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Fetch blocks from both pages
  const pageIds = [collab.requester_page_id, collab.target_page_id].filter(Boolean) as string[];
  
  let allBlocks: Block[] = [];
  let theme: PageTheme = {
    backgroundColor: 'hsl(var(--background))',
    textColor: 'hsl(var(--foreground))',
    fontFamily: 'sans',
    buttonStyle: 'rounded',
  };

  if (pageIds.length > 0) {
    // Get blocks from both pages
    const { data: blocks } = await supabase
      .from('blocks')
      .select('*')
      .in('page_id', pageIds)
      .order('position');

    if (blocks) {
      allBlocks = blocks
        .filter(b => {
          // If show_all, include all blocks
          if (blockSettings.show_all) return true;
          
          // Otherwise filter based on settings
          const isRequesterBlock = b.page_id === collab.requester_page_id;
          if (isRequesterBlock) {
            return blockSettings.requester_blocks.includes(b.id);
          } else {
            return blockSettings.target_blocks.includes(b.id);
          }
        })
        .map(b => ({
          id: b.id,
          type: b.type as Block['type'],
          ...((b.content || {}) as Record<string, unknown>),
          style: (b.style as Record<string, unknown>) || undefined,
          schedule: (b.schedule as Record<string, unknown>) || undefined,
        })) as Block[];
    }

    // Get theme from first page
    const { data: page } = await supabase
      .from('pages')
      .select('theme_settings')
      .eq('id', pageIds[0])
      .maybeSingle();

    if (page?.theme_settings) {
      const ts = page.theme_settings as Record<string, unknown>;
      theme = {
        backgroundColor: (ts.backgroundColor as string) || 'hsl(var(--background))',
        textColor: (ts.textColor as string) || 'hsl(var(--foreground))',
        fontFamily: ((ts.fontFamily as string) || 'sans') as 'sans' | 'serif' | 'mono',
        buttonStyle: ((ts.buttonStyle as string) || 'rounded') as 'default' | 'rounded' | 'pill' | 'gradient',
      };
    }
  }

  return {
    id: collab.id,
    collab_slug: collab.collab_slug!,
    requester_id: collab.requester_id,
    target_id: collab.target_id,
    requester_page_id: collab.requester_page_id,
    target_page_id: collab.target_page_id,
    requester: profileMap.get(collab.requester_id) || null,
    target: profileMap.get(collab.target_id) || null,
    blocks: allBlocks,
    theme,
    block_settings: blockSettings,
  };
}

export default function CollabPage() {
  const { collabSlug } = useParams<{ collabSlug: string }>();

  const { data: collabData, isLoading, error } = useQuery({
    queryKey: ['collab-page', collabSlug],
    queryFn: () => fetchCollabPage(collabSlug!),
    enabled: !!collabSlug,
  });

  useEffect(() => {
    if (collabData) {
      const names = [
        collabData.requester?.display_name || collabData.requester?.username,
        collabData.target?.display_name || collabData.target?.username,
      ].filter(Boolean);
      document.title = `${names.join(' × ')} | LinkMAX Collab`;
    }
  }, [collabData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !collabData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md bg-card/60 backdrop-blur-xl border-border/30 rounded-2xl">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Коллаборация не найдена</h1>
          <p className="text-muted-foreground mb-6">
            Эта страница не существует или коллаборация ещё не принята.
          </p>
          <Link to="/">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              На главную
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const themeStyle = {
    '--page-bg': collabData.theme.backgroundColor,
    '--page-text': collabData.theme.textColor,
    fontFamily: collabData.theme.fontFamily === 'serif' ? 'Georgia, serif' : 
                collabData.theme.fontFamily === 'mono' ? 'monospace' : 'inherit',
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen relative"
      style={{
        ...themeStyle,
        backgroundColor: 'var(--page-bg)',
        color: 'var(--page-text)',
      }}
    >
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Collab Header */}
      <div className="pt-12 pb-6 px-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Badge variant="secondary" className="rounded-full gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              Коллаборация
            </Badge>
          </div>

          <div className="flex items-center justify-center gap-4">
            {/* Requester Avatar */}
            <Link to={collabData.requester?.username ? `/${collabData.requester.username}` : '#'}>
              <Avatar className="h-16 w-16 ring-2 ring-background shadow-lg hover:scale-105 transition-transform">
                <AvatarImage src={collabData.requester?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-lg">
                  {(collabData.requester?.display_name || collabData.requester?.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>

            <span className="text-2xl font-bold text-muted-foreground">×</span>

            {/* Target Avatar */}
            <Link to={collabData.target?.username ? `/${collabData.target.username}` : '#'}>
              <Avatar className="h-16 w-16 ring-2 ring-background shadow-lg hover:scale-105 transition-transform">
                <AvatarImage src={collabData.target?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-lg">
                  {(collabData.target?.display_name || collabData.target?.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>

          <div className="text-center mt-4">
            <p className="text-lg font-semibold">
              {collabData.requester?.display_name || collabData.requester?.username || 'User'} 
              {' × '}
              {collabData.target?.display_name || collabData.target?.username || 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Combined Blocks */}
      <div className="max-w-md mx-auto px-4 pb-24 space-y-4">
        {collabData.blocks.map((block) => (
          <BlockRenderer 
            key={block.id} 
            block={block} 
            isPreview={true}
          />
        ))}

        {collabData.blocks.length === 0 && (
          <Card className="p-8 text-center bg-card/40 border-border/20 rounded-xl">
            <p className="text-muted-foreground">Блоки ещё не добавлены</p>
          </Card>
        )}
      </div>
    </div>
  );
}
