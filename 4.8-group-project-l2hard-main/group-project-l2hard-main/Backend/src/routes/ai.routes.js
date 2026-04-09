import express from 'express';
import {
  buildDatasetCountReply,
  detectDatasetCountIntent,
  getLatestUserMessage,
  loadDataset,
} from '../services/dataset.service.js';
import {
  generateConversationTitle,
  getStructuredChatReply,
} from '../services/forkcast-ai.service.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const safeMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const debug = req.query.debug === 'true';

    if (safeMessages.length === 0) {
      return res.status(400).json({ error: 'No chat messages were provided.' });
    }

    const dataset = await loadDataset();
    const latestUserMessage = getLatestUserMessage(safeMessages);
    const datasetCountIntent = detectDatasetCountIntent(latestUserMessage);

    if (datasetCountIntent) {
      return res.json({
        reply_text: buildDatasetCountReply(dataset, datasetCountIntent),
        recommendations: [],
        follow_up_question: null,
      });
    }

    const response = await getStructuredChatReply({
      messages: safeMessages,
      dataset,
      debug,
    });

    return res.json(response);
  } catch (error) {
    console.error('Chat error:', error);

    return res
      .status(500)
      .json({
        error: error instanceof Error ? error.message : 'Failed to generate response',
      });
  }
});

router.post('/title', async (req, res) => {
  try {
    const safeMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];

     if (safeMessages.length === 0) {
      return res.status(400).json({ error: 'No chat messages were provided.' });
    }

    const title = await generateConversationTitle(safeMessages);
    return res.json({ title });
  } catch (error) {
    console.error('Title generation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate title'
    });
  }
});

export default router;
