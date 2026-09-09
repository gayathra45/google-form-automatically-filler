import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { FormUrlHero } from './components/FormUrlHero';
import { FieldConfigurator } from './components/FieldConfigurator';
import { BatchControls } from './components/BatchControls';
import { LiveConsole } from './components/LiveConsole';
import { ToolsModal } from './components/ToolsModal';
import { PresetManagerModal } from './components/PresetManagerModal';
import { HelpModal } from './components/HelpModal';
import type { FormInfo, FieldRule, LogEntry, BatchStats } from './types';

const API_BASE = 'http://localhost:5000/api';

// Intelligent default rule assigner based on question title and type
function assignSmartDefaultRule(title: string, type: string, options: string[]): FieldRule {
  const t = title.toLowerCase();

  if (type === 'scale') {
    return { mode: 'random_option' };
  }

  if (type === 'radio' || type === 'dropdown' || type === 'checkbox') {
    return { mode: 'random_option', maxCheckboxPicks: 2 };
  }

  if (t.includes('email') || t.includes('e-mail') || t.includes('mail')) {
    return { mode: 'faker_email' };
  }
  if (t.includes('phone') || t.includes('mobile') || t.includes('contact') || t.includes('tel')) {
    return { mode: 'faker_phone' };
  }
  if (t.includes('full name') || t.includes('your name') || t.includes('applicant name') || (t.includes('name') && !t.includes('company'))) {
    return { mode: 'faker_full_name' };
  }
  if (t.includes('first name')) {
    return { mode: 'faker_first_name' };
  }
  if (t.includes('last name') || t.includes('surname')) {
    return { mode: 'faker_last_name' };
  }
  if (t.includes('company') || t.includes('organization') || t.includes('business')) {
    return { mode: 'faker_company' };
  }
  if (t.includes('job') || t.includes('title') || t.includes('role') || t.includes('position') || t.includes('designation')) {
    return { mode: 'faker_job' };
  }
  if (t.includes('city') || t.includes('location') || t.includes('state') || t.includes('address')) {
    return { mode: 'faker_city' };
  }
  if (t.includes('country') || t.includes('nation')) {
    return { mode: 'faker_country' };
  }
  if (t.includes('feedback') || t.includes('comment') || t.includes('suggestion') || t.includes('message') || t.includes('review') || type === 'paragraph') {
    return { mode: 'faker_paragraph' };
  }
  if (type === 'date' || t.includes('date') || t.includes('dob')) {
    return { mode: 'faker_date' };
  }
  if (type === 'time' || t.includes('time')) {
    return { mode: 'faker_time' };
  }
  if (t.includes('age') || t.includes('number') || t.includes('quantity') || t.includes('score')) {
    return { mode: 'faker_number', numberMin: 18, numberMax: 65 };
  }

  return { mode: options.length > 0 ? 'random_option' : 'faker_sentence' };
}

