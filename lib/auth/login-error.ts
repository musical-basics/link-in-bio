/**
 * The message /login shows for Auth.js's `?error=` codes. People never see a raw
 * code; anything unrecognised gets the generic message.
 */

export const UP_CANCELLED_MESSAGE = "Ultimate Pianist sign-in was cancelled or didn't finish. Try again.";
export const GENERIC_LOGIN_ERROR = "Sign-in didn't work. Please try again.";

const MESSAGES: Record<string, string> = {
    // The provider sent the person back with an error, e.g. they cancelled at Ultimate Pianist.
    OAuthCallbackError: UP_CANCELLED_MESSAGE,
};

export function loginErrorMessage(error: string | string[] | undefined | null): string | null {
    const code = Array.isArray(error) ? error[0] : error;
    if (!code) return null;
    return Object.prototype.hasOwnProperty.call(MESSAGES, code) ? MESSAGES[code] : GENERIC_LOGIN_ERROR;
}
