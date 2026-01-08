import pyshark
import joblib
import pandas as pd
import threading
import time
import csv
import os
from threat_alert_system import process_threat

MODEL_PATH = 'rf_model.joblib'
FEATURES_PATH = 'features.txt'
INTERFACE = None  # Will auto-detect or use default
FORENSIC_LOG = 'forensic_log.csv'

# Load model and features
try:
    MODEL = joblib.load(MODEL_PATH)
    with open(FEATURES_PATH) as f:
        FEATURE_LIST = [line.strip() for line in f.readlines()]
    print(f"Model loaded successfully with {len(FEATURE_LIST)} features")
    print(f"First few features: {FEATURE_LIST[:5]}")
    print(f"Last few features: {FEATURE_LIST[-5:]}")
except Exception as e:
    print(f"Error loading model or features: {e}")
    MODEL = None
    FEATURE_LIST = []

live_predictions = []  # Shared list for API
lock = threading.Lock()

# Ensure forensic log file exists with headers
if not os.path.exists(FORENSIC_LOG):
    with open(FORENSIC_LOG, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['timestamp', 'src', 'dst', 'protocol', 'length', 'prediction'])

print(f"Starting live capture on interface: {INTERFACE}")
try:
    if INTERFACE:
        capture = pyshark.LiveCapture(interface=INTERFACE)
    else:
        capture = pyshark.LiveCapture()  # Use default interface
    print("Live capture initialized successfully")
except Exception as e:
    print(f"Error initializing live capture: {e}")
    print("Trying to list available interfaces...")
    try:
        import pyshark
        interfaces = pyshark.LiveCapture.list_interfaces()
        print("Available interfaces:")
        for i, interface in enumerate(interfaces):
            print(f"  {i}: {interface}")
    except:
        print("Could not list interfaces")
    capture = None

def extract_features(packet):
    # Example: extract src, dst, protocol, length (expand as needed)
    try:
        ip_layer = packet.ip
        src = ip_layer.src
        dst = ip_layer.dst
        proto = packet.transport_layer if hasattr(packet, 'transport_layer') else 'N/A'
        length = int(packet.length)
        
        # Initialize all features with default values
        features = {}
        
        # Basic features that we can extract from the packet
        features['duration'] = 0  # We don't have duration for live packets
        features['src_bytes'] = length
        features['dst_bytes'] = length
        features['land'] = 0  # Not a land attack
        features['wrong_fragment'] = 0
        features['urgent'] = 0
        features['hot'] = 0
        features['num_failed_logins'] = 0
        features['logged_in'] = 0
        features['num_compromised'] = 0
        features['root_shell'] = 0
        features['su_attempted'] = 0
        features['num_root'] = 0
        features['num_file_creations'] = 0
        features['num_shells'] = 0
        features['num_access_files'] = 0
        features['num_outbound_cmds'] = 0
        features['is_host_login'] = 0
        features['is_guest_login'] = 0
        features['count'] = 1  # Single packet
        features['srv_count'] = 1
        features['serror_rate'] = 0.0
        features['srv_serror_rate'] = 0.0
        features['rerror_rate'] = 0.0
        features['srv_rerror_rate'] = 0.0
        features['same_srv_rate'] = 0.0
        features['diff_srv_rate'] = 0.0
        features['srv_diff_host_rate'] = 0.0
        features['dst_host_count'] = 1
        features['dst_host_srv_count'] = 1
        features['dst_host_same_srv_rate'] = 0.0
        features['dst_host_diff_srv_rate'] = 0.0
        features['dst_host_same_src_port_rate'] = 0.0
        features['dst_host_srv_diff_host_rate'] = 0.0
        features['dst_host_serror_rate'] = 0.0
        features['dst_host_srv_serror_rate'] = 0.0
        features['dst_host_rerror_rate'] = 0.0
        features['dst_host_srv_rerror_rate'] = 0.0  # This was the missing feature
        
        # Protocol type features (one-hot encoded)
        features['protocol_type_icmp'] = 1 if proto == 'ICMP' else 0
        features['protocol_type_tcp'] = 1 if proto == 'TCP' else 0
        features['protocol_type_udp'] = 1 if proto == 'UDP' else 0
        
        # Service features (all set to 0 for live packets)
        service_features = [
            'service_IRC', 'service_X11', 'service_Z39_50', 'service_auth', 'service_bgp',
            'service_courier', 'service_csnet_ns', 'service_ctf', 'service_daytime',
            'service_discard', 'service_domain', 'service_domain_u', 'service_echo',
            'service_eco_i', 'service_ecr_i', 'service_efs', 'service_exec',
            'service_finger', 'service_ftp', 'service_ftp_data', 'service_gopher',
            'service_hostnames', 'service_http', 'service_http_443', 'service_imap4',
            'service_iso_tsap', 'service_klogin', 'service_kshell', 'service_ldap',
            'service_link', 'service_login', 'service_mtp', 'service_name',
            'service_netbios_dgm', 'service_netbios_ns', 'service_netbios_ssn',
            'service_netstat', 'service_nnsp', 'service_nntp', 'service_ntp_u',
            'service_other', 'service_pm_dump', 'service_pop_2', 'service_pop_3',
            'service_printer', 'service_private', 'service_remote_job', 'service_rje',
            'service_shell', 'service_smtp', 'service_sql_net', 'service_ssh',
            'service_sunrpc', 'service_supdup', 'service_systat', 'service_telnet',
            'service_tim_i', 'service_time', 'service_urp_i', 'service_uucp',
            'service_uucp_path', 'service_vmnet', 'service_whois'
        ]
        for service in service_features:
            features[service] = 0
        
        # Flag features (all set to 0 for live packets)
        flag_features = [
            'flag_OTH', 'flag_REJ', 'flag_RSTO', 'flag_RSTOS0', 'flag_RSTR',
            'flag_S0', 'flag_S1', 'flag_S2', 'flag_S3', 'flag_SF', 'flag_SH'
        ]
        for flag in flag_features:
            features[flag] = 0
        
        # Add the basic packet info for logging
        features['src'] = src
        features['dst'] = dst
        features['protocol'] = proto
        features['length'] = length
        
        return features
    except Exception as e:
        print(f"Error extracting features: {e}")
        return None

