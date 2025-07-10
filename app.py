from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import pandas as pd
import joblib
import numpy as np
from collections import Counter
import threading
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import glob
import logging
from werkzeug.utils import secure_filename
from live_packet_capture import live_predictions, lock, capture_loop
from threat_alert_system import process_threat, get_alerts, get_alert_stats
import csv
import time
from datetime import datetime

MODEL_PATH = 'rf_model.joblib'
EXPLAINER_PATH = 'shap_explainer.joblib'
FEATURES_PATH = 'features.txt'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

MODEL = None
EXPLAINER = None
FEATURE_LIST = []
if os.path.exists(MODEL_PATH) and os.path.exists(EXPLAINER_PATH) and os.path.exists(FEATURES_PATH):
    MODEL = joblib.load(MODEL_PATH)
    EXPLAINER = joblib.load(EXPLAINER_PATH)
    with open(FEATURES_PATH) as f:
        FEATURE_LIST = [line.strip() for line in f.readlines()]

# Store prediction history and metrics
PREDICTION_HISTORY = []  # Each entry: {'prediction': ..., 'explanation': ..., 'label': ...}
METRICS = {'accuracy': None, 'precision': None, 'recall': None, 'f1_score': None}

# PDMS System State
SYSTEM_STATE = {
    'status': 'operational',
    'uptime': time.time(),
    'total_packets_analyzed': 0,
    'threats_detected': 0,
    'false_positives': 0,
    'model_performance': {},
    'active_threats': [],
    'system_health': {
        'cpu_usage': 0,
        'memory_usage': 0,
        'network_load': 0
    }
}

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Email config
ADMIN_EMAIL = 'stephanietheprogrammer@gmail.com'
ALARM_SOUND = 'alarm.wav'  # Place a short alarm sound in backend dir

# Increase upload size
MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100 MB

ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def retrain_model_from_csv(data_path):
    """Retrain the model from a CSV file and update global state."""
    global MODEL, EXPLAINER, FEATURE_LIST, METRICS
    try:
        df = pd.read_csv(data_path, nrows=10000)
        logger.info(f'Retrain: CSV shape: {df.shape}')
        logger.info(f'Retrain: CSV head:\n{df.head()}')
        # Find label column (case-insensitive)
        label_col = None
        for col in df.columns:
            if col.strip().lower() == 'label':
                label_col = col
                break
        if label_col is None:
            logger.warning('Retrain: No "Label" column found, using last column as label.')
            label_col = df.columns[-1]
        y = df[label_col]
        X = df.drop(columns=[label_col])
        logger.info(f'Retrain: Using features: {list(X.columns)}')
        logger.info(f'Retrain: Using label: {label_col}')
        X_encoded = pd.get_dummies(X)
        with open(FEATURES_PATH, 'w') as f:
            f.write('\n'.join(X_encoded.columns))
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        import shap
        X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)
        clf = RandomForestClassifier(n_estimators=20, random_state=42)
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average='macro', zero_division=0)
        rec = recall_score(y_test, y_pred, average='macro', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='macro', zero_division=0)
        joblib.dump(clf, MODEL_PATH)
        explainer = shap.TreeExplainer(clf)
        joblib.dump(explainer, EXPLAINER_PATH)
        MODEL = clf
        EXPLAINER = explainer
        FEATURE_LIST = list(X_encoded.columns)
        logger.info(f'Retrain: New FEATURE_LIST: {FEATURE_LIST}')
        METRICS['accuracy'] = acc
        METRICS['precision'] = prec
        METRICS['recall'] = rec
        METRICS['f1_score'] = f1
        # Update system state
        SYSTEM_STATE['model_performance'] = {
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1_score': f1,
            'last_updated': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f'Retrain error: {e}')
        import traceback
        traceback.print_exc()

@app.route('/')
def home():
    return jsonify({'message': 'AI-Powered Intrusion Detection and Mitigation System (PDMS) is running!'})

