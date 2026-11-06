from __future__ import annotations

import os
import math
import tempfile
import time
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Protocol

import cv2
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import hf_hub_download
from PIL import Image, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool

MAX_IMAGE_BYTES = 15 * 1024 * 1024
MAX_VIDEO_BYTES = 100 * 1024 * 1024
MAX_VIDEO_SECONDS = 30
MAX_VIDEO_FRAMES = 30
VIDEO_SUFFIXES = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
NANODETECTOR_REPO = "sheneman/NanoDetector"
NANODETECTOR_WEIGHTS = "NanoDetector_YOLOv5m_v1.pt"
# PyTorch Hub accepts Git refs (branches/tags), not arbitrary commit hashes.
# NanoDetector's checkpoint is a standard YOLOv5 checkpoint; v7.0 retains the
# custom-model Hub entry point while remaining a reproducible upstream release.
YOLOV5_SOURCE = "ultralytics/yolov5:v7.0"
CONFIDENCE_THRESHOLD = float(os.getenv("WILDLIFE_CONFIDENCE_THRESHOLD", "0.75"))


class Detector(Protocol):
    model_name: str

    def predict(self, image: Image.Image) -> dict:
        """Return normalized image detections for the dashboard."""


class NanoDetectorAdapter:
    model_name = "NanoDetector_YOLOv5m_v1"

    def __init__(self) -> None:
        weights_path = os.getenv("NANODETECTOR_WEIGHTS") or hf_hub_download(
            repo_id=NANODETECTOR_REPO,
            filename=NANODETECTOR_WEIGHTS,
        )
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = torch.hub.load(
            YOLOV5_SOURCE,
            "custom",
            path=weights_path,
            trust_repo=True,
        )
        self.model.to(self.device)
        self.model.conf = CONFIDENCE_THRESHOLD

    def predict(self, image: Image.Image) -> dict:
        started = time.perf_counter()
        results = self.model(image)
        predictions = results.pandas().xyxy[0]
        detections = [
            {
                "animal_class": str(row["name"]),
                "confidence": float(row["confidence"]),
                "class_id": int(row["class"]),
                "bounding_box": {
                    "x_min": float(row["xmin"]),
                    "y_min": float(row["ymin"]),
                    "x_max": float(row["xmax"]),
                    "y_max": float(row["ymax"]),
                },
            }
            for _, row in predictions.iterrows()
        ]
        return {
            "model_name": self.model_name,
            "device": self.device,
            "image_width": image.width,
            "image_height": image.height,
            "inference_ms": round((time.perf_counter() - started) * 1000, 1),
            "confidence_threshold": CONFIDENCE_THRESHOLD,
            "detections": detections,
        }


@lru_cache(maxsize=1)
def get_detector() -> Detector:
    # Future model adapters can be registered here and selected with WILDLIFE_MODEL.
    selected_model = os.getenv("WILDLIFE_MODEL", "nanodetector").lower()
    if selected_model == "nanodetector":
        return NanoDetectorAdapter()
    raise RuntimeError(f"Unknown wildlife model '{selected_model}'. Available models: nanodetector")


def analyze_video_file(path: str) -> dict:
    capture = cv2.VideoCapture(path)
    try:
        if not capture.isOpened():
            raise ValueError("The video could not be opened. Try an MP4 encoded with H.264.")

        fps = capture.get(cv2.CAP_PROP_FPS)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if not math.isfinite(fps) or fps <= 0 or frame_count <= 0 or width <= 0 or height <= 0:
            raise ValueError("The uploaded video has invalid frame metadata.")

        duration = frame_count / fps
        if duration > MAX_VIDEO_SECONDS:
            raise ValueError(f"Videos must be {MAX_VIDEO_SECONDS} seconds or shorter.")

        sample_count = min(MAX_VIDEO_FRAMES, max(1, math.ceil(duration)))
        sample_interval = duration / sample_count
        detector = get_detector()
        frames = []
        for sample_index in range(sample_count):
            timestamp = sample_index * sample_interval
            capture.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
            read_ok, frame = capture.read()
            if not read_ok or frame is None:
                continue
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            prediction = detector.predict(Image.fromarray(rgb))
            frames.append({
                "time_seconds": round(timestamp, 2),
                "inference_ms": prediction["inference_ms"],
                "detections": prediction["detections"],
            })

        if not frames:
            raise ValueError("No readable frames were found in the uploaded video.")
        return {
            "model_name": detector.model_name,
            "device": detector.device,
            "video_width": width,
            "video_height": height,
            "video_duration_seconds": round(duration, 2),
            "processed_frames": len(frames),
            "sampling_interval_seconds": round(sample_interval, 2),
            "confidence_threshold": CONFIDENCE_THRESHOLD,
            "frames": frames,
        }
    finally:
        capture.release()


app = FastAPI(title="WildWatch local inference", version="0.1.0")
allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
allowed_origins.extend(
    origin.strip()
    for origin in os.getenv("WILDLIFE_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ready",
        "model": os.getenv("WILDLIFE_MODEL", "nanodetector"),
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "model_loaded": get_detector.cache_info().currsize > 0,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image.")
    contents = await file.read(MAX_IMAGE_BYTES + 1)
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 15 MB or smaller.")
    try:
        image = Image.open(BytesIO(contents)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="The uploaded file is not a readable image.") from None

    try:
        detector = get_detector()
        return await run_in_threadpool(detector.predict, image)
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"NanoDetector could not run: {error}") from error


@app.post("/predict-video")
async def predict_video(file: UploadFile = File(...)) -> dict:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in VIDEO_SUFFIXES or not (file.content_type or "").startswith("video/"):
        raise HTTPException(status_code=415, detail="Upload an MP4, MOV, AVI, MKV, or WebM video.")
    contents = await file.read(MAX_VIDEO_BYTES + 1)
    if len(contents) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="Video must be 100 MB or smaller.")

    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temporary_file:
            temporary_path = temporary_file.name
            temporary_file.write(contents)
        return await run_in_threadpool(analyze_video_file, temporary_path)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"NanoDetector could not analyze this video: {error}") from error
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.unlink(temporary_path)
