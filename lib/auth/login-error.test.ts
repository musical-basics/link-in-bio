import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENERIC_LOGIN_ERROR, loginErrorMessage, UP_CANCELLED_MESSAGE } from './login-error.ts';

test('no error, no message', () => {
    assert.equal(loginErrorMessage(undefined), null);
    assert.equal(loginErrorMessage(null), null);
    assert.equal(loginErrorMessage(''), null);
    assert.equal(loginErrorMessage([]), null);
});

test('a cancelled or unfinished Ultimate Pianist sign-in gets its own message', () => {
    assert.equal(loginErrorMessage('OAuthCallbackError'), UP_CANCELLED_MESSAGE);
    assert.equal(loginErrorMessage(['OAuthCallbackError', 'x']), UP_CANCELLED_MESSAGE);
});

test('every other code gets the generic message, never the raw code', () => {
    for (const code of ['Configuration', 'AccessDenied', 'Verification', 'CredentialsSignin', 'toString', '__proto__', '<script>alert(1)</script>']) {
        const message = loginErrorMessage(code);
        assert.equal(message, GENERIC_LOGIN_ERROR, code);
        assert.ok(!message?.includes(code), code);
    }
});
