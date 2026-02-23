import 'react-native-url-polyfill/auto';
import EventSource from 'react-native-sse';
import { PHI4_OPTIMIZED_PROMPT } from './system-prompts';

// You can override this if needed, e.g. from env, but per test project it runs on a physical device pointing to host IP.
// Feel free to replace 192.168.29.33 with your machine's IP, or 10.0.2.2 if on emulator.
export const OLLAMA_API_CONFIG = {
    baseUrl: 'http://192.168.29.33:11434/v1/chat/completions',
    model: 'phi4-mini:latest',
    maxTokens: 4096,
    temperature: 0.7,
    systemPrompt: PHI4_OPTIMIZED_PROMPT,
};

/**
 * Send a message to Local Ollama.
 * @param messages Full conversation history
 * @param onStream Called with each streamed text chunk
 * @returns Full assistant reply
 */
export async function sendOllamaMessage(
    messages: Array<{ role: string; content: string }>,
    onStream: (chunk: string) => void
): Promise<string> {
    console.log("SEND OLLAMA MESSAGE TRIGGERED");

    return new Promise((resolve, reject) => {
        let fullContent = '';

        const requestBody = JSON.stringify({
            model: OLLAMA_API_CONFIG.model,
            messages: [
                { role: 'system', content: OLLAMA_API_CONFIG.systemPrompt },
                ...messages,
            ],
            max_tokens: OLLAMA_API_CONFIG.maxTokens,
            temperature: OLLAMA_API_CONFIG.temperature,
            stream: true,
        });

        console.log("INITIALIZING EVENT SOURCE WITH URL:", OLLAMA_API_CONFIG.baseUrl);

        const es = new EventSource(OLLAMA_API_CONFIG.baseUrl, {
            headers: {
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://hira-ai-app.local',
                'X-Title': 'Hira AI Local Chat',
            },
            method: 'POST',
            body: requestBody,
        });

        es.addEventListener('open', () => {
            console.log("SSE CONNECTION OPENED");
        });

        es.addEventListener('message', (event) => {
            if (event.data === '[DONE]') {
                console.log("SSE STREAM DONE");
                es.close();
                resolve(fullContent);
                return;
            }

            try {
                if (!event.data) return; // Prevent parsing null or empty strings
                const json = JSON.parse(event.data);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                    fullContent += delta;
                    onStream(delta);
                }
            } catch (err: any) {
                console.log("SSE PARSE ERROR:", err.message, "DATA:", event.data);
                // Ignore parse errors on individual chunks
            }
        });

        es.addEventListener('error', (event: any) => {
            console.error("SSE ERROR EVENT:", event);
            es.close();
            // Try to extract the true error message if available
            let errorMsg = 'EventSource connection error';
            if (event.message) {
                errorMsg = String(event.message);
            } else if (event.type === 'error' && event.data) {
                try {
                    const parsedErr = JSON.parse(event.data);
                    console.error("PARSED ERROR DATA:", parsedErr);
                    if (parsedErr.error && parsedErr.error.message) {
                        errorMsg = String(parsedErr.error.message);
                    }
                } catch {
                    console.error("RAW ERROR DATA:", event.data);
                }
            }
            reject(new Error(errorMsg));
        });

        // Ensure we close and resolve if the server closes without [DONE]
        es.addEventListener('close', () => {
            console.log("SSE CONNECTION CLOSED");
            resolve(fullContent);
        });
    });
}
