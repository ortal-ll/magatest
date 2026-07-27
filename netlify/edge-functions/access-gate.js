/**
 * Netlify Edge: without a valid access cookie → redirect to /access.html.
 * Validates the session against Upstash so a forged cookie cannot open the site.
 */

import {
  ACCESS_COOKIE_NAME,
  isProtectedAccessPath,
  isPublicAccessPath,
  isValidSessionToken,
  parseCookieHeader,
  accessSessionKey,
} from '../lib/access-shared.js';

async function redisGet(key) {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL')?.replace(/\/$/, '');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  // undefined = Redis not configured (skip server validation)
  if (!url || !token) return undefined;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['GET', key]),
  });
  if (!res.ok) return undefined;
  const data = await res.json().catch(() => ({}));
  return data.result ?? null;
}

function nextParam(url) {
  const name =
    url.pathname === '/' ? 'index.html' : url.pathname.split('/').pop() || 'index.html';
  const next = `${name}${url.search || ''}`;
  return encodeURIComponent(next);
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (isPublicAccessPath(path) || !isProtectedAccessPath(path)) {
    return context.next();
  }

  // API routes: leave 401/403 to the function handlers (JSON), don't HTML-redirect.
  if (path.startsWith('/api/')) {
    return context.next();
  }

  const cookies = parseCookieHeader(request.headers.get('cookie') || '');
  const token = cookies[ACCESS_COOKIE_NAME] || '';

  if (!isValidSessionToken(token)) {
    return Response.redirect(
      new URL(`/access.html?next=${nextParam(url)}`, url),
      302
    );
  }

  try {
    const raw = await redisGet(accessSessionKey(token));
    // Redis not configured / transient HTTP error → rely on client gate
    if (raw === undefined) {
      return context.next();
    }
    if (!raw) {
      const res = Response.redirect(
        new URL(`/access.html?next=${nextParam(url)}`, url),
        302
      );
      res.headers.append(
        'Set-Cookie',
        `${ACCESS_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
      );
      return res;
    }
  } catch {
    // Redis blip: allow through; client gate will re-check
  }

  return context.next();
};

export const config = { path: '/*' };