def predict_packet(features):
    # Check if model is loaded
    if MODEL is None or not FEATURE_LIST:
        print("Model or features not loaded, skipping prediction")
        return "Unknown"
    
    # Convert to DataFrame and align with model features
    X = pd.DataFrame([features])
    
    # Remove non-feature columns that are used for logging
    feature_cols = [col for col in X.columns if col not in ['src', 'dst', 'protocol', 'length']]
    X = X[feature_cols]
    
    # Ensure all required features are present
    missing_cols = set(FEATURE_LIST) - set(X.columns)
    for col in missing_cols:
        X[col] = 0
    
    # Ensure correct column order
    X = X.reindex(columns=FEATURE_LIST, fill_value=0)
    
    try:
        pred = MODEL.predict(X)[0]
        return str(pred)
    except Exception as e:
        print(f"Error making prediction: {e}")
        return "Error"

def log_forensic(result):
    with open(FORENSIC_LOG, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            result['timestamp'],
            result['src'],
            result['dst'],
            result['protocol'],
            result['length'],
            result['prediction']
        ])

def capture_loop():
    if capture is None:
        print("Live capture not initialized, skipping packet capture")
        return
    
    print("Starting packet capture loop...")
    packet_count = 0
    
    try:
        for packet in capture.sniff_continuously():
            packet_count += 1
            print(f"Captured packet #{packet_count}")
            
            features = extract_features(packet)
            if features is None:
                print(f"Could not extract features from packet #{packet_count}")
                continue
                
            prediction = predict_packet(features)
            result = {
                'src': features['src'],
                'dst': features['dst'],
                'protocol': features['protocol'],
                'length': features['length'],
                'prediction': prediction,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            with lock:
                live_predictions.append(result)
                # Keep only last 1000 predictions to prevent memory issues
                if len(live_predictions) > 1000:
                    live_predictions.pop(0)
                    
            if prediction == 'Malicious':
                log_forensic(result)
                print(f"🚨 MALICIOUS PACKET DETECTED: {features['src']} -> {features['dst']} | Proto: {features['protocol']} | Len: {features['length']}")
                
                # Trigger threat alert
                threat_data = {
                    'src': features['src'],
                    'dst': features['dst'],
                    'protocol': features['protocol'],
                    'prediction': prediction,
                    'length': features['length']
                }
                alert = process_threat(threat_data)
                if alert:
                    print(f"🚨 ALERT TRIGGERED: {alert['level']} level threat from {features['src']}")
                    print(f"   Actions taken: {len(alert['actions_taken'])}")
            else:
                print(f"✅ Benign packet: {features['src']} -> {features['dst']} | Proto: {features['protocol']} | Len: {features['length']}")
                
            # Print every 10th packet to avoid spam
            if packet_count % 10 == 0:
                print(f"Processed {packet_count} packets so far...")
                
    except Exception as e:
        print(f"Error in capture loop: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    try:
        capture_loop()
    except KeyboardInterrupt:
        print("Live capture stopped.") 