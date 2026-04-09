import mongoose from 'mongoose';
import { loadDataset } from '../services/dataset.service.js';
import { reindexRagForDataset } from '../services/rag/retriever.service.js';
import dotenv from 'dotenv';

dotenv.config();
const main = async () => {
    try {
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const dataset = await loadDataset();
        const result = await reindexRagForDataset({ dataset, logger: console });

        console.log('RAG reindex complete');
        console.log(JSON.stringify(result, null, 2));

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    } catch (error) {
        console.error('RAG reindex failed:', error);
        process.exit(1);
    }
};

main();