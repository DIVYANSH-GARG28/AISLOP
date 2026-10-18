import dotenv from 'dotenv';
dotenv.config();

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  modelName: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'granite4.2:3b',
  preferOllama: process.env.PREFER_OLLAMA !== 'false',
};
