import { memo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Check, X, Camera, Loader2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { compressImage } from '@/lib/image-compression';
import { toast } from 'sonner';
import type { ProfileBlock as ProfileBlockType } from '@/types/page';

interface InlineProfileEditorProps {
  block: ProfileBlockType;
  onUpdate: (updates: Partial<ProfileBlockType>) => void;
}

export const InlineProfileEditor = memo(function InlineProfileEditor({ 
  block, 
  onUpdate 
}: InlineProfileEditorProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const currentLang = i18n.language as SupportedLanguage;
  
  const name = getTranslatedString(block.name, currentLang);
  const bio = getTranslatedString(block.bio, currentLang);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedBio, setEditedBio] = useState(bio);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedName(name);
  }, [name]);

  useEffect(() => {
    setEditedBio(bio);
  }, [bio]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingBio && bioInputRef.current) {
      bioInputRef.current.focus();
      bioInputRef.current.select();
    }
  }, [isEditingBio]);

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdate({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleSaveBio = () => {
    onUpdate({ bio: editedBio.trim() });
    setIsEditingBio(false);
  };

  const handleCancelName = () => {
    setEditedName(name);
    setIsEditingName(false);
  };

  const handleCancelBio = () => {
    setEditedBio(bio);
    setIsEditingBio(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelName();
    }
  };

  const handleBioKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelBio();
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error(t('auth.required', 'Please sign in to upload'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('upload.fileTooLarge', 'File size must be less than 10MB'));
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Compress the image
      let processedFile = file;
      if (file.type.startsWith('image/') && file.type !== 'image/gif') {
        processedFile = await compressImage(file);
      }

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(filePath, processedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      onUpdate({ avatar: publicUrl });
      toast.success(t('upload.success', 'Avatar updated'));
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(t('upload.error', 'Failed to upload avatar'));
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error(t('auth.required', 'Please sign in to upload'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('upload.fileTooLarge', 'File size must be less than 10MB'));
      return;
    }

    setIsUploadingCover(true);

    try {
      let processedFile = file;
      if (file.type.startsWith('image/') && file.type !== 'image/gif') {
        processedFile = await compressImage(file);
      }

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `cover-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(filePath, processedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      onUpdate({ coverImage: publicUrl });
      toast.success(t('upload.coverSuccess', 'Cover updated'));
    } catch (error) {
      console.error('Cover upload error:', error);
      toast.error(t('upload.error', 'Failed to upload cover'));
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getAvatarSize = () => {
    const size = block.avatarSize || 'large';
    switch (size) {
      case 'small': return 'h-16 w-16';
      case 'medium': return 'h-24 w-24';
      case 'large': return 'h-32 w-32';
      case 'xlarge': return 'h-40 w-40';
      default: return 'h-32 w-32';
    }
  };

  const getShadowClass = () => {
    const shadow = block.shadowStyle || 'soft';
    switch (shadow) {
      case 'none': return '';
      case 'soft': return 'shadow-md';
      case 'medium': return 'shadow-xl';
      case 'strong': return 'shadow-2xl';
      case 'glow': return 'shadow-[0_0_30px_hsl(var(--primary)/0.4)]';
      default: return 'shadow-md';
    }
  };

  const getCoverGradient = () => {
    const gradient = block.coverGradient || 'none';
    switch (gradient) {
      case 'none': return '';
      case 'dark': return 'bg-gradient-to-b from-black/50 to-black/20';
      case 'light': return 'bg-gradient-to-b from-white/50 to-white/20';
      case 'primary': return 'bg-gradient-to-b from-primary/60 to-primary/20';
      case 'sunset': return 'bg-gradient-to-br from-orange-500/50 via-pink-500/50 to-purple-600/50';
      case 'ocean': return 'bg-gradient-to-br from-blue-500/50 via-cyan-500/50 to-teal-500/50';
      case 'purple': return 'bg-gradient-to-br from-purple-600/50 via-pink-500/50 to-blue-500/50';
      default: return '';
    }
  };

  const getAvatarFrameClass = () => {
    const frameStyle = block.avatarFrame || 'default';
    
    switch (frameStyle) {
      case 'neon':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_30px_hsl(var(--primary)/0.5)] animate-pulse';
      case 'glitch':
        return 'ring-2 ring-primary ring-offset-2 ring-offset-background relative after:absolute after:inset-0 after:ring-2 after:ring-destructive after:rounded-full after:animate-ping';
      case 'aura':
        return 'ring-4 ring-primary/30 ring-offset-4 ring-offset-background shadow-[0_0_40px_20px_hsl(var(--primary)/0.2)]';
      case 'gradient':
        return 'ring-4 ring-offset-4 ring-offset-background bg-gradient-to-r from-primary via-secondary to-accent p-1 rounded-full';
      case 'pulse':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background animate-[pulse_2s_ease-in-out_infinite]';
      case 'rainbow':
        return 'ring-4 ring-offset-4 ring-offset-background animate-[spin_3s_linear_infinite] bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-1 rounded-full';
      case 'double':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_0_8px_hsl(var(--secondary))]';
      case 'spinning':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background animate-[spin_4s_linear_infinite]';
      case 'dash':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background [background:conic-gradient(from_0deg,hsl(var(--primary))_0%,transparent_50%,hsl(var(--primary))_100%)] animate-[spin_3s_linear_infinite] p-1 rounded-full';
      case 'wave':
        return 'ring-4 ring-primary ring-offset-4 ring-offset-background animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_20px_hsl(var(--primary)/0.3)]';
      default:
        return 'ring-2 ring-primary ring-offset-2 ring-offset-background';
    }
  };

  const isGradientFrame = block.avatarFrame === 'gradient' || block.avatarFrame === 'rainbow' || block.avatarFrame === 'dash';
  
  const getPositionClass = () => {
    const position = block.avatarPosition || 'center';
    switch (position) {
      case 'left': return 'items-start';
      case 'right': return 'items-end';
      case 'center': 
      default: return 'items-center';
    }
  };

  const getCoverHeight = () => {
    const height = block.coverHeight || 'medium';
    switch (height) {
      case 'small': return 'h-[120px]';
      case 'medium': return 'h-[200px]';
      case 'large': return 'h-[320px]';
      default: return 'h-[200px]';
    }
  };

  return (
    <div className={`relative flex flex-col ${getPositionClass()}`}>
      {/* Hidden file input for cover upload */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        className="hidden"
      />
      
      {/* Cover image area - clickable */}
      <div 
        className={`relative w-full ${getCoverHeight()} overflow-hidden group/cover ${!block.coverImage ? 'bg-muted border-2 border-dashed border-border cursor-pointer' : ''}`}
        onClick={!block.coverImage ? handleCoverClick : undefined}
        title={!block.coverImage ? t('profile.clickToChangeCover', 'Click to add cover') : undefined}
      >
        {block.coverImage ? (
          <>
            <img 
              src={block.coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleCoverClick}
            />
            {block.coverGradient !== 'none' && (
              <div className={`absolute inset-0 ${getCoverGradient()} pointer-events-none`} />
            )}
            
            {/* Cover controls */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/cover:opacity-100 transition-opacity z-10">
              {/* Settings popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                    title={t('profile.coverSettings', 'Cover settings')}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">{t('profile.coverHeight', 'Height')}</Label>
                      <Select
                        value={block.coverHeight || 'medium'}
                        onValueChange={(value) => onUpdate({ coverHeight: value as 'small' | 'medium' | 'large' })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">{t('profile.small', 'Small')}</SelectItem>
                          <SelectItem value="medium">{t('profile.medium', 'Medium')}</SelectItem>
                          <SelectItem value="large">{t('profile.large', 'Large')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">{t('profile.coverGradient', 'Gradient overlay')}</Label>
                      <Select
                        value={block.coverGradient || 'none'}
                        onValueChange={(value) => onUpdate({ coverGradient: value as 'none' | 'dark' | 'light' | 'primary' | 'sunset' | 'ocean' | 'purple' })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('profile.none', 'None')}</SelectItem>
                          <SelectItem value="dark">{t('profile.dark', 'Dark')}</SelectItem>
                          <SelectItem value="light">{t('profile.light', 'Light')}</SelectItem>
                          <SelectItem value="primary">{t('profile.primary', 'Primary')}</SelectItem>
                          <SelectItem value="sunset">{t('profile.sunset', 'Sunset')}</SelectItem>
                          <SelectItem value="ocean">{t('profile.ocean', 'Ocean')}</SelectItem>
                          <SelectItem value="purple">{t('profile.purple', 'Purple')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Delete button */}
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ coverImage: '' });
                  toast.success(t('profile.coverRemoved', 'Cover removed'));
                }}
                title={t('profile.removeCover', 'Remove cover')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Camera className="h-8 w-8 mx-auto mb-2" />
              <span className="text-sm">{t('profile.addCover', 'Add cover image')}</span>
            </div>
          </div>
        )}
        
        {/* Upload overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/cover:opacity-100 transition-opacity pointer-events-none">
          {isUploadingCover ? (
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          ) : (
            <div className="text-center text-white">
              <Camera className="h-10 w-10 mx-auto mb-2" />
              <span className="text-sm font-medium">{block.coverImage ? t('profile.changeCover', 'Change cover') : t('profile.addCover', 'Add cover')}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={`flex flex-col ${getPositionClass()} gap-4 p-6 ${block.coverImage ? '-mt-16' : ''}`}>
        {/* Hidden file input for avatar upload */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />
        
        {/* Avatar with settings */}
        <div className="relative group/avatar-container">
          {/* Clickable Avatar */}
          <div 
            className={`${isGradientFrame ? getAvatarFrameClass() : ''} ${getShadowClass()} relative cursor-pointer group/avatar`}
            onClick={handleAvatarClick}
            title={t('profile.clickToChangeAvatar', 'Click to change avatar')}
          >
            <Avatar className={`${getAvatarSize()} ${!isGradientFrame ? getAvatarFrameClass() : ''}`}>
              <AvatarImage src={block.avatar} alt={name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity">
              {isUploadingAvatar ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
          
          {/* Avatar settings button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full opacity-0 group-hover/avatar-container:opacity-100 transition-opacity z-10 shadow-md"
                onClick={(e) => e.stopPropagation()}
                title={t('profile.avatarSettings', 'Avatar settings')}
              >
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="center" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">{t('profile.avatarSize', 'Size')}</Label>
                  <Select
                    value={block.avatarSize || 'large'}
                    onValueChange={(value) => onUpdate({ avatarSize: value as 'small' | 'medium' | 'large' | 'xlarge' })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">{t('profile.small', 'Small')}</SelectItem>
                      <SelectItem value="medium">{t('profile.medium', 'Medium')}</SelectItem>
                      <SelectItem value="large">{t('profile.large', 'Large')}</SelectItem>
                      <SelectItem value="xlarge">{t('profile.xlarge', 'Extra Large')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">{t('profile.avatarFrame', 'Frame style')}</Label>
                  <Select
                    value={block.avatarFrame || 'default'}
                    onValueChange={(value) => onUpdate({ avatarFrame: value as 'default' | 'neon' | 'glitch' | 'aura' | 'gradient' | 'pulse' | 'rainbow' | 'double' | 'spinning' | 'dash' | 'wave' })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">{t('profile.default', 'Default')}</SelectItem>
                      <SelectItem value="neon">{t('profile.neon', 'Neon')}</SelectItem>
                      <SelectItem value="glitch">{t('profile.glitch', 'Glitch')}</SelectItem>
                      <SelectItem value="aura">{t('profile.aura', 'Aura')}</SelectItem>
                      <SelectItem value="gradient">{t('profile.gradient', 'Gradient')}</SelectItem>
                      <SelectItem value="pulse">{t('profile.pulse', 'Pulse')}</SelectItem>
                      <SelectItem value="rainbow">{t('profile.rainbow', 'Rainbow')}</SelectItem>
                      <SelectItem value="double">{t('profile.double', 'Double')}</SelectItem>
                      <SelectItem value="spinning">{t('profile.spinning', 'Spinning')}</SelectItem>
                      <SelectItem value="dash">{t('profile.dash', 'Dash')}</SelectItem>
                      <SelectItem value="wave">{t('profile.wave', 'Wave')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">{t('profile.shadowStyle', 'Shadow')}</Label>
                  <Select
                    value={block.shadowStyle || 'soft'}
                    onValueChange={(value) => onUpdate({ shadowStyle: value as 'none' | 'soft' | 'medium' | 'strong' | 'glow' })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('profile.none', 'None')}</SelectItem>
                      <SelectItem value="soft">{t('profile.soft', 'Soft')}</SelectItem>
                      <SelectItem value="medium">{t('profile.medium', 'Medium')}</SelectItem>
                      <SelectItem value="strong">{t('profile.strong', 'Strong')}</SelectItem>
                      <SelectItem value="glow">{t('profile.glow', 'Glow')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="text-center space-y-2 w-full max-w-md">
          {/* Editable Name */}
          <div className="flex items-center justify-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={nameInputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={handleSaveName}
                  className="text-2xl font-bold text-center h-10 w-48"
                  placeholder="Your Name"
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName}>
                  <Check className="h-4 w-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelName}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <h1 
                className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary/30"
                onClick={() => setIsEditingName(true)}
                title="Click to edit"
              >
                {name || 'Click to add name'}
              </h1>
            )}
            {block.verified && !isEditingName && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          
          {/* Editable Bio */}
          {isEditingBio ? (
            <div className="space-y-2">
              <Textarea
                ref={bioInputRef}
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                onKeyDown={handleBioKeyDown}
                className="text-center resize-none min-h-[60px]"
                placeholder="Tell people about yourself"
                rows={2}
              />
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="default" onClick={handleSaveBio}>
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelBio}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p 
              className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors border-b-2 border-transparent hover:border-primary/30"
              onClick={() => setIsEditingBio(true)}
              title="Click to edit"
            >
              {bio || 'Click to add bio'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});