import React from "react";
import { Snapshot } from "../../types/execution";

interface Props {
  snapshot: Snapshot | null;
  currentStep: number;
  totalSteps: number;
}

const EVENT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  line: { label: "Executing", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/30" },
  return: { label: "Return", color: "text-sky-300", bg: "bg-sky-500/10 border-sky-500/30" },
  exception: { label: "Exception", color: "text-red-300", bg: "bg-red-500/10 border-red-500/30" },
};

const StepInfo: React.FC<Props> = ({ snapshot, currentStep, totalSteps }) => {
  if (!snapshot) return null;

  const style = EVENT_STYLES[snapshot.event] ?? EVENT_STYLES.line;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border rounded-lg ${style.bg} border-zinc-700`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${style.color} border ${style.bg}`}>
        {style.label}
      </span>

      <span className="text-xs text-zinc-500">Line {snapshot.line}</span>

      <code className={`flex-1 font-mono text-sm ${style.color} truncate`}>
        {snapshot.source_line}
      </code>

      <span className="text-xs text-zinc-600 shrink-0">
        Step {currentStep + 1} / {totalSteps}
      </span>
    </div>
  );
};

export default StepInfo;