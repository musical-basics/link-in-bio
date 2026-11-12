import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changePasswordInput, newPasswordProblem, PASSWORD_MAX, PASSWORD_MIN } from './password.ts';

const current = 'the-current-password';

test('newPasswordProblem: length bounds', () => {
    assert.equal(PASSWORD_MIN, 12);
    assert.equal(PASSWORD_MAX, 200);
    assert.match(newPasswordProblem('', current) ?? '', /at least 12/);
    assert.match(newPasswordProblem('a'.repeat(11), current) ?? '', /at least 12/);
    assert.equal(newPasswordProblem('a'.repeat(12), current), null);
    assert.equal(newPasswordProblem('a'.repeat(200), current), null);
    assert.match(newPasswordProblem('a'.repeat(201), current) ?? '', /at most 200/);
});

test('newPasswordProblem: must differ from the current password', () => {
    assert.match(newPasswordProblem(current, current) ?? '', /different/);
    assert.equal(newPasswordProblem(current + '!', current), null);
});

test('newPasswordProblem never echoes the password', () => {
    for (const pw of ['short-pw', 'x'.repeat(300), current]) {
        const msg = newPasswordProblem(pw, current);
        assert.ok(msg && !msg.includes(pw));
    }
});

test('changePasswordInput: one string field, nothing else', () => {
    assert.deepEqual(changePasswordInput.parse({ password: 'a-new-password' }), { password: 'a-new-password' });
    assert.equal(changePasswordInput.safeParse({}).success, false);
    assert.equal(changePasswordInput.safeParse({ password: 123456789012 }).success, false);
    assert.equal(changePasswordInput.safeParse({ password: 'a-new-password', userId: 'other' }).success, false);
});
