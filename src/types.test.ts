import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterDetections, isValidDetection, type Detection, EMPTY_FILTERS } from './types';

const records: Detection[] = [
  { id: 'a', detected_at: '2026-10-18T12:00:00.000Z', animal_class: 'Deer', confidence: 0.91, location_label: 'North zone', warning_triggered: true, warning_triggered_at: null, image_url: null, notes: null, status: null },
  { id: 'b', detected_at: '2026-10-17T12:00:00.000Z', animal_class: 'Fox', confidence: 0.72, location_label: 'South zone', warning_triggered: false, warning_triggered_at: null, image_url: null, notes: 'Needs review', status: null },
  { id: 'c', detected_at: '2026-10-16T12:00:00.000Z', animal_class: null, confidence: null, location_label: null, warning_triggered: null, warning_triggered_at: null, image_url: null, notes: null, status: null },
];

describe('detection data helpers', () => {
  it('validates timestamps and nullable confidence in the allowed range', () => {
    assert.equal(records.every(isValidDetection), true);
    assert.equal(isValidDetection({ ...records[0], confidence: 1.1 }), false);
    assert.equal(isValidDetection({ ...records[0], detected_at: 'not-a-date' }), false);
  });

  it('sorts newest first and filters search, animal and warning status', () => {
    assert.deepEqual(filterDetections([...records].reverse(), EMPTY_FILTERS).map((r) => r.id), ['a', 'b', 'c']);
    assert.deepEqual(filterDetections(records, { ...EMPTY_FILTERS, search: 'south' }).map((r) => r.id), ['b']);
    assert.deepEqual(filterDetections(records, { ...EMPTY_FILTERS, animal: 'Deer', warning: 'yes' }).map((r) => r.id), ['a']);
  });

  it('excludes unknown confidence when a confidence range is selected', () => {
    assert.deepEqual(filterDetections(records, { ...EMPTY_FILTERS, minConfidence: '80', maxConfidence: '' }).map((r) => r.id), ['a']);
  });
});
