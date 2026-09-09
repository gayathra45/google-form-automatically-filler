import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Bookmark,
  Code,
  Sparkles,
  Link
} from 'lucide-react';
import type { FormInfo, FieldRule } from '../types';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formInfo: FormInfo | null;
  rules: Record<string, FieldRule>;
}

export const ToolsModal: React.FC<ToolsModalProps> = ({
  isOpen,
  onClose,
  formInfo,
  rules
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate Bookmarklet Script
  let bookmarkletCode = '';
  let prefilledUrl = '';

  if (formInfo) {
    // Generate pre-filled URL query
    const params = new URLSearchParams();
    for (const q of formInfo.questions) {
      const rule = rules[q.id];
      if (rule && rule.mode === 'fixed' && rule.fixedValue) {
        params.append(q.id, rule.fixedValue);
      } else if (rule && rule.mode === 'specific_option' && rule.selectedOption) {
        params.append(q.id, rule.selectedOption);
      } else if (q.options && q.options.length > 0) {
        params.append(q.id, q.options[0]);
      }
    }
    prefilledUrl = `${formInfo.url.replace(/\/edit.*$/, '/viewform')}?usp=pp_url&${params.toString()}`;

    // Generate lightweight in-browser bookmarklet snippet
    const jsScript = `javascript:(function(){
      const q = ${JSON.stringify(formInfo.questions.map(q => ({ id: q.id, type: q.type, options: q.options })))};
      let count = 0;
      q.forEach(item => {
        if(item.type === 'radio' || item.type === 'dropdown') {
          const opt = document.querySelector(\`div[role="radio"], div[role="option"]\`);
          if(opt) { opt.click(); count++; }
        } else {
          const el = document.querySelector(\`input[name="\${item.id}"], textarea[name="\${item.id}"]\`);
          if(el) {
            el.value = "AutoFilled";
            el.dispatchEvent(new Event('input', {bubbles:true}));
            count++;
          }
        }
      });
      alert('FormAuto: Filled ' + count + ' fields!');
    })();`;
    bookmarkletCode = jsScript.replace(/\s+/g, ' ');
  }

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
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Power Tools & Integrations</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {!formInfo ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <p>Please load and inspect a Google Form first to generate prefilled links and bookmarklets.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 1-Click Bookmarklet */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Bookmark size={18} color="#818cf8" />
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>1-Click Browser Bookmarklet</h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Drag the button below to your Bookmarks bar. Whenever you open this Google Form in Chrome, Edge, or Firefox, simply click the bookmark to instantly fill all fields in 1 second!
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <a
                  href={bookmarkletCode}
                  onClick={(e) => e.preventDefault()}
                  draggable
                  className="btn-primary"
                  style={{
                    cursor: 'grab',
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.85rem',
                    textDecoration: 'none'
                  }}
                >
                  <Bookmark size={15} />
                  <span>⚡ Drag me to Bookmarks Bar</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(bookmarkletCode, 'bookmarklet')}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {copiedKey === 'bookmarklet' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedKey === 'bookmarklet' ? 'Copied Snippet!' : 'Copy JavaScript Code'}</span>
                </button>
              </div>
            </div>

            {/* Pre-Filled URL */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Link size={18} color="#34d399" />
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Official Google Form Pre-Filled Link</h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Direct URL containing the query parameters for pre-populated values.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={prefilledUrl}
                  className="input-glass"
                  style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  onClick={() => handleCopy(prefilledUrl, 'prefilled')}
                  className="btn-secondary"
                  style={{ flexShrink: 0 }}
                >
                  {copiedKey === 'prefilled' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
                <a
                  href={prefilledUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Direct Form Response URL */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Code size={18} color="#38bdf8" />
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Backend Response Endpoint</h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                The exact Google Forms HTTP POST destination used by our high-speed direct submission engine.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={formInfo.responseUrl}
                  className="input-glass"
                  style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  onClick={() => handleCopy(formInfo.responseUrl, 'responseUrl')}
                  className="btn-secondary"
                  style={{ flexShrink: 0 }}
                >
                  {copiedKey === 'responseUrl' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
