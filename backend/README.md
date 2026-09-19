# GreenPark School Parent Portal Backend

FastAPI backend for GreenPark School Parent Portal.

## Setup Instructions

1.  **Enter the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    *   **Windows:**
        ```bash
        venv\Scripts\activate
        ```
    *   **Mac/Linux:**
        ```bash
        source venv/bin/activate
        ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configure environment variables:**
    *   Create a `.env` file from `.env.example`.
    *   Set `APP_ENV=local` for campus LAN server, or `APP_ENV=cloud` on Render / hosted cloud.
    *   Update `DATABASE_URL` with your PostgreSQL connection details.

6.  **Run the application (Development mode):**
    ```bash
    uvicorn app.main:app --reload
    ```

The API will be available at `http://localhost:8000`. You can access the automatic documentation at `http://localhost:8000/docs`.
