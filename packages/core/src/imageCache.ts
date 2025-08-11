export interface CachedImage {
  img: HTMLImageElement;
  size: number;
}

export class ImageLRUCache {
  private cache = new Map<string, CachedImage>();
  private totalBytes = 0;
  constructor(private readonly maxBytes: number) {}

  /**
   * Loads an image and stores it in the cache.
   * @param src Image source URL.
   * @returns The loaded HTMLImageElement.
   */
  async load(src: string): Promise<HTMLImageElement> {
    const existing = this.cache.get(src);
    if (existing) {
      // Move to end to mark as recently used
      this.cache.delete(src);
      this.cache.set(src, existing);
      return existing.img;
    }
    const img = await this.loadImage(src);
    const size = img.naturalWidth * img.naturalHeight * 4;
    this.insert(src, { img, size });
    return img;
  }

  /**
   * Removes a specific image from the cache.
   * @param key Cache key (typically the image source URL).
   * @returns Whether the image existed and was removed.
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    this.cache.delete(key);
    this.totalBytes -= entry.size;
    return true;
  }

  /**
   * Clears all images from the cache and resets memory usage counter.
   */
  clear(): void {
    this.cache.clear();
    this.totalBytes = 0;
  }

  private insert(key: string, value: CachedImage) {
    // Evict until enough space
    while (this.totalBytes + value.size > this.maxBytes && this.cache.size > 0) {
      const oldestKey = this.cache.keys().next().value as string;
      const oldest = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.totalBytes -= oldest.size;
    }
    this.cache.set(key, value);
    this.totalBytes += value.size;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

export const globalImageCache = new ImageLRUCache(50 * 1024 * 1024);
