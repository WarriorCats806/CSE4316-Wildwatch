import type { Detection } from './types';

const now = Date.now();
const ago = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();

// Fictional records for the local demo. Never presented as connected/live telemetry.
export const DEMO_DETECTIONS: Detection[] = [
  { id: 'demo-001', detected_at: ago(0.4), animal_class: 'White-tailed deer', confidence: 0.94, location_label: 'North approach', warning_triggered: true, warning_triggered_at: ago(0.38), image_url: null, notes: 'Demo record — sample data', status: 'reviewed' },
  { id: 'demo-002', detected_at: ago(1.7), animal_class: 'Coyote', confidence: 0.87, location_label: 'Creek underpass', warning_triggered: false, warning_triggered_at: null, image_url: null, notes: 'Demo record — sample data', status: 'new' },
  { id: 'demo-003', detected_at: ago(5), animal_class: 'White-tailed deer', confidence: 0.91, location_label: 'South approach', warning_triggered: true, warning_triggered_at: ago(4.98), image_url: null, notes: 'Demo record — sample data', status: 'reviewed' },
  { id: 'demo-004', detected_at: ago(15), animal_class: 'Raccoon', confidence: 0.78, location_label: null, warning_triggered: false, warning_triggered_at: null, image_url: null, notes: 'Demo record — sample data', status: 'new' },
  { id: 'demo-005', detected_at: ago(28), animal_class: null, confidence: null, location_label: 'North approach', warning_triggered: null, warning_triggered_at: null, image_url: null, notes: null, status: 'needs review' },
  { id: 'demo-006', detected_at: ago(46), animal_class: 'White-tailed deer', confidence: 0.96, location_label: 'Creek underpass', warning_triggered: true, warning_triggered_at: ago(45.9), image_url: null, notes: 'Demo record — sample data', status: 'reviewed' },
  { id: 'demo-007', detected_at: ago(73), animal_class: 'Fox', confidence: 0.72, location_label: 'East fence', warning_triggered: false, warning_triggered_at: null, image_url: null, notes: 'Demo record — sample data', status: 'new' },
];
