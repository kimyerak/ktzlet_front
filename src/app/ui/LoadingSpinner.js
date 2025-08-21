export default function LoadingSpinner({ 
  message = "로딩 중... 💕", 
  size = "default", 
  fullScreen = false 
}) {
  const sizeClasses = {
    small: "text-sm",
    default: "text-base",
    large: "text-lg"
  };

  const spinnerSizes = {
    small: "h-3 w-3",
    default: "h-4 w-4",
    large: "h-6 w-6"
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full ${spinnerSizes[size]} border-b-2 border-pink-500 mx-auto mb-4`}></div>
          <div className={`font-bold text-pink-500 ${size === 'large' ? 'text-2xl' : 'text-xl'}`}>
            {message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <div className={`animate-spin rounded-full ${spinnerSizes[size]} border-b-2 border-pink-500`}></div>
      <span className={`font-medium text-pink-500 ${sizeClasses[size]}`}>{message}</span>
    </div>
  );
} 