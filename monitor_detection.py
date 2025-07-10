#!/usr/bin/env python3
"""
Real-time monitoring script for the IDS system
This script monitors the detection results and shows what's happening
"""

import requests
import time
import json
from datetime import datetime

def check_system_status():
    """Check the overall system status"""
    try:
        response = requests.get('http://localhost:5000/system-status', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"🖥️  System Status: {data['status']}")
            print(f"⏱️  Uptime: {data['uptime_hours']:.2f} hours")
            print(f"📦 Total Packets Analyzed: {data['total_packets_analyzed']}")
            print(f"🚨 Threats Detected: {data['threats_detected']}")
            print(f"📊 Threat Rate: {data['threat_rate']}%")
            return data
        else:
            print(f"❌ Failed to get system status: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error checking system status: {e}")
        return None

def check_live_predictions():
    """Check recent live predictions"""
    try:
        response = requests.get('http://localhost:5000/live-predictions', timeout=5)
        if response.status_code == 200:
            data = response.json()
            predictions = data.get('live_predictions', [])
            
            if predictions:
                print(f"\n📊 Recent Predictions ({len(predictions)} total):")
                # Show last 5 predictions
                for i, pred in enumerate(predictions[-5:], 1):
                    timestamp = pred.get('timestamp', 'Unknown')
                    src = pred.get('src', 'Unknown')
                    dst = pred.get('dst', 'Unknown')
                    protocol = pred.get('protocol', 'Unknown')
                    prediction = pred.get('prediction', 'Unknown')
                    
                    status_icon = "🚨" if prediction == "Malicious" else "✅"
                    print(f"  {i}. {status_icon} {src} -> {dst} ({protocol}) - {prediction}")
            else:
                print("\n📊 No predictions yet - waiting for network traffic...")
            
            return predictions
        else:
            print(f"❌ Failed to get live predictions: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error checking live predictions: {e}")
        return []

def check_forensic_log():
    """Check the forensic log for malicious activity"""
    try:
        response = requests.get('http://localhost:5000/forensic-log', timeout=5)
        if response.status_code == 200:
            data = response.json()
            log_entries = data.get('log', [])
            
            if log_entries:
                print(f"\n🚨 Forensic Log ({len(log_entries)} entries):")
                # Show last 3 entries
                for i, entry in enumerate(log_entries[-3:], 1):
                    timestamp = entry.get('timestamp', 'Unknown')
                    src = entry.get('src', 'Unknown')
                    dst = entry.get('dst', 'Unknown')
                    protocol = entry.get('protocol', 'Unknown')
                    print(f"  {i}. {timestamp} - {src} -> {dst} ({protocol})")
            else:
                print("\n🚨 Forensic Log: No malicious activity detected yet")
            
            return log_entries
        else:
            print(f"❌ Failed to get forensic log: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error checking forensic log: {e}")
        return []

def monitor_continuously():
    """Monitor the system continuously"""
    print("🔍 Starting continuous monitoring...")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    
    try:
        while True:
            print(f"\n🕐 {datetime.now().strftime('%H:%M:%S')} - Checking system...")
            
            # Check system status
            status = check_system_status()
            
            # Check live predictions
            predictions = check_live_predictions()
            
            # Check forensic log
            forensic_log = check_forensic_log()
            
            print("\n" + "-" * 60)
            print("Waiting 10 seconds before next check...")
            time.sleep(10)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Monitoring stopped by user")
    except Exception as e:
        print(f"\n❌ Monitoring error: {e}")

def main():
    """Main function"""
    print("🛡️  IDS System Monitor")
    print("=" * 40)
    
    # Check if backend is running
    try:
        response = requests.get('http://localhost:5000/', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend is not responding properly")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("Make sure the backend is running on http://localhost:5000")
        return
    
    # Start monitoring
    monitor_continuously()

if __name__ == "__main__":
    main() 