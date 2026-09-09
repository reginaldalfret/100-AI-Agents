import React, { useState } from 'react';
import { FineTuningJob } from '../../types';

const INITIAL_JOBS: FineTuningJob[] = [
  {
    id: 'ft-job-001',
    name: 'Nemotron-Nano-Institutional-SOP-LoRA',
    baseModel: 'nemotron-3-nano',
    dataset: 'institutional_sop_corpus.jsonl',
    method: 'QLoRA',
    epochs: 3,
    learningRate: '2e-4',
    batchSize: 2,
    status: 'completed',
    progress: 100,
    loss: 0.284,
    createdAt: 'Yesterday, 14:20'
  },
  {
    id: 'ft-job-002',
    name: 'Qwen-Coder-Security-Auditor-Adaptation',
    baseModel: 'qwen2.5-coder:1.5b',
    dataset: 'cve_remediation_pairs.jsonl',
    method: 'LoRA',
    epochs: 4,
    learningRate: '1.5e-4',
    batchSize: 1,
    status: 'running',
    progress: 68,
    loss: 0.342,
    createdAt: 'Today, 10:15'
  }
];

export const FineTuningFactory: React.FC = () => {
  const [jobs, setJobs] = useState<FineTuningJob[]>(INITIAL_JOBS);
  const [jobName, setJobName] = useState('My-Custom-Agent-Adaptation');
  const [baseModel, setBaseModel] = useState('nemotron-3-nano');
  const [dataset, setDataset] = useState('institutional_sop_corpus.jsonl');
  const [method, setMethod] = useState<'LoRA' | 'QLoRA'>('QLoRA');
  const [epochs, setEpochs] = useState(3);
  const [learningRate, setLearningRate] = useState('2e-4');
  const [batchSize, setBatchSize] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newJob: FineTuningJob = {
      id: `ft-job-${Date.now().toString().slice(-4)}`,
      name: jobName,
      baseModel,
      dataset,
      method,
      epochs,
      learningRate,
      batchSize,
      status: 'running',
      progress: 5,
      loss: 0.892,
      createdAt: 'Just now'
    };

    try {
      await fetch('/api/finetuning/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      });
    } catch {
      // Local fallback
    }

    setJobs([newJob, ...jobs]);
    setIsSubmitting(false);
  };

  return (
    <div id="finetuningView" className="view-panel" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Hardware Constraints */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚙️</span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Fine-Tuning Factory
            </h1>
            <span
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#c084fc',
                fontWeight: 700
              }}
            >
              LORA & QLORA
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Train, quantize, and package specialized adapter weights directly onto local hardware.
          </p>
        </div>

        {/* Hardware Status Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fbbf24',
            fontSize: '11.5px',
            fontWeight: 600
          }}
        >
          <span>⚡ GPU: NVIDIA RTX 2050 (4GB VRAM)</span>
          <span style={{ color: 'var(--text-tertiary)' }}>•</span>
          <span style={{ color: 'var(--neon-green)' }}>Sequential Safety Gate Active</span>
        </div>
      </header>

      {/* Main 2-Column Grid (Configuration + Jobs Queue) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: Configuration Form */}
        <section
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'var(--glass-card)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Configure New Fine-Tuning Job
          </h2>

          <form onSubmit={handleStartTraining} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Job Name */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                JOB NAME / ADAPTER IDENTIFIER
              </label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '36px',
                  background: 'var(--glass-input)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '0 10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Base Model */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                BASE MODEL (LOCAL)
              </label>
              <select
                value={baseModel}
                onChange={(e) => setBaseModel(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  background: 'rgba(10, 15, 36, 0.95)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '0 10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              >
                <option value="nemotron-3-nano">nemotron-3-nano (3.5B · Recommended)</option>
                <option value="qwen2.5-coder:1.5b">qwen2.5-coder:1.5b (1.5B · Code Specialist)</option>
                <option value="llama3.2:1b">llama3.2:1b (1.0B · Ultra-Lightweight)</option>
                <option value="gemma3:1b">gemma3:1b (1.0B · Multimodal)</option>
              </select>
            </div>

            {/* Dataset Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                TRAINING DATASET
              </label>
              <select
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  background: 'rgba(10, 15, 36, 0.95)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '0 10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              >
                <option value="institutional_sop_corpus.jsonl">institutional_sop_corpus.jsonl (14,200 pairs)</option>
                <option value="cve_remediation_pairs.jsonl">cve_remediation_pairs.jsonl (8,500 pairs)</option>
                <option value="academic_records_qa.jsonl">academic_records_qa.jsonl (6,100 pairs)</option>
              </select>
            </div>

            {/* Adaptation Method */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  METHOD
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: 'rgba(10, 15, 36, 0.95)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '0 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                >
                  <option value="QLoRA">QLoRA (4-bit · Best for 4GB VRAM)</option>
                  <option value="LoRA">LoRA (16-bit)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  EPOCHS
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: 'var(--glass-input)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '0 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Hyperparameters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  LEARNING RATE
                </label>
                <input
                  type="text"
                  value={learningRate}
                  onChange={(e) => setLearningRate(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: 'var(--glass-input)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '0 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  BATCH SIZE
                </label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: 'var(--glass-input)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '0 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '8px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(6, 182, 212, 0.8))',
                border: '1px solid var(--neon-cyan)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 18px rgba(168, 85, 247, 0.4)'
              }}
            >
              {isSubmitting ? 'Queueing Training Job...' : '🚀 Launch Fine-Tuning Job'}
            </button>
          </form>
        </section>

        {/* Right: Active Jobs Queue & Evaluation */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Training Jobs Queue ({jobs.length})
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Live Loss Tracking & Checkpoints</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'var(--glass-card)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{job.name}</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      Base: <strong style={{ color: 'var(--neon-cyan)' }}>{job.baseModel}</strong> • {job.method} • {job.dataset}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: job.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      border: job.status === 'completed' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                      color: job.status === 'completed' ? 'var(--neon-green)' : 'var(--neon-amber)'
                    }}
                  >
                    {job.status.toUpperCase()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                    <span>Progress: {job.progress}%</span>
                    <span>Loss: {job.loss.toFixed(3)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${job.progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  <span>Created {job.createdAt}</span>
                  {job.status === 'completed' && (
                    <button
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        color: 'var(--neon-cyan)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Export GGUF / Register Model
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
