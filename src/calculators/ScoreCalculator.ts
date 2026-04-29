import {
    PackageAnalysisData,
    ScoreFactors,
    ScoreWeights,
    TrustScore,
    ScoreBreakdown,
} from '../core/types';

export class ScoreCalculator {
    private weights: Required<ScoreWeights>;

    // Default weights - can be customized
    private defaultWeights: Required<ScoreWeights> = {
        publicationFrequency: 15,
        packageAge: 10,
        maintainers: 15,
        versionHistory: 10,
        vulnerabilities: 25,
        dependencies: 10,
        abandonmentSignals: 10,
        packageQuality: 5,
    };

    constructor(customWeights?: ScoreWeights) {
        this.weights = { ...this.defaultWeights, ...customWeights };
        this.normalizeWeights();
    }

    /**
     * Normalize weights to sum to 100
     */
    private normalizeWeights(): void {
        const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
        const factor = 100 / sum;
        Object.keys(this.weights).forEach((key) => {
            this.weights[key as keyof ScoreWeights] *= factor;
        });
    }

    /**
     * Calculate trust score for a package
     */
    calculateScore(data: PackageAnalysisData): TrustScore {
        const factors = this.calculateFactors(data);
        const breakdown = this.createBreakdown(data, factors);
        const finalScore = this.computeFinalScore(factors);
        const confidence = this.calculateConfidence(data);

        return {
            package: data.metadata.name,
            version: data.metadata.version || 'unknown',
            score: Math.round(finalScore * 100) / 100,
            confidence: Math.round(confidence * 100) / 100,
            factors,
            breakdown,
            vulnerabilities: data.vulnerabilities,
            lastUpdated: new Date(),
        };
    }

    /**
     * Calculate individual factors
     */
    private calculateFactors(data: PackageAnalysisData): ScoreFactors {
        return {
            publicationFrequency: this.scorePublicationFrequency(data),
            packageAge: this.scorePackageAge(data),
            maintainers: this.scoreMaintainers(data),
            versionHistory: this.scoreVersionHistory(data),
            vulnerabilities: this.scoreVulnerabilities(data),
            dependencies: this.scoreDependencies(data),
            abandonmentSignals: this.scoreAbandonmentSignals(data),
            packageQuality: this.scorePackageQuality(data),
        };
    }

    /**
     * Score publication frequency
     * Higher score for packages that are actively maintained
     */
    private scorePublicationFrequency(data: PackageAnalysisData): number {
        const versionHistory = data.versionHistory;
        if (versionHistory.length === 0) return 0;

        // Calculate publication frequency (versions per year)
        const firstPublish = new Date(versionHistory[0].publishedAt);
        const lastPublish = new Date(versionHistory[versionHistory.length - 1].publishedAt);
        const yearsActive = Math.max(1, (lastPublish.getTime() - firstPublish.getTime()) / (365 * 24 * 60 * 60 * 1000));
        const versionsPerYear = versionHistory.length / yearsActive;

        // Score based on publication frequency
        if (versionsPerYear > 12) return 100; // 1+ per month = excellent
        if (versionsPerYear > 6) return 85; // ~bi-monthly
        if (versionsPerYear > 2) return 70; // ~quarterly
        if (versionsPerYear > 0.5) return 50; // ~bi-yearly
        return Math.max(0, (versionsPerYear / 0.5) * 50);
    }

    /**
     * Score package age (newer is better, but very new packages are risky)
     */
    private scorePackageAge(data: PackageAnalysisData): number {
        const publishedAt = data.metadata.publishedAt;
        if (!publishedAt) return 50; // Unknown = medium confidence

        const ageInYears = (Date.now() - publishedAt.getTime()) / (365 * 24 * 60 * 60 * 1000);

        // Ideal range: 1-5 years old
        if (ageInYears >= 1 && ageInYears <= 5) return 100;
        if (ageInYears > 5) return Math.max(70, 100 - (ageInYears - 5) * 3); // Decay for very old packages
        if (ageInYears < 1) return Math.min(50, ageInYears * 50); // New packages are risky

        return 50;
    }

    /**
     * Score based on number of maintainers
     */
    private scoreMaintainers(data: PackageAnalysisData): number {
        const maintainers = data.metadata.maintainers?.length || 0;

        if (maintainers >= 3) return 100;
        if (maintainers === 2) return 80;
        if (maintainers === 1) return 60;
        return 20; // No maintainers listed
    }

