import { useState } from "react";
import { Copy } from "@phosphor-icons/react";

interface VariableCardProps {
  variable: {
    name: string;
    value: string;
    description?: string;
    collection?: string;
  };
}

export function VariablesCard({ variable }: VariableCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(variable.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-sm border border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
      <div
        className="w-12 h-12 rounded-sm shadow-sm flex-shrink-0"
        style={{ backgroundColor: variable.value }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-medium text-sm truncate">{variable.name}</p>
            {variable.collection && (
              <p className="text-xs opacity-50 mt-0.5">{variable.collection}</p>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title={copied ? "Copied!" : "Copy value"}
          >
            <Copy size={14} weight={copied ? "fill" : "regular"} />
          </button>
        </div>
        <p className="text-xs opacity-60 mt-1.5 font-mono">{variable.value}</p>
        {variable.description && (
          <p className="text-xs mt-1.5 opacity-70 line-clamp-2">
            {variable.description}
          </p>
        )}
      </div>
    </div>
  );
}
