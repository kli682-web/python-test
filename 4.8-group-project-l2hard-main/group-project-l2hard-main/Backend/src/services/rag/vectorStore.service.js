const cosineSimilarity = (vectorA = [], vectorB = []) => {
  if (!vectorA.length || vectorA.length !== vectorB.length) return 0;

  let score = 0;
  for (let index = 0; index < vectorA.length; index += 1) {
    score += vectorA[index] * vectorB[index];
  }

  return score;
};

export class InMemoryVectorStore {
  constructor(entries = []) {
    this.entries = entries;
  }

  upsert(entries = []) {
    const entryById = new Map(this.entries.map((entry) => [entry.documentId, entry]));
    entries.forEach((entry) => entryById.set(entry.documentId, entry));
    this.entries = [...entryById.values()];
  }

  query({
    embedding,
    topK = 8,
    filter,
  }) {
    return this.entries
      .filter((entry) => (typeof filter === 'function' ? filter(entry) : true))
      .map((entry) => ({
        ...entry,
        score: cosineSimilarity(embedding, entry.embedding),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, topK);
  }
}
