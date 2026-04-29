import { DataCollector } from './collectors/DataCollector';
import { ScoreCalculator } from './calculators/ScoreCalculator';
import { LocalCache } from './cache/LocalCache';
import * as fs from 'fs';
import * as path from 'path';
import {
    TrustScore,
    TrustScoreOptions,
    BatchAnalysisResult,
    ScoreWeights,
} from './core/types';

export class TrustScoreAPI {
    private collector: DataCollector;
    private calculator: ScoreCalculator;
    private cache: LocalCache;
    private offlineMode: boolean = false;

    constructor(options?: TrustScoreOptions) {
        this.collector = new DataCollector();
        this.calculator = new ScoreCalculator(options?.weights);
        this.cache = new LocalCache(options?.cacheDir);
        this.offlineMode = options?.offline || false;
    }

    /**
     * Analyze a single package
     */
    async analyzePackage(packageName: string, forceRefresh: boolean = false): Promise<TrustScore> {
        // Try to get from cache first
        if (!forceRefresh && this.cache.has(packageName)) {
            return this.cache.get<TrustScore>(packageName)!;
        }

        // If offline mode, fail if not in cache
        if (this.offlineMode) {
            throw new Error(
                `Offline mode: package "${packageName}" not found in cache. Run in online mode to fetch fresh data.`
            );
        }

        // Fetch data and calculate score
        const analysisData = await this.collector.fetchPackageData(packageName);
        const score = this.calculator.calculateScore(analysisData);

        // Cache the result (24 hours by default)
        this.cache.set(packageName, score, 24 * 60 * 60 * 1000);

        return score;
    }

    /**
     * Analyze multiple packages
     */
    async analyzePackages(packageNames: string[], forceRefresh: boolean = false): Promise<BatchAnalysisResult> {
        const startTime = Date.now();
        const packages: TrustScore[] = [];
        const errors: { name: string; error: string }[] = [];

        for (const packageName of packageNames) {
            try {
                const score = await this.analyzePackage(packageName, forceRefresh);
                packages.push(score);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                errors.push({ name: packageName, error: errorMsg });
            }
        }

        if (errors.length > 0) {
            console.warn(`\nFailed to analyze ${errors.length} packages:`);
            errors.forEach((e) => console.warn(`  - ${e.name}: ${e.error}`));
        }

        const analysisTime = Date.now() - startTime;

        // Calculate summary statistics
        const averageScore =
            packages.length > 0 ? packages.reduce((sum, p) => sum + p.score, 0) / packages.length : 0;

        const criticalCount = packages.filter((p) => p.score < 30).length;
        const lowTrustCount = packages.filter((p) => p.score < 50).length;

        return {
            packages,
            summary: {
                totalPackages: packageNames.length,
                averageScore: Math.round(averageScore * 100) / 100,
                criticalCount,
                lowTrustCount,
                analysisTime,
            },
        };
    }

    /**
     * Update weights for score calculation
     */
    setWeights(weights: ScoreWeights): void {
        this.calculator = new ScoreCalculator(weights);
    }

    /**
     * Get current weights
     */
    getWeights() {
        return this.calculator.getWeights();
    }

    /**
     * Get default weights
     */
    getDefaultWeights() {
        return this.calculator.getDefaultWeights();
    }

    /**
     * Enable/disable offline mode
     */
    setOfflineMode(enabled: boolean): void {
        this.offlineMode = enabled;
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cached score for a package
     */
    getCachedScore(packageName: string): TrustScore | null {
        return this.cache.get<TrustScore>(packageName);
    }

    /**
     * Export cache contents
     */
    exportCacheData(): Map<string, TrustScore> {
        const stats = this.cache.getStats();
        const cacheDir = this.cache.getCacheDir();
        const result = new Map<string, TrustScore>();

        if (stats.fileCount === 0) {
            return result;
        }

        const files = fs.readdirSync(cacheDir);
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(cacheDir, file), 'utf-8');
                const entry = JSON.parse(content);
                const packageName = file.replace('.json', '').replace(/__/g, '/').replace(/_/g, ' ');
                result.set(packageName, entry.data);
            } catch {
                // Skip invalid cache files
            }
        }

        return result;
    }
}

// Export main class and types
export * from './core/types';
