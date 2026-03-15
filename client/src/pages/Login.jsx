import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Input from '../components/Input';
import OTPInput from '../components/OTPInput';
import api from '../services/api';
import logo from '../assets/Icon.svg';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const isPhoneValid = phone.length === 10;

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!isPhoneValid) return;

    setLoadingSendOtp(true);
    try {
      await api.post('/auth/login/send-otp', { phone });
      toast.success('OTP sent to your phone');
      setStep(2);
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || 'Failed to send OTP';
      if (status === 404) {
        toast.error('No account found. Please register first.');
      } else if (status === 403) {
        toast.error('Your account has been deactivated.');
      } else if (error.response?.data?.code === 'OTP_COOLDOWN') {
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoadingSendOtp(false);
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;

    setLoadingVerify(true);
    try {
      const res = await api.post('/auth/login/verify', { phone, otp });

      if (res.data?.success && res.data?.data) {
        const { accessToken, refreshToken, userId } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', userId);
      }

      toast.success('Login successful!');
      navigate('/home');
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid OTP';
      toast.error(msg);
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F0F9F4] w-full items-center justify-center">
      {/* DESKTOP SIDE PANEL */}
      <div className="hidden lg:flex w-1/2 bg-[#2D5A3D] text-white flex-col justify-center items-center p-12 h-screen">
        <img src={logo} alt="Agro Logo" className="w-24 mb-6 relative z-10" />
        <h1 className="text-4xl font-extrabold mb-4 z-10 text-center">
          {t('Welcome Back')}
        </h1>
        <p className="text-xl text-center text-white/80 max-w-md z-10">
          {t('appIntro')}
        </p>
      </div>

      {/* FORM AREA */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 min-h-screen">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl flex flex-col">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Logo" className="w-16 mb-4 lg:hidden" />
            <h2 className="text-3xl font-bold text-gray-800 text-center tracking-tight">
              {t('login')}
            </h2>
            <p className="text-gray-500 text-sm mt-2 text-center">
              {t('Please enter your details to continue')}
            </p>
          </div>

          <div className="flex flex-col gap-5 w-full">
            {step === 1 && (
              <>
                <Input
                  label={t('Phone Number')}
                  placeholder="e.g. 9876543210"
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
                <div className="mt-4">
                  <Button
                    onClick={handleSendOtp}
                    disabled={!isPhoneValid}
                    isLoading={loadingSendOtp}
                  >
                    {t('Send OTP')}
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-6 font-semibold text-center mt-2">
                  {t('Enter OTP')} sent to +91 {phone}
                </p>

                <OTPInput value={otp} onChange={setOtp} length={6} />

                <div className="mt-8 w-full">
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={otp.length < 6}
                    isLoading={loadingVerify}
                  >
                    {t('Verify OTP')}
                  </Button>
                </div>

                <button
                  className="mt-6 text-[#2D5A3D] text-sm font-semibold hover:underline"
                  onClick={() => { setStep(1); setOtp(''); }}
                >
                  Change Phone Number
                </button>
              </div>
            )}
          </div>

          {step === 1 && (
            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 font-medium">
                New user?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-[#2D5A3D] font-bold hover:underline"
                >
                  {t('register')}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
