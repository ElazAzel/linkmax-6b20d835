import { useState, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { compressImage, getCompressionStats } from '@/lib/image-compression';

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  placeholder?: string;
  allowGif?: boolean; // Enable GIF support for this field
}

export function MediaUpload({ 
  value, 
  onChange, 
  accept = 'image/*',
  label,
  placeholder = 'https://example.com/image.jpg',
  allowGif = false
}: MediaUploadProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(value ? 'url' : 'upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine accepted file types based on GIF support and premium status
  const getAcceptedTypes = () => {
    if (allowGif && isPremium) {
      return accept.includes('image') ? 'image/*,.gif' : accept;
    }
    return accept;
  };

  const isGifFile = (file: File) => file.type === 'image/gif';
  const isGifUrl = (url: string) => url.toLowerCase().endsWith('.gif');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error(t('auth.required', 'Please sign in to upload files'));
      return;
    }

    // Validate file size (15MB limit before compression)
    if (file.size > 15 * 1024 * 1024) {
      toast.error(t('upload.fileTooLarge', 'File size must be less than 15MB'));
      return;
    }

    // Check if GIF is allowed for non-premium users
    if (isGifFile(file) && allowGif && !isPremium) {
      toast.error(t('upload.gifPremiumOnly', 'GIF uploads are available for Premium users only'));
      return;
    }

    setCompressing(true);
    setCompressionInfo(null);

    try {
      // Compress image if it's an image file (skip GIFs to preserve animation)
      let processedFile = file;
      if (file.type.startsWith('image/') && !isGifFile(file)) {
        const originalSize = file.size;
        processedFile = await compressImage(file);
        
        if (processedFile.size < originalSize) {
          const stats = getCompressionStats(originalSize, processedFile.size);
          setCompressionInfo(`${stats.percentage}% ${t('upload.compressed', 'compressed')}`);
        }
      } else if (isGifFile(file)) {
        setCompressionInfo(t('upload.gifPreserved', 'GIF animation preserved'));
      }

      setCompressing(false);
      setUploading(true);

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(filePath, processedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success(t('upload.success', 'File uploaded successfully'));
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(t('upload.error', 'Failed to upload file'));
      setCompressionInfo(null);
    } finally {
      setCompressing(false);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setCompressionInfo(null);
  };

  const isProcessing = uploading || compressing;

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">{t('upload.tab', 'Upload')}</TabsTrigger>
          <TabsTrigger value="url">{t('url.tab', 'URL')}</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptedTypes()}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {value ? (
            <div className="relative">
              {accept.includes('image') ? (
                <img 
                  src={value} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-muted rounded-lg border">
                  <span className="text-sm text-muted-foreground truncate px-4">
                    {value.split('/').pop()}
                  </span>
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
              {compressionInfo && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded">
                  <CheckCircle className="h-3 w-3" />
                  {compressionInfo}
                </div>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-32 flex flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || !user}
            >
              {compressing ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>{t('upload.compressing', 'Compressing...')}</span>
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>{t('upload.uploading', 'Uploading...')}</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span>{t('upload.click', 'Click to upload')}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t('upload.autoCompress', 'Auto-compressed, max 15MB')}</span>
                    {allowGif && isPremium && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Sparkles className="h-3 w-3" />
                        GIF
                      </Badge>
                    )}
                  </div>
                  {allowGif && !isPremium && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Crown className="h-3 w-3 text-primary" />
                      <span>{t('upload.gifPremium', 'GIF available with Premium')}</span>
                    </div>
                  )}
                </>
              )}
            </Button>
          )}
          
          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              {t('upload.signInRequired', 'Sign in to upload files')}
            </p>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-3">
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          
          {value && accept.includes('image') && (
            <div className="relative">
              <img 
                src={value} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
