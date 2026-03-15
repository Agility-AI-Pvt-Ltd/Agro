import { useNavigate } from 'react-router-dom';

const UnderDevelopment = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F9F4] via-white to-[#E8F5E9] flex flex-col items-center justify-center px-6">
      {/* Icon */}
      <div className="w-24 h-24 bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] rounded-3xl flex items-center justify-center mb-8 shadow-lg">
        <span className="text-5xl">🚧</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-3 text-center">Under Development</h1>
      <p className="text-gray-500 text-center max-w-sm mb-8 leading-relaxed">
        This feature is currently under development. We&apos;re working hard to bring it to you soon!
      </p>

      {/* Progress indicator */}
      <div className="bg-white rounded-2xl p-6 shadow-md max-w-sm w-full mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Development Progress</p>
          <span className="text-sm font-bold text-[#2D5A3D]">Coming Soon</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#2D5A3D] to-[#7ED957] rounded-full w-[35%] animate-pulse"></div>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Stay tuned for updates ✨
        </p>
      </div>

      <button
        onClick={() => navigate('/home')}
        className="bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
      >
        ← Back to Home
      </button>
    </div>
  );
};

export default UnderDevelopment;
