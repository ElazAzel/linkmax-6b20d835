import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Users, Trash2, Link2, Copy, RefreshCw } from 'lucide-react';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { NICHES, NICHE_ICONS, type Niche } from '@/lib/niches';
import { generateTeamInviteCode, resetTeamInviteCode, type Team } from '@/services/collaboration';

interface TeamEditorProps {
  team: Team;
  isOwner: boolean;
  onTeamUpdate: (team: Team) => void;
  onTeamDelete?: () => void;
}

export function TeamEditor({ team, isOwner, onTeamUpdate, onTeamDelete }: TeamEditorProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [avatarUrl, setAvatarUrl] = useState(team.avatar_url || '');
  const [niche, setNiche] = useState(team.niche || 'other');
  const [isPublic, setIsPublic] = useState(team.is_public);
  const [inviteCode, setInviteCode] = useState(team.invite_code || '');

  const inviteUrl = inviteCode ? `${window.location.origin}/join/${inviteCode}` : '';

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('teams.enterName', 'Введите название команды'));
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          avatar_url: avatarUrl || null,
          niche,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', team.id)
        .select()
        .single();

      if (error) throw error;
      
      onTeamUpdate({ ...team, ...data, invite_code: inviteCode });
      toast.success(t('teams.updated', 'Команда обновлена'));
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error(t('errors.updateFailed', 'Ошибка обновления'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('teams.deleteConfirm', 'Вы уверены, что хотите удалить команду?'))) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id);

      if (error) throw error;
      
      toast.success(t('teams.deleted', 'Команда удалена'));
      onTeamDelete?.();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error(t('errors.deleteFailed', 'Ошибка удаления'));
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    setGeneratingCode(true);
    try {
      const code = inviteCode 
        ? await resetTeamInviteCode(team.id)
        : await generateTeamInviteCode(team.id);
      
      if (code) {
        setInviteCode(code);
        toast.success(inviteCode ? t('teams.linkUpdated', 'Ссылка обновлена') : t('teams.linkCreated', 'Ссылка создана'));
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      toast.error(t('common.error', 'Ошибка'));
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success(t('common.copied', 'Ссылка скопирована'));
  };

  const handleAvatarUpload = async (url: string) => {
    setAvatarUrl(url);
  };

  if (!isOwner) {
    return (
      <Card className="bg-card/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            {t('teams.onlyOwnerCanEdit', 'Только владелец команды может редактировать настройки')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('teams.settings', 'Настройки команды')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/20">
                <Users className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <MediaUpload
              value={avatarUrl}
              onChange={handleAvatarUpload}
              label={t('teams.avatar', 'Аватар команды')}
              accept="image/*"
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>{t('fields.name', 'Название')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('teams.namePlaceholder', 'Название команды')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('fields.description', 'Описание')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('teams.descriptionPlaceholder', 'Описание команды...')}
              rows={3}
            />
          </div>

          {/* Niche */}
          <div className="space-y-2">
            <Label>{t('fields.niche', 'Ниша')}</Label>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NICHES.map((n) => (
                  <SelectItem key={n} value={n}>
                    {NICHE_ICONS[n as Niche]} {t(`niches.${n}`, n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Public/Private */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('teams.publicTeam', 'Публичная команда')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('teams.publicTeamHint', 'Публичные команды видны всем')}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              className="flex-1" 
              onClick={handleSave} 
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t('actions.save', 'Сохранить')}
            </Button>
            <Button 
              variant="destructive" 
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite Link Section */}
      <Card className="bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {t('teams.inviteLink', 'Ссылка-приглашение')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inviteCode ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="text-xs"
                />
                <Button size="icon" variant="outline" onClick={handleCopyInviteLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleGenerateInviteCode}
                disabled={generatingCode}
              >
                {generatingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {t('teams.updateLink', 'Обновить ссылку')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t('teams.shareLinkHint', 'Поделитесь этой ссылкой, чтобы пригласить людей в команду')}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {t('teams.createLinkHint', 'Создайте ссылку-приглашение для добавления участников')}
              </p>
              <Button 
                className="w-full"
                onClick={handleGenerateInviteCode}
                disabled={generatingCode}
              >
                {generatingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                {t('teams.createLink', 'Создать ссылку')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
