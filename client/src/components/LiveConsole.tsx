import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronRight,
  ChevronDown,
  Layers
} from 'lucide-react';
import type { LogEntry, BatchStats } from '../types';

interface LiveConsoleProps {
  logs: LogEntry[];
  batchStats: BatchStats;
  onClearLogs: () => void;
}

export const LiveConsole: React.FC<LiveConsoleProps> = ({
  logs,
  batchStats,
  onClearLogs
}) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const progressPercent = batchStats.total > 0
    ? Math.min(100, Math.round((batchStats.current / batchStats.total) * 100))
    : 0;

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `autofill_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <section className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Terminal size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Live Execution & Console</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className="btn-secondary"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              color: autoScroll ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <Download size={13} />
            <span>Export Logs</span>
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Stat Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Progress Bar Container */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '9999px',
            height: '10px',
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '1rem'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #10b981 100%)',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.6)',
              transition: 'width 0.3s ease',
              borderRadius: '9999px'
            }}
          />
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progress</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.15rem' }}>
              {batchStats.current} / {batchStats.total}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>
                ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Successful Submissions</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '0.15rem' }}>
              {batchStats.successful}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Failed Submissions</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ef4444', marginTop: '0.15rem' }}>
              {batchStats.failed}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Latency</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.15rem' }}>
              {batchStats.avgDurationMs > 0 ? `${batchStats.avgDurationMs}ms` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot" style={{ background: '#ef4444' }} />
            <div className="terminal-dot" style={{ background: '#f59e0b' }} />
            <div className="terminal-dot" style={{ background: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={13} color="var(--primary)" />
            <span>Console Stream ({logs.length} events)</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {batchStats.isRunning ? 'Streaming active...' : 'Idle'}
          </span>
        </div>

        <div className="terminal-body">
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <Terminal size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p>No submission events recorded yet.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
                Load a form and click &quot;Submit 1 Test Record&quot; or &quot;Launch Auto-Fill Batch&quot; to begin.
              </p>
            </div>
          ) : (
            logs.map((log, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div
                  key={index}
                  style={{
                    padding: '0.4rem 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                    </span>

                    {log.success ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        <CheckCircle2 size={12} />
                        {log.status || 200} OK
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        <XCircle size={12} />
                        {log.status || 'ERR'}
                      </span>
                    )}

                    <span style={{ color: '#a5b4fc', fontWeight: 600 }}>
                      [#{log.index}/{log.total}]
                    </span>

                    <span style={{ color: '#f8fafc', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.message}
                    </span>

                    <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>
                      {log.durationMs}ms
                    </span>

                    {isExpanded ? (
                      <ChevronDown size={14} color="var(--text-muted)" />
                    ) : (
                      <ChevronRight size={14} color="var(--text-muted)" />
                    )}
                  </div>

                  {/* Expanded Payload Preview */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '0.75rem',
                        color: '#94a3b8'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#c7d2fe', fontWeight: 600 }}>
                        <Layers size={13} />
                        <span>Submitted Form Payload:</span>
                      </div>
                      <pre style={{ margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </section>
  );
};