@app.route('/system-status', methods=['GET'])
def system_status():
    """Get comprehensive system status and health metrics."""
    uptime_seconds = time.time() - SYSTEM_STATE['uptime']
    uptime_hours = uptime_seconds / 3600
    
    # Calculate threat statistics
    total_predictions = len(PREDICTION_HISTORY)
    malicious_count = sum(1 for p in PREDICTION_HISTORY if p.get('prediction') == 'Malicious')
    
    return jsonify({
        'status': SYSTEM_STATE['status'],
        'uptime_hours': round(uptime_hours, 2),
        'total_packets_analyzed': total_predictions,
        'threats_detected': malicious_count,
        'threat_rate': round(malicious_count / max(total_predictions, 1) * 100, 2),
        'model_performance': SYSTEM_STATE['model_performance'],
        'system_health': SYSTEM_STATE['system_health'],
        'active_threats': SYSTEM_STATE['active_threats'][-10:],  # Last 10 threats
        'last_updated': datetime.now().isoformat()
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload a CSV file and trigger retraining."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0)
        if file_length > MAX_UPLOAD_SIZE:
            return jsonify({'error': 'File too large. Max 100MB allowed.'}), 400
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        # Process in chunks if large
        chunk_size = 10000
        rows = 0
        try:
            for chunk in pd.read_csv(filepath, chunksize=chunk_size, encoding='utf-8'):
                rows += len(chunk)
        except UnicodeDecodeError:
            for chunk in pd.read_csv(filepath, chunksize=chunk_size, encoding='utf-16'):
                rows += len(chunk)
        threading.Thread(target=retrain_model_from_csv, args=(filepath,)).start()
        try:
            df = pd.read_csv(filepath, nrows=10, encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(filepath, nrows=10, encoding='utf-16')
        return jsonify({'message': 'File uploaded and retraining started', 'columns': list(df.columns), 'rows': rows}), 200
    else:
        return jsonify({'error': 'Only CSV files are supported for now.'}), 400

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json.get('data', [])
    labels = request.json.get('labels', None)
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    X = pd.DataFrame(data)
    X_enc = pd.get_dummies(X)
    
    # Fix DataFrame fragmentation by creating missing columns efficiently
    missing_cols = set(FEATURE_LIST) - set(X_enc.columns)
    if missing_cols:
        # Create a DataFrame with missing columns filled with zeros
        missing_df = pd.DataFrame(0, index=X_enc.index, columns=list(missing_cols))
        # Concatenate efficiently
        X_enc = pd.concat([X_enc, missing_df], axis=1)
    
    # Ensure correct column order
    X_enc = X_enc.reindex(columns=FEATURE_LIST, fill_value=0)
    
    preds = MODEL.predict(X_enc)
    shap_values = EXPLAINER.shap_values(X_enc)
    explanations = [shap_values[np.argmax(np.bincount(preds))][i].tolist() for i in range(len(preds))]
    results = []
    for i, (pred, explanation) in enumerate(zip(preds, explanations)):
        label = labels[i] if labels and i < len(labels) else None
        results.append({'prediction': str(pred), 'explanation': explanation, 'label': label})
        PREDICTION_HISTORY.append({'prediction': str(pred), 'explanation': explanation, 'label': label})
        # Update system state
        SYSTEM_STATE['total_packets_analyzed'] += 1
        if str(pred) == 'Malicious':
            SYSTEM_STATE['threats_detected'] += 1
            SYSTEM_STATE['active_threats'].append({
                'timestamp': datetime.now().isoformat(),
                'prediction': str(pred),
                'index': i
            })
            # --- NEW: Trigger all actions except phone call ---
            send_email('PDMS Alert: Malicious Threat Detected', f'A malicious threat was detected at row {i}.')
            play_alarm()
            auto_actions('Unknown', 'Unknown', i)
    # Update metrics using sklearn if we have true labels
    y_true = [r['label'] for r in PREDICTION_HISTORY if r['label'] is not None]
    y_pred = [r['prediction'] for r in PREDICTION_HISTORY if r['label'] is not None]
    if y_true and y_pred:
        METRICS['accuracy'] = accuracy_score(y_true, y_pred)
        METRICS['precision'] = precision_score(y_true, y_pred, average='macro', zero_division=0)
        METRICS['recall'] = recall_score(y_true, y_pred, average='macro', zero_division=0)
        METRICS['f1_score'] = f1_score(y_true, y_pred, average='macro', zero_division=0)
    return jsonify({'results': results})

@app.route('/metrics', methods=['GET'])
def metrics():
    return jsonify(METRICS)

@app.route('/history', methods=['GET'])
def history():
    # Return the last 50 predictions
    return jsonify({'history': PREDICTION_HISTORY[-50:]})

@app.route('/retrain', methods=['POST'])
def retrain():
    """Retrain the model using the most recent or specified uploaded CSV file."""
    data = request.get_json()
    if data and 'filename' in data:
        data_path = os.path.join(UPLOAD_FOLDER, secure_filename(data['filename']))
    else:
        files = glob.glob(os.path.join(UPLOAD_FOLDER, '*.csv'))
        if not files:
            return jsonify({'error': 'No uploaded CSV found for retraining.'}), 400
        data_path = max(files, key=os.path.getctime)
    threading.Thread(target=retrain_model_from_csv, args=(data_path,)).start()
    return jsonify({'message': f'Retraining started on {data_path}. Model will reload automatically when done.'}), 200

@app.route('/predict_uploaded', methods=['POST'])
def predict_uploaded():
    print('predict_uploaded called')
    try:
        # Find the most recent CSV in uploads
        files = glob.glob(os.path.join(UPLOAD_FOLDER, '*.csv'))
        if not files:
            print('No uploaded CSV found')
            return jsonify({'error': 'No uploaded CSV found'}), 400
        latest_file = max(files, key=os.path.getctime)
        df = pd.read_csv(latest_file)
        print("CSV columns:", df.columns)
        print("Model expects features:", FEATURE_LIST)
        available_features = [col for col in FEATURE_LIST if col in df.columns]
        print("Available features for prediction:", available_features)
        if not available_features:
            print('No valid features found in uploaded file.')
            return jsonify({'error': 'No valid features found in uploaded file.'}), 400
        # Use only feature columns
        X = df[available_features]
        # Limit to 1000 rows for demo/performance
        X = X.head(1000)
        print("X shape:", X.shape)
        print("X columns:", X.columns)
        print("First 5 rows of X:", X.head())
        print("Before pd.get_dummies")
        X_enc = pd.get_dummies(X)
        print("After pd.get_dummies, columns:", X_enc.columns)

        # Ensure all columns are numeric and fill NaN with 0
        X_enc = X_enc.apply(pd.to_numeric, errors='coerce')
        X_enc = X_enc.fillna(0)
        print("After to_numeric and fillna, dtypes:", X_enc.dtypes)

        # Fix DataFrame fragmentation by creating missing columns efficiently
        missing_cols = set(FEATURE_LIST) - set(X_enc.columns)
        if missing_cols:
            missing_df = pd.DataFrame(0, index=X_enc.index, columns=list(missing_cols))
            X_enc = pd.concat([X_enc, missing_df], axis=1)

        # Ensure correct column order
        X_enc = X_enc.reindex(columns=FEATURE_LIST, fill_value=0)
        print("After reindex, dtypes:", X_enc.dtypes)

        # Force all data to float64
        X_enc = X_enc.astype(np.float64)
        print("Final X_enc shape:", X_enc.shape, "dtypes:", X_enc.dtypes)

        # Now try prediction
        preds = MODEL.predict(X_enc)
        print("After MODEL.predict")
        # Temporarily skip SHAP explanations to isolate error
        # shap_values = EXPLAINER.shap_values(X_enc)
        # print("After EXPLAINER.shap_values")
        # explanations = [shap_values[np.argmax(np.bincount(preds))][i].tolist() for i in range(len(preds))]
        results = []
        for i, pred in enumerate(preds):
            print(f'Prediction {i}: type={type(pred)}, value={pred}')
            result = {'prediction': str(pred)}
            if str(pred) == 'Malicious':
                # Trigger backend actions automatically
                play_alarm()
                auto_actions('Unknown', 'Unknown', i)
                result['threat'] = True
            results.append(result)
        print('predict_uploaded finished')
        return jsonify({'results': results, 'columns': list(X.columns)})
    except Exception as e:
        import traceback
        print('Exception in /predict_uploaded:', e)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/predict_uploaded_simple', methods=['POST'])
def predict_uploaded_simple():
    try:
        files = glob.glob(os.path.join(UPLOAD_FOLDER, '*.csv'))
        if not files:
            return jsonify({'error': 'No uploaded CSV found'}), 400
        latest_file = max(files, key=os.path.getctime)
        df = pd.read_csv(latest_file)
        # Only keep columns in FEATURE_LIST
        X = df[[col for col in FEATURE_LIST if col in df.columns]].copy()
        # Convert to numeric, fill NaN
        X = X.apply(pd.to_numeric, errors='coerce').fillna(0)
        # Reindex to match model
        X = X.reindex(columns=FEATURE_LIST, fill_value=0)
        # Force float64
        X = X.astype('float64')
        preds = MODEL.predict(X)
        results = [{'prediction': str(pred)} for pred in preds]
        return jsonify({'results': results, 'columns': list(X.columns)})
    except Exception as e:
        import traceback
        print('Exception in /predict_uploaded_simple:', e)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/block', methods=['POST'])
def block():
    data = request.get_json()
    src_ip = data.get('src_ip')
    protocol = data.get('protocol')
    row = data.get('row')
    print(f'BLOCK action triggered: src_ip={src_ip}, protocol={protocol}, row={row}')
    # Simulate blocking (in real system, would trigger firewall rule)
    return jsonify({'status': 'blocked', 'src_ip': src_ip, 'protocol': protocol, 'row': row})

@app.route('/report', methods=['POST'])
def report():
    data = request.get_json()
    src_ip = data.get('src_ip')
    protocol = data.get('protocol')
    row = data.get('row')
    print(f'REPORT action triggered: src_ip={src_ip}, protocol={protocol}, row={row}')
    # Simulate reporting (in real system, would send alert or generate report)
    return jsonify({'status': 'reported', 'src_ip': src_ip, 'protocol': protocol, 'row': row})

@app.route('/trace', methods=['POST'])
def trace():
    data = request.get_json()
    src_ip = data.get('src_ip')
    dst_ip = data.get('dst_ip')
    protocol = data.get('protocol')
    row = data.get('row')
    print(f'TRACE action triggered: src_ip={src_ip}, dst_ip={dst_ip}, protocol={protocol}, row={row}')
    # Simulate trace (in real system, would return flow details)
    return jsonify({'status': 'traced', 'src_ip': src_ip, 'dst_ip': dst_ip, 'protocol': protocol, 'row': row, 'details': 'Trace details here (simulated).'})

@app.route('/live-predictions', methods=['GET'])
def live_predictions_api():
    with lock:
        # Return the last 100 predictions
        data = list(live_predictions)[-100:]
    return jsonify({'live_predictions': data})

@app.route('/forensic-log', methods=['GET'])
def forensic_log():
    log_path = 'forensic_log.csv'
    if not os.path.exists(log_path):
        return jsonify({'log': []})
    rows = []
    with open(log_path, 'r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    # Return the last 100 entries
    return jsonify({'log': rows[-100:]})

@app.route('/threat-analysis', methods=['GET'])
def threat_analysis():
    """Comprehensive threat analysis and statistics."""
    # Analyze recent predictions for threat patterns
    recent_predictions = PREDICTION_HISTORY[-1000:] if len(PREDICTION_HISTORY) > 1000 else PREDICTION_HISTORY
    
    threat_stats = {
        'total_analyzed': len(recent_predictions),
        'malicious_count': sum(1 for p in recent_predictions if p.get('prediction') == 'Malicious'),
        'benign_count': sum(1 for p in recent_predictions if p.get('prediction') == 'Benign'),
        'threat_rate': 0,
        'top_threat_sources': [],
        'threat_timeline': []
    }
    
    if threat_stats['total_analyzed'] > 0:
        threat_stats['threat_rate'] = round(threat_stats['malicious_count'] / threat_stats['total_analyzed'] * 100, 2)
    
    # Extract source IPs from live predictions for threat source analysis
    with lock:
        live_data = list(live_predictions)[-500:]  # Last 500 live predictions
    
    if live_data:
        src_ips = [p.get('src', 'Unknown') for p in live_data if p.get('prediction') == 'Malicious']
        if src_ips:
            ip_counts = Counter(src_ips)
            threat_stats['top_threat_sources'] = [{'ip': ip, 'count': count} for ip, count in ip_counts.most_common(10)]
    
    return jsonify(threat_stats)

@app.route('/alerts', methods=['GET'])
def get_threat_alerts():
    """Get current threat alerts."""
    alerts = get_alerts()
    return jsonify({'alerts': alerts})

@app.route('/alert-stats', methods=['GET'])
def get_alert_statistics():
    """Get alert statistics."""
    stats = get_alert_stats()
    return jsonify(stats)

@app.route('/test-alert', methods=['POST'])
def test_alert_system():
    """Test the alert system with sample threat data."""
    data = request.get_json()
    threat_data = data.get('threat_data', {
        'src': '192.168.1.100',
        'dst': '192.168.1.1',
        'protocol': 'HTTP',
        'prediction': 'Malicious'
    })
    
    alert = process_threat(threat_data)
    return jsonify({
        'alert_triggered': alert is not None,
        'alert': alert,
        'message': 'Test alert processed successfully'
    })

@app.route('/model-comparison', methods=['GET'])
def model_comparison():
    """Compare different ML models for IDS performance."""
    # This would typically compare multiple models, but for now return current model info
    return jsonify({
        'current_model': {
            'type': 'Random Forest',
            'n_estimators': 20,
            'performance': METRICS,
            'features_used': len(FEATURE_LIST),
            'last_trained': datetime.now().isoformat()
        },
        'available_models': ['Random Forest', 'Decision Tree', 'SVM', 'Neural Network'],
        'recommendations': [
            'Random Forest shows best balance of accuracy and interpretability',
            'Consider ensemble methods for improved robustness',
            'Deep learning models may provide better feature learning'
        ]
    })

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

# Helper: Send email
def send_email(subject, body):
    try:
        # This function is now empty as per the instructions
        pass
    except Exception as e:
        logger.error(f'Email error: {e}')

# Helper: Play alarm sound
def play_alarm():
    try:
        # This function is now empty as per the instructions
        pass
    except Exception as e:
        logger.error(f'Alarm error: {e}')

# Helper: Auto block/report/trace
def auto_actions(src_ip, protocol, row):
    # Block
    SYSTEM_STATE['active_threats'].append({'timestamp': datetime.now().isoformat(), 'prediction': 'Malicious', 'index': row, 'src_ip': src_ip})
    # Simulate block/report/trace
    logger.info(f'Auto-blocked {src_ip} protocol {protocol} row {row}')
    # You can expand this to call real block/report/trace endpoints if needed

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    # Start live packet capture in a background thread
    t = threading.Thread(target=capture_loop, daemon=True)
    t.start()
    app.run(host='0.0.0.0', port=5000, debug=True) 