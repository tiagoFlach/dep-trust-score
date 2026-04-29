import chalk from 'chalk';
import { TrustScore, BatchAnalysisResult } from '../index';

/**
 * Format score as a text output
 */
export function formatScoreText(score: TrustScore): void {
    const color = getScoreColor(score.score);
    const scoreBar = createScoreBar(score.score);

    console.log(`\n${chalk.bold('Package:')} ${score.package}@${score.version}`);
    console.log(`${chalk.bold('Trust Score:')} ${color(score.score.toFixed(1))}/100 ${scoreBar}`);
    console.log(`${chalk.bold('Confidence:')} ${score.confidence.toFixed(1)}%`);

    if (score.vulnerabilities.length > 0) {
        console.log(`\n${chalk.red(`⚠  ${score.vulnerabilities.length} vulnerabilities found`)}`);
    } else {
        console.log(`\n${chalk.green('✓ No known vulnerabilities')}`);
    }
}

/**
 * Format score as a table output
 */
export function formatScoreTable(score: TrustScore): void {
    const breakdown = score.breakdown;

    console.log(`\n${chalk.bold('=== Trust Score Factors ===')}`);
    console.log(`Package: ${score.package}@${score.version}\n`);

    const rows = [
        {
            factor: 'Publication Frequency',
            score: breakdown.publicationFrequency.value,
            weight: breakdown.publicationFrequency.weight,
        },
        {
            factor: 'Package Age',
            score: breakdown.packageAge.value,
            weight: breakdown.packageAge.weight,
        },
        {
            factor: 'Maintainers',
            score: breakdown.maintainers.value,
            weight: breakdown.maintainers.weight,
        },
        {
            factor: 'Version History',
            score: breakdown.versionHistory.value,
            weight: breakdown.versionHistory.weight,
        },
        {
            factor: 'Vulnerabilities',
            score: breakdown.vulnerabilities.value,
            weight: breakdown.vulnerabilities.weight,
        },
        {
            factor: 'Dependencies',
            score: breakdown.dependencies.value,
            weight: breakdown.dependencies.weight,
        },
        {
            factor: 'Abandonment Signals',
            score: breakdown.abandonmentSignals.value,
            weight: breakdown.abandonmentSignals.weight,
        },
        {
            factor: 'Package Quality',
            score: breakdown.packageQuality.value,
            weight: breakdown.packageQuality.weight,
        },
    ];

    console.log(chalk.dim('Factor                       | Score | Weight |'));
    console.log(chalk.dim('------------------------------+-------+--------+'));

    for (const row of rows) {
        const scoreStr = row.score.toFixed(1).padEnd(5);
        const weightStr = (row.weight * 100).toFixed(1).padEnd(6);
        console.log(`${row.factor.padEnd(28)} | ${scoreStr} | ${weightStr}%`);
    }

    console.log(chalk.dim('------------------------------+-------+--------+'));
    const scoreStr = score.score.toFixed(1).padEnd(5);
    console.log(`${'TOTAL SCORE'.padEnd(28)} | ${scoreStr} | 100.0%`);
}

/**
 * Format batch results
 */
export function formatBatchResults(result: BatchAnalysisResult, threshold: number = 50): void {
    console.log(`\n${chalk.bold('=== Batch Analysis Results ===')}\n`);
    console.log(`Total Packages: ${result.summary.totalPackages}`);
    console.log(`Average Score: ${chalk.bold(result.summary.averageScore.toFixed(1))}/100`);
    console.log(`Analysis Time: ${(result.summary.analysisTime / 1000).toFixed(2)}s\n`);

    if (result.summary.criticalCount > 0) {
        console.log(chalk.red(`⚠  ${result.summary.criticalCount} package(s) with critical low trust (< 30)`));
    }

    if (result.summary.lowTrustCount > 0) {
        console.log(chalk.yellow(`⚠  ${result.summary.lowTrustCount} package(s) below threshold (< ${threshold})`));
    }

    console.log(`\n${chalk.bold('Packages:')}\n`);

    // Sort by score descending
    const sorted = result.packages.sort((a, b) => b.score - a.score);

    for (const pkg of sorted) {
        const color = pkg.score >= threshold ? chalk.green : chalk.red;
        const scoreBar = createScoreBar(pkg.score);
        const vulnWarning = pkg.vulnerabilities.length > 0 ? ` ${chalk.red(`(${pkg.vulnerabilities.length} vulns)`)}` : '';
        console.log(`${color(pkg.package.padEnd(40))} ${pkg.score.toFixed(1).padStart(6)}/100 ${scoreBar}${vulnWarning}`);
    }
}

/**
 * Create a visual score bar
 */
function createScoreBar(score: number, width: number = 20): string {
    const filled = Math.round((score / 100) * width);
    const empty = width - filled;

    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);

    const color = getScoreColor(score);
    return `${color(`[${filledBar}${emptyBar}]`)}`;
}

/**
 * Get color function based on score
 */
export function getScoreColor(score: number) {
    if (score >= 80) return chalk.green;
    if (score >= 60) return chalk.yellow;
    if (score >= 40) return chalk.rgb(255, 165, 0); // Orange
    return chalk.red;
}

/**
 * Format as JSON (simple wrapper)
 */
export function formatScoreJSON(score: TrustScore): string {
    return JSON.stringify(score, null, 2);
}
