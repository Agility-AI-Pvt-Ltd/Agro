import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const HomePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    api.get('/farmer/profile')
      .then((res) => {
        if (res.data?.success) setProfile(res.data.data);
      })
      .catch(() => {
        // api interceptor handles 401 → redirect
      });
  }, []);

  const userName = profile?.name || 'Farmer';
  const userLocation = profile?.address ||
    (profile?.locationLat && profile?.locationLng
      ? `${profile.locationLat.toFixed(2)}°, ${profile.locationLng.toFixed(2)}°`
      : '📍 Location not set');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/get-started');
  };

  const goTo = (path) => navigate(path);

  return (
    <div className="min-h-screen bg-white w-full text-gray-800 pb-20">

      {/* DESKTOP NAVBAR */}
      <div className="hidden lg:flex justify-between items-center lg:mx-16 px-20 py-4 bg-white">
        <div className="flex gap-8 text-gray-600">
          <span className="font-medium cursor-pointer" onClick={() => goTo('/home')}>Home</span>
          <span className="cursor-pointer hover:text-[#2D5A3D]" onClick={() => goTo('/under-development')}>Dashboard</span>
          <span className="cursor-pointer hover:text-[#2D5A3D]" onClick={() => goTo('/under-development')}>Plan</span>
          <span className="cursor-pointer hover:text-[#2D5A3D]" onClick={() => goTo('/chatbot')}>AI Assistant</span>
          <span className="cursor-pointer hover:text-[#2D5A3D]" onClick={() => goTo('/under-development')}>Trends</span>
        </div>
      </div>

      <div className="w-[100%] h-px bg-gray-100 mx-auto"></div>

      <div className="flex justify-between items-center lg:bg-gradient-to-b lg:from-[#FFFFFF] lg:to-[#F0F9F4] pr-7 lg:pr-20 w-full shadow-lg">
        {/* HEADER */}
        <div className="flex justify-between lg:px-20 lg:mx-14 px-7 py-4 items-start mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              👋 {getGreeting()}, {userName}
            </h1>
            <p className="text-gray-500 text-sm">
              Here&apos;s your farm update for today 🌾
            </p>
          </div>
        </div>

        <div className="flex items-center lg:pr-14 gap-3">
          <div className="hidden lg:block text-right">
            <p className="font-medium">{userName}</p>
            <p className="text-sm text-gray-500">📍 {userLocation}</p>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div
              className="w-10 h-10 bg-gradient-to-b from-[#2D7A3E] to-[#1D5227] rounded-full flex items-center justify-center text-white cursor-pointer"
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              <img src="/User.svg" alt="profile" className="w-6 h-6" />
            </div>
            {/* Logout dropdown — click-toggled */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-xl shadow-lg py-2 w-36 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-6">

        {/* MOBILE WEATHER CARD */}
        <div className="lg:hidden bg-gradient-to-b from-[#F0F9F4] via-[#FFFFFF] to-[#DAF1E4] p-4 rounded-2xl shadow-[-4px_6px_12px_rgba(0,0,0,0.12),4px_6px_12px_rgba(0,0,0,0.12)] mb-6">
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-b from-[#2D7A3E] to-[#1D5227] rounded-xl">
                <img src="/Cloud.svg" alt="cloud" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Weather</p>
                <p className="text-sm font-medium">Sunny, 32°C</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-b from-[#2D7A3E] to-[#1D5227] rounded-xl">
                <img src="/Sprout.svg" alt="sprout" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Crop Status</p>
                <p className="text-sm font-medium">Growing Well</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-[-4px_6px_12px_rgba(0,0,0,0.12),4px_6px_12px_rgba(0,0,0,0.12)] flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 bg-gradient-to-b from-[#2D7A3E] to-[#1D5227] rounded-full flex items-center justify-center text-white shrink-0">
                <img src="/CheckCircle2.svg" alt="check" className="w-8 h-8" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#7ED957] border-4 border-white rounded-full"></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 tracking-wide">FARM STATUS</p>
                <p className="text-[17px] font-medium text-gray-800">Safe for Irrigation Today</p>
              </div>
            </div>
            <div className="relative w-full">
              <div className="absolute inset-0 bg-[#F4A300] rounded-2xl"></div>
              <div className="relative flex items-center bg-[#FFF7ED] px-4 py-3 ml-1 rounded-2xl">
                <p className="text-gray-700 font-medium">Rain expected in 2 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="grid grid-cols-2 gap-4 lg:hidden mb-6">
          {/* Market Trends */}
          <div
            className="bg-white p-5 rounded-2xl shadow-[-4px_6px_12px_rgba(0,0,0,0.12),4px_6px_12px_rgba(0,0,0,0.12)] flex flex-col gap-3 cursor-pointer"
            onClick={() => goTo('/under-development')}
          >
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 bg-[#d9e6df] rounded-xl flex items-center justify-center">
                <img src="/Trend.svg" className="w-6 h-6" />
              </div>
              <p className="text-green-700 text-sm font-medium">↗ +2%</p>
            </div>
            <h3 className="text-lg font-semibold">Market Trends</h3>
            <div className="bg-[#d9e6df] rounded-xl p-3">
              <p className="text-sm mb-2">Soybean</p>
              <img src="/Graph.svg" className="w-full h-8 object-contain" />
            </div>
            <p className="text-sm text-gray-500">Best time to sell</p>
          </div>

          {/* Ask AI */}
          <div
            className="bg-white p-5 rounded-2xl shadow-[-4px_6px_12px_rgba(0,0,0,0.12),4px_6px_12px_rgba(0,0,0,0.12)] flex flex-col gap-3 cursor-pointer"
            onClick={() => goTo('/chatbot')}
          >
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 bg-[#d9e6df] rounded-xl flex items-center justify-center">
                <img src="/Chat.svg" className="w-6 h-6" />
              </div>
              <img src="/Mic.svg" className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Ask AI</h3>
            <div className="bg-[#d9e6df] rounded-xl p-3">
              <p className="text-sm italic">&quot;Ask about spray timing&quot;</p>
            </div>
            <p className="text-sm text-gray-500">Instant help</p>
          </div>

          {/* Plan */}
          <div
            className="bg-white p-5 rounded-2xl shadow-[-4px_6px_12px_rgba(0,0,0,0.12),4px_6px_12px_rgba(0,0,0,0.12)] flex flex-col gap-3 cursor-pointer"
            onClick={() => goTo('/under-development')}
          >
            <div className="w-12 h-12 bg-[#d9e6df] rounded-xl flex items-center justify-center">
              <img src="/Plan.svg" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold">Plan</h3>
            <p className="text-gray-400 text-3xl font-semibold mt-4">Coming Soon</p>
          </div>

          {/* Dashboard */}
          <div
            className="bg-white p-5 rounded-2xl shadow-[-4px_6px_12px_rgba(0,0,0,0.12),4px_6px_12px_rgba(0,0,0,0.12)] flex flex-col gap-3 cursor-pointer"
            onClick={() => goTo('/under-development')}
          >
            <div className="w-12 h-12 bg-[#d9e6df] rounded-xl flex items-center justify-center">
              <img src="/Dashboard.svg" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold">Dashboard</h3>
            <p className="text-gray-400 text-3xl font-semibold mt-4">Coming Soon</p>
          </div>
        </div>

        {/* DESKTOP GRID */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="col-span-2 space-y-6">
            <div className="lg:bg-gradient-to-b lg:from-[#F0F9F4] lg:via-[#FFFFFF] lg:to-[#DAF1E4] p-8 rounded-2xl shadow-md">
              <div className="grid grid-cols-2 gap-5 mb-6">
                <div className="bg-white lg:py-6 p-4 rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.18)] flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-b from-[#2D7A3E] to-[#1D5227] rounded-xl">
                    <img src="/Cloud.svg" alt="cloud" className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Weather</p>
                    <p className="font-bold">Sunny, 32°C</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.18)] flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-b from-[#2D7A3E] to-[#1D5227] rounded-xl">
                    <img src="/Sprout.svg" alt="sprout" className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Crop Status</p>
                    <p className="font-bold">Growing Well</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.18)] flex items-center gap-4">
                <div className="relative w-14 h-14 bg-gradient-to-b from-[#2D7A3E] to-[#1D5227] rounded-full flex items-center justify-center text-white">
                  <img src="/CheckCircle2.svg" alt="check" className="w-8 h-8" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#7ED957] border-4 border-white rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">FARM STATUS</p>
                  <h3 className="text-xl font-semibold">Safe for Irrigation Today</h3>
                  <div className="mt-2 relative w-fit">
                    <div className="absolute inset-0 bg-[#F4A300] rounded-2xl"></div>
                    <div className="relative flex items-center gap-3 bg-[#FFF7ED] px-6 pl-8 py-4 ml-1 rounded-2xl">
                      <span className="text-[#D97706] text-lg">
                        <img src="/CloudRain.svg" alt="info" className="w-6 h-6" />
                      </span>
                      <p className="text-gray-700 font-medium">Rain expected in 2 days – Plan accordingly</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 DAY PLAN */}
            <div className="bg-white p-8 py-10 rounded-2xl shadow-[-4px_6px_12px_rgba(0,0,0,0.12)]">
              <div className="flex flex-row mb-5 items-center gap-4">
                <div className="w-12 h-12 flex mb-8 items-center justify-center bg-gradient-to-b from-[#DAF1E4] to-[#F0F9F4] rounded-xl">
                  <img src="/Calendar.svg" alt="calendar" className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">3-Day Plan</h3>
                  <p className="text-sm text-gray-500 mb-6">Personalized farm action schedule</p>
                </div>
              </div>
              <div
                className="border-2 border-[#FFD230] shadow-[-4px_6px_12px_rgba(0,0,0,0.12)] bg-gradient-to-b from-[#FEF3C6] to-[#FFEDD4] rounded-xl px-6 py-3 mx-auto w-fit cursor-pointer"
                onClick={() => goTo('/under-development')}
              >
                🚧 Coming Soon
              </div>
            </div>

            {/* MARKET TRENDS */}
            <div className="bg-white p-6 rounded-2xl shadow-[-4px_6px_12px_rgba(0,0,0,0.12)]">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Market Trends</h3>
                  <p className="text-sm text-gray-500">Soybean • Next 7 Days</p>
                </div>
                <button
                  className="bg-gradient-to-b flex items-center gap-2 from-[#2D5A3D] to-[#1D3D28] text-white px-4 py-2 rounded-lg"
                  onClick={() => goTo('/under-development')}
                >
                  View Full Trends
                  <img src="ArrowRight.svg" alt="arrow" className="w-6 brightness-0 invert h-6" />
                </button>
              </div>
              <div className="bg-gradient-to-b from-[#F0F9F4] to-[#FFFFFF] rounded-xl p-4">
                <img src="/LineChart.svg" alt="line" className="w-full h-auto" />
                <div className="grid grid-cols-3 text-center mt-6">
                  <div>
                    <p className="text-sm text-gray-500">7-Day Trend</p>
                    <p className="font-bold text-green-600">+6.7%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Price</p>
                    <p className="font-bold">₹2,080</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Direction</p>
                    <p className="font-bold text-green-600">Rising</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] text-white p-8 w-[100%] rounded-2xl shadow">
              <h3 className="flex flex-row gap-2 text-lg font-semibold mb-2">
                <img src="/MessageCircle.svg" alt="message" className="w-6 h-6" />
                Ask Samarth AI
              </h3>
              <p className="text-sm text-green-100 mb-4">Ask about spray timing, price trends, or crop guidance</p>
              <div className="bg-white/10 flex flex-col items-center justify-center p-6 rounded-xl mb-4 text-center relative overflow-hidden">
                <img src="/Voice.svg" alt="voice" className="absolute w-60 h-60 opacity-80 -mt-10" />
                <p className="text-white/80 text-sm italic font-thin tracking-wide mt-20 relative z-10">
                  &quot;when is the best time to spray ?&quot;
                </p>
              </div>
              <button
                className="bg-white flex flex-row items-center justify-center gap-2 font-semibold text-[#2D5A3D] w-full py-4 rounded-lg"
                onClick={() => goTo('/chatbot')}
              >
                Open AI Assistant
                <img src="/ArrowRight.svg" alt="arrow" className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-white py-10 p-6 rounded-2xl shadow-[-4px_6px_12px_rgba(0,0,0,0.12),4px_6px_12px_rgba(0,0,0,0.12)]">
              <div className="flex flex-row mb-5 items-center gap-4">
                <div className="w-12 h-12 flex mb-8 items-center justify-center bg-gradient-to-b from-[#DAF1E4] to-[#F0F9F4] rounded-xl">
                  <img src="/BarChart3.svg" alt="chart" className="w-6 h-6" />
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Farm Dashboard</h3>
                  <p className="text-sm text-gray-500 mb-4">Soil, crop &amp; irrigation insights</p>
                </div>
              </div>
              <div
                className="border-2 border-[#FFD230] shadow-[-4px_6px_12px_rgba(0,0,0,0.12)] bg-gradient-to-b from-[#FEF3C6] to-[#FFEDD4] rounded-xl px-6 py-3 mx-auto w-fit cursor-pointer"
                onClick={() => goTo('/under-development')}
              >
                🚧 Coming Soon
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-[-4px_6px_12px_rgba(0,0,0,0.12),4px_6px_12px_rgba(0,0,0,0.12)]">
              <h3 className="font-semibold text-lg mb-6">Quick Stats</h3>
              <div className="space-y-6">
                {[
                  { icon: '/Droplets.svg', label: 'Soil Health', value: '78%', width: '78%' },
                  { icon: '/Sprout-green.svg', label: 'Crop Condition', value: 'Good', width: '90%' },
                  { icon: '/Activity.svg', label: 'Irrigation This Week', value: '2', width: '40%' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <img src={stat.icon} className="w-4 h-4" />
                        <span>{stat.label}</span>
                      </div>
                      <span className="text-[#2D5A3D] font-medium">{stat.value}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-gradient-to-b from-[#2D5A3D] to-[#4ADE80] rounded-full"
                        style={{ width: stat.width }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="w-full mt-6 bg-gradient-to-b from-[#DCE7DF] to-[#DAF1E4] text-[#2D5A3D] py-3 rounded-xl flex items-center justify-center gap-2 font-medium"
                onClick={() => goTo('/under-development')}
              >
                View All Stats
                <img src="/ArrowRight.svg" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ALERT */}
        <div className="mt-10 relative w-full lg:w-[66%]">
          <div className="absolute inset-0 bg-[#F4A300] rounded-2xl"></div>
          <div className="relative flex items-center justify-between bg-[#FFF7ED] px-4 lg:px-6 py-4 ml-1 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#F59E0B] rounded-xl flex items-center justify-center shrink-0">
                <img src="/CloudRain.svg" className="w-5 h-5 lg:w-6 brightness-0 invert lg:h-6" />
              </div>
              <div>
                <p className="text-gray-800 font-semibold text-sm lg:text-base">
                  ⚠ Heavy rain tomorrow – Prepare drainage
                </p>
                <p className="hidden lg:block text-xs lg:text-sm text-gray-500">
                  Ensure proper drainage channels are clear to prevent waterlogging
                </p>
              </div>
            </div>
            <button className="hidden lg:block bg-white px-3 lg:px-4 py-2 rounded-xl shadow-sm text-gray-700 text-xs lg:text-sm font-medium shrink-0">
              View Details
            </button>
          </div>
        </div>

      </div>

      {/* MOBILE NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 w-full bg-white flex justify-between items-center px-4 py-3 border-t border-gray-100">
        <div className="flex flex-col items-center justify-center bg-[#2D7A3E] text-white px-4 py-2 rounded-2xl shadow">
          <img src="/Home.svg" className="w-6 h-6 mb-1" />
          <span className="text-xs">Home</span>
        </div>
        <div className="flex flex-col items-center text-gray-500 cursor-pointer" onClick={() => goTo('/under-development')}>
          <img src="/Dash.svg" className="w-6 h-6 mb-1" />
          <span className="text-xs">Dashboard</span>
        </div>
        <div className="flex flex-col items-center text-gray-500 cursor-pointer" onClick={() => goTo('/chatbot')}>
          <img src="/Star.svg" className="w-6 h-6 mb-1" />
          <span className="text-xs">AI</span>
        </div>
        <div className="flex flex-col items-center text-gray-500 cursor-pointer" onClick={() => goTo('/under-development')}>
          <img src="/Plan-navigation.svg" className="w-6 h-6 mb-1" />
          <span className="text-xs">Plan</span>
        </div>
        <div className="flex flex-col items-center text-gray-500 cursor-pointer" onClick={() => goTo('/under-development')}>
          <img src="/Trend-navigation.svg" className="w-6 h-6 mb-1" />
          <span className="text-xs">Trends</span>
        </div>
      </div>

    </div>
  );
};

export default HomePage;