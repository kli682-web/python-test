const DEFAULT_WEIGHTS = {
  keyword: 0.32,
  vector: 0.24,
  semantic: 0.22,
  chunk: 0.1,
  business: 0.12,
};

const normalizeEntries = (entries = []) => {
  const scores = entries.map((entry) => Number(entry.score) || 0);
  const maxScore = Math.max(...scores, 0);
  const minScore = Math.min(...scores, 0);

  return entries.map((entry, index) => {
    const rawScore = Number(entry.score) || 0;
    const normalized = maxScore === minScore ? (rawScore > 0 ? 1 : 0) : (rawScore - minScore) / (maxScore - minScore);
    const rankBonus = Math.max(0, 1 - index * 0.04);

    return {
      ...entry,
      rawScore,
      normalizedScore: Number(normalized.toFixed(4)),
      rankBonus: Number(rankBonus.toFixed(4)),
    };
  });
};

export const fuseRetrievalScores = ({ groups = {}, weights = DEFAULT_WEIGHTS } = {}) => {
  const fusedById = new Map();

  Object.entries(groups).forEach(([groupName, entries]) => {
    const safeEntries = normalizeEntries(entries || []);
    const weight = weights[groupName] ?? 0;

    safeEntries.forEach((entry) => {
      const weightedScore = entry.normalizedScore * weight + entry.rankBonus * 0.02;
      const current = fusedById.get(entry.documentId) || {
        documentId: entry.documentId,
        document: entry.document,
        totalScore: 0,
        breakdown: {},
      };

      current.totalScore += weightedScore;
      current.breakdown[groupName] = {
        raw: Number(entry.rawScore.toFixed(4)),
        normalized: entry.normalizedScore,
        weight,
        weighted: Number(weightedScore.toFixed(4)),
      };
      fusedById.set(entry.documentId, current);
    });
  });

  return [...fusedById.values()]
    .map((entry) => ({
      ...entry,
      totalScore: Number(entry.totalScore.toFixed(4)),
    }))
    .sort((left, right) => right.totalScore - left.totalScore);
};

export const getFusionWeights = () => ({ ...DEFAULT_WEIGHTS });
