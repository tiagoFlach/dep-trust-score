# API Reference

Complete API documentation for `dep-trust-score`.

## Main Exports

```typescript
export class TrustScoreAPI { ... }
export * from './core/types'
```

## TrustScoreAPI

Main class for programmatic access to trust score analysis.

### Constructor

```typescript
constructor(options?: TrustScoreOptions)
```

**Parameters:**
```typescript
interface TrustScoreOptions {
  weights?: ScoreWeights;        // Custom weight configuration
  offline?: boolean;              // Start in offline mode (default: false)
  forceRefresh?: boolean;          // Always fetch fresh data (default: false)
  cacheDir?: string;               // Custom cache directory
}
```

**Example:**
```typescript
const api = new TrustScoreAPI({
  weights: { vulnerabilities: 40 },
  offline: false,
  cacheDir: '/tmp/trust-score-cache'
});
```

### Methods

#### `analyzePackage(packageName: string, forceRefresh?: boolean): Promise<TrustScore>`

Analyze a single package for trustworthiness.

**Parameters:**
- `packageName` (string): Name of the npm package (e.g., "express", "@babel/core")
- `forceRefresh` (boolean, optional): Skip cache and fetch fresh data from npm registry

**Returns:**
- Promise resolving to a `TrustScore` object

**Throws:**
- Error if package not found or network failure
- Error in offline mode if package not in cache

**Example:**
```typescript
try {
  const score = await api.analyzePackage('express');
  console.log(`Score: ${score.score}/100`);
  console.log(`Confidence: ${score.confidence}%`);
} catch (error) {
  console.error('Analysis failed:', error.message);
}
```

#### `analyzePackages(packageNames: string[], forceRefresh?: boolean): Promise<BatchAnalysisResult>`

Analyze multiple packages efficiently in a single batch operation.

**Parameters:**
- `packageNames` (string[]): Array of package names
- `forceRefresh` (boolean, optional): Skip cache for all packages

**Returns:**
- Promise resolving to `BatchAnalysisResult` with array of scores and summary statistics

**Note:** Failed packages are included in results with error information, batch doesn't throw on individual failures

**Example:**
```typescript
const result = await api.analyzePackages(['express', 'lodash', 'react']);

console.log(`Analyzed: ${result.summary.totalPackages} packages`);
console.log(`Average score: ${result.summary.averageScore}/100`);
console.log(`Time: ${result.summary.analysisTime}ms`);

result.packages.forEach(pkg => {
  console.log(`${pkg.package}: ${pkg.score}/100`);
});
```

#### `setWeights(weights: ScoreWeights): void`

Update the scoring weights for subsequent analyses.

**Parameters:**
- `weights` (ScoreWeights): Partial or complete weight configuration

**Note:**
- Weights are automatically normalized to sum to 100
- Only specified weights are updated; others retain their previous values
- Applies to all future calls until changed again

**Example:**
```typescript
api.setWeights({
  vulnerabilities: 40,
  publicationFrequency: 15,
});

const score = await api.analyzePackage('express');  // Uses new weights
```

#### `getWeights(): Readonly<Required<ScoreWeights>>`

Get the current scoring weights.

**Returns:**
- Object containing all current weights (normalized to sum to 100)

**Example:**
```typescript
const weights = api.getWeights();
console.log(JSON.stringify(weights, null, 2));
```

#### `getDefaultWeights(): Readonly<Required<ScoreWeights>>`

Get the default weights (unchanged by user customization).

**Returns:**
- Object containing default weights

**Example:**
```typescript
const defaults = api.getDefaultWeights();
api.setWeights(defaults);  // Reset to defaults
```

#### `setOfflineMode(enabled: boolean): void`

Enable or disable offline mode.

**Parameters:**
- `enabled` (boolean): true to enable offline mode, false to disable

**Note:**
- Offline mode only serves cached results
- Fails with error if requested package not in cache
- Useful for air-gapped environments or reducing network calls

**Example:**
```typescript
// Populate cache first
await api.analyzePackage('express');

// Now enable offline mode
api.setOfflineMode(true);

// This works (from cache)
const score = await api.analyzePackage('express');

// This fails (not in cache)
try {
  await api.analyzePackage('unknown-package');
} catch (error) {
  console.log('Offline: not in cache');
}
```

