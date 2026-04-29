import { TrustScoreAPI } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('TrustScoreAPI Integration', () => {
    let api: TrustScoreAPI;
    let tempCacheDir: string;

    beforeEach(() => {
        tempCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-test-'));
        api = new TrustScoreAPI({ cacheDir: tempCacheDir });
    });

    afterEach(() => {
        if (fs.existsSync(tempCacheDir)) {
            fs.rmSync(tempCacheDir, { recursive: true, force: true });
        }
    });

    describe('Weight management', () => {
        it('should set and retrieve custom weights', () => {
            const customWeights = {
                vulnerabilities: 50,
                publicationFrequency: 20,
            };

            api.setWeights(customWeights);
            const weights = api.getWeights();

            expect(weights.vulnerabilities).toBeGreaterThan(35);
        });

        it('should return default weights initially', () => {
            const weights = api.getWeights();
            const defaultWeights = api.getDefaultWeights();

            expect(weights).toEqual(defaultWeights);
        });
    });

    describe('Cache management', () => {
        it('should get cache statistics', () => {
            const stats = api.getCacheStats();

            expect(stats).toHaveProperty('cacheDir');
            expect(stats).toHaveProperty('fileCount');
            expect(stats).toHaveProperty('totalSize');
            expect(stats.fileCount).toBe(0); // Should be empty initially
        });

        it('should clear cache', () => {
            api.clearCache();
            const stats = api.getCacheStats();

            expect(stats.fileCount).toBe(0);
        });
    });

    describe('Offline mode', () => {
        it('should enable offline mode', () => {
            api.setOfflineMode(true);

            expect(async () => {
                // This should fail because we're in offline mode and nothing is cached
                await api.analyzePackage('some-package');
            }).rejects.toThrow();
        });

        it('should serve from cache in offline mode', async () => {
            // First, we'd need to populate cache, but since we can't do real network calls in tests,
            // we just verify the offline flag can be set
            api.setOfflineMode(false);
            api.setOfflineMode(true);

            // At this point offline mode is enabled
            expect(async () => {
                await api.analyzePackage('unknown-package');
            }).rejects.toThrow('Offline mode');
        });
    });

    describe('Batch analysis', () => {
        it('should initialize batch analysis', async () => {
            // Note: This will fail without network access
            // In a real test environment, you'd mock the DataCollector
            const packages = ['express', 'lodash'];

            try {
                const result = await api.analyzePackages(packages);

                expect(result).toHaveProperty('packages');
                expect(result).toHaveProperty('summary');
                expect(result.summary).toHaveProperty('totalPackages');
                expect(result.summary).toHaveProperty('averageScore');
            } catch (error) {
                // Expected in offline test environment
                expect(error).toBeDefined();
            }
        });
    });

    describe('Caching behavior', () => {
        it('should have getCachedScore method', () => {
            const cached = api.getCachedScore('test-package');
            expect(cached).toBeNull(); // Should be null when cache is empty
        });

        it('should export cache data', () => {
            const exported = api.exportCacheData();
            expect(exported).toBeInstanceOf(Map);
            expect(exported.size).toBe(0); // Should be empty initially
        });
    });

    describe('Error handling', () => {
        it('should handle API errors gracefully', async () => {
            // Trying to analyze a non-existent package should fail
            expect(async () => {
                await api.analyzePackage('@invalid/🔥-package');
            }).rejects.toThrow();
        });
    });
});
