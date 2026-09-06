import test from 'node:test';
import assert from 'node:assert';
import { toLegacyColor, oklabToRgb } from '../../client/src/lib/legacyColor.js';

// These are the exact computed values Chrome produces for the Tailwind opacity
// modifiers used in the report, captured from the running page.
test('converts the oklab values Tailwind emits for opacity modifiers', (t) => {
    // bg-card/60 -> white at 60%
    assert.strictEqual(
        toLegacyColor('oklab(0.999994 0.0000455677 0.0000200868 / 0.6)'),
        'rgba(255, 255, 255, 0.6)',
    );

    // bg-muted/30 -> slate-100 at 30%
    const muted = toLegacyColor('oklab(0.968254 -0.00253484 -0.00633037 / 0.3)');
    assert.match(muted, /^rgba\(24[0-9], 24[0-9], 2[45][0-9], 0\.3\)$/);

    // bg-warning/5 -> amber at 5%
    const warning = toLegacyColor('oklab(0.768595 0.0561344 0.154817 / 0.05)');
    assert.match(warning, /^rgba\(2[0-5][0-9], 1[0-9][0-9], \d{1,2}, 0\.05\)$/);
});

test('opaque colours render without an alpha channel', (t) => {
    assert.strictEqual(toLegacyColor('oklab(0.999994 0 0)'), 'rgb(255, 255, 255)');
    assert.strictEqual(toLegacyColor('oklab(0 0 0)'), 'rgb(0, 0, 0)');
});

test('handles the oklch form by converting polar to cartesian', (t) => {
    const fromLch = toLegacyColor('oklch(0.7 0.15 250)');
    assert.match(fromLch, /^rgb\(\d+, \d+, \d+\)$/);

    // oklch(L C H) and the equivalent oklab must agree.
    const h = (250 * Math.PI) / 180;
    const equivalent = toLegacyColor(
        `oklab(0.7 ${0.15 * Math.cos(h)} ${0.15 * Math.sin(h)})`,
    );
    assert.strictEqual(fromLch, equivalent);
});

test('percentage alpha is accepted', (t) => {
    assert.strictEqual(
        toLegacyColor('oklab(0.999994 0 0 / 50%)'),
        'rgba(255, 255, 255, 0.5)',
    );
});

test('leaves colours that need no conversion alone', (t) => {
    assert.strictEqual(toLegacyColor('rgb(14, 165, 233)'), null);
    assert.strictEqual(toLegacyColor('rgba(0, 0, 0, 0.5)'), null);
    assert.strictEqual(toLegacyColor('#0ea5e9'), null);
    assert.strictEqual(toLegacyColor('transparent'), null);
    assert.strictEqual(toLegacyColor(''), null);
    assert.strictEqual(toLegacyColor(undefined), null);
});

test('unparseable modern colours return null rather than throwing', (t) => {
    assert.strictEqual(toLegacyColor('oklab()'), null);
    assert.strictEqual(toLegacyColor('oklab(nonsense here)'), null);
    // color-mix that the browser did not resolve is left for the renderer.
    assert.strictEqual(toLegacyColor('color-mix(in oklab, red, blue)'), null);
});

test('oklab primaries land in the expected sRGB corners', (t) => {
    const [r, g, b] = oklabToRgb(1, 0, 0);
    assert.deepStrictEqual([r, g, b], [255, 255, 255]);

    const [r2, g2, b2] = oklabToRgb(0, 0, 0);
    assert.deepStrictEqual([r2, g2, b2], [0, 0, 0]);
});

test('channels are clamped to a valid byte range', (t) => {
    // Out-of-gamut input must not produce negative or >255 channels.
    for (const [L, a, b] of [[1.5, 0.4, 0.4], [-0.5, -0.4, -0.4], [0.5, 2, -2]]) {
        for (const channel of oklabToRgb(L, a, b)) {
            assert.ok(channel >= 0 && channel <= 255, `channel ${channel} out of range`);
            assert.ok(Number.isInteger(channel), `channel ${channel} not an integer`);
        }
    }
});