#### `getCacheStats(): { cacheDir: string; fileCount: number; totalSize: number }`

Get statistics about the local cache.

**Returns:**
```typescript
{
  cacheDir: string;           // Path to cache directory
  fileCount: number;          // Number of cached packages
  totalSize: number;          // Total cache size in bytes
}
```

**Example:**
```typescript
const stats = api.getCacheStats();
console.log(`Cache: ${stats.fileCount} packages, ${(stats.totalSize / 1024).toFixed(2)} KB`);
console.log(`Location: ${stats.cacheDir}`);
```

#### `clearCache(): void`

Clear all cached data.

**Note:**
- Deletes all cached package scores
- Cannot be undone
- Offline mode will fail after clearing cache

**Example:**
```typescript
api.clearCache();
console.log('Cache cleared');
```

#### `getCachedScore(packageName: string): TrustScore | null`

Get a previously cached score without network calls.

**Parameters:**
- `packageName` (string): Name of the package

**Returns:**
- TrustScore if cached and not expired, null otherwise

**Example:**
```typescript
const cached = api.getCachedScore('express');
if (cached) {
  console.log(`Cached score: ${cached.score}/100`);
} else {
  console.log('Not in cache or expired');
}
```

#### `exportCacheData(): Map<string, TrustScore>`

Export all cached scores as a Map.

**Returns:**
- Map where keys are package names and values are TrustScore objects

**Example:**
```typescript
const cached = api.exportCacheData();
console.log(`${cached.size} packages in cache`);

cached.forEach((score, packageName) => {
  console.log(`${packageName}: ${score.score}/100`);
});
```

## Types

### TrustScore

Main result object from analysis.

```typescript
interface TrustScore {
  package: string;                    // Package name
  version: string;                    // Latest version
  score: number;                      // 0-100 trust score
  confidence: number;                 // 0-100 confidence in score
  factors: ScoreFactors;              // Individual factor scores
  breakdown: ScoreBreakdown;          // Detailed explanations
  vulnerabilities: Vulnerability[];   // Known CVEs
  lastUpdated: Date;                  // When analysis was done
}
```

### ScoreFactors

Individual factor scores (0-100 each).

```typescript
interface ScoreFactors {
  publicationFrequency: number;    // How actively maintained
  packageAge: number;               // Age of the package
  maintainers: number;              // Number of maintainers
  versionHistory: number;           // How many versions released
  vulnerabilities: number;          // Security record
  dependencies: number;             // Dependency complexity
  abandonmentSignals: number;       // Signs of neglect
  packageQuality: number;           // Metadata completeness
}
```

### ScoreBreakdown

Detailed explanation of each factor.

```typescript
interface ScoreBreakdown {
  publicationFrequency: {
    value: number;                  // 0-100 score
    weight: number;                 // Configured weight
    explanation: string;            // Human-readable explanation
  };
  packageAge: { ... };
  maintainers: { ... };
  versionHistory: { ... };
  vulnerabilities: {
    value: number;
    weight: number;
    explanation: string;
    vulnerabilities: Vulnerability[];  // Actual CVEs
  };
  dependencies: { ... };
  abandonmentSignals: { ... };
  packageQuality: { ... };
}
```

### Vulnerability

Represents a known security issue.

```typescript
interface Vulnerability {
  id: string;                    // CVE ID or identifier
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;           // Vulnerability description
  fixedIn?: string[];            // Versions with fix
}
```

### ScoreWeights

Configuration for score calculation weights.

```typescript
interface ScoreWeights {
  publicationFrequency?: number;  // Default: 15
  packageAge?: number;             // Default: 10
  maintainers?: number;            // Default: 15
  versionHistory?: number;         // Default: 10
  vulnerabilities?: number;        // Default: 25
  dependencies?: number;           // Default: 10
  abandonmentSignals?: number;    // Default: 10
  packageQuality?: number;         // Default: 5
}
```

Note: All weights are optional and will be normalized to sum to 100.

### BatchAnalysisResult

Result from batch analysis of multiple packages.

