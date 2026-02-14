const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const DEFAULT_QUALITY = 0.85;

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = MAX_WIDTH,
    maxHeight = MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
    format = 'image/webp'
  } = options;

  // Skip compression for non-image files or GIFs (to preserve animation)
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  // Skip if file is already small (< 100KB)
  if (file.size < 100 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Determine file extension based on format
          const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
          const fileName = file.name.replace(/\.[^/.]+$/, `.${ext}`);

          const compressedFile = new File([blob], fileName, {
            type: format,
            lastModified: Date.now(),
          });

          console.log(
            `[Compression] ${file.name}: ${formatBytes(file.size)} → ${formatBytes(compressedFile.size)} (${Math.round((1 - compressedFile.size / file.size) * 100)}% saved)`
          );

          resolve(compressedFile);
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getCompressionStats(originalSize: number, compressedSize: number) {
  const saved = originalSize - compressedSize;
  const percentage = Math.round((saved / originalSize) * 100);
  return {
    originalSize: formatBytes(originalSize),
    compressedSize: formatBytes(compressedSize),
    saved: formatBytes(saved),
    percentage,
  };
}
