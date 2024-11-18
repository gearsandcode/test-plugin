interface BranchSelectProps {
  id?: string;
  label?: string;
  branches: string[];
  selectedBranch: string;
  onChange: (branch: string) => void;
  loading?: boolean;
  error?: string;
}

export function BranchSelect({
  id,
  label,
  branches,
  selectedBranch,
  onChange,
  loading,
  error,
}: BranchSelectProps) {
  const selectId =
    id || `branch-select-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-gray-700 dark:text-white"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={selectedBranch}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          aria-label={label || "Branch selection"}
          className={`
            w-full px-2 py-1.5 text-xs
            rounded-sm
            disabled:opacity-50
            ${error ? "border-red-500" : ""}
          `}
        >
          {!selectedBranch && branches.length === 0 && (
            <option value="">No branches available</option>
          )}
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
