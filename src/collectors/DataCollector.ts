import axios from 'axios';
import {
    PackageMetadata,
    VersionHistory,
    Vulnerability,
    DependencyMetrics,
    PackageAnalysisData,
} from '../core/types';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';

interface NpmPackageResponse {
    _id: string;
    name: string;
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
    'dist-tags': Record<string, string>;
    versions: Record<string, NpmVersion>;
    time: Record<string, string>;
    modified: string;
}

interface NpmVersion {
    name: string;
    version: string;
    description?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    engines?: Record<string, string>;
}

export class DataCollector {
    private registryUrl: string;
    private requestTimeout: number = 10000;

    constructor(registryUrl: string = NPM_REGISTRY_URL) {
        this.registryUrl = registryUrl;
    }

    /**
     * Fetch package data from npm registry
     */
    async fetchPackageData(packageName: string): Promise<PackageAnalysisData> {
        try {
            const response = await axios.get<NpmPackageResponse>(
                `${this.registryUrl}/${encodeURIComponent(packageName)}`,
                { timeout: this.requestTimeout }
            );

            const data = response.data;
            const latestVersion = data['dist-tags']?.latest || Object.keys(data.versions).pop() || 'unknown';

            const metadata: PackageMetadata = {
                name: data.name,
                version: latestVersion,
                description: data.description,
                homepage: data.homepage,
                repository: data.repository,
                bugs: data.bugs,
                license: data.license,
                author: data.author,
                maintainers: data.maintainers,
                keywords: data.keywords,
                publishedAt: data.time ? new Date(data.time[latestVersion]) : undefined,
                modifiedAt: new Date(data.modified),
            };

            const versionHistory = this.extractVersionHistory(data);
            const vulnerabilities = await this.fetchVulnerabilities(packageName);
            const dependencyMetrics = this.calculateDependencyMetrics(data.versions[latestVersion]);

            return {
                metadata,
                versionHistory,
                vulnerabilities,
                dependencyMetrics,
                lastChecked: new Date(),
            };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw new Error(`Package "${packageName}" not found in npm registry`);
            }
            throw new Error(`Failed to fetch package data: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Extract version history from npm response
     */
    private extractVersionHistory(data: NpmPackageResponse): VersionHistory[] {
        const history: VersionHistory[] = [];
        const time = data.time || {};
        const versions = Object.keys(data.versions).sort();

        // Get last 50 versions
        const recentVersions = versions.slice(Math.max(0, versions.length - 50));

        for (const version of recentVersions) {
            const publishedAtStr = time[version];
            if (publishedAtStr) {
                const versionData = data.versions[version];
                const maintainer = typeof versionData === 'object' && '_npmUser' in versionData
                    ? (versionData as any)._npmUser?.name || 'unknown'
                    : 'unknown';

                history.push({
                    version,
                    publishedAt: new Date(publishedAtStr),
                    maintainer,
                });
            }
        }

        return history;
    }

    /**
     * Calculate dependency metrics for a version
     */
    private calculateDependencyMetrics(version: NpmVersion | undefined): DependencyMetrics {
        if (!version) {
            return { count: 0, depth: 1, complexity: 0 };
        }

        const dependencies = version.dependencies || {};
        const devDependencies = version.devDependencies || {};

        const totalCount = Object.keys(dependencies).length + Object.keys(devDependencies).length;

        // Simple complexity score based on number of dependencies
        // In a real scenario, we'd recursively calculate tree depth
        const complexity = Math.min(100, totalCount * 5);

        return {
            count: totalCount,
            depth: 1, // Would need recursive calculation for real depth
            complexity,
        };
    }

    /**
     * Fetch vulnerability data (simplified - in production would use OSV or Snyk API)
     */
    private async fetchVulnerabilities(packageName: string): Promise<Vulnerability[]> {
        try {
            // This is a simplified implementation
            // In production, you'd integrate with:
            // - GitHub Advisory Database
            // - npm audit API
            // - Snyk API
            // - OSV database

            // For now, return empty array as placeholder
            // The actual implementation would call a vulnerability API
            return [];
        } catch (error) {
            console.warn(`Failed to fetch vulnerabilities for ${packageName}:`, this.getErrorMessage(error));
            return [];
        }
    }

    /**
     * Fetch multiple packages
     */
    async fetchMultiplePackages(packageNames: string[]): Promise<Map<string, PackageAnalysisData>> {
        const results = new Map<string, PackageAnalysisData>();
        const errors: { name: string; error: string }[] = [];

        for (const packageName of packageNames) {
            try {
                const data = await this.fetchPackageData(packageName);
                results.set(packageName, data);
            } catch (error) {
                errors.push({
                    name: packageName,
                    error: this.getErrorMessage(error),
                });
            }
        }

        if (errors.length > 0) {
            console.warn(`Failed to fetch ${errors.length} packages:`, errors);
        }

        return results;
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
