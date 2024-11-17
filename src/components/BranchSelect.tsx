type BranchSelectProps = {
  branches: string[];
  selectedBranch: string;
  onChange: (branch: string) => void;
  loading?: boolean;
  error?: string;
};

export function BranchSelect({
  branches,
  selectedBranch,
  onChange,
  loading,
  error,
}: BranchSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700 dark:text-white">
        BRANCH
      </label>
      <div className="relative">
        <select
          value={selectedBranch}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
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
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
