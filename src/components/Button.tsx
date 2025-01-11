type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
};

export function Button({
  children,
  loading,
  variant = "primary",
  icon,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const variantClasses = {
    // Primary inverts colors in both modes
    primary:
      "bg-[#000000] text-[#ffffff] hover:bg-[#000000]/90 dark:bg-[#ffffff] dark:text-[#000000] dark:hover:bg-[#ffffff]/90",
    // Secondary uses opacity that works in both modes
    secondary:
      "bg-[#000000]/[0.06] hover:bg-[#000000]/[0.08] dark:bg-[#ffffff]/[0.06] dark:hover:bg-[#ffffff]/[0.08]",
    // Danger needs specific colors for both modes
    danger:
      "border text-[#F24822] border-[#F24822]/20 hover:bg-[#F24822]/10 dark:text-[#FF8A75] dark:border-[#FF8A75]/20 dark:hover:bg-[#FF8A75]/10",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        px-3 py-1.5 rounded-sm text-xs
        transition-colors
        ${variantClasses[variant]}
        ${disabled || loading ? "opacity-30" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
