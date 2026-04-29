#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const repoRoot = path.resolve(__dirname, '..');
const { TrustScoreAPI } = require(path.join(repoRoot, 'dist/index.js'));

const dataDir = path.join(repoRoot, 'data');
const popularTxt = path.join(dataDir, 'npm-top-1000-popular.txt');
const popularJson = path.join(dataDir, 'npm-top-1000-popular.json');
const rankingJson = path.join(dataDir, 'npm-top-1000-trust-ranking.json');
const rankingCsv = path.join(dataDir, 'npm-top-1000-trust-ranking.csv');
const rankingMd = path.join(dataDir, 'npm-top-1000-trust-ranking.md');

const POPULAR_MAX = 1000;
const CONCURRENCY = 15;

const queries = ['a', 'e', 'i', 'o', 'u', 's', 'r', 't', 'n', 'l', 'react', 'node', 'typescript', 'webpack'];
const pageSize = 250;
const pages = 2;

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                        return;
                    }

                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            })
            .on('error', reject);
    });
}

async function fetchWithRetry(url, retries = 3) {
    let lastError;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await fetchJson(url);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}

function toCsvRow(values) {
    return values
        .map((value) => {
            const text = String(value ?? '');
            if (/[",\n]/.test(text)) {
                return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        })
        .join(',');
}

async function generatePopularPackages() {
    const popularMap = new Map();
    let requests = 0;

    for (const query of queries) {
        for (let page = 0; page < pages; page++) {
            const from = page * pageSize;
            const url = `https://api.npms.io/v2/search?q=${encodeURIComponent(query)}&size=${pageSize}&from=${from}`;

            try {
                const result = await fetchWithRetry(url);
                requests += 1;

                for (const item of result.results || []) {
                    const name = item?.package?.name;
                    const popularity = Number(item?.score?.detail?.popularity ?? -1);
                    if (!name || popularity < 0) {
                        continue;
                    }

                    const previous = popularMap.get(name);
                    if (!previous || popularity > previous.popularity) {
                        popularMap.set(name, {
                            name,
                            popularity,
                            quality: Number(item?.score?.detail?.quality ?? 0),
                            maintenance: Number(item?.score?.detail?.maintenance ?? 0),
                            final: Number(item?.score?.final ?? 0),
                        });
                    }
                }
            } catch {
                // ignora falhas pontuais para evitar interrupcao da geracao inteira
            }
        }
    }

    if (popularMap.size < POPULAR_MAX) {
        throw new Error(`Nao foi possivel coletar ${POPULAR_MAX} pacotes unicos. Coletados: ${popularMap.size}`);
    }

    const packages = Array.from(popularMap.values())
        .sort((a, b) => b.popularity - a.popularity || b.final - a.final)
        .slice(0, POPULAR_MAX)
        .map((pkg, index) => ({ rank: index + 1, ...pkg }));

    return {
        requests,
        uniqueCollected: popularMap.size,
        packages,
    };
}

async function generateTrustRanking(packageNames) {
    const api = new TrustScoreAPI();
    const rows = [];
    const errors = [];
    let index = 0;

    async function worker() {
        while (true) {
            const current = index;
            if (current >= packageNames.length) {
                return;
            }
            index += 1;

            const packageName = packageNames[current];

            try {
                const score = await api.analyzePackage(packageName);
                rows.push({
                    package: score.package,
                    version: score.version,
                    trustScore: Number(score.score.toFixed(2)),
                    confidence: Number(score.confidence.toFixed(2)),
                });
            } catch (error) {
                errors.push({
                    package: packageName,
                    error: error instanceof Error ? error.message : String(error),
                });
            }

            if ((current + 1) % 50 === 0 || current + 1 === packageNames.length) {
                console.log(`progress ${current + 1}/${packageNames.length}`);
            }
        }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    const ranking = rows
        .sort((a, b) => b.trustScore - a.trustScore || b.confidence - a.confidence)
        .map((item, idx) => ({ rank: idx + 1, ...item }));

    return { ranking, errors };
}

async function main() {
    fs.mkdirSync(dataDir, { recursive: true });

    const popular = await generatePopularPackages();

    const popularNames = popular.packages.map((pkg) => pkg.name);
    fs.writeFileSync(popularTxt, `${popularNames.join('\n')}\n`);
    fs.writeFileSync(
        popularJson,
        JSON.stringify(
            {
                source: 'npms.io aggregated search, ranked by score.detail.popularity',
                generatedAt: new Date().toISOString(),
                requests: popular.requests,
                uniqueCollected: popular.uniqueCollected,
                count: popular.packages.length,
                packages: popular.packages,
            },
            null,
            2
        )
    );

    const { ranking, errors } = await generateTrustRanking(popularNames);

    fs.writeFileSync(
        rankingJson,
        JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                sourceList: popularTxt,
                totalInput: popularNames.length,
                totalRanked: ranking.length,
                totalErrors: errors.length,
                ranking,
                errors,
            },
            null,
            2
        )
    );

    const csvRows = [
        toCsvRow(['rank', 'package', 'version', 'trustScore', 'confidence']),
        ...ranking.map((item) => toCsvRow([item.rank, item.package, item.version, item.trustScore, item.confidence])),
    ];
    fs.writeFileSync(rankingCsv, `${csvRows.join('\n')}\n`);

    const top20 = ranking.slice(0, 20);
    const markdown = [
        '# NPM Top 1000 - Trust Score Ranking',
        '',
        `- Generated at: ${new Date().toISOString()}`,
        `- Input packages: ${popularNames.length}`,
        `- Ranked packages: ${ranking.length}`,
        `- Errors: ${errors.length}`,
        '',
        '## Top 20',
        '',
        '| Rank | Package | Version | Trust Score | Confidence |',
        '|---:|---|---|---:|---:|',
        ...top20.map((item) => `| ${item.rank} | ${item.package} | ${item.version} | ${item.trustScore} | ${item.confidence} |`),
        '',
    ].join('\n');

    fs.writeFileSync(rankingMd, markdown);
    console.log(`done ranked=${ranking.length} errors=${errors.length}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});