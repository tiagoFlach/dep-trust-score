# dep-trust-score

[![npm version](https://badge.fury.io/js/dep-trust-score.svg)](https://badge.fury.io/js/dep-trust-score)
[![Build Status](https://github.com/tiagoFlach/dep-trust-score/actions/workflows/ci.yml/badge.svg)](https://github.com/tiagoFlach/dep-trust-score)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Quantify npm package reliability with transparent, auditable trust scores based on maintenance and security signals.**

Automatically calculate the trustworthiness of npm dependencies using objective data about maintenance activity, security track record, and ecosystem stability. Use it in your CI/CD pipeline to enforce quality standards, prevent supply chain attacks, and make informed decisions about your dependencies.

## Features

✨ **Transparent Scoring**: Every score is backed by detailed, explainable factors with configurable weights

🔒 **Security-First**: Detect vulnerabilities, track abandonment signals, and identify high-risk dependencies

⚡ **Fast & Cached**: Local caching reduces API calls; offline mode for air-gapped environments

🎯 **Flexible Configuration**: Adjust weights for different contexts (production, critical systems, prototyping)

📊 **Multiple Outputs**: JSON for automation, human-readable text for terminals, and detailed reports

🔄 **Batch Analysis**: Analyze multiple packages efficiently in a single operation

🎮 **Programmatic API**: Use in Node.js applications with full TypeScript support

⚙️ **CLI Tool**: Command-line interface for quick checks and CI/CD integration

## Installation

```bash
npm install -g dep-trust-score
```

Or as a dev dependency:

```bash
npm install --save-dev dep-trust-score
```

## Quick Start

### CLI Usage

```bash
# Check a single package
trust-score check express

# Analyze multiple packages
trust-score batch express lodash react

# Get detailed explanation
trust-score explain express

# View cache statistics
trust-score cache stats

# Clear cache
trust-score cache clear
```

### Programmatic API

```typescript
import { TrustScoreAPI } from 'dep-trust-score';

const api = new TrustScoreAPI();

// Analyze a single package
const score = await api.analyzePackage('express');
console.log(`Express trust score: ${score.score}/100`);

// Analyze multiple packages
const result = await api.analyzePackages(['express', 'lodash', 'react']);
console.log(`Average score: ${result.summary.averageScore}/100`);
```

## Scoring Factors

The trust score (0-100) is calculated from 8 independent factors:

### 1. **Publication Frequency** (15% weight by default)
- Measures how actively the package is maintained
- Higher scores for packages with regular releases
- **Signal**: > 12 releases/year = 100, no releases = 0

### 2. **Package Age** (10% weight)
- Older, established packages tend to be more reliable
- New packages are riskier but can score well if other factors are strong
- **Signal**: 1-5 years old = 100, < 1 month = 50, > 5 years = 70+

### 3. **Maintainers** (15% weight)
- Multiple maintainers reduce risk of abandonment or single-point-of-failure
- **Signal**: 3+ maintainers = 100, 1 = 60, 0 = 20

### 4. **Version History** (10% weight)
- Extensive version history indicates maturity and refinement
- **Signal**: > 100 versions = 100, 5+ = 60, 1-2 = 40

### 5. **Vulnerabilities** (25% weight - highest by default)
- Known CVEs and security issues directly impact trustworthiness
- Critical vulnerabilities heavily penalize scores
- **Signal**: No vulnerabilities = 100, 1 critical = 60, 2+ = 20

### 6. **Dependency Complexity** (10% weight)
- Packages with fewer dependencies have smaller attack surfaces
- Deep dependency trees increase maintenance burden
- **Signal**: 0 deps = 100, 5-10 = 80, 50+ = 30

### 7. **Abandonment Signals** (10% weight)
- Detects packages that haven't been updated recently
- **Signal**: Last release < 6 months = 100, 1+ year = 50, 3+ years = 10

### 8. **Package Quality** (5% weight)
- Presence of description, documentation, license, etc.
- **Signal**: Complete metadata = 100, minimal = 20

## Understanding Scores

| Score | Status | Recommendation |
|-------|--------|-----------------|
| 80-100 | ✅ Excellent | Safe for production |
| 60-79 | ⚠️ Good | Generally safe, review periodically |
| 40-59 | ⚠️ Caution | Review carefully, use in non-critical contexts |
| 0-39 | ❌ Critical | Avoid or plan replacement |

## Configuration

### Custom Weights

Adjust weights for your specific use case:

```typescript
import { TrustScoreAPI } from 'dep-trust-score';

// Production environment: maximum security focus
const productionWeights = {
  vulnerabilities: 40,
  publicationFrequency: 15,
  maintainers: 15,
  versionHistory: 10,
  packageAge: 5,
  dependencies: 10,
  abandonmentSignals: 5,
  packageQuality: 0,
};

const api = new TrustScoreAPI({ weights: productionWeights });
const score = await api.analyzePackage('express');
```

See [context-specific-weights.ts](examples/context-specific-weights.ts) for more examples.

### Environment-Specific Weights

- **Production**: Maximum security, proven stability
- **Prototyping**: Balance between reliability and speed
- **Critical Systems**: Extreme security and reliability focus
- **Minimal Dependencies**: Minimize external dependencies

## Offline Mode

For air-gapped environments or to reduce network calls:

```typescript
const api = new TrustScoreAPI();

// Populate cache
await api.analyzePackage('express');

// Switch to offline mode
api.setOfflineMode(true);

// Serves from cache or fails gracefully
const score = await api.analyzePackage('express');
```

### Cache Management

```typescript
// Get cache statistics
const stats = api.getCacheStats();
console.log(`Cache size: ${stats.totalSize / 1024} KB, ${stats.fileCount} packages`);

// Clear cache
api.clearCache();

// Export cache data
const cached = api.exportCacheData();
```

## CI/CD Integration

### GitHub Actions

Use the included GitHub Actions workflow to check dependencies on every pull request:

```yaml
- name: Install trust-score
  run: npm install -g dep-trust-score

- name: Check dependencies
  run: trust-score batch express lodash react --output json
```

See [github-actions.yml](examples/github-actions.yml) for a complete example.

### Shell Script

```bash
#!/bin/bash
THRESHOLD=70

for package in express lodash react; do
  SCORE=$(trust-score check $package --output json | jq .score)
  if (( $(echo "$SCORE < $THRESHOLD" | bc -l) )); then
    echo "❌ $package score ($SCORE) below threshold ($THRESHOLD)"
    exit 1
  fi
done
```

### NPM Scripts

```json
{
  "scripts": {
    "check:deps": "trust-score batch react redux axios --threshold 60",
    "check:deps:critical": "trust-score batch react --weights '{\"vulnerabilities\": 50}'"
  }
}
```

## CLI Commands

### `trust-score check <package>`

Check the trust score for a single package.

```bash
trust-score check express --output table --explain
```

**Options:**
- `--output, -o`: Output format: `json`, `text`, `table` (default: `text`)
- `--explain, -e`: Show detailed breakdown of all factors
- `--offline`: Use offline mode (cache only)
- `--refresh, -r`: Force refresh from npm registry
- `--weights, -w`: Custom weights as JSON string
- `--cache`: Custom cache directory

### `trust-score batch <packages..>`

Analyze multiple packages efficiently.

```bash
trust-score batch express lodash react --threshold 60 --output json
```

**Options:**
- `--output, -o`: Output format: `json`, `text`, `table` (default: `text`)
- `--threshold, -t`: Minimum score (default: 50)
- `--offline`: Use offline mode (cache only)
- `--weights, -w`: Custom weights as JSON string

### `trust-score explain <package>`

Get a detailed explanation of all factors contributing to the score.

```bash
trust-score explain express
```

### `trust-score cache <action>`

Manage the local cache.

```bash
trust-score cache stats    # Show cache statistics
trust-score cache export   # Export all cached scores
trust-score cache clear    # Clear the cache
```

### `trust-score config`

Show current configuration and weights.

```bash
trust-score config
```

## API Reference

### `TrustScoreAPI`

Main class for programmatic access.

```typescript
import { TrustScoreAPI } from 'dep-trust-score';

const api = new TrustScoreAPI(options);
```

**Options:**
```typescript
interface TrustScoreOptions {
  weights?: ScoreWeights;      // Custom weight configuration
  offline?: boolean;            // Start in offline mode
  forceRefresh?: boolean;        // Always fetch fresh data
  cacheDir?: string;             // Custom cache directory
}
```

### Methods

#### `analyzePackage(packageName: string, forceRefresh?: boolean): Promise<TrustScore>`

Analyze a single package. Returns cached result if available.

```typescript
const score = await api.analyzePackage('express');
console.log(score.score);        // 85.5
console.log(score.confidence);   // 95.2
```

#### `analyzePackages(packageNames: string[]): Promise<BatchAnalysisResult>`

Analyze multiple packages in batch.

```typescript
const result = await api.analyzePackages(['express', 'lodash']);
console.log(result.summary.averageScore);  // 82.3
console.log(result.packages.length);        // 2
```

#### `setWeights(weights: ScoreWeights): void`

Update the scoring weights.

```typescript
api.setWeights({
  vulnerabilities: 50,
  publicationFrequency: 20,
});
```

#### `setOfflineMode(enabled: boolean): void`

Enable or disable offline mode.

```typescript
api.setOfflineMode(true);
```

#### `getCacheStats(): { cacheDir: string; fileCount: number; totalSize: number }`

Get cache statistics.

```typescript
const stats = api.getCacheStats();
console.log(`${stats.fileCount} packages cached`);
```

#### `clearCache(): void`

Clear all cached data.

```typescript
api.clearCache();
```

## TypeScript Support

Full TypeScript types are included:

```typescript
import {
  TrustScoreAPI,
  TrustScore,
  ScoreFactors,
  PackageAnalysisData,
  ScoreWeights,
  BatchAnalysisResult,
} from 'dep-trust-score';

const score: TrustScore = await api.analyzePackage('express');
```

## Examples

### Example 1: Production Dependency Check

```typescript
import { TrustScoreAPI } from 'dep-trust-score';

const api = new TrustScoreAPI({
  weights: {
    vulnerabilities: 40,      // Security is critical
    publicationFrequency: 15,
    maintainers: 15,
    versionHistory: 10,
    packageAge: 5,
    dependencies: 10,
    abandonmentSignals: 5,
  }
});

const score = await api.analyzePackage('express');

if (score.score < 70) {
  throw new Error(`Production: ${score.package} trust score too low (${score.score})`);
}
```

### Example 2: Batch Analysis with Reporting

```typescript
import { TrustScoreAPI } from 'dep-trust-score';

const api = new TrustScoreAPI();
const packages = ['express', 'lodash', 'react', 'vue', 'angular'];

const result = await api.analyzePackages(packages);

console.log(`Average trust score: ${result.summary.averageScore}/100`);
console.log(`Critical packages: ${result.summary.criticalCount}`);

const lowestScored = result.packages.sort((a, b) => a.score - b.score)[0];
console.log(`Lowest scored: ${lowestScored.package} (${lowestScored.score})`);
```

### Example 3: Detailed Analysis Report

```typescript
const score = await api.analyzePackage('react');

console.log(`Package: ${score.package}`);
console.log(`Score: ${score.score}/100`);
console.log(`Confidence: ${score.confidence}%`);
console.log('\nFactors:');

const b = score.breakdown;
console.log(`  Vulnerabilities: ${b.vulnerabilities.value}/100 (${b.vulnerabilities.explanation})`);
console.log(`  Maintainers: ${b.maintainers.value}/100 (${b.maintainers.explanation})`);
console.log(`  Publication Frequency: ${b.publicationFrequency.value}/100`);
console.log(`  Abandonment Signals: ${b.abandonmentSignals.value}/100`);
```

See [examples/](examples/) directory for more examples.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Architecture

The package follows a clean, modular architecture:

```
src/
├── core/
│   └── types.ts                 # Core type definitions
├── collectors/
│   └── DataCollector.ts         # Fetches npm registry data
├── calculators/
│   └── ScoreCalculator.ts       # Calculates trust scores
├── cache/
│   └── LocalCache.ts            # Local cache management
├── cli/
│   ├── index.ts                 # CLI interface
│   └── formatters.ts            # Output formatting
└── index.ts                     # Main API export
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Performance

- **First run**: ~500ms per package (network + processing)
- **Cached runs**: <10ms per package
- **Batch of 50 packages**: ~15 seconds (with caching)

## Limitations

- Requires network access on first run (unless using offline mode)
- Vulnerability data depends on public databases
- Some packages may not have complete metadata on npm
- Community-maintained; not an official npm project

## Future Enhancements

- [ ] GitHub security advisories integration
- [ ] npm audit API integration
- [ ] SBOM (Software Bill of Materials) support
- [ ] Historical trend tracking
- [ ] Webhook notifications for score changes
- [ ] Web dashboard UI
- [ ] Enterprise features (custom registries, authentication)

## License

MIT

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/tiagoFlach/dep-trust-score/issues)
- 💬 [Discussions](https://github.com/tiagoFlach/dep-trust-score/discussions)

---

**Made with ❤️ to keep npm dependencies safe and trusted**
