import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, FileText, Download, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/utils';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  onFileInfoChange?: (info: { fileName: string; fileSize: string }) => void;
  accept?: string;
  label?: string;
  placeholder?: string;
  maxSizeMB?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📽️',
    pptx: '📽️',
    zip: '📦',
    rar: '📦',
    mp3: '🎵',
    mp4: '🎬',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
  };
  return icons[ext || ''] || '📎';
};

export function FileUpload({
  value,
  onChange,
  onFileInfoChange,
  accept = '*/*',
  label,
  placeholder = 'https://example.com/file.pdf',
  maxSizeMB = 50
}: FileUploadProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>(value ? 'url' : 'upload');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!user) {
      toast.error(t('auth.required', 'Please sign in to upload files'));
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(t('upload.fileTooLarge', `File size must be less than ${maxSizeMB}MB`));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${Date.now()}-${safeFileName}`;
      const filePath = `${user.id}/files/${fileName}`;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      onFileInfoChange?.({
        fileName: file.name,
        fileSize: formatFileSize(file.size)
      });

      toast.success(t('upload.success', 'File uploaded successfully'));
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(t('upload.error', 'Failed to upload file'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user, maxSizeMB, onChange, onFileInfoChange, t]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  }, [handleFile]);

  const handleRemove = () => {
    onChange('');
    onFileInfoChange?.({ fileName: '', fileSize: '' });
  };

  const fileName = value ? (value.split('/').pop()?.split('-').slice(1).join('-') || value.split('/').pop() || '') : '';

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <HardDrive className="h-4 w-4" />
            {t('upload.platform', 'На платформу')}
          </TabsTrigger>
          <TabsTrigger value="url">{t('url.external', 'Внешняя ссылка')}</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />

          {value && !uploading ? (
            <div className="relative p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                  {getFileIcon(fileName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{t('upload.storedOnPlatform', 'Хранится на платформе')}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "relative border-2 border-dashed rounded-xl p-6 transition-all",
                dragActive ? "border-primary bg-primary/5" : "border-border",
                uploading && "pointer-events-none opacity-70"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="space-y-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('upload.uploading', 'Загрузка...')}</p>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-24 flex flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!user}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm">{t('upload.dragOrClick', 'Перетащите или нажмите')}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('upload.maxSize', `Максимум ${maxSizeMB}MB`)}
                  </span>
                </Button>
              )}
            </div>
          )}

          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              {t('upload.signInRequired', 'Войдите чтобы загружать файлы')}
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
          <p className="text-xs text-muted-foreground">
            {t('upload.externalNote', 'Файл будет загружаться напрямую по ссылке')}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
