import React from 'react';

function FeatureCard({ icon, title, desc, hovered, onHover, onLeave }) {
  return (
    <div
      style={{
        background: '#23283a',
        borderRadius: 16,
        padding: 30,
        minWidth: 260,
        maxWidth: 300,
        textAlign: 'center',
        marginBottom: 20,
        boxShadow: hovered ? '0 0 16px #5ee6a6' : '0 2px 8px #0002',
        transform: hovered ? 'scale(1.07)' : 'scale(1)',
        transition: 'transform 0.18s, box-shadow 0.18s',
        cursor: 'pointer',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ color: '#8fa1c7', fontSize: 16 }}>{desc}</div>
    </div>
  );
}

export default FeatureCard; 