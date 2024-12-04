import { GitBranch } from "@phosphor-icons/react";
import type { BranchSelectionMode } from "../types";

interface BranchSelectorProps {
  label: string;
  mode?: BranchSelectionMode;
  branches: string[]; // Ensure we're expecting string[] not object[]
  selectedBranch: string;
  onBranchChange: (value: string) => void;
  onModeChange?: (mode: BranchSelectionMode) => void;
  allowNew?: boolean;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
}

export function BranchSelector({
  label,
  mode = "existing",
  branches,
  selectedBranch,
  onBranchChange,
  onModeChange,
  allowNew = false,
  loading,
  error,
  disabled,
}: BranchSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between min-h-[24px] mb-1.5">
        <label className="text-xs font-medium flex items-center gap-1">
          <GitBranch size={12} />
          {label}
        </label>
        {allowNew && !disabled && onModeChange && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onModeChange("new")}
              className={`text-xs px-2 py-1 rounded-sm transition-colors ${
                mode === "new"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              New
            </button>
            <button
              type="button"
              onClick={() => onModeChange("existing")}
              className={`text-xs px-2 py-1 rounded-sm transition-colors ${
                mode === "existing"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              Existing
            </button>
          </div>
        )}
      </div>

      {allowNew && mode === "new" ? (
        <input
          type="text"
          value={selectedBranch}
          onChange={(e) => onBranchChange(e.target.value)}
          className={`
        w-full px-2 py-1.5 text-xs rounded-sm
        ${error ? "border-red-500" : ""}
        ${disabled ? "opacity-50" : ""}
        `}
          placeholder="feature/design-tokens"
          disabled={disabled}
          required
        />
      ) : (
        <select
          value={selectedBranch}
          onChange={(e) => onBranchChange(e.target.value)}
          disabled={loading || disabled}
          className={`
        w-full px-2 py-1.5 text-xs
        rounded-sm
        disabled:opacity-50
        ${error ? "border-red-500" : ""}
        `}
        >
          {branches.length === 0 && (
            <option value="">No branches available</option>
          )}
          {branches.map((branchName) => (
            <option key={branchName} value={branchName}>
              {branchName}
            </option>
          ))}
        </select>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
