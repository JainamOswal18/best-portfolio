const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function normalizeError(err) {
  if (!err) return 'unknown error';
  if (typeof err === 'string') return err;
  if (err.error) return err.error;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return 'unknown error';
  }
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function apiGet(path, { signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { signal, headers: { Accept: 'application/json' } });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error(`network error: ${normalizeError(e)}`, { cause: e });
  }
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(normalizeError(body) || `request failed (${res.status})`);
  }
  return body;
}

export async function apiPost(path, body, { signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error(`network error: ${normalizeError(e)}`, { cause: e });
  }
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(normalizeError(data) || `request failed (${res.status})`);
  }
  return data;
}

export async function apiStream(path, body, { signal, onToken, onDone, onError } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    onError?.(normalizeError(e));
    return;
  }

  if (!res.ok || !res.body) {
    const data = await parseJsonSafe(res);
    onError?.(normalizeError(data) || `request failed (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIdx;
      while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);
        const event = parseSSEEvent(rawEvent);
        if (!event) continue;

        if (event.event === 'done') {
          onDone?.();
          return;
        }
        if (event.event === 'error') {
          onError?.(event.data?.error || 'stream error');
          return;
        }
        if (event.data?.token != null) {
          onToken?.(event.data.token);
        }
      }
    }
    onDone?.();
  } catch (e) {
    if (e.name === 'AbortError') return;
    onError?.(normalizeError(e));
  }
}

function parseSSEEvent(raw) {
  const lines = raw.split('\n');
  let eventName = 'message';
  const dataLines = [];
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (!dataLines.length) return { event: eventName, data: null };
  const dataStr = dataLines.join('\n');
  let data;
  try {
    data = JSON.parse(dataStr);
  } catch {
    data = { raw: dataStr };
  }
  return { event: eventName, data };
}

export function getApiBase() {
  return BASE;
}
