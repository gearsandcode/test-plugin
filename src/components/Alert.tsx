type AlertType = "success" | "error" | "info";

type AlertProps = {
  type: AlertType;
  message: string;
  onDismiss?: () => void;
};

export function Alert({ type, message, onDismiss }: AlertProps) {
  const styles: Record<AlertType, string> = {
    success: "bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100",
    error: "bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100",
    info: "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  };

  return (
    <div className={`p-4 rounded-sm ${styles[type]} mb-4`}>
      <div className="flex justify-between items-center">
        <p className="text-sm">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-sm font-medium opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
