# CI/CD Integration Guide

This guide shows how to integrate `dep-trust-score` into your continuous integration and deployment pipelines.

## GitHub Actions

### Basic Setup

Add to `.github/workflows/dependency-check.yml`:

```yaml
name: Dependency Trust Check
on:
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'

jobs:
  trust-score:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install trust-score
        run: npm install -g dep-trust-score
      
      - name: Check dependencies
        run: |
          # Extract dependencies from package.json and check them
          DEPS=$(jq -r '.dependencies | keys[]' package.json | head -20)
          trust-score batch $DEPS --threshold 60 --output json > scores.json
      
      - name: Validate scores
        run: |
          FAILED=$(jq -r '.packages[] | select(.score < 60) | .package' scores.json)
          if [ ! -z "$FAILED" ]; then
            echo "Failed packages:"
            echo "$FAILED"
            exit 1
          fi
```

### Advanced Setup with PR Comments

```yaml
name: Dependency Check with Reporting

on:
  pull_request:
    paths:
      - 'package.json'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install trust-score
        run: npm install -g dep-trust-score
      
      - name: Analyze dependencies
        id: analyze
        run: |
          THRESHOLD=60
          DEPS=$(jq -r '.dependencies | keys[]' package.json)
          
          trust-score batch $DEPS \
            --threshold $THRESHOLD \
            --output json > scores.json || true
          
          # Extract summary
          TOTAL=$(jq '.summary.totalPackages' scores.json)
          AVERAGE=$(jq '.summary.averageScore' scores.json)
          CRITICAL=$(jq '.summary.criticalCount' scores.json)
          
          echo "TOTAL=$TOTAL" >> $GITHUB_OUTPUT
          echo "AVERAGE=$AVERAGE" >> $GITHUB_OUTPUT
          echo "CRITICAL=$CRITICAL" >> $GITHUB_OUTPUT
      
      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const scores = JSON.parse(fs.readFileSync('scores.json', 'utf-8'));
            
            let comment = `## 📊 Dependency Trust Analysis\n\n`;
            comment += `**Summary:**\n`;
            comment += `- Total: ${scores.summary.totalPackages} packages\n`;
            comment += `- Average: ${scores.summary.averageScore.toFixed(1)}/100\n`;
            comment += `- Critical: ${scores.summary.criticalCount}\n\n`;
            
            comment += `**Packages Below Threshold (60):**\n`;
            const failed = scores.packages.filter(p => p.score < 60);
            if (failed.length === 0) {
              comment += `✅ None - All packages passed!\n`;
            } else {
              failed.forEach(p => {
                comment += `- ${p.package}: **${p.score.toFixed(1)}/100**\n`;
              });
            }
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## GitLab CI

```yaml
dependency-check:
  stage: test
  image: node:18
  script:
    - npm install -g dep-trust-score
    - |
      DEPS=$(jq -r '.dependencies | keys[]' package.json | head -20)
      trust-score batch $DEPS --threshold 60 --output json | tee scores.json
    - |
      FAILED=$(jq -r '.packages[] | select(.score < 60) | .package' scores.json | wc -l)
      if [ $FAILED -gt 0 ]; then
        echo "Failed: $FAILED packages below threshold"
        exit 1
      fi
  artifacts:
    reports:
      dependency_scanning: scores.json
    paths:
      - scores.json
```

## Jenkins

```groovy
pipeline {
    agent any
    
    stages {
        stage('Dependency Check') {
            steps {
                script {
                    sh '''
                        npm install -g dep-trust-score
                        
                        DEPS=$(cat package.json | jq -r '.dependencies | keys[]' | head -20)
                        trust-score batch $DEPS --threshold 60 --output json > scores.json
                    '''
                }
            }
        }
        
        stage('Validate') {
            steps {
                script {
                    def scores = readJSON file: 'scores.json'
                    def failedCount = scores.packages.findAll { it.score < 60 }.size()
                    
                    if (failedCount > 0) {
                        error("${failedCount} packages below threshold")
                    }
                    
                    currentBuild.description = "Avg: ${scores.summary.averageScore.toFixed(1)}/100"
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'scores.json'
        }
    }
}
```

