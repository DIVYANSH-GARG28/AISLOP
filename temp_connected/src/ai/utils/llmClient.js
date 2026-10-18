import { config } from '../config.js';

/**
 * Attempt to query local Ollama instance running Qwen 2.5 3B at http://localhost:11434.
 */
async function tryOllamaGenerate(prompt, schema) {
  try {
    const host = config.ollamaHost || 'http://localhost:11434';
    const model = config.ollamaModel || 'granite4.2:3b';

    const response = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.2
        }
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.response) {
        const parsedData = JSON.parse(data.response);
        console.log(`[AI Engine] Successfully generated RAG response via Local Ollama (${model}) 🚀`);
        if (schema && typeof schema.parse === 'function') {
          return schema.parse(parsedData);
        }
        return parsedData;
      }
    }
  } catch (e) {
    // Ollama server offline or model loading timeout
  }
  return null;
}

/**
 * Call Local Ollama (Qwen 2.5 3B) or Gemini API with structured JSON response.
 */
export async function generateStructuredJson(prompt, schema) {
  // 1. Try Local Ollama Qwen 2.5 3B if enabled
  if (config.preferOllama) {
    const ollamaResult = await tryOllamaGenerate(prompt, schema);
    if (ollamaResult) return ollamaResult;
  }

  // 2. Try Gemini Cloud API if configured
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    console.warn('[AI Engine] Operating in local offline vector fallback mode.');
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Engine] Gemini API call failed (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return null;
    }

    const parsedData = JSON.parse(candidateText);

    if (schema && typeof schema.parse === 'function') {
      return schema.parse(parsedData);
    }

    return parsedData;
  } catch (error) {
    console.error('[AI Engine] Exception in generateStructuredJson:', error.message);
    return null;
  }
}

/**
 * Generate free-form natural language text via Local Ollama (Qwen 2.5 3B) or Gemini.
 */
export async function generateText(prompt) {
  if (config.preferOllama) {
    try {
      const host = config.ollamaHost || 'http://localhost:11434';
      const model = config.ollamaModel || 'granite4.2:3b';

      const response = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.4
          }
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response && data.response.trim()) {
          console.log(`[AI Engine] Generated natural language response via Local Ollama (${model}) 🚀`);
          return data.response.trim();
        }
      }
    } catch (e) {
      console.warn('[AI Engine] Ollama generateText offline or timed out:', e.message);
    }
  }

  // Fallback to Gemini Cloud API if configured
  const apiKey = config.geminiApiKey;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 }
      })
    });
    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
  } catch (err) {
    console.error('[AI Engine] Exception in Gemini generateText:', err.message);
  }

  return null;
}
