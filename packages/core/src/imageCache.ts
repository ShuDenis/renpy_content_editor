export interface CachedImage {
  img: HTMLImageElement;
  size: number;
}

export class ImageLRUCache {
  private cache = new Map<string, CachedImage>();
  private totalBytes = 0;
  constructor(private readonly maxBytes: number) {}

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
