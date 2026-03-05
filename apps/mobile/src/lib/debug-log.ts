/**
 * Debug session logging. Posts to ingest endpoint for analysis.
 * Do not log secrets (tokens, passwords, API keys, PII).
 */
const INGEST_URL = 'http://127.0.0.1:7911/ingest/459128a5-6b41-41d4-870b-df3d70321c44';
const SESSION_ID = 'a3cd1b';

export function debugLog(p: {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
}) {
  const payload = {
    sessionId: SESSION_ID,
    location: p.location,
    message: p.message,
    data: p.data ?? {},
    timestamp: Date.now(),
    ...(p.hypothesisId && { hypothesisId: p.hypothesisId }),
  };
  fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION_ID },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
