import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, BellRing, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Compass, Database, Download, Eye, Filter, Leaf, ListFilter, MapPin, Menu, MoreHorizontal, Search, ShieldCheck, SlidersHorizontal, X, RefreshCw } from 'lucide-react';
import { DATA_MODE_LABEL, isDemoMode, loadAllDetections, loadDetection, loadDetections, loadSummary } from '../backend';
import { downloadDetectionsCsv } from '../export';
import DemoFeatures from './DemoFeatures';
import type { SimulatedDetection } from '../simulator';
import { EMPTY_FILTERS, type Detection, type DetectionFilters } from '../types';

type View = 'overview' | 'history';
const PAGE_SIZE = 7;
const NA = 'Not available';
const localTime = (date: string | null) => date ? new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : NA;
const shortTime = (date: string) => new Date(date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const confidence = (value: number | null) => value === null ? NA : `${Math.round(value * 100)}%`;

function App() {
  const [view, setView] = useState<View>('overview');
  const [filters, setFilters] = useState<DetectionFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<Detection[]>([]);
  const [summary, setSummary] = useState<Detection[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Detection | SimulatedDetection | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [simulated, setSimulated] = useState<SimulatedDetection[]>([]);
  const [resetToken, setResetToken] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [result, all] = await Promise.all([loadDetections(filters, page, PAGE_SIZE), loadSummary()]);
      setRecords(result.rows); setTotal(result.total); setSummary(all);
      setLastRefresh(new Date().toISOString());
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Something went wrong while loading detections.'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { void refresh(); }, [refresh]);
  const species = useMemo(() => [...new Set(summary.map((item) => item.animal_class).filter((item): item is string => Boolean(item)))].sort(), [summary]);
  const todayCount = summary.filter((item) => new Date(item.detected_at).toDateString() === new Date().toDateString()).length;
  const warningCount = summary.filter((item) => item.warning_triggered === true).length;
  const animalCounts = summary.reduce<Record<string, number>>((acc, item) => { if (item.animal_class) acc[item.animal_class] = (acc[item.animal_class] ?? 0) + 1; return acc; }, {});
  const mostCommon = Object.entries(animalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? NA;
  const changeFilter = (key: keyof DetectionFilters, value: string) => { setPage(1); setFilters((old) => ({ ...old, [key]: value })); };
  const showDetails = async (row: Detection | SimulatedDetection) => {
    setSelected(row); setDetailLoading(true);
    if ('simulation' in row) { setDetailLoading(false); return; }
    try { setSelected(await loadDetection(row.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load this detection.'); }
    finally { setDetailLoading(false); }
  };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setPage(1); };
  const exportFiltered = async () => {
    setExporting(true); setError('');
    try {
      const filtered = await loadAllDetections(filters);
      downloadDetectionsCsv(filtered);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not export filtered detections.'); }
    finally { setExporting(false); }
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Leaf size={20} /></div><div><strong>WildWatch</strong><span>FIELD OPERATIONS</span></div><button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18} /></button></div>
      <div className="nav-label">WORKSPACE</div>
      <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => { setView('overview'); setMobileNav(false); }}><Activity size={17} />Overview</button>
      <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => { setView('history'); setMobileNav(false); }}><Clock3 size={17} />Detection history</button>
      <div className="sidebar-divider" />
      <div className="nav-label">SYSTEM</div>
      <div className="system-card"><div className="system-icon"><Database size={16} /></div><div><b>{isDemoMode ? 'Demo environment' : loading ? 'Checking database' : error ? 'Database unavailable' : 'Database connected'}</b><span>{isDemoMode ? 'Sample detections only' : 'Supabase data source'}</span></div><span className={`status-dot ${isDemoMode || error ? 'demo-dot' : ''}`} /></div>
      <div className="sidebar-bottom"><div className="help-row"><CircleHelp size={16} /><span>About this dashboard</span></div><div className="profile"><div className="avatar">WW</div><div><b>Field team</b><span>Wildlife monitoring</span></div><MoreHorizontal size={18} className="profile-more" /></div></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={19} /></button><div className="crumb">Workspace <span>/</span> <b>{view === 'overview' ? 'Overview' : 'Detection history'}</b></div><div className="top-actions"><span className={`mode-pill ${isDemoMode ? 'mode-demo' : 'mode-live'}`}><i />{DATA_MODE_LABEL}</span><span className="top-divider" /><span className="top-date"><CalendarDays size={15} />{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><div className="top-avatar">FT</div></div></header>
      <div className="content">
        {view === 'overview' ? <>
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />WILDLIFE CROSSING MONITOR</div><h1>Good afternoon, team <span>✳</span></h1><p>A clear look at activity around your monitored crossings.</p></div><button className="button button-secondary" onClick={() => { setView('history'); setFilters(EMPTY_FILTERS); }}><ListFilter size={16} />View all detections<ArrowRight size={15} /></button></div>
          {isDemoMode && <div className="demo-banner"><div className="demo-banner-icon"><CircleHelp size={17} /></div><div><b>You’re viewing sample data</b><span>These fictional records preview the dashboard. Connect Supabase to load your group’s records.</span></div><span className="demo-banner-tag">DEMO ONLY</span></div>}
          {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}
          <section className="stats-grid">
            <StatCard label="Total detections" value={loading ? '—' : String(summary.length)} caption="All recorded activity" icon={<Eye size={17} />} tone="green" />
            <StatCard label="Detected today" value={loading ? '—' : String(todayCount)} caption="Since 12:00 AM local time" icon={<Clock3 size={17} />} tone="blue" />
            <StatCard label="Most detected" value={loading ? '—' : mostCommon} caption={summary.length ? `${animalCounts[mostCommon] ?? 0} recorded detections` : 'No records yet'} icon={<Compass size={17} />} tone="amber" small />
            <StatCard label="Warnings triggered" value={loading ? '—' : String(warningCount)} caption="Records marked as warned" icon={<BellRing size={17} />} tone="rose" />
          </section>
          <DemoFeatures records={summary} simulated={simulated} onSimulatedChange={setSimulated} onSelect={showDetails} resetToken={resetToken} onReset={() => setResetToken((value) => value + 1)} databaseLoading={loading} databaseError={Boolean(error)} demoMode={isDemoMode} lastRefresh={lastRefresh} />
          <section className="panel table-panel"><PanelHeading title="Recent detections" subtitle="Latest records from monitored crossings" icon={<Clock3 size={16} />} aside={<button className="text-link" onClick={() => setView('history')}>View history <ArrowRight size={14} /></button>} />
            <DetectionTable records={summary.slice(0, 5)} loading={loading} onSelect={showDetails} compact onHistory={() => setView('history')} />
          </section>
          <footer className="page-footer"><span><i className={`footer-status ${isDemoMode ? 'is-demo' : ''}`} />{isDemoMode ? 'Demo mode · no live camera connection' : 'Connected to your Supabase database'}</span><span>WildWatch <i>·</i> Crossing safety dashboard</span></footer>
        </> : <>
          <div className="page-heading history-heading"><div><div className="eyebrow"><span className="eyebrow-line" />RECORDS</div><h1>Detection history</h1><p>Search and review detections captured across your monitored sites.</p></div><button className="button button-secondary" onClick={() => void refresh()}><RefreshCw size={15} />Refresh records</button></div>
          {isDemoMode && <div className="demo-banner compact-banner"><div className="demo-banner-icon"><CircleHelp size={17} /></div><div><b>Sample data preview</b><span>Showing fictional demo detections. Configure Supabase to use shared database records.</span></div><span className="demo-banner-tag">DEMO ONLY</span></div>}
          {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}
          <section className="panel history-panel"><div className="filter-head"><PanelHeading title="All detections" subtitle={`${loading ? 'Loading…' : `${total} ${total === 1 ? 'record' : 'records'} found`}`} icon={<ListFilter size={16} />} aside={<div className="history-actions"><button className="button button-secondary export-button" onClick={() => void exportFiltered()} disabled={exporting || loading}><Download size={14} />{exporting ? 'Preparing…' : 'Export CSV'}</button><button className="clear-button" onClick={clearFilters}><X size={14} />Clear filters</button></div>} /></div>
          <div className="filters"><label className="search-field"><Search size={16} /><input aria-label="Search detections" placeholder="Search animal, location, notes..." value={filters.search} onChange={(e) => changeFilter('search', e.target.value)} /><kbd>⌘ K</kbd></label><label className="filter-select"><Filter size={15} /><select aria-label="Filter by animal" value={filters.animal} onChange={(e) => changeFilter('animal', e.target.value)}><option value="">All animals</option>{species.map((animal) => <option key={animal}>{animal}</option>)}</select><ChevronDown size={13} /></label><label className="filter-select"><ShieldCheck size={15} /><select aria-label="Filter by warning status" value={filters.warning} onChange={(e) => changeFilter('warning', e.target.value)}><option value="">Any warning</option><option value="yes">Warning triggered</option><option value="no">No warning</option></select><ChevronDown size={13} /></label><label className="filter-select confidence-filter"><SlidersHorizontal size={15} /><select aria-label="Confidence range" value={filters.minConfidence === '' ? '' : `${filters.minConfidence}-${filters.maxConfidence}`} onChange={(e) => { const [min, max] = e.target.value ? e.target.value.split('-') : ['', '']; setPage(1); setFilters((old) => ({ ...old, minConfidence: min, maxConfidence: max })); }}><option value="">Any confidence</option><option value="0-70">Below 70%</option><option value="70-85">70% – 85%</option><option value="85-101">85% and above</option></select><ChevronDown size={13} /></label></div>
            <div className="date-filters"><span>Date range</span><input aria-label="Start date" type="date" value={filters.from} onChange={(e) => changeFilter('from', e.target.value)} /><span>to</span><input aria-label="End date" type="date" value={filters.to} onChange={(e) => changeFilter('to', e.target.value)} /><span className="filter-hint"><ArrowDown size={13} />Newest first</span></div>
            <DetectionTable records={records} loading={loading} onSelect={showDetails} onHistory={() => setView('overview')} />
            <div className="pagination"><span>Showing <b>{total ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)}</b> of <b>{total}</b> records</span><div><button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((n) => Math.max(1, n - 1))}><ArrowLeft size={15} /></button><span>Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><button aria-label="Next page" disabled={page * PAGE_SIZE >= total || loading} onClick={() => setPage((n) => n + 1)}><ArrowRight size={15} /></button></div></div>
          </section>
          <footer className="page-footer"><span><i className={`footer-status ${isDemoMode ? 'is-demo' : ''}`} />{isDemoMode ? 'Demo mode · no live camera connection' : 'Connected to your Supabase database'}</span><span>WildWatch <i>·</i> Crossing safety dashboard</span></footer>
        </>}
      </div>
    </main>
    {selected && <div className="modal-scrim" role="presentation" onClick={() => setSelected(null)}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(e) => e.stopPropagation()}><div className="detail-header"><div><div className="eyebrow"><span className="eyebrow-line" />{'simulation' in selected ? 'SIMULATED DEMO RECORD' : 'DETECTION RECORD'}</div><h2 id="detail-title">{selected.animal_class ?? NA}</h2><span className="detail-id">{selected.id}</span></div><button className="icon-button" aria-label="Close details" onClick={() => setSelected(null)}><X size={18} /></button></div>{detailLoading ? <div className="detail-loading"><span className="spinner" />Loading record…</div> : <><div className="detail-image">{selected.image_url ? <img src={selected.image_url} alt="Detection reference" /> : <div><div className="image-placeholder-icon"><Eye size={21} /></div><strong>{'simulation' in selected ? 'Simulated image placeholder' : 'Image not attached'}</strong><span>Visual reference for this record is {NA.toLowerCase()}.</span></div>}<span className="image-tag">{selected.image_url ? 'RECORD IMAGE' : 'NO MEDIA'}</span></div><div className="detail-fields"><DetailField label="Detected at" value={localTime(selected.detected_at)} icon={<Clock3 size={15} />} /><DetailField label="Classification" value={selected.animal_class ?? NA} icon={<Leaf size={15} />} /><DetailField label="Confidence" value={confidence(selected.confidence)} icon={<Activity size={15} />} /><DetailField label="Location / zone" value={selected.location_label ?? NA} icon={<MapPin size={15} />} /><DetailField label="Warning status" value={selected.warning_triggered === null ? NA : 'simulation' in selected ? selected.warning_triggered ? 'Warning simulated' : 'No warning simulated' : selected.warning_triggered ? 'Warning triggered' : 'No warning'} icon={<ShieldCheck size={15} />} /><DetailField label="Warning time" value={localTime(selected.warning_triggered_at)} icon={<BellRing size={15} />} /><DetailField label="Review status" value={selected.status ?? NA} icon={<Check size={15} />} /><DetailField label="Crossing risk" value={'simulation' in selected ? `${selected.simulation.risk.toUpperCase()} · simulated` : NA} icon={<AlertTriangle size={15} />} />{'simulation' in selected && <><DetailField label="Distance to road" value={`${selected.simulation.distanceToRoadM} m`} icon={<MapPin size={15} />} /><DetailField label="Movement" value={selected.simulation.movingTowardRoad ? 'Toward the road' : 'Not approaching'} icon={<Activity size={15} />} /></>}</div><div className="detail-notes"><b>Notes</b><p>{selected.notes ?? NA}</p></div></>}<div className="detail-footer"><span><i className={`footer-status ${'simulation' in selected || isDemoMode ? 'is-demo' : ''}`} />{'simulation' in selected ? 'Simulation only · not in database' : isDemoMode ? 'Sample record' : 'Database record'}</span><button className="button button-secondary" onClick={() => setSelected(null)}>Close</button></div></section></div>}
  </div>;
}

function StatCard({ label, value, caption, icon, tone, small = false }: { label: string; value: string; caption: string; icon: React.ReactNode; tone: string; small?: boolean }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><div className={`stat-value ${small ? 'stat-small' : ''}`}>{value}</div><div className="stat-caption"><span className={`caption-mark ${tone}`} />{caption}</div></article>;
}
function PanelHeading({ title, subtitle, icon, aside }: { title: string; subtitle: string; icon: React.ReactNode; aside?: React.ReactNode }) { return <div className="panel-heading"><div className="panel-title-icon">{icon}</div><div className="panel-title"><h2>{title}</h2><p>{subtitle}</p></div>{aside && <div className="panel-aside">{aside}</div>}</div>; }
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="error-banner" role="alert"><AlertTriangle size={17} /><span>{message}</span><button onClick={onRetry}>Try again</button></div>; }
function WarningBadge({ state }: { state: boolean | null }) { return state === null ? <span className="badge badge-unknown"><span />Unknown</span> : state ? <span className="badge badge-triggered"><span />Triggered</span> : <span className="badge badge-clear"><span />No warning</span>; }
function DetectionTable({ records, loading, onSelect, compact = false, onHistory }: { records: Detection[]; loading: boolean; onSelect: (row: Detection) => void; compact?: boolean; onHistory?: () => void }) {
  return <div className="table-wrap"><table><thead><tr><th>DETECTION</th><th>DETECTED AT</th><th>CONFIDENCE</th><th>LOCATION</th><th>WARNING STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
    {loading ? <tr><td colSpan={6} className="state-cell"><span className="spinner" />Loading detection records…</td></tr> : records.length === 0 ? <tr><td colSpan={6} className="state-cell empty-state"><div className="empty-icon"><Search size={17} /></div><b>No detections found</b><span>{compact ? 'New records will appear here when available.' : 'Try adjusting your filters or clear them to see all records.'}</span>{compact ? onHistory && <button className="text-link" onClick={onHistory}>Open detection history <ArrowRight size={14} /></button> : null}</td></tr> : records.map((row) => <tr key={row.id} className="data-row" onClick={() => onSelect(row)} onKeyDown={(e) => e.key === 'Enter' && onSelect(row)} tabIndex={0}><td><div className="animal-cell"><span className={`animal-icon animal-${row.animal_class?.toLowerCase().includes('deer') ? 'deer' : row.animal_class?.toLowerCase().includes('fox') ? 'fox' : 'other'}`}><Leaf size={15} /></span><span><b>{row.animal_class ?? NA}</b><small>ID · {row.id.slice(0, 10)}</small></span></div></td><td><span className="table-time">{shortTime(row.detected_at)}</span><small className="table-date">{new Date(row.detected_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></td><td><span className="confidence-cell">{row.confidence === null ? <span className="muted">{NA}</span> : <><span className="confidence-track"><i style={{ width: `${row.confidence * 100}%` }} /></span><b>{confidence(row.confidence)}</b></>}</span></td><td><span className="location-cell"><MapPin size={13} />{row.location_label ?? NA}</span></td><td><WarningBadge state={row.warning_triggered} /></td><td><button className="row-open" aria-label={`Open ${row.animal_class ?? 'detection'} details`} onClick={(e) => { e.stopPropagation(); onSelect(row); }}><ArrowRight size={15} /></button></td></tr>)}
  </tbody></table></div>;
}
function DetailField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="detail-field"><span className="detail-field-icon">{icon}</span><div><span>{label}</span><b className={value === NA ? 'muted' : ''}>{value}</b></div></div>; }

export default App;
