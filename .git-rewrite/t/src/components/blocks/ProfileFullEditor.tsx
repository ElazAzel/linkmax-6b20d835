import type { CoverHeight, CoverGradient, AvatarSize, ShadowStyle, AvatarPosition } from "@/types/profile-editor";
/**
 * ProfileFullEditor - Unified full-screen editor for the top profile section
 * Opens as a drawer on mobile, dialog on desktop
 */
import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, 
  User, 
  Type, 
  Palette,
  Camera,
  Upload,
  Loader2,
  Check,
  X,
  ChevronLeft,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFreemiumLimits } from '@/hooks/useFreemiumLimits';
import { getI18nText, createMultilingualString, isMultilingualString, type SupportedLanguage, type MultilingualString } from '@/lib/i18n-helpers';
import { compressImage } from '@/lib/image-compression';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ImageCropper } from '@/components/form-fields/ImageCropper';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { FrameSelector } from '@/components/profile/FrameSelector';
import { NameAnimationSelector } from '@/components/profile/NameAnimationSelector';
import { NAME_ANIMATION_CSS, getNameAnimationClass } from '@/lib/profile-frame-system';
import type { ProfileBlock as ProfileBlockType, NameAnimationType } from '@/types/page';

interface ProfileFullEditorProps {
  block: ProfileBlockType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<ProfileBlockType>) => void;
}

const COVER_GRADIENTS = [
  { value: 'none', label: 'profile.none', preview: 'bg-muted' },
  { value: 'dark', label: 'profile.dark', preview: 'bg-gradient-to-b from-black/50 to-black/20' },
  { value: 'light', label: 'profile.light', preview: 'bg-gradient-to-b from-white/50 to-white/20' },
  { value: 'primary', label: 'profile.primary', preview: 'bg-gradient-to-b from-primary/60 to-primary/20' },
  { value: 'sunset', label: 'profile.sunset', preview: 'bg-gradient-to-br from-orange-500/50 via-pink-500/50 to-purple-600/50' },
  { value: 'ocean', label: 'profile.ocean', preview: 'bg-gradient-to-br from-blue-500/50 via-cyan-500/50 to-teal-500/50' },
  { value: 'purple', label: 'profile.purple', preview: 'bg-gradient-to-br from-purple-600/50 via-pink-500/50 to-blue-500/50' },
];

const COVER_HEIGHTS = [
  { value: 'small', label: 'profile.small' },
  { value: 'medium', label: 'profile.medium' },
  { value: 'large', label: 'profile.large' },
];

const AVATAR_SIZES = [
  { value: 'small', label: 'profile.small', size: 'h-12 w-12' },
  { value: 'medium', label: 'profile.medium', size: 'h-16 w-16' },
  { value: 'large', label: 'profile.large', size: 'h-20 w-20' },
  { value: 'xlarge', label: 'profile.xlarge', size: 'h-24 w-24' },
];

// Avatar frames are now handled by FrameSelector component with full options

const SHADOW_STYLES = [
  { value: 'none', label: 'profile.none' },
  { value: 'soft', label: 'profile.soft' },
  { value: 'medium', label: 'profile.medium' },
  { value: 'strong', label: 'profile.strong' },
  { value: 'glow', label: 'profile.glow' },
];

const AVATAR_POSITIONS = [
  { value: 'left', label: 'fields.left' },
  { value: 'center', label: 'fields.center' },
  { value: 'right', label: 'fields.right' },
];

