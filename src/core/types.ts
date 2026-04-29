/**
 * Core types and interfaces for dep-trust-score
 */

export interface PackageMetadata {
    name: string;
    version: string;
    description?: string;
    homepage?: string;
    repository?: {
        type: string;
        url: string;
    };
    bugs?: {
        url: string;
    };
    license?: string;
    author?: string | { name: string; email: string; url: string };
    maintainers?: Array<{ name: string; email: string }>;
    keywords?: string[];
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    engines?: Record<string, string>;
    publishedAt?: Date;
    modifiedAt?: Date;
}

export interface VersionHistory {
    version: string;
    publishedAt: Date;
    maintainer: string;
}

export interface Vulnerability {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    fixedIn?: string[];
}

export interface DependencyMetrics {
    count: number;
    depth: number;
    complexity: number;
}

export interface ScoreFactors {
    publicationFrequency: number; // 0-100
    packageAge: number; // 0-100
    maintainers: number; // 0-100
    versionHistory: number; // 0-100
    vulnerabilities: number; // 0-100
    dependencies: number; // 0-100
    abandonmentSignals: number; // 0-100
    packageQuality: number; // 0-100
}

export interface ScoreWeights {
    publicationFrequency?: number;
    packageAge?: number;
    maintainers?: number;
    versionHistory?: number;
    vulnerabilities?: number;
    dependencies?: number;
    abandonmentSignals?: number;
    packageQuality?: number;
}

export interface TrustScore {
    package: string;
    version: string;
    score: number; // 0-100
    confidence: number; // 0-100, how confident we are in this score
    factors: ScoreFactors;
    breakdown: ScoreBreakdown;
    vulnerabilities: Vulnerability[];
    lastUpdated: Date;
}

export interface ScoreBreakdown {
    publicationFrequency: {
        value: number;
        weight: number;
        explanation: string;
    };
    packageAge: {
        value: number;
        weight: number;
        explanation: string;
    };
    maintainers: {
        value: number;
        weight: number;
        explanation: string;
    };
    versionHistory: {
        value: number;
        weight: number;
        explanation: string;
    };
    vulnerabilities: {
        value: number;
        weight: number;
        explanation: string;
        vulnerabilities: Vulnerability[];
    };
    dependencies: {
        value: number;
        weight: number;
        explanation: string;
    };
    abandonmentSignals: {
        value: number;
        weight: number;
        explanation: string;
    };
    packageQuality: {
        value: number;
        weight: number;
        explanation: string;
    };
}

export interface PackageAnalysisData {
    metadata: PackageMetadata;
    versionHistory: VersionHistory[];
    vulnerabilities: Vulnerability[];
    dependencyMetrics: DependencyMetrics;
    lastChecked: Date;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // time to live in milliseconds
}

export interface TrustScoreOptions {
    weights?: ScoreWeights;
    offline?: boolean;
    forceRefresh?: boolean;
    cacheDir?: string;
}

export interface BatchAnalysisResult {
    packages: TrustScore[];
    summary: {
        totalPackages: number;
        averageScore: number;
        criticalCount: number;
        lowTrustCount: number;
        analysisTime: number;
    };
}

export interface CLIOptions {
    output?: 'json' | 'text' | 'table';
    weights?: string; // JSON string
    offline?: boolean;
    cache?: string; // cache directory
    explain?: boolean;
    threshold?: number;
}
