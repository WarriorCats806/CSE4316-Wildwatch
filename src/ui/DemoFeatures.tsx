import { useEffect, useState } from 'react';
import { Activity, Camera, Clock3, Database, Lightbulb, MapPin, Moon, Play, RotateCcw, Shield, Sparkles, Waves } from 'lucide-react';
import type { Detection } from '../types';
import { ANIMAL_TYPES, calculateCrossingRisk, createSimulatedDetection, runScenario, scenarioName, type AnimalType, type CrossingRisk, type ScenarioId, type SimulatedDetection } from '../simulator';

type Props = {
  records: Detection[];
  simulated: SimulatedDetection[];
  onSimulatedChange: (next: SimulatedDetection[] | ((previous: SimulatedDetection[]) => SimulatedDetection[])) => void;
  onSelect: (record: Detection | SimulatedDetection) => void;
  resetToken: number;
  onReset: () => void;
  databaseLoading: boolean;
  databaseError: boolean;
  demoMode: boolean;
  lastRefresh: string | null;
};

const SCENARIOS: Array<{ id: ScenarioId; label: string }> = [
  { id: 'deer-approach', label: 'Deer approaching road' },
  { id: 'multiple-animals', label: 'Multiple animals' },
  { id: 'nighttime', label: 'Nighttime detection' },
  { id: 'no-wildlife', label: 'No wildlife detected' },
];

