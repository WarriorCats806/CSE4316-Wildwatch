import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectionsToCsv } from './export';
import type { Detection } from './types';

describe('CSV detection report', () => {
  it('exports the requested fields and safely quotes commas, quotes, and newlines', () => {
    const row: Detection = {
      id: 'row-1', detected_at: '2026-10-18T12:00:00Z', animal_class: 'Deer, white-tailed', confidence: 0.92,
      location_label: 'North "A" approach', warning_triggered: true, warning_triggered_at: null,
      image_url: null, notes: 'Line one\nLine two', status: null,
    };
    const csv = detectionsToCsv([row]);
    assert.match(csv, /^id,detected_at,animal_class,confidence,location_label,warning_triggered,warning_triggered_at,image_url,notes,status\r\n/);
    assert.match(csv, /"Deer, white-tailed"/);
    assert.match(csv, /"North ""A"" approach"/);
    assert.match(csv, /"Line one\nLine two"/);
  });

  it('returns a header for zero filtered rows', () => {
    assert.equal(detectionsToCsv([]).split('\r\n').length, 1);
  });

  it('prevents exported text from being treated as a spreadsheet formula', () => {
    const row: Detection = { id: 'row-2', detected_at: '2026-10-18T12:00:00Z', animal_class: null, confidence: null, location_label: null, warning_triggered: null, warning_triggered_at: null, image_url: null, notes: '=HYPERLINK("https://example.com")', status: null };
    assert.match(detectionsToCsv([row]), /"'=HYPERLINK/);
  });
});
