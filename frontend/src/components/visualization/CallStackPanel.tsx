import React from "react";
import { Snapshot } from "../../types/execution";
import { formatValue } from "../../utils/formatValue";

interface Props {
  snapshot: Snapshot | null;
}

const CallStackPanel: React.FC<Props> = ({ snapshot }) => {
  if (!snapshot || snapshot.stack.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Call Stack</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">
          — module scope —
        </div>
      </div>
    );
  }

  // Display stack with the most recent call on top
  const frames = [...snapshot.stack].reverse();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
        <div className="w-2 h-2 rounded-full bg-sky-400" />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Call Stack</span>
        <span className="ml-auto text-xs text-zinc-500">{snapshot.stack.length} frame{snapshot.stack.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-2">
        {frames.map((frame, i) => (
          <div
            key={i}
            className={`rounded-lg border transition-all ${
              i === 0
                ? "border-sky-500/40 bg-sky-950/30"
                : "border-zinc-700/50 bg-zinc-800/30 opacity-70"
            }`}
          >
            {/* Frame header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700/50">
              <span
                className={`text-xs font-semibold font-mono ${
                  i === 0 ? "text-sky-300" : "text-zinc-400"
                }`}
              >
                {frame.function}()
              </span>
              <span className="ml-auto text-[10px] text-zinc-600">line {frame.line}</span>
              {i === 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  active
                </span>
              )}
            </div>

            {/* Frame locals */}
            {Object.keys(frame.locals).length > 0 ? (
              <div className="p-2 space-y-1">
                {Object.entries(frame.locals).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs font-mono">
                    <span className="text-zinc-400 shrink-0">{k}</span>
                    <span className="text-zinc-500">=</span>
                    <span className="text-zinc-300 break-all">{formatValue(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-1.5 text-[10px] text-zinc-600">no locals</div>
            )}
          </div>
        ))}

        {/* Module / global frame always at bottom */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2">
          <span className="text-xs text-zinc-600 font-mono">&lt;module&gt;</span>
        </div>
      </div>
    </div>
  );
};

export default CallStackPanel;