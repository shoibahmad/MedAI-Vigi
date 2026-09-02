import test from 'node:test';
import assert from 'node:assert';
import {
    calculateBMI,
    bmiCategory,
    calculateEGFR,
    interpretLabValue,
} from '../../client/src/lib/clinical.js';

test('BMI calculation calculates exact clinical BMI values', (t) => {
    // Normal 170cm, 70kg -> 70 / (1.7^2) = 24.2
    assert.strictEqual(calculateBMI(170, 70), 24.2);

    // Overweight 180cm, 90kg -> 90 / (1.8^2) = 27.8
    assert.strictEqual(calculateBMI(180, 90), 27.8);

    // Invalid input fallback
    assert.strictEqual(calculateBMI(0, 70), null);
    assert.strictEqual(calculateBMI(170, 0), null);
    assert.strictEqual(calculateBMI(-170, 70), null);
});

test('BMI category maps to WHO bands', (t) => {
    assert.strictEqual(bmiCategory(17.0), 'Underweight');
    assert.strictEqual(bmiCategory(24.2), 'Normal');
    assert.strictEqual(bmiCategory(27.8), 'Overweight');
    assert.strictEqual(bmiCategory(33.0), 'Obese');
    assert.strictEqual(bmiCategory(null), null);
});

test('eGFR uses the race-free CKD-EPI 2021 equation', (t) => {
    // Healthy 34F, creatinine 0.8 -> well above 90
    const healthy = calculateEGFR(0.8, 34, 'F');
    assert.ok(healthy > 90, `expected >90, got ${healthy}`);

    // Elderly 78M with creatinine 2.2 -> severe impairment, under 30
    const impaired = calculateEGFR(2.2, 78, 'M');
    assert.ok(impaired < 40, `expected <40, got ${impaired}`);

    // At identical creatinine a woman scores LOWER: kappa is 0.7 vs 0.9, so the
    // same value sits further above her expected baseline. ~68 vs ~91 at 50y/1.0.
    assert.ok(calculateEGFR(1.0, 50, 'F') < calculateEGFR(1.0, 50, 'M'));

    // Anchored against published CKD-EPI 2021 calculator output
    assert.ok(Math.abs(calculateEGFR(1.0, 50, 'M') - 91) < 2);
    assert.ok(Math.abs(calculateEGFR(1.0, 50, 'F') - 69) < 2);

    // Invalid input fallback
    assert.strictEqual(calculateEGFR(0, 50, 'M'), null);
    assert.strictEqual(calculateEGFR(1.0, 0, 'M'), null);
});

test('Lab interpretation matches the server reference ranges', (t) => {
    // Creatinine male range is 0.7-1.3
    const normal = interpretLabValue('creatinine', 1.0, 'M');
    assert.strictEqual(normal.status, 'Normal');
    assert.strictEqual(normal.severity, 'Normal');

    // Above range but below the 3.0 critical_high
    const high = interpretLabValue('creatinine', 2.0, 'M');
    assert.strictEqual(high.status, 'High');
    assert.strictEqual(high.severity, 'Moderate');

    // At/above critical_high
    const critical = interpretLabValue('creatinine', 3.5, 'M');
    assert.strictEqual(critical.status, 'High');
    assert.strictEqual(critical.severity, 'Severe');

    // Sex-specific bounds: 1.2 is high for F (0.6-1.1) but normal for M (0.7-1.3)
    assert.strictEqual(interpretLabValue('creatinine', 1.2, 'F').status, 'High');
    assert.strictEqual(interpretLabValue('creatinine', 1.2, 'M').status, 'Normal');

    // eGFR has critical_low rather than critical_high
    const esrd = interpretLabValue('egfr', 25, 'M');
    assert.strictEqual(esrd.status, 'Low');
    assert.strictEqual(esrd.severity, 'Severe');

    // Unknown marker degrades gracefully
    const unknown = interpretLabValue('unobtainium', 5, 'M');
    assert.strictEqual(unknown.status, 'Unknown');
});
