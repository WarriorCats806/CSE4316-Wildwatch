import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCrossingRisk, createSimulatedDetection, runScenario } from './simulator';

describe('wildlife simulator', () => {
  it('calculates risk from movement and roadway distance', () => {
    assert.equal(calculateCrossingRisk(8, true), 'high');
    assert.equal(calculateCrossingRisk(25, true), 'medium');
    assert.equal(calculateCrossingRisk(8, false), 'medium');
    assert.equal(calculateCrossingRisk(40, false), 'low');
  });

  it('creates simulated records with matching warning conditions', () => {
    const close = createSimulatedDetection({ id: 'sim-test', animal: 'White-tailed deer', distanceToRoadM: 6, movingTowardRoad: true, scenario: 'test', detectedAt: '2026-10-18T12:00:00Z' });
    assert.equal(close.simulation.risk, 'high');
    assert.equal(close.warning_triggered, true);
    assert.match(close.notes ?? '', /SIMULATED DEMO ONLY/);
    assert.equal(close.status, 'simulated');
  });

  it('provides scenario presets and an empty no-wildlife scenario', () => {
    const now = new Date('2026-10-18T12:00:00Z');
    assert.equal(runScenario('deer-approach', now)[0].animal_class, 'White-tailed deer');
    assert.equal(runScenario('multiple-animals', now).length, 3);
    const nighttime = runScenario('nighttime', now)[0];
    assert.equal(nighttime.simulation.nighttime, true);
    assert.equal(nighttime.confidence, 0.82);
    assert.deepEqual(runScenario('no-wildlife', now), []);
  });
});
