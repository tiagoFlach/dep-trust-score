/**
 * Example: Context-Specific Weight Configurations
 * 
 * Demonstrates how to adjust weights for different use cases:
 * - Production: High security focus
 * - Prototyping: Balance between reliability and speed
 * - Critical Systems: Extreme security and stability focus
 */

import { TrustScoreAPI } from '../src/index';

// Production Environment
// Focus on security and active maintenance
const PRODUCTION_WEIGHTS = {
    vulnerabilities: 40, // Critical: security must be top priority
    publicationFrequency: 15, // Important: want active maintenance
    packageAge: 5, // Less important: age isn't as critical
    maintainers: 15, // Important: multiple maintainers for stability
    versionHistory: 10, // Important: stable release history
    dependencies: 10, // Important: minimize supply chain risk
    abandonmentSignals: 5, // Important: detect unmaintained packages
    packageQuality: 0, // Lower priority
};

// Prototyping/Development Environment
// Balance between reliability and speed to market
const PROTOTYPING_WEIGHTS = {
    vulnerabilities: 15, // Less critical: can be addressed later
    publicationFrequency: 20, // More flexible: accept less frequent updates
    packageAge: 10, // Okay with newer packages
    maintainers: 10, // Less critical for prototypes
    versionHistory: 15, // Prefer stable APIs but not mandatory
    dependencies: 10, // Moderate concern
    abandonmentSignals: 15, // Prefer maintained but flexible
    packageQuality: 5, // Documentation helpful
};

// Critical Systems (Banking, Healthcare, etc.)
// Maximum security and reliability
const CRITICAL_SYSTEMS_WEIGHTS = {
    vulnerabilities: 50, // HIGHEST: must be zero-vulnerability
    publicationFrequency: 10, // Careful about frequent changes
    packageAge: 15, // Proven stability over time
    maintainers: 20, // Multiple maintainers essential
    versionHistory: 15, // Long proven history required
    dependencies: 10, // Minimize external dependencies
    abandonmentSignals: 5, // Detect abandoned packages
    packageQuality: 5, // Code quality matters
};

// Minimal Dependencies Focus
// For resource-constrained or minimal environments
const MINIMAL_DEPENDENCIES_WEIGHTS = {
    vulnerabilities: 20,
    publicationFrequency: 10,
    packageAge: 10,
    maintainers: 15,
    versionHistory: 10,
    dependencies: 35, // HIGHEST: minimize dependencies
    abandonmentSignals: 10,
    packageQuality: 0,
};

