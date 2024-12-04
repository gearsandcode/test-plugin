interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`
        px-2 py-1.5 text-xs rounded-sm
        bg-transparent
        border border-black/10 dark:border-white/10
        hover:border-black/20 dark:hover:border-white/20
        ${className}
      `}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
