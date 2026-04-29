# Configuration Guide

## Weight System

The trust score calculation uses 8 independent factors, each with a configurable weight. The weights determine the relative importance of each factor in the final score.

### Default Weights

```json
{
  "publicationFrequency": 15,
  "packageAge": 10,
  "maintainers": 15,
  "versionHistory": 10,
  "vulnerabilities": 25,
  "dependencies": 10,
  "abandonmentSignals": 10,
  "packageQuality": 5
}
```

All weights sum to 100 and are automatically normalized if you provide custom values.

## Context-Based Configurations

### Production Environment

For production applications where security and stability are paramount:

```json
{
  "vulnerabilities": 40,
  "publicationFrequency": 15,
  "maintainers": 15,
  "versionHistory": 10,
  "packageAge": 5,
  "dependencies": 10,
  "abandonmentSignals": 5,
  "packageQuality": 0
}
```

**Rationale**:
- Vulnerabilities (40%): Security breaches in production are catastrophic
- Maintainers (15%): Multiple maintainers ensure continuity
- Publication Frequency (15%): Regular updates indicate active maintenance
- Abandonment Signals (5%): Monitor for neglected packages

### Development/Prototyping

For quick prototyping and MVP development where time-to-market matters:

```json
{
  "publicationFrequency": 20,
  "abandonmentSignals": 15,
  "vulnerabilities": 15,
  "versionHistory": 15,
  "maintainers": 10,
  "packageAge": 10,
  "dependencies": 10,
  "packageQuality": 5
}
```

**Rationale**:
- Vulnerabilities (15%): Lower weight; can patch before production
- Abandonment (15%): Want maintained packages but not critical
- Publication Frequency (20%): Prefer actively maintained packages
- Package Age (10%): Don't penalize newer packages

### Critical Systems

For banking, healthcare, government, and mission-critical systems:

```json
{
  "vulnerabilities": 50,
  "maintainers": 20,
  "versionHistory": 15,
  "packageAge": 15,
  "publicationFrequency": 10,
  "dependencies": 5,
  "abandonmentSignals": 5,
  "packageQuality": 0
}
```

**Rationale**:
- Vulnerabilities (50%): Zero tolerance for security issues
- Maintainers (20%): Need multiple responsible parties
- Version History (15%): Long track record of reliability
- Package Age (15%): Require proven stability over time
- Abandonment (5%): Absolutely avoid abandoned packages

### Minimal Dependencies

For edge computing, embedded systems, or performance-critical applications:

```json
{
  "dependencies": 35,
  "vulnerabilities": 20,
  "publicationFrequency": 10,
  "abandonmentSignals": 10,
  "maintainers": 15,
  "packageAge": 5,
  "versionHistory": 5,
  "packageQuality": 0
}
```

**Rationale**:
- Dependencies (35%): Minimize external dependencies
- Vulnerabilities (20%): Security still important but balanced
- Maintainers (15%): Fewer dependencies means simpler maintenance

## Using Custom Weights

### CLI

```bash
# With JSON file
trust-score check express --weights "$(cat weights.json)"

# Inline JSON
trust-score check express --weights '{"vulnerabilities":50,"publicationFrequency":20}'
```

### Programmatic

```typescript
import { TrustScoreAPI } from 'dep-trust-score';

const api = new TrustScoreAPI({
  weights: {
    vulnerabilities: 50,
    publicationFrequency: 20,
    maintainers: 15,
  }
});

const score = await api.analyzePackage('express');
```

## Factor Descriptions

### Vulnerability Weight

**Purpose**: Detect known security issues

**Adjustment Guidance**:
- Increase (>30%): For production/critical systems
- Decrease (<15%): For prototyping/internal projects
- Always ≥15% for any production use

**What it measures**:
- CVEs in current version
- Unpatched security issues
- Historical vulnerability count

### Publication Frequency Weight

**Purpose**: Gauge active maintenance

**Adjustment Guidance**:
- Increase (>15%): Value actively maintained packages
- Decrease (<10%): Accept packages with infrequent but stable releases
- Around 10-15% is reasonable for most use cases

**What it measures**:
- Releases per year
- Time since last release
- Consistency of releases

### Maintainers Weight

**Purpose**: Reduce risk of single points of failure

**Adjustment Guidance**:
- Increase (>15%): Critical systems where continuity matters
- Decrease (<10%): If package is feature-complete and stable
- 15% is good default

**What it measures**:
- Number of listed maintainers
- Publicly active contributors

### Version History Weight

**Purpose**: Assess maturity and refinement

**Adjustment Guidance**:
- Increase (>15%): For stability-critical applications
- Decrease (<5%): For rapidly evolving tech stacks
- 10% is good default

**What it measures**:
- Total versions released
- Time span of releases

### Package Age Weight

**Purpose**: Balance stability vs. innovation

**Adjustment Guidance**:
- Increase (>10%): For critical systems (proven track record matters)
- Decrease (<5%): For modern projects using newer packages
- 10% is good default

