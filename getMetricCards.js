export function getMetricCards(results) {
  const total = results.length;
  const benign = results.filter(r => r.prediction === 'Benign').length;
  const malicious = results.filter(r => r.prediction === 'Malicious').length;
  const benignPct = total ? Math.round((benign / total) * 100) : 0;
  const maliciousPct = total ? Math.round((malicious / total) * 100) : 0;
  return [
    { label: 'Total Predictions', value: total, color: '#00eaff' },
    { label: 'Benign %', value: benignPct + '%', color: '#5ee6a6' },
    { label: 'Malicious %', value: maliciousPct + '%', color: '#ff357a' },
    { label: 'Last Updated', value: new Date().toLocaleTimeString(), color: '#a259ff' },
  ];
} 