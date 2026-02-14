import { memo, useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Check, X, Camera, Loader2, Settings2, Pencil, Palette } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFreemiumLimits } from '@/hooks/useFreemiumLimits';
import { compressImage } from '@/lib/image-compression';
import { toast } from 'sonner';
import { ImageCropper } from '@/components/form-fields/ImageCropper';
import { RichTextEditor } from '@/components/form-fields/RichTextEditor';
import { FrameSelector } from '@/components/profile/FrameSelector';
import { NameAnimationSelector } from '@/components/profile/NameAnimationSelector';
import { NAME_ANIMATION_CSS, getNameAnimationClass } from '@/lib/profile-frame-system';
import type { ProfileBlock as ProfileBlockType, NameAnimationType } from '@/types/page';
import { cn } from '@/lib/utils';

// Lazy load full editor
const ProfileFullEditor = lazy(() => import('./ProfileFullEditor'));

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
  const navigate = useNavigate();
  const { canUsePremiumFrames } = useFreemiumLimits();
  const currentLang = i18n.language as SupportedLanguage;
  
  const name = getI18nText(block.name, currentLang);
  const bio = getI18nText(block.bio, currentLang);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedBio, setEditedBio] = useState(bio);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);
  
  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState('');
  const [cropperType, setCropperType] = useState<'avatar' | 'cover'>('avatar');
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sync state when block changes
  useEffect(() => {
    setEditedName(name);
  }, [name]);

  useEffect(() => {
    setEditedBio(bio);
  }, [bio]);

  // Focus management with animation
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      });
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingBio && bioTextareaRef.current) {
      requestAnimationFrame(() => {
        bioTextareaRef.current?.focus();
        // Move cursor to end
        const len = bioTextareaRef.current?.value.length || 0;
        bioTextareaRef.current?.setSelectionRange(len, len);
      });
    }
  }, [isEditingBio]);

  // Optimized save handlers with debounce
  const handleSaveName = useCallback(() => {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== name) {
      onUpdate({ name: trimmedName });
      toast.success(t('profile.nameSaved', 'Имя сохранено'));
    }
    setIsEditingName(false);
  }, [editedName, name, onUpdate, t]);

  const handleSaveBio = useCallback(() => {
    const trimmedBio = editedBio.trim();
    if (trimmedBio !== bio) {
      onUpdate({ bio: trimmedBio });
      toast.success(t('profile.bioSaved', 'Описание сохранено'));
    }
    setIsEditingBio(false);
  }, [editedBio, bio, onUpdate, t]);

  const handleCancelName = useCallback(() => {
    setEditedName(name);
    setIsEditingName(false);
  }, [name]);

  const handleCancelBio = useCallback(() => {
    setEditedBio(bio);
    setIsEditingBio(false);
  }, [bio]);

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

    // For GIFs, upload directly without cropping
    if (file.type === 'image/gif') {
      await uploadFile(file, 'avatar');
      return;
    }

    // Open cropper for other images
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropperImage(e.target?.result as string);
      setCropperType('avatar');
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleCoverUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // For GIFs, upload directly without cropping
    if (file.type === 'image/gif') {
      await uploadFile(file, 'cover');
      return;
    }

    // Open cropper for other images
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropperImage(e.target?.result as string);
      setCropperType('cover');
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File | Blob, type: 'avatar' | 'cover') => {
    if (!user) return;
    
    const setUploading = type === 'avatar' ? setIsUploadingAvatar : setIsUploadingCover;
    setUploading(true);

    try {
      let processedFile = file;
      if (file instanceof File && file.type.startsWith('image/') && file.type !== 'image/gif') {
        processedFile = await compressImage(file);
      }

      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(filePath, processedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      if (type === 'avatar') {
        onUpdate({ avatar: publicUrl });
      } else {
        onUpdate({ coverImage: publicUrl });
      }
      toast.success(t('upload.success', 'Image updated'));
    } catch (error) {
      console.error(`${type} upload error:`, error);
      toast.error(t('upload.error', 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  const handleCropperSave = async (croppedDataUrl: string) => {
    setCropperOpen(false);
    
    // Convert data URL to blob
    const response = await fetch(croppedDataUrl);
    const blob = await response.blob();
    
    await uploadFile(blob, cropperType);
  };

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleCoverUpload = handleCoverUploadFile;

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getAvatarSize = () => {
    const size = block.avatarSize || 'large';
    switch (size) {
      case 'small': return 'h-20 w-20';
      case 'medium': return 'h-28 w-28';
      case 'large': return 'h-36 w-36';
      case 'xlarge': return 'h-44 w-44';
      default: return 'h-36 w-36';
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

  // Using the new frame utils
  const frameStyle = block.avatarFrame || 'default';
  const hasGradientFrame = ['gradient', 'gradient-sunset', 'gradient-ocean', 'gradient-purple', 'rainbow', 'rainbow-spin'].includes(frameStyle);
  
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
      case 'small': return 'h-[140px]';
      case 'medium': return 'h-[240px]';
      case 'large': return 'h-[360px]';
      default: return 'h-[240px]';
    }
  };

  return (
    <div className={`relative flex flex-col ${getPositionClass()}`}>
      {/* Full Editor Button - Floating */}
      <Button
        size="icon"
        variant="secondary"
        onClick={() => setIsFullEditorOpen(true)}
        className="absolute top-2 left-2 z-20 h-10 w-10 rounded-xl shadow-lg bg-background/90 backdrop-blur-sm hover:bg-background"
        title={t('profileEditor.openEditor', 'Открыть редактор')}
      >
        <Pencil className="h-4 w-4" />
      </Button>

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
      
      <div className={`flex flex-col ${getPositionClass()} gap-5 p-8 ${block.coverImage ? '-mt-20' : ''}`}>
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
            className={`${getShadowClass()} relative cursor-pointer group/avatar rounded-full`}
            onClick={handleAvatarClick}
            title={t('profile.clickToChangeAvatar', 'Click to change avatar')}
          >
            <Avatar className={`${getAvatarSize()} ring-4 ring-primary ring-offset-4 ring-offset-background`}>
              <AvatarImage src={block.avatar} alt={name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-black">
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
                <Palette className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="center" onClick={(e) => e.stopPropagation()}>
              <Tabs defaultValue="frame" className="w-full">
                <TabsList className="grid grid-cols-3 w-full h-auto mb-3">
                  <TabsTrigger value="frame" className="text-xs py-2">
                    {t('profile.frame', 'Рамка')}
                  </TabsTrigger>
                  <TabsTrigger value="size" className="text-xs py-2">
                    {t('profile.size', 'Размер')}
                  </TabsTrigger>
                  <TabsTrigger value="animation" className="text-xs py-2">
                    {t('profile.nameAnim', 'Имя')}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="frame" className="mt-0">
                  <FrameSelector
                    value={block.avatarFrame || 'default'}
                    onChange={(value) => onUpdate({ avatarFrame: value })}
                    isPremium={canUsePremiumFrames()}
                    avatarUrl={block.avatar}
                    onUpgradeClick={() => navigate('/pricing')}
                  />
                </TabsContent>
                
                <TabsContent value="size" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">{t('profile.avatarSize', 'Размер аватара')}</Label>
                    <Select
                      value={block.avatarSize || 'large'}
                      onValueChange={(value) => onUpdate({ avatarSize: value as 'small' | 'medium' | 'large' | 'xlarge' })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">{t('profile.small', 'Маленький')}</SelectItem>
                        <SelectItem value="medium">{t('profile.medium', 'Средний')}</SelectItem>
                        <SelectItem value="large">{t('profile.large', 'Большой')}</SelectItem>
                        <SelectItem value="xlarge">{t('profile.xlarge', 'Очень большой')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">{t('profile.shadowStyle', 'Тень')}</Label>
                    <Select
                      value={block.shadowStyle || 'soft'}
                      onValueChange={(value) => onUpdate({ shadowStyle: value as 'none' | 'soft' | 'medium' | 'strong' | 'glow' })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('profile.none', 'Нет')}</SelectItem>
                        <SelectItem value="soft">{t('profile.soft', 'Мягкая')}</SelectItem>
                        <SelectItem value="medium">{t('profile.medium', 'Средняя')}</SelectItem>
                        <SelectItem value="strong">{t('profile.strong', 'Сильная')}</SelectItem>
                        <SelectItem value="glow">{t('profile.glow', 'Свечение')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="animation" className="mt-0">
                  <NameAnimationSelector
                    value={(block.nameAnimation as NameAnimationType) || 'none'}
                    onChange={(value) => onUpdate({ nameAnimation: value })}
                    isPremium={canUsePremiumFrames()}
                    previewName={name}
                    onUpgradeClick={() => navigate('/pricing')}
                  />
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="text-center space-y-3 w-full max-w-md">
          {/* CSS for name animations */}
          <style>{NAME_ANIMATION_CSS}</style>
          
          {/* Editable Name - Optimized with animations */}
          <div className="flex items-center justify-center gap-3">
            {isEditingName ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <Input
                  ref={nameInputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelName();
                  }}
                  onBlur={handleSaveName}
                  className="text-2xl sm:text-3xl font-black text-center h-14 w-full max-w-[280px] rounded-2xl border-2 border-primary/50 focus:border-primary transition-colors"
                  placeholder={t('profile.namePlaceholder', 'Ваше имя')}
                />
                <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-primary/10 active:scale-95 transition-all" onClick={handleSaveName}>
                  <Check className="h-5 w-5 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-destructive/10 active:scale-95 transition-all" onClick={handleCancelName}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <h1 
                className={cn(
                  "text-2xl sm:text-3xl font-black cursor-pointer transition-all duration-200",
                  "hover:text-primary border-b-2 border-transparent hover:border-primary/30",
                  "active:scale-[0.98] tracking-tight px-2 py-1 rounded-lg hover:bg-muted/50",
                  getNameAnimationClass((block.nameAnimation as NameAnimationType) || 'none')
                )}
                onClick={() => setIsEditingName(true)}
                title={t('profile.clickToEdit', 'Нажмите для редактирования')}
              >
                {name || t('profile.addName', 'Добавить имя')}
              </h1>
            )}
            {block.verified && !isEditingName && (
              <Badge variant="secondary" className="gap-1.5 text-sm px-3 py-1 rounded-xl font-bold animate-in fade-in duration-300">
                <CheckCircle2 className="h-4 w-4" />
                {t('profile.verified', 'Verified')}
              </Badge>
            )}
          </div>
          
          {/* Editable Bio - Optimized with animations */}
          {isEditingBio ? (
            <div className="space-y-3 w-full animate-in fade-in zoom-in-95 duration-200">
              <Textarea
                ref={bioTextareaRef}
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancelBio();
                }}
                placeholder={t('profile.bioPlaceholder', 'Расскажите о себе...')}
                className="min-h-[100px] text-base rounded-2xl border-2 border-primary/50 focus:border-primary resize-none transition-colors"
                rows={3}
              />
              <div className="flex items-center justify-center gap-3">
                <Button size="lg" onClick={handleSaveBio} className="rounded-2xl px-6 h-12 font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
                  <Check className="h-5 w-5 mr-2" />
                  {t('common.save', 'Сохранить')}
                </Button>
                <Button size="lg" variant="outline" onClick={handleCancelBio} className="rounded-2xl px-6 h-12 font-bold active:scale-[0.98] transition-all">
                  <X className="h-5 w-5 mr-2" />
                  {t('editor.cancel', 'Отмена')}
                </Button>
              </div>
            </div>
          ) : (
            <p 
              className={cn(
                "text-base sm:text-lg text-muted-foreground cursor-pointer transition-all duration-200",
                "hover:text-foreground border-b-2 border-transparent hover:border-primary/30",
                "px-3 py-2 font-medium rounded-lg hover:bg-muted/50 active:scale-[0.98]"
              )}
              onClick={() => setIsEditingBio(true)}
              title={t('profile.clickToEdit', 'Нажмите для редактирования')}
            >
              {bio || t('profile.addBio', 'Добавить описание')}
            </p>
          )}
        </div>
      </div>

      {/* Image Cropper */}
      <ImageCropper
        imageUrl={cropperImage}
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onSave={handleCropperSave}
        aspectRatio={cropperType === 'avatar' ? 1 : 16 / 9}
        shape={cropperType === 'avatar' ? 'circle' : 'rectangle'}
      />

      {/* Full Profile Editor */}
      <Suspense fallback={null}>
        <ProfileFullEditor
          block={block}
          isOpen={isFullEditorOpen}
          onClose={() => setIsFullEditorOpen(false)}
          onSave={onUpdate}
        />
      </Suspense>
    </div>
  );
});