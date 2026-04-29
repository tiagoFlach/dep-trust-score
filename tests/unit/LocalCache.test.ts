import { LocalCache } from '../../src/cache/LocalCache';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('LocalCache', () => {
    let cache: LocalCache;
    let tempDir: string;

    beforeEach(() => {
        // Create a temporary directory for cache
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));
        cache = new LocalCache(tempDir);
    });

    afterEach(() => {
        // Clean up
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    describe('Basic operations', () => {
        it('should set and get values', () => {
            const testData = { name: 'test-package', score: 85 };
            cache.set('test-key', testData);

            const retrieved = cache.get<typeof testData>('test-key');
            expect(retrieved).toEqual(testData);
        });

        it('should return null for non-existent keys', () => {
            const result = cache.get('non-existent');
            expect(result).toBeNull();
        });

        it('should check if key exists', () => {
            cache.set('exists', { data: 'test' });

            expect(cache.has('exists')).toBe(true);
            expect(cache.has('not-exists')).toBe(false);
        });

        it('should remove cached values', () => {
            cache.set('to-remove', { data: 'test' });
            expect(cache.has('to-remove')).toBe(true);

            cache.remove('to-remove');
            expect(cache.has('to-remove')).toBe(false);
        });
    });

    describe('TTL management', () => {
        it('should respect TTL', (done) => {
            const shortTTL = 100; // 100ms
            cache.set('short-lived', { data: 'test' }, shortTTL);

            expect(cache.get('short-lived')).toEqual({ data: 'test' });

            setTimeout(() => {
                expect(cache.get('short-lived')).toBeNull();
                done();
            }, 150);
        });

        it('should not expire valid entries', () => {
            const longTTL = 10000; // 10 seconds
            cache.set('long-lived', { data: 'test' }, longTTL);

            expect(cache.get('long-lived')).toEqual({ data: 'test' });

            // Wait a bit and check again
            setTimeout(() => {
                expect(cache.get('long-lived')).toEqual({ data: 'test' });
            }, 100);
        });
    });

    describe('Cache management', () => {
        it('should clear all cache', () => {
            cache.set('key1', { data: 1 });
            cache.set('key2', { data: 2 });

            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(true);

            cache.clear();

            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key2')).toBe(false);
        });

        it('should provide cache statistics', () => {
            cache.set('key1', { data: 1 });
            cache.set('key2', { data: 2 });

            const stats = cache.getStats();

            expect(stats.fileCount).toBe(2);
            expect(stats.totalSize).toBeGreaterThan(0);
            expect(stats.cacheDir).toBe(tempDir);
        });
    });

    describe('Package name sanitization', () => {
        it('should handle scoped packages', () => {
            const data = { score: 85 };
            cache.set('@scope/package-name', data);

            expect(cache.get('@scope/package-name')).toEqual(data);
        });

        it('should handle complex package names', () => {
            const data = { score: 90 };
            const complexName = 'package.with-special_chars@1.2.3';
            cache.set(complexName, data);

            expect(cache.get(complexName)).toEqual(data);
        });
    });

    describe('Error handling', () => {
        it('should handle corrupted cache files gracefully', () => {
            cache.set('valid', { data: 'test' });

            // Corrupt a cache file
            const files = fs.readdirSync(tempDir);
            if (files.length > 0) {
                const corruptFile = path.join(tempDir, files[0]);
                fs.writeFileSync(corruptFile, 'invalid json {{{');
            }

            // Should not throw
            const result = cache.get('valid');
            expect(result).toBeNull();
        });

        it('should handle missing cache directory gracefully', () => {
            const noPermDir = path.join(tempDir, 'no-perm');
            fs.mkdirSync(noPermDir);

            // This should work without throwing
            const cache2 = new LocalCache(noPermDir);
            expect(cache2).toBeDefined();
        });
    });

    describe('Complex data types', () => {
        it('should cache objects with nested structures', () => {
            const complexData = {
                package: 'test',
                score: 85,
                breakdown: {
                    vulnerabilities: {
                        value: 100,
                        weight: 25,
                        explanation: 'No vulnerabilities',
                        vulnerabilities: [],
                    },
                },
            };

            cache.set('complex', complexData);
            const retrieved = cache.get('complex');

            expect(retrieved).toEqual(complexData);
            expect(retrieved?.breakdown.vulnerabilities.value).toBe(100);
        });

        it('should cache arrays', () => {
            const arrayData = [
                { name: 'pkg1', score: 85 },
                { name: 'pkg2', score: 75 },
            ];

            cache.set('array-data', arrayData);
            const retrieved = cache.get<typeof arrayData>('array-data');

            expect(Array.isArray(retrieved)).toBe(true);
            expect(retrieved?.length).toBe(2);
        });
    });
});
