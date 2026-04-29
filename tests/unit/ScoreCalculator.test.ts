import { ScoreCalculator } from '../../src/calculators/ScoreCalculator';
import { PackageAnalysisData, VersionHistory } from '../../src/core/types';

describe('ScoreCalculator', () => {
    let calculator: ScoreCalculator;

    beforeEach(() => {
        calculator = new ScoreCalculator();
    });

    describe('Weight management', () => {
        it('should return default weights', () => {
            const weights = calculator.getDefaultWeights();
            expect(weights.vulnerabilities).toBe(25);
            expect(weights.publicationFrequency).toBe(15);
        });

        it('should allow custom weights', () => {
            const custom = new ScoreCalculator({
                vulnerabilities: 50,
                publicationFrequency: 10,
            });
            const weights = custom.getWeights();
            expect(weights.vulnerabilities).toBeGreaterThan(40); // Normalized
        });

        it('should normalize weights to sum to 100', () => {
            const custom = new ScoreCalculator({
                vulnerabilities: 50,
                publicationFrequency: 50,
            });
            const weights = custom.getWeights();
            const sum = Object.values(weights).reduce((a, b) => a + b, 0);
            expect(Math.abs(sum - 100)).toBeLessThan(0.01);
        });
    });

    describe('Score calculation', () => {
        it('should calculate score for a healthy package', () => {
            const data = createMockPackageData({
                versionCount: 50,
                maintainers: 3,
                daysSinceLastRelease: 30,
                vulnerabilities: 0,
                dependencies: 5,
            });

            const score = calculator.calculateScore(data);

            expect(score.score).toBeGreaterThan(70);
            expect(score.confidence).toBeGreaterThan(80);
        });

        it('should detect abandoned packages', () => {
            const data = createMockPackageData({
                versionCount: 10,
                maintainers: 1,
                daysSinceLastRelease: 1000, // 2.7+ years
                vulnerabilities: 0,
                dependencies: 10,
            });

            const score = calculator.calculateScore(data);

            expect(score.breakdown.abandonmentSignals.value).toBeLessThan(30);
            expect(score.score).toBeLessThan(60);
        });

        it('should penalize critical vulnerabilities', () => {
            const data = createMockPackageData({
                versionCount: 50,
                maintainers: 3,
                daysSinceLastRelease: 30,
                vulnerabilities: 1, // 1 critical
                vulnerabilitySeverity: 'critical',
                dependencies: 5,
            });

            const score = calculator.calculateScore(data);

            expect(score.breakdown.vulnerabilities.value).toBeLessThan(70);
            expect(score.score).toBeLessThan(70);
        });

        it('should favor packages with few dependencies', () => {
            const dataFewDeps = createMockPackageData({
                versionCount: 50,
                maintainers: 3,
                daysSinceLastRelease: 30,
                vulnerabilities: 0,
                dependencies: 2,
            });

            const dataManyDeps = createMockPackageData({
                versionCount: 50,
                maintainers: 3,
                daysSinceLastRelease: 30,
                vulnerabilities: 0,
                dependencies: 50,
            });

            const scoreFew = calculator.calculateScore(dataFewDeps);
            const scoreMany = calculator.calculateScore(dataManyDeps);

            expect(scoreFew.breakdown.dependencies.value).toBeGreaterThan(scoreMany.breakdown.dependencies.value);
        });

        it('should return valid score between 0 and 100', () => {
            const data = createMockPackageData();
            const score = calculator.calculateScore(data);

            expect(score.score).toBeGreaterThanOrEqual(0);
            expect(score.score).toBeLessThanOrEqual(100);
        });
    });

    describe('Factor scoring', () => {
        it('should score publication frequency', () => {
            const recentlyUpdated = createMockPackageData({
                versionCount: 50,
                daysSinceLastRelease: 7,
            });

            const oldPackage = createMockPackageData({
                versionCount: 5,
                daysSinceLastRelease: 1000,
            });

            const scoreRecent = calculator.calculateScore(recentlyUpdated);
            const scoreOld = calculator.calculateScore(oldPackage);

            expect(scoreRecent.breakdown.publicationFrequency.value).toBeGreaterThan(
                scoreOld.breakdown.publicationFrequency.value
            );
        });

        it('should score package age appropriately', () => {
            const data = createMockPackageData();
            const score = calculator.calculateScore(data);

            expect(score.breakdown.packageAge.value).toBeGreaterThan(0);
            expect(score.breakdown.packageAge.value).toBeLessThanOrEqual(100);
        });

        it('should score maintainers', () => {
            const manyMaintainers = createMockPackageData({ maintainers: 5 });
            const fewMaintainers = createMockPackageData({ maintainers: 1 });
            const noMaintainers = createMockPackageData({ maintainers: 0 });

            const sceneMany = calculator.calculateScore(manyMaintainers);
            const sceneFew = calculator.calculateScore(fewMaintainers);
            const scoreNone = calculator.calculateScore(noMaintainers);

            expect(sceneMany.breakdown.maintainers.value).toBeGreaterThan(sceneFew.breakdown.maintainers.value);
            expect(sceneFew.breakdown.maintainers.value).toBeGreaterThan(scoreNone.breakdown.maintainers.value);
        });
    });
});

// Helper function to create mock package data
function createMockPackageData(overrides?: Partial<{
    versionCount: number;
    maintainers: number;
    daysSinceLastRelease: number;
    vulnerabilities: number;
    vulnerabilitySeverity: 'critical' | 'high' | 'medium' | 'low';
    dependencies: number;
}>): PackageAnalysisData {
    const now = new Date();
    const daysSinceLastRelease = overrides?.daysSinceLastRelease || 30;
    const versionCount = overrides?.versionCount || 20;
    const maintainerCount = overrides?.maintainers ?? 2;
    const vulnerabilityCount = overrides?.vulnerabilities || 0;
    const dependencyCount = overrides?.dependencies || 5;

    const versionHistory: VersionHistory[] = [];
    for (let i = 0; i < versionCount; i++) {
        const daysAgo = Math.floor(daysSinceLastRelease + (i * 30));
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        versionHistory.push({
            version: `1.${i}.0`,
            publishedAt: date,
            maintainer: 'test-maintainer',
        });
    }

    const vulnerabilities = [];
    for (let i = 0; i < vulnerabilityCount; i++) {
        vulnerabilities.push({
            id: `CVE-2024-${String(i).padStart(5, '0')}`,
            severity: overrides?.vulnerabilitySeverity || 'high',
            description: `Test vulnerability ${i}`,
        });
    }

    return {
        metadata: {
            name: 'test-package',
            version: '1.0.0',
            description: 'Test package',
            homepage: 'https://example.com',
            license: 'MIT',
            maintainers: Array(maintainerCount)
                .fill(null)
                .map((_, i) => ({ name: `maintainer-${i}`, email: `m${i}@example.com` })),
            publishedAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        },
        versionHistory,
        vulnerabilities,
        dependencyMetrics: {
            count: dependencyCount,
            depth: 1,
            complexity: dependencyCount * 5,
        },
        lastChecked: now,
    };
}
