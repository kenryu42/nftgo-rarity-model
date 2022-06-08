import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const metadata = require('./bayc_metadata.json');
const collectionSize = metadata.length;
const scores = [];

// Jaccard Distance function
const jaccardDistance = (a, b) => {
    const aSet = new Set(a.attributes.map((a) => a.trait_type + a.value));
    const bSet = new Set(b.attributes.map((b) => b.trait_type + b.value));
    const union = new Set([...aSet, ...bSet]);
    const intersection = new Set([...aSet].filter((x) => bSet.has(x)));

    return 1 - intersection.size / union.size;
};

const dp = [...Array(collectionSize)].map(() => Array(collectionSize).fill(0));

// Iterate through collection and calculate the jaracard distance average score
for (let i = 0; i < collectionSize; i++) {
	console.log(`Calculating jaccard distance for tokenId ${i}...`);
    let score = 0;

    for (let j = 0; j < collectionSize; j++) {
        if (i !== j) {
            if (dp[i][j]) {
                score += dp[i][j];
            } else {
                const jd = jaccardDistance(metadata[i], metadata[j]);
                score += jd;
                dp[i][j] = jd;
                dp[j][i] = jd;
            }
        }
    }

    const averageScore = score / (collectionSize - 1);

    scores.push(averageScore);
}

const minScore = Math.min(...scores);
const maxScore = Math.max(...scores);

// normalize the final average score and calculate the rarity score
scores.forEach((score, index) => {
    const zScore = (score - minScore) / (maxScore - minScore);

    metadata[index].rarityScore = zScore * 100;
});

// sort the metadata by rarity score
metadata.sort((a, b) => b.rarityScore - a.rarityScore);

// add rank field to metadata
for (let i = 0; i < collectionSize; i++) {
    metadata[i].rank = i + 1;
}

fs.writeFileSync('bayc_ranking.json', JSON.stringify(metadata, null, 4));
console.log(`\nResult saved to bayc_ranking.json`);
