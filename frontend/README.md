# IrisMed

IrisMed is a private eye-record intelligence workspace for organizing prescriptions and eye-care reports.

## What works

- PDF / JPG / PNG upload with size and type validation
- Multimodal AI extraction of prescription, visual acuity, findings, medication, follow-up and recommendations
- Source page tracking
- Original document viewer
- Document timeline with search and status filters
- Document-specific RAG chat with source pages
- English / Telugu / Hindi response preference
- Side-by-side prescription comparison
- Record deletion
- Responsive desktop and mobile workspace
- Backend health indicator
- Local SQLite storage

## Run

### Backend

From `backend`:

```powershell
py -m venv .venv
.venv\Scripts\activate
py -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Keep the Gemini API key in `backend/.env`.

### Frontend

From `frontend`:

```powershell
npm install
npm run dev
```

The frontend defaults to `http://127.0.0.1:8000/api`. To change it, copy `.env.example` to `.env` and set `VITE_API_URL`.

## Safety boundary

IrisMed is designed to organize and explain information already present in uploaded records. It does not diagnose conditions, prescribe treatment, or invent missing prescription values.
