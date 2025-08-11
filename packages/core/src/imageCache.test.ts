import { describe, it, expect } from 'vitest';
import { ImageLRUCache } from './imageCache';

describe('ImageLRUCache', () => {
  it('clear removes all items and resets totalBytes', () => {
    const cache = new ImageLRUCache(100);
    (cache as any).cache.set('a', { img: {} as any, size: 10 });
    (cache as any).cache.set('b', { img: {} as any, size: 20 });
    (cache as any).totalBytes = 30;
    cache.clear();
    expect((cache as any).cache.size).toBe(0);
    expect((cache as any).totalBytes).toBe(0);
  });

  it('delete removes item and updates totalBytes', () => {
    const cache = new ImageLRUCache(100);
    (cache as any).cache.set('a', { img: {} as any, size: 10 });
    (cache as any).totalBytes = 10;
    expect(cache.delete('a')).toBe(true);
    expect((cache as any).cache.size).toBe(0);
    expect((cache as any).totalBytes).toBe(0);
  });
});
