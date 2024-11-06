interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({
  message = 'Initializing GitHub connection...',
}: LoadingSpinnerProps) {
  return (
    <div className="w-full min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">{message}</p>
      </div>
    </div>
  );
}
