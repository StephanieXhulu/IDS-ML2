import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: '🛡️',
    title: 'Threat Detection',
    desc: 'Real-time detection of network intrusions and anomalies',
  },
  {
    icon: '📈',
    title: 'Network Analytics',
    desc: 'Comprehensive network traffic analysis and visualization',
  },
  {
    icon: '🗄️',
    title: 'Dataset Management',
    desc: 'Efficient management and analysis of network datasets',
  },
  {
    icon: '🧪',
    title: 'Testing & Evaluation',
    desc: 'Upload datasets and evaluate system performance',
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [hoveredBtn, setHoveredBtn] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #181c24 0%, #23283a 100%)', color: '#fff', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ padding: '40px 0 0 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: '#b8d7fa', marginBottom: 0 }}>Network IDS Dashboard</h1>
        <div style={{ color: '#8fa1c7', fontSize: 20, marginBottom: 40 }}>Comprehensive Network Security Monitoring</div>
      </div>
      <div style={{ maxWidth: 1100, margin: 'auto', padding: '0 18px 60px 18px' }}>
        <div style={{ background: 'rgba(24,28,36,0.95)', borderRadius: 20, padding: 40, boxShadow: '0 4px 32px #0004', textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: '#4ecdc4', marginBottom: 10 }}>Network Security Intelligence</h2>
          <div style={{ color: '#8fa1c7', fontSize: 22, marginBottom: 32 }}>Advanced threat detection and network monitoring platform</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginBottom: 0, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: hoveredBtn === 'admin' ? '#23283a' : 'rgba(36, 40, 56, 0.95)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '16px 32px',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: hoveredBtn === 'admin' ? '0 0 16px #5ee6a6' : '0 2px 8px #0002',
                margin: '0 10px',
                transition: 'transform 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={() => setHoveredBtn('admin')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => navigate('/network')}
              style={{
                background: hoveredBtn === 'network' ? '#23283a' : 'rgba(36, 40, 56, 0.95)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '16px 32px',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: hoveredBtn === 'network' ? '0 0 16px #5ee6a6' : '0 2px 8px #0002',
                margin: '0 10px',
                transition: 'transform 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={() => setHoveredBtn('network')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Network Security Dashboard
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: '#202534',
              borderRadius: 16,
              padding: 32,
              minWidth: 260,
              flex: 1,
              margin: 8,
              boxShadow: '0 2px 16px #0004',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: 320,
            }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#b8d7fa', marginBottom: 8 }}>{f.title}</div>
              <div style={{ color: '#8fa1c7', fontSize: 16, textAlign: 'center' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 