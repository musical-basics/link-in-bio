/**
 * The light A/B format paints link icon tiles white. A brand logo whose colour
 * is (near-)white would vanish there, so every such brand needs an override in
 * app/globals.css: `[data-ab-style="light"] svg[data-brand="<key>"] { fill: … }`.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BRAND_ICONS } from '../../components/brand-icons.ts';

const css = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8');

function luminance(hex: string): number {
    const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return 1; // unknown or missing colour: the component falls back to white
    const [r, g, b] = m.slice(1).map((h) => {
        const v = parseInt(h, 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio against the light format's white tile (#ffffff). */
const contrastOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

describe('light format brand icons', () => {
    for (const [key, brand] of Object.entries(BRAND_ICONS)) {
        const color = (brand as { color?: string }).color ?? '';
        if (contrastOnWhite(color) >= 1.5) continue;
        test(`${key} (${color || 'no colour'}) has a light-format override`, () => {
            const rule = new RegExp(`\\[data-ab-style="light"\\]\\s+svg\\[data-brand="${key}"\\]\\s*\\{[^}]*fill:\\s*([^;!}]+)`);
            const m = css.match(rule);
            assert.ok(m, `no [data-ab-style="light"] svg[data-brand="${key}"] { fill: … } rule in app/globals.css`);
            assert.ok(contrastOnWhite(m[1].trim()) >= 3, `override fill ${m[1].trim()} is still too light on white`);
        });
    }

    test('tiktok is covered (the case that was invisible)', () => {
        assert.match(css, /\[data-ab-style="light"\]\s+svg\[data-brand="tiktok"\]/);
    });
});
