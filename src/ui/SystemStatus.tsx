import { Camera, Clock3, Database, Waves } from 'lucide-react';

type Props = {
  databaseLoading: boolean;
  databaseError: boolean;
  demoMode: boolean;
  lastRefresh: string | null;
};

export default function SystemStatus({ databaseLoading, databaseError, demoMode, lastRefresh }: Props) {
  return <section className="panel system-status-panel status-page-panel">
    <div className="status-panel-heading"><div><h3>System status</h3><p>Database connectivity and local model analysis availability</p></div><span className="sim-mini-tag">DEVICE CAMERA</span></div>
    <div className="status-items">
      <StatusItem icon={<Database size={16} />} label="Database" value={demoMode ? 'Demo records' : databaseLoading ? 'Checking…' : databaseError ? 'Connection error' : 'Supabase connected'} tone={demoMode ? 'amber' : databaseError ? 'red' : 'green'} simulated={demoMode} />
      <StatusItem icon={<Camera size={16} />} label="Camera feed" value="Browser camera · AI Analysis tab" tone="slate" simulated={false} />
      <StatusItem icon={<Waves size={16} />} label="AI processing" value="On-demand image analysis · AI Analysis tab" tone="slate" simulated={false} />
      <StatusItem icon={<Clock3 size={16} />} label="Last data refresh" value={lastRefresh ? new Date(lastRefresh).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'Not refreshed yet'} tone="slate" simulated={demoMode} />
    </div>
    <p className="status-page-note">The AI Analysis tab can open a camera exposed to this device’s browser and capture a frame for local NanoDetector analysis. Camera permission and a compatible camera driver are required. It does not run continuous inference.</p>
  </section>;
}

function StatusItem({ icon, label, value, tone, simulated }: { icon: React.ReactNode; label: string; value: string; tone: string; simulated: boolean }) {
  return <div className="status-item"><span className={`status-item-icon status-${tone}`}>{icon}</span><div><span>{label}{simulated && <i className="status-sim-label">SIM</i>}</span><b>{value}</b></div><span className={`status-indicator indicator-${tone}`} /></div>;
}
