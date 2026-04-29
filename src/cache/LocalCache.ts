import * as fs from 'fs';
import * as path from 'path';
import { CacheEntry } from '../core/types';

export class LocalCache {
    private cacheDir: string;
    private defaultTTL: number = 24 * 60 * 60 * 1000; // 24 hours

    constructor(cacheDir?: string) {
        this.cacheDir = cacheDir || this.getDefaultCacheDir();
        this.ensureCacheDirExists();
    }

    /**
     * Get default cache directory
     */
    private getDefaultCacheDir(): string {
        const home = process.env.HOME || process.env.USERPROFILE || '';
        return path.join(home, '.cache', 'dep-trust-score');
    }

    /**
     * Ensure cache directory exists
     */
    private ensureCacheDirExists(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Get cache file path for a package
     */
    private getCachePath(packageName: string): string {
        const safeName = packageName.replace(/\//g, '__').replace(/[^a-z0-9._-]/gi, '_');
        return path.join(this.cacheDir, `${safeName}.json`);
    }

    /**
     * Get value from cache
     */
    get<T>(key: string): T | null {
        try {
            const cachePath = this.getCachePath(key);
            if (!fs.existsSync(cachePath)) {
                return null;
            }

            const content = fs.readFileSync(cachePath, 'utf-8');
            const entry: CacheEntry<T> = JSON.parse(content);

            // Check if cache is expired
            if (Date.now() - entry.timestamp > entry.ttl) {
                fs.unlinkSync(cachePath);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.warn(`Failed to read cache for ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value in cache
     */
    set<T>(key: string, value: T, ttl?: number): void {
        try {
            const cachePath = this.getCachePath(key);
            const entry: CacheEntry<T> = {
                data: value,
                timestamp: Date.now(),
                ttl: ttl || this.defaultTTL,
            };

            fs.writeFileSync(cachePath, JSON.stringify(entry, null, 2));
        } catch (error) {
            console.warn(`Failed to write cache for ${key}:`, error);
        }
    }

    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean {
        try {
            const cachePath = this.getCachePath(key);
            if (!fs.existsSync(cachePath)) {
                return false;
            }

            const content = fs.readFileSync(cachePath, 'utf-8');
            const entry: CacheEntry<unknown> = JSON.parse(content);

            const isExpired = Date.now() - entry.timestamp > entry.ttl;
            if (isExpired) {
                fs.unlinkSync(cachePath);
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Remove specific cache entry
     */
    remove(key: string): void {
        try {
            const cachePath = this.getCachePath(key);
            if (fs.existsSync(cachePath)) {
                fs.unlinkSync(cachePath);
            }
        } catch (error) {
            console.warn(`Failed to remove cache for ${key}:`, error);
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        try {
            if (fs.existsSync(this.cacheDir)) {
                fs.rmSync(this.cacheDir, { recursive: true, force: true });
                this.ensureCacheDirExists();
            }
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): { cacheDir: string; fileCount: number; totalSize: number } {
        try {
            const files = fs.readdirSync(this.cacheDir);
            let totalSize = 0;

            for (const file of files) {
                const filepath = path.join(this.cacheDir, file);
                const stat = fs.statSync(filepath);
                totalSize += stat.size;
            }

            return {
                cacheDir: this.cacheDir,
                fileCount: files.length,
                totalSize,
            };
        } catch {
            return { cacheDir: this.cacheDir, fileCount: 0, totalSize: 0 };
        }
    }

    /**
     * Get cache directory path
     */
    getCacheDir(): string {
        return this.cacheDir;
    }
}
