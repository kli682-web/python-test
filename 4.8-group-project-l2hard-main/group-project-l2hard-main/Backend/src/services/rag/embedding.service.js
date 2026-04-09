import fs from 'fs/promises';
import path from 'path';

const DEFAULT_EMBEDDING_DIMENSION = 128;

const tokenize = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const hashToken = (token, dimension = DEFAULT_EMBEDDING_DIMENSION) => {
  let hash = 0;

  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) % dimension;
  }

  return hash;
};

const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return vector.map((value) => value / magnitude);
};

const ensureDirectory = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

export const generateEmbedding = (text = '', dimension = DEFAULT_EMBEDDING_DIMENSION) => {
  const vector = new Array(dimension).fill(0);

  tokenize(text).forEach((token) => {
    const slot = hashToken(token, dimension);
    vector[slot] += 1;
  });

  return normalizeVector(vector);
};

export const batchGenerateEmbeddings = async (documents = [], options = {}) => {
  const dimension = options.dimension || DEFAULT_EMBEDDING_DIMENSION;

  return documents.map((document) => ({
    documentId: document.id,
    embedding: generateEmbedding(document.content, dimension),
    metadata: document.metadata,
    type: document.type,
    content: document.content,
    updatedAt: new Date().toISOString(),
  }));
};

export const persistEmbeddings = async (entries = [], persistPath) => {
  if (!persistPath) {
    return entries;
  }

  await ensureDirectory(persistPath);
  await fs.writeFile(
    persistPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: entries.length,
        entries,
      },
      null,
      2
    )
  );

  return entries;
};

export const loadPersistedEmbeddings = async (persistPath) => {
  try {
    const fileContent = await fs.readFile(persistPath, 'utf8');
    const parsed = JSON.parse(fileContent);
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

export const reindexEmbeddings = async ({
  documents = [],
  persistPath,
  batchSize = 50,
  logger = console,
} = {}) => {
  const entries = [];

  for (let index = 0; index < documents.length; index += batchSize) {
    const batch = documents.slice(index, index + batchSize);
    logger.info?.(`Embedding batch ${index / batchSize + 1}: ${batch.length} documents`);
    entries.push(...(await batchGenerateEmbeddings(batch)));
  }

  await persistEmbeddings(entries, persistPath);
  logger.info?.(`Embedding reindex completed: ${entries.length} documents`);

  return entries;
};

export const updateEmbeddings = async ({
  existingEntries = [],
  documents = [],
  persistPath,
} = {}) => {
  const nextEntries = new Map(existingEntries.map((entry) => [entry.documentId, entry]));

  (await batchGenerateEmbeddings(documents)).forEach((entry) => {
    nextEntries.set(entry.documentId, entry);
  });

  const serializedEntries = [...nextEntries.values()];
  await persistEmbeddings(serializedEntries, persistPath);
  return serializedEntries;
};
