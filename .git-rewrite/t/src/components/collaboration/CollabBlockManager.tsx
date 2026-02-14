import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface BlockSettings {
  requester_blocks: string[];
  target_blocks: string[];
  show_all: boolean;
}

interface CollabBlockManagerProps {
  collabId: string;
  requesterId: string;
  targetId: string;
  requesterPageId: string;
  targetPageId: string | null;
  currentSettings: BlockSettings;
  requesterProfile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  targetProfile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  onSettingsChange: (settings: BlockSettings) => void;
}

interface BlockData {
  id: string;
  type: string;
  owner: 'requester' | 'target';
  pageId: string;
}

export function CollabBlockManager({
  collabId,
  requesterPageId,
  targetPageId,
  currentSettings,
  requesterProfile,
  targetProfile,
  onSettingsChange,
}: CollabBlockManagerProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [settings, setSettings] = useState<BlockSettings>(currentSettings);

  useEffect(() => {
    loadBlocks();
  }, [requesterPageId, targetPageId]);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const pageIds = [requesterPageId, targetPageId].filter(Boolean) as string[];
      
      const { data: blocksData } = await supabase
        .from('blocks')
        .select('id, type, page_id')
        .in('page_id', pageIds)
        .order('position');

      if (blocksData) {
        const blocksWithOwner: BlockData[] = blocksData.map(b => ({
          id: b.id,
          type: b.type,
          owner: b.page_id === requesterPageId ? 'requester' : 'target',
          pageId: b.page_id,
        }));
        
        setBlocks(blocksWithOwner);
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const isBlockSelected = (blockId: string, owner: 'requester' | 'target'): boolean => {
    if (settings.show_all) return true;
    return owner === 'requester' 
      ? settings.requester_blocks.includes(blockId)
      : settings.target_blocks.includes(blockId);
  };

  const toggleBlock = (blockId: string, owner: 'requester' | 'target') => {
    const key = owner === 'requester' ? 'requester_blocks' : 'target_blocks';
    const currentList = settings[key];
    
    const newList = currentList.includes(blockId)
      ? currentList.filter(id => id !== blockId)
      : [...currentList, blockId];
    
    setSettings(prev => ({
      ...prev,
      show_all: false,
      [key]: newList,
    }));
  };

  const toggleShowAll = () => {
    setSettings(prev => ({
      ...prev,
      show_all: !prev.show_all,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsJson = JSON.parse(JSON.stringify(settings));
      const { error } = await supabase
        .from('collaborations')
        .update({ block_settings: settingsJson })
        .eq('id', collabId);

      if (error) throw error;
      onSettingsChange(settings);
      toast.success(t('collab.blocksSaved', 'Настройки блоков сохранены'));
    } catch (error) {
      console.error('Error saving block settings:', error);
      toast.error(t('collab.blocksSaveError', 'Ошибка сохранения'));
    } finally {
      setSaving(false);
    }
  };

  const getBlockLabel = (block: BlockData): string => {
    const typeKeys: Record<string, string> = {
      profile: 'blocks.profile',
      link: 'blocks.link',
      button: 'blocks.button',
      text: 'blocks.text',
      image: 'blocks.image',
      video: 'blocks.video',
      carousel: 'blocks.carousel',
      product: 'blocks.product',
      socials: 'blocks.socials',
      messenger: 'blocks.messenger',
      form: 'blocks.form',
      download: 'blocks.download',
      newsletter: 'blocks.newsletter',
      testimonial: 'blocks.testimonial',
      faq: 'blocks.faq',
      countdown: 'blocks.countdown',
      map: 'blocks.map',
      custom_code: 'blocks.customCode',
      scratch: 'blocks.scratch',
      search: 'blocks.search',
      avatar: 'blocks.avatar',
      shoutout: 'blocks.shoutout',
      separator: 'blocks.separator',
      catalog: 'blocks.catalog',
      pricing: 'blocks.pricing',
      before_after: 'blocks.beforeAfter',
    };
    const key = typeKeys[block.type];
    return key ? t(key, block.type) : block.type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const requesterBlocks = blocks.filter(b => b.owner === 'requester');
  const targetBlocks = blocks.filter(b => b.owner === 'target');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button 
          variant={settings.show_all ? 'default' : 'outline'} 
          size="sm"
          onClick={toggleShowAll}
        >
          {settings.show_all ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
          {settings.show_all ? t('collab.showAll', 'Показать все') : t('collab.selective', 'Выборочно')}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {t('collab.save', 'Сохранить')}
        </Button>
      </div>

      {/* Requester blocks */}
      <Card className="bg-card/50">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={requesterProfile?.avatar_url || ''} />
              <AvatarFallback className="text-xs">
                {(requesterProfile?.display_name || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            {requesterProfile?.display_name || requesterProfile?.username || t('collab.initiator', 'Инициатор')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {requesterBlocks.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('collab.noBlocks', 'Нет блоков')}</p>
          ) : (
            <div className="space-y-2">
              {requesterBlocks.map(block => (
                <div 
                  key={block.id} 
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                >
                  <Checkbox
                    checked={isBlockSelected(block.id, 'requester')}
                    onCheckedChange={() => toggleBlock(block.id, 'requester')}
                    disabled={settings.show_all}
                  />
                  <Badge variant="secondary" className="text-xs">
                    {getBlockLabel(block)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target blocks */}
      {targetPageId && (
        <Card className="bg-card/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={targetProfile?.avatar_url || ''} />
              <AvatarFallback className="text-xs">
                {(targetProfile?.display_name || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            {targetProfile?.display_name || targetProfile?.username || t('collab.partner', 'Партнёр')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {targetBlocks.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('collab.noBlocks', 'Нет блоков')}</p>
          ) : (
              <div className="space-y-2">
                {targetBlocks.map(block => (
                  <div 
                    key={block.id} 
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    <Checkbox
                      checked={isBlockSelected(block.id, 'target')}
                      onCheckedChange={() => toggleBlock(block.id, 'target')}
                      disabled={settings.show_all}
                    />
                    <Badge variant="secondary" className="text-xs">
                      {getBlockLabel(block)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
