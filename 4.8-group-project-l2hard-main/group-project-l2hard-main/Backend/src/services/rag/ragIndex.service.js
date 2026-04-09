import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { batchGenerateEmbeddings, loadPersistedEmbeddings, persistEmbeddings } from './embedding.service.js';
import { buildDocumentChunks } from './chunking.service.js';
import { buildRagDocuments } from './ragDocumentBuilder.js';
import { InMemoryVectorStore } from './vectorStore.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAG_DATA_DIR = path.resolve(__dirname, '../../data/rag');
const DOCUMENT_EMBEDDINGS_PATH = path.join(RAG_DATA_DIR, 'document-embeddings.json');
const CHUNK_EMBEDDINGS_PATH = path.join(RAG_DATA_DIR, 'chunk-embeddings.json');
const STATUS_PATH = path.join(RAG_DATA_DIR, 'status.json');

const state = {
  ready: false,
  loading: false,
  loadedAt: null,
  lastIndexedAt: null,
  datasetSignature: null,
  documentCount: 0,
  chunkCount: 0,
  vectorEntryCount: 0,
  chunkVectorEntryCount: 0,
  persistPaths: {
    documents: DOCUMENT_EMBEDDINGS_PATH,
    chunks: CHUNK_EMBEDDINGS_PATH,
    status: STATUS_PATH,
  },
  docs: [],
  chunks: [],
  documentStore: new InMemoryVectorStore([]),
  chunkStore: new InMemoryVectorStore([]),
};

/**
 * Generates signature for dataset to detect changes.
 * @param {Object} dataset - Dataset object.
 * @returns {string} JSON signature.
 */
const buildDatasetSignature = (dataset = {}) => {
  const restaurantIds = (dataset.availableRestaurants || []).map((item) => String(item._id)).sort();
  const menuIds = (dataset.availableMenuItems || []).map((item) => String(item.id)).sort();

  return JSON.stringify({
    restaurantCount: restaurantIds.length,
    menuCount: menuIds.length,
    restaurantIds,
    menuIds,
  });
};

/**
 * Ensures RAG data directory exists.
 */
const ensureDirectory = async () => {
  await fs.mkdir(RAG_DATA_DIR, { recursive: true });
};

const attachDocumentSource = (entries = [], documentsById = new Map()) =>
  entries
    .map((entry) => {
      const document = documentsById.get(entry.documentId);
      if (!document) return null;

      return {
        ...entry,
        metadata: document.metadata,
        type: document.type,
        content: document.content,
        document,
      };
    })
    .filter(Boolean);

const attachChunkSource = (entries = [], chunksById = new Map()) =>
  entries
    .map((entry) => {
      const chunk = chunksById.get(entry.documentId);
      if (!chunk) return null;

      return {
        ...entry,
        metadata: chunk.metadata,
        type: chunk.type,
        content: chunk.content,
        chunk,
      };
    })
    .filter(Boolean);

const writeStatusFile = async () => {
  await ensureDirectory();
  await fs.writeFile(
    STATUS_PATH,
    JSON.stringify(
      {
        ready: state.ready,
        loading: state.loading,
        loadedAt: state.loadedAt,
        lastIndexedAt: state.lastIndexedAt,
        datasetSignature: state.datasetSignature,
        documentCount: state.documentCount,
        chunkCount: state.chunkCount,
        vectorEntryCount: state.vectorEntryCount,
        chunkVectorEntryCount: state.chunkVectorEntryCount,
        persistPaths: state.persistPaths,
      },
      null,
      2
    )
  );
};

const hydrateState = async ({ documents, chunks, documentEntries, chunkEntries, datasetSignature }) => {
  state.docs = documents;
  state.chunks = chunks;
  state.documentStore = new InMemoryVectorStore(documentEntries);
  state.chunkStore = new InMemoryVectorStore(chunkEntries);
  state.documentCount = documents.length;
  state.chunkCount = chunks.length;
  state.vectorEntryCount = documentEntries.length;
  state.chunkVectorEntryCount = chunkEntries.length;
  state.datasetSignature = datasetSignature;
  state.ready = true;
  state.loading = false;
  state.loadedAt = new Date().toISOString();
  state.lastIndexedAt = new Date().toISOString();
  await writeStatusFile();
};

/**
 * Ensures RAG index is built/loaded for dataset.
 * Handles embedding, chunking, persistence, reuse check.
 * @param {Object} dataset - Restaurants/menu items.
 * @param {boolean} [forceReindex=false] - Rebuild if true.
 * @param {Object} [logger=console] - Logger.
 * @returns {Object} Index state.
 */
export const ensureRagIndex = async ({ dataset, forceReindex = false, logger = console } = {}) => {
  const datasetSignature = buildDatasetSignature(dataset);

  if (!forceReindex && state.ready && state.datasetSignature === datasetSignature) {
    return state;
  }

  state.loading = true;
  await writeStatusFile();

  const { restaurantDocuments, menuItemDocuments } = buildRagDocuments(dataset);
  const documents = [...menuItemDocuments, ...restaurantDocuments];
  const chunks = buildDocumentChunks(documents);
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));

  let persistedDocumentEntries = [];
  let persistedChunkEntries = [];

  if (!forceReindex) {
    persistedDocumentEntries = await loadPersistedEmbeddings(DOCUMENT_EMBEDDINGS_PATH);
    persistedChunkEntries = await loadPersistedEmbeddings(CHUNK_EMBEDDINGS_PATH);
  }

  const canReuseDocumentEmbeddings =
    !forceReindex &&
    persistedDocumentEntries.length === documents.length &&
    documents.every((document) => persistedDocumentEntries.some((entry) => entry.documentId === document.id));

  const canReuseChunkEmbeddings =
    !forceReindex &&
    persistedChunkEntries.length === chunks.length &&
    chunks.every((chunk) => persistedChunkEntries.some((entry) => entry.documentId === chunk.id));

  const documentEntries = canReuseDocumentEmbeddings
    ? attachDocumentSource(persistedDocumentEntries, documentsById)
    : attachDocumentSource(await batchGenerateEmbeddings(documents), documentsById);

  const chunkEntries = canReuseChunkEmbeddings
    ? attachChunkSource(persistedChunkEntries, chunksById)
    : attachChunkSource(await batchGenerateEmbeddings(chunks), chunksById);

  if (!canReuseDocumentEmbeddings) {
    logger.info?.(`Persisting ${documentEntries.length} document embeddings`);
    await persistEmbeddings(documentEntries, DOCUMENT_EMBEDDINGS_PATH);
  }

  if (!canReuseChunkEmbeddings) {
    logger.info?.(`Persisting ${chunkEntries.length} chunk embeddings`);
    await persistEmbeddings(chunkEntries, CHUNK_EMBEDDINGS_PATH);
  }

  await hydrateState({ documents, chunks, documentEntries, chunkEntries, datasetSignature });
  return state;
};

export const getRagIndexState = () => ({
  ready: state.ready,
  loading: state.loading,
  loadedAt: state.loadedAt,
  lastIndexedAt: state.lastIndexedAt,
  datasetSignature: state.datasetSignature,
  documentCount: state.documentCount,
  chunkCount: state.chunkCount,
  vectorEntryCount: state.vectorEntryCount,
  chunkVectorEntryCount: state.chunkVectorEntryCount,
  persistPaths: state.persistPaths,
});

export const getRagIndexSnapshot = () => state;

export const readPersistedRagStatus = async () => {
  try {
    const content = await fs.readFile(STATUS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return getRagIndexState();
    }

    throw error;
  }
};
