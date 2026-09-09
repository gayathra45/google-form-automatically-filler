import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  Plus,
  Trash2,
  Upload,
  Download,
  FolderOpen
} from 'lucide-react';
import type { FormInfo, FieldRule } from '../types';

interface PresetItem {
  id: string;
  name: string;
  formUrl: string;
  rules: Record<string, FieldRule>;
  createdAt: string;
}

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentForm: FormInfo | null;
  currentRules: Record<string, FieldRule>;
  onLoadPreset: (formUrl: string, rules: Record<string, FieldRule>) => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  currentForm,
  currentRules,
  onLoadPreset
}) => {
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('formauto_presets');
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load presets from localStorage', e);
    }
  }, [isOpen]);

  const saveToStorage = (updated: PresetItem[]) => {
    setPresets(updated);
    localStorage.setItem('formauto_presets', JSON.stringify(updated));
  };

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || !currentForm) return;

    const newPreset: PresetItem = {
      id: `preset_${Date.now()}`,
      name: newPresetName.trim(),
      formUrl: currentForm.url,
      rules: currentRules,
      createdAt: new Date().toISOString()
    };

    const updated = [newPreset, ...presets];
    saveToStorage(updated);
    setNewPresetName('');
  };

  const handleDelete = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    saveToStorage(updated);
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(presets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'formauto_presets.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          saveToStorage([...imported, ...presets]);
        }
      } catch (err) {
        alert('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  };

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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bookmark size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Saved Form Profiles</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Save Current Config Section */}
        {currentForm && (
          <form onSubmit={handleCreatePreset} style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Save current form & rule settings as a new profile
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Profile Name (e.g. Customer Survey Preset)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="input-glass"
              />
              <button
                type="submit"
                disabled={!newPresetName.trim()}
                className="btn-primary"
                style={{ flexShrink: 0, padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                <span>Save</span>
              </button>
            </div>
          </form>
        )}

        {/* List of Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {presets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <p>No saved profiles yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Load any Google Form, configure your filling rules, and save it here for 1-click re-use.
              </p>
            </div>
          ) : (
            presets.map((preset) => (
              <div
                key={preset.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1rem'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                    {preset.name}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {preset.formUrl}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Saved on {new Date(preset.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadPreset(preset.formUrl, preset.rules);
                      onClose();
                    }}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    <FolderOpen size={14} />
                    <span>Load</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(preset.id)}
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.65rem', color: '#f87171' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Import / Export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
          <label className="btn-secondary" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
            <Upload size={14} />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={presets.length === 0}
            className="btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            <Download size={14} />
            <span>Export All Profiles</span>
          </button>
        </div>
      </div>
    </div>
  );
};