```typescript
interface BatchAnalysisResult {
  packages: TrustScore[];           // Array of individual scores
  summary: {
    totalPackages: number;          // Total analyzed
    averageScore: number;           // Mean score
    criticalCount: number;          // Packages with score < 30
    lowTrustCount: number;          // Packages with score < 50
    analysisTime: number;           // Milliseconds taken
  };
}
```

### PackageAnalysisData

Internal type used for collecting data about a package.

```typescript
interface PackageAnalysisData {
  metadata: PackageMetadata;
  versionHistory: VersionHistory[];
  vulnerabilities: Vulnerability[];
  dependencyMetrics: DependencyMetrics;
  lastChecked: Date;
}
```

### PackageMetadata

Metadata about a package.

```typescript
interface PackageMetadata {
  name: string;
  version: string;
  description?: string;
  homepage?: string;
  repository?: { type: string; url: string };
  bugs?: { url: string };
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
```

## Error Handling

### Common Errors

#### Network Errors
```typescript
try {
  const score = await api.analyzePackage('express');
} catch (error) {
  if (error.message.includes('not found')) {
    console.log('Package does not exist on npm');
  } else {
    console.log('Network error:', error.message);
  }
}
```

#### Offline Mode Errors
```typescript
api.setOfflineMode(true);

try {
  const score = await api.analyzePackage('unknown');
} catch (error) {
  // Error: "Offline mode: package "unknown" not found in cache..."
  console.log('Package not in cache');
}
```

#### Invalid Weights
```typescript
try {
  api.setWeights({
    vulnerabilities: 100,  // Will be normalized
  });
} catch (error) {
  // Weights are automatically normalized, no error thrown
}
```

## Performance Notes

- **First analysis**: ~500ms per package (includes network)
- **Cached analysis**: <10ms per package
- **Batch analysis**: O(n) where n = number of packages
- **Memory**: Minimal; caching stores to disk

## Rate Limiting

The npm registry has rate limiting. For high-volume analysis:

1. Use cache aggressively
2. Distribute analysis over time
3. Consider pre-populating cache
4. Use offline mode when possible

Example:
```typescript
// Good: uses cache for repeated checks
const names = ['express', 'lodash', 'react'];
for (const name of names) {
  const score = await api.analyzePackage(name);
}

// Better: batch operation
const result = await api.analyzePackages(names);
```

## Examples

### Example 1: Production Approval Workflow

```typescript
const api = new TrustScoreAPI({
  weights: {
    vulnerabilities: 50,
    publicationFrequency: 15,
    maintainers: 15,
  }
});

async function approveForProduction(packageName) {
  const score = await api.analyzePackage(packageName);

  if (score.score < 70) {
    throw new Error(`${packageName} below production threshold`);
  }

  if (score.vulnerabilities.some(v => v.severity === 'critical')) {
    throw new Error(`${packageName} has critical vulnerabilities`);
  }

  return score;
}
```

### Example 2: Custom Reporting

```typescript
async function generateReport(packageNames) {
  const result = await api.analyzePackages(packageNames);

  console.log('# Dependency Trust Report\n');
  console.log(`Generated: ${new Date().toISOString()}\n`);
  console.log(`## Summary`);
  console.log(`- Packages: ${result.summary.totalPackages}`);
  console.log(`- Average: ${result.summary.averageScore.toFixed(1)}/100`);
  console.log(`- Critical: ${result.summary.criticalCount}\n`);

  console.log('## Packages');
  for (const pkg of result.packages) {
    const status = pkg.score >= 70 ? '✅' : '⚠️';
    console.log(`${status} ${pkg.package}: ${pkg.score.toFixed(1)}/100`);
  }
}
```

### Example 3: Automated Dependency Updates

```typescript
async function evaluateDependencyUpdate(oldPackage, newPackage) {
  const oldScore = await api.analyzePackage(oldPackage);
  const newScore = await api.analyzePackage(newPackage);

  if (newScore.score < oldScore.score) {
    return {
      approved: false,
      reason: `Score decreased: ${oldScore.score} → ${newScore.score}`,
    };
  }

  if (newScore.vulnerabilities.length > oldScore.vulnerabilities.length) {
    return {
      approved: false,
      reason: `More vulnerabilities detected`,
    };
  }

  return { approved: true };
}
```
