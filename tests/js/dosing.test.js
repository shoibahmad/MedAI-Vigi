import test from 'node:test';
import assert from 'node:assert';
import { calculateRenalDoseAdjustment, evaluateHepaticDoseAdjustment } from '../../client/src/lib/dosing.js';
import { calculatePersonalizedDose } from '../../client/src/lib/dosing.js';

test('Renal dose adjustment calculates correct reductions', (t) => {
    // Normal kidney function
    const normal = calculateRenalDoseAdjustment('Warfarin', 10, 95);
    assert.strictEqual(normal.reductionPercent, 0);
    assert.strictEqual(normal.adjustedDose, 10);
    assert.strictEqual(normal.severity, 'Normal');

    // Moderate CKD (eGFR 45)
    const moderate = calculateRenalDoseAdjustment('Warfarin', 10, 45);
    assert.strictEqual(moderate.reductionPercent, 30);
    assert.strictEqual(moderate.adjustedDose, 7);
    assert.strictEqual(moderate.severity, 'Moderate');

    // Severe CKD (eGFR 20)
    const severe = calculateRenalDoseAdjustment('Warfarin', 10, 20);
    assert.strictEqual(severe.reductionPercent, 50);
    assert.strictEqual(severe.adjustedDose, 5);
    assert.strictEqual(severe.severity, 'Severe');

    // ESRD (eGFR 10)
    const esrd = calculateRenalDoseAdjustment('Warfarin', 10, 10);
    assert.strictEqual(esrd.reductionPercent, 75);
    assert.strictEqual(esrd.adjustedDose, 2.5);
    assert.strictEqual(esrd.severity, 'Critical');
});

test('Hepatic dose adjustment identifies elevated liver transaminases', (t) => {
    // Normal liver
    const normal = evaluateHepaticDoseAdjustment('Atorvastatin', 25, 0.8, 4.2);
    assert.strictEqual(normal.adjustmentRequired, false);
    assert.strictEqual(normal.reductionPercent, 0);

    // Severe DILI / Cirrhosis
    const severe = evaluateHepaticDoseAdjustment('Atorvastatin', 180, 2.8, 2.4);
    assert.strictEqual(severe.adjustmentRequired, true);
    assert.strictEqual(severe.reductionPercent, 50);
    assert.strictEqual(severe.status, 'High Risk');
});

test('Personalized dosing calculator integrates age and CYP2C9 genetics', (t) => {
    const res = calculatePersonalizedDose('Warfarin', 5.0, {
        age: 78,
        egfr: 25,
        cyp2c9: 'Poor',
        ast_alt: 30
    });

    assert.strictEqual(res.drug, 'Warfarin');
    assert.ok(res.adjustedDose < 5.0);
    assert.ok(res.reductionPercent > 0);
    assert.ok(res.reasoning.includes('CYP2C9 Poor Metabolizer'));
});
