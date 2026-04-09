export const requestChatResponse = async (messages) =>
  fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

export const requestConversationTitle = async (messages) => {
  const response = await fetch('/api/ai/title', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    throw new Error('Failed to generate title');
  }

  return response.json();
};
