import React from 'react';
import type {
  FormQuestion,
  FieldRule,
  RuleMode
} from '../types';
import {
  Sparkles,
  Shuffle,
  User,
  Sliders
} from 'lucide-react';

interface FieldConfiguratorProps {
  questions: FormQuestion[];
  rules: Record<string, FieldRule>;
  onUpdateRule: (questionId: string, rule: Partial<FieldRule>) => void;
  onApplyPresetToAll: (preset: 'random' | 'realistic' | 'reset') => void;
  csvHeaders: string[];
}

export const FieldConfigurator: React.FC<FieldConfiguratorProps> = ({
  questions,
  rules,
  onUpdateRule,
  onApplyPresetToAll,
  csvHeaders
}) => {
  if (questions.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      {/* Header & Global Quick Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-glass)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Form Field Filling Rules</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Configure how each field should be populated during auto-submission
          </p>
        </div>

        {/* Global Preset Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onApplyPresetToAll('random')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            title="Choose random options for all select/choice fields"
          >
            <Shuffle size={14} color="#818cf8" />
            <span>Randomize All Choices</span>
          </button>
          <button
            type="button"
            onClick={() => onApplyPresetToAll('realistic')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            title="Auto-detect name, email, phone and assign realistic Faker generators"
          >
            <User size={14} color="#34d399" />
            <span>Realistic Smart Fill</span>
          </button>
          <button
            type="button"
            onClick={() => onApplyPresetToAll('reset')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', color: 'var(--text-muted)' }}
          >
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Field Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {questions.map((question, index) => {
          const rule = rules[question.id] || { mode: 'random_option' };
          const hasOptions = question.options && question.options.length > 0;

          return (
            <div
              key={question.id}
              className="glass-card"
              style={{
                borderLeft: question.required ? '3px solid #6366f1' : '3px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Question Top Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      #{index + 1}
                    </span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                      {question.title}
                    </h4>
                    {question.required && (
                      <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        Required
                      </span>
                    )}
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      {question.type}
                    </span>
                  </div>
                  {question.helpText && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {question.helpText}
                    </p>
                  )}
                </div>

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {question.id}
                </span>
              </div>

              {/* Mode Selection and Inputs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                  alignItems: 'center'
                }}
              >
                {/* Generation Mode Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Fill Strategy
                  </label>
                  <select
                    className="input-glass"
                    value={rule.mode}
                    onChange={(e) => onUpdateRule(question.id, { mode: e.target.value as RuleMode })}
                  >
                    {hasOptions && (
                      <optgroup label="Option Choices">
                        <option value="random_option">🎲 Random Choice (from form options)</option>
                        <option value="specific_option">🎯 Fixed Selected Choice</option>
                      </optgroup>
                    )}

                    {question.type === 'scale' && (
                      <optgroup label="Linear Scale">
                        <option value="random_option">🎲 Random Rating ({question.scaleMin ?? 1}-{question.scaleMax ?? 5})</option>
                        <option value="scale_rating">⭐ Specific Rating</option>
                      </optgroup>
                    )}

                    <optgroup label="Realistic Identity (Faker)">
                      <option value="faker_full_name">👤 Realistic Full Name</option>
                      <option value="faker_first_name">👤 Realistic First Name</option>
                      <option value="faker_last_name">👤 Realistic Last Name</option>
                      <option value="faker_email">📧 Realistic Email Address</option>
                      <option value="faker_phone">📱 Realistic Phone Number</option>
                      <option value="faker_company">🏢 Realistic Company Name</option>
                      <option value="faker_job">💼 Realistic Job Title</option>
                      <option value="faker_city">🏙️ Realistic City</option>
                      <option value="faker_country">🌍 Realistic Country</option>
                    </optgroup>

                    <optgroup label="Realistic Feedback & Text">
                      <option value="faker_sentence">✍️ Realistic Short Feedback</option>
                      <option value="faker_paragraph">📝 Realistic Detailed Paragraph</option>
                      <option value="faker_date">📅 Realistic Recent Date</option>
                      <option value="faker_time">⏰ Realistic Time (HH:MM)</option>
                    </optgroup>

                    <optgroup label="Custom & Logic">
                      <option value="fixed">📌 Fixed Custom Text</option>
                      <option value="counter">🔢 Auto-Increment Counter</option>
                      <option value="faker_number">🔢 Random Number in Range</option>
                      {csvHeaders.length > 0 && (
                        <option value="csv_column">📁 Map from CSV Column</option>
                      )}
                    </optgroup>
                  </select>
                </div>

                {/* Sub-inputs depending on Mode */}
                <div>
                  {rule.mode === 'specific_option' && hasOptions && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Select Choice
                      </label>
                      <select
                        className="input-glass"
                        value={rule.selectedOption || question.options[0]}
                        onChange={(e) => onUpdateRule(question.id, { selectedOption: e.target.value })}
                      >
                        {question.options.map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {rule.mode === 'fixed' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Fixed Value <span style={{ color: 'var(--text-muted)' }}>(Supports {'{index}'}, {'{date}'})</span>
                      </label>
                      <input
                        type="text"
                        className="input-glass"
                        placeholder="Enter text or template..."
                        value={rule.fixedValue || ''}
                        onChange={(e) => onUpdateRule(question.id, { fixedValue: e.target.value })}
                      />
                    </div>
                  )}

                  {rule.mode === 'counter' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Start Number
                        </label>
                        <input
                          type="number"
                          className="input-glass"
                          value={rule.counterStart ?? 1}
                          onChange={(e) => onUpdateRule(question.id, { counterStart: Number(e.target.value) })}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Prefix (e.g. User-)
                        </label>
                        <input
                          type="text"
                          className="input-glass"
                          placeholder="Prefix"
                          value={rule.counterPrefix || ''}
                          onChange={(e) => onUpdateRule(question.id, { counterPrefix: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {rule.mode === 'scale_rating' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Rating Value ({question.scaleMin ?? 1} to {question.scaleMax ?? 5})
                      </label>
                      <input
                        type="number"
                        min={question.scaleMin ?? 1}
                        max={question.scaleMax ?? 5}
                        className="input-glass"
                        value={rule.scaleValue ?? (question.scaleMin ?? 1)}
                        onChange={(e) => onUpdateRule(question.id, { scaleValue: Number(e.target.value) })}
                      />
                    </div>
                  )}

                  {rule.mode === 'faker_number' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Min
                        </label>
                        <input
                          type="number"
                          className="input-glass"
                          value={rule.numberMin ?? 1}
                          onChange={(e) => onUpdateRule(question.id, { numberMin: Number(e.target.value) })}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Max
                        </label>
                        <input
                          type="number"
                          className="input-glass"
                          value={rule.numberMax ?? 100}
                          onChange={(e) => onUpdateRule(question.id, { numberMax: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

                  {rule.mode === 'csv_column' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        CSV Header Column
                      </label>
                      <select
                        className="input-glass"
                        value={rule.csvColumn || csvHeaders[0] || ''}
                        onChange={(e) => onUpdateRule(question.id, { csvColumn: e.target.value })}
                      >
                        {csvHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* For simple random option or fakers, show quick info */}
                  {['random_option', 'faker_full_name', 'faker_email', 'faker_phone', 'faker_company', 'faker_sentence', 'faker_paragraph', 'faker_date', 'faker_time'].includes(rule.mode) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0.5rem 0' }}>
                      <Sparkles size={14} color="#818cf8" />
                      <span>Dynamically generated per submission</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Options list preview if available */}
              {hasOptions && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {question.options.map((opt, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.73rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      • {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
