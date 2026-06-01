import React, { useEffect, useRef } from "react";
import { Snapshot } from "../../types/execution";

interface Props {
  snapshot: Snapshot | null;
}

const OutputConsole: React.FC<Props> = ({ snapshot }) => {
  const ref = useRef<HTMLPreElement>(null);

  const output = snapshot?.stdout ?? "";
  const hasException = snapshot?.exception;

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Output</span>
      </div>

      <pre
        ref={ref}
        className="flex-1 overflow-auto p-3 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap break-all"
      >
        {output || (
          <span className="text-zinc-600">— no output yet —</span>
        )}

        {hasException && (
          <span className="block mt-2 text-red-400">
            {hasException.type}: {hasException.message}
            {hasException.line && ` (line ${hasException.line})`}
          </span>
        )}
      </pre>
    </div>
  );
};

export default OutputConsole;