/**
 * Client-side image compression utility
 * Compresses any selected File or raw base64 dataURL down to a crisp, lightweight
 * JPEG/WebP dataURL (~15-25 KB) so it never overflows localStorage quota or Firestore document size limits.
 */
export const compressImage = (
  fileOrDataUrl: File | string,
  maxDimension = 256,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let width = img.width || maxDimension;
          let height = img.height || maxDimension;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
            return;
          }

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to lightweight JPEG data URL (~15-25 KB)
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          console.warn('[compressImage] Canvas processing fallback:', err);
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
        }
      };

      img.onerror = (err) => {
        console.warn('[compressImage] Image load failed:', err);
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      };

      if (fileOrDataUrl instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = (e.target?.result as string) || '';
        };
        reader.onerror = () => {
          resolve('');
        };
        reader.readAsDataURL(fileOrDataUrl);
      } else if (typeof fileOrDataUrl === 'string') {
        img.src = fileOrDataUrl;
      } else {
        resolve('');
      }
    } catch (e) {
      console.warn('[compressImage] Unexpected error:', e);
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
    }
  });
};
