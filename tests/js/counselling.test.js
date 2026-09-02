import test from 'node:test';
import assert from 'node:assert';
import {
    generateSessionId,
    createCounsellingState,
    calculateComprehensionScore,
    comprehensionVerdict,
    clampStep,
    stepProgressPercent,
    COUNSELLING_STEPS,
    COUNSELLING_TOTAL_STEPS,
} from '../../client/src/lib/counselling.js';

test('Session ID generator creates properly formatted alphanumeric tokens', (t) => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();

    assert.ok(id1.startsWith('CSL-'));
    assert.ok(id2.startsWith('CSL-'));
    assert.notStrictEqual(id1, id2);
});

test('Counselling state maintains step bounds and signatures storage', (t) => {
    const state = createCounsellingState();

    assert.strictEqual(state.totalSteps, 6);
    assert.strictEqual(state.currentStep, 1);
    assert.strictEqual(typeof state.signatures, 'object');
    assert.strictEqual(state.signatures.patient, null);
    assert.strictEqual(state.signatures.counsellor, null);
});

test('Step definitions cover every step in the workflow', (t) => {
    assert.strictEqual(COUNSELLING_STEPS.length, COUNSELLING_TOTAL_STEPS);
    assert.strictEqual(COUNSELLING_STEPS[0].id, 'setup');
    assert.strictEqual(COUNSELLING_STEPS[5].id, 'consent');
});

test('Step navigation clamps to the workflow bounds', (t) => {
    assert.strictEqual(clampStep(0), 1);
    assert.strictEqual(clampStep(3), 3);
    assert.strictEqual(clampStep(99), 6);

    assert.strictEqual(stepProgressPercent(1), 17);
    assert.strictEqual(stepProgressPercent(3), 50);
    assert.strictEqual(stepProgressPercent(6), 100);
});

test('Comprehension scoring and verdict thresholds', (t) => {
    assert.strictEqual(calculateComprehensionScore(8, 10), 80);
    assert.strictEqual(calculateComprehensionScore(0, 10), 0);
    // Guards against divide-by-zero when no checkboxes are rendered yet
    assert.strictEqual(calculateComprehensionScore(0, 0), 0);

    assert.strictEqual(comprehensionVerdict(85).level, 'adequate');
    assert.strictEqual(comprehensionVerdict(60).level, 'partial');
    assert.strictEqual(comprehensionVerdict(20).level, 'inadequate');
});
