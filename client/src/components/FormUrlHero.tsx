import React, { useState } from 'react';
import { Search, Globe, Sparkles, CheckCircle, AlertTriangle, ExternalLink, RefreshCw, Lock, Bookmark } from 'lucide-react';
import type { FormInfo } from '../types';

interface FormUrlHeroProps {
  onParseForm: (url: string) => Promise<void>;
  formInfo: FormInfo | null;
  isLoading: boolean;
  error: string | null;
  onOpenTools?: () => void;
}

const SAMPLE_FORMS = [
  {
    name: 'Customer Feedback Form',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdc2j0G5Wz8aE5-fK69wL7m1R6oN8k3v_sample1/viewform',
    desc: 'Name, Email, Rating, Multiple Choice Feedback'
  },
  {
    name: 'Event Registration Form',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLScX9_Sample_Event_Reg_2026/viewform',
    desc: 'Attendee Details, Sessions, Dates & Preferences'
  }
];

export const FormUrlHero: React.FC<FormUrlHeroProps> = ({
  onParseForm,
  formInfo,
  isLoading,
  error,
  onOpenTools
}) => {
  const [urlInput, setUrlInput] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
      }
    } catch (err) {
      console.error('Clipboard access not granted');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onParseForm(urlInput.trim());
    }
  };

  return (
    <section className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: '0.8rem',
            color: '#c7d2fe',
            marginBottom: '1rem'
          }}
        >
          <Sparkles size={14} color="#818cf8" />
          <span>Universal Parser: Compatible with any public Google Form</span>
        </div>

        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>
          Inspect & Automate Any Google Form
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Paste your Google Form link below. Our engine will dissect all questions, fields, and entry IDs,
          allowing you to configure custom filling rules and run single or bulk auto-submissions.
        </p>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(8, 12, 24, 0.9)',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '14px',
              padding: '0.4rem 0.5rem 0.4rem 1.25rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              transition: 'border-color 0.2s ease'
            }}
          >
            <Globe size={20} color="var(--primary)" style={{ flexShrink: 0, marginRight: '0.75rem' }} />
            <input
              type="text"
              placeholder="Paste Google Form URL (e.g. https://docs.google.com/forms/d/e/.../viewform or forms.gle/...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.95rem',
                outline: 'none',
                width: '100%',
                padding: '0.5rem 0'
              }}
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              className="btn-secondary"
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
            >
              Paste
            </button>
            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', flexShrink: 0 }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Inspect Form</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Google Form buttons for quick test */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quick Examples:</span>
          {SAMPLE_FORMS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrlInput(sample.url);
                onParseForm(sample.url);
              }}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: '8px' }}
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Form Details Box when loaded */}
      {formInfo && (
        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-glass)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: formInfo.requiresSignIn ? '1rem' : 0
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <CheckCircle size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  {formInfo.title || 'Untitled Google Form'}
                </h3>
                <a
                  href={formInfo.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
                  title="Open original form in new tab"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              {formInfo.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '700px' }}>
                  {formInfo.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="badge badge-primary">
                <span>{formInfo.questionCount} Total Questions</span>
              </div>
              <div className="badge badge-warning">
                <span>{formInfo.questions.filter(q => q.required).length} Required</span>
              </div>
              {formInfo.requiresSignIn ? (
                <div className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Lock size={12} />
                  <span>Google Sign-In Protected</span>
                </div>
              ) : (
                <div className="badge badge-success">
                  <span>Public & Open</span>
                </div>
              )}
            </div>
          </div>

          {/* Sign-in notice banner if protected */}
          {formInfo.requiresSignIn && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fef3c7',
                fontSize: '0.85rem',
                marginTop: '0.75rem',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flex: 1 }}>
                <Lock size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Form Requires Google Sign-In:</strong> Google blocks anonymous bots on this form.
                  <br />
                  <span style={{ color: '#fde68a', fontSize: '0.8rem' }}>
                    💡 <strong>To submit automatically:</strong> Either turn off <em>&quot;Limit to 1 response&quot;</em> in Google Form Settings, OR use our <strong>1-Click Bookmarklet</strong> right in your logged-in browser tab!
                  </span>
                </div>
              </div>

              {onOpenTools && (
                <button
                  type="button"
                  onClick={onOpenTools}
                  className="btn-primary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', flexShrink: 0 }}
                >
                  <Bookmark size={14} />
                  <span>Get 1-Click Bookmarklet</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
