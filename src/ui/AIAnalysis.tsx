import { useEffect, useState } from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2, ImagePlus, LoaderCircle, Upload } from 'lucide-react';

type Prediction = {
  model_name: string;
  device: string;
  image_width: number;
  image_height: number;
  inference_ms: number;
  confidence_threshold: number;
  detections: Array<{
    animal_class: string;
    confidence: number;
    class_id: number;
    bounding_box: { x_min: number; y_min: number; x_max: number; y_max: number };
  }>;
};

const detectionColors = ['#00cbb3', '#263e8b', '#df8f27', '#8a55ad', '#c94e58'];

const serviceUrl = (import.meta.env.VITE_AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export default function AIAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<Prediction | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [service, setService] = useState<'checking' | 'ready' | 'offline'>('checking');

  useEffect(() => {
    fetch(`${serviceUrl}/health`).then((response) => {
      if (!response.ok) throw new Error('Service unavailable');
      return response.json();
    }).then(() => setService('ready')).catch(() => setService('offline'));
  }, []);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const analyze = async () => {
    if (!file) return;
    setBusy(true); setError(''); setResult(null);
    const body = new FormData();
    body.append('file', file);
    try {
      const response = await fetch(`${serviceUrl}/predict`, { method: 'POST', body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'NanoDetector could not analyze this image.');
      setResult(payload as Prediction);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not reach the local NanoDetector service.');
    } finally { setBusy(false); }
  };

  return <section className="ai-analysis-page">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />LOCAL MODEL INFERENCE</div><h1>NanoDetector image analysis</h1><p>Upload a camera-trap image to run the real NanoDetector model on this computer.</p></div><span className={`ai-service-pill ai-service-${service}`}><i />{service === 'ready' ? 'LOCAL SERVICE READY' : service === 'checking' ? 'CHECKING SERVICE' : 'LOCAL SERVICE OFFLINE'}</span></div>
    <div className="ai-disclaimer"><BrainCircuit size={17} /><span><b>Model analysis only.</b> Results are not saved to Supabase and do not activate hardware.</span><span className="sim-mini-tag">NANODETECTOR</span></div>
    {error && <div className="error-banner" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
    <div className="ai-workspace">
      <section className="panel ai-upload-panel">
        <div className="analytics-heading"><div><h3>Test image</h3><p>JPEG, PNG, or WebP · up to 15 MB</p></div></div>
        <label className="ai-dropzone">
          {preview ? <div className="ai-image-preview"><img src={preview} alt="Selected wildlife image preview" />{result && <svg className="ai-image-overlay" viewBox={`0 0 ${result.image_width} ${result.image_height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${result.detections.length} NanoDetector bounding boxes`}>{result.detections.map((detection, index) => {
            const { x_min: x, y_min: y, x_max, y_max } = detection.bounding_box;
            const color = detectionColors[index % detectionColors.length];
            const fontSize = Math.max(12, result.image_width * 0.038);
            const labelHeight = fontSize * 1.35;
            const labelWidth = Math.min(result.image_width - x, (detection.animal_class.length + 7) * fontSize * 0.61 + 12);
            const labelY = Math.max(0, y - labelHeight);
            return <g key={`${detection.class_id}-${index}`}>
              <rect x={x} y={y} width={Math.max(0, x_max - x)} height={Math.max(0, y_max - y)} fill="none" stroke={color} strokeWidth={Math.max(2, result.image_width * 0.008)} />
              <rect x={x} y={labelY} width={labelWidth} height={labelHeight} rx={2} fill={color} />
              <text x={x + 5} y={labelY + fontSize} fill="#fff" fontSize={fontSize} fontWeight={700} fontFamily="Arial, sans-serif">{detection.animal_class} {detection.confidence.toFixed(2)}</text>
            </g>;
          })}</svg>}</div> : <span className="ai-empty-upload"><ImagePlus size={26} /><b>Select a camera-trap image</b><small>The image stays on this computer and is sent only to the local model service.</small></span>}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); setError(''); }} />
        </label>
        <button className="button ai-run-button" onClick={() => void analyze()} disabled={!file || busy || service !== 'ready'}>{busy ? <LoaderCircle size={15} className="ai-spinner" /> : <BrainCircuit size={15} />}{busy ? 'Analyzing image…' : 'Run NanoDetector'}</button>
      </section>
      <section className="panel ai-results-panel">
        <div className="analytics-heading"><div><h3>Detection results</h3><p>{result ? `${result.model_name} · ${result.device.toUpperCase()} · ${result.inference_ms} ms` : 'Predictions will appear here after analysis.'}</p></div>{result && <span className="sim-mini-tag">ACTUAL MODEL OUTPUT</span>}</div>
        {!result ? <div className="ai-no-results"><Upload size={18} /><span>No analysis run yet</span></div> : result.detections.length === 0 ? <div className="ai-no-results"><CheckCircle2 size={18} /><span>No animals detected above the {Math.round(result.confidence_threshold * 100)}% threshold.</span></div> : <div className="ai-detection-list">{result.detections.map((detection, index) => <div className="ai-detection-row" key={`${detection.class_id}-${index}`}><span className="animal-icon animal-other"><BrainCircuit size={15} /></span><span><b>{detection.animal_class}</b><small>Box: {Math.round(detection.bounding_box.x_min)}, {Math.round(detection.bounding_box.y_min)} – {Math.round(detection.bounding_box.x_max)}, {Math.round(detection.bounding_box.y_max)}</small></span><strong>{Math.round(detection.confidence * 100)}%</strong></div>)}</div>}
        {result && <div className="ai-result-meta"><span>{result.image_width} × {result.image_height}px</span><span>Confidence threshold {Math.round(result.confidence_threshold * 100)}%</span><span>Model: {result.model_name}</span></div>}
      </section>
    </div>
    <p className="simulation-footnote"><BrainCircuit size={13} />NanoDetector is selected by the local service configuration. A future model can use the same adapter contract when the inference host changes.</p>
  </section>;
}
