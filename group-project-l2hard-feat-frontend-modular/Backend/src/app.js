import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import "./models/index.js";
import apiRouter from './routes/api.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Backend is running');
});

//api routes
app.use('/api', apiRouter);


connectDB();

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});