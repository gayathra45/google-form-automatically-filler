import React from 'react';
import { Zap, Wrench, Bookmark, HelpCircle, Radio } from 'lucide-react';

interface NavbarProps {
  serverConnected: boolean;
  onOpenTools: () => void;
  onOpenPresets: () => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  serverConnected,
  onOpenTools,
  onOpenPresets,
  onOpenHelp
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(7, 9, 19, 0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Zap size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FormAuto
            </h1>
            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: 700 }}>
              PRO v2.0
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Universal Automated Google Forms Engine & Submitter
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Server Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '9999px',
            background: serverConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${serverConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '0.78rem',
            color: serverConnected ? '#6ee7b7' : '#fca5a5'
          }}
        >
          <Radio size={14} className={serverConnected ? 'pulse-glow' : ''} />
          <span>{serverConnected ? 'Backend Active' : 'Connecting Engine...'}</span>
        </div>

        {/* Action Buttons */}
        <button
          onClick={onOpenPresets}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          title="Manage Saved Fill Profiles"
        >
          <Bookmark size={15} />
          <span>Presets</span>
        </button>

        <button
          onClick={onOpenTools}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          title="Bookmarklet & Prefilled Links"
        >
          <Wrench size={15} />
          <span>Tools</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          title="Instructions & FAQ"
        >
          <HelpCircle size={15} />
          <span>Guide</span>
        </button>
      </div>
    </header>
  );
};
