import { Camera, Clock3, Database, Waves } from 'lucide-react';

type Props = {
  databaseLoading: boolean;
  databaseError: boolean;
  demoMode: boolean;
  lastRefresh: string | null;
};

export default function SystemStatus({ databaseLoading, databaseError, demoMode, lastRefresh }: Props) {
  return <section className="panel system-status-panel status-page-panel">
    <div className="status-panel-heading"><div><h3>System status</h3><p>Database connectivity and clearly labeled camera/AI preview states</p></div><span className="sim-mini-tag">CAMERA AND AI ARE PREVIEW ONLY</span></div>
    <div className="status-items">
      <StatusItem icon={<Database size={16} />} label="Database" value={demoMode ? 'Demo records' : databaseLoading ? 'Checking…' : databaseError ? 'Connection error' : 'Supabase connected'} tone={demoMode ? 'amber' : databaseError ? 'red' : 'green'} simulated={demoMode} />
      <StatusItem icon={<Camera size={16} />} label="Camera feed" value="Preview only · simulated" tone="amber" simulated />
      <StatusItem icon={<Waves size={16} />} label="AI processing" value="Not connected · preview only" tone="amber" simulated />
      <StatusItem icon={<Clock3 size={16} />} label="Last data refresh" value={lastRefresh ? new Date(lastRefresh).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'Not refreshed yet'} tone="slate" simulated={demoMode} />
    </div>
    <p className="status-page-note">Camera and AI indicators are examples for the product preview. No camera hardware or detection model is connected.</p>
  </section>;
}

function StatusItem({ icon, label, value, tone, simulated }: { icon: React.ReactNode; label: string; value: string; tone: string; simulated: boolean }) {
  return <div className="status-item"><span className={`status-item-icon status-${tone}`}>{icon}</span><div><span>{label}{simulated && <i className="status-sim-label">SIM</i>}</span><b>{value}</b></div><span className={`status-indicator indicator-${tone}`} /></div>;
}
