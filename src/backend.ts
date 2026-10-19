import type { Detection, DetectionFilters } from './types';
import { DEMO_DETECTIONS } from './data';
import { filterDetections, isValidDetection } from './types';

const projectUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isDemoMode = !projectUrl || !anonKey;
export const DATA_MODE_LABEL = isDemoMode ? 'DEMO DATA' : 'DATABASE';

export type DetectionPage = { rows: Detection[]; total: number };

function apiUrl(params: URLSearchParams): string {
  return `${projectUrl}/rest/v1/detections?${params.toString()}`;
}

async function readRows(params: URLSearchParams, count = false): Promise<{ rows: Detection[]; total: number }> {
  const response = await fetch(apiUrl(params), {
    headers: { apikey: anonKey!, Authorization: `Bearer ${anonKey}`, ...(count ? { Prefer: 'count=exact' } : {}) },
  });
  if (!response.ok) {
    let detail = response.statusText;
    try { detail = (await response.json()).message ?? detail; } catch { /* Keep the HTTP status text. */ }
    throw new Error(`Could not load detections: ${detail}`);
  }
  const rows = await response.json() as Detection[];
  if (!Array.isArray(rows) || !rows.every(isValidDetection)) throw new Error('The database returned a malformed detection record. Check the detections schema and data.');
  const range = response.headers.get('content-range');
  const total = count && range ? Number(range.split('/')[1]) || 0 : rows.length;
  return { rows, total };
}

export async function loadDetections(filters: DetectionFilters, page: number, pageSize: number): Promise<DetectionPage> {
  if (isDemoMode) {
    const rows = filterDetections(DEMO_DETECTIONS, filters);
    return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
  }

  const params = new URLSearchParams({ select: '*', order: 'detected_at.desc', limit: String(pageSize), offset: String((page - 1) * pageSize) });
  const searchTerm = filters.search.trim().replace(/[^\p{L}\p{N}_ -]/gu, ' ');
  if (searchTerm) params.set('or', `(animal_class.ilike.*${searchTerm}*,location_label.ilike.*${searchTerm}*,notes.ilike.*${searchTerm}*)`);
  if (filters.animal) params.set('animal_class', `eq.${filters.animal}`);
  if (filters.warning === 'yes') params.set('warning_triggered', 'eq.true');
  if (filters.warning === 'no') params.set('warning_triggered', 'eq.false');
  const conditions: string[] = [];
  if (filters.from) conditions.push(`detected_at.gte.${new Date(`${filters.from}T00:00:00`).toISOString()}`);
  if (filters.to) conditions.push(`detected_at.lte.${new Date(`${filters.to}T23:59:59.999`).toISOString()}`);
  if (filters.minConfidence !== '') conditions.push(`confidence.gte.${Number(filters.minConfidence) / 100}`);
  if (filters.maxConfidence !== '') conditions.push(`confidence.lte.${Number(filters.maxConfidence) / 100}`);
  if (conditions.length) params.set('and', `(${conditions.join(',')})`);
  return readRows(params, true);
}

export async function loadAllDetections(filters: DetectionFilters): Promise<Detection[]> {
  if (isDemoMode) return filterDetections(DEMO_DETECTIONS, filters);
  const all: Detection[] = [];
  const batchSize = 500;
  for (let page = 1; ; page += 1) {
    const result = await loadDetections(filters, page, batchSize);
    all.push(...result.rows);
    if (all.length >= result.total || result.rows.length === 0) return all;
  }
}

export async function loadSummary(): Promise<Detection[]> {
  if (isDemoMode) return DEMO_DETECTIONS;
  const params = new URLSearchParams({ select: '*', order: 'detected_at.desc', limit: '1000' });
  return (await readRows(params)).rows;
}

export async function loadDetection(id: string): Promise<Detection | null> {
  if (isDemoMode) return Promise.resolve(DEMO_DETECTIONS.find((record) => record.id === id) ?? null);
  const params = new URLSearchParams({ select: '*', id: `eq.${id}`, limit: '1' });
  return (await readRows(params)).rows[0] ?? null;
}
