import React from 'react';
import { X, HelpCircle, CheckCircle, Zap, Shield, FileText } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '650px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HelpCircle size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>How FormAuto Works</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div className="glass-card">
            <h4 style={{ color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Zap size={16} color="var(--primary)" /> 1. Real-time Form Dissection
            </h4>
            <p>
              When you enter a Google Form URL, FormAuto inspects the form&apos;s underlying JSON schema (<code style={{ color: '#a5b4fc' }}>FB_PUBLIC_LOAD_DATA_</code>) to extract all question labels, option lists, and official entry parameters (<code style={{ color: '#a5b4fc' }}>entry.XXXXX</code>).
            </p>
          </div>

          <div className="glass-card">
            <h4 style={{ color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <CheckCircle size={16} color="#10b981" /> 2. Smart Field Generators
            </h4>
            <p>
              Assign distinct generation rules to every field:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li><strong>Random Option:</strong> Picks randomly from the Google Form&apos;s available choices.</li>
              <li><strong>Realistic Identity:</strong> Generates plausible names, valid-format emails, phone numbers, and job titles via Faker.</li>
              <li><strong>Fixed Value & Templates:</strong> Use custom text or placeholders like <code style={{ color: '#a5b4fc' }}>{'{index}'}</code> and <code style={{ color: '#a5b4fc' }}>{'{date}'}</code>.</li>
              <li><strong>CSV Dataset:</strong> Bind question fields to columns in a CSV file to submit records in bulk.</li>
            </ul>
          </div>

          <div className="glass-card">
            <h4 style={{ color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Shield size={16} color="#38bdf8" /> 3. High-Speed Submissions with Anti-Throttle
            </h4>
            <p>
              Submissions are executed directly to Google Form&apos;s <code style={{ color: '#a5b4fc' }}>/formResponse</code> endpoint. Configure request delay and random jitter to mimic human spacing and prevent rate limiting.
            </p>
          </div>

          <div className="glass-card">
            <h4 style={{ color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <FileText size={16} color="#f59e0b" /> 4. 1-Click Bookmarklet
            </h4>
            <p>
              Use the Tools menu to grab an instant Bookmarklet link that you can drag to your browser bookmarks bar to fill forms in 1 click right on Google&apos;s page!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
