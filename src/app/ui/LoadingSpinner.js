export default function LoadingSpinner({ message = "로딩 중... 💕" }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-2xl font-bold text-pink-500">{message}</div>
    </div>
  );
} 