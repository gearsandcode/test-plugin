import React, { useState } from "react";
import { PaintBrush, ArrowSquareOut } from "@phosphor-icons/react";
import { VariablesCard } from "./VariablesCard";

interface VariablesDisplayProps {
  onCreatePR: () => void;
  variables: Array<{
    collection: string;
    variables: Array<{
      name: string;
      value: string;
      description?: string;
    }>;
  }>;
  loading?: boolean;
}

export function VariablesDisplay({
  onCreatePR,
  variables,
  loading,
}: VariablesDisplayProps) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    variables[0]?.collection || null
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">
          <PaintBrush size={24} className="opacity-50" />
        </div>
      </div>
    );
  }

  const currentVariables =
    variables.find((v) => v.collection === selectedCollection)?.variables || [];

  return (
    <div className="p-4 space-y-6">
      {/* Header with PR button */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Design Variables</h2>
        <button
          onClick={onCreatePR}
          className="inline-flex items-center px-3 py-1.5 text-xs bg-black text-white dark:bg-white dark:text-black rounded-sm hover:opacity-90 transition-opacity"
        >
          <ArrowSquareOut size={14} className="mr-1.5" />
          Create PR
        </button>
      </div>

      {/* Collection tabs */}
      <div className="flex space-x-2 border-b border-black/10 dark:border-white/10">
        {variables.map(({ collection }) => (
          <button
            key={collection}
            onClick={() => setSelectedCollection(collection)}
            className={`
              px-3 py-1.5 text-xs transition-all
              ${
                selectedCollection === collection
                  ? "border-b-2 border-black dark:border-white -mb-px"
                  : "opacity-60 hover:opacity-80"
              }
            `}
          >
            {collection}
          </button>
        ))}
      </div>

      {/* Variables grid */}
      <div className="grid gap-2">
        {currentVariables.map((variable, i) => (
          <VariablesCard
            key={`${variable.name}-${i}`}
            variable={{
              ...variable,
              collection: selectedCollection || undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
