type TabButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-xs
        ${active ? "opacity-100" : "opacity-60 hover:opacity-100"}
        transition-opacity rounded-sm
      `}
    >
      {label}
    </button>
  );
}
