# Strix / StreetWise

Real-time civic issue reporting and construction-hazard awareness platform.
MERN stack + a separate Flask/TensorFlow ML microservice for CNN image validation.

```
strix/
├── backend/       Node.js + Express + MongoDB + Socket.io  (REST API, real-time)
├── ml-service/    Python + Flask + TensorFlow/Keras          (CNN image validation)
└── frontend/      React (Vite) + Leaflet + PWA                (citizen + authority UI)
```

## What's built

- **Citizen flow**: anonymous (no signup) or registered login → report an issue with photo + GPS + description → CNN validates the photo matches the selected category → live map + status tracking (pending → in progress → resolved).
- **Authority flow**: dashboard queue → verify/prioritize → assign → resolve, plus aggregate analytics.
- **Construction hazard awareness**: geo-fenced alerts warn nearby citizens in real time via Socket.io.
- **ML validation**: runs against a real trained CNN once you provide one, and transparently falls back to a mock validator so the rest of the app works with zero setup.

---

## 1. Prerequisites

- Node.js 18+ and npm
- Python 3.10+ and pip
- MongoDB running locally (`mongod`) or a MongoDB Atlas connection string

## 2. Run the backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed               # optional: creates demo authority + citizen accounts and sample issues
npm run dev                 # starts on http://localhost:5000
```

Demo accounts created by `npm run seed`:
| Role                | Email                             | Password    |
|---------------------|------------------------------------|-------------|
| Authority (Roads)   | roads.authority@strix.demo         | password123 |
| Authority (Sanitation) | sanitation.authority@strix.demo | password123 |
| Citizen             | citizen@strix.demo                 | password123 |

## 3. Run the ML microservice

```bash
cd ml-service
pip install -r requirements.txt   # tensorflow is only needed once you train/load a real model
python app.py                       # starts on http://localhost:6000
```

No trained model yet? That's fine — it starts in **mock mode** automatically (see below).
Once you have a dataset, see "Training a real CNN" below.

## 4. Run the frontend

```bash
cd frontend
cp .env.example .env       # points VITE_API_URL at the backend
npm install
npm run dev                  # starts on http://localhost:5173
```

Open http://localhost:5173. You'll be dropped into an anonymous session immediately — report an
issue, watch it appear on the live map, then sign in with a demo authority account (`/login`) to
see it in the Authority Dashboard.

---

## Training a real CNN (optional, once you have a dataset)

1. Collect images for each category: `pothole`, `streetlight`, `water_leakage`, `garbage`,
   `construction_hazard`. Aim for 50-100+ images per category to start. Good sources: Kaggle
   ("pothole detection", "garbage classification" datasets), Roboflow Universe, or your own photos.
2. Arrange them as:
   ```
   ml-service/data/train/<category>/*.jpg
   ml-service/data/val/<category>/*.jpg
   ```
3. Train:
   ```bash
   cd ml-service
   python model/train.py --epochs 15
   ```
4. Restart `app.py` — it auto-detects `model/strix_cnn.h5` and switches from mock mode to real
   CNN inference. No other code changes needed anywhere in the stack.

## How the pieces talk to each other

```
Citizen's browser (React PWA)
   │  REST (axios) + Socket.io
   ▼
Backend (Express, :5000) ── multipart image ──▶ ML service (Flask, :6000)
   │
   ▼
MongoDB (issues, users, geospatial indexes)
```

- The backend calls the ML service synchronously during `POST /api/issues`. If the ML service is
  unreachable, the backend automatically falls back to its own mock validator (`backend/utils/mlClient.js`)
  so report submission is never blocked by ML infrastructure issues.
- Real-time updates (new issues, status changes, hazard alerts) are pushed over Socket.io to
  everyone on the live map, to the authority dashboard, and to citizens in the affected locality.

## Key API endpoints

| Method | Route                              | Purpose                                   |
|--------|-------------------------------------|--------------------------------------------|
| POST   | `/api/auth/anonymous`               | Frictionless anonymous citizen session     |
| POST   | `/api/auth/register` / `/login`     | Persistent account (citizen or authority)  |
| POST   | `/api/issues`                       | Report an issue (multipart: image + fields)|
| GET    | `/api/issues`                       | Live map / feed, with bounding-box filter  |
| GET    | `/api/issues/nearby`                | Geo-fenced hazard lookup                   |
| GET    | `/api/issues/mine`                  | Citizen's own report history               |
| GET    | `/api/authority/queue`              | Authority worklist                         |
| PATCH  | `/api/authority/issues/:id/status`  | Move issue through the status workflow     |
| GET    | `/api/authority/analytics`          | Aggregate stats for the dashboard          |

## Known gaps / next steps

- **Auth for authority staff**: currently created via the seed script or `/api/auth/register`
  (role defaults to `citizen`) — add an admin-only endpoint or a Mongo shell command to promote a
  user's `role` to `authority` and set their `department`.
- **Auto-captioning** (`/caption`) is a lightweight heuristic placeholder, not a true image-captioning
  model — swap in a model like BLIP once you're ready to invest in that part of the stack.
- **AI/NLP assistant** (free-text issue description → category) is not yet built — a good next
  addition would be a small text classifier or a call to an LLM API in the backend.
- **Multi-language support, native mobile app, and IoT integration** are documented future scope,
  not part of this build.
- This project has not been tested against a live MongoDB instance in the sandbox that built it
  (no `mongod` available there) — each service was verified independently (backend routing/auth,
  ML service endpoints, frontend production build). Run the seed script locally as your first
  integration check.
