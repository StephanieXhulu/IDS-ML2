import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NetworkDashboard.css';

function NetworkDashboard() {
  // Upload/capture interface
  const [file, setFile] = useState(null);
  const [data, setData] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [livePulse, setLivePulse] = useState(false);
  const navigate = useNavigate();
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [livePredictions, setLivePredictions] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [threatAnalysis, setThreatAnalysis] = useState({});
  const [modelComparison, setModelComparison] = useState({});
  const [forensicLog, setForensicLog] = useState([]);
  const [activeTab, setActiveTab] = useState('live');
  // Reintroduced missing state variables for ESLint
  const [uploadInfo, setUploadInfo] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [pieData, setPieData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState({});
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  // Add live polling for recent predictions
  useEffect(() => {
    const fetchHistory = () => {
      fetch('http://localhost:5000/history')
        .then(res => res.json())
        .then(data => {
          setResults(data.history || []);
          setLivePulse(true);
          setTimeout(() => setLivePulse(false), 400);
        });
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll live IDS predictions
  const fetchLivePredictions = async () => {
    try {
      const response = await fetch('http://localhost:5000/live-predictions');
      const data = await response.json();
      setLivePredictions(data.live_predictions || []);
    } catch (error) {
      console.error('Error fetching live predictions:', error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    setErrorMsg('');
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });
      const info = await res.json();
      if (!res.ok) {
        setErrorMsg(info.error || 'Upload failed.');
        setLoading(false);
        return;
      }
      setUploadInfo(info);
      setLoading(false);
      await handleBatchPredict();
    } catch (err) {
      setErrorMsg('Network error: Backend is unreachable or not running.');
      console.error('Upload error:', err);
      setLoading(false);
    }
  };

  const handleSampleData = () => {
    if (previewRows.length > 1) {
      // Use the first data row (skip header)
      const sample = previewRows[1].map(cell => isNaN(cell) ? cell : Number(cell));
      setData(JSON.stringify([sample]));
    }
  };

  const handleClear = () => {
    setResults([]);
    setPieData(null);
    setLastUpdated(null);
  };

  const handlePredict = async () => {
    try {
      setPredictLoading(true);
      const parsed = JSON.parse(data);
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed }),
      });
      const result = await res.json();
      setResults(result.results || []);
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 400);
      setLastUpdated(new Date().toLocaleTimeString());
      // Pie chart for prediction summary
      if (result.results && result.results.length) {
        const counts = {};
        result.results.forEach(r => {
          counts[r.prediction] = (counts[r.prediction] || 0) + 1;
        });
        setPieData({
          labels: Object.keys(counts),
          datasets: [
            {
              data: Object.values(counts),
              backgroundColor: [
                '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
              ],
            },
          ],
        });
      } else {
        setPieData(null);
      }
    } catch (e) {
      setErrorMsg('Network error: Backend is unreachable or not running.');
      console.error('Prediction error:', e);
    }
    setPredictLoading(false);
  };

  const handleBatchPredict = async () => {
    setErrorMsg('');
    setPredictLoading(true);
    try {
      const res = await fetch('http://localhost:5000/predict_uploaded', {
        method: 'POST',
      });
      const info = await res.json();
      if (!res.ok) {
        setErrorMsg(info.error || 'Prediction failed.');
        setPredictLoading(false);
        return;
      }
      setResults(info.results || []);
      setPredictLoading(false);
    } catch (err) {
      setErrorMsg('Network error during prediction.');
      setPredictLoading(false);
    }
  };

  // Animated pulse for Live indicator
  const livePulseStyle = {
    fontWeight: 700,
    color: livePulse ? '#00eaff' : '#8fa1c7',
    textShadow: livePulse ? '0 0 16px #00eaff, 0 0 32px #00eaff' : 'none',
    transition: 'color 0.2s, text-shadow 0.2s',
    fontSize: 18,
    animation: livePulse ? 'pulse 0.8s infinite alternate' : 'none',
  };

  // Example metric data (replace with real data as needed)
  const metrics = [
    { icon: '🛡️', label: 'Total Threats', value: 245, change: 13.5, color: '#13ffb9', chartData: { labels: Array(10).fill(''), datasets: [{ data: [2,4,3,5,6,4,7,8,6,9], borderColor: '#13ffb9', backgroundColor: 'rgba(19,255,185,0.2)', tension: 0.4 }] } },
    { icon: '✅', label: 'Defended', value: 158, change: -6.1, color: '#ff357a', chartData: { labels: Array(10).fill(''), datasets: [{ data: [1,2,2,3,4,3,2,4,3,2], borderColor: '#ff357a', backgroundColor: 'rgba(255,53,122,0.2)', tension: 0.4 }] } },
    { icon: '❌', label: 'Failed', value: 37, change: 1.6, color: '#ffce56', chartData: { labels: Array(10).fill(''), datasets: [{ data: [0,1,1,2,1,2,1,2,1,2], borderColor: '#ffce56', backgroundColor: 'rgba(255,206,86,0.2)', tension: 0.4 }] } },
    { icon: '👤', label: 'Total Users', value: 3845, change: 11.9, color: '#36A2EB', chartData: { labels: Array(10).fill(''), datasets: [{ data: [10,12,13,15,14,16,18,19,20,22], borderColor: '#36A2EB', backgroundColor: 'rgba(54,162,235,0.2)', tension: 0.4 }] } },
  ];

  // Example gauge/donut data (replace with real data)
  const integrityData = {
    labels: ['Critical', 'Suspicious', 'Stable'],
    datasets: [{
      data: [2573, 2117, 3179],
      backgroundColor: ['#ff357a', '#ffce56', '#13ffb9'],
      borderWidth: 0,
    }],
  };

  // Example bubble data (replace with real data)
  const bubbleData = {
    datasets: [
      { label: 'At Risk', data: [{ x: 1, y: 2, r: 30 }, { x: 2, y: 3, r: 20 }], backgroundColor: '#ff357a' },
      { label: 'Breached', data: [{ x: 3, y: 1, r: 25 }], backgroundColor: '#36A2EB' },
      { label: 'Dormant', data: [{ x: 2, y: 1, r: 15 }], backgroundColor: '#9966FF' },
      { label: 'New Detections', data: [{ x: 1, y: 3, r: 18 }], backgroundColor: '#13ffb9' },
    ],
  };

  const mapComponent = (
    <div style={{
      background: 'rgba(24,28,36,0.95)',
      borderRadius: 16,
      minHeight: 220,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#8fa1c7',
      fontSize: 22,
      fontWeight: 600,
      boxShadow: '0 2px 16px #0004',
      padding: 8
    }}>
      [Network Diagram Placeholder]
    </div>
  );

  // Example top labels data (replace with real if available)
  const topLabels = [
    { label: 'content', value: 10880, color: '#ff357a' },
    { label: 'geopolitical', value: 5200, color: '#5ee6a6' },
    { label: 'malware', value: 3910, color: '#36A2EB' },
    { label: 'mobile security', value: 3610, color: '#ffce56' },
    { label: 'scamware', value: 3610, color: '#a259ff' },
    { label: 'atmnet', value: 3020, color: '#13ffb9' },
    { label: 'botnet', value: 3000, color: '#ff9f40' },
  ];

  // Example horizontal bar data (replace with real if available)
  const barData = computeBarData(results.length > 0 ? results : []);

  // Example polar area data (replace with real if available)
  const polarData = {
    labels: ['Benign', 'Malicious', 'Suspicious', 'Unknown'],
    datasets: [
      {
        data: [40, 25, 20, 15],
        backgroundColor: ['#5ee6a6', '#ff357a', '#ffce56', '#36A2EB'],
      },
    ],
  };

  // Compute real barData, lineData, featureData from results if available
  function computeBarData(results) {
    if (!results || results.length === 0) return { labels: [], datasets: [] };
    // Example: protocol breakdown
    const protocolCounts = {};
    results.forEach(r => {
      const proto = r.protocol || 'Unknown';
      protocolCounts[proto] = (protocolCounts[proto] || 0) + 1;
    });
    return {
      labels: Object.keys(protocolCounts),
      datasets: [{
        label: 'Protocol Count',
        data: Object.values(protocolCounts),
        backgroundColor: Object.keys(protocolCounts).map((_, i) => ['#00eaff', '#ff357a', '#a259ff', '#5ee6a6'][i % 4]),
        borderWidth: 0,
      }],
    };
  }
  function computeLineData(results) {
    if (!results || results.length === 0) return { labels: [], datasets: [] };
    // Example: predictions over time
    return {
      labels: results.map(r => r.timestamp || ''),
      datasets: [{
        label: 'Predictions Over Time',
        data: results.map(r => r.prediction === 'Benign' ? 0 : 1),
        fill: true,
        backgroundColor: 'rgba(0,234,255,0.2)',
        borderColor: '#00eaff',
        tension: 0.4,
        pointRadius: 4,
      }],
    };
  }
  function computeFeatureData(results) {
    if (!results || results.length === 0) return { labels: [], datasets: [] };
    // Example: top SHAP features (average abs value per feature)
    if (!results[0].explanation) return { labels: [], datasets: [] };
    const nFeatures = results[0].explanation.length;
    const sums = Array(nFeatures).fill(0);
    results.forEach(r => {
      r.explanation.forEach((v, i) => { sums[i] += Math.abs(v); });
    });
    const avgs = sums.map(s => s / results.length);
    return {
      labels: Array.from({length: nFeatures}, (_, i) => `Feature ${i+1}`),
      datasets: [{
        label: 'SHAP Value',
        data: avgs,
        backgroundColor: avgs.map((_, i) => ['#ff357a', '#00eaff', '#a259ff', '#5ee6a6'][i % 4]),
        borderWidth: 0,
      }],
    };
  }
  const lineData = computeLineData(results.length > 0 ? results : []);
  const featureData = computeFeatureData(results.length > 0 ? results : []);

  const radarPlaceholder = (
    <div style={{
      background: 'rgba(24,28,36,0.95)',
      borderRadius: 16,
      minHeight: 220,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#8fa1c7',
      fontSize: 22,
      fontWeight: 600,
      boxShadow: '0 2px 16px #0004',
    }}>
      [Radar/Polar Chart Placeholder]
    </div>
  );

  // Block or report action
  const handleAction = async (type, row) => {
    const url = type === 'block' ? 'http://localhost:5000/block' : 'http://localhost:5000/report';
    const payload = {
      src_ip: row.src,
      protocol: row.protocol,
      row: row
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const info = await res.json();
      setActionMsg(`${type === 'block' ? 'Blocked' : 'Reported'} ${row.src}`);
      setTimeout(() => setActionMsg(''), 2000);
    } catch (err) {
      setActionMsg('Action failed');
      setTimeout(() => setActionMsg(''), 2000);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/system-status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  const fetchThreatAnalysis = async () => {
    try {
      const response = await fetch('http://localhost:5000/threat-analysis');
      const data = await response.json();
      setThreatAnalysis(data);
    } catch (error) {
      console.error('Error fetching threat analysis:', error);
    }
  };

  const fetchModelComparison = async () => {
    try {
      const response = await fetch('http://localhost:5000/model-comparison');
      const data = await response.json();
      setModelComparison(data);
    } catch (error) {
      console.error('Error fetching model comparison:', error);
    }
  };

  const fetchForensicLog = async () => {
    try {
      const response = await fetch('http://localhost:5000/forensic-log');
      const data = await response.json();
      setForensicLog(data.log || []);
    } catch (error) {
      console.error('Error fetching forensic log:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:5000/alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchAlertStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/alert-stats');
      const data = await response.json();
      setAlertStats(data);
    } catch (error) {
      console.error('Error fetching alert stats:', error);
    }
  };

  const testAlertSystem = async () => {
    try {
      const response = await fetch('http://localhost:5000/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threat_data: {
            src: '192.168.1.100',
            dst: '192.168.1.1',
            protocol: 'HTTP',
            prediction: 'Malicious'
          }
        })
      });
      const data = await response.json();
      if (data.alert_triggered) {
        console.log('Test alert triggered successfully');
        // Refresh alerts
        fetchAlerts();
        fetchAlertStats();
      }
    } catch (error) {
      console.error('Error testing alert system:', error);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchLivePredictions();
    fetchSystemStatus();
    fetchThreatAnalysis();
    fetchModelComparison();
    fetchForensicLog();
    fetchAlerts();
    fetchAlertStats();

    // Set up polling
    const interval = setInterval(() => {
      fetchLivePredictions();
      fetchSystemStatus();
      fetchThreatAnalysis();
      fetchAlerts();
      fetchAlertStats();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const renderSystemStatus = () => (
    <div className="system-status-grid">
      <div className="status-card">
        <h3>System Health</h3>
        <div className="status-indicator">
          <span className={`status-dot ${systemStatus.status === 'operational' ? 'green' : 'red'}`}></span>
          {systemStatus.status || 'Unknown'}
        </div>
        <p>Uptime: {systemStatus.uptime_hours || 0} hours</p>
      </div>
      
      <div className="status-card">
        <h3>Packet Analysis</h3>
        <p>Total Analyzed: {systemStatus.total_packets_analyzed || 0}</p>
        <p>Threats Detected: {systemStatus.threats_detected || 0}</p>
        <p>Threat Rate: {systemStatus.threat_rate || 0}%</p>
      </div>

      <div className="status-card">
        <h3>Model Performance</h3>
        {systemStatus.model_performance && (
          <>
            <p>Accuracy: {(systemStatus.model_performance.accuracy * 100).toFixed(1)}%</p>
            <p>Precision: {(systemStatus.model_performance.precision * 100).toFixed(1)}%</p>
            <p>Recall: {(systemStatus.model_performance.recall * 100).toFixed(1)}%</p>
            <p>F1-Score: {(systemStatus.model_performance.f1_score * 100).toFixed(1)}%</p>
          </>
        )}
      </div>
    </div>
  );

  const renderThreatAnalysis = () => (
    <div className="threat-analysis">
      <h3>Threat Analysis Dashboard</h3>
      <div className="threat-stats">
        <div className="stat-card">
          <h4>Total Analyzed</h4>
          <p>{threatAnalysis.total_analyzed || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Malicious</h4>
          <p className="malicious">{threatAnalysis.malicious_count || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Benign</h4>
          <p className="benign">{threatAnalysis.benign_count || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Threat Rate</h4>
          <p>{threatAnalysis.threat_rate || 0}%</p>
        </div>
      </div>
      
      {threatAnalysis.top_threat_sources && threatAnalysis.top_threat_sources.length > 0 && (
        <div className="threat-sources">
          <h4>Top Threat Sources</h4>
          <div className="source-list">
            {threatAnalysis.top_threat_sources.map((source, index) => (
              <div key={index} className="source-item">
                <span className="ip">{source.ip}</span>
                <span className="count">{source.count} threats</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderModelComparison = () => (
    <div className="model-comparison">
      <h3>ML Model Analysis</h3>
      {modelComparison.current_model && (
        <div className="current-model">
          <h4>Current Model: {modelComparison.current_model.type}</h4>
          <div className="model-details">
            <p>Features Used: {modelComparison.current_model.features_used}</p>
            <p>Estimators: {modelComparison.current_model.n_estimators}</p>
            <p>Last Trained: {new Date(modelComparison.current_model.last_trained).toLocaleString()}</p>
          </div>
          
          {modelComparison.current_model.performance && (
            <div className="performance-metrics">
              <h5>Performance Metrics</h5>
              <div className="metrics-grid">
                <div className="metric">
                  <span>Accuracy</span>
                  <span>{(modelComparison.current_model.performance.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span>Precision</span>
                  <span>{(modelComparison.current_model.performance.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span>Recall</span>
                  <span>{(modelComparison.current_model.performance.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span>F1-Score</span>
                  <span>{(modelComparison.current_model.performance.f1_score * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {modelComparison.recommendations && (
        <div className="recommendations">
          <h4>Recommendations</h4>
          <ul>
            {modelComparison.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderForensicLog = () => (
    <div className="forensic-log">
      <h3>Forensic Analysis Log</h3>
      <div className="log-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Protocol</th>
              <th>Length</th>
              <th>Prediction</th>
            </tr>
          </thead>
          <tbody>
            {forensicLog.map((entry, index) => (
              <tr key={index} className={entry.prediction === 'Malicious' ? 'malicious-row' : ''}>
                <td>{entry.timestamp}</td>
                <td>{entry.src}</td>
                <td>{entry.dst}</td>
                <td>{entry.protocol}</td>
                <td>{entry.length}</td>
                <td className={entry.prediction === 'Malicious' ? 'malicious' : 'benign'}>
                  {entry.prediction}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="alerts-dashboard">
      <div className="alerts-header">
        <h3>🚨 Threat Alerts & Response</h3>
        <div className="alert-controls">
          <button 
            className="test-alert-btn"
            onClick={testAlertSystem}
            title="Test the alert system"
          >
            🧪 Test Alert
          </button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="alert-stats">
        <div className="stat-card">
          <h4>Total Alerts</h4>
          <p className="alert-count">{alertStats.total_alerts || 0}</p>
        </div>
        <div className="stat-card critical">
          <h4>Critical</h4>
          <p className="critical-count">{alertStats.alerts_by_level?.critical || 0}</p>
        </div>
        <div className="stat-card high">
          <h4>High</h4>
          <p className="high-count">{alertStats.alerts_by_level?.high || 0}</p>
        </div>
        <div className="stat-card medium">
          <h4>Medium</h4>
          <p className="medium-count">{alertStats.alerts_by_level?.medium || 0}</p>
        </div>
        <div className="stat-card low">
          <h4>Low</h4>
          <p className="low-count">{alertStats.alerts_by_level?.low || 0}</p>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="recent-alerts">
        <h4>Recent Alerts</h4>
        <div className="alerts-list">
          {alerts.length === 0 ? (
            <div className="no-alerts">
              <span>No alerts triggered yet</span>
              <small>Alerts will appear here when threats are detected</small>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <div 
                key={alert.id} 
                className={`alert-item ${alert.level}`}
                onClick={() => {
                  setCurrentAlert(alert);
                  setShowAlertModal(true);
                }}
              >
                <div className="alert-header">
                  <span className={`alert-level ${alert.level}`}>
                    {alert.level.toUpperCase()}
                  </span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="alert-content">
                  <div className="threat-info">
                    <span className="src-ip">{alert.threat_data.src}</span>
                    <span className="arrow">→</span>
                    <span className="dst-ip">{alert.threat_data.dst}</span>
                  </div>
                  <div className="protocol-info">
                    Protocol: {alert.threat_data.protocol}
                  </div>
                  <div className="actions-taken">
                    Actions: {alert.actions_taken.length} executed
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderLiveAlerts = () => (
    <div className="live-alerts">
      <div className="alerts-header">
        <h3>Live IDS Alerts</h3>
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          <span>LIVE</span>
        </div>
      </div>
      
      {/* Real-time stats summary */}
      <div className="alerts-summary">
        <div className="summary-card">
          <span className="summary-label">Total Packets</span>
          <span className="summary-value">{livePredictions.length}</span>
        </div>
        <div className="summary-card malicious">
          <span className="summary-label">Threats Detected</span>
          <span className="summary-value">
            {livePredictions.filter(pred => pred.prediction === 'Malicious').length}
          </span>
        </div>
        <div className="summary-card benign">
          <span className="summary-label">Benign Traffic</span>
          <span className="summary-value">
            {livePredictions.filter(pred => pred.prediction === 'Benign').length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Threat Rate</span>
          <span className="summary-value">
            {livePredictions.length > 0 
              ? ((livePredictions.filter(pred => pred.prediction === 'Malicious').length / livePredictions.length) * 100).toFixed(1)
              : 0}%
          </span>
        </div>
      </div>

      <div className="alerts-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Protocol</th>
              <th>Length</th>
              <th>Prediction</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {livePredictions.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  <div className="no-data-content">
                    <span>Waiting for network traffic...</span>
                    <small>Start generating network traffic to see live detection results</small>
                  </div>
                </td>
              </tr>
            ) : (
              livePredictions
                .slice(-20)
                .map((pred, index) => (
                  <tr key={index} className={pred.prediction === 'Malicious' ? 'malicious-row' : 'benign-row'}>
                    <td>{pred.timestamp || new Date().toLocaleTimeString()}</td>
                    <td className="ip-cell">{pred.src || 'Unknown'}</td>
                    <td className="ip-cell">{pred.dst || 'Unknown'}</td>
                    <td className="protocol-cell">{pred.protocol || 'Unknown'}</td>
                    <td>{pred.length || 'N/A'}</td>
                    <td className={pred.prediction === 'Malicious' ? 'malicious' : 'benign'}>
                      <span className="prediction-badge">
                        {pred.prediction || 'Unknown'}
                      </span>
                    </td>
                    <td className="actions">
                      {pred.prediction === 'Malicious' && (
                        <>
                          <button
                            onClick={() => handleAction('block', {
                              src_ip: pred.src,
                              protocol: pred.protocol,
                              row: index
                            })}
                            disabled={loading}
                            className="action-btn block"
                            title="Block this source"
                          >
                            🛡️ Block
                          </button>
                          <button
                            onClick={() => handleAction('report', {
                              src_ip: pred.src,
                              protocol: pred.protocol,
                              row: index
                            })}
                            disabled={loading}
                            className="action-btn report"
                            title="Report threat"
                          >
                            📊 Report
                          </button>
                          <button
                            onClick={() => handleAction('trace', {
                              src_ip: pred.src,
                              dst_ip: pred.dst,
                              protocol: pred.protocol,
                              row: index
                            })}
                            disabled={loading}
                            className="action-btn trace"
                            title="Trace connection"
                          >
                            🔍 Trace
                          </button>
                        </>
                      )}
                      {pred.prediction === 'Benign' && (
                        <span className="benign-indicator">✅ Safe</span>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="network-dashboard">
      {/* Fancy Home Button */}
      <div className="home-button-container">
        <button 
          className="fancy-home-btn"
          onClick={() => navigate('/')}
          onMouseEnter={() => setHoveredBtn('home')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <div className="home-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <span className="home-text">Home</span>
          <div className={`home-glow ${hoveredBtn === 'home' ? 'active' : ''}`}></div>
        </button>
      </div>

      <div className="dashboard-header">
        <div className="header-content">
          <h1>AI-Powered Intrusion Detection & Mitigation System (PDMS)</h1>
          <p>Real-time network security monitoring and threat response</p>
        </div>
        <div className="system-status-indicator">
          <div className="status-dot active"></div>
          <span>Live Monitoring Active</span>
        </div>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          Live Alerts
        </button>
        <button
          className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          System Status
        </button>
        <button
          className={`tab-btn ${activeTab === 'threats' ? 'active' : ''}`}
          onClick={() => setActiveTab('threats')}
        >
          Threat Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          Model Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === 'forensic' ? 'active' : ''}`}
          onClick={() => setActiveTab('forensic')}
        >
          Forensic Log
        </button>
        <button
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'live' && renderLiveAlerts()}
        {activeTab === 'status' && renderSystemStatus()}
        {activeTab === 'threats' && renderThreatAnalysis()}
        {activeTab === 'models' && renderModelComparison()}
        {activeTab === 'forensic' && renderForensicLog()}
        {activeTab === 'alerts' && renderAlerts()}
      </div>
    </div>
  );
}

export default NetworkDashboard; 