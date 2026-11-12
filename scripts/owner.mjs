#!/usr/bin/env node
/**
 * Owner API client: edit a Musical Bio without logging in to the admin.
 *
 *   node --env-file=.env.local scripts/owner.mjs <METHOD> <path> ['<json body>']
 *
 * Credentials come from the environment, by name, never from arguments:
 *   MB_OWNER_EMAIL     account email (default: yulionel829@gmail.com)
 *   MB_OWNER_PASSWORD  account password (falls back to ADMIN_PASSWORD)
 *   MB_BASE_URL        default https://www.musical.bio (musical.bio redirects there,
 *                      and a redirect to another host drops the credentials)
 *
 * Examples:
 *   scripts/owner.mjs GET /                         # profile, groups, links (ids, order)
 *   scripts/owner.mjs POST /links '{"title":"Portfolio","url":"https://…","group":"Work"}'
 *   scripts/owner.mjs PATCH /links/<id> '{"isActive":false}'
 *   scripts/owner.mjs PUT /links/order '{"ids":["…","…"]}'
 *   scripts/owner.mjs POST /groups '{"name":"Press"}'
 *   scripts/owner.mjs PATCH /groups/<id> '{"description":"…"}'
 *   scripts/owner.mjs PUT /groups/order '{"ids":["…"]}'
 *   scripts/owner.mjs PATCH /profile '{"bio":"…"}'
 *
 * Changing the password (the new one comes from the environment, never argv):
 *   MB_NEW_PASSWORD='…' node --env-file=.env.local scripts/owner.mjs set-password
 * Prints only success or the error; then store the new password where
 * ADMIN_PASSWORD / MB_OWNER_PASSWORD come from, or the next call gets 401.
 */

const args = process.argv.slice(2);
const setPassword = args[0] === 'set-password';
let [method = '', path = '', body] = args;
if (setPassword) {
    if (args.length > 1) {
        console.error('set-password takes no arguments: put the new password in MB_NEW_PASSWORD.');
        process.exit(2);
    }
    const next = process.env.MB_NEW_PASSWORD;
    if (!next) {
        console.error('Set MB_NEW_PASSWORD in the environment to the new password.');
        process.exit(2);
    }
    [method, path, body] = ['POST', '/password', JSON.stringify({ password: next })];
}
const METHODS = ['GET', 'POST', 'PATCH', 'PUT'];
if (!METHODS.includes(method.toUpperCase()) || !path.startsWith('/')) {
    console.error("usage: node --env-file=.env.local scripts/owner.mjs <GET|POST|PATCH|PUT> </path> ['<json>']");
    console.error("       MB_NEW_PASSWORD=… node --env-file=.env.local scripts/owner.mjs set-password");
    process.exit(2);
}

const email = process.env.MB_OWNER_EMAIL || 'yulionel829@gmail.com';
const password = process.env.MB_OWNER_PASSWORD || process.env.ADMIN_PASSWORD;
if (!password) {
    console.error('Set MB_OWNER_PASSWORD (or ADMIN_PASSWORD) in the environment, e.g. node --env-file=.env.local …');
    process.exit(2);
}
const base = (process.env.MB_BASE_URL || 'https://www.musical.bio').replace(/\/+$/, '');

if (body !== undefined) {
    try {
        JSON.parse(body);
    } catch {
        console.error('The body must be valid JSON.');
        process.exit(2);
    }
}

const url = `${base}/api/owner${path === '/' ? '' : path}`;
const res = await fetch(url, {
    method: method.toUpperCase(),
    headers: {
        authorization: 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64'),
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body,
    redirect: 'manual',
});
if (res.status >= 300 && res.status < 400) {
    console.error(`${url} redirects to ${res.headers.get('location')}; set MB_BASE_URL to the final host (credentials are not sent across a redirect).`);
    process.exit(1);
}
const text = await res.text();
if (setPassword) {
    // Server errors never contain the password; success prints nothing from the response.
    if (res.ok) {
        console.log('Password changed. Update ADMIN_PASSWORD / MB_OWNER_PASSWORD to the new password before the next call.');
        process.exit(0);
    }
    console.error(`HTTP ${res.status}: ${text}`);
    process.exit(1);
}
let out = text;
try {
    out = JSON.stringify(JSON.parse(text), null, 2);
} catch {}
console.log(out);
if (!res.ok) {
    console.error(`HTTP ${res.status} ${method.toUpperCase()} ${url}`);
    process.exit(1);
}
