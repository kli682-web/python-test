import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import "./models/index.js";
import apiRouter from './routes/api.js';
import cors from 'cors';

dotenv.config();


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));


app.get('/', (req, res) => {
    res.send('Backend is running');
});

//api routes
app.use('/api', apiRouter);

const bootstrap = async () => {
    const isDatabaseConnected = await connectDB();

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);

        if (!isDatabaseConnected) {
            console.warn('MongoDB is unavailable. AI routes can still work, but DB-backed routes may fail until the connection is restored.');
        }
    });
};

bootstrap();
