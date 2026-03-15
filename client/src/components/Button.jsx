import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary', // primary, secondary, outline
  isLoading = false,
  disabled = false,
  fullWidth = true,
  className = '',
  ...props
}) => {
  const baseStyle = "flex items-center justify-center font-semibold rounded-xl transition-colors duration-200 py-3 px-4";

  const variants = {
    primary: "bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] text-white hover:from-[#22482f] hover:to-[#183322] shadow-[#2D5A3D]/20 shadow-lg disabled:opacity-50",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100",
    outline: "border-2 border-[#2D5A3D] text-[#2D5A3D] hover:bg-[#2D5A3D]/5 disabled:border-[#2D5A3D]/50 disabled:text-[#2D5A3D]/50"
  };

  const classes = `
    ${baseStyle}
    ${variants[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'cursor-not-allowed opacity-70' : ''}
    ${className}
  `;

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin mr-2 h-5 w-5" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