export const App: React.FC = () => {
  const [serverConnected, setServerConnected] = useState(false);
  const [formInfo, setFormInfo] = useState<FormInfo | null>(null);
  const [rules, setRules] = useState<Record<string, FieldRule>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Batch Submission Parameters
  const [count, setCount] = useState<number>(5);
  const [delayMs, setDelayMs] = useState<number>(1000);
  const [jitterMs, setJitterMs] = useState<number>(200);

  // CSV State
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, any>[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);

  // Live Console & Stats
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [batchStats, setBatchStats] = useState<BatchStats>({
    total: 0,
    current: 0,
    successful: 0,
    failed: 0,
    isRunning: false,
    avgDurationMs: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  // Modals
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Health check on mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
        if (res.data?.status === 'ok') {
          setServerConnected(true);
        }
      } catch (err) {
        setServerConnected(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  // Parse Form Handler
  const handleParseForm = async (url: string) => {
    setIsLoading(true);
    setParseError(null);

    try {
      const res = await axios.post(`${API_BASE}/parse`, { url });
      if (res.data?.success && res.data.form) {
        const parsedForm: FormInfo = res.data.form;
        setFormInfo(parsedForm);

        // Build default rules map
        const initialRules: Record<string, FieldRule> = {};
        parsedForm.questions.forEach((q) => {
          initialRules[q.id] = assignSmartDefaultRule(q.title, q.type, q.options);
        });
        setRules(initialRules);
      } else {
        setParseError(res.data?.error || 'Failed to inspect form');
      }
    } catch (err: any) {
      setParseError(err.response?.data?.error || err.message || 'Error connecting to form parser');
    } finally {
      setIsLoading(false);
    }
  };

  // Update a single rule
  const handleUpdateRule = (questionId: string, updatedRule: Partial<FieldRule>) => {
    setRules((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { mode: 'random_option' }),
        ...updatedRule
      }
    }));
  };

  // Bulk presets for all fields
  const handleApplyPresetToAll = (preset: 'random' | 'realistic' | 'reset') => {
    if (!formInfo) return;

    const updated: Record<string, FieldRule> = {};
    formInfo.questions.forEach((q) => {
      if (preset === 'random') {
        updated[q.id] = {
          mode: q.options?.length > 0 ? 'random_option' : 'faker_sentence',
          maxCheckboxPicks: 2
        };
      } else if (preset === 'realistic') {
        updated[q.id] = assignSmartDefaultRule(q.title, q.type, q.options);
      } else {
        updated[q.id] = { mode: 'random_option' };
      }
    });

    setRules(updated);
  };

  // Single Submission Test
  const handleSingleSubmit = async () => {
    if (!formInfo) return;

    const testIndex = logs.length + 1;

    try {
      const res = await axios.post(`${API_BASE}/submit-single`, {
        formInfo,
        rulesMap: rules,
        index: testIndex,
        csvRow: csvRows.length > 0 ? csvRows[0] : null
      });

      const entry: LogEntry = {
        index: testIndex,
        total: testIndex,
        success: res.data.success,
        status: res.data.status,
        durationMs: res.data.durationMs,
        payload: res.data.payload,
        message: res.data.message || (res.data.success ? 'Submitted successfully' : 'Failed'),
        timestamp: res.data.timestamp || new Date().toISOString()
      };

      setLogs((prev) => [...prev, entry]);

      if (res.data.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.85 }
        });
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          index: testIndex,
          total: testIndex,
          success: false,
          status: err.response?.status || 500,
          durationMs: 0,
          payload: {},
          message: err.message || 'Request failed',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  // Batch Auto-Submit via Server-Sent Events (SSE)
  const handleStartBatch = async () => {
    if (!formInfo) return;

    const totalToRun = csvRows.length > 0 ? csvRows.length : count;
    setBatchStats({
      total: totalToRun,
      current: 0,
      successful: 0,
      failed: 0,
      isRunning: true,
      avgDurationMs: 0
    });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/batch-submit-sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formInfo,
          rulesMap: rules,
          count: totalToRun,
          delayMs,
          jitterMs,
          csvRows: csvRows.length > 0 ? csvRows : null
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalDuration = 0;
      let completedCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          const lines = eventStr.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.replace('data: ', '').trim();
            }
          }

          if (eventData) {
            try {
              const data = JSON.parse(eventData);

              if (eventType === 'init') {
                currentJobIdRef.current = data.jobId;
              } else if (eventType === 'completed_one') {
                completedCount++;
                totalDuration += data.result.durationMs || 0;
                const avg = Math.round(totalDuration / completedCount);

                setBatchStats((prev) => ({
                  ...prev,
                  current: data.index,
                  total: data.total,
                  successful: data.successful,
                  failed: data.failed,
                  avgDurationMs: avg
                }));

                setLogs((prev) => [...prev, data.result]);
              } else if (eventType === 'finished') {
                setBatchStats((prev) => ({ ...prev, isRunning: false }));
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              } else if (eventType === 'aborted') {
                setBatchStats((prev) => ({ ...prev, isRunning: false }));
              }
            } catch (parseErr) {
              console.error('Error parsing SSE event data', parseErr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Batch stream error:', err);
      }
    } finally {
      setBatchStats((prev) => ({ ...prev, isRunning: false }));
      abortControllerRef.current = null;
    }
  };

  // Abort Batch Runner
  const handleAbortBatch = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (currentJobIdRef.current) {
      try {
        await axios.post(`${API_BASE}/abort-batch`, { jobId: currentJobIdRef.current });
      } catch (e) {
        console.error('Failed to notify abort', e);
      }
    }
    setBatchStats((prev) => ({ ...prev, isRunning: false }));
  };

  // Upload and Parse CSV
  const handleUploadCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      try {
        const res = await axios.post(`${API_BASE}/parse-csv`, { csvContent: content });
        if (res.data?.success) {
          setCsvHeaders(res.data.headers);
          setCsvRows(res.data.records);
          setCsvFileName(file.name);

          // Auto-map matching columns to form questions
          if (formInfo) {
            setRules((prev) => {
              const updated = { ...prev };
              formInfo.questions.forEach((q) => {
                const cleanTitle = q.title.toLowerCase().trim();
                const matchedHeader = res.data.headers.find(
                  (h: string) => cleanTitle.includes(h.toLowerCase()) || h.toLowerCase().includes(cleanTitle)
                );
                if (matchedHeader) {
                  updated[q.id] = {
                    mode: 'csv_column',
                    csvColumn: matchedHeader
                  };
                }
              });
              return updated;
            });
          }
        }
      } catch (err: any) {
        alert('Failed to parse CSV: ' + (err.response?.data?.error || err.message));
      }
    };
    reader.readAsText(file);
  };

  const handleClearCsv = () => {
    setCsvHeaders([]);
    setCsvRows([]);
    setCsvFileName(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        serverConnected={serverConnected}
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Step 1: Form URL Input & Inspect */}
        <FormUrlHero
          onParseForm={handleParseForm}
          formInfo={formInfo}
          isLoading={isLoading}
          error={parseError}
          onOpenTools={() => setIsToolsOpen(true)}
        />

        {formInfo && (
          <>
            {/* Step 2: Interactive Field Filling Rules Configurator */}
            <FieldConfigurator
              questions={formInfo.questions}
              rules={rules}
              onUpdateRule={handleUpdateRule}
              onApplyPresetToAll={handleApplyPresetToAll}
              csvHeaders={csvHeaders}
            />

            {/* Step 3: Batch Runner & Throttling Controls */}
            <BatchControls
              count={count}
              setCount={setCount}
              delayMs={delayMs}
              setDelayMs={setDelayMs}
              jitterMs={jitterMs}
              setJitterMs={setJitterMs}
              batchStats={batchStats}
              onStartBatch={handleStartBatch}
              onAbortBatch={handleAbortBatch}
              onSingleSubmit={handleSingleSubmit}
              onUploadCsv={handleUploadCsv}
              csvFileName={csvFileName}
              csvRowCount={csvRows.length}
              onClearCsv={handleClearCsv}
              hasForm={Boolean(formInfo)}
            />
          </>
        )}

        {/* Step 4: Live Execution Terminal & Progress Monitoring */}
        <LiveConsole
          logs={logs}
          batchStats={batchStats}
          onClearLogs={() => setLogs([])}
        />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '1.25rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <span>FormAuto Pro • Universal Google Form Automated Submitter & Engine</span>
      </footer>

      {/* Modals */}
      <ToolsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        formInfo={formInfo}
        rules={rules}
      />

      <PresetManagerModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        currentForm={formInfo}
        currentRules={rules}
        onLoadPreset={(url, loadedRules) => {
          handleParseForm(url).then(() => {
            setRules(loadedRules);
          });
        }}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
export default App;
