from __future__ import annotations

import os
import time
from functools import lru_cache
from io import BytesIO
from typing import Protocol

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import hf_hub_download
from PIL import Image, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool

MAX_IMAGE_BYTES = 15 * 1024 * 1024
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


app = FastAPI(title="WildWatch local inference", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
