import React from 'react';
import { Line } from 'react-chartjs-2';

function MetricCard({ icon, label, value, change, color, chartData }) {
  return (
    <div style={{
      background: 'rgba(24,28,36,0.95)',
      borderRadius: 16,
      padding: 24,
      minWidth: 180,
      flex: 1,
      margin: 8,
      boxShadow: '0 2px 16px #0004',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      border: `2px solid ${color}`,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{icon} {label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '8px 0' }}>{value}</div>
      {change && <div style={{ color: change > 0 ? '#13ffb9' : '#ff357a', fontWeight: 600, fontSize: 15 }}>{change > 0 ? '▲' : '▼'} {Math.abs(change)}%</div>}
      {chartData && <div style={{ width: '100%', marginTop: 8 }}><Line data={chartData} options={{ plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} height={40} /></div>}
    </div>
  );
}

export default MetricCard; 