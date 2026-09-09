import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../api/categories";
import { issuesApi } from "../api/api";
import "./ReportForm.css";

const LOCALITY_KEY = "strix_locality";

export default function ReportForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [locality, setLocality] = useState(localStorage.getItem(LOCALITY_KEY) || "");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported by this browser. You can still submit without precise GPS.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setError(`Couldn't get your location: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!imageFile) return setError("Please upload a photo of the issue.");
    if (!category) return setError("Please select an issue category.");
    if (!description.trim()) return setError("Please add a short description.");
    if (!coords) return setError("Please capture your GPS location so authorities know where this is.");

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("latitude", coords.lat);
    formData.append("longitude", coords.lng);
    if (address) formData.append("address", address);
    if (locality) {
      formData.append("locality", locality);
      localStorage.setItem(LOCALITY_KEY, locality);
    }

    setSubmitting(true);
    try {
      const { data } = await issuesApi.create(formData);
      setResult(data);
      setTimeout(() => navigate("/my-reports"), 1600);
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong submitting your report.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="report-form card" onSubmit={handleSubmit}>
      <h2>Report a civic issue</h2>
      <p className="text-soft" style={{ marginTop: 4, marginBottom: 20 }}>
        A photo, a category, and your location — Strix validates the image and routes it to the right department.
      </p>

      <div className="field">
        <label>Photo of the issue</label>
        <div
          className="report-dropzone"
          onClick={() => fileInputRef.current?.click()}
          style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : undefined}
        >
          {!imagePreview && <span>Tap to upload a photo</span>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <span className="hint">JPG, PNG or WEBP. Our CNN checks this matches the category you select below.</span>
      </div>

      <div className="field">
        <label>Category</label>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              className={`category-pick ${category === c.value ? "selected" : ""}`}
              onClick={() => setCategory(c.value)}
            >
              <span style={{ fontSize: "1.3rem" }}>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={3}
          placeholder="e.g. Large pothole in the middle of the road, causing vehicles to swerve."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Location</label>
        <div className="flex gap-3 items-center">
          <button type="button" className="btn btn-outline btn-sm" onClick={captureLocation} disabled={locating}>
            {locating ? "Locating…" : coords ? "📍 Location captured" : "📍 Use my current location"}
          </button>
          {coords && (
            <span className="text-faint" style={{ fontSize: "0.78rem" }}>
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="address">Landmark / address (optional)</label>
        <input id="address" type="text" placeholder="e.g. Outside City Market, Main Road" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="locality">Locality (for status updates + hazard alerts)</label>
        <input id="locality" type="text" placeholder="e.g. Downtown" value={locality} onChange={(e) => setLocality(e.target.value)} />
      </div>

      {error && <div className="report-alert report-alert-error">{error}</div>}
      {result && (
        <div className="report-alert report-alert-success">
          Report submitted. CNN match confidence: {Math.round((result.validation?.confidence || 0) * 100)}%
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
