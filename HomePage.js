import React from 'react';

const navLinks = [
  'Home',
  'Network Projects',
  'Network Security Projects',
  'Network Simulation Tools',
  'Contact Us',
  'Intrusion Detection System Projects'
];

function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #181c24 0%, #23283a 100%)', color: '#fff', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      {/* Navigation Bar */}
      <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#23283a', padding: '18px 0', boxShadow: '0 2px 12px #0004', position: 'sticky', top: 0, zIndex: 10 }}>
        {navLinks.map((link, i) => (
          <button key={i} style={{ color: '#5ee6a6', textDecoration: 'none', fontWeight: 600, fontSize: 18, margin: '0 22px', letterSpacing: 0.5, transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>{link}</button>
        ))}
      </nav>
      <div style={{ maxWidth: 1100, margin: 'auto', padding: '40px 18px 60px 18px' }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: '#5ee6a6', marginBottom: 10, textAlign: 'center' }}>Intrusion Detection System Projects</h1>
        <p style={{ color: '#b0b8d1', fontSize: 20, textAlign: 'center', marginBottom: 32 }}>
          Intrusion Detection System (IDS) Projects are designed to detect and respond to malicious activity in networks and systems. IDS is a security scheme that aims to distinguish real threats from false alarms, protecting against a wide range of attacks.
        </p>
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ color: '#00eaff', fontSize: 28, fontWeight: 700 }}>Types of Intruders & Behaviors</h2>
          <ul style={{ fontSize: 18, marginLeft: 24, marginBottom: 10 }}>
            <li>Clandestine</li>
            <li>Masquerader</li>
            <li>Misfeasor</li>
          </ul>
          <div style={{ color: '#8fa1c7', fontSize: 17, marginBottom: 8 }}>Common Intruder Behaviors:</div>
          <ul style={{ fontSize: 17, marginLeft: 24 }}>
            <li>Passive Eavesdropping</li>
            <li>Active Interfering</li>
            <li>Secret Information Leakage</li>
            <li>Data Tampering</li>
            <li>Impersonation</li>
            <li>Message Replay and Distortion</li>
            <li>DoS and DDoS Attacks</li>
          </ul>
        </section>
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ color: '#00eaff', fontSize: 28, fontWeight: 700 }}>IDS Categories & Methods</h2>
          <ul style={{ fontSize: 18, marginLeft: 24, marginBottom: 10 }}>
            <li>Network Intrusion Detection System (NIDS)</li>
            <li>Host Intrusion Detection System (HIDS)</li>
          </ul>
          <div style={{ color: '#8fa1c7', fontSize: 17, marginBottom: 8 }}>Detection Methods:</div>
          <ul style={{ fontSize: 17, marginLeft: 24 }}>
            <li>Signature-based</li>
            <li>Anomaly-based</li>
            <li>Hybrid (Anomaly + Signature)</li>
          </ul>
        </section>
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ color: '#00eaff', fontSize: 28, fontWeight: 700 }}>IDS Research Issues</h2>
          <ul style={{ fontSize: 17, marginLeft: 24 }}>
            <li>Learning from Large Amounts of Data</li>
            <li>False Positive and Negative Identification</li>
            <li>Staffing of New Attack Types</li>
            <li>Incomplete Attack Coverage</li>
            <li>High Accuracy & Completeness</li>
            <li>Fault Tolerance & Timeliness</li>
            <li>Scalability</li>
          </ul>
        </section>
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ color: '#00eaff', fontSize: 28, fontWeight: 700 }}>IDS Methods & Algorithms</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ color: '#5ee6a6', fontSize: 20 }}>Supervised</h3>
              <ul style={{ fontSize: 16, marginLeft: 18 }}>
                <li>K-Nearest Neighbor</li>
                <li>Support Vector Machine</li>
                <li>Naïve Bayes</li>
                <li>Logistic Regression</li>
                <li>Decision Tree</li>
                <li>Linear Regression</li>
              </ul>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ color: '#5ee6a6', fontSize: 20 }}>Unsupervised</h3>
              <ul style={{ fontSize: 16, marginLeft: 18 }}>
                <li>PCA, LDA, ICA</li>
                <li>K-means, Mean Shift, K-Medoids</li>
              </ul>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ color: '#5ee6a6', fontSize: 20 }}>Deep Reinforcement</h3>
              <ul style={{ fontSize: 16, marginLeft: 18 }}>
                <li>Q-learning, SARSA, A3C, DQN, TD3</li>
              </ul>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ color: '#5ee6a6', fontSize: 20 }}>Other Methods</h3>
              <ul style={{ fontSize: 16, marginLeft: 18 }}>
                <li>Cryptography, Hashing, Statistical Approaches</li>
                <li>Pseudorandom Functions</li>
                <li>Hybrid & Custom ML Approaches</li>
              </ul>
            </div>
          </div>
        </section>
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ color: '#00eaff', fontSize: 28, fontWeight: 700 }}>Simulation Tools & Technologies</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <ul style={{ fontSize: 16, marginLeft: 18 }}>
                <li>NS2, NS3, OMNET++, OPNET, QULANET, MININET</li>
                <li>MATLAB, LTESIM, COOJA, CONTIKI OS, GNS3</li>
                <li>NETSIM, EVE-NG, TRANS, PEERSIM, GLOMOSIM</li>
                <li>RTOOL, KATHARA, VNX, WISTAR, CNET, ESCAPE</li>
                <li>NETMIRAGE, BOSON NETSIM, VIRL, CISCO PACKET TRACER</li>
                <li>SWAN, JAVASIM, SSFNET, TOSSIM, PSIM, PETRI NET</li>
                <li>ONESIM, OPTISYSTEM, DIVERT, TINY OS, OPENPANA</li>
                <li>SECURE CRT, EXTENDSIM, CONSELF, ARENA, VENSIM</li>
                <li>MARIONNET, NETKIT, GEOIP, REAL, NEST, PTOLEMY</li>
              </ul>
            </div>
          </div>
        </section>
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ color: '#00eaff', fontSize: 28, fontWeight: 700 }}>Contact & Support</h2>
          <div style={{ color: '#8fa1c7', fontSize: 17, marginBottom: 8 }}>
            For help, guidance, or collaboration, contact us:
          </div>
          <div style={{ fontSize: 18, color: '#5ee6a6', fontWeight: 600 }}>
            <span role="img" aria-label="phone">📞</span> +91 94448 47435<br />
            <span role="img" aria-label="email">✉️</span> networksimulationtool@gmail.com
          </div>
        </section>
        <footer style={{ textAlign: 'center', color: '#8fa1c7', fontSize: 15, marginTop: 40 }}>
          Copyright 2020 - All Rights Reserved
        </footer>
      </div>
    </div>
  );
}

export default HomePage; 