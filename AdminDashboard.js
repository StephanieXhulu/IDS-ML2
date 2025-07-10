import React, { useState, useEffect, useRef } from 'react';
import './AdminDashboard.css';
import { FaUpload, FaCheckCircle, FaTimesCircle, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import PredictionRow from './PredictionRow';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const metricIcons = {
  accuracy: <FaCheckCircle color="#13ffb9" size={28} />, 
  precision: <FaChartLine color="#36A2EB" size={28} />, 
  recall: <FaShieldAlt color="#ffce56" size={28} />, 
  f1_score: <FaTimesCircle color="#ff357a" size={28} />
};

const metricLabels = {
  accuracy: 'Accuracy',
  precision: 'Precision',
  recall: 'Recall',
  f1_score: 'F1 Score'
};

const COLORS = ['#52c41a', '#ff4d4f']; // Benign, Malicious
const ALARM_SOUND = '/alarm.mp3'; // Place alarm.mp3 in public/

function safeDisplay(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (Array.isArray(val)) return val.map(safeDisplay).join(', ');
  if (typeof val === 'object' && val !== null && val.$$typeof) return '[React Element]';
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

function AdminDashboard() {
  // Analytics dashboard (charts, metrics, etc.)
  const [metrics, setMetrics] = useState({});
  const [results, setResults] = useState([]);
  const [shapBarData, setShapBarData] = useState(null);
  const [lineData, setLineData] = useState(null);
  const [pieData, setPieData] = useState(null);
  const navigate = useNavigate();
  const [livePulse, setLivePulse] = useState(false);

  // Upload and testing state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [systemStatus, setSystemStatus] = useState({});
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'results', 'status', 'instructions'
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const audioRef = useRef(null);

  // Auto-refresh metrics and history every 1 second
  useEffect(() => {
    const fetchData = () => {
      fetch('http://localhost:5000/metrics')
        .then(res => res.json())
        .then(setMetrics);
      fetch('http://localhost:5000/history')
        .then(res => res.json())
        .then(data => {
          setResults(data.history || []);
          setLivePulse(true);
          setTimeout(() => setLivePulse(false), 400);
        });
    };
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch system status
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/system-status');
        const data = await response.json();
        setSystemStatus(data);
      } catch (error) {
        console.error('Error fetching system status:', error);
      }
    };
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Pie chart for prediction distribution
    if (results.length) {
      const counts = {};
      results.forEach(r => {
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
    // Bar chart for average SHAP values per feature
    if (results.length && results[0].explanation) {
      const nFeatures = results[0].explanation.length;
      const avgShap = Array(nFeatures).fill(0);
      results.forEach(r => {
        r.explanation.forEach((v, i) => {
          avgShap[i] += Math.abs(v);
        });
      });
      for (let i = 0; i < nFeatures; i++) avgShap[i] /= results.length;
      setShapBarData({
        labels: Array.from({ length: nFeatures }, (_, i) => `Feature ${i + 1}`),
        datasets: [
          {
            label: 'Avg |SHAP value|',
            data: avgShap,
            backgroundColor: '#36A2EB',
          },
        ],
      });
    } else {
      setShapBarData(null);
    }
    // Line chart for predictions over time
    if (results.length) {
      setLineData({
        labels: results.map((_, i) => `#${i + 1}`),
        datasets: [
          {
            label: 'Prediction',
            data: results.map(r => r.prediction),
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255,99,132,0.2)',
            tension: 0.3,
            fill: true,
          },
        ],
      });
    } else {
      setLineData(null);
    }
  }, [results]);

  // Play sound and show toast if malicious detected
  useEffect(() => {
    if (testResults && testResults.results && testResults.results.some(r => r.prediction === 'Malicious')) {
      if (audioRef.current) {
        audioRef.current.play();
      }
      setToastMsg('Malicious activity detected! Actions triggered.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  }, [testResults]);

  // Pie chart data for predictions
  const pieChartData = React.useMemo(() => {
    if (!testResults || !testResults.results) return [];
    const counts = { Benign: 0, Malicious: 0 };
    testResults.results.forEach(r => {
      if (r.prediction === 'Malicious') counts.Malicious++;
      else counts.Benign++;
    });
    return [
      { name: 'Benign', value: counts.Benign },
      { name: 'Malicious', value: counts.Malicious },
    ];
  }, [testResults]);

  // Upload handlers
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadMsg('');
    setErrorMsg('');
    setTestResults(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadMsg('');
      setErrorMsg('');
      setTestResults(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };

  const handleUpload = async () => {
    setErrorMsg('');
    setUploadMsg('');
    if (!file) {
      setErrorMsg('Please select a file first.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });
      const info = await res.json();
      if (!res.ok) {
        setErrorMsg(info.error || 'Upload failed.');
        setUploading(false);
        return;
      }
      setUploadMsg('Upload successful! Running analysis...');
      setUploading(false);
      await handleBatchPredict();
    } catch (err) {
      setErrorMsg('Network error: Backend is unreachable or not running.');
      setUploading(false);
    }
  };

  const handleBatchPredict = async () => {
    setUploadMsg('Running predictions and analysis...');
    try {
      const res = await fetch('http://localhost:5000/predict_uploaded', {
        method: 'POST',
      });
      const info = await res.json();
      if (!res.ok) {
        setErrorMsg(info.error || 'Prediction failed.');
        setUploadMsg('');
        return;
      }
      setTestResults(info);
      setUploadMsg('Analysis complete!');
      setActiveTab('results');
    } catch (err) {
      setErrorMsg('Network error during prediction.');
      setUploadMsg('');
    }
  };

  const downloadResults = () => {
    if (!testResults) return;
    
    const csvContent = [
      ['Index', 'Prediction', 'Confidence', 'Features Used'].join(','),
      ...testResults.results.map((result, index) => [
        index + 1,
        result.prediction,
        result.explanation ? Math.abs(result.explanation[0]).toFixed(4) : 'N/A',
        testResults.columns.length
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdms_test_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Action handlers
  const handleAction = async (action, rowIdx) => {
    const row = testResults.results[rowIdx];
    let endpoint = '';
    let body = {};
    if (action === 'block') {
      endpoint = 'block';
      body = { src_ip: 'Unknown', protocol: 'Unknown', row: rowIdx };
    } else if (action === 'report') {
      endpoint = 'report';
      body = { src_ip: 'Unknown', protocol: 'Unknown', row: rowIdx };
    } else if (action === 'trace') {
      endpoint = 'trace';
      body = { src_ip: 'Unknown', dst_ip: 'Unknown', protocol: 'Unknown', row: rowIdx };
    }
    try {
      const res = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const info = await res.json();
      setToastMsg(`${action.charAt(0).toUpperCase() + action.slice(1)} action triggered for row ${rowIdx + 1}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastMsg('Action failed.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="admin-dashboard-root">
      <audio ref={audioRef} src={ALARM_SOUND} preload="auto" />
      {showToast && <div className="dashboard-toast">{toastMsg}</div>}
      <div className="admin-dashboard-header">
        <h1>PDMS Admin Dashboard</h1>
        <div className="admin-dashboard-tabs">
          <button className={activeTab==='upload' ? 'active' : ''} onClick={()=>setActiveTab('upload')}>Upload & Test</button>
          <button className={activeTab==='results' ? 'active' : ''} onClick={()=>setActiveTab('results')}>Test Results</button>
          <button className={activeTab==='status' ? 'active' : ''} onClick={()=>setActiveTab('status')}>System Status</button>
          <button className={activeTab==='guide' ? 'active' : ''} onClick={()=>setActiveTab('guide')}>Testing Guide</button>
          <button className="home-btn" onClick={() => navigate('/')}>🏠 Home</button>
        </div>
      </div>
      <div className="admin-dashboard-content">
        {activeTab === 'upload' && (
          <div className="upload-section">
            <h2>🧪 Dataset Upload & Testing</h2>
            <p>Upload a CSV dataset to test the PDMS system and evaluate performance</p>
            <div className={`upload-dropzone${dragActive ? ' drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={()=>inputRef.current.click()}
            >
              <FaUpload size={48} color="#00eaff" style={{marginBottom: 10}}/>
              <div>{file ? file.name : 'Drag & drop or click to select a CSV file (max 10MB)'}</div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                name="dataset"
                id="dataset-upload"
                style={{display:'none'}}
                onChange={handleFileChange}
              />
            </div>
            <button className="upload-btn" onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : '🚀 Upload & Test'}</button>
            {uploadMsg && <div className="upload-msg success">{uploadMsg}</div>}
            {errorMsg && <div className="upload-msg error">{errorMsg}</div>}
          </div>
        )}
        {activeTab === 'results' && (
          <div className="results-section">
            <h2>📊 Test Results</h2>
            <div className="metrics-cards">
              {['accuracy','precision','recall','f1_score'].map(key => (
                <div className="metric-card" key={key}>
                  <div className="metric-icon">{metricIcons[key]}</div>
                  <div className="metric-label">{metricLabels[key]}</div>
                  <div className="metric-value">
                    {metrics[key] !== null && metrics[key] !== undefined ? (metrics[key]*100).toFixed(2)+'%' : '--'}
                  </div>
                </div>
              ))}
            </div>
            <div className="results-charts-section">
              <h3>Prediction Distribution</h3>
              <PieChart width={320} height={220}>
                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieChartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
            <div className="results-table-section">
              <h3>Threat Actions</h3>
              {testResults && testResults.results && testResults.results.length ? (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Prediction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.results.map((row, i) => (
                      <tr key={i}>
                        <td>{i+1}</td>
                        <td>{typeof row.prediction === 'string' || typeof row.prediction === 'number' ? row.prediction : JSON.stringify(row.prediction)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-results">No predictions yet. Upload data or make a prediction to see results here.</div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'status' && (
          <div className="status-section">
            <h2>⚡ System Status</h2>
            <pre style={{background:'#181c24', color:'#5ee6a6', borderRadius:10, padding:20, fontSize:16}}>
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </div>
        )}
        {activeTab === 'guide' && (
          <div className="guide-section">
            <h2>📖 Testing Guide</h2>
            <ol style={{color:'#b0b8d1', fontSize:18, lineHeight:1.7}}>
              <li>Click <b>Upload & Test</b> and select a CSV dataset (max 10MB).</li>
              <li>Click <b>Upload & Test</b> to upload and start analysis.</li>
              <li>Switch to <b>Test Results</b> to view metrics and predictions.</li>
              <li>Check <b>System Status</b> for backend health and metrics.</li>
              <li>Repeat as needed with different datasets.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 