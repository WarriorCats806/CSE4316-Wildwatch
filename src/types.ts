export type Detection = {
  id: string;
  detected_at: string;
  animal_class: string | null;
  confidence: number | null;
  location_label: string | null;
  warning_triggered: boolean | null;
  warning_triggered_at: string | null;
  image_url: string | null;
  notes: string | null;
  status: string | null;
};

export type DetectionFilters = {
  search: string;
  animal: string;
  warning: string;
  from: string;
  to: string;
  minConfidence: string;
  maxConfidence: string;
};

export const EMPTY_FILTERS: DetectionFilters = {
  search: '', animal: '', warning: '', from: '', to: '', minConfidence: '', maxConfidence: '',
};

export function isValidDetection(record: Detection): boolean {
  return Boolean(record.id && record.detected_at && !Number.isNaN(Date.parse(record.detected_at)))
    && (record.confidence === null || (Number.isFinite(record.confidence) && record.confidence >= 0 && record.confidence <= 1));
}

export function filterDetections(records: Detection[], filters: DetectionFilters): Detection[] {
  const query = filters.search.trim().toLowerCase();
  const lower = filters.minConfidence === '' ? null : Number(filters.minConfidence) / 100;
  const upper = filters.maxConfidence === '' ? null : Number(filters.maxConfidence) / 100;
  return records.filter((record) => {
    const searchable = `${record.animal_class ?? ''} ${record.location_label ?? ''} ${record.notes ?? ''}`.toLowerCase();
    const date = new Date(record.detected_at);
    if (query && !searchable.includes(query)) return false;
    if (filters.animal && record.animal_class !== filters.animal) return false;
    if (filters.warning === 'yes' && record.warning_triggered !== true) return false;
    if (filters.warning === 'no' && record.warning_triggered !== false) return false;
    if (filters.from && date < new Date(`${filters.from}T00:00:00`)) return false;
    if (filters.to && date > new Date(`${filters.to}T23:59:59.999`)) return false;
    if (record.confidence === null && (lower !== null || upper !== null)) return false;
    if (lower !== null && record.confidence! < lower) return false;
    if (upper !== null && record.confidence! > upper) return false;
    return true;
  }).sort((a, b) => Date.parse(b.detected_at) - Date.parse(a.detected_at));
}
