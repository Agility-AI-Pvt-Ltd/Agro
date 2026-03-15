import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && <label className="text-gray-700 text-sm font-semibold mb-2">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all
          ${error ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#2D5A3D] focus:ring-1 focus:ring-[#2D5A3D]'}
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
