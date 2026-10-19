import { Camera, Lightbulb, Shield, Sparkles } from 'lucide-react';
import type { Detection } from '../types';
import type { CrossingRisk } from '../simulator';

type Props = {
  records: Detection[];
};

export default function DemoFeatures(props: Props) {
  const risk: CrossingRisk = 'high';
  const warningOn = true;

  return <section className="demo-suite" aria-label="Wildlife simulation demo">
    <div className="demo-suite-heading"><div><div className="eyebrow"><span className="eyebrow-line" />PRODUCT PREVIEW</div><h2>Crossing monitor <span className="sim-tag"><Sparkles size={12} />SAMPLE DATA</span></h2><p>Static mockup with fictional wildlife activity to illustrate a possible monitoring dashboard.</p></div></div>

    <div className="demo-top-grid">
      <section className="panel crossing-overview-panel">
        <div className="demo-panel-title"><div className="panel-title-icon"><Camera size={16} /></div><div><h3>Monitored crossing</h3><p>Camera 01 · North Road</p></div><span className="sim-mini-tag">PREVIEW</span></div>
        <div className="crossing-overview"><div><span>CAMERA FEED</span><b>Preview only</b></div><div><span>SAMPLE CAPTURE</span><b>7:30 PM</b></div><div><span>MONITORED ZONE</span><b>North approach</b></div></div>
      </section>

      <div className="demo-side-stack">
        <section className={`risk-panel risk-${risk}`} aria-label="Current sample camera detection has high crossing risk">
          <div className="risk-panel-head"><div><span className="risk-kicker">CURRENT CAMERA DETECTION</span><span className="sim-mini-tag">SAMPLE</span></div><Shield size={17} /></div>
          <div className="risk-value-row"><strong>{risk.toUpperCase()}</strong><span>White-tailed deer · 7 m · approaching</span></div>
          <div className="risk-meter"><i className="meter-high" /></div>
          <p>Camera 01 sample at 7:30 PM · animal approaching the roadway.</p>
        </section>
        <section className="panel warning-light-panel">
          <div className="warning-light-visual" aria-label="Virtual warning light warning shown in static sample preview">
            <span className={`lamp lamp-red ${warningOn ? 'lamp-lit' : ''}`} /><span className="lamp lamp-amber" /><span className="lamp lamp-green" />
          </div>
          <div className="warning-light-copy"><span>CURRENT CAMERA WARNING STATE</span><b className="warning-on-text">Warning active · sample</b><small>Static preview · no hardware control</small></div>
          <Lightbulb size={16} className="lightbulb-icon" />
        </section>
      </div>
    </div>

    <div className="demo-map-analytics-grid">
      <section className="panel map-panel"><div className="demo-panel-title"><div className="panel-title-icon"><Camera size={16} /></div><div><h3>Camera preview</h3><p>Illustrative snapshot · fictional sample detections</p></div><span className="sim-mini-tag">MOCK PREVIEW</span></div>
        <RoadwayMap />
      </section>
      <div className="analytics-stack">
        <section className="panel analytics-panel"><div className="analytics-heading"><div><h3>Detection analytics</h3><p>Sample record activity by date and animal type</p></div><span className="sim-mini-tag">PREVIEW</span></div>
          <Analytics records={props.records} />
        </section>
      </div>
    </div>
    <div className="simulation-footnote"><Sparkles size={13} />Sample animals, risk levels, and camera image are fictional product-preview content, not real detections.</div>
  </section>;
}

