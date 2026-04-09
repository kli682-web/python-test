/**
 * Base abstract AI provider interface.
 * Subclasses implement chatCompletion, streamChatCompletion, generateTitle.
 */
export class AIProvider {
  async chatCompletion() {
    throw new Error('chatCompletion() must be implemented by the provider');
  }

  async streamChatCompletion() {
    throw new Error('streamChatCompletion() must be implemented by the provider');
  }

  async generateTitle() {
    throw new Error('generateTitle() must be implemented by the provider');
  }
}

/**
 * Builds instruction for LLM JSON mode.
 * @param {string} schemaDescription - Schema text.
 * @returns {string} Full instruction.
 */
export const buildJsonInstruction = (schemaDescription) =>
  [
    'Return valid JSON only.',
    'Do not wrap the JSON in markdown fences.',
    schemaDescription,
  ].join('\n');
