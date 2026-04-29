# Quick Start Guide - dep-trust-score

Get up and running with `dep-trust-score` in minutes.

## Installation

```bash
# Global installation (for CLI use)
npm install -g dep-trust-score

# Or add to your project
npm install --save-dev dep-trust-score
```

## CLI Quick Start

### 1. Check a Single Package

```bash
trust-score check express
```

Output:
```
Package: express@4.18.2
Trust Score: 85.3/100 [████████████████░░]
Confidence: 95.2%

✓ No known vulnerabilities
```

### 2. Check Multiple Packages

```bash
trust-score batch express lodash react --threshold 60
```

Output shows a table with all packages, average score, and critical counts.

### 3. Get Detailed Breakdown

```bash
trust-score check express --explain --output table
```

Shows all 8 factors with scores, weights, and explanations.

### 4. Output as JSON

```bash
trust-score check express --output json | jq '.score'
```

Perfect for CI/CD automation.

## Programmatic API Quick Start

### 1. Basic Usage

```typescript
import { TrustScoreAPI } from 'dep-trust-score';

const api = new TrustScoreAPI();

// Analyze a package
const score = await api.analyzePackage('express');

console.log(`${score.package}@${score.version}`);
console.log(`Score: ${score.score}/100`);
console.log(`Confidence: ${score.confidence}%`);
```

### 2. Batch Analysis

```typescript
const result = await api.analyzePackages(['express', 'lodash', 'react']);

console.log(`Average: ${result.summary.averageScore}/100`);
console.log(`Critical: ${result.summary.criticalCount}`);

result.packages.forEach(pkg => {
  console.log(`${pkg.package}: ${pkg.score}/100`);
});
```

### 3. Custom Configuration for Production

```typescript
const api = new TrustScoreAPI({
  weights: {
    vulnerabilities: 40,  // Security is critical
    publicationFrequency: 15,
    maintainers: 15,
    versionHistory: 10,
  }
});

const score = await api.analyzePackage('express');
if (score.score < 70) {
  throw new Error(`${score.package} not approved for production`);
}
```

### 4. Offline Mode (Air-Gapped)

```typescript
const api = new TrustScoreAPI();

// First run: fetches from npm registry
await api.analyzePackage('express');

// Enable offline mode
api.setOfflineMode(true);

// Later runs use cache
const cached = await api.analyzePackage('express');
```

## Common Patterns

### Pattern 1: CI/CD Integration

```bash
#!/bin/bash
THRESHOLD=70

# Check all production dependencies
DEPS=$(jq -r '.dependencies | keys[]' package.json)
trust-score batch $DEPS --threshold $THRESHOLD

if [ $? -ne 0 ]; then
  echo "❌ Build failed: Low trust score dependencies"
  exit 1
fi

echo "✅ All dependencies approved"
```

### Pattern 2: Dependency Approval Workflow

```typescript
const api = new TrustScoreAPI({
  weights: {
    vulnerabilities: 50,  // Strict security
    publicationFrequency: 15,
    maintainers: 15,
  }
});

async function approveForProduction(packageName) {
  const score = await api.analyzePackage(packageName);

  if (score.score < 75) {
    throw new Error(`${packageName}: Score ${score.score} below minimum 75`);
  }

  if (score.vulnerabilities.some(v => v.severity === 'critical')) {
    throw new Error(`${packageName}: Has critical vulnerabilities`);
  }

  return true;
}
```

### Pattern 3: Periodic Dependency Audits

```typescript
// Run this daily to monitor for changes
const packages = ['express', 'lodash', 'react', 'vue'];
const result = await api.analyzePackages(packages);

// Alert if any package dropped significantly
for (const pkg of result.packages) {
  const previousScore = getPreviousScore(pkg.package); // Your storage
  const drop = previousScore - pkg.score;

  if (drop > 10) {
    console.warn(`⚠️ ${pkg.package} dropped ${drop} points`);
    sendAlert(pkg.package, drop);
  }

  saveScore(pkg.package, pkg.score); // Your storage
}
```

## Understanding Scores

| Score Range | Status | Action |
|-------------|--------|--------|
| 80-100 | ✅ Excellent | Use immediately |
| 60-79 | ⚠️ Good | Monitor periodically |
| 40-59 | ⚠️ Caution | Review carefully |
| 0-39 | ❌ Critical | Consider alternatives |

## The 8 Factors

Quick reference for what each factor measures:

1. **Publication Frequency** (15%): How often is it updated?
2. **Package Age** (10%): How established is it?
3. **Maintainers** (15%): How many people maintain it?
4. **Version History** (10%): How many releases?
5. **Vulnerabilities** (25%): Any known security issues?
6. **Dependencies** (10%): How many dependencies?
7. **Abandonment Signals** (10%): Signs of neglect?
8. **Package Quality** (5%): Complete metadata?

## Adjusting for Your Context

### For Production
```bash
trust-score check express --weights '{"vulnerabilities":40,"publicationFrequency":15}'
```

### For Prototyping
```bash
trust-score check express --weights '{"vulnerabilities":15,"publicationFrequency":20}'
```

### For Critical Systems (Banking/Healthcare)
```bash
trust-score check express --weights '{"vulnerabilities":50,"maintainers":20}'
```

## Troubleshooting

### Package not found
```bash
# Verify package name (check npm.js)
trust-score check @scope/package-name
```

### Network timeout
```bash
# Use cache if available, or try --offline
trust-score check express --offline

# Pre-populate cache
trust-score batch express lodash react
```

### Need more details?
```bash
# Get full explanation
trust-score explain express

# Save to JSON for analysis
trust-score check express --output json > report.json
```

## Next Steps

- 📖 [Full Documentation](README.md)
- ⚙️ [Configuration Guide](docs/CONFIGURATION.md)
- 🚀 [CI/CD Integration](docs/CI-CD-INTEGRATION.md)
- 📚 [API Reference](docs/API-REFERENCE.md)
- 💡 [Examples](examples/)

## Need Help?

1. Check the [FAQ in README](README.md#frequently-asked-questions)
2. Review [examples](examples/) for your use case
3. Read [API Reference](docs/API-REFERENCE.md) for details
4. Check [CI/CD Guide](docs/CI-CD-INTEGRATION.md) for integration patterns

---

**Happy dependency trusting! 🎉**