async function demonstrateContexts() {
    const testPackages = ['express', 'lodash', 'react', 'axios', 'typescript'];

    console.log('='.repeat(80));
    console.log('CONTEXT-SPECIFIC TRUST SCORE ANALYSIS');
    console.log('='.repeat(80));

    // Production Context
    console.log('\n📦 PRODUCTION CONTEXT');
    console.log('-'.repeat(80));
    console.log('Focus: Maximum security and active maintenance');
    console.log('Use case: Mission-critical production applications\n');

    try {
        const productionAPI = new TrustScoreAPI({ weights: PRODUCTION_WEIGHTS });
        const result = await productionAPI.analyzePackages(testPackages);

        console.log(`Average Score: ${result.summary.averageScore.toFixed(1)}/100`);
        console.log(`Critical packages: ${result.summary.criticalCount}`);
        console.log('\nTop concerns:');

        // Find packages with security issues
        const securityConcerns = result.packages.filter((p) => p.breakdown.vulnerabilities.value < 80);
        if (securityConcerns.length > 0) {
            console.log('  Security concerns:');
            securityConcerns.forEach((p) => {
                console.log(`    - ${p.package}: ${p.breakdown.vulnerabilities.explanation}`);
            });
        }

        // Find abandoned packages
        const abandoned = result.packages.filter((p) => p.breakdown.abandonmentSignals.value < 60);
        if (abandoned.length > 0) {
            console.log('  Maintenance concerns:');
            abandoned.forEach((p) => {
                console.log(`    - ${p.package}: ${p.breakdown.abandonmentSignals.explanation}`);
            });
        }
    } catch (error) {
        console.log('Note: Network error - this is expected in offline environments');
    }

    // Prototyping Context
    console.log('\n\n🚀 PROTOTYPING CONTEXT');
    console.log('-'.repeat(80));
    console.log('Focus: Balance between reliability and speed');
    console.log('Use case: Rapid prototyping and MVP development\n');

    try {
        const prototypeAPI = new TrustScoreAPI({ weights: PROTOTYPING_WEIGHTS });
        const result = await prototypeAPI.analyzePackages(testPackages);

        console.log(`Average Score: ${result.summary.averageScore.toFixed(1)}/100`);
        console.log(`\nNote: Scores are typically higher in this context as security`);
        console.log(`is balanced with development velocity concerns.`);
    } catch (error) {
        console.log('Note: Network error - this is expected in offline environments');
    }

    // Critical Systems Context
    console.log('\n\n🔒 CRITICAL SYSTEMS CONTEXT');
    console.log('-'.repeat(80));
    console.log('Focus: Maximum security and extreme reliability');
    console.log('Use case: Banking, Healthcare, Government systems\n');

    try {
        const criticalAPI = new TrustScoreAPI({ weights: CRITICAL_SYSTEMS_WEIGHTS });
        const result = await criticalAPI.analyzePackages(testPackages);

        console.log(`Average Score: ${result.summary.averageScore.toFixed(1)}/100`);
        console.log(`Critical packages: ${result.summary.criticalCount}`);
        console.log(`Low trust packages: ${result.summary.lowTrustCount}`);
        console.log(`\nNote: Scores are typically lower in this context due to`);
        console.log(`strict security and stability requirements.`);

        console.log('\nRecommendations:');
        result.packages.forEach((p) => {
            if (p.score < 50) {
                console.log(`  ❌ ${p.package}: NOT RECOMMENDED - Score too low (${p.score}/100)`);
            } else if (p.score < 70) {
                console.log(`  ⚠️  ${p.package}: REVIEW REQUIRED - Score marginal (${p.score}/100)`);
            } else {
                console.log(`  ✅ ${p.package}: APPROVED - Score acceptable (${p.score}/100)`);
            }
        });
    } catch (error) {
        console.log('Note: Network error - this is expected in offline environments');
    }

    // Minimal Dependencies Context
    console.log('\n\n📉 MINIMAL DEPENDENCIES CONTEXT');
    console.log('-'.repeat(80));
    console.log('Focus: Minimize external dependencies');
    console.log('Use case: Edge computing, embedded systems, performance-critical\n');

    try {
        const minimalAPI = new TrustScoreAPI({ weights: MINIMAL_DEPENDENCIES_WEIGHTS });
        const result = await minimalAPI.analyzePackages(testPackages);

        console.log(`Average Score: ${result.summary.averageScore.toFixed(1)}/100`);

        const withManyDeps = result.packages.filter((p) => p.breakdown.dependencies.value < 70);
        if (withManyDeps.length > 0) {
            console.log('\nPackages with too many dependencies:');
            withManyDeps.forEach((p) => {
                console.log(`  - ${p.package}: ${p.breakdown.dependencies.explanation}`);
            });
        }
    } catch (error) {
        console.log('Note: Network error - this is expected in offline environments');
    }

    console.log('\n' + '='.repeat(80));
    console.log('Context-specific weight configurations allow you to:');
    console.log('  1. Align scores with your business priorities');
    console.log('  2. Make different decisions for different environments');
    console.log('  3. Automate dependency approval processes');
    console.log('  4. Maintain consistent security standards');
    console.log('='.repeat(80));
}

// Export contexts for reuse
export { PRODUCTION_WEIGHTS, PROTOTYPING_WEIGHTS, CRITICAL_SYSTEMS_WEIGHTS, MINIMAL_DEPENDENCIES_WEIGHTS };

// Run example
// demonstrateContexts().catch(console.error);