    /**
     * Score version history and stability
     */
    private scoreVersionHistory(data: PackageAnalysisData): number {
        const versionHistory = data.versionHistory;
        if (versionHistory.length === 0) return 0;

        // Packages with many versions show activity
        if (versionHistory.length > 100) return 100;
        if (versionHistory.length > 50) return 90;
        if (versionHistory.length > 20) return 80;
        if (versionHistory.length > 10) return 70;
        if (versionHistory.length > 5) return 60;
        if (versionHistory.length >= 1) return 40;
        return 0;
    }

    /**
     * Score vulnerabilities
     */
    private scoreVulnerabilities(data: PackageAnalysisData): number {
        const vulns = data.vulnerabilities;

        if (vulns.length === 0) return 100;

        let score = 100;
        for (const vuln of vulns) {
            switch (vuln.severity) {
                case 'critical':
                    score -= 40;
                    break;
                case 'high':
                    score -= 20;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 3;
                    break;
            }
        }

        return Math.max(0, score);
    }

    /**
     * Score dependency metrics
     * Simpler/flatter dependency trees are better
     */
    private scoreDependencies(data: PackageAnalysisData): number {
        const deps = data.dependencyMetrics;

        // Score based on dependency count
        if (deps.count === 0) return 100; // No dependencies = safest
        if (deps.count <= 5) return 90;
        if (deps.count <= 10) return 80;
        if (deps.count <= 20) return 70;
        if (deps.count <= 50) return 50;
        if (deps.count <= 100) return 30;
        return Math.max(10, 30 - (deps.count - 100) / 20);
    }

    /**
     * Detect signals of abandonment
     */
    private scoreAbandonmentSignals(data: PackageAnalysisData): number {
        const versionHistory = data.versionHistory;
        if (versionHistory.length === 0) return 0;

        const lastVersion = versionHistory[versionHistory.length - 1];
        const daysSinceLastRelease = (Date.now() - lastVersion.publishedAt.getTime()) / (24 * 60 * 60 * 1000);

        // No release in years = abandoned
        if (daysSinceLastRelease > 1095) return 10; // > 3 years
        if (daysSinceLastRelease > 730) return 30; // > 2 years
        if (daysSinceLastRelease > 365) return 50; // > 1 year
        if (daysSinceLastRelease > 180) return 70; // > 6 months
        return 100; // Recently active
    }

    /**
     * Score package.json quality
     */
    private scorePackageQuality(data: PackageAnalysisData): number {
        const metadata = data.metadata;
        let score = 0;

        // Check for essential fields
        if (metadata.description && metadata.description.length > 10) score += 20;
        if (metadata.homepage || (metadata.repository && metadata.repository.url)) score += 20;
        if (
            metadata.bugs &&
            typeof metadata.bugs === 'object' &&
            'url' in metadata.bugs &&
            metadata.bugs.url
        )
            score += 15;
        if (metadata.license) score += 15;
        if (metadata.keywords && metadata.keywords.length > 0) score += 15;
        if (metadata.author) score += 15;

        return Math.min(100, score);
    }

