import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

if (typeof document !== 'undefined' && !document.getElementById('landing-css')) {
  const st = document.createElement('style');
  st.id = 'landing-css';
  st.textContent = `
    .landing-root {
      position: fixed; inset: 0; overflow: hidden; background: #020817;
      display: flex; align-items: center; justify-content: center;
    }
    .landing-mesh { position: absolute; inset: 0; overflow: hidden; }
    .landing-mesh::before {
      content: ''; position: absolute; inset: -50%;
      background: conic-gradient(from 0deg at 50% 50%, #020817 0deg, #0d1f4a 60deg,
        #020817 120deg, #0a1628 180deg, #020817 240deg, #0d1f4a 300deg, #020817 360deg);
      animation: meshRotate 20s linear infinite;
    }
    @keyframes meshRotate { to { transform: rotate(360deg); } }
    .orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
    .orb-1 { width:600px;height:600px;top:-200px;left:-100px;
      background:radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%);
      animation:orbFloat1 12s ease-in-out infinite; }
    .orb-2 { width:500px;height:500px;bottom:-150px;right:-100px;
      background:radial-gradient(circle,rgba(139,92,246,0.14) 0%,transparent 70%);
      animation:orbFloat2 15s ease-in-out infinite; }
    .orb-3 { width:300px;height:300px;top:40%;left:60%;
      background:radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 70%);
      animation:orbFloat3 10s ease-in-out infinite; }
    @keyframes orbFloat1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-60px)}}
    @keyframes orbFloat2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,40px)}}
    @keyframes orbFloat3{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,50px)}}
    .landing-grid {
      position:absolute;inset:0;
      background-image:linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),
        linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px);
      background-size:60px 60px;
    }
    .landing-card {
      position:relative;z-index:10;background:rgba(255,255,255,0.03);
      backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
      border:1px solid rgba(255,255,255,0.08);border-radius:28px;
      padding:52px 48px;max-width:560px;width:90vw;text-align:center;
      box-shadow:0 0 0 1px rgba(255,255,255,0.04),0 32px 80px rgba(0,0,0,0.6),
        inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .logo-ring {
      width:80px;height:80px;border-radius:22px;
      background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(139,92,246,0.2));
      border:1px solid rgba(59,130,246,0.3);
      display:flex;align-items:center;justify-content:center;margin:0 auto 28px;
      box-shadow:0 0 40px rgba(59,130,246,0.15),inset 0 1px 0 rgba(255,255,255,0.1);
    }
    .logo-emoji { font-size:38px;line-height:1; }
    .landing-title {
      font-size:42px;font-weight:800;letter-spacing:-1.5px;
      background:linear-gradient(135deg,#ffffff 0%,#94a3b8 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;margin-bottom:10px;line-height:1.1;
    }
    .landing-tagline { font-size:13px;color:rgba(148,163,184,0.8);margin-bottom:36px;line-height:1.7; }
    .feature-pills { display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:36px; }
    .feature-pill {
      display:flex;align-items:center;gap:6px;
      background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
      border-radius:100px;padding:7px 14px;transition:all 0.2s ease;cursor:default;
    }
    .feature-pill:hover { background:rgba(59,130,246,0.12);border-color:rgba(59,130,246,0.3);transform:translateY(-1px); }
    .feature-pill-icon { font-size:13px; }
    .feature-pill-text { font-size:12px;color:rgba(203,213,225,0.9);font-weight:500; }
    .cta-btn {
      width:100%;padding:16px 32px;
      background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 50%,#3b82f6 100%);
      border:none;border-radius:14px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;gap:10px;
      font-size:15px;font-weight:700;color:#fff;letter-spacing:0.2px;
      box-shadow:0 4px 24px rgba(37,99,235,0.4),inset 0 1px 0 rgba(255,255,255,0.15);
      transition:all 0.2s ease;margin-bottom:20px;
    }
    .cta-btn:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(37,99,235,0.5); }
    .cta-btn:active { transform:translateY(0); }
    .cta-arrow { font-size:18px;display:inline-block;transition:transform 0.2s ease; }
    .cta-btn:hover .cta-arrow { transform:translateX(4px); }
    .status-bar { display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap; }
    .status-dot {
      width:6px;height:6px;border-radius:50%;background:#22c55e;
      box-shadow:0 0 8px rgba(34,197,94,0.6);animation:statusPulse 2s ease-in-out infinite;
    }
    @keyframes statusPulse { 0%,100%{opacity:1}50%{opacity:0.5} }
    .status-text { font-size:11px;color:rgba(100,116,139,0.8); }
    .status-divider { width:1px;height:10px;background:rgba(255,255,255,0.1); }
    .particle {
      position:absolute;border-radius:50%;background:rgba(59,130,246,0.5);
      pointer-events:none;animation:particleFloat linear infinite;
    }
    @keyframes particleFloat {
      0%{transform:translateY(100vh);opacity:0}10%{opacity:0.7}
      90%{opacity:0.7}100%{transform:translateY(-100px);opacity:0}
    }
  `;
  document.head.appendChild(st);
}

const FEATURES = [
  { icon: '📍', label: 'Live Risk Zones' },
  { icon: '🗺', label: 'Safe Routing' },
  { icon: '🏗', label: 'Infrastructure AI' },
  { icon: '🚨', label: 'SOS Alerts' },
  { icon: '👩', label: "Women's Safety" },
  { icon: '🧠', label: 'AI Insights' },
];

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${(i * 7.3) % 100}%`,
  size: `${2 + (i % 3)}px`,
  duration: `${9 + (i % 7)}s`,
  delay: `${(i * 1.3) % 10}s`,
}));

export default function LandingScreen({ onEnter }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <div className="landing-root">
      <div className="landing-mesh" />
      <div className="landing-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      {PARTICLES.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, width: p.size, height: p.size,
          animationDuration: p.duration, animationDelay: p.delay,
        }} />
      ))}
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }] }}>
        <div className="landing-card">
          <div className="logo-ring">
            <span className="logo-emoji">🛡</span>
          </div>
          <div className="landing-title">RakshaSphere</div>
          <div className="landing-tagline">
            AI Platform for Smart Infrastructure Monitoring<br />& Women's Safety
          </div>
          <div className="feature-pills">
            {FEATURES.map(f => (
              <div key={f.label} className="feature-pill">
                <span className="feature-pill-icon">{f.icon}</span>
                <span className="feature-pill-text">{f.label}</span>
              </div>
            ))}
          </div>
          <button className="cta-btn" onClick={onEnter}>
            <span>Launch Dashboard</span>
            <span className="cta-arrow">→</span>
          </button>
          <div className="status-bar">
            <div className="status-dot" />
            <span className="status-text">All systems operational</span>
            <div className="status-divider" />
            <span className="status-text">219 zones · Pan India</span>
            <div className="status-divider" />
            <span className="status-text">99.9% uptime</span>
          </div>
        </div>
      </Animated.View>
    </div>
  );
}
