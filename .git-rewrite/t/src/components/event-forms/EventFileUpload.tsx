/**
 * EventFileUpload - File upload component for event registration forms
 * Pro-only feature with drag-drop, progress, and file preview
 */
import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, Loader2, FileText, File, Image as ImageIcon, Video, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EventFileUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;
  eventId?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  
  if (imageExts.includes(ext)) return ImageIcon;
  if (videoExts.includes(ext)) return Video;
  if (audioExts.includes(ext)) return Music;
  if (docExts.includes(ext)) return FileText;
  return File;
};

const getFileTypeLabel = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
  return ext;
};

export function EventFileUpload({
  value,
  onChange,
  label,
  helpText,
  required = false,
  disabled = false,
  accept = '*/*',
  maxSizeMB = 10,
  eventId,
}: EventFileUploadProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (disabled) return;
    
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(t('upload.fileTooLarge', `Файл должен быть меньше ${maxSizeMB}MB`));
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const userId = user?.id || 'anonymous';
      const folder = eventId ? `event-uploads/${eventId}` : 'event-uploads/general';
      const filePath = `${folder}/${userId}/${timestamp}-${safeName}`;

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 85));
      }, 150);

      const { error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success(t('upload.success', 'Файл загружен'));

    } catch (error: unknown) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('upload.error', 'Ошибка загрузки') + `: ${message}`);
      setFileName('');
      setFileSize(0);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [disabled, maxSizeMB, user?.id, eventId, onChange, t]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  }, [handleFile, disabled]);

  const handleRemove = () => {
    onChange('');
    setFileName('');
    setFileSize(0);
  };

  // Extract filename from URL if we have a value but no fileName state
  const displayFileName = fileName || (value ? value.split('/').pop()?.split('-').slice(1).join('-') || 'file' : '');
  const FileIcon = value ? getFileIcon(displayFileName) : Upload;

  return (
    <div className="space-y-1.5">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value && !uploading ? (
        // File preview
        <div className="relative rounded-xl border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayFileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{getFileTypeLabel(displayFileName)}</span>
                {fileSize > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(fileSize)}</span>
                  </>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // Upload dropzone
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer",
            dragActive ? "border-primary bg-primary/5" : "border-border/60 hover:border-border",
            uploading && "pointer-events-none opacity-70",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="space-y-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('upload.uploading', 'Загрузка...')}</p>
                <Progress value={uploadProgress} className="h-1.5 max-w-[200px] mx-auto" />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {t('upload.dragOrClick', 'Перетащите или нажмите')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('upload.maxSize', `Максимум ${maxSizeMB}MB`)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
