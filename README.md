# Green Park School Parent Portal

This project is separated into a frontend and a backend.

## Structure

- `frontend/`: React + Vite application
- `backend/`: FastAPI + Python application

## Getting Started

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (already created during refactoring):
   ```
   VITE_API_BASE_URL=http://3.110.32.73:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## API Configuration

The frontend is configured to use the `VITE_API_BASE_URL` environment variable for all API calls. This is centralized in `frontend/src/config.js`.
