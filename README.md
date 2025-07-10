# Backend (Flask) - PDMS

## Setup

1. (Optional) Create and activate a virtual environment:
   ```sh
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On Mac/Linux
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```sh
   python app.py
   ```

## File Structure
- `app.py` - Main Flask app
- `requirements.txt` - Python dependencies
- `uploads/` - Uploaded CSVs for retraining/testing
- `features.txt`, `rf_model.joblib`, `shap_explainer.joblib` - Model files

## Notes
- Place any alarm sound (e.g., `alarm.wav`) in this directory if needed.
- Uploaded files are stored in `uploads/`.
- For large datasets, consider chunked upload/processing.

## Troubleshooting
- See `../TROUBLESHOOTING.md` for common issues.

## Endpoints

- `GET /` — Health check
- `POST /upload` — Upload a CSV file
- `POST /predict` — Predict on uploaded data
- `GET /metrics` — Get current model metrics
- `GET /history` — Get recent prediction history
- `POST /retrain` — Retrain the model (uses `dataset/Test_data.csv`)

## Retraining
- POST to `/retrain` to start retraining in the background. The model and explainer will reload automatically when done.
- You can replace `dataset/Test_data.csv` with your own labeled CSV for custom retraining. 