import React, { useRef } from 'react';
import {
  Play,
  Zap,
  Square,
  Upload,
  FileSpreadsheet,
  Clock,
  Shuffle,
  ShieldCheck
} from 'lucide-react';
import type { BatchStats } from '../types';

interface BatchControlsProps {
  count: number;
  setCount: (n: number) => void;
  delayMs: number;
  setDelayMs: (n: number) => void;
  jitterMs: number;
  setJitterMs: (n: number) => void;
  batchStats: BatchStats;
  onStartBatch: () => void;
  onAbortBatch: () => void;
  onSingleSubmit: () => void;
  onUploadCsv: (file: File) => void;
  csvFileName: string | null;
  csvRowCount: number;
  onClearCsv: () => void;
  hasForm: boolean;
}

export const BatchControls: React.FC<BatchControlsProps> = ({
  count,
  setCount,
  delayMs,
  setDelayMs,
  jitterMs,
  setJitterMs,
  batchStats,
  onStartBatch,
  onAbortBatch,
  onSingleSubmit,
  onUploadCsv,
  csvFileName,
  csvRowCount,
  onClearCsv,
  hasForm
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCsv(file);
    }
  };

  return (
    <section className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Submission & Batch Runner</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Configure submission limits, delay throttling, or upload bulk CSV dataset
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-success">
            <ShieldCheck size={12} /> Direct Form Engine
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Count Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Submission Count
          </label>
          <input
            type="number"
            min={1}
            max={1000}
            disabled={batchStats.isRunning || Boolean(csvFileName)}
            value={csvFileName ? csvRowCount : count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="input-glass"
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
            {csvFileName ? `Bound to CSV (${csvRowCount} rows)` : 'Total submissions to perform'}
          </span>
        </div>

        {/* Delay Input */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            <Clock size={14} /> Delay between Requests (ms)
          </label>
          <input
            type="number"
            min={100}
            step={100}
            max={60000}
            disabled={batchStats.isRunning}
            value={delayMs}
            onChange={(e) => setDelayMs(Math.max(100, parseInt(e.target.value) || 100))}
            className="input-glass"
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
            E.g. 1000ms = 1 sec (recommended for stability)
          </span>
        </div>

        {/* Jitter Input */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            <Shuffle size={14} /> Human Jitter / Random Delay (±ms)
          </label>
          <input
            type="number"
            min={0}
            step={50}
            max={5000}
            disabled={batchStats.isRunning}
            value={jitterMs}
            onChange={(e) => setJitterMs(Math.max(0, parseInt(e.target.value) || 0))}
            className="input-glass"
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
            Adds human-like variance to intervals
          </span>
        </div>

        {/* CSV Upload Area */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Bulk Dataset (CSV)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {csvFileName ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <FileSpreadsheet size={16} color="#34d399" />
                <span style={{ fontSize: '0.8rem', color: '#6ee7b7', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {csvFileName} ({csvRowCount} rows)
                </span>
              </div>
              <button
                type="button"
                onClick={onClearCsv}
                disabled={batchStats.isRunning}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fca5a5',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={batchStats.isRunning}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
            >
              <Upload size={15} />
              <span>Upload CSV Dataset</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
        <button
          type="button"
          onClick={onSingleSubmit}
          disabled={!hasForm || batchStats.isRunning}
          className="btn-secondary"
          style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem' }}
        >
          <Zap size={18} color="#818cf8" />
          <span>Submit 1 Test Record</span>
        </button>

        {!batchStats.isRunning ? (
          <button
            type="button"
            onClick={onStartBatch}
            disabled={!hasForm}
            className="btn-primary"
            style={{ padding: '0.85rem 2rem', fontSize: '1rem', flex: 1, minWidth: '220px' }}
          >
            <Play size={18} />
            <span>
              {csvFileName
                ? `Execute CSV Batch (${csvRowCount} Rows)`
                : `Launch Auto-Fill Batch (${count}x)`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onAbortBatch}
            className="btn-danger"
            style={{ padding: '0.85rem 2rem', fontSize: '1rem', flex: 1, minWidth: '220px' }}
          >
            <Square size={18} />
            <span>Stop / Abort Batch Execution</span>
          </button>
        )}
      </div>
    </section>
  );
};
