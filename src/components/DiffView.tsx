import { useState } from "react";
import type { DiffResult } from "../types";

interface DiffViewProps {
  diffs: DiffResult[];
  loading?: boolean;
  baseUrl: string;
  content: string;
}

export function DiffView({ content, diffs, loading, baseUrl }: DiffViewProps) {
  const [selectedFile, setSelectedFile] = useState<string>(
    diffs[0]?.path || ""
  );
  const currentDiff = diffs.find((d) => d.path === selectedFile);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-300 border-t-stone-600" />
      </div>
    );
  }

  if (diffs.length === 0) {
    return (
      <div className="p-4 text-xs text-center opacity-60">No changes found</div>
    );
  }

  return (
    <div className="border rounded-sm">
      {/* ...existing header... */}
      <div className="overflow-x-auto">
        {content ? (
          <pre className="p-3 text-xs font-mono leading-5">
            {content.split("\n").map((line, i) => {
              let className = "";
              if (line.startsWith("- ")) {
                className =
                  "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200";
              } else if (line.startsWith("+ ")) {
                className =
                  "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200";
              } else if (line.startsWith("@@ ")) {
                className = "text-gray-500 dark:text-gray-400";
              }

              return (
                <div key={i} className={className}>
                  {line}
                </div>
              );
            })}
          </pre>
        ) : (
          <div className="p-4 text-xs text-center opacity-60">
            No changes detected
          </div>
        )}
      </div>
    </div>
  );
}
