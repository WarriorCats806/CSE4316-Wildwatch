import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2, ImagePlus, LoaderCircle, Upload } from 'lucide-react';

type Detection = {
  animal_class: string;
  confidence: number;
  class_id: number;
  bounding_box: { x_min: number; y_min: number; x_max: number; y_max: number };
};

type ImagePrediction = {
  model_name: string;
  device: string;
  image_width: number;
  image_height: number;
  inference_ms: number;
  confidence_threshold: number;
  detections: Detection[];
};

type VideoPrediction = {
  model_name: string;
  device: string;
  video_width: number;
  video_height: number;
  video_duration_seconds: number;
  processed_frames: number;
  sampling_interval_seconds: number;
  confidence_threshold: number;
  frames: Array<{ time_seconds: number; inference_ms: number; detections: Detection[] }>;
};

type Prediction = ImagePrediction | VideoPrediction;
const detectionColors = ['#00cbb3', '#263e8b', '#df8f27', '#8a55ad', '#c94e58'];
const serviceUrl = (import.meta.env.VITE_AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const videoExtensions = /\.(mp4|mov|avi|mkv|webm)$/i;
const isVideoFile = (file: File | null) => Boolean(file && (file.type.startsWith('video/') || videoExtensions.test(file.name)));
const isVideoResult = (result: Prediction | null): result is VideoPrediction => Boolean(result && 'frames' in result);
const formatTimestamp = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export default function AIAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<Prediction | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [service, setService] = useState<'checking' | 'ready' | 'offline'>('checking');
  const [videoTime, setVideoTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const videoFile = isVideoFile(file);
  const videoResult = isVideoResult(result) ? result : null;
  const imageResult = result && !isVideoResult(result) ? result : null;
  const activeFrame = videoResult?.frames.reduce((nearest, frame) => Math.abs(frame.time_seconds - videoTime) < Math.abs(nearest.time_seconds - videoTime) ? frame : nearest);
  const showFrameOverlay = Boolean(videoResult && activeFrame && Math.abs(activeFrame.time_seconds - videoTime) <= Math.max(0.75, videoResult.sampling_interval_seconds * 0.75));
  const resultItems = videoResult
    ? videoResult.frames.flatMap((frame) => frame.detections.map((detection) => ({ detection, time: frame.time_seconds })))
    : imageResult?.detections.map((detection) => ({ detection, time: undefined })) ?? [];

  const analyze = async () => {
    if (!file) return;
    setBusy(true); setError(''); setResult(null);
    const body = new FormData();
    body.append('file', file);
    try {
      const endpoint = videoFile ? 'predict-video' : 'predict';
      const response = await fetch(`${serviceUrl}/${endpoint}`, { method: 'POST', body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `NanoDetector could not analyze this ${videoFile ? 'video' : 'image'}.`);
      setResult(payload as Prediction);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not reach the local NanoDetector service.');
    } finally { setBusy(false); }
  };

  return <section className="ai-analysis-page">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />LOCAL MODEL INFERENCE</div><h1>NanoDetector image &amp; video analysis</h1><p>Upload a camera-trap image or short video to analyze it on this computer.</p></div><span className={`ai-service-pill ai-service-${service}`}><i />{service === 'ready' ? 'LOCAL SERVICE READY' : service === 'checking' ? 'CHECKING SERVICE' : 'LOCAL SERVICE OFFLINE'}</span></div>
    <div className="ai-disclaimer"><BrainCircuit size={17} /><span><b>On-demand model analysis.</b> Uploaded media stays local and is not saved to Supabase or used to control hardware.</span><span className="sim-mini-tag">NANODETECTOR</span></div>
    {error && <div className="error-banner" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
    <div className="ai-workspace">
      <section className="panel ai-upload-panel">
        <div className="analytics-heading"><div><h3>Test media</h3><p>Image ≤15 MB · Video ≤30 seconds and 100 MB</p></div></div>
        <label className="ai-dropzone">
          {preview ? <div className="ai-image-preview">
            {videoFile ? <video ref={videoRef} src={preview} controls playsInline onClick={(event) => event.stopPropagation()} onTimeUpdate={(event) => setVideoTime(event.currentTarget.currentTime)} onLoadedMetadata={() => setVideoTime(0)} aria-label="Uploaded test video" /> : <img src={preview} alt="Selected wildlife image preview" />}
            {imageResult && <DetectionOverlay width={imageResult.image_width} height={imageResult.image_height} detections={imageResult.detections} />}
            {videoResult && showFrameOverlay && activeFrame && <DetectionOverlay width={videoResult.video_width} height={videoResult.video_height} detections={activeFrame.detections} />}
            {videoResult && <span className="ai-video-analysis-tag">ANALYZED · {videoResult.processed_frames} FRAMES</span>}
          </div> : <span className="ai-empty-upload"><ImagePlus size={26} /><b>Select a camera-trap image or video</b><small>Images and videos are sent only to the local model service for on-demand analysis.</small></span>}
          <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm" onChange={(event) => { const selected = event.target.files?.[0] ?? null; setFile(selected); setVideoTime(0); setResult(null); setError(''); }} />
        </label>
        <button className="button ai-run-button" onClick={() => void analyze()} disabled={!file || busy || service !== 'ready'}>{busy ? <LoaderCircle size={15} className="ai-spinner" /> : <BrainCircuit size={15} />}{busy ? 'Analyzing media…' : videoFile ? 'Analyze test video' : 'Run NanoDetector'}</button>
      </section>
      <section className="panel ai-results-panel">
        <div className="analytics-heading"><div><h3>Detection results</h3><p>{imageResult ? `${imageResult.model_name} · ${imageResult.device.toUpperCase()} · ${imageResult.inference_ms} ms` : videoResult ? `${videoResult.model_name} · ${videoResult.device.toUpperCase()} · ${videoResult.processed_frames} sampled frames` : 'Predictions will appear here after analysis.'}</p></div>{result && <span className="sim-mini-tag">ACTUAL MODEL OUTPUT</span>}</div>
        {!result ? <div className="ai-no-results"><Upload size={18} /><span>No analysis run yet</span></div> : resultItems.length === 0 ? <div className="ai-no-results"><CheckCircle2 size={18} /><span>No animals detected above the {Math.round(result.confidence_threshold * 100)}% threshold{videoResult ? ' in the sampled video frames' : ''}.</span></div> : <div className="ai-detection-list">{resultItems.map(({ detection, time }, index) => <div className="ai-detection-row" key={`${time ?? 'image'}-${detection.class_id}-${index}`} onClick={() => { if (time !== undefined && videoRef.current) videoRef.current.currentTime = time; }} role={time !== undefined ? 'button' : undefined} tabIndex={time !== undefined ? 0 : undefined} onKeyDown={(event) => { if (time !== undefined && (event.key === 'Enter' || event.key === ' ')) videoRef.current && (videoRef.current.currentTime = time); }}><span className="animal-icon animal-other"><BrainCircuit size={15} /></span><span><b>{detection.animal_class}</b><small>{time !== undefined ? `${formatTimestamp(time)} · ` : ''}Box: {Math.round(detection.bounding_box.x_min)}, {Math.round(detection.bounding_box.y_min)} – {Math.round(detection.bounding_box.x_max)}, {Math.round(detection.bounding_box.y_max)}</small></span><strong>{Math.round(detection.confidence * 100)}%</strong></div>)}</div>}
        {imageResult && <div className="ai-result-meta"><span>{imageResult.image_width} × {imageResult.image_height}px</span><span>Confidence threshold {Math.round(imageResult.confidence_threshold * 100)}%</span><span>Model: {imageResult.model_name}</span></div>}
        {videoResult && <div className="ai-result-meta"><span>{videoResult.video_width} × {videoResult.video_height}px</span><span>{videoResult.video_duration_seconds}s · {videoResult.processed_frames} frames</span><span>About {videoResult.sampling_interval_seconds}s apart</span><span>Threshold {Math.round(videoResult.confidence_threshold * 100)}%</span></div>}
      </section>
    </div>
    <p className="simulation-footnote"><BrainCircuit size={13} />Video analysis samples up to 30 frames, about one per second. It does not stream from a camera or create saved detection records.</p>
  </section>;
}

function DetectionOverlay({ width, height, detections }: { width: number; height: number; detections: Detection[] }) {
  return <svg className="ai-image-overlay" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${detections.length} NanoDetector bounding boxes`}>{detections.map((detection, index) => {
    const { x_min: x, y_min: y, x_max, y_max } = detection.bounding_box;
    const color = detectionColors[index % detectionColors.length];
    const fontSize = Math.max(12, width * 0.038);
    const labelHeight = fontSize * 1.35;
    const labelWidth = Math.min(width - x, (detection.animal_class.length + 7) * fontSize * 0.61 + 12);
    const labelY = Math.max(0, y - labelHeight);
    return <g key={`${detection.class_id}-${index}`}>
      <rect x={x} y={y} width={Math.max(0, x_max - x)} height={Math.max(0, y_max - y)} fill="none" stroke={color} strokeWidth={Math.max(2, width * 0.008)} />
      <rect x={x} y={labelY} width={labelWidth} height={labelHeight} rx={2} fill={color} />
      <text x={x + 5} y={labelY + fontSize} fill="#fff" fontSize={fontSize} fontWeight={700} fontFamily="Arial, sans-serif">{detection.animal_class} {detection.confidence.toFixed(2)}</text>
    </g>;
  })}</svg>;
}
