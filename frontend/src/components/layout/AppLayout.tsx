import React from "react";
import { useExecutionStore } from "../../store/executionStore";
import CodeEditor from "../editor/CodeEditor";
import VariablesPanel from "../visualization/VariablesPanel";
import CallStackPanel from "../visualization/CallStackPanel";
import OutputConsole from "../visualization/OutputConsole";
import StepInfo from "../visualization/StepInfo";
import PlaybackControls from "../controls/PlaybackControls";

const AppLayout: React.FC = () => {
  const { currentSnapshot, currentStep, totalSteps, error } = useExecutionStore();

  const highlightLine = currentSnapshot?.line ?? null;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
            <rect width="32" height="32" rx="8" fill="#7c3aed" />
            <path d="M8 10h4v12H8zM13 16l7-6v12l-7-6z" fill="white" />
          </svg>
          <span className="font-bold text-sm tracking-tight">
            Py<span className="text-violet-400">Visualizer</span>
          </span>
        </div>

        <div className="h-5 w-px bg-zinc-800 ml-2" />

        <span className="text-xs text-zinc-500">
          Step-by-step Python execution explorer
        </span>

        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-600">
          <a
            href="https://github.com"
            className="hover:text-zinc-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="/docs"
            className="hover:text-zinc-400 transition-colors"
          >
            Docs
          </a>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: code editor */}
        <div className="flex flex-col w-1/2 border-r border-zinc-800 min-h-0">
          <div className="flex-1 min-h-0">
            <CodeEditor highlightLine={highlightLine} />
          </div>
        </div>

        {/* Right: visualization panels */}
        <div className="flex flex-col w-1/2 min-h-0">
          {/* Step info bar */}
          {currentSnapshot && (
            <div className="px-3 pt-3 pb-1 shrink-0">
              <StepInfo
                snapshot={currentSnapshot}
                currentStep={currentStep}
                totalSteps={totalSteps}
              />
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mx-3 mt-2 px-4 py-2.5 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300 text-xs font-mono shrink-0">
              {error}
            </div>
          )}

          {/* Panel grid */}
          <div className="flex flex-1 min-h-0 flex-col gap-0">
            {/* Top: variables + call stack */}
            <div className="flex flex-1 min-h-0 border-b border-zinc-800">
              {/* Variables */}
              <div className="flex-1 min-h-0 border-r border-zinc-800 overflow-hidden">
                <VariablesPanel snapshot={currentSnapshot} />
              </div>

              {/* Call stack */}
              <div className="w-64 shrink-0 overflow-hidden">
                <CallStackPanel snapshot={currentSnapshot} />
              </div>
            </div>

            {/* Bottom: output console */}
            <div className="h-40 shrink-0 overflow-hidden">
              <OutputConsole snapshot={currentSnapshot} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <PlaybackControls />
    </div>
  );
};

export default AppLayout;