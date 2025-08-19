export default function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'p-8'
}) {
  const baseClasses = "rounded-3xl shadow-lg border";
  
  const variants = {
    default: "bg-white/80 backdrop-blur-sm border-pink-200",
    glass: "bg-white/60 backdrop-blur-md border-white/30",
    solid: "bg-white border-gray-200"
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${padding} ${className}`}>
      {children}
    </div>
  );
} 