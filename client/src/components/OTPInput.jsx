import { useRef, useState } from 'react';

/**
 * OTPInput — 6-box digit entry with auto-focus, backspace navigation, and paste support.
 *
 * Props:
 *   length   {number}   Number of digits (default 6)
 *   onChange {function} Called with the joined string on every change e.g. "1234"
 *
 * NOTE: This component is fully self-contained. The parent should only read the
 * joined value from onChange (a plain string). Do NOT pass a controlled `value`
 * prop that mirrors the joined string back in — it will cause a re-sync loop that
 * resets the internal array to length 1 and breaks the other boxes.
 */
const OTPInput = ({ length = 6, onChange }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const text = e.target.value;
    if (!/^[0-9]*$/.test(text)) return;   // digits only

    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);        // keep only the last typed digit
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Auto-advance to next box
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Backspace on empty box → move focus back
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text/plain')
      .replace(/[^0-9]/g, '')
      .slice(0, length);

    if (!pasted) return;

    const newOtp = Array(length).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Focus last filled box (or the box after)
    const nextFocus = Math.min(pasted.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  return (
    <div className="flex gap-1.5 sm:gap-2 justify-between w-full">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="flex-1 min-w-0 aspect-square max-w-[3rem] text-center text-lg sm:text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2D5A3D] focus:ring-1 focus:ring-[#2D5A3D] transition-all"
        />
      ))}
    </div>
  );
};

export default OTPInput;
