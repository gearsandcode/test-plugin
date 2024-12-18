type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700 dark:text-white">
        {label}
      </label>
      <input
        className={`
          w-full px-2 py-1.5 text-xs
          rounded-sm
          ${error ? "border-red-500" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
