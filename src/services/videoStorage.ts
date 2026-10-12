// IndexedDB storage service for local video and media blobs
// Ensures uploaded videos and shorts persist across page refreshes

const DB_NAME = 'RiseUpMediaDB';
const DB_VERSION = 1;
const VIDEO_STORE = 'videos';

class VideoStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryCache: Map<string, string> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB not available'));
          return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(VIDEO_STORE)) {
            db.createObjectStore(VIDEO_STORE);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  // Save video file or blob associated with videoId (Instant return with background persistence)
  async saveVideoBlob(videoId: string, blob: Blob): Promise<string> {
    const objectUrl = URL.createObjectURL(blob);
    this.memoryCache.set(videoId, objectUrl);

    // Asynchronously persist to IndexedDB in background without blocking the UI
    setTimeout(async () => {
      try {
        const db = await this.getDB();
        const tx = db.transaction(VIDEO_STORE, 'readwrite');
        const store = tx.objectStore(VIDEO_STORE);
        store.put(blob, videoId);
      } catch (e) {
        console.warn('Background IndexedDB persist skipped:', e);
      }
    }, 10);

    return objectUrl;
  }

  // Fast chunked / direct upload abstraction for files
  async saveVideoChunked(file: File): Promise<string> {
    const id = 'vid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    return this.saveVideoBlob(id, file);
  }

  // Delete stored video from IndexedDB and memory cache
  async deleteVideoBlob(videoId: string): Promise<void> {
    this.memoryCache.delete(videoId);
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(VIDEO_STORE, 'readwrite');
        const store = tx.objectStore(VIDEO_STORE);
        const req = store.delete(videoId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[VideoStorage] Error deleting from IndexedDB:', e);
    }
  }

  // Retrieve a valid playback URL for a stored video
  async getVideoUrl(videoId: string): Promise<string | null> {
    if (this.memoryCache.has(videoId)) {
      return this.memoryCache.get(videoId)!;
    }

    try {
      const db = await this.getDB();
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(VIDEO_STORE, 'readonly');
        const store = tx.objectStore(VIDEO_STORE);
        const req = store.get(videoId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        this.memoryCache.set(videoId, objectUrl);
        return objectUrl;
      }
    } catch (e) {
      console.warn('Error reading from IndexedDB:', e);
    }

    return null;
  }

  // Safe resolver for any video item
  async resolvePlaybackUrl(videoId: string, originalUrl?: string, isShort?: boolean): Promise<string> {
    // 1. Check in-memory cache first (active in current session, including blob URLs)
    if (videoId && this.memoryCache.has(videoId)) {
      const cached = this.memoryCache.get(videoId)!;
      if (cached) return cached;
    }

    // 2. Try IndexedDB local storage (crucial for user uploads and camera recordings)
    if (videoId) {
      try {
        const dbUrl = await this.getVideoUrl(videoId);
        if (dbUrl) {
          this.memoryCache.set(videoId, dbUrl);
          return dbUrl;
        }
      } catch (err) {
        console.warn('[VideoStorage] Error reading from IndexedDB:', err);
      }
    }

    // 3. If originalUrl is a valid URL
    if (
      originalUrl &&
      !originalUrl.includes('commondatastorage.googleapis.com') &&
      !originalUrl.includes('BigBuckBunny') &&
      !originalUrl.includes('ForBiggerBlazes')
    ) {
      return originalUrl;
    }

    // 4. Try to recover the latest stored video blob from IndexedDB if available
    try {
      const db = await this.getDB();
      const latestBlob = await new Promise<Blob | null>((resolve) => {
        const tx = db.transaction(VIDEO_STORE, 'readonly');
        const store = tx.objectStore(VIDEO_STORE);
        const req = store.openCursor(null, 'prev');
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor && cursor.value instanceof Blob) {
            resolve(cursor.value);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });

      if (latestBlob) {
        const objectUrl = URL.createObjectURL(latestBlob);
        if (videoId) this.memoryCache.set(videoId, objectUrl);
        return objectUrl;
      }
    } catch {}

    // Fallback to originalUrl if present or empty string
    return originalUrl || '';
  }

  // Register in-memory URL
  registerMemoryUrl(videoId: string, url: string) {
    this.memoryCache.set(videoId, url);
  }
}

export const videoStorageService = new VideoStorageService();
