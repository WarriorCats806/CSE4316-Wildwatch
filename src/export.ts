import type { Detection } from './types';

const CSV_COLUMNS: Array<keyof Detection> = [
  'id', 'detected_at', 'animal_class', 'confidence', 'location_label',
  'warning_triggered', 'warning_triggered_at', 'image_url', 'notes', 'status',
];

function escapeCsv(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function detectionsToCsv(records: Detection[]): string {
  const header = CSV_COLUMNS.join(',');
  return [header, ...records.map((record) => CSV_COLUMNS.map((column) => escapeCsv(record[column])).join(','))].join('\r\n');
}

export function downloadDetectionsCsv(records: Detection[], fileName = 'wildwatch-detections.csv'): void {
  const blob = new Blob([detectionsToCsv(records)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
