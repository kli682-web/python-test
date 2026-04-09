import dotenv from 'dotenv';
import { AIProvider, buildJsonInstruction } from './aiProvider.js';

dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/chat/completions';

/**
 * Extracts text content from DeepSeek API response.
 * @param {Object} data - API response.
 * @returns {string} Message content.
 */
const extractText = (data) =>
  data?.choices?.[0]?.message?.content?.trim?.() || '';

/**
 * Removes JSON code fences from LLM output.
 * @param {string} value - Raw text.
 * @returns {string} Clean text.
 */
const stripCodeFence = (value = '') =>
  value
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

/**
 * Parses SSE event stream into JSON payload.
 * @param {string} eventText - Raw SSE data.
 * @returns {Object|null} Parsed payload.
 */
const parseSseEvent = (eventText) => {
  const payloadLines = eventText
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);

  if (!payloadLines.length) return null;

  const rawPayload = payloadLines.join('\n');
  if (rawPayload === '[DONE]') return null;

  return JSON.parse(rawPayload);
};

/**
 * Fallback title from latest user message.
 * @param {Array} messages - Conversation.
 * @returns {string} Short title.
 */
const fallbackTitleFromMessages = (messages = []) => {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && typeof message.content === 'string')
    ?.content;

  if (!latestUserMessage) return 'New Chat';

  return latestUserMessage.split(/\s+/).slice(0, 5).join(' ') || 'New Chat';
};

/**
 * DeepSeek AI provider implementation.
 * Supports chatCompletion, streamChatCompletion, generateTitle.
 */
export class DeepSeekProvider extends AIProvider {
  constructor({
    apiKey = DEEPSEEK_API_KEY,
    model = DEEPSEEK_MODEL,
    apiBase = DEEPSEEK_API_BASE,
  } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.apiBase = apiBase;
  }

  hasCredentials() {
    return Boolean(this.apiKey);
  }

  buildHeaders() {
    if (!this.apiKey) {
      throw new Error('Missing DEEPSEEK_API_KEY');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  buildMessages({ systemPrompt, messages = [], jsonSchemaDescription }) {
    const normalizedMessages = messages
      .filter((message) => typeof message?.content === 'string' && message.content.trim())
      .map((message) => ({
        role: message.role === 'assistant' || message.role === 'model' ? 'assistant' : 'user',
        content: message.content.trim(),
      }));

    const systemParts = [systemPrompt?.trim()].filter(Boolean);

    if (jsonSchemaDescription) {
      systemParts.push(buildJsonInstruction(jsonSchemaDescription));
    }

    const systemMessage = systemParts.length
      ? [{ role: 'system', content: systemParts.join('\n\n') }]
      : [];

    return [...systemMessage, ...normalizedMessages];
  }

  async chatCompletion({
    systemPrompt,
    messages = [],
    temperature = 0.3,
    jsonSchemaDescription,
  }) {
    const response = await fetch(this.apiBase, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.model,
        temperature,
        stream: false,
        messages: this.buildMessages({ systemPrompt, messages, jsonSchemaDescription }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek chat request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = extractText(data);

    if (!jsonSchemaDescription) {
      return { text };
    }

    const normalizedText = stripCodeFence(text);
    return {
      text: normalizedText,
      json: JSON.parse(normalizedText),
    };
  }

  async streamChatCompletion({
    systemPrompt,
    messages = [],
    temperature = 0.3,
  }) {
    const response = await fetch(this.apiBase, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.model,
        temperature,
        stream: true,
        messages: this.buildMessages({ systemPrompt, messages }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek streaming request failed: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('DeepSeek streaming response body is missing');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    return {
      async *[Symbol.asyncIterator]() {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split(/\n\s*\n/);
          buffer = events.pop() ?? '';

          for (const eventText of events) {
            const payload = parseSseEvent(eventText);
            const text = payload?.choices?.[0]?.delta?.content ?? '';

            if (text) {
              yield { text };
            }
          }
        }
      },
    };
  }

  async generateTitle(messages = []) {
    if (!this.hasCredentials()) {
      return fallbackTitleFromMessages(messages);
    }

    const prompt = `Generate a concise chat title of at most 5 words.
Return plain text only.

Conversation:
${messages.map((message) => `${message.role}: ${message.content}`).join('\n')}`;

    const result = await this.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    return result.text.replace(/^["']|["']$/g, '').trim() || fallbackTitleFromMessages(messages);
  }
}

let deepSeekProviderInstance;

export const getDeepSeekProvider = () => {
  if (!deepSeekProviderInstance) {
    deepSeekProviderInstance = new DeepSeekProvider();
  }

  return deepSeekProviderInstance;
};
