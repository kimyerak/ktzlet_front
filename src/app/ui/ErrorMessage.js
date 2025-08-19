export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null;
  
  return (
    <div className={`text-red-500 text-sm text-center bg-red-50 p-3 rounded-2xl ${className}`}>
      ❌ {message}
    </div>
  );
} 