    /**
     * Compute final score using weighted average
     */
    private computeFinalScore(factors: ScoreFactors): number {
        const score =
            (factors.publicationFrequency * this.weights.publicationFrequency +
                factors.packageAge * this.weights.packageAge +
                factors.maintainers * this.weights.maintainers +
                factors.versionHistory * this.weights.versionHistory +
                factors.vulnerabilities * this.weights.vulnerabilities +
                factors.dependencies * this.weights.dependencies +
                factors.abandonmentSignals * this.weights.abandonmentSignals +
                factors.packageQuality * this.weights.packageQuality) /
            100;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate confidence level in the score (0-100)
     */
    private calculateConfidence(data: PackageAnalysisData): number {
        let confidence = 100;

        // Reduce confidence if missing critical data
        if (!data.metadata.publishedAt) confidence -= 10;
        if (!data.metadata.maintainers || data.metadata.maintainers.length === 0) confidence -= 15;
        if (data.versionHistory.length < 3) confidence -= 20;
        if (data.vulnerabilities.length === 0 && data.versionHistory.length > 0) confidence -= 5; // Might be outdated vulnerability data

        return Math.max(0, confidence);
    }

    /**
     * Create detailed breakdown
     */
    private createBreakdown(data: PackageAnalysisData, factors: ScoreFactors): ScoreBreakdown {
        return {
            publicationFrequency: {
                value: factors.publicationFrequency,
                weight: this.weights.publicationFrequency,
                explanation: this.explainPublicationFrequency(data),
            },
            packageAge: {
                value: factors.packageAge,
                weight: this.weights.packageAge,
                explanation: this.explainPackageAge(data),
            },
            maintainers: {
                value: factors.maintainers,
                weight: this.weights.maintainers,
                explanation: this.explainMaintainers(data),
            },
            versionHistory: {
                value: factors.versionHistory,
                weight: this.weights.versionHistory,
                explanation: this.explainVersionHistory(data),
            },
            vulnerabilities: {
                value: factors.vulnerabilities,
                weight: this.weights.vulnerabilities,
                explanation: this.explainVulnerabilities(data),
                vulnerabilities: data.vulnerabilities,
            },
            dependencies: {
                value: factors.dependencies,
                weight: this.weights.dependencies,
                explanation: this.explainDependencies(data),
            },
            abandonmentSignals: {
                value: factors.abandonmentSignals,
                weight: this.weights.abandonmentSignals,
                explanation: this.explainAbandonmentSignals(data),
            },
            packageQuality: {
                value: factors.packageQuality,
                weight: this.weights.packageQuality,
                explanation: this.explainPackageQuality(data),
            },
        };
    }

    private explainPublicationFrequency(data: PackageAnalysisData): string {
        const versionHistory = data.versionHistory;
        if (versionHistory.length === 0) return 'No publication history found.';

        const firstPublish = new Date(versionHistory[0].publishedAt);
        const lastPublish = new Date(versionHistory[versionHistory.length - 1].publishedAt);
        const yearsActive = (lastPublish.getTime() - firstPublish.getTime()) / (365 * 24 * 60 * 60 * 1000);
        const versionsPerYear = versionHistory.length / Math.max(1, yearsActive);

        return `${versionHistory.length} versions published over ${yearsActive.toFixed(1)} years (${versionsPerYear.toFixed(1)} per year).`;
    }

    private explainPackageAge(data: PackageAnalysisData): string {
        const publishedAt = data.metadata.publishedAt;
        if (!publishedAt) return 'Publication date unknown.';

        const ageInYears = (Date.now() - publishedAt.getTime()) / (365 * 24 * 60 * 60 * 1000);
        return `Package is ${ageInYears.toFixed(1)} years old (published ${publishedAt.toDateString()}).`;
    }

    private explainMaintainers(data: PackageAnalysisData): string {
        const count = data.metadata.maintainers?.length || 0;
        return `${count} maintainer${count !== 1 ? 's' : ''} listed.`;
    }

    private explainVersionHistory(data: PackageAnalysisData): string {
        const count = data.versionHistory.length;
        return `${count} version${count !== 1 ? 's' : ''} published.`;
    }

    private explainVulnerabilities(data: PackageAnalysisData): string {
        const vulns = data.vulnerabilities;
        if (vulns.length === 0) return 'No known vulnerabilities detected.';

        const bySeverity = vulns.reduce((acc, v) => {
            acc[v.severity] = (acc[v.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const parts = Object.entries(bySeverity).map(([sev, count]) => `${count} ${sev}`);
        return `${vulns.length} vulnerabilities found: ${parts.join(', ')}.`;
    }

    private explainDependencies(data: PackageAnalysisData): string {
        const count = data.dependencyMetrics.count;
        return `${count} direct dependencies (complexity: ${data.dependencyMetrics.complexity}).`;
    }

    private explainAbandonmentSignals(data: PackageAnalysisData): string {
        if (data.versionHistory.length === 0) return 'No release history available.';

        const lastVersion = data.versionHistory[data.versionHistory.length - 1];
        const daysSinceLastRelease = (Date.now() - lastVersion.publishedAt.getTime()) / (24 * 60 * 60 * 1000);

        if (daysSinceLastRelease > 365) {
            return `No release for ${Math.floor(daysSinceLastRelease / 365)} years. Possible abandonment.`;
        }
        return `Last release was ${Math.floor(daysSinceLastRelease)} days ago.`;
    }

    private explainPackageQuality(data: PackageAnalysisData): string {
        const metadata = data.metadata;
        const fields: string[] = [];

        if (metadata.description) fields.push('description');
        if (metadata.homepage) fields.push('homepage');
        if (metadata.license) fields.push('license');
        if (metadata.keywords) fields.push('keywords');

        return `Package.json completeness: ${fields.join(', ') || 'minimal'}.`;
    }

    /**
     * Get current weights
     */
    getWeights(): Readonly<Required<ScoreWeights>> {
        return Object.freeze({ ...this.weights });
    }

    /**
     * Get default weights
     */
    getDefaultWeights(): Readonly<Required<ScoreWeights>> {
        return Object.freeze({ ...this.defaultWeights });
    }
}