function RoadwayMap() {
  const examples = [
    { animal: 'Deer', detail: '94% · HIGH RISK', x: 265, y: 184, color: '#c45d4c' },
    { animal: 'Coyote', detail: '87% · MEDIUM', x: 390, y: 205, color: '#d09a49' },
    { animal: 'Raccoon', detail: '81% · LOW RISK', x: 480, y: 176, color: '#5e8b67' },
  ];
  return <div className="roadway-map camera-view"><svg viewBox="0 0 700 260" role="img" aria-label="Illustrative camera preview with three fictional wildlife detections at 7:30 PM">
      <defs><linearGradient id="camera-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#dce8dc" /><stop offset="1" stopColor="#edf1e8" /></linearGradient></defs>
      <rect width="700" height="260" fill="url(#camera-sky)" />
      <path d="M0 115 Q90 92 170 108 Q270 84 365 108 Q470 88 570 106 Q640 92 700 111 V150 H0Z" fill="#9bad91" />
      <path d="M0 142 L700 142 L700 260 L0 260Z" fill="#819078" />
      <path d="M255 142 L445 142 L590 260 L110 260Z" fill="#505853" />
      <path d="M344 146 L356 146 L361 165 L339 165Z M335 183 L365 183 L372 211 L328 211Z M320 229 L380 229 L392 260 L308 260Z" fill="#e6e3ce" opacity=".9" />
      <path d="M250 142 L110 260 M450 142 L590 260" stroke="#e4e4d4" strokeWidth="3" />
      <path d="M12 24h20v-12h20v12h12 M688 24h-20v-12h-20v12h-12 M12 236h20v12h20v-12h12 M688 236h-20v12h-20v-12h-12" fill="none" stroke="#ffffff" strokeWidth="2" opacity=".9" />
      <text x="350" y="22" textAnchor="middle" className="camera-overlay">CAMERA 01 · NORTH ROAD CROSSING</text>
      {examples.map((example) => <g key={example.animal} aria-label={`${example.animal}, ${example.detail}`}>
        <circle cx={example.x} cy={example.y} r="15" fill={example.color} opacity=".22" /><circle cx={example.x} cy={example.y} r="8" fill={example.color} stroke="white" strokeWidth="2" />
        <rect x={example.x - 48} y={example.y - 31} width="96" height="15" rx="3" fill="#26322d" opacity=".9" />
        <text x={example.x} y={example.y - 21} textAnchor="middle" className="camera-animal-label">{example.animal} · {example.detail}</text>
      </g>)}
    </svg><div className="camera-timestamp">SAMPLE · 7:30 PM</div>
      <div className="map-legend"><span><i className="legend-risk-high" />High risk</span><span><i className="legend-risk-medium" />Medium</span><span><i className="legend-risk-low" />Low</span><small>3 fictional detections · illustrative only</small></div>
    </div>;
}

function Analytics({ records }: { records: Detection[] }) {
  const week = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - offset));
    const sameDay = (record: Detection) => new Date(record.detected_at).toDateString() === date.toDateString();
    return { day: date.toLocaleDateString(undefined, { weekday: 'short' }), saved: records.filter(sameDay).length, warnings: records.filter((r) => sameDay(r) && r.warning_triggered === true).length };
  });
  const animals = [...new Set(records.map((r) => r.animal_class).filter((value): value is string => Boolean(value)))].map((animal) => ({ animal, count: records.filter((r) => r.animal_class === animal).length })).sort((a, b) => b.count - a.count).slice(0, 4);
  const maxDay = Math.max(1, ...week.map((day) => day.saved));
  const maxAnimal = Math.max(1, ...animals.map((item) => item.count));
  const maxWarn = Math.max(1, ...week.map((day) => day.warnings));
  return <div className="analytics-charts">
    <div className="mini-chart"><div className="mini-chart-title"><b>Detections over time</b><span>7 days</span></div><div className="mini-bars">{week.map((day) => <div className="mini-bar-group" key={day.day}><div className="mini-bar-pair"><i className="saved-bar" style={{ height: `${Math.max(day.saved ? 3 : 0, day.saved / maxDay * 34)}px` }} title={`Records: ${day.saved}`} /></div><small>{day.day}</small></div>)}</div></div>
    <div className="mini-chart"><div className="mini-chart-title"><b>By animal type</b><span>{records.length} total</span></div><div className="animal-analytics">{animals.length === 0 ? <span className="mini-empty">No classified animals</span> : animals.map((item) => <div className="animal-analytics-row" key={item.animal}><span>{item.animal.split(' ')[0]}</span><div><i className="saved-bar" style={{ width: `${item.count / maxAnimal * 100}%` }} /></div><b>{item.count}</b></div>)}</div></div>
    <div className="mini-chart"><div className="mini-chart-title"><b>Warning events</b><span>{records.filter((r) => r.warning_triggered).length} total</span></div><div className="mini-bars warning-bars">{week.map((day) => <div className="mini-bar-group" key={day.day}><div className="mini-bar-pair"><i className="saved-warning-bar" style={{ height: `${Math.max(day.warnings ? 3 : 0, day.warnings / maxWarn * 34)}px` }} title={`Warning events: ${day.warnings}`} /></div><small>{day.day}</small></div>)}</div></div>
    <div className="analytics-legend"><span><i className="saved-bar" />{isDemoRecords(records) ? 'Sample records' : 'Database records'}</span></div>
  </div>;
}

function isDemoRecords(records: Detection[]): boolean {
  return records.some((record) => record.id.startsWith('demo-'));
}
