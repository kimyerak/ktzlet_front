export default function Input({
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  label = '',
  required = false,
  className = '',
  ...props
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-500 ${className}`}
        {...props}
      />
    </div>
  );
} 