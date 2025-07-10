import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PDMSDashboard.css';

const PDMSDashboard = () => {
  const [livePredictions, setLivePredictions] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [threatAnalysis, setThreatAnalysis] = useState({});
  const [modelComparison, setModelComparison] = useState({});
  const [forensicLog, setForensicLog] = useState([]);
  const [activeTab, setActiveTab] = useState('live');
  const [loading, setLoading] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const navigate = useNavigate();

  const fetchLivePredictions = async () => {
    try {
      const response = await fetch('http://localhost:5000/live-predictions');
      const data = await response.json();
      setLivePredictions(data.live_predictions || []);
    } catch (error) {
      console.error('Error fetching live predictions:', error);
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

  const handleAction = async (action, data) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      console.log(`${action} result:`, result);
      // Refresh data after action
      fetchLivePredictions();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchLivePredictions();
    fetchSystemStatus();
    fetchThreatAnalysis();
    fetchModelComparison();
    fetchForensicLog();

    // Set up polling
    const interval = setInterval(() => {
      fetchLivePredictions();
      fetchSystemStatus();
      fetchThreatAnalysis();
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

  const renderLiveAlerts = () => (
    <div className="live-alerts">
      <h3>Live IDS Alerts</h3>
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
            {livePredictions
              .filter(pred => pred.prediction === 'Malicious')
              .slice(-20)
              .map((pred, index) => (
                <tr key={index} className="malicious-row">
                  <td>{pred.timestamp}</td>
                  <td>{pred.src}</td>
                  <td>{pred.dst}</td>
                  <td>{pred.protocol}</td>
                  <td>{pred.length}</td>
                  <td className="malicious">{pred.prediction}</td>
                  <td className="actions">
                    <button
                      onClick={() => handleAction('block', {
                        src_ip: pred.src,
                        protocol: pred.protocol,
                        row: index
                      })}
                      disabled={loading}
                      className="action-btn block"
                    >
                      Block
                    </button>
                    <button
                      onClick={() => handleAction('report', {
                        src_ip: pred.src,
                        protocol: pred.protocol,
                        row: index
                      })}
                      disabled={loading}
                      className="action-btn report"
                    >
                      Report
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
                    >
                      Trace
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="pdms-dashboard">
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
        <h1>AI-Powered Intrusion Detection & Mitigation System (PDMS)</h1>
        <p>Real-time network security monitoring and threat response</p>
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
      </div>

      <div className="dashboard-content">
        {activeTab === 'live' && renderLiveAlerts()}
        {activeTab === 'status' && renderSystemStatus()}
        {activeTab === 'threats' && renderThreatAnalysis()}
        {activeTab === 'models' && renderModelComparison()}
        {activeTab === 'forensic' && renderForensicLog()}
      </div>
    </div>
  );
};

export default PDMSDashboard; 