## Azure Pipelines

```yaml
trigger:
  - main

pr:
  - main

pool:
  vmImage: 'ubuntu-latest'

jobs:
  - job: DependencyCheck
    displayName: 'Dependency Trust Score Check'
    steps:
      - task: UseNode@1
        inputs:
          version: '20.x'
      
      - script: npm install -g dep-trust-score
        displayName: 'Install trust-score'
      
      - script: |
          DEPS=$(jq -r '.dependencies | keys[]' package.json | head -20)
          trust-score batch $DEPS --threshold 60 --output json > $(Build.ArtifactStagingDirectory)/scores.json
        displayName: 'Analyze dependencies'
      
      - task: PublishBuildArtifacts@1
        displayName: 'Publish scores'
        inputs:
          pathToPublish: '$(Build.ArtifactStagingDirectory)'
          artifactName: 'dependency-scores'
```

## Shell Script Integration

Create a `scripts/check-dependencies.sh`:

```bash
#!/bin/bash
set -e

# Configuration
THRESHOLD=${1:-60}
ENVIRONMENT=${2:-production}
REPORT_FILE="dependency-report-$(date +%s).json"

echo "🔍 Checking dependencies (threshold: $THRESHOLD, environment: $ENVIRONMENT)"

# Get all production dependencies
DEPS=$(jq -r '.dependencies | keys[]' package.json)

# Choose weights based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  WEIGHTS='{"vulnerabilities":40,"publicationFrequency":15,"maintainers":15}'
elif [ "$ENVIRONMENT" = "staging" ]; then
  WEIGHTS='{"vulnerabilities":30,"publicationFrequency":15,"maintainers":10}'
else
  WEIGHTS='{"vulnerabilities":20,"publicationFrequency":15,"maintainers":5}'
fi

# Run analysis
trust-score batch $DEPS \
  --threshold $THRESHOLD \
  --weights "$WEIGHTS" \
  --output json > "$REPORT_FILE"

# Parse results
TOTAL=$(jq '.summary.totalPackages' "$REPORT_FILE")
AVERAGE=$(jq '.summary.averageScore' "$REPORT_FILE")
CRITICAL=$(jq '.summary.criticalCount' "$REPORT_FILE")
LOW_TRUST=$(jq '.summary.lowTrustCount' "$REPORT_FILE")

echo ""
echo "📊 Report Summary:"
echo "   Total packages: $TOTAL"
echo "   Average score: $AVERAGE/100"
echo "   Critical: $CRITICAL"
echo "   Low trust: $LOW_TRUST"
echo ""

# Check for failures
if [ $(echo "$LOW_TRUST > 0" | bc) -eq 1 ]; then
  echo "❌ FAILED: $LOW_TRUST packages below threshold"
  echo ""
  echo "Low-trust packages:"
  jq -r '.packages[] | select(.score < '$THRESHOLD') | "  - \(.package): \(.score)/100"' "$REPORT_FILE"
  echo ""
  exit 1
fi

echo "✅ PASSED: All packages meet trust threshold"
echo "Report saved to: $REPORT_FILE"
exit 0
```

Usage:
```bash
# Default: production, threshold 60
./scripts/check-dependencies.sh

# Custom threshold and environment
./scripts/check-dependencies.sh 50 staging

# Development environment with lower threshold
./scripts/check-dependencies.sh 40 development
```

## NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "check:deps": "trust-score batch $(jq -r '.dependencies | keys[]' package.json | tr '\\n' ' ') --threshold 60",
    "check:deps:prod": "trust-score batch $(jq -r '.dependencies | keys[]' package.json | tr '\\n' ' ') --threshold 70 --weights '{\"vulnerabilities\":40}'",
    "check:deps:critical": "trust-score batch lodash react express --threshold 75 --weights '{\"vulnerabilities\":50}'",
    "check:deps:full": "trust-score batch $(jq -r '.dependencies | keys[]' package.json | tr '\\n' ' ') --output table"
  }
}
```

Usage:
```bash
npm run check:deps              # Standard check
npm run check:deps:prod        # Production-grade check
npm run check:deps:critical    # Critical dependencies only
npm run check:deps:full        # Detailed table view
```

## Approval Workflows

### With Slack Notifications

```javascript
// deploy.js
const axios = require('axios');
const { TrustScoreAPI } = require('dep-trust-score');

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const THRESHOLD = process.env.TRUST_SCORE_THRESHOLD || 70;

async function checkAndNotify(packageName) {
  const api = new TrustScoreAPI();
  const score = await api.analyzePackage(packageName);
  
  const color = score.score >= THRESHOLD ? 'good' : 'danger';
  const status = score.score >= THRESHOLD ? '✅ PASS' : '❌ FAIL';
  
  const message = {
    attachments: [{
      color,
      title: `${status} - ${packageName}`,
      fields: [
        { title: 'Score', value: `${score.score.toFixed(1)}/100`, short: true },
        { title: 'Threshold', value: `${THRESHOLD}/100`, short: true },
        { title: 'Confidence', value: `${score.confidence.toFixed(1)}%`, short: true },
        { title: 'Critical Issues', value: score.summary?.criticalCount || 0, short: true }
      ]
    }]
  };
  
  await axios.post(SLACK_WEBHOOK, message);
  
  return score.score >= THRESHOLD;
}

// Usage in deployment
async function deploy() {
  const criticalPackages = ['react', 'express', 'lodash'];
  
  for (const pkg of criticalPackages) {
    const approved = await checkAndNotify(pkg);
    if (!approved) {
      throw new Error(`Package ${pkg} failed trust check`);
    }
  }
  
  console.log('✅ All dependencies approved for deployment');
}

deploy().catch(err => {
  console.error(err);
  process.exit(1);
});
```

## Best Practices

### 1. Run on Multiple Triggers
```yaml
on:
  push:
    branches: [main]
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'
  schedule:
    - cron: '0 0 * * 1'  # Weekly
```

### 2. Cache Results
```bash
# Use cache to reduce API calls
trust-score batch express lodash --output json > cache.json

# Next check uses cache
trust-score batch express lodash --output json
```

### 3. Different Thresholds Per Environment
```javascript
const THRESHOLDS = {
  development: 40,
  staging: 60,
  production: 80,
};

const threshold = THRESHOLDS[process.env.NODE_ENV] || 60;
```

### 4. Report Trends
```bash
# Track scores over time
trust-score batch $(cat package.json | jq -r '.dependencies | keys[]') \
  --output json | jq '.summary.averageScore' >> score-history.json

# Graph the trend
# (use your favorite charting tool)
```

### 5. Notify on Changes
```javascript
// Only notify if score changes significantly
const oldScore = getCachedScore(packageName);
const newScore = await api.analyzePackage(packageName);

if (Math.abs(newScore.score - oldScore.score) > 5) {
  notifySlack(`Score changed: ${oldScore.score} → ${newScore.score}`);
}
```

## Troubleshooting

### Issue: "npm: command not found in CI"
**Solution**: Specify full path or adjust CI environment
```yaml
- run: $(npm bin)/trust-score check express
```

### Issue: Slow CI runs
**Solution**: Analyze fewer packages or use cache
```bash
# Only check critical packages
trust-score batch react express lodash

# Use cache more aggressively
trust-score batch ... --offline  # Skip registry checks
```

### Issue: Network timeouts
**Solution**: Increase timeout or use offline mode with pre-populated cache
```bash
# Pre-populate cache before running
trust-score batch ... --refresh

# Later CI runs use cache
trust-score batch ...
```
