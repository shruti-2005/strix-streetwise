const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");

const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:6000";
const ML_ENABLED = (process.env.ML_SERVICE_ENABLED || "true") === "true";

/**
 * Sends the uploaded image + selected category to the Flask CNN microservice
 * for validation. Falls back to a deterministic mock if the service is
 * disabled or unreachable, so the rest of the app is never blocked by ML infra.
 *
 * @param {string} imagePath - absolute path to the uploaded image on disk
 * @param {string} category - the category the citizen selected
 * @returns {Promise<{isValid: boolean, confidence: number, predictedCategory: string, mode: 'model'|'mock'}>}
 */
async function validateImage(imagePath, category) {
  if (!ML_ENABLED) {
    return mockValidate(category);
  }

  try {
    const form = new FormData();
    form.append("image", fs.createReadStream(imagePath));
    form.append("category", category);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(`${ML_URL}/validate`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) throw new Error(`ML service responded ${resp.status}`);
    const data = await resp.json();

    return {
      isValid: !!data.is_valid,
      confidence: typeof data.confidence === "number" ? data.confidence : 0,
      predictedCategory: data.predicted_category || "unknown",
      mode: data.mode || "model",
    };
  } catch (err) {
    console.warn(`[mlClient] ML service unavailable (${err.message}). Falling back to mock validation.`);
    return mockValidate(category);
  }
}

/**
 * Deterministic-ish mock so the rest of the pipeline (status flow, dashboard,
 * map, sockets) is fully testable without a trained model or GPU.
 * Optimistic: assumes valid with a randomized-but-plausible confidence.
 */
function mockValidate(category) {
  const confidence = 0.72 + Math.random() * 0.25; // 0.72 - 0.97
  return {
    isValid: true,
    confidence: Number(confidence.toFixed(2)),
    predictedCategory: category,
    mode: "mock",
  };
}

/**
 * Requests an auto-generated caption for an image from the ML service.
 * Purely additive - failures here never block report submission.
 */
async function getCaption(imagePath) {
  if (!ML_ENABLED) return null;
  try {
    const form = new FormData();
    form.append("image", fs.createReadStream(imagePath));

    const resp = await fetch(`${ML_URL}/caption`, { method: "POST", body: form });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.caption || null;
  } catch (err) {
    console.warn(`[mlClient] Caption request failed: ${err.message}`);
    return null;
  }
}

module.exports = { validateImage, getCaption };