export const ProfileFullEditor = memo(function ProfileFullEditor({
  block,
  isOpen,
  onClose,
  onSave,
}: ProfileFullEditorProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { canUsePremiumFrames } = useFreemiumLimits();
  const currentLang = i18n.language as SupportedLanguage;
  
  const [formData, setFormData] = useState<Partial<ProfileBlockType>>(() => ({ ...block }));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'avatar' | 'cover'>('avatar');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState('');
  const [activeTab, setActiveTab] = useState('cover');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sync formData when block changes
  useEffect(() => {
    if (block) {
      setFormData({ ...block });
    }
  }, [block]);

  const name = typeof formData.name === 'object' 
    ? getI18nText(formData.name, currentLang)
    : formData.name || '';
  
  const bio = typeof formData.bio === 'object'
    ? getI18nText(formData.bio, currentLang)
    : formData.bio || '';

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ME';

  const handleFileUpload = useCallback(async (file: File, type: 'avatar' | 'cover') => {
    if (!user) {
      toast.error(t('auth.required', 'Please sign in'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('upload.fileTooLarge', 'File too large (max 10MB)'));
      return;
    }

    if (file.type === 'image/gif') {
      await uploadFile(file, type);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCropperImage(e.target?.result as string);
      setUploadType(type);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  }, [user, t]);

  const uploadFile = async (file: File | Blob, type: 'avatar' | 'cover') => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      let processedFile = file;
      if (file instanceof File && file.type.startsWith('image/') && file.type !== 'image/gif') {
        processedFile = await compressImage(file);
      }

      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('user-media')
        .upload(filePath, processedFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      if (type === 'avatar') {
        setFormData(prev => ({ ...prev, avatar: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, coverImage: publicUrl }));
      }
      toast.success(t('upload.success', 'Uploaded!'));
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(t('upload.error', 'Upload failed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropperSave = async (croppedDataUrl: string) => {
    setCropperOpen(false);
    const response = await fetch(croppedDataUrl);
    const blob = await response.blob();
    await uploadFile(blob, uploadType);
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = e.target === avatarInputRef.current ? 'avatar' : 'cover';
      handleFileUpload(file, type);
    }
    e.target.value = '';
  }, [handleFileUpload]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const renderContent = () => (
    <>
      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="grid grid-cols-4 mx-4 mb-4 h-12 rounded-2xl bg-muted/50 p-1 shrink-0">
          <TabsTrigger value="cover" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Image className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="avatar" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Type className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="style" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Palette className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-5 pb-6 space-y-6">
            {/* Cover Tab */}
            <TabsContent value="cover" className="mt-0 space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">{t('profileEditor.cover', 'Обложка')}</h3>
                <p className="text-sm text-muted-foreground">{t('profileEditor.coverDesc', 'Добавьте красивую обложку')}</p>
              </div>

              {/* Cover Preview */}
              <div 
                className={cn(
                  "relative aspect-[2.5/1] rounded-2xl overflow-hidden border-2 border-dashed cursor-pointer group",
                  formData.coverImage ? "border-transparent" : "border-border bg-muted/30"
                )}
                onClick={() => coverInputRef.current?.click()}
              >
                {formData.coverImage ? (
                  <>
                    <img src={formData.coverImage} alt="" className="w-full h-full object-cover" />
                    {formData.coverGradient && formData.coverGradient !== 'none' && (
                      <div className={cn(
                        "absolute inset-0",
                        COVER_GRADIENTS.find(g => g.value === formData.coverGradient)?.preview
                      )} />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('profileEditor.uploadCover', 'Загрузить обложку')}</span>
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                  {isUploading && uploadType === 'cover' ? (
                    <Loader2 className="h-10 w-10 text-white animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>

              {formData.coverImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, coverImage: undefined }))}
                  className="w-full rounded-xl"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('profileEditor.removeCover', 'Удалить обложку')}
                </Button>
              )}

              {/* Cover Height */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('profile.coverHeight', 'Высота')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {COVER_HEIGHTS.map((height) => (
                    <button
                      key={height.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coverHeight: height.value as CoverHeight }))}
                      className={cn(
                        "py-3 rounded-xl border-2 text-sm font-medium transition-all",
                        formData.coverHeight === height.value 
                          ? "border-primary bg-primary/5" 
                          : "border-border/20 hover:border-border/50"
                      )}
                    >
                      {t(height.label)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Gradient */}
              {formData.coverImage && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t('profile.coverGradient', 'Градиент')}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {COVER_GRADIENTS.map((gradient) => (
                      <button
                        key={gradient.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, coverGradient: gradient.value as CoverGradient }))}
                        className={cn(
                          "aspect-[2/1] rounded-xl border-2 transition-all",
                          gradient.preview,
                          formData.coverGradient === gradient.value 
                            ? "border-primary ring-2 ring-primary/30" 
                            : "border-border/20 hover:border-border/50"
                        )}
                        title={t(gradient.label)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Avatar Tab */}
            <TabsContent value="avatar" className="mt-0 space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">{t('profileEditor.avatar', 'Аватар')}</h3>
                <p className="text-sm text-muted-foreground">{t('profileEditor.avatarDesc', 'Ваше фото профиля')}</p>
              </div>

              {/* Avatar Preview */}
              <div className="flex justify-center">
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Avatar className="h-32 w-32 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
                    <AvatarImage src={formData.avatar} alt="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-black">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading && uploadType === 'avatar' ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar Size */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('profile.avatarSize', 'Размер')}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_SIZES.map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatarSize: size.value as AvatarSize }))}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                        formData.avatarSize === size.value 
                          ? "border-primary bg-primary/5" 
                          : "border-border/20 hover:border-border/50"
                      )}
                    >
                      <div className={cn("rounded-full bg-muted", 
                        size.value === 'small' && 'h-5 w-5',
                        size.value === 'medium' && 'h-7 w-7',
                        size.value === 'large' && 'h-9 w-9',
                        size.value === 'xlarge' && 'h-11 w-11'
                      )} />
                      <span className="text-[10px] font-medium">{t(size.label)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Frame - Using FrameSelector for full options with freemium */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('profile.avatarFrame', 'Рамка')}</Label>
                <FrameSelector
                  value={formData.avatarFrame || 'default'}
                  onChange={(value) => setFormData(prev => ({ ...prev, avatarFrame: value }))}
                  isPremium={canUsePremiumFrames()}
                  avatarUrl={formData.avatar}
                  onUpgradeClick={() => navigate('/pricing')}
                />
              </div>

              {/* Shadow Style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('profile.shadowStyle', 'Тень')}</Label>
                <div className="grid grid-cols-5 gap-2">
                  {SHADOW_STYLES.map((shadow) => (
                    <button
                      key={shadow.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, shadowStyle: shadow.value as ShadowStyle }))}
                      className={cn(
                        "py-2.5 rounded-xl border-2 text-xs font-medium transition-all",
                        formData.shadowStyle === shadow.value 
                          ? "border-primary bg-primary/5" 
                          : "border-border/20 hover:border-border/50"
                      )}
                    >
                      {t(shadow.label)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Animation - Using NameAnimationSelector for full options with freemium */}
              <div className="space-y-3">
                <NameAnimationSelector
                  value={(formData.nameAnimation as NameAnimationType) || 'none'}
                  onChange={(value) => setFormData(prev => ({ ...prev, nameAnimation: value }))}
                  isPremium={canUsePremiumFrames()}
                  previewName={name}
                  onUpgradeClick={() => navigate('/pricing')}
                />
              </div>
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-0 space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">{t('profileEditor.info', 'О вас')}</h3>
                <p className="text-sm text-muted-foreground">{t('profileEditor.infoDesc', 'Имя и описание на 3 языках')}</p>
              </div>

              {/* Multilingual Name Input */}
              <MultilingualInput
                label={t('fields.name', 'Имя')}
                value={isMultilingualString(formData.name) ? formData.name : createMultilingualString(name)}
                onChange={(newName: MultilingualString) => setFormData(prev => ({ ...prev, name: newName }))}
                type="input"
                placeholder={t('profile.namePlaceholder', 'Ваше имя')}
              />

              {/* Multilingual Bio Input */}
              <MultilingualInput
                label={t('fields.bio', 'О себе')}
                value={isMultilingualString(formData.bio) ? formData.bio : createMultilingualString(bio)}
                onChange={(newBio: MultilingualString) => setFormData(prev => ({ ...prev, bio: newBio }))}
                type="textarea"
                placeholder={t('profile.bioPlaceholder', 'Расскажите о себе...')}
              />
            </TabsContent>

            {/* Style Tab */}
            <TabsContent value="style" className="mt-0 space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">{t('profileEditor.style', 'Расположение')}</h3>
                <p className="text-sm text-muted-foreground">{t('profileEditor.styleDesc', 'Настройте внешний вид')}</p>
              </div>

              {/* Preview Card */}
              <div className="border border-border/20 rounded-2xl overflow-hidden bg-card">
                <div className={cn(
                  "h-16 w-full relative",
                  formData.coverImage ? '' : 'bg-muted'
                )}>
                  {formData.coverImage && (
                    <img src={formData.coverImage} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                
                <div className={cn(
                  "flex items-center gap-3 p-3 -mt-6",
                  formData.avatarPosition === 'left' && 'justify-start',
                  formData.avatarPosition === 'center' && 'justify-center',
                  formData.avatarPosition === 'right' && 'justify-end'
                )}>
                  <Avatar className="h-12 w-12 ring-2 ring-background">
                    <AvatarImage src={formData.avatar} alt="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-black">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className={cn(
                  "px-3 pb-3 -mt-1",
                  formData.avatarPosition === 'left' && 'text-left',
                  formData.avatarPosition === 'center' && 'text-center',
                  formData.avatarPosition === 'right' && 'text-right'
                )}>
                  <h4 className="font-bold text-sm truncate">{name || t('profileEditor.yourName', 'Ваше имя')}</h4>
                  <p className="text-xs text-muted-foreground truncate">{bio || t('profileEditor.yourBio', 'О себе')}</p>
                </div>
              </div>

              {/* Position */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('profileEditor.position', 'Позиция')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_POSITIONS.map((pos) => (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatarPosition: pos.value as AvatarPosition }))}
                      className={cn(
                        "py-3 rounded-xl border-2 text-sm font-medium transition-all",
                        formData.avatarPosition === pos.value 
                          ? "border-primary bg-primary/5" 
                          : "border-border/20 hover:border-border/50"
                      )}
                    >
                      {t(pos.label)}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Image Cropper */}
      <ImageCropper
        imageUrl={cropperImage}
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onSave={handleCropperSave}
        aspectRatio={uploadType === 'avatar' ? 1 : 16 / 9}
        shape={uploadType === 'avatar' ? 'circle' : 'rectangle'}
      />
    </>
  );

  // Mobile: Full-screen drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="h-[96vh] max-h-[96vh] bg-background border-t-0 rounded-t-[32px] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-14 h-1.5 rounded-full bg-muted-foreground/25" />
          </div>
          
          {/* Header */}
          <DrawerHeader className="shrink-0 border-b border-border/10 px-5 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="h-12 w-12 rounded-2xl hover:bg-muted/50 active:scale-95 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <DrawerTitle className="text-xl font-black">
                  {t('profileEditor.title', 'Редактор профиля')}
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  {t('profileEditor.subtitle', 'Настройте ваш профиль')}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          
          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderContent()}
          </div>
          
          {/* Footer Actions */}
          <div className="shrink-0 border-t border-border/10 px-5 py-5 pb-safe bg-background/98 backdrop-blur-xl">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 h-14 rounded-2xl text-base font-bold active:scale-[0.98] transition-all border-2"
              >
                <X className="h-5 w-5 mr-2" />
                {t('editor.cancel', 'Отмена')}
              </Button>
              <Button 
                onClick={handleSave} 
                className="flex-[2] h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 active:scale-[0.98] transition-all"
              >
                <Check className="h-5 w-5 mr-2" />
                {t('editor.save', 'Сохранить')}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col bg-card/98 backdrop-blur-2xl border border-border/20 shadow-2xl rounded-3xl p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {t('profileEditor.title', 'Редактор профиля')}
              </DialogTitle>
              <DialogDescription>
                {t('profileEditor.subtitle', 'Настройте ваш профиль')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden py-2">
          {renderContent()}
        </div>

        <div className="p-6 pt-4 border-t border-border/10 flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl h-12">
            {t('editor.cancel', 'Отмена')}
          </Button>
          <Button onClick={handleSave} className="flex-[2] rounded-2xl h-12 shadow-lg">
            <Check className="h-5 w-5 mr-2" />
            {t('editor.save', 'Сохранить')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default ProfileFullEditor;
