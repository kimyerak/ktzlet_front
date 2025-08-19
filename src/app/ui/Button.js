export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  type = 'button'
}) {
  const baseClasses = "font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-white/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const variants = {
    primary: "bg-gradient-to-r from-pink-400 to-purple-500 text-white",
    secondary: "bg-gradient-to-r from-blue-400 to-indigo-500 text-white",
    danger: "bg-red-400 hover:bg-red-500 text-white",
    outline: "bg-transparent border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
  };
  
  const sizes = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-xl"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
} 