**What it measures**:
- Age of package
- How established it is

### Dependency Weight

**Purpose**: Minimize supply chain risk

**Adjustment Guidance**:
- Increase (>15%): For systems with strict dependency limits
- Decrease (<5%): If feature-richness is valued over simplicity
- 10% is good default

**What it measures**:
- Number of dependencies
- Dependency tree complexity

### Abandonment Signals Weight

**Purpose**: Detect unmaintained packages

**Adjustment Guidance**:
- Increase (>15%): If you need proactive maintenance
- Decrease (<5%): For stable, feature-complete packages
- 10% is good default

**What it measures**:
- Time since last release
- Activity patterns

### Package Quality Weight

**Purpose**: Assess code quality signals

**Adjustment Guidance**:
- Increase (>10%): If documentation matters
- Decrease (<5%): For well-known packages or internal use
- 5% is reasonable default

**What it measures**:
- Package.json completeness
- Presence of README, license, etc.

## Score Interpretation By Context

### Production

| Score | Status | Action |
|-------|--------|--------|
| >80 | ✅ Approved | Use immediately |
| 70-80 | ⚠️ Review | Discuss with security team |
| 60-70 | ❌ Caution | Document exception before use |
| <60 | ❌ Blocked | Consider alternative |

### Prototyping

| Score | Status | Action |
|-------|--------|--------|
| >70 | ✅ Use | Good choice |
| 50-70 | ⚠️ Consider | Acceptable for prototypes |
| 30-50 | ⚠️ Caution | Monitor carefully |
| <30 | ❌ Avoid | Find alternative |

### Critical Systems

| Score | Status | Action |
|-------|--------|--------|
| >85 | ✅ Approved | Only option allowed |
| 70-85 | ⚠️ Extreme Caution | Exceptional approval only |
| <70 | ❌ Prohibited | Not acceptable |

## Advanced Configuration

### Multi-Phase Approval Process

```typescript
import { TrustScoreAPI } from 'dep-trust-score';

async function approveForProduction(packageName) {
  // Phase 1: Development check
  const devAPI = new TrustScoreAPI({ 
    weights: PROTOTYPING_WEIGHTS 
  });
  const devScore = await devAPI.analyzePackage(packageName);
  
  if (devScore.score < 50) {
    throw new Error(`Failed development check: ${devScore.score}`);
  }

  // Phase 2: Production check
  const prodAPI = new TrustScoreAPI({ 
    weights: PRODUCTION_WEIGHTS 
  });
  const prodScore = await prodAPI.analyzePackage(packageName);
  
  if (prodScore.score < 70) {
    throw new Error(`Failed production check: ${prodScore.score}`);
  }

  // Phase 3: Security review
  if (prodScore.vulnerabilities.length > 0) {
    console.warn(`Security review required: ${prodScore.vulnerabilities.length} CVEs`);
    // Allow override with approval
  }

  return prodScore;
}
```

### Threshold-Based Decision Making

```typescript
const score = await api.analyzePackage('package-name');

if (score.score >= 80) {
  // Auto-approve
  dependencies.add(packageName);
} else if (score.score >= 60) {
  // Manual review
  reviewQueue.add({ package: packageName, score });
} else if (score.score >= 40) {
  // Require security analysis
  securityReview.add({ package: packageName, score });
} else {
  // Reject
  rejectDependency(packageName, `Trust score too low: ${score.score}`);
}
```

## Updating Weights Over Time

Recommendations don't need to be static. Adjust as your organization's priorities evolve:

```typescript
// Q1 2024: Focus on security after incident
weights = { vulnerabilities: 50, ... };

// Q3 2024: Focus on performance, security stabilized
weights = { dependencies: 20, vulnerabilities: 25, ... };

// Q4 2024: Back to balanced approach
weights = { vulnerabilities: 25, ... }; // default
```

## Documenting Weight Decisions

When using non-default weights, document your reasoning:

```typescript
const customWeights = {
  // Increased vulnerability weight due to security incidents in Q1
  vulnerabilities: 40,
  // Increased maintainer weight for continuity during team restructure
  maintainers: 20,
  // Reduced dependency weight as we focus on feature development
  dependencies: 5,
};

const api = new TrustScoreAPI({ weights: customWeights });
// Document: See RFC-2024-03 for weight rationale
```

## Common Scenarios

### "We switched from npm to pnpm"
No changes needed. dep-trust-score analyzes packages, not your package manager.

### "We're moving to TypeScript"
Consider temporarily reducing `packageAge` weight to allow newer packages.

### "We had a security breach"
Increase `vulnerabilities` weight and review all dependencies immediately.

### "Our startup became mature"
Gradually increase weights for `packageAge`, `versionHistory`, and `maintainers`.

### "We need faster development"
For prototyping branch, reduce `abandonmentSignals` and `packageAge` weights.
