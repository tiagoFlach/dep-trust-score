#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { TrustScoreAPI, TrustScore, ScoreWeights } from '../index';
import { formatScoreTable, formatScoreText, formatBatchResults } from './formatters';

const api = new TrustScoreAPI();

yargs(hideBin(process.argv))
    .scriptName('trust-score')
    .usage('$0 <command> [args]')
    .command(
        'check <package>',
        'Check trust score for a package',
        (yargs) =>
            yargs
                .positional('package', {
                    describe: 'NPM package name',
                    type: 'string',
                    demandOption: true,
                })
                .option('output', {
                    alias: 'o',
                    describe: 'Output format',
                    choices: ['json', 'text', 'table'],
                    default: 'text',
                    type: 'string',
                })
                .option('explain', {
                    alias: 'e',
                    describe: 'Show detailed explanation',
                    type: 'boolean',
                    default: false,
                })
                .option('offline', {
                    describe: 'Use offline mode (cache only)',
                    type: 'boolean',
                    default: false,
                })
                .option('refresh', {
                    alias: 'r',
                    describe: 'Force refresh data from npm registry',
                    type: 'boolean',
                    default: false,
                })
                .option('weights', {
                    alias: 'w',
                    describe: 'Custom weights as JSON',
                    type: 'string',
                })
                .option('cache', {
                    describe: 'Cache directory',
                    type: 'string',
                }),
        async (argv) => {
            try {
                const options = argv as any;
                const customWeights = parseWeights(options.weights);

                if (customWeights) {
                    api.setWeights(customWeights);
                }

                const score = await api.analyzePackage(options.package, options.refresh);

                if (options.output === 'json') {
                    console.log(JSON.stringify(score, null, 2));
                } else if (options.output === 'table') {
                    formatScoreTable(score);
                } else {
                    formatScoreText(score);
                }

                if (options.explain) {
                    console.log('\n' + chalk.cyan('=== DETAILED BREAKDOWN ==='));
                    printDetailedExplanation(score);
                }
            } catch (error) {
                console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        }
    )
    .command(
        'batch <packages..>',
        'Analyze multiple packages',
        (yargs) =>
            yargs
                .positional('packages', {
                    describe: 'Package names to analyze',
                    type: 'string',
                    array: true,
                    demandOption: true,
                })
                .option('output', {
                    alias: 'o',
                    describe: 'Output format',
                    choices: ['json', 'text', 'table'],
                    default: 'text',
                    type: 'string',
                })
                .option('threshold', {
                    alias: 't',
                    describe: 'Minimum trust score (packages below are highlighted)',
                    type: 'number',
                    default: 50,
                })
                .option('offline', {
                    describe: 'Use offline mode (cache only)',
                    type: 'boolean',
                    default: false,
                })
                .option('weights', {
                    alias: 'w',
                    describe: 'Custom weights as JSON',
                    type: 'string',
                })
                .option('cache', {
                    describe: 'Cache directory',
                    type: 'string',
                }),
        async (argv) => {
            try {
                const options = argv as any;
                const customWeights = parseWeights(options.weights);

                if (customWeights) {
                    api.setWeights(customWeights);
                }

                const result = await api.analyzePackages(options.packages);

                if (options.output === 'json') {
                    console.log(JSON.stringify(result, null, 2));
                } else {
                    formatBatchResults(result, options.threshold);
                }
            } catch (error) {
                console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        }
    )
    .command(
        'explain <package>',
        'Get detailed explanation of a score',
        (yargs) =>
            yargs
                .positional('package', {
                    describe: 'NPM package name',
                    type: 'string',
                    demandOption: true,
                })
                .option('offline', {
                    describe: 'Use offline mode (cache only)',
                    type: 'boolean',
                    default: false,
                })
                .option('weights', {
                    alias: 'w',
                    describe: 'Custom weights as JSON',
                    type: 'string',
                })
                .option('cache', {
                    describe: 'Cache directory',
                    type: 'string',
                }),
        async (argv) => {
            try {
                const options = argv as any;
                const customWeights = parseWeights(options.weights);

                if (customWeights) {
                    api.setWeights(customWeights);
                }

                const score = await api.analyzePackage(options.package);
                printDetailedExplanation(score);
            } catch (error) {
                console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        }
    )
    .command(
        'cache <action>',
        'Manage local cache',
        (yargs) =>
            yargs
                .positional('action', {
                    describe: 'Cache action',
                    choices: ['clear', 'stats', 'export'],
                    demandOption: true,
                    type: 'string',
                })
                .option('output', {
                    alias: 'o',
                    describe: 'Output format (for export)',
                    choices: ['json', 'csv'],
                    default: 'json',
                    type: 'string',
                }),
        async (argv) => {
            try {
                const action = argv.action as string;

                if (action === 'clear') {
                    api.clearCache();
                    console.log(chalk.green('Cache cleared successfully.'));
                } else if (action === 'stats') {
                    const stats = api.getCacheStats();
                    console.log(chalk.cyan('Cache Statistics:'));
                    console.log(`  Location: ${stats.cacheDir}`);
                    console.log(`  Files: ${stats.fileCount}`);
                    console.log(`  Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
                } else if (action === 'export') {
                    const data = api.exportCacheData();
                    console.log(JSON.stringify(Array.from(data.entries()), null, 2));
                }
            } catch (error) {
                console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        }
    )
    .command(
        'config',
        'Show configuration',
        {},
        async () => {
            try {
                const weights = api.getWeights();
                console.log(chalk.cyan('Current Weights:'));
                console.log(JSON.stringify(weights, null, 2));

                const stats = api.getCacheStats();
                console.log('\n' + chalk.cyan('Cache:'));
                console.log(`  Location: ${stats.cacheDir}`);
                console.log(`  Files: ${stats.fileCount}`);
                console.log(`  Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
            } catch (error) {
                console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        }
    )
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .strict()
    .parseAsync();

/**
 * Parse weights from JSON string
 */
function parseWeights(weightsStr?: string): ScoreWeights | null {
    if (!weightsStr) return null;

    try {
        return JSON.parse(weightsStr);
    } catch (error) {
        console.error(chalk.red('Invalid weights JSON:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

/**
 * Print detailed explanation of score
 */
function printDetailedExplanation(score: TrustScore): void {
    const breakdown = score.breakdown;

    console.log(`\n${chalk.bold('Package:')} ${score.package}@${score.version}`);
    console.log(`${chalk.bold('Overall Score:')} ${getScoreColor(score.score)(score.score.toFixed(1))}/100`);
    console.log(`${chalk.bold('Confidence:')} ${score.confidence.toFixed(1)}%`);

    console.log(`\n${chalk.cyan('Factor Breakdown:')}`);

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
        console.log(`\n  ${chalk.bold(factor.name)}:`);
        console.log(`    Score: ${getScoreColor(factor.data.value)(factor.data.value.toFixed(1))}/100`);
        console.log(`    Weight: ${(factor.data.weight * 100).toFixed(1)}%`);
        console.log(`    Contribution: ${contribution.toFixed(2)}`);
        console.log(`    ${factor.data.explanation}`);

        // Show vulnerabilities details
        if (
            factor.name === 'Vulnerabilities' &&
            'vulnerabilities' in factor.data &&
            Array.isArray((factor.data as any).vulnerabilities) &&
            (factor.data as any).vulnerabilities.length > 0
        ) {
            console.log('    Vulnerabilities:');
            for (const vuln of (factor.data as any).vulnerabilities) {
                const vulnColor = vuln.severity === 'critical' ? chalk.red : vuln.severity === 'high' ? chalk.yellow : chalk.gray;
                console.log(`      - [${vulnColor(vuln.severity.toUpperCase())}] ${vuln.id}: ${vuln.description}`);
            }
        }
    }
}

/**
 * Get color function for score
 */
function getScoreColor(score: number) {
    if (score >= 80) return chalk.green;
    if (score >= 60) return chalk.yellow;
    if (score >= 40) return chalk.rgb(255, 165, 0); // Orange
    return chalk.red;
}
