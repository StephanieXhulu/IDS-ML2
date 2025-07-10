import React from 'react';

function PredictionRow({ idx, row, highlight }) {
  const [open, setOpen] = React.useState(false);
  const [actionMsg, setActionMsg] = React.useState('');
  const isMalicious = row.prediction && row.prediction.toLowerCase() === 'malicious';

  // Helper to call backend action endpoints
  const handleAction = async (action) => {
    setActionMsg('');
    let url = `http://localhost:5000/${action}`;
    let payload = {
      protocol: row.protocol || undefined,
      timestamp: row.timestamp || undefined,
      row: idx,
      // src_ip, dst_ip can be added if available in row
      src_ip: row.src_ip || undefined,
      dst_ip: row.dst_ip || undefined,
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const info = await res.json();
      setActionMsg(`${action.charAt(0).toUpperCase() + action.slice(1)}: ${info.status}`);
      setTimeout(() => setActionMsg(''), 2500);
    } catch (e) {
      setActionMsg('Action failed');
      setTimeout(() => setActionMsg(''), 2500);
    }
  };

  return (
    <tr
      style={{
        background: highlight ? 'rgba(255,53,122,0.08)' : (open ? 'rgba(0,234,255,0.08)' : (isMalicious ? 'rgba(255,53,122,0.13)' : 'transparent')),
        color: isMalicious ? '#ff357a' : '#fff',
        fontWeight: isMalicious ? 700 : 400,
        transition: 'background 0.3s, color 0.3s',
        borderBottom: '1px solid #23283a'
      }}
    >
      <td style={{ padding: 8, textAlign: 'center' }}>{idx + 1}</td>
      <td style={{ padding: 8 }}>{row.timestamp || '-'}</td>
      <td style={{ padding: 8 }}>{row.protocol || '-'}</td>
      <td style={{ padding: 8, color: isMalicious ? '#ff357a' : '#5ee6a6', fontWeight: isMalicious ? 700 : 400 }}>{row.prediction}
        {isMalicious && (
          <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
            <button onClick={() => handleAction('block')} style={{ background: '#ff357a', color: '#fff', border: 'none', borderRadius: 5, padding: '2px 10px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Block</button>
            <button onClick={() => handleAction('report')} style={{ background: '#00eaff', color: '#23283a', border: 'none', borderRadius: 5, padding: '2px 10px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Report</button>
            <button onClick={() => handleAction('trace')} style={{ background: '#a259ff', color: '#fff', border: 'none', borderRadius: 5, padding: '2px 10px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Trace</button>
          </div>
        )}
        {actionMsg && <div style={{ color: '#5ee6a6', fontSize: 13, marginTop: 4 }}>{actionMsg}</div>}
      </td>
      <td style={{ padding: 8 }}>
        <button onClick={() => setOpen(o => !o)} style={{
          background: open ? '#00eaff' : '#23283a',
          color: open ? '#23283a' : '#00eaff',
          border: 'none',
          borderRadius: 6,
          padding: '4px 12px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: open ? '0 0 8px #00eaff' : 'none',
          fontSize: 15,
        }}>{open ? 'Hide' : 'Show'}</button>
        {open && row.explanation && (
          <div style={{ marginTop: 8, background: '#181c24', borderRadius: 8, padding: 8, color: '#fff', fontSize: 14, boxShadow: '0 2px 8px #00eaff44' }}>
            <b>SHAP values:</b> [
            {row.explanation.map((v, i) => (
              <span key={i} style={{ color: Math.abs(v) > 0.2 ? '#ff357a' : '#5ee6a6', marginRight: 4 }}>{v.toFixed(3)}{i < row.explanation.length - 1 ? ',' : ''}</span>
            ))}
            ]
          </div>
        )}
      </td>
      <td style={{ padding: 8 }}>{row.label !== undefined && row.label !== null ? row.label : '--'}</td>
    </tr>
  );
}

export default PredictionRow; 