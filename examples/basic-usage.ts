/**
 * Example: Basic Usage
 * 
 * Demonstrates how to use the dep-trust-score API programmatically
 */

import { TrustScoreAPI } from '../src/index';

async function basicExample() {
    console.log('=== Basic Usage Example ===\n');

    const api = new TrustScoreAPI();

    try {
        // Analyze a single package
        const score = await api.analyzePackage('express');
        console.log(`Package: ${score.package}@${score.version}`);
        console.log(`Trust Score: ${score.score}/100`);
        console.log(`Confidence: ${score.confidence}%`);
        console.log('Vulnerabilities:', score.vulnerabilities.length);
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
    }
}

async function batchExample() {
    console.log('\n=== Batch Analysis Example ===\n');

    const api = new TrustScoreAPI();

    try {
        const packages = ['express', 'lodash', 'react', 'vue', 'typescript'];
        const result = await api.analyzePackages(packages);

        console.log(`Analyzed ${result.summary.totalPackages} packages`);
        console.log(`Average Score: ${result.summary.averageScore}/100`);
        console.log(`Critical Packages: ${result.summary.criticalCount}`);

        console.log('\nResults:');
        for (const pkg of result.packages) {
            console.log(`  ${pkg.package}: ${pkg.score}/100`);
        }
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
    }
}

async function customWeightsExample() {
    console.log('\n=== Custom Weights Example ===\n');

    // For production environments, security is more critical
    const productionWeights = {
        vulnerabilities: 40, // Higher weight for security
        publicationFrequency: 15,
        packageAge: 10,
        maintainers: 15,
        versionHistory: 10,
        dependencies: 5,
        abandonmentSignals: 5,
        packageQuality: 0,
    };

    const api = new TrustScoreAPI({ weights: productionWeights });

    try {
        const score = await api.analyzePackage('lodash');
        console.log(`Package: ${score.package}`);
        console.log(`Production Trust Score: ${score.score}/100`);
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
    }
}

async function offlineModeExample() {
    console.log('\n=== Offline Mode Example ===\n');

    const api = new TrustScoreAPI();

    // First, analyze a package to populate cache
    console.log('Step 1: Analyzing package (populating cache)...');
    try {
        await api.analyzePackage('express');
        console.log('Cache populated.\n');

        // Now switch to offline mode
        console.log('Step 2: Enabling offline mode...');
        api.setOfflineMode(true);

        // Try to get the cached package
        console.log('Step 3: Retrieving from cache...');
        const cached = api.getCachedScore('express');
        if (cached) {
            console.log(`Express score (from cache): ${cached.score}/100`);
        }

        // Show cache statistics
        const stats = api.getCacheStats();
        console.log(`\nCache Statistics: ${stats.fileCount} files, ${(stats.totalSize / 1024).toFixed(2)} KB`);
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
    }
}

async function detailedAnalysisExample() {
    console.log('\n=== Detailed Analysis Example ===\n');

    const api = new TrustScoreAPI();

    try {
        const score = await api.analyzePackage('react');

        console.log(`Package: ${score.package}@${score.version}`);
        console.log(`Overall Score: ${score.score}/100`);
        console.log(`Confidence: ${score.confidence}%\n`);

        console.log('Factor Breakdown:');
        const breakdown = score.breakdown;

        const factors = [
            { name: 'Publication Frequency', data: breakdown.publicationFrequency },
            { name: 'Package Age', data: breakdown.packageAge },
            { name: 'Maintainers', data: breakdown.maintainers },
            { name: 'Version History', data: breakdown.versionHistory },
            { name: 'Vulnerabilities', data: breakdown.vulnerabilities },
            { name: 'Dependencies', data: breakdown.dependencies },
            { name: 'Abandonment Signals', data: breakdown.abandonmentSignals },
            { name: 'Package Quality', data: breakdown.packageQuality },
        ];

        for (const factor of factors) {
            const contribution = (factor.data.value * factor.data.weight) / 100;
            console.log(`\n${factor.name}:`);
            console.log(`  Score: ${factor.data.value.toFixed(1)}/100`);
            console.log(`  Weight: ${(factor.data.weight * 100).toFixed(1)}%`);
            console.log(`  Contribution: ${contribution.toFixed(2)}`);
            console.log(`  ${factor.data.explanation}`);
        }
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
    }
}

// Run examples
async function runAll() {
    await basicExample();
    await batchExample();
    await customWeightsExample();
    await offlineModeExample();
    await detailedAnalysisExample();
}

// Uncomment to run:
// runAll().catch(console.error);
