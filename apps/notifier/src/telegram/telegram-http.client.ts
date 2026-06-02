import * as http from 'node:http';
import * as https from 'node:https';
import { URL } from 'node:url';

export interface HttpJsonResponse<T> {
  status: number;
  body: T;
}

export function postJson<T>(
  url: string,
  payload: unknown,
  timeoutMs: number,
): Promise<HttpJsonResponse<T>> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(payload);
    const transport = parsed.protocol === 'https:' ? https : http;

    const request = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        family: 4,
        timeout: timeoutMs,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');

          try {
            resolve({
              status: response.statusCode ?? 0,
              body: JSON.parse(raw) as T,
            });
          } catch {
            reject(new SyntaxError(`Invalid JSON response (HTTP ${response.statusCode})`));
          }
        });
      },
    );

    request.on('timeout', () => {
      request.destroy();
      reject(Object.assign(new Error('Request timeout'), { code: 'ETIMEDOUT' }));
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}
