import express from 'express';
import { loadDataset } from '../services/dataset.service.js';
import { getRagStatus, reindexRagForDataset, retrieveCandidates } from '../services/rag/retriever.service.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  try {
    const status = await getRagStatus();
    return res.json(status);
  } catch (error) {
    console.error('RAG status error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to read RAG status' });
  }
});

router.post('/reindex', async (req, res) => {
  try {
    const dataset = await loadDataset();
    const status = await reindexRagForDataset({ dataset });
    return res.json({ ok: true, status });
  } catch (error) {
    console.error('RAG reindex error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to reindex RAG data' });
  }
});

router.post('/search/debug', async (req, res) => {
  try {
    const latestUserMessage = String(req.body?.query || req.body?.message || '').trim();

    if (!latestUserMessage) {
      return res.status(400).json({ error: 'A query string is required.' });
    }

    const dataset = await loadDataset();
    const result = await retrieveCandidates({
      dataset,
      latestUserMessage,
      debug: true,
    });

    return res.json({
      parsed_query: result.query,
      rag_status: result.debug?.ragStatus,
      keyword_results: result.debug?.keywordResults || [],
      vector_results: result.debug?.vectorResults || [],
      semantic_results: result.debug?.semanticResults || [],
      chunk_results: result.debug?.chunkResults || [],
      fusion_breakdown: result.debug?.fusionBreakdown || [],
      final_candidates: result.debug?.finalCandidates || [],
      supporting_chunks: result.supportingChunks || [],
    });
  } catch (error) {
    console.error('RAG debug search error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to run debug search' });
  }
});

export default router;