export default function DemoFeatures(props: Props) {
  const [animal, setAnimal] = useState<AnimalType>('White-tailed deer');
  const [distance, setDistance] = useState(7);
  const [moving, setMoving] = useState(true);
  const [nighttime, setNighttime] = useState(false);
  const [active, setActive] = useState(false);
  const [scenario, setScenario] = useState('Ready to simulate');
  const risk = calculateCrossingRisk(distance, moving);
  const warningOn = active && risk === 'high';

  useEffect(() => {
    setAnimal('White-tailed deer'); setDistance(7); setMoving(true); setNighttime(false); setActive(false); setScenario('Ready to simulate');
  }, [props.resetToken]);

  const simulate = () => {
    const record = createSimulatedDetection({ animal, distanceToRoadM: distance, movingTowardRoad: moving, scenario: 'Interactive simulator', nighttime });
    props.onSimulatedChange((previous) => [record, ...previous].slice(0, 30));
    setScenario('Interactive simulator'); setActive(true);
  };

  const runPreset = (id: ScenarioId) => {
    const rows = runScenario(id);
    props.onSimulatedChange(rows);
    setScenario(scenarioName(id));
    if (id === 'no-wildlife') { setActive(false); setNighttime(false); return; }
    const primary = rows[0];
    setAnimal((primary.animal_class ?? 'White-tailed deer') as AnimalType);
    setDistance(primary.simulation.distanceToRoadM);
    setMoving(primary.simulation.movingTowardRoad);
    setNighttime(primary.simulation.nighttime);
    setActive(true);
  };

  return <section className="demo-suite" aria-label="Wildlife simulation demo">
    <div className="demo-suite-heading"><div><div className="eyebrow"><span className="eyebrow-line" />INTERACTIVE DEMO</div><h2>Crossing risk simulator <span className="sim-tag"><Sparkles size={12} />SIMULATED</span></h2><p>Explore how movement and distance change the demo warning state. No model or hardware is connected.</p></div><button className="button button-secondary reset-demo" onClick={() => { props.onSimulatedChange([]); props.onReset(); }}><RotateCcw size={15} />Reset demo</button></div>

    <div className="demo-top-grid">
      <section className="panel simulator-panel">
        <div className="demo-panel-title"><div className="panel-title-icon"><Activity size={16} /></div><div><h3>Interactive wildlife simulator</h3><p>Set an animal and simulate movement toward the sample road.</p></div></div>
        <div className="sim-controls">
          <label className="sim-field"><span>Animal type</span><select value={animal} onChange={(event) => setAnimal(event.target.value as AnimalType)}>{ANIMAL_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className="sim-field distance-control"><span>Distance to road <b>{distance} m</b></span><input aria-label="Distance to road in meters" type="range" min="5" max="60" step="1" value={distance} onChange={(event) => setDistance(Number(event.target.value))} /><span className="range-labels"><span>5 m · near</span><span>60 m · far</span></span></label>
          <div className="sim-toggle-row"><label className="sim-toggle"><input type="checkbox" checked={moving} onChange={(event) => setMoving(event.target.checked)} /><span className="toggle-track" /><span>Moving toward road</span></label><label className="sim-toggle"><input type="checkbox" checked={nighttime} onChange={(event) => setNighttime(event.target.checked)} /><span className="toggle-track" /><Moon size={14} /><span>Nighttime</span></label></div>
          <button className="button sim-run-button" onClick={simulate}><Play size={15} fill="currentColor" />Simulate detection</button>
        </div>
        <div className="preset-area"><span>SCENARIO PRESETS</span><div className="preset-buttons">{SCENARIOS.map(({ id, label }) => <button key={id} className={`preset-button ${scenario === scenarioName(id) ? 'preset-active' : ''}`} onClick={() => runPreset(id)}>{label}</button>)}</div></div>
        <div className="current-sim-note"><Sparkles size={13} /><span>Current scenario: <b>{scenario}</b></span><i>DEMO ONLY</i></div>
      </section>

      <div className="demo-side-stack">
        <section className={`risk-panel risk-${active ? risk : 'inactive'}`} aria-live="polite">
          <div className="risk-panel-head"><div><span className="risk-kicker">WILDLIFE CROSSING RISK</span><span className="sim-mini-tag">SIMULATED</span></div><Shield size={17} /></div>
          <div className="risk-value-row"><strong>{active ? risk.toUpperCase() : 'STANDBY'}</strong><span>{active ? `${distance} m from road` : 'Run a scenario to begin'}</span></div>
          <div className="risk-meter"><i className={active ? `meter-${risk}` : ''} /></div>
          <p>{active ? riskDescription(risk, moving) : 'Risk is calculated from the simulated animal’s distance and direction.'}</p>
        </section>
        <section className="panel warning-light-panel">
          <div className="warning-light-visual" aria-label={`Virtual warning light ${warningOn ? 'active' : risk === 'medium' && active ? 'caution' : 'clear'}`}>
            <span className={`lamp lamp-red ${warningOn ? 'lamp-lit' : ''}`} /><span className={`lamp lamp-amber ${active && risk === 'medium' ? 'lamp-lit' : ''}`} /><span className={`lamp lamp-green ${active && risk === 'low' || !active ? 'lamp-lit' : ''}`} />
          </div>
          <div className="warning-light-copy"><span>VIRTUAL WARNING LIGHT</span><b className={warningOn ? 'warning-on-text' : ''}>{warningOn ? 'Warning simulated' : active && risk === 'medium' ? 'Caution simulated' : 'Clear'}</b><small>Demo display only · no hardware control</small></div>
          <Lightbulb size={16} className="lightbulb-icon" />
        </section>
      </div>
    </div>

    <section className="panel system-status-panel">
      <div className="status-panel-heading"><div><h3>System status</h3><p>Connectivity and simulated pipeline indicators</p></div><span className="sim-mini-tag">SIMULATED STATUSES</span></div>
      <div className="status-items">
        <StatusItem icon={<Database size={16} />} label="Database" value={props.demoMode ? 'Demo records' : props.databaseLoading ? 'Checking…' : props.databaseError ? 'Connection error' : 'Supabase connected'} tone={props.demoMode ? 'amber' : props.databaseError ? 'red' : 'green'} simulated={props.demoMode} />
        <StatusItem icon={<Camera size={16} />} label="Camera feed" value="Preview only · simulated" tone="amber" simulated />
        <StatusItem icon={<Waves size={16} />} label="AI processing" value="Pipeline preview · simulated" tone="amber" simulated />
        <StatusItem icon={<Clock3 size={16} />} label="Last data refresh" value={props.lastRefresh ? new Date(props.lastRefresh).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'Not refreshed yet'} tone="slate" simulated={props.demoMode} />
      </div>
    </section>

    <div className="demo-map-analytics-grid">
      <section className="panel map-panel"><div className="demo-panel-title"><div className="panel-title-icon"><MapPin size={16} /></div><div><h3>Wildlife detection map</h3><p>Illustrative positions along a sample roadway</p></div><span className="sim-mini-tag">SIMULATED</span></div>
        <RoadwayMap records={props.simulated} onSelect={props.onSelect} />
      </section>
      <div className="analytics-stack">
        <section className="panel analytics-panel"><div className="analytics-heading"><div><h3>Detection analytics</h3><p>Saved records and simulator events are shown separately</p></div><span className="sim-mini-tag">DEMO VIEW</span></div>
          <Analytics records={props.records} simulated={props.simulated} />
        </section>
        <section className="panel simulated-records-panel"><div className="analytics-heading"><div><h3>Simulated detections <span className="sim-count">{props.simulated.length}</span></h3><p>Local demo events · never saved to Supabase</p></div></div>
          {props.simulated.length === 0 ? <div className="sim-empty"><Sparkles size={15} /><span>Run a preset or simulate an animal to add a demo detection.</span></div> : <div className="sim-record-list">{props.simulated.slice(0, 4).map((record) => <button className="sim-record-row" key={record.id} onClick={() => props.onSelect(record)}><span className="sim-record-animal"><i /><b>{record.animal_class}</b><small>{record.simulation.distanceToRoadM} m · {record.simulation.risk} risk</small></span><span className={`sim-record-warning ${record.warning_triggered ? 'warning-on-text' : ''}`}>{record.warning_triggered ? 'Warning' : 'Clear'}</span><span className="sim-record-open">View details →</span></button>)}</div>}
        </section>
      </div>
    </div>
    <div className="simulation-footnote"><Sparkles size={13} />Every item in this section is a browser-only simulation. The existing detection table and database records remain separate.</div>
  </section>;
}

function riskDescription(risk: CrossingRisk, moving: boolean): string {
  if (risk === 'high') return 'Close approach and movement toward the road meet the demo warning threshold.';
  if (risk === 'medium') return moving ? 'The animal is approaching; keep monitoring the simulated crossing.' : 'The animal is near the road but is not moving toward it.';
  return 'The animal is farther away or moving away from the roadway.';
}

function StatusItem({ icon, label, value, tone, simulated }: { icon: React.ReactNode; label: string; value: string; tone: string; simulated: boolean }) {
  return <div className="status-item"><span className={`status-item-icon status-${tone}`}>{icon}</span><div><span>{label}{simulated && <i className="status-sim-label">SIM</i>}</span><b>{value}</b></div><span className={`status-indicator indicator-${tone}`} /></div>;
}

function RoadwayMap({ records, onSelect }: { records: SimulatedDetection[]; onSelect: (record: SimulatedDetection) => void }) {
  const markers = records.slice(0, 6);
  return <div className="roadway-map"><svg viewBox="0 0 700 220" role="img" aria-label="Schematic sample roadway with simulated animal detections">
    <path d="M0 158 H700" stroke="#dfeadf" strokeWidth="96" />
    <path d="M0 158 H700" stroke="#d9dcd7" strokeWidth="64" />
    <path d="M0 158 H700" stroke="#f7f6ef" strokeWidth="2" strokeDasharray="14 12" />
    <path d="M0 116 H700 M0 200 H700" stroke="#c9cec8" strokeWidth="2" />
    <text x="18" y="153" className="road-label">SAMPLE ROADWAY</text>
    <text x="18" y="28" className="map-zone-label">NORTH APPROACH · SCHEMATIC · NOT TO SCALE</text>
    {markers.map((record, index) => {
      const x = 130 + index * (430 / Math.max(1, markers.length - 1));
      const y = 151 - Math.min(60, record.simulation.distanceToRoadM) * 1.55;
      const color = record.simulation.risk === 'high' ? '#c45d4c' : record.simulation.risk === 'medium' ? '#d09a49' : '#5e8b67';
      return <g key={record.id} className="map-marker" onClick={() => onSelect(record)} role="button" tabIndex={0} aria-label={`${record.animal_class} simulated ${record.simulation.distanceToRoadM} meters from road`} onKeyDown={(event) => event.key === 'Enter' && onSelect(record)}>
        <line x1={x} y1={y + 10} x2={x} y2="111" stroke={color} strokeDasharray="3 4" opacity=".55" />
        <circle cx={x} cy={y} r="12" fill={color} opacity=".14" /><circle cx={x} cy={y} r="6" fill={color} stroke="white" strokeWidth="2" />
        <text x={x + 10} y={y - 9} className="map-marker-label">{record.animal_class?.split(' ')[0]} · {record.simulation.distanceToRoadM}m</text>
      </g>;
    })}
  </svg>{markers.length === 0 && <div className="map-empty"><MapPin size={17} />Run a demo scenario to plot animal locations.</div>}<div className="map-legend"><span><i className="legend-risk-high" />High risk</span><span><i className="legend-risk-medium" />Medium</span><span><i className="legend-risk-low" />Low</span><small>Sample layout · no GPS coordinates</small></div></div>;
}

function Analytics({ records, simulated }: { records: Detection[]; simulated: SimulatedDetection[] }) {
  const week = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - offset));
    const sameDay = (record: Detection) => new Date(record.detected_at).toDateString() === date.toDateString();
    return { day: date.toLocaleDateString(undefined, { weekday: 'short' }), saved: records.filter(sameDay).length, simulated: simulated.filter(sameDay).length, warnings: records.filter((r) => sameDay(r) && r.warning_triggered === true).length, simWarnings: simulated.filter((r) => sameDay(r) && r.warning_triggered).length };
  });
  const animals = [...new Set([...records.map((r) => r.animal_class), ...simulated.map((r) => r.animal_class)].filter((value): value is string => Boolean(value)))].map((animal) => ({ animal, saved: records.filter((r) => r.animal_class === animal).length, simulated: simulated.filter((r) => r.animal_class === animal).length })).sort((a, b) => b.saved + b.simulated - a.saved - a.simulated).slice(0, 4);
  const maxDay = Math.max(1, ...week.flatMap((day) => [day.saved, day.simulated]));
  const maxAnimal = Math.max(1, ...animals.flatMap((item) => [item.saved, item.simulated]));
  const maxWarn = Math.max(1, ...week.flatMap((day) => [day.warnings, day.simWarnings]));
  return <div className="analytics-charts">
    <div className="mini-chart"><div className="mini-chart-title"><b>Detections over time</b><span>7 days</span></div><div className="mini-bars">{week.map((day) => <div className="mini-bar-group" key={day.day}><div className="mini-bar-pair"><i className="saved-bar" style={{ height: `${Math.max(day.saved ? 3 : 0, day.saved / maxDay * 34)}px` }} title={`Saved records: ${day.saved}`} /><i className="sim-bar" style={{ height: `${Math.max(day.simulated ? 3 : 0, day.simulated / maxDay * 34)}px` }} title={`Simulated: ${day.simulated}`} /></div><small>{day.day}</small></div>)}</div></div>
    <div className="mini-chart"><div className="mini-chart-title"><b>By animal type</b><span>{records.length + simulated.length} total</span></div><div className="animal-analytics">{animals.length === 0 ? <span className="mini-empty">No classified animals</span> : animals.map((item) => <div className="animal-analytics-row" key={item.animal}><span>{item.animal.split(' ')[0]}</span><div><i className="saved-bar" style={{ width: `${item.saved / maxAnimal * 100}%` }} /><i className="sim-bar" style={{ width: `${item.simulated / maxAnimal * 100}%` }} /></div><b>{item.saved + item.simulated}</b></div>)}</div></div>
    <div className="mini-chart"><div className="mini-chart-title"><b>Warning events</b><span>{records.filter((r) => r.warning_triggered).length + simulated.filter((r) => r.warning_triggered).length} total</span></div><div className="mini-bars warning-bars">{week.map((day) => <div className="mini-bar-group" key={day.day}><div className="mini-bar-pair"><i className="saved-warning-bar" style={{ height: `${Math.max(day.warnings ? 3 : 0, day.warnings / maxWarn * 34)}px` }} title={`Saved warning events: ${day.warnings}`} /><i className="sim-warning-bar" style={{ height: `${Math.max(day.simWarnings ? 3 : 0, day.simWarnings / maxWarn * 34)}px` }} title={`Simulated warning events: ${day.simWarnings}`} /></div><small>{day.day}</small></div>)}</div></div>
    <div className="analytics-legend"><span><i className="saved-bar" />{isDemoRecords(records) ? 'Sample records' : 'Saved / database records'}</span><span><i className="sim-bar" />Simulator events</span></div>
  </div>;
}

function isDemoRecords(records: Detection[]): boolean {
  return records.some((record) => record.id.startsWith('demo-'));
}
