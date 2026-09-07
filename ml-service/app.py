"""
Strix ML microservice
======================
Flask service that validates whether an uploaded civic-issue photo actually
matches the category the citizen selected, and (optionally) generates a
short auto-caption for the image.

Two modes, chosen automatically at startup:
  - "model" mode: a trained Keras CNN exists at model/strix_cnn.h5 -> used
    for real predictions. Train one with model/train.py once you have a
    labeled image dataset (see model/train.py and the README for details).
  - "mock" mode: no trained model found -> falls back to a deterministic,
    image-derived heuristic so the rest of the platform (backend, frontend,
    dashboards) is fully testable without a dataset or GPU.

Run:
    python app.py
Endpoints:
    GET  /health              -> service status + mode + category list
    POST /validate             -> multipart: image (file), category (str)
    POST /caption               -> multipart: image (file)
"""

import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "strix_cnn.h5")
CATEGORIES_PATH = os.path.join(BASE_DIR, "model", "categories.json")
IMG_SIZE = (224, 224)

with open(CATEGORIES_PATH) as f:
    CATEGORIES = json.load(f)["categories"]

app = Flask(__name__)
CORS(app)

_model = None
_mode = "mock"


def load_model():
    """Loads the trained CNN if present; otherwise stays in mock mode.
    TensorFlow is only imported here, so mock mode never requires it."""
    global _model, _mode
    if os.path.exists(MODEL_PATH):
        try:
            from tensorflow.keras.models import load_model as keras_load_model

            _model = keras_load_model(MODEL_PATH)
            _mode = "model"
            print(f"[ml-service] Loaded trained CNN from {MODEL_PATH}")
            return
        except Exception as e:
            print(f"[ml-service] Found {MODEL_PATH} but failed to load it: {e}")
            print("[ml-service] Falling back to mock mode.")
    else:
        print(f"[ml-service] No trained model at {MODEL_PATH}. Running in MOCK mode.")
        print("[ml-service] Train a real model with: python model/train.py")
    _model = None
    _mode = "mock"


load_model()


def preprocess_image(file_stream):
    img = Image.open(file_stream).convert("RGB")
    resized = img.resize(IMG_SIZE)
    arr = np.array(resized) / 255.0
    return np.expand_dims(arr, axis=0), img


def model_predict(arr):
    preds = _model.predict(arr, verbose=0)[0]
    idx = int(np.argmax(preds))
    return CATEGORIES[idx], float(preds[idx])


def mock_predict(img: Image.Image, requested_category: str):
    """Deterministic heuristic: derives a plausible confidence score from the
    image's own pixel statistics (rather than pure randomness), so repeated
    calls on the same image return the same result. This is NOT real image
    understanding - it exists purely so the end-to-end pipeline (upload ->
    validate -> save -> dashboard) works before a real dataset/model exists."""
    small = np.array(img.resize((64, 64))) / 255.0
    brightness = float(small.mean())
    contrast = float(small.std())
    seed = int((brightness * 10007 + contrast * 7919) * 1000) % 1000
    confidence = 0.62 + (seed / 1000.0) * 0.33  # roughly 0.62 - 0.95
    return requested_category, round(confidence, 3)


def generate_heuristic_caption(img: Image.Image, predicted_category: str = None):
    """Lightweight, non-ML caption using basic image statistics. Swap this
    for a real captioning model (e.g. BLIP / a fine-tuned show-and-tell
    model) once you're ready to invest in that part of the stack."""
    small = np.array(img.resize((64, 64))) / 255.0
    brightness = small.mean()
    lighting = "well-lit" if brightness > 0.5 else "dim or low-light"

    category_phrases = {
        "pothole": "a damaged section of road surface",
        "streetlight": "a streetlight fixture",
        "water_leakage": "water leakage or pooling",
        "garbage": "accumulated garbage or waste",
        "construction_hazard": "an active or unmarked construction area",
    }
    subject = category_phrases.get(predicted_category, "a civic issue")
    return f"A {lighting} photo showing {subject}."


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "mode": _mode, "categories": CATEGORIES})


@app.route("/validate", methods=["POST"])
def validate():
    if "image" not in request.files:
        return jsonify({"error": "image file is required (multipart field 'image')"}), 400

    category = request.form.get("category")
    if category not in CATEGORIES:
        return jsonify({"error": f"category must be one of {CATEGORIES}"}), 400

    file = request.files["image"]
    try:
        arr, img = preprocess_image(file.stream)
    except Exception as e:
        return jsonify({"error": f"Could not read image: {e}"}), 400

    if _mode == "model" and _model is not None:
        predicted_category, confidence = model_predict(arr)
        is_valid = (predicted_category == category) and confidence >= 0.5
    else:
        predicted_category, confidence = mock_predict(img, category)
        is_valid = confidence >= 0.55

    return jsonify(
        {
            "is_valid": bool(is_valid),
            "confidence": round(float(confidence), 3),
            "predicted_category": predicted_category,
            "mode": _mode,
        }
    )


@app.route("/caption", methods=["POST"])
def caption():
    if "image" not in request.files:
        return jsonify({"error": "image file is required (multipart field 'image')"}), 400

    file = request.files["image"]
    try:
        img = Image.open(file.stream).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Could not read image: {e}"}), 400

    predicted_category = None
    if _mode == "model" and _model is not None:
        arr = np.expand_dims(np.array(img.resize(IMG_SIZE)) / 255.0, axis=0)
        predicted_category, _ = model_predict(arr)

    return jsonify({"caption": generate_heuristic_caption(img, predicted_category), "mode": _mode})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 6000))
    app.run(host="0.0.0.0", port=port, debug=True)
