import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../types/project';
import { ingressBase } from '../api/ingressBase';

interface Props {
  project: Project;
  onSave: (project: Project) => Promise<void>;
  onClose: () => void;
}

type StepStatus = 'idle' | 'running' | 'ok' | 'error';

interface StepState {
  status: StepStatus;
  message: string;
}

const INIT: StepState = { status: 'idle', message: '' };

export function PublishModal({ project, onSave, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dashTitle, setDashTitle] = useState(project.name);
  const [steps, setSteps] = useState<[StepState, StepState, StepState]>([INIT, INIT, INIT]);
  const [dashboardPath, setDashboardPath] = useState('');

  const setStepState = useCallback((i: 0 | 1 | 2, patch: Partial<StepState>) => {
    setSteps((prev) => {
      const next = [...prev] as [StepState, StepState, StepState];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }, []);

  const runStep1 = useCallback(async () => {
    setStepState(0, { status: 'running', message: 'Saving project…' });
    try {
      await onSave(project);
      setStepState(0, { status: 'ok', message: 'Project saved.' });
      setStep(2);
    } catch (e) {
      setStepState(0, { status: 'error', message: `Save failed: ${String(e)}` });
    }
  }, [onSave, project, setStepState]);

  const runStep2 = useCallback(async () => {
    setStepState(1, { status: 'running', message: 'Publishing card bundle…' });
    try {
      const r = await fetch(`${ingressBase}/api/addon/publish-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      setStepState(1, { status: 'ok', message: 'Card bundle published to /config/www/.' });
      setStep(3);
    } catch (e) {
      setStepState(1, { status: 'error', message: String(e) });
    }
  }, [project, setStepState]);

  const runStep3 = useCallback(async () => {
    setStepState(2, { status: 'running', message: 'Creating Lovelace dashboard…' });
    try {
      const r = await fetch(`${ingressBase}/api/addon/create-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          projectName: project.name,
          title: dashTitle,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      setDashboardPath(data.dashboardPath ?? '');
      setStepState(2, { status: 'ok', message: `Dashboard "${dashTitle}" created.` });
    } catch (e) {
      setStepState(2, { status: 'error', message: String(e) });
    }
  }, [project, dashTitle, setStepState]);

  // Auto-advance through steps in sequence
  useEffect(() => {
    if (step === 1 && steps[0].status === 'idle') runStep1();
  }, [step, steps, runStep1]);

  useEffect(() => {
    if (step === 2 && steps[1].status === 'idle') runStep2();
  }, [step, steps, runStep2]);

  const allDone = steps[2].status === 'ok';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-ha-surface border border-ha-border rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <h2 className="text-ha-text font-semibold text-base">Publish to Home Assistant</h2>

        {/* Step list */}
        <ol className="flex flex-col gap-3">
          <StepRow
            num={1}
            label="Save project"
            state={steps[0]}
          />
          <StepRow
            num={2}
            label="Copy card bundle to /config/www/"
            state={steps[1]}
          />
          <StepRow
            num={3}
            label={
              step === 3 && steps[2].status === 'idle' ? (
                <span className="flex items-center gap-2">
                  <span>Create Lovelace dashboard</span>
                  <input
                    className="ml-2 bg-ha-bg border border-ha-border rounded px-2 py-0.5 text-xs text-ha-text w-36 focus:outline-none focus:border-ha-accent"
                    value={dashTitle}
                    onChange={(e) => setDashTitle(e.target.value)}
                    placeholder="Dashboard title"
                    autoFocus
                  />
                </span>
              ) : 'Create Lovelace dashboard'
            }
            state={steps[2]}
          />
        </ol>

        {/* Step 3 action / retry */}
        {step === 3 && steps[2].status === 'idle' && (
          <button
            onClick={runStep3}
            className="bg-ha-accent text-white text-sm px-4 py-2 rounded hover:bg-blue-600 self-end"
          >
            Create dashboard
          </button>
        )}

        {steps[2].status === 'error' && (
          <button
            onClick={runStep3}
            className="bg-red-600 text-white text-sm px-4 py-2 rounded hover:bg-red-700 self-end"
          >
            Retry
          </button>
        )}

        {/* Success footer */}
        {allDone && dashboardPath && (
          <div className="flex items-center gap-3 bg-green-900/30 border border-green-700/50 rounded-lg p-3">
            <span className="text-green-400 text-xs flex-1">
              Dashboard available at <code className="font-mono">{dashboardPath}</code>
            </span>
            <a
              href={dashboardPath}
              target="_blank"
              rel="noreferrer"
              className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded whitespace-nowrap"
            >
              Open
            </a>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-ha-muted text-xs hover:text-ha-text px-3 py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

interface StepRowProps {
  num: number;
  label: React.ReactNode;
  state: StepState;
}

function StepRow({ num, label, state }: StepRowProps) {
  const icon =
    state.status === 'running' ? <Spinner /> :
    state.status === 'ok'      ? <span className="text-green-400">✓</span> :
    state.status === 'error'   ? <span className="text-red-400">✗</span> :
                                 <span className="text-ha-muted">{num}</span>;

  return (
    <li className="flex items-start gap-3">
      <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className={`text-sm ${state.status === 'error' ? 'text-red-400' : 'text-ha-text'}`}>
          {label}
        </span>
        {state.message && (
          <span className={`text-xs ${state.status === 'error' ? 'text-red-400' : 'text-ha-muted'}`}>
            {state.message}
          </span>
        )}
      </div>
    </li>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin text-ha-accent" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
