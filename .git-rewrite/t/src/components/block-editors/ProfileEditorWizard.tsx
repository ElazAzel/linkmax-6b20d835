/**
 * ProfileEditorWizard - Step-by-step wizard for editing profile block
 * Steps: Cover → Avatar → Name/Bio → Style
 */
import { memo, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Image, 
  User, 
  FileText, 
  Palette, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Camera,
  Upload,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { migrateToMultilingual, getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { compressImage } from '@/lib/image-compression';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ImageCropper } from '@/components/form-fields/ImageCropper';
import type { ProfileBlock } from '@/types/page';

interface ProfileEditorWizardProps {
  formData: Partial<ProfileBlock>;
  onChange: (data: Partial<ProfileBlock>) => void;
  onComplete?: () => void;
}

type WizardStep = 'cover' | 'avatar' | 'info' | 'style';

const STEPS: WizardStep[] = ['cover', 'avatar', 'info', 'style'];

const COVER_GRADIENTS = [
  { value: 'none', label: 'gradients.none', preview: 'bg-muted' },
  { value: 'dark', label: 'gradients.dark', preview: 'bg-gradient-to-b from-black/50 to-black/20' },
  { value: 'light', label: 'gradients.light', preview: 'bg-gradient-to-b from-white/50 to-white/20' },
  { value: 'primary', label: 'gradients.primary', preview: 'bg-gradient-to-b from-primary/60 to-primary/20' },
  { value: 'sunset', label: 'gradients.sunset', preview: 'bg-gradient-to-br from-orange-500/50 via-pink-500/50 to-purple-600/50' },
  { value: 'ocean', label: 'gradients.ocean', preview: 'bg-gradient-to-br from-blue-500/50 via-cyan-500/50 to-teal-500/50' },
];

const AVATAR_SIZES = [
  { value: 'small', label: 'avatarSizes.small', size: 'h-16 w-16' },
  { value: 'medium', label: 'avatarSizes.medium', size: 'h-24 w-24' },
  { value: 'large', label: 'avatarSizes.large', size: 'h-32 w-32' },
  { value: 'xlarge', label: 'avatarSizes.xlarge', size: 'h-40 w-40' },
];

export const ProfileEditorWizard = memo(function ProfileEditorWizard({
  formData,
  onChange,
  onComplete,
}: ProfileEditorWizardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const currentLang = i18n.language as SupportedLanguage;
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('cover');
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState('');
  const [cropperType, setCropperType] = useState<'avatar' | 'cover'>('avatar');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Get current name/bio for display
  const nameValue = typeof formData.name === 'object' 
    ? getTranslatedString(formData.name, currentLang)
    : formData.name || '';
  
  const bioValue = typeof formData.bio === 'object'
    ? getTranslatedString(formData.bio, currentLang)
    : formData.bio || '';

  const initials = nameValue
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ME';

  const goNext = useCallback(() => {
    if (isLastStep) {
      onComplete?.();
    } else {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
  }, [currentStepIndex, isLastStep, onComplete]);

  const goPrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  }, [currentStepIndex, isFirstStep]);

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File, type: 'avatar' | 'cover') => {
    if (!user) {
      toast.error(t('auth.required', 'Please sign in'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('upload.fileTooLarge', 'File too large (max 10MB)'));
      return;
    }

    // For GIFs, upload directly
    if (file.type === 'image/gif') {
      await uploadFile(file, type);
      return;
    }

    // Open cropper for other images
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropperImage(e.target?.result as string);
      setCropperType(type);
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
        onChange({ ...formData, avatar: publicUrl });
      } else {
        onChange({ ...formData, coverImage: publicUrl });
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
    await uploadFile(blob, cropperType);
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = e.target === avatarInputRef.current ? 'avatar' : 'cover';
      handleFileUpload(file, type);
    }
    e.target.value = '';
  }, [handleFileUpload]);

  // Step content renderers
  const renderCoverStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Image className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-black">{t('wizard.cover.title', 'Обложка профиля')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('wizard.cover.description', 'Добавьте красивую обложку для вашего профиля')}
        </p>
      </div>

      {/* Cover preview */}
      <div 
        className={cn(
          "relative aspect-[3/1] rounded-2xl overflow-hidden border-2 border-dashed",
          formData.coverImage ? "border-transparent" : "border-border bg-muted/30"
        )}
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
            <span className="text-sm text-muted-foreground">
              {t('wizard.cover.placeholder', 'Нажмите чтобы загрузить')}
            </span>
          </div>
        )}
        
        {/* Upload overlay */}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors group"
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Gradient selector */}
      {formData.coverImage && (
        <div className="space-y-3">
          <Label>{t('wizard.cover.gradient', 'Градиент')}</Label>
          <div className="grid grid-cols-3 gap-2">
            {COVER_GRADIENTS.map((gradient) => (
              <button
                key={gradient.value}
                type="button"
                onClick={() => onChange({ ...formData, coverGradient: gradient.value as any })}
                className={cn(
                  "aspect-[2/1] rounded-xl border-2 transition-all",
                  gradient.preview,
                  formData.coverGradient === gradient.value 
                    ? "border-primary ring-2 ring-primary/30" 
                    : "border-border/20 hover:border-border/50"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {formData.coverImage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...formData, coverImage: undefined })}
          className="w-full rounded-xl"
        >
          {t('wizard.cover.remove', 'Удалить обложку')}
        </Button>
      )}
    </div>
  );

  const renderAvatarStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <User className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-black">{t('wizard.avatar.title', 'Ваше фото')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('wizard.avatar.description', 'Добавьте аватар - это поможет людям узнать вас')}
        </p>
      </div>

      {/* Avatar preview */}
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={isUploading}
          className="relative group"
        >
          <Avatar className="h-32 w-32 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
            <AvatarImage src={formData.avatar} alt="" />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-black">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <Camera className="h-8 w-8 text-white" />
            )}
          </div>
        </button>
        
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground text-center">
          {t('wizard.avatar.hint', 'Рекомендуется: квадратное фото минимум 400×400px')}
        </p>
      </div>

      {/* Size selector */}
      <div className="space-y-3">
        <Label>{t('wizard.avatar.size', 'Размер аватара')}</Label>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => onChange({ ...formData, avatarSize: size.value as any })}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                formData.avatarSize === size.value 
                  ? "border-primary bg-primary/5" 
                  : "border-border/20 hover:border-border/50"
              )}
            >
              <div className={cn("rounded-full bg-muted", 
                size.value === 'small' && 'h-6 w-6',
                size.value === 'medium' && 'h-8 w-8',
                size.value === 'large' && 'h-10 w-10',
                size.value === 'xlarge' && 'h-12 w-12'
              )} />
              <span className="text-[10px] font-medium">{t(size.label)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-black">{t('wizard.info.title', 'О вас')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('wizard.info.description', 'Расскажите о себе - имя и краткое описание')}
        </p>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <Label>{t('fields.name', 'Имя')}</Label>
        <Input
          value={nameValue}
          onChange={(e) => {
            const newName = migrateToMultilingual(e.target.value);
            onChange({ ...formData, name: newName });
          }}
          placeholder={t('placeholders.yourName', 'Ваше имя')}
          className="h-14 text-lg rounded-2xl border-2 focus:border-primary"
        />
      </div>

      {/* Bio input */}
      <div className="space-y-2">
        <Label>{t('fields.bio', 'О себе')}</Label>
        <Textarea
          value={bioValue}
          onChange={(e) => {
            const newBio = migrateToMultilingual(e.target.value);
            onChange({ ...formData, bio: newBio });
          }}
          placeholder={t('placeholders.tellAboutYourself', 'Расскажите о себе...')}
          className="min-h-[120px] text-base rounded-2xl border-2 focus:border-primary resize-none"
          rows={4}
        />
        <p className="text-xs text-muted-foreground text-right">
          {bioValue.length}/200
        </p>
      </div>
    </div>
  );

  const renderStyleStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Palette className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-black">{t('wizard.style.title', 'Финальные штрихи')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('wizard.style.description', 'Настройте внешний вид профиля')}
        </p>
      </div>

      {/* Preview card */}
      <div className="border border-border/20 rounded-2xl overflow-hidden bg-card">
        {/* Mini cover */}
        <div className={cn(
          "h-20 w-full relative",
          formData.coverImage ? '' : 'bg-muted'
        )}>
          {formData.coverImage && (
            <img src={formData.coverImage} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        
        {/* Avatar + info */}
        <div className="flex items-center gap-4 p-4 -mt-8">
          <Avatar className="h-16 w-16 ring-4 ring-background">
            <AvatarImage src={formData.avatar} alt="" />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-black">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pt-6">
            <h3 className="font-bold truncate">{nameValue || t('wizard.preview.name', 'Ваше имя')}</h3>
            <p className="text-sm text-muted-foreground truncate">{bioValue || t('wizard.preview.bio', 'О себе')}</p>
          </div>
        </div>
      </div>

      {/* Quick style options */}
      <div className="space-y-3">
        <Label>{t('wizard.style.position', 'Позиция аватара')}</Label>
        <div className="grid grid-cols-3 gap-2">
          {['left', 'center', 'right'].map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => onChange({ ...formData, avatarPosition: pos as any })}
              className={cn(
                "py-3 rounded-xl border-2 text-sm font-medium transition-all",
                formData.avatarPosition === pos 
                  ? "border-primary bg-primary/5" 
                  : "border-border/20 hover:border-border/50"
              )}
            >
              {t(`fields.${pos}`, pos)}
            </button>
          ))}
        </div>
      </div>

      {/* Success message */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <Sparkles className="h-5 w-5 text-green-600" />
        <p className="text-sm text-green-700 dark:text-green-400">
          {t('wizard.style.ready', 'Отлично! Ваш профиль готов к публикации')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border/10">
        {STEPS.map((step, index) => {
          const isActive = step === currentStep;
          const isCompleted = index < currentStepIndex;
          
          return (
            <button
              key={step}
              type="button"
              onClick={() => goToStep(step)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-primary/20 text-primary",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted && <Check className="h-3 w-3" />}
              <span>{index + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {currentStep === 'cover' && renderCoverStep()}
        {currentStep === 'avatar' && renderAvatarStep()}
        {currentStep === 'info' && renderInfoStep()}
        {currentStep === 'style' && renderStyleStep()}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 px-5 py-4 pb-safe border-t border-border/10 bg-background/98">
        {!isFirstStep && (
          <Button
            variant="outline"
            onClick={goPrev}
            className="flex-1 h-14 rounded-2xl text-base font-bold"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            {t('wizard.back', 'Назад')}
          </Button>
        )}
        
        <Button
          onClick={goNext}
          className={cn(
            "h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/25",
            isFirstStep ? "flex-1" : "flex-[2]"
          )}
        >
          {isLastStep ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              {t('wizard.finish', 'Готово')}
            </>
          ) : (
            <>
              {t('wizard.next', 'Далее')}
              <ChevronRight className="h-5 w-5 ml-1" />
            </>
          )}
        </Button>
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
    </div>
  );
});
