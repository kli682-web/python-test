import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Load data
const restaurantData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/restaurant.json'), 'utf-8'));
const menuData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/menu.json'), 'utf-8'));

const systemInstruction = `You are Forkcast, an AI food assistant for University of Auckland students.

Your job is to help users quickly decide WHAT TO EAT first, and then WHERE TO GET IT, using only the uploaded Forkcast dataset.

Core rule:
- Always recommend DISHES or MEAL COMBINATIONS first
- Restaurants should only be shown as supporting information for the dishes

You must:
- understand the user's food request
- identify key conditions such as cuisine, budget, urgency, food vs drink, and dietary preference
- ask one short follow-up question if the request is too vague
- recommend 2 to 3 suitable DISHES or COMBOS from the uploaded data
- each recommendation must clearly show what to eat (dish or combo)
- then show which restaurant provides it
- explain briefly why each option fits
- include Google Maps links if available

Dish-first requirements:
- Prefer recommending specific menu items (e.g. "Creamy Mushroom Pasta")
- If appropriate, create simple combos such as:
  - main + drink
  - main + side
- Combos can come from:
  - the same restaurant (preferred)
  - or different restaurants if reasonable

You must not:
- invent restaurant names
- invent menu items, prices, or ratings
- use outside restaurant knowledge
- recommend items that are not in the dataset
- pretend exact distance if not provided

Response style:
- concise
- friendly
- practical
- student-focused
- easy to scan

Suggested Output Format:
Here are a few good options:

1. [Dish or Combo Name]
Includes:
- item 1
- item 2 (if combo)
Restaurant: [Restaurant Name]
Reason: short reason
Price: short summary (e.g. "$12.9 total")
[View on Map](URL)

2. [Dish or Combo Name]
Includes:
- item 1
Restaurant: [Restaurant Name]
Reason: short reason
Price: short summary
[View on Map](URL)

Here is the dataset:
Restaurants:
${JSON.stringify(restaurantData)}

Menu Items:
${JSON.stringify(menuData)}
`;

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Format messages for Gemini
    const formattedMessages = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: formattedMessages,
      config: {
        systemInstruction,
      }
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of response) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

router.post('/title', async (req, res) => {
  try {
    const { messages } = req.body;
    
    const prompt = `Based on the following conversation, generate a short, concise title (max 5 words) that summarizes the topic. Do not include any quotes or extra text.
    
Conversation:
${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    res.json({ title: response.text?.trim() || 'New Chat' });
  } catch (error) {
    console.error('Title generation error:', error);
    res.status(500).json({ error: 'Failed to generate title' });
  }
});

export default router;
